/**
 * @file RateLimiter.ts
 * @description Control de densidad de peticiones HTTP en fronteras públicas.
 */
import rateLimit from 'express-rate-limit';

export const webhookRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // Ventana de control: 1 minuto
  max: 120,                // Máximo de peticiones permitidas por IP
  message: {
    success: false,
    error: 'Demasiadas peticiones dirigidas al Webhook. Tráfico restringido por seguridad.'
  },
  standardHeaders: true,   // Retorna info de límites en los headers (RateLimit-Limit)
  legacyHeaders: false,
});
