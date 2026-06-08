/**
 * @fileoverview Application configuration module for CarbonWise.
 * Centralizes all server-side configuration with environment variable fallbacks.
 * Validates required environment variables on startup.
 *
 * @module config
 * @version 1.0.0
 */

import dotenv from 'dotenv';

dotenv.config();

/**
 * Validates that all required environment variables are set.
 * Logs warnings for missing optional variables.
 *
 * @param {string[]} required - List of required env var names
 * @returns {void}
 */
function validateEnv(required) {
  const missing = required.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    console.warn(`[CarbonWise] Warning: Missing environment variables: ${missing.join(', ')}. Using fallback values.`);
  }
}

validateEnv(['GEMINI_API_KEY']);

/**
 * @constant {object} config - Server configuration object
 * @property {number} port - Server port (default: 8080 for Cloud Run)
 * @property {string} nodeEnv - Current environment
 * @property {string} logLevel - Logging verbosity
 * @property {string} corsOrigin - Allowed CORS origin
 * @property {object} rateLimit - Rate limiting configuration
 * @property {object} cache - Caching configuration
 * @property {object} gemini - Google Gemini AI configuration
 * @property {object} inputLimits - Input validation limits
 */
const config = {
  port: parseInt(process.env.PORT, 10) || 8080,
  nodeEnv: process.env.NODE_ENV || 'development',
  logLevel: process.env.LOG_LEVEL || 'info',
  corsOrigin: process.env.CORS_ORIGIN || '*',

  rateLimit: {
    windowMs: 60 * 1000,
    max: 20,
  },

  cache: {
    stdTTL: 600,
    checkperiod: 120,
  },

  gemini: {
    apiKey: process.env.GEMINI_API_KEY,
    model: 'gemini-2.5-flash',
    fallbackModel: 'gemini-2.0-flash',
    temperature: 0.2,
    topP: 0.8,
    maxOutputTokens: 2048,
  },

  inputLimits: {
    activityMaxLength: 1000,
    categoryMaxLength: 200,
    insightsDataMaxLength: 5000,
    bodyMaxSize: '500kb',
  },
};

export default config;
