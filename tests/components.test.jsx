import { render, screen, fireEvent, within, waitFor, act } from '@testing-library/react';
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

// =====================================================================
// 1. App Rendering
// =====================================================================
describe('App Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing', async () => {
    // Arrange & Act
    const { container } = await renderApp();

    // Assert
    expect(container).toBeTruthy();
  });

  it('renders Header with an h1 containing "CarbonWise"', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const heading = screen.getByRole('heading', { level: 1 });
    expect(heading).toBeInTheDocument();
    expect(heading).toHaveTextContent(/carbonwise/i);
  });

  it('renders Navigation with all 5 tabs', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const tabs = screen.getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });

  it('renders Footer with contentinfo role', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const footer = screen.getByRole('contentinfo');
    expect(footer).toBeInTheDocument();
  });

  it('has Dashboard tab active by default', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const dashboardTab = screen.getByRole('tab', { name: /dashboard/i });
    expect(dashboardTab).toHaveAttribute('aria-selected', 'true');
  });
});

// =====================================================================
// 2. Tab Navigation
// =====================================================================
describe('Tab Navigation', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('switches to Tracker panel when Tracker tab is clicked', async () => {
    await renderApp();
    const trackerTab = screen.getByRole('tab', { name: /tracker/i });

    await act(async () => {
      fireEvent.click(trackerTab);
    });

    await waitFor(() => {
      expect(trackerTab).toHaveAttribute('aria-selected', 'true');
    });
    const trackerPanel = screen.getByRole('tabpanel');
    expect(trackerPanel).toBeInTheDocument();
  });

  it('switches to Actions panel when Actions tab is clicked', async () => {
    await renderApp();
    const actionsTab = screen.getByRole('tab', { name: /actions/i });

    await act(async () => {
      fireEvent.click(actionsTab);
    });

    await waitFor(() => {
      expect(actionsTab).toHaveAttribute('aria-selected', 'true');
    });
  });

  it('switches to Insights panel when Insights tab is clicked', async () => {
    // Arrange
    await renderApp();
    const insightsTab = screen.getByRole('tab', { name: /insights/i });

    // Act
    await act(async () => {
      fireEvent.click(insightsTab);
    });

    // Assert
    expect(insightsTab).toHaveAttribute('aria-selected', 'true');
  });
});

// =====================================================================
// 3. Header Auth State
// =====================================================================
describe('Header Auth State', () => {
  it('shows a sign-in button when no user is authenticated', async () => {
    // Arrange & Act
    await renderApp();

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
  it('renders the correct number of tab elements (5)', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');
    expect(tabs).toHaveLength(5);
  });
});

// =====================================================================
// 7. Footer Details
// =====================================================================
describe('Footer Component', () => {
  it('contains copyright text', async () => {
    // Arrange & Act
    await renderApp();

    // Assert
    const footer = screen.getByRole('contentinfo');
    expect(footer.textContent).toMatch(/©|copyright/i);
  });
});

// =====================================================================
// 8. Calculator Panel
// =====================================================================
describe('Calculator Panel', () => {
  it('renders a textarea input for activity description', async () => {
    // Arrange & Act
    await renderApp();
    const calcTab = screen.getByRole('tab', { name: /calculator/i });
    await act(async () => {
      fireEvent.click(calcTab);
    });

    // Assert
    await waitFor(() => {
      const textarea = screen.getByRole('textbox');
      expect(textarea).toBeInTheDocument();
    });
  });

  it('renders category buttons for carbon categories', async () => {
    // Arrange & Act
    await renderApp();
    const calcTab = screen.getByRole('tab', { name: /calculator/i });
    await act(async () => {
      fireEvent.click(calcTab);
    });

    // Assert
    await waitFor(() => {
      const buttons = screen.getAllByRole('button').filter(
        (btn) => btn.closest('[data-testid="category-buttons"]') || btn.textContent.match(/transport|food|energy|shopping|waste/i)
      );
      expect(buttons.length).toBeGreaterThanOrEqual(1);
    });
  });
});

// =====================================================================
// 9. Dashboard Panel
// =====================================================================
describe('Dashboard Panel', () => {
  it('renders the dashboard as the default panel', async () => {
    await renderApp();
    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveAttribute('id', 'panel-dashboard');
  });

  it('shows carbon dashboard heading', async () => {
    await renderApp();
    const heading = screen.getByRole('heading', { name: /your carbon dashboard/i });
    expect(heading).toBeInTheDocument();
  });

  it('displays a Did You Know fact section', async () => {
    await renderApp();
    await waitFor(() => {
      expect(screen.getByText(/did you know/i)).toBeInTheDocument();
    });
  });

  it('shows navigation buttons to other tabs', async () => {
    await renderApp();
    await waitFor(() => {
      expect(screen.getByText(/calculate footprint/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/log activities/i)).toBeInTheDocument();
    expect(screen.getByText(/explore actions/i)).toBeInTheDocument();
    expect(screen.getByText(/get insights/i)).toBeInTheDocument();
  });
});

// =====================================================================
// 10. Toast Component
// =====================================================================
describe('Toast Component', () => {
  let Toast;

  beforeEach(async () => {
    const mod = await import('../src/components/Toast.jsx');
    Toast = mod.default;
  });

  it('renders with title and message', () => {
    render(<Toast type="success" title="Success Title" message="Success Message" onClose={() => {}} />);
    expect(screen.getByText('Success Title')).toBeInTheDocument();
    expect(screen.getByText('Success Message')).toBeInTheDocument();
  });

  it('calls onClose after duration', () => {
    vi.useFakeTimers();
    const onClose = vi.fn();
    render(<Toast type="info" title="Info" message="Info message" onClose={onClose} duration={3000} />);
    
    vi.advanceTimersByTime(3000);
    expect(onClose).toHaveBeenCalled();
    vi.useRealTimers();
  });
});
