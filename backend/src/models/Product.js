'use strict';

const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [200, 'Product name cannot exceed 200 characters'],
    },
    description: {
      type: String,
      required: [true, 'Product description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0.01, 'Price must be at least ₹0.01'],
    },
    stock: {
      type: Number,
      required: [true, 'Stock is required'],
      min: [0, 'Stock cannot be negative'],
      default: 0,
      validate: {
        validator: Number.isInteger,
        message: 'Stock must be a whole number',
      },
    },
    images: {
      type: [String],
      default: [],
      validate: {
        validator: (arr) => arr.length <= 10,
        message: 'A product can have at most 10 images',
      },
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      trim: true,
      maxlength: [100, 'Category cannot exceed 100 characters'],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
productSchema.index({ category: 1 });
productSchema.index({ isActive: 1, category: 1 });
productSchema.index({ price: 1 });
productSchema.index({ name: 'text', description: 'text' });

productSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('Product', productSchema);
