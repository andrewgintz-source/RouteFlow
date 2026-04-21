require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();

// ── Stripe webhook needs raw body — register BEFORE json middleware ──
const subscriptionRoutes = require('./routes/subscription');
app.use('/api/webhook', express.raw({ type: 'application/json' }), subscriptionRoutes);

// ── Standard middleware ──
app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }));
app.use(express.json());

// ── Routes ──
const authRoutes = require('./routes/auth');
app.use('/api', authRoutes);
app.use('/api', subscriptionRoutes);

// ── MongoDB ──
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅  MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ── Start ──
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`🚀  Server running on port ${PORT}`));
