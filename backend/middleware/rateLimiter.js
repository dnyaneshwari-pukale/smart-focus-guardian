/**
 * Basic Rate Limiting Middleware
 * Protects endpoints from excessive flooding.
 */
const rateLimit = require('express-rate-limit');

const generalLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 120, // Limit each IP to 120 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too many requests. Please slow down and try again shortly.'
  }
});

const deviceLimiter = rateLimit({
  windowMs: 10 * 1000, // 10 seconds
  max: 60, // Limit device polling/ingestion to 60 requests per 10s
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Device rate limit exceeded.'
  }
});

module.exports = { generalLimiter, deviceLimiter };
