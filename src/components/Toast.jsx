/**
 * @fileoverview Toast notification component for CarbonWise.
 * Displays temporary status messages with visual styling based on severity.
 * @module components/Toast
 */

import { useEffect } from 'react';

/**
 * Toast component.
 *
 * @param {Object} props
 * @param {string} props.type - The notification type ('success', 'error', 'warning', 'info')
 * @param {string} props.title - The title of the notification
 * @param {string} props.message - The detailed message
 * @param {() => void} props.onClose - Callback to close/remove the toast
 * @param {number} [props.duration=4000] - Duration in ms before auto-closing
 * @returns {JSX.Element}
 */
const Toast = ({ type = 'info', title = '', message = '', onClose, duration = 4000 }) => {
  useEffect(() => {
    if (typeof onClose !== 'function') return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className={`toast toast--${type}`} role="alert" aria-live="assertive">
      <div className="toast__title">{title}</div>
      <div className="toast__message">{message}</div>
    </div>
  );
};

export default Toast;
