const { validationResult } = require('express-validator');
const { sendError } = require('../utils/response');

/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.path}:`, err.message);

  // Prisma known errors
  if (err.code === 'P2002') {
    return sendError(res, 'A record with this data already exists.', 409);
  }
  if (err.code === 'P2025') {
    return sendError(res, 'Record not found.', 404);
  }
  if (err.code === 'P2003') {
    return sendError(res, 'Related record not found.', 400);
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    return sendError(res, 'Invalid token.', 401);
  }
  if (err.name === 'TokenExpiredError') {
    return sendError(res, 'Token expired.', 401);
  }

  // Generic
  const statusCode = err.statusCode || err.status || 500;
  const message = err.message || 'Internal server error';
  return sendError(res, message, statusCode);
};

/**
 * 404 handler
 */
const notFound = (req, res) => {
  return sendError(res, `Route ${req.method} ${req.path} not found.`, 404);
};

/**
 * Validates express-validator results and sends 422 if invalid
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return sendError(res, 'Validation failed', 422, errors.array());
  }
  next();
};

module.exports = { errorHandler, notFound, validate };
