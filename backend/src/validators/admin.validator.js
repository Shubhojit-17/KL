'use strict';

const Joi = require('joi');

const assignAdmin = Joi.object({
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
});

module.exports = { assignAdmin };
