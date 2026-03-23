'use strict';

/**
 * Structured logger.
 * In production uses JSON for log aggregation; in dev uses readable format.
 */

const isProd = process.env.NODE_ENV === 'production';

function formatMessage(level, message, meta) {
  if (isProd) {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(meta && { meta }),
    });
  }
  const ts = new Date().toISOString();
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
  return `[${ts}] ${level.toUpperCase()}: ${message}${metaStr}`;
}

const logger = {
  info(message, meta) {
    // eslint-disable-next-line no-console
    console.log(formatMessage('info', message, meta));
  },
  warn(message, meta) {
    // eslint-disable-next-line no-console
    console.warn(formatMessage('warn', message, meta));
  },
  error(message, meta) {
    // eslint-disable-next-line no-console
    console.error(formatMessage('error', message, meta));
  },
  debug(message, meta) {
    if (!isProd) {
      // eslint-disable-next-line no-console
      console.debug(formatMessage('debug', message, meta));
    }
  },
};

module.exports = logger;
