const express = require('express');
const router = express.Router();
const { getStatus, createCheckoutSession, handleWebhook } = require('../controllers/subscriptionController');
const auth = require('../middleware/auth');

// Webhook uses raw body — registered in index.js before json middleware
router.post('/webhook', handleWebhook);

// Protected routes
router.get('/subscription-status', auth, getStatus);
router.post('/create-checkout-session', auth, createCheckoutSession);

module.exports = router;
