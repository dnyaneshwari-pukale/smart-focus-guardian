/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  console.error('[API Error]:', err);

  const status = err.statusCode || (err.status >= 400 && err.status < 600 ? err.status : 500);
  const message = err.message || 'An unexpected internal server error occurred.';

  res.status(status).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_SERVER_ERROR',
    timestamp: new Date().toISOString()
  });
}

module.exports = { errorHandler };
