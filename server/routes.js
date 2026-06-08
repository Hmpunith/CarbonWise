/**
 * @fileoverview API route handlers for CarbonWise.
 * Each route is a clean, focused handler that delegates to Google Cloud services.
 * Integrates: Gemini AI, Cloud Logging, BigQuery, Error Reporting, Cache.
 *
 * @module routes
 * @version 1.0.0
 */

import express from 'express';
import { genAI, writeCloudLog, insertAnalytics, getStatistics, reportError } from './googleServices.js';
import { CalculationSchema, InsightsSchema, ActionsSchema } from './schemas.js';
import { CALCULATOR_INSTRUCTION, INSIGHTS_INSTRUCTION, ACTIONS_INSTRUCTION } from './prompts.js';
import { ValidationError, AIServiceError } from './errors.js';
import { generateCacheKey, getCached, setCache } from './cache.js';
import { logger } from './logger.js';
import config from './config.js';
import { HTTP } from './constants.js';

/**
 * Validates that a required string field is present and non-empty.
 * Throws a ValidationError if the field is missing, not a string, or empty.
 *
 * @param {*} value - The value to validate
 * @param {string} fieldName - Human-readable field name for error messages
 * @returns {string} The trimmed, validated string
 * @throws {ValidationError} When validation fails
 */
function validateRequiredString(value, fieldName) {
  if (!value || typeof value !== 'string' || value.trim().length === 0) {
    throw new ValidationError(`${fieldName} is required and must be a non-empty string.`);
  }
  return value.trim();
}

/**
 * Validates that the Gemini API key is configured.
 * Throws an AIServiceError if the key is missing.
 *
 * @throws {AIServiceError} When the API key is not configured
 */
function validateApiKey() {
  if (!config.gemini.apiKey) {
    throw new AIServiceError('Gemini AI service is not configured. Please set the GEMINI_API_KEY environment variable.');
  }
}

/** @type {express.Router} Express router for all API endpoints */
const router = express.Router();

/**
 * Calls Google Gemini with the given system instruction and user prompt.
 * Implements caching, JSON parsing, and Zod schema validation.
 *
 * @param {string} systemInstruction - The AI persona instruction
 * @param {string} userPrompt - The user's input
 * @param {import('zod').ZodSchema} schema - The Zod schema for validation
 * @param {string} cachePrefix - Cache key namespace prefix
 * @returns {Promise<object>} The validated AI response
 * @throws {AIServiceError} If the AI call or validation fails
 */
async function callGemini(systemInstruction, userPrompt, schema, cachePrefix) {
  const cacheKey = generateCacheKey(cachePrefix, userPrompt);
  const cached = getCached(cacheKey);

  if (cached) {
    return cached;
  }

  logger.info({ cacheKey: cacheKey.substring(0, 25) }, 'Cache Miss — Calling Gemini');

  const models = [config.gemini.model, config.gemini.fallbackModel];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction,
        generationConfig: {
          temperature: config.gemini.temperature,
          topP: config.gemini.topP,
          maxOutputTokens: config.gemini.maxOutputTokens,
          responseMimeType: 'application/json',
        },
      });

      const result = await model.generateContent(userPrompt);
      const response = await result.response;
      const text = response.text();

      let parsed;
      try {
        parsed = JSON.parse(text);
      } catch {
        logger.warn('JSON parse failed, attempting cleanup');
        const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
        parsed = JSON.parse(cleaned);
      }

      const validated = schema.safeParse(parsed);
      if (!validated.success) {
        logger.error({ errors: validated.error.issues }, 'Zod validation failed');
        throw new AIServiceError('AI response failed schema validation');
      }

      setCache(cacheKey, validated.data);
      return validated.data;
    } catch (err) {
      if (modelName !== models[models.length - 1] && (err.message?.includes('503') || err.message?.includes('429') || err.message?.includes('overloaded') || err.message?.includes('high demand') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED'))) {
        logger.warn({ model: modelName, fallback: models[models.length - 1] }, 'Primary model unavailable, trying fallback');
        continue;
      }
      // Wrap rate-limit / quota errors into a friendly message
      if (err.message?.includes('429') || err.message?.includes('quota') || err.message?.includes('RESOURCE_EXHAUSTED') || err.message?.includes('503') || err.message?.includes('high demand')) {
        throw new AIServiceError('AI service is temporarily busy. Please wait 30 seconds and try again.');
      }
      throw err;
    }
  }
}

// ── Route Handlers ─────────────────────────────────────────────────────────

/**
 * GET /api/health
 * Health check endpoint for Cloud Run load balancer probes.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
router.get('/health', (req, res) => {
  writeCloudLog('INFO', 'Health check', { requestId: req.requestId });
  res.status(HTTP.OK).json({
    status: 'healthy',
    service: 'carbonwise',
    timestamp: new Date().toISOString(),
    requestId: req.requestId,
  });
});

/**
 * POST /api/calculate
 * Calculates carbon footprint from a user-described activity.
 * Uses Gemini AI for intelligent carbon estimation with Zod validation.
 *
 * @param {import('express').Request} req - Express request with { activity: string }
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function for error handler
 * @throws {ValidationError} When activity input is missing or invalid
 * @throws {AIServiceError} When Gemini API or schema validation fails
 */
router.post('/calculate', async (req, res, next) => {
  try {
    const activity = validateRequiredString(req.body.activity, 'Activity description');

    validateApiKey();

    const result = await callGemini(
      CALCULATOR_INSTRUCTION,
      activity.substring(0, config.inputLimits.activityMaxLength),
      CalculationSchema,
      'calculate',
    );

    res.status(HTTP.OK).json(result);
    writeCloudLog('INFO', 'Carbon calculated', { requestId: req.requestId, category: result.category });

    // Async: Log calculation to BigQuery for analytics
    insertAnalytics({
      category: result.category,
      carbonKg: result.totalCarbonKg,
      impactLevel: result.impactLevel,
      requestId: req.requestId,
      action: 'calculated',
    }).catch(() => {});
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/insights
 * Generates personalized carbon insights from tracked user data.
 * Analyzes patterns and provides actionable reduction recommendations.
 *
 * @param {import('express').Request} req - Express request with { trackedData: string }
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function for error handler
 * @throws {ValidationError} When trackedData input is missing or invalid
 * @throws {AIServiceError} When Gemini API or schema validation fails
 */
router.post('/insights', async (req, res, next) => {
  try {
    const trackedData = validateRequiredString(req.body.trackedData, 'Tracked activity data');

    validateApiKey();

    const result = await callGemini(
      INSIGHTS_INSTRUCTION,
      `Analyze this carbon tracking data and provide insights: ${trackedData.substring(0, config.inputLimits.insightsDataMaxLength)}`,
      InsightsSchema,
      'insights',
    );

    res.status(HTTP.OK).json(result);
    writeCloudLog('INFO', 'Insights generated', { requestId: req.requestId, topSource: result.topSource });
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/actions
 * Generates practical carbon reduction actions for a specific category.
 * Returns actions with difficulty levels and estimated CO₂ savings.
 *
 * @param {import('express').Request} req - Express request with { category: string }
 * @param {import('express').Response} res - Express response
 * @param {Function} next - Express next function for error handler
 * @throws {ValidationError} When category input is missing or invalid
 * @throws {AIServiceError} When Gemini API or schema validation fails
 */
router.post('/actions', async (req, res, next) => {
  try {
    const category = validateRequiredString(req.body.category, 'Carbon category');

    validateApiKey();

    const result = await callGemini(
      ACTIONS_INSTRUCTION,
      `Generate carbon reduction actions for: ${category.substring(0, config.inputLimits.categoryMaxLength)}`,
      ActionsSchema,
      'actions',
    );

    res.status(HTTP.OK).json(result);
    writeCloudLog('INFO', 'Actions generated', { requestId: req.requestId, category });
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/stats
 * Retrieves aggregate carbon statistics from Google BigQuery.
 * Returns calculation counts, average carbon by category.
 *
 * @param {import('express').Request} req - Express request
 * @param {import('express').Response} res - Express response
 */
router.get('/stats', async (req, res) => {
  try {
    const stats = await getStatistics();
    writeCloudLog('INFO', 'Stats retrieved from BigQuery', { requestId: req.requestId });
    res.status(HTTP.OK).json({ stats, source: 'BigQuery', requestId: req.requestId });
  } catch (error) {
    reportError(error, { endpoint: '/api/stats', requestId: req.requestId });
    res.status(HTTP.OK).json({ stats: [], source: 'BigQuery', note: 'BigQuery not configured in this environment' });
  }
});

export default router;
