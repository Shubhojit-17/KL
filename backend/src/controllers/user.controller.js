'use strict';

const User = require('../models/User');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * GET /api/user/profile
 */
const getProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password');
  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  res.status(200).json({
    success: true,
    data: { user },
  });
});

/**
 * PUT /api/user/profile
 */
const updateProfile = asyncHandler(async (req, res) => {
  const { name } = req.body;
  const user = await User.findById(req.user._id);

  if (!user) {
    throw new AppError('User not found.', 404, 'USER_NOT_FOUND');
  }

  if (name) user.name = name.trim();
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Profile updated successfully.',
    data: { user },
  });
});

/**
 * GET /api/user/addresses
 */
const getAddresses = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('addresses');
  res.status(200).json({
    success: true,
    data: { addresses: user?.addresses || [] },
  });
});

/**
 * POST /api/user/addresses
 */
const addAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

  if (isDefault || user.addresses.length === 0) {
    user.addresses.forEach((a) => (a.isDefault = false));
  }

  user.addresses.push({
    fullName,
    phone,
    addressLine1,
    addressLine2: addressLine2 || '',
    city,
    state,
    pincode,
    country: country || 'India',
    isDefault: Boolean(isDefault || user.addresses.length === 0),
  });

  await user.save();
  const addedAddress = user.addresses[user.addresses.length - 1];

  res.status(201).json({
    success: true,
    message: 'Address added successfully.',
    data: { address: addedAddress, addresses: user.addresses },
  });
});

/**
 * PUT /api/user/addresses/:id
 */
const updateAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const address = user.addresses.id(req.params.id);
  if (!address) throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');

  const { fullName, phone, addressLine1, addressLine2, city, state, pincode, country, isDefault } = req.body;

  if (isDefault) {
    user.addresses.forEach((a) => (a.isDefault = false));
    address.isDefault = true;
  }

  if (fullName !== undefined) address.fullName = fullName;
  if (phone !== undefined) address.phone = phone;
  if (addressLine1 !== undefined) address.addressLine1 = addressLine1;
  if (addressLine2 !== undefined) address.addressLine2 = addressLine2;
  if (city !== undefined) address.city = city;
  if (state !== undefined) address.state = state;
  if (pincode !== undefined) address.pincode = pincode;
  if (country !== undefined) address.country = country;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address updated successfully.',
    data: { address, addresses: user.addresses },
  });
});

/**
 * DELETE /api/user/addresses/:id
 */
const deleteAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const address = user.addresses.id(req.params.id);
  if (!address) throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');

  const wasDefault = address.isDefault;
  address.deleteOne();

  if (wasDefault && user.addresses.length > 0) {
    user.addresses[0].isDefault = true;
  }

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Address deleted successfully.',
    data: { addresses: user.addresses },
  });
});

/**
 * PUT /api/user/addresses/:id/default
 */
const setDefaultAddress = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) throw new AppError('User not found.', 404, 'USER_NOT_FOUND');

  const address = user.addresses.id(req.params.id);
  if (!address) throw new AppError('Address not found.', 404, 'ADDRESS_NOT_FOUND');

  user.addresses.forEach((a) => (a.isDefault = false));
  address.isDefault = true;

  await user.save();

  res.status(200).json({
    success: true,
    message: 'Default address updated.',
    data: { addresses: user.addresses },
  });
});

/**
 * GET /api/user/wishlist
 */
const getWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).populate({
    path: 'wishlist',
    match: { isActive: true },
    select: 'name price images category stock isActive',
  });

  res.status(200).json({
    success: true,
    data: { wishlist: user?.wishlist || [] },
  });
});

/**
 * POST /api/user/wishlist/:productId
 */
const addToWishlist = asyncHandler(async (req, res) => {
  const product = await Product.findOne({ _id: req.params.productId, isActive: true });
  if (!product) {
    throw new AppError('Product not found.', 404, 'PRODUCT_NOT_FOUND');
  }

  const user = await User.findById(req.user._id);
  if (!user.wishlist.some((id) => id.toString() === product._id.toString())) {
    user.wishlist.push(product._id);
    await user.save();
  }

  res.status(200).json({
    success: true,
    message: 'Product added to wishlist.',
    data: { wishlist: user.wishlist },
  });
});

/**
 * DELETE /api/user/wishlist/:productId
 */
const removeFromWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  user.wishlist = user.wishlist.filter(
    (id) => id.toString() !== req.params.productId
  );
  await user.save();

  res.status(200).json({
    success: true,
    message: 'Product removed from wishlist.',
    data: { wishlist: user.wishlist },
  });
});

module.exports = {
  getProfile,
  updateProfile,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  getWishlist,
  addToWishlist,
  removeFromWishlist,
};
