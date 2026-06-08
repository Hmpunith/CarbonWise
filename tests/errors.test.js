import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  AIServiceError,
  RateLimitError,
  NotFoundError,
} from '../server/errors.js';

// =====================================================================
// AppError (base class)
// =====================================================================
describe('AppError', () => {
  it('has a default statusCode of 500', () => {
    // Arrange & Act
    const error = new AppError('Something went wrong');

    // Assert
    expect(error.statusCode).toBe(500);
  });

  it('has a default code of "INTERNAL_ERROR"', () => {
    // Arrange & Act
    const error = new AppError('Something went wrong');

    // Assert
    expect(error.code).toBe('INTERNAL_ERROR');
  });

  it('has isOperational set to true by default', () => {
    // Arrange & Act
    const error = new AppError('Something went wrong');

    // Assert
    expect(error.isOperational).toBe(true);
  });

  it('has name matching the class name "AppError"', () => {
    // Arrange & Act
    const error = new AppError('Something went wrong');

    // Assert
    expect(error.name).toBe('AppError');
  });

  it('is an instance of Error', () => {
    // Arrange & Act
    const error = new AppError('Something went wrong');

    // Assert
    expect(error).toBeInstanceOf(Error);
  });

  it('preserves the message passed to constructor', () => {
    // Arrange
    const message = 'Custom error message';

    // Act
    const error = new AppError(message);

    // Assert
    expect(error.message).toBe(message);
  });
});

// =====================================================================
// ValidationError
// =====================================================================
describe('ValidationError', () => {
  it('has statusCode 400', () => {
    // Arrange & Act
    const error = new ValidationError('Invalid input');

    // Assert
    expect(error.statusCode).toBe(400);
  });

  it('has code "VALIDATION_ERROR"', () => {
    // Arrange & Act
    const error = new ValidationError('Invalid input');

    // Assert
    expect(error.code).toBe('VALIDATION_ERROR');
  });

  it('is an instance of AppError', () => {
    // Arrange & Act
    const error = new ValidationError('Invalid input');

    // Assert
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    // Arrange & Act
    const error = new ValidationError('Invalid input');

    // Assert
    expect(error).toBeInstanceOf(Error);
  });
});

// =====================================================================
// AIServiceError
// =====================================================================
describe('AIServiceError', () => {
  it('has statusCode 502', () => {
    // Arrange & Act
    const error = new AIServiceError('AI service unavailable');

    // Assert
    expect(error.statusCode).toBe(502);
  });

  it('is an instance of AppError', () => {
    // Arrange & Act
    const error = new AIServiceError('AI service unavailable');

    // Assert
    expect(error).toBeInstanceOf(AppError);
  });
});

// =====================================================================
// RateLimitError
// =====================================================================
describe('RateLimitError', () => {
  it('has statusCode 429', () => {
    // Arrange & Act
    const error = new RateLimitError('Too many requests');

    // Assert
    expect(error.statusCode).toBe(429);
  });

  it('is an instance of AppError', () => {
    // Arrange & Act
    const error = new RateLimitError('Too many requests');

    // Assert
    expect(error).toBeInstanceOf(AppError);
  });
});

// =====================================================================
// NotFoundError
// =====================================================================
describe('NotFoundError', () => {
  it('has statusCode 404', () => {
    // Arrange & Act
    const error = new NotFoundError('Resource not found');

    // Assert
    expect(error.statusCode).toBe(404);
  });

  it('is an instance of AppError', () => {
    // Arrange & Act
    const error = new NotFoundError('Resource not found');

    // Assert
    expect(error).toBeInstanceOf(AppError);
  });

  it('is an instance of Error', () => {
    // Arrange & Act
    const error = new NotFoundError('Resource not found');

    // Assert
    expect(error).toBeInstanceOf(Error);
  });
});
