import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';
import { CalculationSchema, InsightsSchema, ActionsSchema } from '../server/schemas.js';

// ── Mock Google Cloud services ──────────────────────────────────────
const mockGenerateContent = vi.fn();

vi.mock('../server/googleServices.js', () => ({
  genAI: {
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: (...args) => mockGenerateContent(...args),
    }),
  },
  writeCloudLog: vi.fn(),
  insertAnalytics: vi.fn().mockResolvedValue(true),
  getStatistics: vi.fn().mockResolvedValue([]),
  reportError: vi.fn(),
  assessContentSafety: vi.fn().mockResolvedValue({ safe: true, assessed: true }),
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../server/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import app ──────────────────────────────────────────────────────
let app;
beforeAll(async () => {
  const mod = await import('../server.js');
  app = mod.default ?? mod.app ?? mod;
});

// ── Helper ──────────────────────────────────────────────────────────
const validApiResponse = JSON.stringify({
  totalCarbonKg: 1,
  category: 'transport',
  breakdown: [{ item: 'test', carbonKg: 1, explanation: 'test' }],
  equivalents: ['test'],
  tips: ['test'],
  impactLevel: 'low',
});

// =====================================================================
// Edge Cases — API Input Handling
// =====================================================================
describe('Edge Cases — API Input Handling', () => {
  it('handles null body gracefully with a 400 response', async () => {
    // Arrange — send request with no JSON body

    // Act
    const res = await request(app)
      .post('/api/calculate')
      .set('Content-Type', 'application/json')
      .send('null');

    // Assert
    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(res.status).toBeLessThan(500);
  });

  it('handles undefined activity field with a 400 response', async () => {
    // Arrange
    const body = { category: 'transport' }; // missing activity

    // Act
    const res = await request(app).post('/api/calculate').send(body);

    // Assert
    expect(res.status).toBe(400);
  });

  it('handles empty string activity with a 400 response', async () => {
    // Arrange
    const body = { activity: '' };

    // Act
    const res = await request(app).post('/api/calculate').send(body);

    // Assert
    expect(res.status).toBe(400);
  });

  it('handles activity with only whitespace as a 400 response', async () => {
    // Arrange
    const body = { activity: '   \t\n  ' };

    // Act
    const res = await request(app).post('/api/calculate').send(body);

    // Assert
    expect(res.status).toBe(400);
  });

  it('handles very long activity input (5000+ chars) without server crash', async () => {
    // Arrange
    const longActivity = 'Drove my car to work and back. '.repeat(200); // ~6000 chars
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: vi.fn().mockReturnValue(validApiResponse) },
    });

    // Act
    const res = await request(app)
      .post('/api/calculate')
      .send({ activity: longActivity, category: 'transport' });

    // Assert
    expect(res.status).toBeLessThan(500);
  });

  it('handles special characters in input without crashing', async () => {
    // Arrange
    const specialChars = '<script>alert("xss")</script> & "quotes" <img onerror=alert(1)>';
    mockGenerateContent.mockResolvedValueOnce({
      response: { text: vi.fn().mockReturnValue(validApiResponse) },
    });

    // Act
    const res = await request(app)
      .post('/api/calculate')
      .send({ activity: specialChars, category: 'transport' });

    // Assert
    expect(res.status).toBeLessThan(500);
  });

  it('handles numeric input instead of string with a 400 response', async () => {
    // Arrange
    const body = { activity: 42 };

    // Act
    const res = await request(app).post('/api/calculate').send(body);

    // Assert
    expect(res.status).toBe(400);
  });

  it('handles array input instead of string with a 400 response', async () => {
    // Arrange
    const body = { activity: ['drove', 'to', 'work'] };

    // Act
    const res = await request(app).post('/api/calculate').send(body);

    // Assert
    expect(res.status).toBe(400);
  });
});

// =====================================================================
// Edge Cases — Schema Null / Undefined / Empty
// =====================================================================
describe('Edge Cases — Schema Rejection', () => {
  it('CalculationSchema rejects null values', () => {
    // Arrange
    const data = null;

    // Act
    const result = CalculationSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });

  it('CalculationSchema rejects undefined values', () => {
    // Arrange
    const data = undefined;

    // Act
    const result = CalculationSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });

  it('CalculationSchema rejects empty objects', () => {
    // Arrange
    const data = {};

    // Act
    const result = CalculationSchema.safeParse(data);

    // Assert
    expect(result.success).toBe(false);
  });
});
