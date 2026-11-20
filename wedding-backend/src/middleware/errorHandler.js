export function errorHandler(err, req, res, next) {
  // If response headers were already sent, delegate to default Express handler
  if (res.headersSent) {
    return next(err);
  }

  // Mongoose Validation Error
  if (err.name === 'ValidationError') {
    const fields = {};
    for (const key in err.errors) {
      fields[key] = err.errors[key].message;
    }
    return res.status(400).json({
      ok: false,
      success: false,
      message: 'Please check the submitted information.',
      fields
    });
  }

  // Mongoose CastError (e.g. malformed ObjectId in route param)
  if (err.name === 'CastError') {
    return res.status(400).json({
      ok: false,
      success: false,
      message: `Invalid identifier format for ${err.path || 'record'}.`
    });
  }

  // Mongoose duplicate key error (code 11000)
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue || {})[0] || 'record';
    return res.status(409).json({
      ok: false,
      success: false,
      message: `A submission with this ${field} has already been recorded.`
    });
  }

  // Malformed JSON payload
  if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    return res.status(400).json({
      ok: false,
      success: false,
      message: 'Malformed JSON payload.'
    });
  }

  // JWT Errors
  if (err.name === 'JsonWebTokenError' || err.name === 'TokenExpiredError') {
    return res.status(401).json({
      ok: false,
      success: false,
      message: err.name === 'TokenExpiredError'
        ? 'Session expired. Please log in again.'
        : 'Invalid authorization token.'
    });
  }

  // CORS Error
  if (err.message && err.message.includes('CORS blocked')) {
    return res.status(403).json({
      ok: false,
      success: false,
      message: 'Access denied: origin not allowed by CORS policy.'
    });
  }

  // Generic server error
  const statusCode = err.status || err.statusCode || 500;
  if (statusCode === 500) {
    console.error('[Internal Server Error]', err);
  }

  res.status(statusCode).json({
    ok: false,
    success: false,
    message: statusCode === 500 ? 'An unexpected server error occurred.' : err.message
  });
}
