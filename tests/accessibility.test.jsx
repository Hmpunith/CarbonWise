import { render, screen, within, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App.jsx';

// ---------- helpers ----------
const renderApp = async () => {
  let result;
  await act(async () => {
    result = render(<App />);
  });
  return result;
};

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

  it('has exactly one h1 element on the page', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const headings = screen.getAllByRole('heading', { level: 1 });
    expect(headings).toHaveLength(1);
  });

  // -----------------------------------------------------------------
  // 2. Skip navigation
  // -----------------------------------------------------------------
  it('skip link exists with href="#main-content"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const skipLink = document.querySelector('a[href="#main-content"]');
    expect(skipLink).toBeTruthy();
    expect(skipLink.textContent).toMatch(/skip/i);
  });

  // -----------------------------------------------------------------
  // 3. Landmark regions
  // -----------------------------------------------------------------
  it('main landmark has id="main-content"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const main = screen.getByRole('main');
    expect(main).toHaveAttribute('id', 'main-content');
  });

  it('header has role="banner"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const banner = screen.getByRole('banner');
    expect(banner).toBeInTheDocument();
  });

  it('footer has role="contentinfo"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  // -----------------------------------------------------------------
  // 4. Tab widget ARIA
  // -----------------------------------------------------------------
  it('navigation container has role="tablist"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const tablist = screen.getByRole('tablist');
    expect(tablist).toBeInTheDocument();
  });

  it('all navigation items have role="tab"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    expect(tabs.length).toBeGreaterThanOrEqual(5);
    tabs.forEach((tab) => {
      expect(tab).toHaveAttribute('role', 'tab');
    });
  });

  it('active tab has aria-selected="true"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    const activeTabs = tabs.filter(
      (tab) => tab.getAttribute('aria-selected') === 'true'
    );
    expect(activeTabs).toHaveLength(1);
  });

  it('inactive tabs have aria-selected="false"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    const inactiveTabs = tabs.filter(
      (tab) => tab.getAttribute('aria-selected') === 'false'
    );
    // 5 tabs total, 1 active → 4 inactive
    expect(inactiveTabs).toHaveLength(4);
  });

  it('tab panels have role="tabpanel"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const panels = screen.getAllByRole('tabpanel');
    expect(panels.length).toBeGreaterThanOrEqual(1);
  });

  it('status announcer has role="status" and aria-live="polite"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert — multiple status elements may exist (header announcer + loading spinner)
    const statusElements = screen.getAllByRole('status');
    expect(statusElements.length).toBeGreaterThanOrEqual(1);
    const headerStatus = statusElements.find((el) => el.classList.contains('sr-only'));
    expect(headerStatus).toBeTruthy();
    expect(headerStatus).toHaveAttribute('aria-live', 'polite');
  });
});
