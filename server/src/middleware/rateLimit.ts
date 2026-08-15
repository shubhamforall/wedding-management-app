import rateLimit from 'express-rate-limit';

// Auth endpoints specifically (Section 29) — generous enough for normal
// use/retries, tight enough to blunt credential-stuffing/brute-force.
export const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: 'Too many attempts. Please try again later.' },
});
