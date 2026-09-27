'use strict';

const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    name: {
      type: String,
      required: true, // snapshot at order time
    },
    price: {
      type: Number,
      required: true, // snapshot at order time
    },
    quantity: {
      type: Number,
      required: true,
      min: 1,
    },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: {
      type: [orderItemSchema],
      required: true,
      validate: {
        validator: (arr) => arr.length > 0,
        message: 'Order must have at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: true,
      min: [0.01, 'Total must be positive'],
    },
    razorpay_order_id: {
      type: String,
      required: true,
      unique: true,
    },
    razorpay_payment_id: {
      type: String,
      default: null,
    },
    razorpay_signature: {
      type: String,
      default: null,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid', 'failed'],
      default: 'pending',
    },
    orderStatus: {
      type: String,
      enum: ['created', 'confirmed', 'shipped', 'delivered', 'cancelled'],
      default: 'created',
    },
    shippingAddress: {
      fullName: { type: String, required: true, trim: true },
      phone: { type: String, required: true, trim: true },
      addressLine1: { type: String, required: true, trim: true },
      addressLine2: { type: String, trim: true, default: '' },
      city: { type: String, required: true, trim: true },
      state: { type: String, required: true, trim: true },
      pincode: { type: String, required: true, trim: true },
      country: { type: String, default: 'India', trim: true },
    },
    idempotencyKey: {
      type: String,
      unique: true,
      sparse: true, // allow nulls but enforce uniqueness when present
    },
    coupon: {
      code: { type: String, default: null },
      discountAmount: { type: Number, default: 0 },
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
// razorpay_order_id and idempotencyKey indexes are auto-created by unique: true
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ orderStatus: 1 });

orderSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  delete obj.razorpay_signature; // never expose signature
  return obj;
};

module.exports = mongoose.model('Order', orderSchema);
