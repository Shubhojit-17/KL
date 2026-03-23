'use strict';

const AppError = require('../utils/AppError');

/**
 * Admin middleware – Must be used AFTER auth middleware.
 * Checks that the authenticated user has admin role.
 */
function admin(req, _res, next) {
  if (!req.user) {
    return next(new AppError('Authentication required.', 401, 'NO_USER'));
  }
  if (req.user.role !== 'admin') {
    return next(new AppError('Access denied. Admin privileges required.', 403, 'FORBIDDEN'));
  }
  next();
}

module.exports = admin;
