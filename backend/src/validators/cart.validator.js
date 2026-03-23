'use strict';

const Joi = require('joi');

const objectId = Joi.string()
  .regex(/^[a-fA-F0-9]{24}$/)
  .messages({ 'string.pattern.base': 'Invalid product ID format' });

const addToCart = Joi.object({
  productId: objectId.required(),
  quantity: Joi.number().integer().min(1).max(50).required(),
});

const updateCartItem = Joi.object({
  quantity: Joi.number().integer().min(1).max(50).required(),
});

const removeFromCart = Joi.object({
  productId: objectId.required(),
});

module.exports = { addToCart, updateCartItem, removeFromCart };
