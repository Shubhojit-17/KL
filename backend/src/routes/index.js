'use strict';

const express = require('express');
const router = express.Router();

const authRoutes = require('./auth.routes');
const productRoutes = require('./product.routes');
const cartRoutes = require('./cart.routes');
const paymentRoutes = require('./payment.routes');
const adminRoutes = require('./admin.routes');
const userRoutes = require('./user.routes');
const contactRoutes = require('./contact.routes');
const couponRoutes = require('./coupon.routes');
const uploadRoutes = require('./upload.routes');

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/cart', cartRoutes);
router.use('/payment', paymentRoutes);
router.use('/admin', adminRoutes);
router.use('/user', userRoutes);
router.use('/contact', contactRoutes);
router.use('/coupons', couponRoutes);
router.use('/upload', uploadRoutes);

// Health check
router.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

module.exports = router;
