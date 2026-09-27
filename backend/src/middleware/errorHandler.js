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
  let code;

  // Mongoose-specific errors (check before generic err.code to avoid
  // conflating Mongoose's numeric err.code=11000 with application error codes)
  if (err.name === 'ValidationError') {
    statusCode = 400;
    code = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors).map((e) => e.message);
    message = messages.join('. ');
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    statusCode = 409;
    code = 'DUPLICATE_KEY';
    const field = Object.keys(err.keyValue || {}).join(', ');
    message = `Duplicate value for: ${field}`;
  } else if (err.name === 'CastError') {
    // Mongoose cast error (bad ObjectId)
    statusCode = 400;
    code = 'INVALID_ID';
    message = `Invalid ${err.path}: ${err.value}`;
  } else {
    code = err.code || 'INTERNAL_ERROR';
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
