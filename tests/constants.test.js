import { describe, it, expect } from 'vitest';
import {
  TABS,
  API_ENDPOINTS,
  CARBON_CATEGORIES,
  IMPACT_LEVELS,
  APP_META,
} from '../src/constants.js';

// =====================================================================
// TABS
// =====================================================================
describe('TABS Constant', () => {
  it('has exactly 5 tab entries', () => {
    // Arrange - constant already imported

    // Act
    const count = TABS.length;

    // Assert
    expect(count).toBe(5);
  });

  it('every tab has id, label, icon, and ariaLabel properties', () => {
    // Arrange
    const requiredKeys = ['id', 'label', 'icon', 'ariaLabel'];

    // Act & Assert
    TABS.forEach((tab) => {
      requiredKeys.forEach((key) => {
        expect(tab).toHaveProperty(key);
        expect(tab[key]).toBeTruthy();
      });
    });
  });

  it('has no duplicate tab IDs', () => {
    // Arrange
    const ids = TABS.map((tab) => tab.id);

    // Act
    const uniqueIds = new Set(ids);

    // Assert
    expect(uniqueIds.size).toBe(ids.length);
  });
});

// =====================================================================
// API_ENDPOINTS
// =====================================================================
describe('API_ENDPOINTS Constant', () => {
  it('has all required API paths', () => {
    // Arrange
    const requiredPaths = ['calculate', 'insights', 'actions', 'health', 'stats'];

    // Act & Assert
    requiredPaths.forEach((path) => {
      const hasPath = Object.values(API_ENDPOINTS).some((endpoint) =>
        endpoint.toLowerCase().includes(path)
      );
      expect(hasPath).toBe(true);
    });
  });
});

// =====================================================================
// CARBON_CATEGORIES
// =====================================================================
describe('CARBON_CATEGORIES Constant', () => {
  it('has exactly 5 categories', () => {
    // Arrange — constant imported

    // Act
    const count = Array.isArray(CARBON_CATEGORIES)
      ? CARBON_CATEGORIES.length
      : Object.keys(CARBON_CATEGORIES).length;

    // Assert
    expect(count).toBe(5);
  });
});

// =====================================================================
// APP_META
// =====================================================================
describe('APP_META Constant', () => {
  it('has name set to "CarbonWise"', () => {
    // Arrange — constant imported

    // Act
    const name = APP_META.name;

    // Assert
    expect(name).toBe('CarbonWise');
  });
});

// =====================================================================
// IMPACT_LEVELS
// =====================================================================
describe('IMPACT_LEVELS Constant', () => {
  it('has exactly 4 levels', () => {
    // Arrange — constant imported

    // Act
    const count = Array.isArray(IMPACT_LEVELS)
      ? IMPACT_LEVELS.length
      : Object.keys(IMPACT_LEVELS).length;

    // Assert
    expect(count).toBe(4);
  });
});
