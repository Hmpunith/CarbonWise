import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Set lang attribute for accessibility tests
document.documentElement.lang = 'en';

// Mock Firebase
vi.mock('../src/firebase.js', () => ({
  trackEvent: vi.fn(),
  signInWithGoogle: vi.fn().mockResolvedValue({ user: { displayName: 'Test User' } }),
  signOutUser: vi.fn().mockResolvedValue(undefined),
  onAuthChange: vi.fn((cb) => { cb(null); return vi.fn(); }),
  saveActivity: vi.fn().mockResolvedValue('mock-doc-id'),
  getActivities: vi.fn().mockResolvedValue([]),
  trackCalculation: vi.fn(),
  trackInsightViewed: vi.fn(),
  db: {},
  auth: { currentUser: null },
  analytics: null,
  perf: null,
  default: {},
}));

// Mock fetch
globalThis.fetch = vi.fn().mockResolvedValue({
  ok: true,
  json: vi.fn().mockResolvedValue({}),
});
