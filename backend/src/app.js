'use strict';

const express = require('express');
const helmet = require('helmet');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const compression = require('compression');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const routes = require('./routes');
const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { apiLimiter } = require('./middleware/rateLimiter');
const createOriginGuard = require('./middleware/originGuard');
const logger = require('./utils/logger');

const app = express();
app.disable('x-powered-by');

const isProd = process.env.NODE_ENV === 'production';

// ──────────────────────────────────────────────
// 1. Security headers
// ──────────────────────────────────────────────
app.use(helmet());

// ──────────────────────────────────────────────
// 2. CORS – strict origin in production
// ──────────────────────────────────────────────
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((u) => u.trim())
  : [];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, Postman, server-to-server)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      // In development allow localhost origins
      if (!isProd && /^https?:\/\/localhost(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  })
);

// Protect state-changing API routes against untrusted origins.
app.use(
  '/api',
  createOriginGuard({
    allowedOrigins,
    isProd,
    excludePaths: ['/payment/webhook'],
  })
);

// ──────────────────────────────────────────────
// 3. Razorpay webhook needs raw body for signature verification
//    MUST come before express.json()
// ──────────────────────────────────────────────
app.use(
  '/api/payment/webhook',
  express.raw({ type: 'application/json', limit: '1mb' }),
  (req, _res, next) => {
    // Store the raw body for webhook signature verification
    if (Buffer.isBuffer(req.body)) {
      req.rawBody = req.body.toString('utf-8');
      try {
        req.body = JSON.parse(req.rawBody);
      } catch {
        req.body = {};
      }
    }
    next();
  }
);

// ──────────────────────────────────────────────
// 4. Body parsers with size limits
// ──────────────────────────────────────────────
app.use(express.json({ limit: '10kb' })); // prevent excessive payload
app.use(express.urlencoded({ extended: false, limit: '10kb' }));

// ──────────────────────────────────────────────
// 5. Cookie parser
// ──────────────────────────────────────────────
app.use(cookieParser());

// ──────────────────────────────────────────────
// 6. Sanitize data – prevent NoSQL injection
// ──────────────────────────────────────────────
app.use(mongoSanitize());

// ──────────────────────────────────────────────
// 7. Prevent HTTP parameter pollution
// ──────────────────────────────────────────────
app.use(hpp());

// ──────────────────────────────────────────────
// 8. Compression
// ──────────────────────────────────────────────
app.use(compression());

// ──────────────────────────────────────────────
// 9. Logging
// ──────────────────────────────────────────────
if (isProd) {
  // Concise output for production
  app.use(morgan('combined', {
    stream: { write: (msg) => logger.info(msg.trim()) },
  }));
} else {
  app.use(morgan('dev'));
}

// ──────────────────────────────────────────────
// 10. Global rate limiter
// ──────────────────────────────────────────────
app.use('/api', apiLimiter);

// ──────────────────────────────────────────────
// 11. API routes
// ──────────────────────────────────────────────
app.use('/api', routes);

// ──────────────────────────────────────────────
// 12. 404 + Error handler
// ──────────────────────────────────────────────
app.use(notFound);
app.use(errorHandler);

module.exports = app;
