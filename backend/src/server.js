'use strict';

// Load environment variables FIRST
require('dotenv').config();

const { validateEnv } = require('./config/env');
validateEnv(); // exits if any required env var is missing

const app = require('./app');
const { connectDB } = require('./config/db');
const logger = require('./utils/logger');

const PORT = parseInt(process.env.PORT, 10) || 5000;

// ──────────────────────────────────────────────
// Handle uncaught exceptions (sync errors)
// ──────────────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('UNCAUGHT EXCEPTION – Shutting down...', {
    name: err.name,
    message: err.message,
    stack: err.stack,
  });
  process.exit(1);
});

// ──────────────────────────────────────────────
// Start server
// ──────────────────────────────────────────────
async function startServer() {
  await connectDB();

  const server = app.listen(PORT, () => {
    logger.info(`Server running on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });

  // ──────────────────────────────────────────
  // Handle unhandled promise rejections
  // ──────────────────────────────────────────
  process.on('unhandledRejection', (err) => {
    logger.error('UNHANDLED REJECTION – Shutting down...', {
      name: err.name,
      message: err.message,
      stack: err.stack,
    });
    server.close(() => {
      process.exit(1);
    });
  });

  // ──────────────────────────────────────────
  // Graceful shutdown on SIGTERM
  // ──────────────────────────────────────────
  process.on('SIGTERM', () => {
    logger.info('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });

  process.on('SIGINT', () => {
    logger.info('SIGINT received. Shutting down gracefully...');
    server.close(() => {
      logger.info('Server closed.');
      process.exit(0);
    });
  });
}

startServer();
