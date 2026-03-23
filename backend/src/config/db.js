'use strict';

const mongoose = require('mongoose');
const logger = require('../utils/logger');

async function connectDB() {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      // Mongoose 8 defaults are production-ready; explicit options for clarity
      autoIndex: process.env.NODE_ENV !== 'production', // disable auto-index in prod
    });
    logger.info(`MongoDB connected: ${conn.connection.host}`);
  } catch (err) {
    logger.error('MongoDB connection error:', err.message);
    process.exit(1);
  }

  mongoose.connection.on('error', (err) => {
    logger.error('MongoDB runtime error:', err.message);
  });

  mongoose.connection.on('disconnected', () => {
    logger.warn('MongoDB disconnected');
  });
}

module.exports = { connectDB };
