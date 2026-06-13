const rateLimit = require('express-rate-limit');

exports.searchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // 100 requests por IP
  message: {
    success: false,
    message: 'Demasiadas búsquedas. Intenta más tarde.'
  },
  standardHeaders: true,
  legacyHeaders: false
});
