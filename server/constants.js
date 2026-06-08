/**
 * @fileoverview Server-side constants for CarbonWise.
 * Eliminates magic numbers and strings throughout the server codebase.
 *
 * @module constants
 * @version 1.0.0
 */

/** @constant {object} HTTP - Standard HTTP status codes */
export const HTTP = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  TOO_MANY_REQUESTS: 429,
  INTERNAL_SERVER_ERROR: 500,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
};

/** @constant {object} ERROR_CODES - Application error codes */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  NOT_FOUND: 'NOT_FOUND',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
};

/** @constant {object} CACHE_PREFIXES - Cache key namespace prefixes */
export const CACHE_PREFIXES = {
  CALCULATE: 'calculate',
  INSIGHTS: 'insights',
  ACTIONS: 'actions',
};

/** @constant {object} LOG_SEVERITIES - Cloud Logging severity levels */
export const LOG_SEVERITIES = {
  INFO: 'INFO',
  WARNING: 'WARNING',
  ERROR: 'ERROR',
  CRITICAL: 'CRITICAL',
};
