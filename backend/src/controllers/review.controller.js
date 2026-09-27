'use strict';

const Review = require('../models/Review');
const Order = require('../models/Order');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * GET /api/products/:productId/reviews
 * Public – Get all reviews for a product
 */
const getProductReviews = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  const reviews = await Review.find({ product: productId })
    .sort({ createdAt: -1 })
    .lean();

  const count = reviews.length;
  const averageRating =
    count > 0
      ? Math.round((reviews.reduce((acc, r) => acc + r.rating, 0) / count) * 10) / 10
      : 0;

  res.status(200).json({
    success: true,
    data: {
      reviews,
      count,
      averageRating,
    },
  });
});

/**
 * POST /api/products/:productId/reviews
 * Authenticated – Create a review for a product
 */
const createReview = asyncHandler(async (req, res) => {
  const { productId } = req.params;
  const { rating, title, comment } = req.body;

  if (!rating || !comment) {
    throw new AppError('Rating and comment are required.', 400, 'VALIDATION_ERROR');
  }

  const existing = await Review.findOne({ product: productId, user: req.user._id });
  if (existing) {
    throw new AppError('You have already reviewed this product.', 400, 'ALREADY_REVIEWED');
  }

  // Check verified purchase
  const verifiedOrder = await Order.findOne({
    user: req.user._id,
    'items.product': productId,
    paymentStatus: 'paid',
  });

  const review = await Review.create({
    product: productId,
    user: req.user._id,
    userName: req.user.name,
    rating: Number(rating),
    title: title ? title.trim() : '',
    comment: comment.trim(),
    isVerifiedPurchase: Boolean(verifiedOrder),
  });

  res.status(201).json({
    success: true,
    message: 'Review posted successfully.',
    data: { review },
  });
});

/**
 * DELETE /api/products/:productId/reviews/:reviewId
 * Authenticated (Author or Admin) – Delete a review
 */
const deleteReview = asyncHandler(async (req, res) => {
  const { reviewId } = req.params;

  const review = await Review.findById(reviewId);
  if (!review) {
    throw new AppError('Review not found.', 404, 'REVIEW_NOT_FOUND');
  }

  // Only author or admin can delete
  if (review.user.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
    throw new AppError('Unauthorized to delete this review.', 403, 'FORBIDDEN');
  }

  await review.deleteOne();

  res.status(200).json({
    success: true,
    message: 'Review deleted successfully.',
  });
});

module.exports = {
  getProductReviews,
  createReview,
  deleteReview,
};
