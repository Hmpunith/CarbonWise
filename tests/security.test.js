import { describe, it, expect, vi, beforeAll } from 'vitest';
import request from 'supertest';

// ── Mock Google Cloud services ──────────────────────────────────────
vi.mock('../server/googleServices.js', () => ({
  genAI: {
    getGenerativeModel: vi.fn().mockReturnValue({
      generateContent: vi.fn().mockResolvedValue({
        response: {
          text: vi.fn().mockReturnValue(JSON.stringify({
            totalCarbonKg: 5,
            category: 'transport',
            breakdown: [{ item: 'Walk', carbonKg: 0, explanation: 'Zero emission' }],
            equivalents: ['None'],
            tips: ['Keep walking!'],
            impactLevel: 'low',
          })),
        },
      }),
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

// =====================================================================
// Security Header Tests
// =====================================================================
describe('Security Headers', () => {
  it('sets X-Content-Type-Options to "nosniff"', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    expect(res.headers['x-content-type-options']).toBe('nosniff');
  });

  it('sets X-Frame-Options header', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    expect(res.headers['x-frame-options']).toBeDefined();
  });

  it('includes Content-Security-Policy header', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    expect(res.headers['content-security-policy']).toBeDefined();
  });

  it('CSP default-src includes "self"', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    const csp = res.headers['content-security-policy'];
    expect(csp).toMatch(/default-src[^;]*'self'/);
  });

  it('CSP style-src includes fonts.googleapis.com', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    const csp = res.headers['content-security-policy'];
    expect(csp).toMatch(/style-src[^;]*fonts\.googleapis\.com/);
  });

  it('includes X-Request-Id header in UUID format', async () => {
    // Arrange
    const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    const requestId = res.headers['x-request-id'];
    expect(requestId).toBeDefined();
    expect(requestId).toMatch(uuidPattern);
  });

  it('includes Permissions-Policy header', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    expect(res.headers['permissions-policy']).toBeDefined();
  });

  it('Permissions-Policy contains camera=()', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    const pp = res.headers['permissions-policy'];
    expect(pp).toMatch(/camera=\(\)/);
  });

  it('includes Referrer-Policy header', async () => {
    // Arrange — nothing extra

    // Act
    const res = await request(app).get('/api/health');

    // Assert
    expect(res.headers['referrer-policy']).toBeDefined();
  });
});

// =====================================================================
// Rate Limiting
// =====================================================================
describe('Rate Limiting', () => {
  it('returns 429 after exceeding the request limit', async () => {
    // Arrange — send many rapid requests to a rate-limited endpoint
    const totalRequests = 150;
    const results = [];

    // Act
    for (let i = 0; i < totalRequests; i++) {
      const res = await request(app).get('/api/health');
      results.push(res.status);
    }

    // Assert — at least one request should have been rate-limited
    const has429 = results.includes(429);
    expect(has429).toBe(true);
  });
});
