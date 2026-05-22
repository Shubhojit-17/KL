'use strict';

const express = require('express');
const router = express.Router();
const productController = require('../controllers/product.controller');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const { validate, validateQuery } = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const productValidator = require('../validators/product.validator');

// Public routes
router.get(
  '/',
  validateQuery(productValidator.productQuery),
  productController.getProducts
);

// Admin route – MUST be defined BEFORE /:id to avoid "admin" matching as an ID
router.get('/admin/all', auth, admin, productController.getAllProductsAdmin);

// Public single product
router.get('/:id', validateObjectId(), productController.getProduct);

router.post(
  '/',
  auth,
  admin,
  validate(productValidator.createProduct),
  productController.createProduct
);

router.put(
  '/:id',
  auth,
  admin,
  validateObjectId(),
  validate(productValidator.updateProduct),
  productController.updateProduct
);

router.delete('/:id', auth, admin, validateObjectId(), productController.deleteProduct);

module.exports = router;
