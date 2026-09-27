'use strict';

const express = require('express');
const router = express.Router();
const authController = require('../controllers/auth.controller');
const auth = require('../middleware/auth');
const { validate } = require('../middleware/validate');
const { authLimiter } = require('../middleware/rateLimiter');
const authValidator = require('../validators/auth.validator');

// POST /api/auth/google – Google ID token login
router.post(
  '/google',
  authLimiter,
  validate(authValidator.googleLogin),
  authController.googleLogin
);

// POST /api/auth/register – Email/password registration
router.post('/register', authLimiter, authController.registerLocal);

// POST /api/auth/login – Email/password login
router.post('/login', authLimiter, authController.loginLocal);

// POST /api/auth/refresh – Refresh access token
router.post('/refresh', authLimiter, authController.refreshAccessToken);

// POST /api/auth/logout – Clear cookies
router.post('/logout', authController.logout);

// GET /api/auth/me – Authenticated user profile
router.get('/me', auth, authController.getMe);

module.exports = router;
