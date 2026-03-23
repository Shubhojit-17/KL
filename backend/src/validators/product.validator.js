'use strict';

const Joi = require('joi');

const objectId = Joi.string()
  .regex(/^[a-fA-F0-9]{24}$/)
  .messages({
    'string.pattern.base': 'Invalid ID format',
  });

const createProduct = Joi.object({
  name: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(2000).required(),
  price: Joi.number().positive().precision(2).required(),
  stock: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string().uri()).max(10).default([]),
  category: Joi.string().trim().max(100).required(),
  isActive: Joi.boolean().default(true),
});

const updateProduct = Joi.object({
  name: Joi.string().trim().max(200),
  description: Joi.string().trim().max(2000),
  price: Joi.number().positive().precision(2),
  stock: Joi.number().integer().min(0),
  images: Joi.array().items(Joi.string().uri()).max(10),
  category: Joi.string().trim().max(100),
  isActive: Joi.boolean(),
}).min(1); // at least one field to update

const productQuery = Joi.object({
  page: Joi.number().integer().min(1).default(1),
  limit: Joi.number().integer().min(1).max(50).default(12),
  category: Joi.string().trim().max(100),
  search: Joi.string().trim().max(100),
  sort: Joi.string().valid('price_asc', 'price_desc', 'newest', 'name').default('newest'),
  minPrice: Joi.number().min(0),
  maxPrice: Joi.number().min(0),
});

module.exports = { createProduct, updateProduct, productQuery, objectId };
