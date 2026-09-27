'use strict';

const express = require('express');
const router = express.Router();
const userController = require('../controllers/user.controller');
const auth = require('../middleware/auth');
const validateObjectId = require('../middleware/validateObjectId');

// All user routes require authentication
router.use(auth);

// Profile
router.get('/profile', userController.getProfile);
router.put('/profile', userController.updateProfile);

// Addresses
router.get('/addresses', userController.getAddresses);
router.post('/addresses', userController.addAddress);
router.put('/addresses/:id', validateObjectId(), userController.updateAddress);
router.delete('/addresses/:id', validateObjectId(), userController.deleteAddress);
router.put('/addresses/:id/default', validateObjectId(), userController.setDefaultAddress);

// Wishlist
router.get('/wishlist', userController.getWishlist);
router.post('/wishlist/:productId', validateObjectId('productId'), userController.addToWishlist);
router.delete('/wishlist/:productId', validateObjectId('productId'), userController.removeFromWishlist);

module.exports = router;
