'use strict';

const Order = require('../models/Order');
const User = require('../models/User');
const paymentService = require('../services/payment.service');
const emailService = require('../services/email.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * POST /api/payment/create-order
 * Create a Razorpay order from the user's cart.
 */
const createOrder = asyncHandler(async (req, res) => {
  const { shippingAddress, idempotencyKey, couponCode } = req.body;

  const orderData = await paymentService.createPaymentOrder(
    req.user._id,
    shippingAddress,
    idempotencyKey,
    couponCode
  );

  res.status(201).json({
    success: true,
    data: orderData,
  });
});

/**
 * POST /api/payment/verify
 * Verify Razorpay payment signature and finalize order.
 */
const verifyPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  const order = await paymentService.verifyAndFinalizePayment(
    req.user._id,
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  res.status(200).json({
    success: true,
    message: 'Payment verified successfully.',
    data: { order },
  });
});

/**
 * POST /api/payment/webhook
 * Handle Razorpay webhook events.
 * No auth middleware – uses webhook signature verification.
 */
const handleWebhook = asyncHandler(async (req, res) => {
  const webhookSignature = req.headers['x-razorpay-signature'];

  if (!webhookSignature) {
    throw new AppError('Missing webhook signature.', 400, 'MISSING_WEBHOOK_SIGNATURE');
  }

  // Pass raw body (not parsed JSON) for HMAC signature verification
  const rawBody = req.rawBody || JSON.stringify(req.body);
  await paymentService.handleWebhookEvent(rawBody, webhookSignature);

  // Always respond 200 to Razorpay to acknowledge receipt
  res.status(200).json({ success: true });
});

/**
 * GET /api/orders/my
 * Get current user's orders with pagination.
 */
const getMyOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, paymentStatus, orderStatus } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = { user: req.user._id };
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderStatus) filter.orderStatus = orderStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('items.product', 'name images')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

/**
 * GET /api/orders/my/:id
 * Get a specific order for the current user.
 */
const getMyOrder = asyncHandler(async (req, res) => {
  const order = await Order.findOne({ _id: req.params.id, user: req.user._id })
    .populate('items.product', 'name images category price')
    .lean();

  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  res.status(200).json({ success: true, data: { order } });
});

/**
 * POST /api/payment/orders/my/:id/cancel
 * Cancel order by customer.
 */
const cancelOrder = asyncHandler(async (req, res) => {
  const order = await paymentService.cancelUserOrder(req.user._id, req.params.id);

  res.status(200).json({
    success: true,
    message: 'Order cancelled successfully.',
    data: { order },
  });
});

/**
 * GET /api/admin/orders (Admin only)
 * List all orders.
 */
const getAllOrders = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, paymentStatus, orderStatus } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const filter = {};
  if (paymentStatus) filter.paymentStatus = paymentStatus;
  if (orderStatus) filter.orderStatus = orderStatus;

  const [orders, total] = await Promise.all([
    Order.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('user', 'name email')
      .populate('items.product', 'name images')
      .lean(),
    Order.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      orders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)),
      },
    },
  });
});

/**
 * PUT /api/admin/orders/:id/status (Admin only)
 * Update order status.
 */
const updateOrderStatus = asyncHandler(async (req, res) => {
  const { orderStatus } = req.body;

  const order = await Order.findById(req.params.id);
  if (!order) {
    throw new AppError('Order not found.', 404, 'ORDER_NOT_FOUND');
  }

  // Only allow status update on paid orders (prevent updating unpaid orders)
  if (order.paymentStatus !== 'paid' && orderStatus !== 'cancelled') {
    throw new AppError('Cannot update status of an unpaid order.', 400, 'UNPAID_ORDER');
  }

  // Prevent invalid status transitions
  const validTransitions = {
    created: ['cancelled'],
    confirmed: ['shipped', 'cancelled'],
    shipped: ['delivered'],
    delivered: [],
    cancelled: [],
  };

  const allowed = validTransitions[order.orderStatus] || [];
  if (!allowed.includes(orderStatus)) {
    throw new AppError(
      `Cannot transition from "${order.orderStatus}" to "${orderStatus}".`,
      400,
      'INVALID_STATUS_TRANSITION'
    );
  }

  order.orderStatus = orderStatus;
  await order.save();

  logger.info('Order status updated', {
    orderId: order._id.toString(),
    newStatus: orderStatus,
    adminEmail: req.user.email,
  });

  // Send email status update
  User.findById(order.user)
    .select('name email')
    .then((user) => {
      if (user) {
        emailService.sendOrderStatusUpdate(order, user.email, user.name, orderStatus).catch(() => {});
      }
    })
    .catch(() => {});

  res.status(200).json({ success: true, data: { order } });
});

module.exports = {
  createOrder,
  verifyPayment,
  handleWebhook,
  getMyOrders,
  getMyOrder,
  cancelOrder,
  getAllOrders,
  updateOrderStatus,
};
