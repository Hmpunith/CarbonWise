import { render, screen, fireEvent, within } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../src/App.jsx';

// ---------- helpers ----------
const renderApp = () => render(<App />);

// =====================================================================
// 1. App Rendering
// =====================================================================
describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', () => {
    // Arrange & Act
    const { container } = renderApp();

    // Assert
    expect(container).toBeTruthy();
  });

  it('renders Header with an h1 containing "CarbonWise"', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/carbonwise/i);
  });

  it('renders Navigation with all 4 tabs', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });

  it('renders Footer with contentinfo role', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('has Calculator tab active by default', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const calculatorTab = screen.getByRole('tab', { name: /calculator/i });
    expect(calculatorTab).toHaveAttribute('aria-selected', 'true');
  });
});

// =====================================================================
// 2. Tab Navigation
// =====================================================================
describe('Tab Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('switches to Tracker panel when Tracker tab is clicked', () => {
    // Arrange
    renderApp();
    const trackerTab = screen.getByRole('tab', { name: /tracker/i });

    // Act
    fireEvent.click(trackerTab);

    // Assert
    expect(trackerTab).toHaveAttribute('aria-selected', 'true');
    const trackerPanel = screen.getByRole('tabpanel');
    expect(trackerPanel).toBeInTheDocument();
  });

  it('switches to Actions panel when Actions tab is clicked', () => {
    // Arrange
    renderApp();
    const actionsTab = screen.getByRole('tab', { name: /actions/i });

    // Act
    fireEvent.click(actionsTab);

    // Assert
    expect(actionsTab).toHaveAttribute('aria-selected', 'true');
  });

  it('switches to Insights panel when Insights tab is clicked', () => {
    // Arrange
    renderApp();
    const insightsTab = screen.getByRole('tab', { name: /insights/i });

    // Act
    fireEvent.click(insightsTab);

    // Assert
    expect(insightsTab).toHaveAttribute('aria-selected', 'true');
  });
});

// =====================================================================
// 3. Header Auth State
// =====================================================================
describe('Header Auth State', () => {
  it('shows a sign-in button when no user is authenticated', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const signInBtn = screen.getByRole('button', { name: /sign in/i });
    expect(signInBtn).toBeInTheDocument();
  });
});

// =====================================================================
// 4. LoadingSpinner
// =====================================================================
describe('LoadingSpinner Component', () => {
  // We dynamically import to keep these isolated
  let LoadingSpinner;

  beforeEach(async () => {
    const mod = await import('../src/components/LoadingSpinner.jsx');
    LoadingSpinner = mod.default;
  });

  it('renders with correct role="status"', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByRole('status');
    expect(spinner).toBeInTheDocument();
  });

  it('shows aria-busy="true" while loading', () => {
    // Arrange & Act
    render(<LoadingSpinner />);

    // Assert
    const spinner = screen.getByRole('status');
    expect(spinner).toHaveAttribute('aria-busy', 'true');
  });
});

// =====================================================================
// 5. ErrorBoundary
// =====================================================================
describe('ErrorBoundary Component', () => {
  let ErrorBoundary;

  beforeEach(async () => {
    const mod = await import('../src/components/ErrorBoundary.jsx');
    ErrorBoundary = mod.default;
  });

  it('renders children when no error is thrown', () => {
    // Arrange
    const ChildComponent = () => <p>Child content</p>;

    // Act
    render(
      <ErrorBoundary>
        <ChildComponent />
      </ErrorBoundary>
    );

    // Assert
    expect(screen.getByText('Child content')).toBeInTheDocument();
  });
});

// =====================================================================
// 6. Navigation Details
// =====================================================================
describe('Navigation Component', () => {
  it('renders the correct number of tab elements (4)', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(4);
  });
});

// =====================================================================
// 7. Footer Details
// =====================================================================
describe('Footer Component', () => {
  it('contains copyright text', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toMatch(/©|copyright/i);
  });
});

// =====================================================================
// 8. Calculator Panel
// =====================================================================
describe('Calculator Panel', () => {
  it('renders a textarea input for activity description', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const textarea = screen.getByRole('textbox');
    expect(textarea).toBeInTheDocument();
  });

  it('renders category buttons for carbon categories', () => {
    // Arrange & Act
    renderApp();

    // Assert
    const buttons = screen.getAllByRole('button').filter(
      (btn) => btn.closest('[data-testid="category-buttons"]') || btn.textContent.match(/transport|food|energy|shopping|waste/i)
    );
    expect(buttons.length).toBeGreaterThanOrEqual(1);
  });
});
