'use strict';

const express = require('express');
const router = express.Router({ mergeParams: true });
const reviewController = require('../controllers/review.controller');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

router.get('/', validateObjectId('productId'), reviewController.getProductReviews);
router.post('/', auth, validateObjectId('productId'), reviewController.createReview);
router.delete('/:reviewId', auth, validateObjectId('reviewId'), reviewController.deleteReview);

module.exports = router;
