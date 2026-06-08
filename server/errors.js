/**
 * @fileoverview Custom error class hierarchy for CarbonWise.
 * Provides structured, operational error handling with HTTP status codes.
 * Used by the centralized error handler in server.js.
 *
 * @module errors
 * @version 1.0.0
 */

/**
 * Base application error class.
 * All custom errors extend this class for consistent error handling.
 *
 * @class AppError
 * @extends Error
 */
export class AppError extends Error {
  /**
   * Creates a new AppError instance.
   *
   * @param {string} message - Human-readable error message
   * @param {number} [statusCode=500] - HTTP status code
   * @param {string} [code='INTERNAL_ERROR'] - Machine-readable error code
   */
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code;
    this.isOperational = true;
  }
}

/**
 * Validation error for invalid user input.
 *
 * @class ValidationError
 * @extends AppError
 */
export class ValidationError extends AppError {
  /**
   * @param {string} message - Description of the validation failure
   */
  constructor(message) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

/**
 * AI service error for Gemini API failures.
 *
 * @class AIServiceError
 * @extends AppError
 */
export class AIServiceError extends AppError {
  /**
   * @param {string} message - Description of the AI service failure
   */
  constructor(message) {
    super(message, 502, 'AI_SERVICE_ERROR');
  }
}

/**
 * Rate limit error when request quota is exceeded.
 *
 * @class RateLimitError
 * @extends AppError
 */
export class RateLimitError extends AppError {
  constructor() {
    super('Too many requests. Please wait before trying again.', 429, 'RATE_LIMIT_EXCEEDED');
  }
}

/**
 * Not found error for missing resources.
 *
 * @class NotFoundError
 * @extends AppError
 */
export class NotFoundError extends AppError {
  /**
   * @param {string} [message='Resource not found'] - Description of missing resource
   */
  constructor(message = 'Resource not found') {
    super(message, 404, 'NOT_FOUND');
  }
}
