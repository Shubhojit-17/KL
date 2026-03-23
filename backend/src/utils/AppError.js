'use strict';

/**
 * Custom application error class.
 * Allows controllers to throw with a status code.
 */
class AppError extends Error {
  /**
   * @param {string} message – Human-readable error message
   * @param {number} statusCode – HTTP status code
   * @param {string} [code] – Optional machine-readable error code
   */
  constructor(message, statusCode, code) {
    super(message);
    this.statusCode = statusCode;
    this.code = code || 'ERROR';
    this.isOperational = true; // distinguishes expected errors from bugs
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
