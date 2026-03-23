'use strict';

const mongoose = require('mongoose');
const { getRazorpayInstance } = require('../config/razorpay');
const crypto = require('crypto');
const { timingSafeEqual } = crypto;
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * Build order items from cart, recalculate totals from DB, validate stock.
 * Returns { orderItems, totalAmount }
 */
async function buildOrderFromCart(userId, session) {
  const cart = await Cart.findOne({ user: userId }).populate('items.product').session(session);

  if (!cart || cart.items.length === 0) {
    throw new AppError('Cart is empty.', 400, 'EMPTY_CART');
  }

  let totalAmount = 0;
  const orderItems = [];

  for (const item of cart.items) {
    const product = item.product;

    if (!product || !product.isActive) {
      throw new AppError(
        `Product "${product?.name || 'unknown'}" is no longer available.`,
        400,
        'PRODUCT_UNAVAILABLE'
      );
    }

    if (product.stock < item.quantity) {
      throw new AppError(
        `Insufficient stock for "${product.name}". Available: ${product.stock}, Requested: ${item.quantity}`,
        400,
        'INSUFFICIENT_STOCK'
      );
    }

    const lineTotal = product.price * item.quantity;
    totalAmount += lineTotal;

    orderItems.push({
      product: product._id,
      name: product.name,
      price: product.price,
      quantity: item.quantity,
    });
  }

  // Round to 2 decimal places to avoid floating point issues
  totalAmount = Math.round(totalAmount * 100) / 100;

  return { orderItems, totalAmount };
}

/**
 * Create a Razorpay order and a pending Order document.
 * Uses a MongoDB transaction.
 */
async function createPaymentOrder(userId, shippingAddress, idempotencyKey) {
  // Check for duplicate submission via idempotency key
  const existingOrder = await Order.findOne({ idempotencyKey });
  if (existingOrder) {
    // Verify the idempotency key belongs to the same user (prevent cross-user replay)
    if (existingOrder.user.toString() !== userId.toString()) {
      throw new AppError('Invalid idempotency key.', 400, 'IDEMPOTENCY_MISMATCH');
    }
    logger.warn('Duplicate order submission detected', { idempotencyKey, userId: userId.toString() });
    return {
      razorpay_order_id: existingOrder.razorpay_order_id,
      razorpayOrderId: existingOrder.razorpay_order_id,
      amount: Math.round(existingOrder.totalAmount * 100),
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: existingOrder._id.toString(),
      localOrderId: existingOrder._id.toString(),
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, totalAmount } = await buildOrderFromCart(userId, session);

    // Amount in paise for Razorpay (INR * 100)
    const amountInPaise = Math.round(totalAmount * 100);

    // Create Razorpay order
    const razorpay = getRazorpayInstance();
    const razorpayOrder = await razorpay.orders.create({
      amount: amountInPaise,
      currency: 'INR',
      receipt: `order_${Date.now()}_${userId.toString().slice(-6)}`,
      notes: {
        userId: userId.toString(),
      },
    });

    // Create local order document
    const order = new Order({
      user: userId,
      items: orderItems,
      totalAmount,
      razorpay_order_id: razorpayOrder.id,
      shippingAddress,
      idempotencyKey,
      paymentStatus: 'pending',
      orderStatus: 'created',
    });

    await order.save({ session });
    await session.commitTransaction();

    logger.info('Payment order created', {
      orderId: order._id.toString(),
      razorpayOrderId: razorpayOrder.id,
      amount: totalAmount,
    });

    return {
      razorpay_order_id: razorpayOrder.id,
      razorpayOrderId: razorpayOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key_id: process.env.RAZORPAY_KEY_ID,
      keyId: process.env.RAZORPAY_KEY_ID,
      orderId: order._id,
      localOrderId: order._id,
    };
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Verify Razorpay payment and finalize order.
 * - Verifies signature
 * - Deducts stock atomically
 * - Clears cart
 * All inside a transaction.
 */
async function verifyAndFinalizePayment(userId, razorpay_order_id, razorpay_payment_id, razorpay_signature) {
  // 1. Verify signature
  const generatedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
    .update(`${razorpay_order_id}|${razorpay_payment_id}`)
    .digest('hex');

  const sigBuffer = Buffer.from(razorpay_signature, 'hex');
  const genBuffer = Buffer.from(generatedSignature, 'hex');
  const signatureMatch = sigBuffer.length === genBuffer.length && timingSafeEqual(sigBuffer, genBuffer);

  if (!signatureMatch) {
    logger.warn('Payment signature verification failed', {
      razorpay_order_id,
      razorpay_payment_id,
      userId: userId.toString(),
    });

    // Mark as failed
    await Order.findOneAndUpdate(
      { razorpay_order_id, user: userId },
      { paymentStatus: 'failed' }
    );

    throw new AppError('Payment verification failed. Invalid signature.', 400, 'INVALID_SIGNATURE');
  }

  // 2. Find and update order inside a transaction
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOne({ razorpay_order_id, user: userId }).session(session);

    if (!order) {
      throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
    }

    // Idempotent: if already paid, return success without re-processing
    if (order.paymentStatus === 'paid') {
      await session.abortTransaction();
      logger.info('Duplicate payment verification – already paid', { razorpay_order_id });
      return order;
    }

    // 3. Reduce stock atomically for each item
    for (const item of order.items) {
      const result = await Product.findOneAndUpdate(
        {
          _id: item.product,
          stock: { $gte: item.quantity }, // atomic guard
        },
        {
          $inc: { stock: -item.quantity },
        },
        { session, new: true }
      );

      if (!result) {
        throw new AppError(
          `Stock depleted for "${item.name}" during payment processing. Refund will be initiated.`,
          409,
          'STOCK_RACE_CONDITION'
        );
      }
    }

    // 4. Update order
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    order.paymentStatus = 'paid';
    order.orderStatus = 'confirmed';
    await order.save({ session });

    // 5. Clear cart
    await Cart.findOneAndUpdate({ user: userId }, { items: [] }, { session });

    await session.commitTransaction();

    logger.info('Payment verified and order confirmed', {
      orderId: order._id.toString(),
      razorpay_order_id,
      razorpay_payment_id,
    });

    return order;
  } catch (err) {
    await session.abortTransaction();
    throw err;
  } finally {
    session.endSession();
  }
}

/**
 * Handle Razorpay webhook event.
 * Verifies webhook signature and updates order status.
 */
async function handleWebhookEvent(rawBody, webhookSignature) {
  // Verify webhook signature using the dedicated webhook secret
  // rawBody must be the original raw request body (string/buffer), NOT parsed JSON
  const expectedSignature = crypto
    .createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET)
    .update(rawBody)
    .digest('hex');

  const sigBuf = Buffer.from(webhookSignature, 'hex');
  const expBuf = Buffer.from(expectedSignature, 'hex');
  const isValid = sigBuf.length === expBuf.length && timingSafeEqual(sigBuf, expBuf);

  if (!isValid) {
    logger.warn('Invalid webhook signature received');
    throw new AppError('Invalid webhook signature.', 400, 'INVALID_WEBHOOK_SIGNATURE');
  }

  // Parse body after signature verification
  const body = typeof rawBody === 'string' ? JSON.parse(rawBody) : rawBody;

  const event = body.event;
  const payment = body.payload?.payment?.entity;

  logger.info('Webhook event received', { event, paymentId: payment?.id });

  if (event === 'payment.captured') {
    const razorpayOrderId = payment.order_id;
    const razorpayPaymentId = payment.id;

    const order = await Order.findOne({ razorpay_order_id: razorpayOrderId });
    if (!order) {
      logger.warn('Webhook: Order not found for razorpay_order_id', { razorpayOrderId });
      return;
    }

    // Only update if not already paid (idempotent)
    if (order.paymentStatus !== 'paid') {
      const session = await mongoose.startSession();
      session.startTransaction();

      try {
        // Reduce stock atomically
        for (const item of order.items) {
          const result = await Product.findOneAndUpdate(
            { _id: item.product, stock: { $gte: item.quantity } },
            { $inc: { stock: -item.quantity } },
            { session, new: true }
          );

          if (!result) {
            logger.error('Webhook: Stock race condition', {
              productId: item.product.toString(),
              item: item.name,
            });
            // Don't throw; still mark as paid since money is captured. Handle manually.
          }
        }

        order.razorpay_payment_id = razorpayPaymentId;
        order.paymentStatus = 'paid';
        order.orderStatus = 'confirmed';
        await order.save({ session });

        // Clear user cart
        await Cart.findOneAndUpdate({ user: order.user }, { items: [] }, { session });

        await session.commitTransaction();
        logger.info('Webhook: Order updated to paid', { orderId: order._id.toString() });
      } catch (err) {
        await session.abortTransaction();
        logger.error('Webhook: Transaction failed', { error: err.message });
      } finally {
        session.endSession();
      }
    }
  } else if (event === 'payment.failed') {
    const razorpayOrderId = payment.order_id;
    await Order.findOneAndUpdate(
      { razorpay_order_id: razorpayOrderId },
      { paymentStatus: 'failed' }
    );
    logger.info('Webhook: Payment failed', { razorpayOrderId });
  }
}

module.exports = {
  createPaymentOrder,
  verifyAndFinalizePayment,
  handleWebhookEvent,
};
