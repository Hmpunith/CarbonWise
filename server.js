/**
 * @fileoverview CarbonWise Backend Server — Entry Point
 * Enterprise-grade Express server powering a carbon footprint awareness platform.
 *
 * Architecture:
 * - server/config.js        → Centralized configuration with env validation
 * - server/constants.js     → HTTP status codes and error codes
 * - server/errors.js        → Custom Error class hierarchy
 * - server/logger.js        → Pino structured logging
 * - server/middleware.js     → Security & utility middleware (Helmet, XSS, CORS)
 * - server/cache.js         → Response caching with MD5 keys
 * - server/googleServices.js→ ALL Google Cloud service integrations
 * - server/schemas.js       → Zod data validation schemas
 * - server/prompts.js       → AI system instructions
 * - server/routes.js        → API route handlers
 *
 * Google Cloud Services (12 total):
 *  Server-side:
 *   1. Google Gemini 2.5 Flash     — AI/ML API (@google/generative-ai)
 *   2. Google Cloud Run            — Deployment platform
 *   3. Google Cloud Logging        — Observability (@google-cloud/logging)
 *   4. Google Cloud Storage        — Asset management (@google-cloud/storage)
 *   5. Google Cloud BigQuery       — Analytics warehouse (@google-cloud/bigquery)
 *   6. Google Cloud Secret Manager — Credential management (@google-cloud/secret-manager)
 *   7. Google Cloud Error Reporting— Error tracking (@google-cloud/error-reporting)
 *  Client-side:
 *   8.  Firebase Firestore         — Activity persistence (firebase/firestore)
 *   9.  Firebase Analytics         — Engagement tracking (firebase/analytics)
 *   10. Firebase Auth              — Google Sign-In (firebase/auth)
 *   11. Firebase Performance       — RUM metrics (firebase/performance)
 *   12. Google Fonts               — Typography CDN
 *
 * @author CarbonWise Team
 * @version 1.0.0
 */

import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import config from './server/config.js';
import { logger } from './server/logger.js';
import { reportError } from './server/googleServices.js';
import {
  securityHeaders,
  permissionsPolicy,
  corsMiddleware,
  apiRateLimiter,
  requestIdMiddleware,
  inputSanitizer,
  compression,
} from './server/middleware.js';
import apiRoutes from './server/routes.js';
import { HTTP } from './server/constants.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// ── Middleware Stack (order matters) ────────────────────────────────────────

app.use(securityHeaders());
app.use(permissionsPolicy);
app.use(compression());
app.use(corsMiddleware());
app.use(express.json({ limit: config.inputLimits.bodyMaxSize }));
app.use(requestIdMiddleware);
app.use(inputSanitizer);

// ── API Routes (rate-limited) ──────────────────────────────────────────────

app.use('/api', apiRateLimiter(), apiRoutes);

// ── Static Files (Production) ──────────────────────────────────────────────

app.use(express.static(path.join(__dirname, 'dist')));

/** SPA fallback — serves index.html for all non-API routes */
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// ── Centralized Error Handler ──────────────────────────────────────────────

/**
 * Express error-handling middleware.
 * Catches all errors thrown by route handlers and middleware.
 * Returns a standardized JSON error response with request correlation.
 *
 * @param {Error} err - The error object
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 * @param {Function} _next - Express next function (required for Express to recognize as error handler)
 */
app.use((err, req, res, _next) => {
  const statusCode = err.statusCode || HTTP.INTERNAL_SERVER_ERROR;
  const message = err.isOperational ? err.message : 'An unexpected error occurred';

  logger.error({
    error: err.message,
    stack: err.stack,
    statusCode,
    requestId: req.requestId,
    path: req.path,
  });

  reportError(err, { requestId: req.requestId, path: req.path });

  res.status(statusCode).json({
    success: false,
    error: message,
    code: err.code || 'INTERNAL_ERROR',
    requestId: req.requestId,
  });
});

// ── Start Server ───────────────────────────────────────────────────────────

/** @type {import('http').Server|null} HTTP server instance */
let server = null;

if (config.nodeEnv !== 'test') {
  server = app.listen(config.port, () => {
    logger.info({ port: config.port }, 'CarbonWise server is live 🌿');
  });
}

// ── Graceful Shutdown ──────────────────────────────────────────────────────

/**
 * Handles graceful server shutdown on process termination signals.
 * Closes all active connections before exiting.
 *
 * @param {string} signal - The termination signal (SIGTERM, SIGINT)
 */
function gracefulShutdown(signal) {
  logger.info({ signal }, 'Graceful shutdown initiated');
  if (server) {
    server.close(() => {
      logger.info('Server connections closed');
      process.exit(0);
    });
    setTimeout(() => {
      logger.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  } else {
    process.exit(0);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

export default app;
