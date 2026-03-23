'use strict';

const AppError = require('../utils/AppError');

/**
 * 404 handler – catches all unmatched routes.
 */
function notFound(req, _res, next) {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, 'NOT_FOUND'));
}

module.exports = notFound;
