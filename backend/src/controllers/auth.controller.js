'use strict';

const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { verifyGoogleToken } = require('../config/google');
const {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
} = require('../services/token.service');
const emailService = require('../services/email.service');
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
  let user = await User.findOne({
    $or: [{ googleId: googleUser.googleId }, { email: googleUser.email.toLowerCase() }],
  });

  const isNew = !user;

  if (!user) {
    const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
    const role = superAdminEmail && googleUser.email.toLowerCase() === superAdminEmail ? 'admin' : 'user';

    user = await User.create({
      name: googleUser.name,
      email: googleUser.email.toLowerCase(),
      googleId: googleUser.googleId,
      authProvider: 'google',
      role,
    });

    logger.info('New user registered via Google', { email: user.email, role: user.role });
    emailService.sendWelcomeEmail(user).catch(() => {});
  } else if (!user.googleId) {
    // Link existing account with Google ID
    user.googleId = googleUser.googleId;
    await user.save();
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
 * POST /api/auth/register
 * Register with email and password
 */
const registerLocal = asyncHandler(async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    throw new AppError('Name, email, and password are required.', 400, 'VALIDATION_ERROR');
  }

  if (password.length < 6) {
    throw new AppError('Password must be at least 6 characters.', 400, 'PASSWORD_TOO_SHORT');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existingUser = await User.findOne({ email: normalizedEmail });

  if (existingUser) {
    throw new AppError('An account with this email already exists. Please log in.', 400, 'EMAIL_EXISTS');
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const superAdminEmail = (process.env.SUPER_ADMIN_EMAIL || '').toLowerCase();
  const role = superAdminEmail && normalizedEmail === superAdminEmail ? 'admin' : 'user';

  const user = await User.create({
    name: name.trim(),
    email: normalizedEmail,
    password: hashedPassword,
    authProvider: 'local',
    role,
  });

  emailService.sendWelcomeEmail(user).catch(() => {});

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setAuthCookies(res, accessToken, refreshToken);

  logger.info('New local user registered', { email: user.email, role: user.role });

  res.status(201).json({
    success: true,
    message: 'Registration successful.',
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
 * POST /api/auth/login
 * Log in with email and password
 */
const loginLocal = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    throw new AppError('Email and password are required.', 400, 'VALIDATION_ERROR');
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await User.findOne({ email: normalizedEmail }).select('+password');

  if (!user) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  if (!user.password) {
    throw new AppError('This account was registered using Google. Please sign in with Google.', 400, 'GOOGLE_AUTH_REQUIRED');
  }

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new AppError('Invalid email or password.', 401, 'INVALID_CREDENTIALS');
  }

  const accessToken = generateAccessToken(user._id);
  const refreshToken = generateRefreshToken(user._id);
  setAuthCookies(res, accessToken, refreshToken);

  logger.info('User logged in with credentials', { email: user.email });

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

module.exports = {
  googleLogin,
  registerLocal,
  loginLocal,
  refreshAccessToken,
  logout,
  getMe,
};
