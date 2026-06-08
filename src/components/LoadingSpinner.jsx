/**
 * @fileoverview Accessible loading spinner for CarbonWise.
 * Announces loading state to screen readers via aria-live.
 * @module components/LoadingSpinner
 */

/**
 * Accessible loading indicator with optional custom message.
 *
 * @param {Object} props
 * @param {string} [props.message='Loading, please wait'] - Message displayed below the spinner and announced to screen readers.
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({ message = 'Loading, please wait' }) => {
  return (
    <div
      className="spinner-container"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="spinner" aria-hidden="true" />
      <span className="spinner-text">{message}</span>
      <span className="sr-only">{message}</span>
    </div>
  );
};

export default LoadingSpinner;
