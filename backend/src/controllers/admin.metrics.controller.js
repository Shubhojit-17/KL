'use strict';

const Order = require('../models/Order');
const Product = require('../models/Product');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * GET /api/admin/metrics
 * Returns comprehensive analytics for the admin dashboard.
 */
const getMetrics = asyncHandler(async (_req, res) => {
  const [
    revenueAgg,
    totalOrders,
    ordersByStatusAgg,
    totalProducts,
    lowStockProducts,
    outOfStockProducts,
    totalUsers,
    recentOrders,
  ] = await Promise.all([
    // Sum of paid orders
    Order.aggregate([
      { $match: { paymentStatus: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$totalAmount' } } },
    ]),
    Order.countDocuments(),
    // Status breakdown
    Order.aggregate([
      { $group: { _id: '$orderStatus', count: { $sum: 1 } } },
    ]),
    Product.countDocuments({ isActive: true }),
    Product.countDocuments({ isActive: true, stock: { $gt: 0, $lte: 5 } }),
    Product.countDocuments({ isActive: true, stock: 0 }),
    User.countDocuments(),
    Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('user', 'name email')
      .lean(),
  ]);

  const totalRevenue = revenueAgg[0]?.totalRevenue || 0;
  const statusMap = {};
  ordersByStatusAgg.forEach((item) => {
    statusMap[item._id] = item.count;
  });

  res.status(200).json({
    success: true,
    data: {
      metrics: {
        totalRevenue,
        totalOrders,
        pendingOrders: (statusMap.created || 0) + (statusMap.confirmed || 0),
        shippedOrders: statusMap.shipped || 0,
        deliveredOrders: statusMap.delivered || 0,
        cancelledOrders: statusMap.cancelled || 0,
        totalProducts,
        lowStockProducts,
        outOfStockProducts,
        totalUsers,
        recentOrders,
      },
    },
  });
});

module.exports = { getMetrics };
