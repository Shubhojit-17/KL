'use strict';

const Cart = require('../models/Cart');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * GET /api/cart
 * Get the authenticated user's cart.
 */
const getCart = asyncHandler(async (req, res) => {
  let cart = await Cart.findOne({ user: req.user._id }).populate(
    'items.product',
    'name price images stock isActive'
  );

  if (!cart) {
    cart = { user: req.user._id, items: [] };
  }

  res.status(200).json({ success: true, data: { cart } });
});

/**
 * POST /api/cart/add
 * Add a product to cart or increase its quantity.
 */
const addToCart = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.body;

  // Verify product exists and is active
  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) {
    throw new AppError('Product not found or unavailable.', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.stock < quantity) {
    throw new AppError(
      `Insufficient stock. Available: ${product.stock}`,
      400,
      'INSUFFICIENT_STOCK'
    );
  }

  let cart = await Cart.findOne({ user: req.user._id });

  if (!cart) {
    cart = new Cart({ user: req.user._id, items: [] });
  }

  // Check if product already in cart
  const existingIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );

  if (existingIndex > -1) {
    const newQty = cart.items[existingIndex].quantity + quantity;
    if (newQty > product.stock) {
      throw new AppError(
        `Cannot add more. Stock limit: ${product.stock}`,
        400,
        'STOCK_LIMIT'
      );
    }
    if (newQty > 50) {
      throw new AppError('Maximum 50 units per item.', 400, 'QUANTITY_LIMIT');
    }
    cart.items[existingIndex].quantity = newQty;
  } else {
    cart.items.push({ product: productId, quantity });
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price images stock isActive'
  );

  res.status(200).json({ success: true, data: { cart: populatedCart } });
});

/**
 * PUT /api/cart/item/:productId
 * Update quantity for a specific product in cart.
 */
const updateCartItem = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { quantity } = req.body;

  const product = await Product.findById(productId).lean();
  if (!product || !product.isActive) {
    throw new AppError('Product not found or unavailable.', 404, 'PRODUCT_NOT_FOUND');
  }

  if (product.stock < quantity) {
    throw new AppError(
      `Insufficient stock. Available: ${product.stock}`,
      400,
      'INSUFFICIENT_STOCK'
    );
  }

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found.', 404, 'CART_NOT_FOUND');
  }

  const itemIndex = cart.items.findIndex(
    (item) => item.product.toString() === productId
  );
  if (itemIndex === -1) {
    throw new AppError('Product not in cart.', 404, 'ITEM_NOT_IN_CART');
  }

  cart.items[itemIndex].quantity = quantity;
  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price images stock isActive'
  );

  res.status(200).json({ success: true, data: { cart: populatedCart } });
});

/**
 * DELETE /api/cart/item/:productId
 * Remove a product from cart.
 */
const removeFromCart = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const cart = await Cart.findOne({ user: req.user._id });
  if (!cart) {
    throw new AppError('Cart not found.', 404, 'CART_NOT_FOUND');
  }

  const initialLength = cart.items.length;
  cart.items = cart.items.filter(
    (item) => item.product.toString() !== productId
  );

  if (cart.items.length === initialLength) {
    throw new AppError('Product not in cart.', 404, 'ITEM_NOT_IN_CART');
  }

  await cart.save();

  const populatedCart = await Cart.findById(cart._id).populate(
    'items.product',
    'name price images stock isActive'
  );

  res.status(200).json({ success: true, data: { cart: populatedCart } });
});

/**
 * DELETE /api/cart
 * Clear the entire cart.
 */
const clearCart = asyncHandler(async (req, res) => {
  await Cart.findOneAndUpdate({ user: req.user._id }, { items: [] });

  res.status(200).json({ success: true, message: 'Cart cleared.', data: { cart: { items: [] } } });
});

module.exports = { getCart, addToCart, updateCartItem, removeFromCart, clearCart };
