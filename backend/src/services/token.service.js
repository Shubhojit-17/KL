'use strict';

const jwt = require('jsonwebtoken');

const TOKEN_EXPIRY = '30m'; // 30 minutes
const REFRESH_TOKEN_EXPIRY = '7d'; // 7 days

function getAccessSecret() {
  return process.env.JWT_SECRET;
}

function getRefreshSecret() {
  return process.env.JWT_REFRESH_SECRET;
}

/**
 * Generate a short-lived access token.
 */
function generateAccessToken(userId) {
  return jwt.sign({ userId, type: 'access' }, getAccessSecret(), {
    expiresIn: TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

/**
 * Generate a longer-lived refresh token.
 */
function generateRefreshToken(userId) {
  return jwt.sign({ userId, type: 'refresh' }, getRefreshSecret(), {
    expiresIn: REFRESH_TOKEN_EXPIRY,
    algorithm: 'HS256',
  });
}

/**
 * Set HttpOnly cookies for access and refresh tokens.
 */
function setAuthCookies(res, accessToken, refreshToken) {
  const isProd = process.env.NODE_ENV === 'production';
  const commonOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };

  res.cookie('token', accessToken, {
    ...commonOptions,
    maxAge: 30 * 60 * 1000, // 30 minutes
  });

  res.cookie('refreshToken', refreshToken, {
    ...commonOptions,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });
}

/**
 * Clear auth cookies.
 */
function clearAuthCookies(res) {
  const isProd = process.env.NODE_ENV === 'production';
  const commonOptions = {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
  };

  res.clearCookie('token', commonOptions);
  res.clearCookie('refreshToken', commonOptions);
}

module.exports = {
  generateAccessToken,
  generateRefreshToken,
  setAuthCookies,
  clearAuthCookies,
};
