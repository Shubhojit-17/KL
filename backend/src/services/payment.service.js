'use strict';

const mongoose = require('mongoose');
const { getRazorpayInstance } = require('../config/razorpay');
const crypto = require('crypto');
const { timingSafeEqual } = crypto;
const Cart = require('../models/Cart');
const Product = require('../models/Product');
const Order = require('../models/Order');
const User = require('../models/User');
const Coupon = require('../models/Coupon');
const emailService = require('./email.service');
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
async function createPaymentOrder(userId, shippingAddress, idempotencyKey, couponCode) {
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
      discountAmount: existingOrder.coupon?.discountAmount || 0,
    };
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { orderItems, totalAmount: subtotal } = await buildOrderFromCart(userId, session);
    let finalAmount = subtotal;
    let appliedCoupon = null;

    if (couponCode) {
      const coupon = await Coupon.findOne({
        code: couponCode.trim().toUpperCase(),
        isActive: true,
      }).session(session);

      if (!coupon) {
        throw new AppError('Invalid or expired coupon code.', 400, 'INVALID_COUPON');
      }

      if (coupon.expiresAt && new Date(coupon.expiresAt) < new Date()) {
        throw new AppError('This coupon has expired.', 400, 'COUPON_EXPIRED');
      }

      if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
        throw new AppError('This coupon usage limit has been reached.', 400, 'COUPON_LIMIT_REACHED');
      }

      if (coupon.minOrderAmount && subtotal < coupon.minOrderAmount) {
        throw new AppError(
          `Minimum order amount of ₹${coupon.minOrderAmount} required for this coupon.`,
          400,
          'COUPON_MIN_NOT_MET'
        );
      }

      let discount = 0;
      if (coupon.discountType === 'percentage') {
        discount = Math.round(subtotal * (coupon.discountValue / 100) * 100) / 100;
        if (coupon.maxDiscount && discount > coupon.maxDiscount) {
          discount = coupon.maxDiscount;
        }
      } else if (coupon.discountType === 'flat') {
        discount = Math.min(coupon.discountValue, subtotal);
      }

      finalAmount = Math.max(1, Math.round((subtotal - discount) * 100) / 100);
      appliedCoupon = {
        code: coupon.code,
        discountAmount: discount,
      };
    }

    // Amount in paise for Razorpay (INR * 100)
    const amountInPaise = Math.round(finalAmount * 100);

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
      totalAmount: finalAmount,
      razorpay_order_id: razorpayOrder.id,
      shippingAddress,
      idempotencyKey,
      coupon: appliedCoupon,
      paymentStatus: 'pending',
      orderStatus: 'created',
    });

    await order.save({ session });
    await session.commitTransaction();

    logger.info('Payment order created', {
      orderId: order._id.toString(),
      razorpayOrderId: razorpayOrder.id,
      amount: finalAmount,
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
      discountAmount: appliedCoupon?.discountAmount || 0,
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

  // 2. Atomically claim the order – prevents race with webhook
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const order = await Order.findOneAndUpdate(
      { razorpay_order_id, user: userId, paymentStatus: { $ne: 'paid' } },
      { $set: { paymentStatus: 'paid' } },
      { session, new: true }
    );

    if (!order) {
      await session.abortTransaction();
      const existing = await Order.findOne({ razorpay_order_id, user: userId });
      logger.info('Duplicate payment verification – already paid', { razorpay_order_id });
      return existing;
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

    // 4. Complete order fields
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
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

    // Increment coupon usage if coupon used
    if (order.coupon?.code) {
      Coupon.findOneAndUpdate(
        { code: order.coupon.code },
        { $inc: { usageCount: 1 } }
      ).catch(() => {});
    }

    // Send confirmation email (async non-blocking)
    User.findById(userId)
      .select('name email')
      .then((user) => {
        if (user) {
          emailService.sendOrderConfirmation(order, user.email, user.name).catch(() => {});
        }
      })
      .catch(() => {});

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

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
      // Atomically claim the order INSIDE the transaction
      const order = await Order.findOneAndUpdate(
        { razorpay_order_id: razorpayOrderId, paymentStatus: { $ne: 'paid' } },
        { $set: { paymentStatus: 'paid' } },
        { session, new: true }
      );

      if (!order) {
        await session.abortTransaction();
        session.endSession();
        logger.info('Webhook: Order already paid by another path', { razorpayOrderId });
        return;
      }

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
        }
      }

      order.razorpay_payment_id = razorpayPaymentId;
      order.orderStatus = 'confirmed';
      await order.save({ session });

      // Clear user cart
      await Cart.findOneAndUpdate({ user: order.user }, { items: [] }, { session });

      await session.commitTransaction();
      logger.info('Webhook: Order updated to paid', { orderId: order._id.toString() });

      // Send confirmation email
      User.findById(order.user)
        .select('name email')
        .then((user) => {
          if (user) {
            emailService.sendOrderConfirmation(order, user.email, user.name).catch(() => {});
          }
        })
        .catch(() => {});
    } catch (err) {
      await session.abortTransaction();
      logger.error('Webhook: Transaction failed', { error: err.message });
    } finally {
      session.endSession();
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

/**
 * Cancel an order by customer.
 * Allowed when orderStatus is 'created' or 'confirmed'.
 * Restores product stock atomically if status was 'confirmed'.
 */
async function cancelUserOrder(userId, orderId) {
  const order = await Order.findOne({ _id: orderId, user: userId });
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  if (!['created', 'confirmed'].includes(order.orderStatus)) {
    throw new AppError(
      `Cannot cancel an order with status "${order.orderStatus}". Only created or confirmed orders can be cancelled.`,
      400,
      'CANNOT_CANCEL_ORDER'
    );
  }

  const previousStatus = order.orderStatus;

  if (previousStatus === 'confirmed') {
    // Stock was deducted on confirmation: restore it atomically inside transaction
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { $inc: { stock: item.quantity } },
          { session }
        );
      }

      order.orderStatus = 'cancelled';
      await order.save({ session });
      await session.commitTransaction();
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  } else {
    // Unpaid 'created' order: no stock was deducted
    order.orderStatus = 'cancelled';
    await order.save();
  }

  logger.info('Order cancelled by customer', {
    orderId: order._id.toString(),
    userId: userId.toString(),
    previousStatus,
  });

  // Send cancellation email notification
  User.findById(userId)
    .select('name email')
    .then((user) => {
      if (user) {
        emailService.sendOrderCancellation(order, user.email, user.name).catch(() => {});
      }
    })
    .catch(() => {});

  return order;
}

module.exports = {
  createPaymentOrder,
  verifyAndFinalizePayment,
  handleWebhookEvent,
  cancelUserOrder,
};
