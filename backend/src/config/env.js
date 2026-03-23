'use strict';

/**
 * Environment variable validation.
 * Fails server startup immediately if any required variable is missing.
 */

const REQUIRED_ENV_VARS = [
  'PORT',
  'MONGO_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'GOOGLE_CLIENT_ID',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'RAZORPAY_WEBHOOK_SECRET',
  'FRONTEND_URL',
  'SUPER_ADMIN_EMAIL',
];

function validateEnv() {
  const missing = REQUIRED_ENV_VARS.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    const message = `FATAL: Missing required environment variables:\n  ${missing.join('\n  ')}`;
    // eslint-disable-next-line no-console
    console.error(message);
    process.exit(1);
  }

  const weakSecrets = ['JWT_SECRET', 'JWT_REFRESH_SECRET'].filter(
    (key) => String(process.env[key] || '').length < 32
  );

  if (weakSecrets.length > 0) {
    const message = `FATAL: Weak secrets detected (must be at least 32 chars):\n  ${weakSecrets.join('\n  ')}`;
    // eslint-disable-next-line no-console
    console.error(message);
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const origins = String(process.env.FRONTEND_URL || '')
      .split(',')
      .map((u) => u.trim())
      .filter(Boolean);

    const nonHttpsOrigins = origins.filter((origin) => !origin.startsWith('https://'));
    if (nonHttpsOrigins.length > 0) {
      const message = `FATAL: FRONTEND_URL must use HTTPS in production:\n  ${nonHttpsOrigins.join('\n  ')}`;
      // eslint-disable-next-line no-console
      console.error(message);
      process.exit(1);
    }
  }
}

module.exports = { validateEnv };
