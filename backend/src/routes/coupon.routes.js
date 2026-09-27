'use strict';

const express = require('express');
const router = express.Router();
const couponController = require('../controllers/coupon.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const validateObjectId = require('../middleware/validateObjectId');

// Validate coupon for checkout (authenticated or guest checkout)
router.post('/validate', couponController.validateCoupon);

// Admin-only coupon management
router.get('/admin', auth, admin, couponController.getAllCoupons);
router.post('/admin', auth, admin, couponController.createCoupon);
router.delete('/admin/:id', auth, admin, validateObjectId(), couponController.deleteCoupon);
router.patch('/admin/:id/toggle', auth, admin, validateObjectId(), couponController.toggleCoupon);

module.exports = router;
