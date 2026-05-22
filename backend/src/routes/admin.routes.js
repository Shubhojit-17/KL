'use strict';

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/admin.controller');
const paymentController = require('../controllers/payment.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { validate, validateQuery } = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const adminValidator = require('../validators/admin.validator');
const paymentValidator = require('../validators/payment.validator');

// All admin routes require auth + admin
router.use(auth, admin);

// POST /api/admin/assign-admin – Promote user to admin
router.post(
  '/assign-admin',
  validate(adminValidator.assignAdmin),
  adminController.assignAdmin
);

// POST /api/admin/revoke-admin – Demote admin to user
router.post(
  '/revoke-admin',
  validate(adminValidator.assignAdmin), // same schema
  adminController.revokeAdmin
);

// GET /api/admin/users – List all users
router.get('/users', adminController.getAllUsers);

// GET /api/admin/orders – List all orders
router.get(
  '/orders',
  validateQuery(paymentValidator.orderQuery),
  paymentController.getAllOrders
);

// PUT /api/admin/orders/:id/status – Update order status
router.put(
  '/orders/:id/status',
  validateObjectId(),
  validate(paymentValidator.updateOrderStatus),
  paymentController.updateOrderStatus
);

module.exports = router;
