'use strict';

const Joi = require('joi');

const shippingAddress = Joi.object({
  fullName: Joi.string().trim().min(2).max(100).required(),
  phone: Joi.string()
    .trim()
    .pattern(/^[6-9]\d{9}$/)
    .required()
    .messages({ 'string.pattern.base': 'Please provide a valid 10-digit Indian mobile number' }),
  addressLine1: Joi.string().trim().min(5).max(200).required(),
  addressLine2: Joi.string().trim().max(200).allow('').default(''),
  city: Joi.string().trim().min(2).max(100).required(),
  state: Joi.string().trim().min(2).max(100).required(),
  pincode: Joi.string()
    .trim()
    .pattern(/^\d{6}$/)
    .required()
    .messages({ 'string.pattern.base': 'Please provide a valid 6-digit pincode' }),
  country: Joi.string().trim().default('India'),
});

const createOrder = Joi.object({
  shippingAddress: shippingAddress.required(),
  idempotencyKey: Joi.string().uuid().required().messages({
    'string.guid': 'idempotencyKey must be a valid UUID v4',
    'any.required': 'idempotencyKey is required to prevent duplicate orders',
  }),
  couponCode: Joi.string().trim().max(20).allow('', null),
});

const verifyPayment = Joi.object({
  razorpay_order_id: Joi.string().required(),
  razorpay_payment_id: Joi.string().required(),
  razorpay_signature: Joi.string().required(),
});

const updateOrderStatus = Joi.object({
  orderStatus: Joi.string()
    .valid('confirmed', 'shipped', 'delivered', 'cancelled')
    .required(),
});

const orderQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(10),
  paymentStatus: Joi.string().valid('pending', 'paid', 'failed'),
  orderStatus: Joi.string().valid('created', 'confirmed', 'shipped', 'delivered', 'cancelled'),
});

module.exports = { createOrder, verifyPayment, updateOrderStatus, orderQuery };
