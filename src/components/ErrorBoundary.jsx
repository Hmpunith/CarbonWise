/**
 * @fileoverview React Error Boundary component for CarbonWise.
 * Catches JavaScript errors anywhere in its child component tree, logs
 * the error, and renders a styled fallback UI with a retry button.
 * @module components/ErrorBoundary
 */

import { Component } from 'react';

/**
 * Error Boundary that catches rendering errors in descendant components
 * and displays an accessible fallback UI.
 *
 * @extends {Component<{ children: React.ReactNode }, { hasError: boolean, error: Error | null }>}
 *
 * @example
 * <ErrorBoundary>
 *   <App />
 * </ErrorBoundary>
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    /** @type {{ hasError: boolean, error: Error | null }} */
    this.state = { hasError: false, error: null };
  }

  /**
   * Derives error state from a caught error so the next render
   * shows the fallback UI.
   *
   * @param {Error} error - The error that was thrown.
   * @returns {{ hasError: boolean, error: Error }}
   */
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  /**
   * Logs the error and component stack to the console for debugging.
   *
   * @param {Error} error - The error that was thrown.
   * @param {{ componentStack: string }} errorInfo - React component stack trace.
   */
  componentDidCatch(error, errorInfo) {
    console.error('[CarbonWise] ErrorBoundary caught an error:', error);
    console.error('[CarbonWise] Component stack:', errorInfo.componentStack);
  }

  /**
   * Resets the error state so the children attempt to re-render.
   */
  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary" role="alert">
          <span className="error-boundary__icon" aria-hidden="true">
            ⚠️
          </span>
          <h2 className="error-boundary__title">Something went wrong</h2>
          <p className="error-boundary__message">
            An unexpected error occurred while rendering this section.
            Please try again or refresh the page.
          </p>
          <button
            className="btn btn--primary"
            onClick={this.handleRetry}
            type="button"
            aria-label="Retry loading the application"
          >
            🔄 Try Again
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
