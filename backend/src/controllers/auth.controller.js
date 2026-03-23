'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { verifyGoogleToken } = require('../config/google');
const {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require('../services/token.service');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

/**
 * POST /api/auth/google
 * Verify Google ID token, create/find user, issue JWT.
 */
const googleLogin = asyncHandler(async (req, res) => {
  const { idToken } = req.body;

  // Server-side verification – never trust client-supplied profile data
  const googleUser = await verifyGoogleToken(idToken);

  if (!googleUser.emailVerified) {
    throw new AppError('Google account email is not verified.', 400, 'EMAIL_NOT_VERIFIED');
  }

  // Find or create user
  let user = await User.findOne({ googleId: googleUser.googleId });

  if (!user) {
    // Auto-assign admin role for designated email (from env, never hardcoded)
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
    const role = superAdminEmail && googleUser.email.toLowerCase() === superAdminEmail ? 'admin' : 'user';

    user = await User.create({
      name: googleUser.name,
      email: googleUser.email,
      googleId: googleUser.googleId,
      role,
    });

    logger.info('New user registered', { email: user.email, role: user.role });
  }

  // Generate tokens
  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);

  // Set HttpOnly cookies
  setAuthCookies(res, accessToken, refreshToken);

  logger.info('User logged in', { email: user.email });

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * POST /api/auth/refresh
 * Issue a new access token using the refresh token.
 */
const refreshAccessToken = asyncHandler(async (req, res) => {
  const refreshTokenCookie = req.cookies?.refreshToken;

  if (!refreshTokenCookie) {
    throw new AppError('No refresh token provided.', 401, 'NO_REFRESH_TOKEN');
  }

  let decoded;
  try {
    decoded = jwt.verify(refreshTokenCookie, process.env.JWT_REFRESH_SECRET, {
      algorithms: ['HS256'],
    });
  } catch (err) {
    clearAuthCookies(res);
    if (err.name === 'TokenExpiredError') {
      throw new AppError('Refresh token expired. Please log in again.', 401, 'REFRESH_EXPIRED');
    }
    throw new AppError('Invalid refresh token.', 401, 'INVALID_REFRESH_TOKEN');
  }

  if (decoded.type !== 'refresh') {
    throw new AppError('Invalid token type.', 401, 'INVALID_TOKEN_TYPE');
  }

  const user = await User.findById(decoded.userId).lean();
  if (!user) {
    clearAuthCookies(res);
    throw new AppError('User not found.', 401, 'USER_NOT_FOUND');
  }

  // Issue new access token
  const newAccessToken = generateAccessToken(user._id);
  const newRefreshToken = generateRefreshToken(user._id);
  setAuthCookies(res, newAccessToken, newRefreshToken);

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    },
  });
});

/**
 * POST /api/auth/logout
 * Clear auth cookies.
 */
const logout = asyncHandler(async (_req, res) => {
  clearAuthCookies(res);
  res.status(200).json({ success: true, message: 'Logged out successfully.' });
});

/**
 * GET /api/auth/me
 * Get current authenticated user.
 */
const getMe = asyncHandler(async (req, res) => {
  res.status(200).json({
    success: true,
    data: {
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
      },
    },
  });
});

module.exports = { googleLogin, refreshAccessToken, logout, getMe };
