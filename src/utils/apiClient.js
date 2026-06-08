/**
 * @fileoverview Shared API client utility for CarbonWise.
 * Centralizes all HTTP communication with the backend,
 * providing consistent error handling, request headers,
 * and input validation across all components.
 *
 * @module utils/apiClient
 * @version 1.0.0
 */

import { API_ENDPOINTS } from '../constants.js';

/** @constant {number} MAX_INPUT_LENGTH - Maximum allowed input string length */
const MAX_INPUT_LENGTH = 1000;

/** @constant {number} REQUEST_TIMEOUT_MS - Request timeout in milliseconds */
const REQUEST_TIMEOUT_MS = 30000;

/**
 * Custom error class for API communication failures.
 * Provides structured error information including HTTP status codes.
 *
 * @class ApiError
 * @extends Error
 */
export class ApiError extends Error {
  /**
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=0] - HTTP status code from the server
   * @param {string} [code='NETWORK_ERROR'] - Machine-readable error code
   */
  constructor(message, statusCode = 0, code = 'NETWORK_ERROR') {
    super(message);
    this.name = 'ApiError';
    this.statusCode = statusCode;
    this.code = code;
  }
}

/**
 * Sends a POST request to the specified API endpoint with JSON body.
 * Includes timeout handling, response validation, and structured error mapping.
 *
 * @param {string} endpoint - The API endpoint path (e.g., '/api/calculate')
 * @param {object} body - The JSON request body
 * @returns {Promise<object>} The parsed JSON response
 * @throws {ApiError} When the request fails, times out, or returns a non-OK status
 */
async function postJSON(endpoint, body) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new ApiError(
        errorData.error || `Server error (${response.status})`,
        response.status,
        errorData.code || 'SERVER_ERROR',
      );
    }

    return await response.json();
  } catch (err) {
    if (err instanceof ApiError) {
      throw err;
    }
    if (err.name === 'AbortError') {
      throw new ApiError('Request timed out. Please try again.', 0, 'TIMEOUT');
    }
    throw new ApiError(
      err.message || 'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR',
    );
  } finally {
    clearTimeout(timeoutId);
  }
}

/**
 * Truncates a string to the maximum allowed input length.
 *
 * @param {string} input - The input string to truncate
 * @returns {string} The truncated string
 */
function truncateInput(input) {
  return input.substring(0, MAX_INPUT_LENGTH);
}

/**
 * Calculates carbon footprint from a natural-language activity description.
 *
 * @param {string} activity - The activity description
 * @param {string} [category] - Optional carbon category filter
 * @returns {Promise<object>} The calculation result with totalCarbonKg, breakdown, equivalents, tips
 * @throws {ApiError} When the request fails
 */
export async function calculateCarbon(activity, category) {
  return postJSON(API_ENDPOINTS.calculate, {
    activity: truncateInput(activity.trim()),
    category: category || undefined,
  });
}

/**
 * Generates personalized carbon insights from tracked activity data.
 *
 * @param {string} trackedData - Serialized JSON string of tracked activities
 * @returns {Promise<object>} Insight data with summary, topSource, insights, trends
 * @throws {ApiError} When the request fails
 */
export async function generateInsights(trackedData) {
  return postJSON(API_ENDPOINTS.insights, {
    trackedData: truncateInput(trackedData),
  });
}

/**
 * Fetches eco-friendly reduction actions for a specific carbon category.
 *
 * @param {string} category - The carbon category to get actions for
 * @returns {Promise<object>} Action data with category and actions array
 * @throws {ApiError} When the request fails
 */
export async function fetchActions(category) {
  return postJSON(API_ENDPOINTS.actions, {
    category: truncateInput(category.trim()),
  });
}
