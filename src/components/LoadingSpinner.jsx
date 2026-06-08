/**
 * @fileoverview Accessible loading spinner for CarbonWise.
 * Announces loading state to screen readers via aria-live.
 * @module components/LoadingSpinner
 */

import PropTypes from 'prop-types';

/**
 * Accessible loading indicator with optional custom message.
 *
 * @param {Object} props
 * @param {string} [props.message='Loading, please wait'] - Message displayed below the spinner and announced to screen readers.
 * @returns {JSX.Element}
 */
const LoadingSpinner = ({ message = 'Loading, please wait' }) => {
  const safeMessage = typeof message === 'string' ? message : 'Loading, please wait';
  return (
    <div
      className="spinner-container"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      <div className="eco-loader" aria-hidden="true">
        <div className="eco-loader__leaf-ring">
          <span className="eco-loader__leaf">🍃</span>
        </div>
        <div className="eco-loader__dots">
          <span className="eco-loader__dot eco-loader__dot--1" />
          <span className="eco-loader__dot eco-loader__dot--2" />
          <span className="eco-loader__dot eco-loader__dot--3" />
        </div>
      </div>
      <span className="spinner-text">{safeMessage}</span>
      <span className="sr-only">{safeMessage}</span>
    </div>
  );
};

LoadingSpinner.propTypes = {
  message: PropTypes.string,
};

export default LoadingSpinner;
