'use strict';

const AppError = require('../utils/AppError');

/**
 * Protects state-changing endpoints by allowing only trusted browser origins.
 * Webhooks and safe methods can be excluded.
 */
function createOriginGuard({ allowedOrigins = [], isProd = false, excludePaths = [] } = {}) {
  const safeMethods = new Set(['GET', 'HEAD', 'OPTIONS']);

  return function originGuard(req, _res, next) {
    if (safeMethods.has(req.method)) {
      return next();
    }

    const path = req.path || '';
    if (excludePaths.some((prefix) => path.startsWith(prefix))) {
      return next();
    }

    const origin = req.get('origin');

    if (!origin) {
      if (isProd) {
        return next(new AppError('Request origin is required.', 403, 'ORIGIN_REQUIRED'));
      }
      return next();
    }

    if (allowedOrigins.includes(origin)) {
      return next();
    }

    if (!isProd && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
      return next();
    }

    return next(new AppError('Origin not allowed for this operation.', 403, 'ORIGIN_FORBIDDEN'));
  };
}

module.exports = createOriginGuard;
