/**
 * @fileoverview Middleware module — Centralizes all Express middleware.
 * Security headers, compression, CORS, rate limiting, request tracking,
 * input sanitization, and Permissions-Policy.
 *
 * @module middleware
 * @version 2.0.0
 */

import helmet from 'helmet';
import cors from 'cors';
import compressionMiddleware from 'compression';
import { rateLimit } from 'express-rate-limit';
import crypto from 'crypto';
import xss from 'xss';
import config from './config.js';

/**
 * Configures Helmet security headers with a custom CSP
 * whitelisting Firebase, Google APIs, and Google Fonts.
 *
 * @returns {import('express').RequestHandler} Helmet middleware
 */
export function securityHeaders() {
  return helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com", "https://accounts.google.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        scriptSrc: [
          "'self'",
          "https://apis.google.com",
          "https://accounts.google.com",
          "https://www.gstatic.com",
          "https://www.googletagmanager.com",
          "https://*.firebaseapp.com",
        ],
        imgSrc: ["'self'", "data:", "https:", "https://www.gstatic.com", "https://lh3.googleusercontent.com"],
        connectSrc: [
          "'self'",
          "https://firestore.googleapis.com",
          "https://firebase.googleapis.com",
          "https://firebaseinstallations.googleapis.com",
          "https://www.googleapis.com",
          "https://identitytoolkit.googleapis.com",
          "https://securetoken.googleapis.com",
          "https://storage.googleapis.com",
          "https://firebaselogging-pa.googleapis.com",
          "https://content-firebaseappcheck.googleapis.com",
          "https://www.googletagmanager.com",
          "https://*.google-analytics.com",
          "https://*.analytics.google.com",
          "https://accounts.google.com",
        ],
        frameSrc: ["https://accounts.google.com", "https://*.firebaseapp.com"],
        formActionSrc: ["'self'", "https://accounts.google.com"],
      },
    },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  });
}

/**
 * Sets the Permissions-Policy header to restrict browser feature access.
 * This header is NOT set by Helmet and must be added manually.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function permissionsPolicy(req, res, next) {
  res.setHeader(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()',
  );
  next();
}

/**
 * Configures CORS middleware with the allowed origin from config.
 *
 * @returns {import('express').RequestHandler} CORS middleware
 */
export function corsMiddleware() {
  return cors({ origin: config.corsOrigin });
}

/**
 * Configures API rate limiting per IP address.
 * Default: 20 requests per minute per IP.
 *
 * @returns {import('express').RequestHandler} Rate limiter middleware
 */
export function apiRateLimiter() {
  return rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: { error: 'Too many requests. Please wait a moment before trying again.' },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

/**
 * Attaches a unique request ID (UUID v4) to every incoming request
 * for distributed tracing and security audit trails.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function requestIdMiddleware(req, res, next) {
  req.requestId = crypto.randomUUID();
  res.setHeader('X-Request-Id', req.requestId);
  next();
}

/**
 * Sanitizes all string values in the request body to prevent XSS attacks.
 * Strips dangerous HTML and JavaScript from user input.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function
 */
export function inputSanitizer(req, res, next) {
  if (req.body && typeof req.body === 'object') {
    for (const key of Object.keys(req.body)) {
      if (typeof req.body[key] === 'string') {
        req.body[key] = xss(req.body[key]);
      }
    }
  }
  next();
}

export { compressionMiddleware as compression };
