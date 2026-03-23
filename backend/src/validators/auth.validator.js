'use strict';

const Joi = require('joi');

const googleLogin = Joi.object({
  idToken: Joi.string().required().messages({
    'string.empty': 'Google ID token is required',
    'any.required': 'Google ID token is required',
  }),
});

module.exports = { googleLogin };
