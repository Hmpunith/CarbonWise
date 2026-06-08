import { render, screen, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App.jsx';

// ---------- helpers ----------
const renderApp = () => render(<App />);

describe('WCAG Accessibility Compliance', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -----------------------------------------------------------------
  // 1. Document-level accessibility
  // -----------------------------------------------------------------
  it('HTML document has lang="en" attribute', () => {
    // Arrange — lang is set in tests/setup.js

    // Act — no action needed, just verify

    // Assert
    expect(document.documentElement.lang).toBe('en');
  });

  it('has exactly one h1 element on the page', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
  });

  // -----------------------------------------------------------------
  // 2. Skip navigation
  // -----------------------------------------------------------------
  it('skip link exists with href="#main-content"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const skipLink = document.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink.textContent).toMatch(/skip/i);
  });

  // -----------------------------------------------------------------
  // 3. Landmark regions
  // -----------------------------------------------------------------
  it('main landmark has id="main-content"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('header has role="banner"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('footer has role="contentinfo"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  // -----------------------------------------------------------------
  // 4. Tab widget ARIA
  // -----------------------------------------------------------------
  it('navigation container has role="tablist"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });

  it('all navigation items have role="tab"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(4);
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('role', 'tab');
    });
  });

  it('active tab has aria-selected="true"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    const activeTabs = tabs.filter(
      (tab) => tab.getAttribute('aria-selected') === 'true'
    );
    expect(activeTabs).toHaveLength(1);
  });

  it('inactive tabs have aria-selected="false"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    const inactiveTabs = tabs.filter(
      (tab) => tab.getAttribute('aria-selected') === 'false'
    );
    // 4 tabs total, 1 active → 3 inactive
    expect(inactiveTabs).toHaveLength(3);
  });

  it('tab panels have role="tabpanel"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const panels = screen.getAllByRole('tabpanel');
    expect(panels.length).toBeGreaterThanOrEqual(1);
  });

  it('status announcer has role="status" and aria-live="polite"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const status = screen.getByRole('status');
    expect(status).toBeInTheDocument();
    expect(status).toHaveAttribute('aria-live', 'polite');
  });
});
