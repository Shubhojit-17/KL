'use strict';

const logger = require('../utils/logger');

const isProd = process.env.NODE_ENV === 'production';

/**
 * Global error handler middleware.
 * - Sends structured JSON errors.
 * - Strips stack traces in production.
 * - Logs all errors.
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, _next) {
  // Default values
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let code = err.code || 'INTERNAL_ERROR';

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  }

  // Mongoose duplicate key error
  if (err.code === 11000) {
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value for: ${field}`;
  }

  // Mongoose cast error (bad ObjectId)
  if (err.name === 'CastError') {
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  }

  // Log the error
  if (statusCode >= 500) {
    logger.error(`[${req.method}] ${req.originalUrl} – ${message}`, {
      stack: err.stack,
      statusCode,
    });
  } else {
    logger.warn(`[${req.method}] ${req.originalUrl} – ${message}`, { statusCode });
  }

  const response = {
    success: false,
    error: {
      code,
      message: isProd && statusCode === 500 ? 'Internal Server Error' : message,
    },
  };

  if (!isProd && err.stack) {
    response.error.stack = err.stack;
  }

  res.status(statusCode).json(response);
}

module.exports = errorHandler;
