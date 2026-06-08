/**
 * @fileoverview Dedicated logging module for CarbonWise.
 * Provides a structured Pino logger instance configured for Cloud Run.
 * Uses pino-pretty in development for readable output.
 *
 * @module logger
 * @version 1.0.0
 */

import pino from 'pino';
import config from './config.js';

/**
 * Structured JSON logger for Cloud Run observability.
 * Uses pino-pretty transport in development for readable console output.
 *
 * @type {import('pino').Logger}
 */
export const logger = pino({
  level: config.logLevel,
  transport: config.nodeEnv !== 'production' ? { target: 'pino-pretty' } : undefined,
});
