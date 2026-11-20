import jwt from 'jsonwebtoken';

export function authenticateAdmin(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({
      success: false,
      ok: false,
      message: 'Authentication token missing or invalid format. Please log in.'
    });
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'wedding_jwt_secret_fallback';

  try {
    const decoded = jwt.verify(token, secret);
    req.admin = decoded;
    next();
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        ok: false,
        message: 'Session expired. Please log in again.'
      });
    }
    return res.status(401).json({
      success: false,
      ok: false,
      message: 'Invalid authorization token.'
    });
  }
}

