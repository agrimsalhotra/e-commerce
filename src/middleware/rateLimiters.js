import rateLimit from "express-rate-limit";

function getClientIp(req) {
  return req.ip || req.socket.remoteAddress || "unknown";
}

// Protect login, registration, and other unauthenticated endpoints.
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 10,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  keyGenerator: (req) => getClientIp(req),

  message: {
    error: "Too many authentication attempts. Please try again later."
  }
});

// General API limiter.
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,

  limit: 100,

  standardHeaders: "draft-8",
  legacyHeaders: false,

  // Authenticated users are limited per tenant.
  // Unauthenticated requests are limited per IP.
  keyGenerator: (req) => {
    if (req.user?.tenantId != null) {
      return `tenant:${req.user.tenantId}`;
    }

    return getClientIp(req);
  },

  message: {
    error: "Too many requests. Please try again later."
  }
});