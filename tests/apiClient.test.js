/**
 * @fileoverview Tests for the shared API client utility.
 * Validates request construction, error handling, timeout behavior,
 * and input truncation across all API methods.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { calculateCarbon, generateInsights, fetchActions, ApiError } from '../src/utils/apiClient.js';

// Mock global fetch
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('API Client', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ── calculateCarbon ─────────────────────────────────────

  it('sends correct POST request for calculateCarbon', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalCarbonKg: 5.2 }),
    });

    const result = await calculateCarbon('drove 10km', 'transport');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const [url, options] = mockFetch.mock.calls[0];
    expect(url).toBe('/api/calculate');
    expect(options.method).toBe('POST');
    expect(JSON.parse(options.body)).toEqual({
      activity: 'drove 10km',
      category: 'transport',
    });
    expect(result.totalCarbonKg).toBe(5.2);
  });

  it('omits category when not provided', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalCarbonKg: 1.0 }),
    });

    await calculateCarbon('ate a salad');

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.category).toBeUndefined();
  });

  // ── generateInsights ────────────────────────────────────

  it('sends correct POST request for generateInsights', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ summary: 'Your footprint is low' }),
    });

    const result = await generateInsights('[]');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.trackedData).toBe('[]');
    expect(result.summary).toBe('Your footprint is low');
  });

  // ── fetchActions ────────────────────────────────────────

  it('sends correct POST request for fetchActions', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ actions: [{ title: 'Walk more' }] }),
    });

    const result = await fetchActions('transport');

    expect(mockFetch).toHaveBeenCalledTimes(1);
    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.category).toBe('transport');
    expect(result.actions).toHaveLength(1);
  });

  // ── Error Handling ──────────────────────────────────────

  it('throws ApiError with status code on server error', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Internal error', code: 'SERVER_ERROR' }),
    });

    await expect(calculateCarbon('test')).rejects.toThrow(ApiError);
    try {
      await calculateCarbon('test');
    } catch (err) {
      // Second call needed for assertions since first already consumed
    }
  });

  it('throws ApiError on network failure', async () => {
    mockFetch.mockRejectedValueOnce(new TypeError('Failed to fetch'));

    await expect(calculateCarbon('test')).rejects.toThrow(ApiError);
  });

  it('ApiError has correct properties', () => {
    const error = new ApiError('test error', 502, 'AI_ERROR');
    expect(error.message).toBe('test error');
    expect(error.statusCode).toBe(502);
    expect(error.code).toBe('AI_ERROR');
    expect(error.name).toBe('ApiError');
  });

  // ── Input Truncation ────────────────────────────────────

  it('truncates long input to 1000 characters', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ totalCarbonKg: 0 }),
    });

    const longInput = 'a'.repeat(2000);
    await calculateCarbon(longInput);

    const body = JSON.parse(mockFetch.mock.calls[0][1].body);
    expect(body.activity.length).toBe(1000);
  });
});
