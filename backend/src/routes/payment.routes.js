'use strict';

const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');
const { validate, validateQuery } = require('../middleware/validate');
const { paymentLimiter } = require('../middleware/rateLimiter');
const paymentValidator = require('../validators/payment.validator');

// Create Razorpay order (user must be authenticated)
router.post(
  '/create-order',
  auth,
  paymentLimiter,
  validate(paymentValidator.createOrder),
  paymentController.createOrder
);

// Verify payment (user must be authenticated)
router.post(
  '/verify',
  auth,
  paymentLimiter,
  validate(paymentValidator.verifyPayment),
  paymentController.verifyPayment
);

// Razorpay webhook – NO auth middleware (uses webhook signature)
// NOTE: This route needs raw body for signature verification.
// The raw body middleware is applied in app.js specifically for this route.
router.post('/webhook', paymentController.handleWebhook);

// User order routes
router.get(
  '/orders/my',
  auth,
  validateQuery(paymentValidator.orderQuery),
  paymentController.getMyOrders
);

router.get('/orders/my/:id', auth, paymentController.getMyOrder);

module.exports = router;
