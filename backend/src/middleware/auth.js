'use strict';

const jwt = require('jsonwebtoken');
const User = require('../models/User');
const AppError = require('../utils/AppError');

/**
 * Auth middleware – Verifies JWT from HttpOnly cookie.
 * Attaches req.user (full Mongoose document) on success.
 */
async function auth(req, _res, next) {
  try {
    const token = req.cookies?.token;
    if (!token) {
      throw new AppError('Authentication required. Please log in.', 401, 'NO_TOKEN');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET, {
        algorithms: ['HS256'],
      });
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        throw new AppError('Session expired. Please log in again.', 401, 'TOKEN_EXPIRED');
      }
      throw new AppError('Invalid authentication token.', 401, 'INVALID_TOKEN');
    }

    if (decoded.type !== 'access') {
      throw new AppError('Invalid authentication token type.', 401, 'INVALID_TOKEN_TYPE');
    }

    const user = await User.findById(decoded.userId).lean();
    if (!user) {
      throw new AppError('User account not found.', 401, 'USER_NOT_FOUND');
    }

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}

module.exports = auth;
