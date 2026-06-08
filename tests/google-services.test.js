import { describe, it, expect, vi, beforeAll } from 'vitest';

// ── Mock ALL Google Cloud SDK packages ──────────────────────────────
vi.mock('@google/generative-ai', () => ({
  GoogleGenerativeAI: class MockGoogleGenerativeAI {
    constructor() {
      this.getGenerativeModel = vi.fn();
    }
  },
}));

vi.mock('@google-cloud/logging', () => ({
  Logging: class MockLogging {
    constructor() {
      this.log = vi.fn().mockReturnValue({
        entry: vi.fn(),
        write: vi.fn().mockResolvedValue(undefined),
      });
    }
  },
}));

vi.mock('@google-cloud/storage', () => ({
  Storage: class MockStorage {
    constructor() {
      this.bucket = vi.fn().mockReturnValue({
        file: vi.fn().mockReturnValue({
          save: vi.fn().mockRejectedValue(new Error('Mock GCS error')),
        }),
      });
    }
  },
}));

vi.mock('@google-cloud/bigquery', () => ({
  BigQuery: class MockBigQuery {
    constructor() {
      this.dataset = vi.fn().mockReturnValue({
        table: vi.fn().mockReturnValue({
          insert: vi.fn().mockRejectedValue(new Error('Mock BQ error')),
        }),
      });
      this.query = vi.fn().mockRejectedValue(new Error('Mock BQ query error'));
    }
    static timestamp = vi.fn().mockReturnValue('2026-01-01T00:00:00Z');
  },
}));

vi.mock('@google-cloud/error-reporting', () => ({
  ErrorReporting: class MockErrorReporting {
    constructor() {
      this.report = vi.fn();
    }
  },
}));

vi.mock('@google-cloud/secret-manager', () => ({
  SecretManagerServiceClient: class MockSecretManager {
    constructor() {
      this.accessSecretVersion = vi.fn().mockResolvedValue([
        { payload: { data: Buffer.from('mock-secret-value') } },
      ]);
    }
  },
}));

// Also mock dotenv and logger so the module loads without .env
vi.mock('dotenv', () => ({ default: { config: vi.fn() }, config: vi.fn() }));

vi.mock('../server/logger.js', () => ({
  logger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

// ── Import module under test ────────────────────────────────────────
let services;
beforeAll(async () => {
  services = await import('../server/googleServices.js');
});

// =====================================================================
// Google Services Export & Graceful Degradation Tests
// =====================================================================
describe('Google Services — Exports', () => {
  it('genAI is exported and defined', () => {
    // Arrange — already imported

    // Act
    const { genAI } = services;

    // Assert
    expect(genAI).toBeDefined();
  });

  it('writeCloudLog is exported as a function', () => {
    // Arrange — already imported

    // Act
    const { writeCloudLog } = services;

    // Assert
    expect(typeof writeCloudLog).toBe('function');
  });

  it('uploadToGCS is exported as a function', () => {
    // Arrange — already imported

    // Act
    const { uploadToGCS } = services;

    // Assert
    expect(typeof uploadToGCS).toBe('function');
  });

  it('insertAnalytics is exported as a function', () => {
    // Arrange — already imported

    // Act
    const { insertAnalytics } = services;

    // Assert
    expect(typeof insertAnalytics).toBe('function');
  });

  it('getStatistics is exported as a function', () => {
    // Arrange — already imported

    // Act
    const { getStatistics } = services;

    // Assert
    expect(typeof getStatistics).toBe('function');
  });

  it('reportError is exported as a function', () => {
    // Arrange — already imported

    // Act
    const { reportError } = services;

    // Assert
    expect(typeof reportError).toBe('function');
  });

  it('getSecret is exported as a function', () => {
    // Arrange — already imported

    // Act
    const { getSecret } = services;

    // Assert
    expect(typeof getSecret).toBe('function');
  });
});

describe('Google Services — Graceful Degradation', () => {
  it('writeCloudLog handles errors gracefully without throwing', async () => {
    // Arrange
    const { writeCloudLog } = services;

    // Act & Assert — should not throw even if underlying service errors
    await expect(
      writeCloudLog('test-severity', 'test message', { extra: 'data' })
    ).resolves.not.toThrow();
  });

  it('uploadToGCS returns null on error', async () => {
    // Arrange
    const { uploadToGCS } = services;

    // Act
    const result = await uploadToGCS('test-file.txt', 'content', 'text/plain');

    // Assert
    expect(result).toBeNull();
  });

  it('insertAnalytics returns false on error', async () => {
    // Arrange
    const { insertAnalytics } = services;

    // Act
    const result = await insertAnalytics({
      activity: 'test',
      carbonKg: 1,
      category: 'transport',
    });

    // Assert
    expect(result).toBe(false);
  });

  it('getStatistics returns empty array on error', async () => {
    // Arrange
    const { getStatistics } = services;

    // Act
    const result = await getStatistics();

    // Assert
    expect(result).toEqual([]);
  });

  it('reportError handles null errorReporting gracefully without throwing', () => {
    // Arrange
    const { reportError } = services;

    // Act & Assert
    expect(() => reportError(new Error('test error'))).not.toThrow();
  });
});
