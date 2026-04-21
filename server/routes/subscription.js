const express = require('express');
const router = express.Router();
const { getStatus, createCheckoutSession, handleWebhook } = require('../controllers/subscriptionController');

// Webhook uses raw body — registered in index.js before json middleware
router.post('/webhook', handleWebhook);

// Protected routes
router.get('/subscription-status', getStatus);
router.post('/create-checkout-session', createCheckoutSession);

module.exports = router;
