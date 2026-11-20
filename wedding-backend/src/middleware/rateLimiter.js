import rateLimit from 'express-rate-limit';

export const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    success: false,
    message: 'Too many submissions from this connection. Please try again after a few minutes.'
  }
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    ok: false,
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.'
  }
});

