/**
 * @fileoverview Zod validation schemas for CarbonWise API responses.
 * Validates all AI-generated responses against strict schemas
 * to ensure data integrity and type safety.
 *
 * @module schemas
 * @version 1.0.0
 */

import { z } from 'zod';

/**
 * Schema for carbon footprint calculation response.
 * Validates the AI-generated carbon breakdown by category.
 *
 * @constant {import('zod').ZodObject}
 */
export const CalculationSchema = z.object({
  totalCarbonKg: z.number(),
  category: z.string(),
  breakdown: z.array(
    z.object({
      item: z.string(),
      carbonKg: z.number(),
      explanation: z.string(),
    }),
  ),
  equivalents: z.array(z.string()),
  tips: z.array(z.string()),
  impactLevel: z.enum(['low', 'moderate', 'high', 'very-high']),
});

/**
 * Schema for personalized insights response.
 * Validates AI-generated analysis of user's carbon patterns.
 *
 * @constant {import('zod').ZodObject}
 */
export const InsightsSchema = z.object({
  summary: z.string(),
  topSource: z.string(),
  insights: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      potentialSavingKg: z.number(),
      priority: z.enum(['high', 'medium', 'low']),
    }),
  ),
  weeklyTrend: z.string(),
  comparisonToAverage: z.string(),
});

/**
 * Schema for reduction actions response.
 * Validates AI-generated eco-action recommendations.
 *
 * @constant {import('zod').ZodObject}
 */
export const ActionsSchema = z.object({
  category: z.string(),
  actions: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      savingKgPerYear: z.number(),
      difficulty: z.enum(['easy', 'medium', 'committed']),
      icon: z.string(),
    }),
  ),
});
