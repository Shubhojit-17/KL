'use strict';

const express = require('express');
const router = express.Router();
const cartController = require('../controllers/cart.controller');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const cartValidator = require('../validators/cart.validator');

// All cart routes require authentication
router.use(auth);

// GET /api/cart – Get user's cart
router.get('/', cartController.getCart);

// POST /api/cart/add – Add item to cart
router.post('/add', validate(cartValidator.addToCart), cartController.addToCart);

// PUT /api/cart/item/:productId – Update item quantity
router.put(
  '/item/:productId',
  validateObjectId('productId'),
  validate(cartValidator.updateCartItem),
  cartController.updateCartItem
);

// DELETE /api/cart/item/:productId – Remove item
router.delete('/item/:productId', validateObjectId('productId'), cartController.removeFromCart);

// DELETE /api/cart – Clear cart
router.delete('/', cartController.clearCart);

module.exports = router;
