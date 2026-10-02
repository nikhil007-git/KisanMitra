const rateLimit = require('express-rate-limit');
const config = require('../config');

/**
 * Global rate limiter for standard API endpoints.
 * Configurable via RATE_LIMIT_WINDOW_MS and RATE_LIMIT_MAX.
 */
const apiLimiter = rateLimit({
  windowMs: config.rateLimit?.windowMs || 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit?.max || 100, // 100 requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
    timestamp: new Date().toISOString(),
  },
});

/**
 * Strict rate limiter for authentication routes (login and registration)
 * to mitigate brute force credential attacks and automated account creation.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // 10 requests per IP per 15 min
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
    timestamp: new Date().toISOString(),
  },
});

/**
 * Rate limiter for AI Assistant chat endpoint to prevent abuse,
 * denial-of-wallet, and denial-of-service on external LLM APIs.
 */
const aiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: config.rateLimit?.aiMax || 25, // 25 chat requests per 15 min per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'AI assistant request limit reached. Please wait a few minutes before sending more messages.',
    timestamp: new Date().toISOString(),
  },
});

module.exports = {
  apiLimiter,
  authLimiter,
  aiLimiter,
};
