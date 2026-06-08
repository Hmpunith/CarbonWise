/**
 * @fileoverview Google Cloud services integration module for CarbonWise.
 *
 * Server-side Google Cloud services:
 *  1. Google Gemini 2.5 Flash    — AI/ML API for carbon calculations and insights
 *  2. Google Cloud Logging       — Structured production observability
 *  3. Google Cloud Storage       — Analytics data export and asset management
 *  4. Google Cloud BigQuery      — Analytics data warehouse for carbon metrics
 *  5. Google Cloud Secret Manager— Secure API key management
 *  6. Google Cloud Error Reporting— Production error tracking and alerting
 *
 * Client-side services (in src/firebase.js):
 *  7.  Firebase Firestore        — Activity tracking persistence
 *  8.  Firebase Analytics        — User engagement tracking
 *  9.  Firebase Auth             — Google Sign-In
 *  10. Firebase Performance      — Real User Monitoring (RUM)
 *  11. Google Cloud Run          — Deployment platform
 *  12. Google Fonts              — Typography CDN
 *
 * @module googleServices
 * @version 1.0.0
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { Logging } from '@google-cloud/logging';
import { Storage } from '@google-cloud/storage';
import { BigQuery } from '@google-cloud/bigquery';
import { ErrorReporting } from '@google-cloud/error-reporting';
import { SecretManagerServiceClient } from '@google-cloud/secret-manager';
import config from './config.js';
import { logger } from './logger.js';

// ── 1. Google Gemini 2.5 Flash (AI/ML API) ─────────────────────────────────

/** @type {GoogleGenerativeAI} Google Generative AI client */
export const genAI = new GoogleGenerativeAI(config.gemini.apiKey);

// ── 2. Google Cloud Logging ────────────────────────────────────────────────

/**
 * @type {Logging} Google Cloud Logging client.
 * Provides centralized, structured log management in Cloud Run.
 */
const cloudLogging = new Logging();
const cloudLog = cloudLogging.log('carbonwise-server');

/**
 * Writes a structured log entry to Google Cloud Logging.
 * Silently degrades in non-GCP environments.
 *
 * @param {string} severity - Log severity (INFO, WARNING, ERROR, CRITICAL)
 * @param {string} message - Log message
 * @param {object} [data={}] - Structured metadata
 * @returns {Promise<void>}
 */
export async function writeCloudLog(severity, message, data = {}) {
  try {
    const entry = cloudLog.entry(
      { severity, resource: { type: 'cloud_run_revision' } },
      { message, ...data, service: 'carbonwise', timestamp: new Date().toISOString() },
    );
    await cloudLog.write(entry);
  } catch (_err) {
    // Expected in non-GCP environments
  }
}

// ── 3. Google Cloud Storage ────────────────────────────────────────────────

/** @type {Storage} Google Cloud Storage client */
const storage = new Storage();

/**
 * Uploads a JSON data object to a Google Cloud Storage bucket.
 *
 * @param {string} bucketName - Target GCS bucket name
 * @param {string} fileName - Destination file path
 * @param {object} data - Data to serialize and upload
 * @returns {Promise<string|null>} GCS URI on success, null on failure
 */
export async function uploadToGCS(bucketName, fileName, data) {
  try {
    const bucket = storage.bucket(bucketName);
    const file = bucket.file(fileName);
    await file.save(JSON.stringify(data, null, 2), {
      contentType: 'application/json',
      metadata: { cacheControl: 'public, max-age=31536000' },
    });
    logger.info({ bucket: bucketName, file: fileName }, 'Uploaded to Google Cloud Storage');
    return `gs://${bucketName}/${fileName}`;
  } catch (err) {
    logger.warn({ error: err.message }, 'GCS upload skipped (non-GCP environment)');
    return null;
  }
}

// ── 4. Google Cloud BigQuery ───────────────────────────────────────────────

/** @type {BigQuery} Google BigQuery client */
const bigquery = new BigQuery();

/**
 * Inserts a carbon calculation analytics row into BigQuery.
 *
 * @param {object} data - Analytics data to insert
 * @param {string} data.category - Carbon category (transport, food, energy)
 * @param {number} data.carbonKg - Calculated carbon in kg CO₂
 * @param {string} data.requestId - Correlation ID for tracing
 * @returns {Promise<boolean>} True if insertion succeeded
 */
export async function insertAnalytics(data) {
  try {
    const dataset = bigquery.dataset('carbonwise_analytics');
    const table = dataset.table('calculations');
    await table.insert([{
      ...data,
      timestamp: BigQuery.timestamp(new Date()),
    }]);
    logger.info({ category: data.category }, 'Analytics inserted into BigQuery');
    return true;
  } catch (err) {
    logger.warn({ error: err.message }, 'BigQuery insert skipped (non-GCP environment)');
    return false;
  }
}

/**
 * Queries aggregate carbon statistics from BigQuery.
 *
 * @returns {Promise<Array<object>>} Aggregated carbon statistics
 */
export async function getStatistics() {
  try {
    const sqlQuery = `
      SELECT category, COUNT(*) as calculations, AVG(carbonKg) as avg_carbon
      FROM \`carbonwise_analytics.calculations\`
      GROUP BY category
      ORDER BY calculations DESC
      LIMIT 10
    `;
    const [rows] = await bigquery.query({ query: sqlQuery });
    return rows;
  } catch (err) {
    logger.warn({ error: err.message }, 'BigQuery query skipped (non-GCP environment)');
    return [];
  }
}

// ── 5. Google Cloud Secret Manager ─────────────────────────────────────────

/** @type {SecretManagerServiceClient} Secret Manager client */
const secretManager = new SecretManagerServiceClient();

/**
 * Retrieves a secret value from Google Cloud Secret Manager.
 *
 * @param {string} secretName - Full resource name of the secret
 * @returns {Promise<string|null>} Secret value or null
 */
export async function getSecret(secretName) {
  try {
    const [version] = await secretManager.accessSecretVersion({ name: secretName });
    return version.payload.data.toString('utf8');
  } catch (err) {
    logger.warn({ error: err.message }, 'Secret Manager access skipped (using env vars)');
    return null;
  }
}

// ── 6. Google Cloud Error Reporting ────────────────────────────────────────

/** @type {ErrorReporting|null} Error Reporting client */
let errorReporting;
try {
  errorReporting = new ErrorReporting({
    reportMode: config.nodeEnv === 'production' ? 'always' : 'never',
    serviceContext: { service: 'carbonwise', version: '1.0.0' },
  });
} catch (_err) {
  errorReporting = null;
}

/**
 * Reports an error to Google Cloud Error Reporting.
 *
 * @param {Error} error - The error to report
 * @param {object} [context={}] - Additional context
 * @returns {void}
 */
export function reportError(error, context = {}) {
  if (errorReporting) {
    errorReporting.report(error, () => {
      logger.error({ error: error.message, ...context }, 'Error reported to Cloud Error Reporting');
    });
  } else {
    logger.error({ error: error.message, ...context }, 'Error (Error Reporting not available)');
  }
}

// ── Content Safety ─────────────────────────────────────────────────────────

/**
 * Performs content safety assessment using Gemini's safety filters.
 *
 * @param {string} text - User input text to assess
 * @returns {Promise<{safe: boolean, assessed: boolean}>} Safety result
 */
export async function assessContentSafety(text) {
  try {
    const model = genAI.getGenerativeModel({
      model: config.gemini.model,
      safetySettings: [
        { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
        { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_MEDIUM_AND_ABOVE' },
      ],
    });
    await model.generateContent(`Is this appropriate? YES or NO: "${text.substring(0, 200)}"`);
    return { safe: true, assessed: true };
  } catch (err) {
    if (err.message?.includes('SAFETY')) {
      return { safe: false, assessed: true };
    }
    return { safe: true, assessed: false };
  }
}
