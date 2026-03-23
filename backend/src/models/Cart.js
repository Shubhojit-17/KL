'use strict';

const mongoose = require('mongoose');

const cartItemSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Product',
      required: true,
    },
    quantity: {
      type: Number,
      required: true,
      min: [1, 'Quantity must be at least 1'],
      max: [50, 'Quantity cannot exceed 50'],
      validate: {
        validator: Number.isInteger,
        message: 'Quantity must be a whole number',
      },
    },
  },
  { _id: false }
);

const cartSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true, // one cart per user
    },
    items: {
      type: [cartItemSchema],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 50,
        message: 'Cart cannot contain more than 50 items',
      },
    },
  },
  {
    timestamps: true, // updatedAt tracks last cart modification
  }
);

// Note: user index is auto-created by the `unique: true` constraint

cartSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Cart', cartSchema);
