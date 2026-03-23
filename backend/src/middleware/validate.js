'use strict';

const AppError = require('../utils/AppError');

/**
 * Creates a middleware that validates req.body against a Joi schema.
 * @param {import('joi').ObjectSchema} schema
 */
function validate(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true, // remove fields not in schema
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('. ');
      return next(new AppError(messages, 400, 'VALIDATION_ERROR'));
    }

    req.body = value; // use sanitized body
    next();
  };
}

/**
 * Creates a middleware that validates req.query against a Joi schema.
 */
function validateQuery(schema) {
  return (req, _res, next) => {
    const { error, value } = schema.validate(req.query, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const messages = error.details.map((d) => d.message).join('. ');
      return next(new AppError(messages, 400, 'VALIDATION_ERROR'));
    }

    req.query = value;
    next();
  };
}

module.exports = { validate, validateQuery };
