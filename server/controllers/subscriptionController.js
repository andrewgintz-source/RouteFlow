const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const User = require('../models/User');

// GET /api/subscription-status
exports.getStatus = async (req, res) => {
  const sub = req.user.subscription;
  const now = new Date();

  let hasAccess = false;
  if (sub.status === 'active') hasAccess = true;
  if (sub.status === 'trialing' && sub.trial_end_date && sub.trial_end_date > now) hasAccess = true;

  res.json({
    status: sub.status,
    plan: sub.plan,
    trial_end_date: sub.trial_end_date,
    has_access: hasAccess
  });
};

// POST /api/create-checkout-session
exports.createCheckoutSession = async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(400).json({ error: 'Invalid plan selected.' });
    }

    // Create or reuse Stripe customer
    let customerId = req.user.subscription.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: req.user.email,
        name: req.user.name,
        metadata: { userId: req.user._id.toString() }
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(req.user._id, {
        'subscription.stripe_customer_id': customerId
      });
    }

    const session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      subscription_data: {
        trial_period_days: 7,
        metadata: { userId: req.user._id.toString(), plan }
      },
      success_url: `${process.env.CLIENT_URL}?success=true`,
      cancel_url: `${process.env.CLIENT_URL}?canceled=true`,
      metadata: { userId: req.user._id.toString(), plan }
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout session error:', err);
    res.status(500).json({ error: 'Could not create checkout session.' });
  }
};

// POST /api/webhook  (raw body — already handled in index.js)
exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {

      case 'checkout.session.completed': {
        const session = event.data.object;
        const userId = session.metadata?.userId;
        if (!userId) break;

        // Retrieve the subscription to get trial_end
        const subscription = await stripe.subscriptions.retrieve(session.subscription);
        const trialEnd = subscription.trial_end
          ? new Date(subscription.trial_end * 1000)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

        const plan = session.metadata?.plan || 'monthly';

        await User.findByIdAndUpdate(userId, {
          'subscription.status': 'trialing',
          'subscription.plan': plan,
          'subscription.trial_end_date': trialEnd,
          'subscription.stripe_subscription_id': session.subscription
        });
        console.log(`✅  Trial started for user ${userId}`);
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object;
        const subId = invoice.subscription;
        const subscription = await stripe.subscriptions.retrieve(subId);
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, {
          'subscription.status': 'active'
        });
        console.log(`✅  Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const userId = subscription.metadata?.userId;
        if (!userId) break;

        await User.findByIdAndUpdate(userId, {
          'subscription.status': 'canceled',
          'subscription.stripe_subscription_id': null
        });
        console.log(`❌  Subscription canceled for user ${userId}`);
        break;
      }

      default:
        // Unhandled event — ignore
        break;
    }
  } catch (err) {
    console.error('Webhook handler error:', err);
  }

  res.json({ received: true });
};
