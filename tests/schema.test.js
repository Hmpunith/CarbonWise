import { describe, it, expect } from 'vitest';
import { CalculationSchema, InsightsSchema, ActionsSchema } from '../server/schemas.js';

// =====================================================================
// CalculationSchema Tests
// =====================================================================
describe('CalculationSchema', () => {
  const validCalculation = {
    totalCarbonKg: 15.5,
    category: 'transport',
    breakdown: [
      { item: 'Car commute', carbonKg: 15.5, explanation: 'Based on average sedan' },
    ],
    equivalents: ['Equivalent to charging 1900 smartphones'],
    tips: ['Consider carpooling to reduce emissions'],
    impactLevel: 'moderate',
  };

  it('accepts valid calculation data', () => {
    // Arrange
    const data = { ...validCalculation };

    // Act
    const result = CalculationSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects data missing totalCarbonKg', () => {
    // Arrange
    const { totalCarbonKg, ...dataWithout } = validCalculation;

    // Act
    const result = CalculationSchema.safeParse(dataWithout);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects data with invalid impactLevel', () => {
    // Arrange
    const data = { ...validCalculation, impactLevel: 'extreme' };

    // Act
    const result = CalculationSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });

  it('rejects data with non-array breakdown', () => {
    // Arrange
    const data = { ...validCalculation, breakdown: 'not an array' };

    // Act
    const result = CalculationSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// InsightsSchema Tests
// =====================================================================
describe('InsightsSchema', () => {
  const validInsights = {
    summary: 'Your carbon footprint is moderate.',
    topSource: 'transport',
    insights: [
      {
        title: 'Reduce driving',
        description: 'Switch to public transport',
        potentialSavingKg: 1200,
        priority: 'high',
      },
    ],
    weeklyTrend: 'Slightly increasing over time',
    comparisonToAverage: 'Above average for your region',
  };

  it('accepts valid insights data', () => {
    // Arrange
    const data = { ...validInsights };

    // Act
    const result = InsightsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects data missing summary', () => {
    // Arrange
    const { summary, ...dataWithout } = validInsights;

    // Act
    const result = InsightsSchema.safeParse(dataWithout);

    // Assert
    expect(result.success).toBe(false);
  });
});

// =====================================================================
// ActionsSchema Tests
// =====================================================================
describe('ActionsSchema', () => {
  const validActions = {
    category: 'transport',
    actions: [
      {
        title: 'Use public transport',
        description: 'Replace car trips with bus or train',
        savingKgPerYear: 1200,
        difficulty: 'easy',
        icon: '🚌',
      },
    ],
  };

  it('accepts valid actions data', () => {
    // Arrange
    const data = { ...validActions };

    // Act
    const result = ActionsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(true);
  });

  it('rejects data with invalid difficulty value', () => {
    // Arrange
    const data = {
      ...validActions,
      actions: [
        { ...validActions.actions[0], difficulty: 'impossible' },
      ],
    };

    // Act
    const result = ActionsSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });
});
