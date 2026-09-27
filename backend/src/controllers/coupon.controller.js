'use strict';

const Coupon = require('../models/Coupon');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * POST /api/coupons/validate
 * Public / authenticated – Validate coupon code for checkout
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, amount } = req.body;

  if (!code) {
    throw new AppError('Coupon code is required.', 400, 'COUPON_REQUIRED');
  }

  const subtotal = Number(amount) || 0;
  const coupon = await Coupon.findOne({
    code: code.trim().toUpperCase(),
    isActive: true,
  });

  if (!coupon) {
    throw new AppError('Invalid or expired coupon code.', 404, 'INVALID_COUPON');
  }

  if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
    throw new AppError('This coupon has expired.', 400, 'COUPON_EXPIRED');
  }

  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    throw new AppError('This coupon has reached its maximum usage limit.', 400, 'COUPON_LIMIT_REACHED');
  }

  if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
    throw new AppError(
      `Minimum order of ₹${coupon.minOrderAmount} required for coupon ${coupon.code}.`,
      400,
      'COUPON_MIN_NOT_MET'
    );
  }

  let discountAmount = 0;
  if (coupon.discountType === 'percentage') {
    discountAmount = Math.round(subtotal * (coupon.discountValue / 100) * 100) / 100;
    if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
      discountAmount = coupon.maxDiscount;
    }
  } else if (coupon.discountType === 'flat') {
    discountAmount = Math.min(coupon.discountValue, subtotal);
  }

  const finalAmount = Math.max(1, Math.round((subtotal - discountAmount) * 100) / 100);

  res.status(200).json({
    success: true,
    data: {
      valid: true,
      code: coupon.code,
      discountType: coupon.discountType,
      discountValue: coupon.discountValue,
      discountAmount,
      finalAmount,
    },
  });
});

/**
 * GET /api/coupons/admin (Admin only)
 */
const getAllCoupons = asyncHandler(async (_req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.status(200).json({
    success: true,
    data: { coupons },
  });
});

/**
 * POST /api/coupons/admin (Admin only)
 */
const createCoupon = asyncHandler(async (req, res) => {
  const { code, discountType, discountValue, minOrderAmount, maxDiscount, expiresAt, usageLimit } = req.body;

  const existing = await Coupon.findOne({ code: code.trim().toUpperCase() });
  if (existing) {
    throw new AppError('A coupon with this code already exists.', 400, 'COUPON_EXISTS');
  }

  const coupon = await Coupon.create({
    code: code.trim().toUpperCase(),
    discountType,
    discountValue: Number(discountValue),
    minOrderAmount: Number(minOrderAmount) || 0,
    maxDiscount: maxDiscount ? Number(maxDiscount) : null,
    expiresAt: expiresAt ? new Date(expiresAt) : null,
    usageLimit: usageLimit ? Number(usageLimit) : null,
    isActive: true,
  });

  res.status(201).json({
    success: true,
    message: 'Coupon created successfully.',
    data: { coupon },
  });
});

/**
 * DELETE /api/coupons/admin/:id (Admin only)
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findByIdAndDelete(req.params.id);
  if (!coupon) {
    throw new AppError('Coupon not found.', 404, 'COUPON_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    message: 'Coupon deleted successfully.',
  });
});

/**
 * PATCH /api/coupons/admin/:id/toggle (Admin only)
 */
const toggleCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  if (!coupon) {
    throw new AppError('Coupon not found.', 404, 'COUPON_NOT_FOUND');
  }

  coupon.isActive = !coupon.isActive;
  await coupon.save();

  res.status(200).json({
    success: true,
    message: `Coupon ${coupon.isActive ? 'activated' : 'deactivated'}.`,
    data: { coupon },
  });
});

module.exports = {
  validateCoupon,
  getAllCoupons,
  createCoupon,
  deleteCoupon,
  toggleCoupon,
};
