'use strict';

const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * GET /api/products
 * Public – List active products with filtering, sorting, and pagination.
 */
const getProducts = asyncHandler(async (req, res) => {
  const { page, limit, category, search, sort, minPrice, maxPrice } = req.query;

  const filter = { isActive: true };

  if (category) filter.category = category;
  if (minPrice !== undefined || maxPrice !== undefined) {
    filter.price = {};
    if (minPrice !== undefined) filter.price.$gte = minPrice;
    if (maxPrice !== undefined) filter.price.$lte = maxPrice;
  }
  if (search) {
    filter.$text = { $search: search };
  }

  // Sort mapping
  const sortMap = {
    price_asc: { price: 1 },
    price_desc: { price: -1 },
    newest: { createdAt: -1 },
    name: { name: 1 },
  };

  const sortOption = sortMap[sort] || sortMap.newest;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort(sortOption).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

/**
 * GET /api/products/:id
 * Public – Get single product detail.
 */
const getProduct = asyncHandler(async (req, res) => {
  const product = await Product.findById(req.params.id).lean();

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  res.status(200).json({ success: true, data: { product } });
});

/**
 * POST /api/products (Admin only)
 */
const createProduct = asyncHandler(async (req, res) => {
  const product = await Product.create(req.body);

  res.status(201).json({ success: true, data: { product } });
});

/**
 * PUT /api/products/:id (Admin only)
 */
const updateProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  res.status(200).json({ success: true, data: { product } });
});

/**
 * DELETE /api/products/:id (Admin only)
 * Soft-delete by setting isActive = false.
 */
const deleteProduct = asyncHandler(async (req, res) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { isActive: false },
    { new: true }
  );

  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  res.status(200).json({ success: true, message: 'Product deactivated.', data: { product } });
});

/**
 * GET /api/products/admin/all (Admin only)
 * List ALL products including inactive ones.
 */
const getAllProductsAdmin = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(),
  ]);

  res.status(200).json({
    success: true,
    data: {
      products,
      pagination: { page: Number(page), limit: Number(limit), total, totalPages: Math.ceil(total / limit) },
    },
  });
});

module.exports = {
  getProducts,
  getProduct,
  createProduct,
  updateProduct,
  deleteProduct,
  getAllProductsAdmin,
};
