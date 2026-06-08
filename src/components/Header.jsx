/**
 * @fileoverview Header component for CarbonWise.
 * Displays the app title, subtitle, Google Sign-In/Out button,
 * and a live status announcer for screen readers.
 * @module components/Header
 */

import { useCallback } from 'react';
import { APP_META } from '../constants.js';
import { trackEvent } from '../firebase.js';

/**
 * Application header with branding, authentication controls,
 * and an accessible live region for status updates.
 *
 * @param {Object} props
 * @param {import('firebase/auth').User | null} props.user - The currently signed-in Firebase user, or null.
 * @param {() => Promise<void>} props.onSignIn - Callback to initiate Google Sign-In.
 * @param {() => Promise<void>} props.onSignOut - Callback to sign the user out.
 * @param {string} props.statusMessage - Live status message announced to screen readers.
 * @returns {JSX.Element}
 */
const Header = ({ user, onSignIn, onSignOut, statusMessage }) => {
  const handleAuthClick = useCallback(() => {
    if (user) {
      trackEvent('header_sign_out_click');
      onSignOut();
    } else {
      trackEvent('header_sign_in_click');
      onSignIn();
    }
  }, [user, onSignIn, onSignOut]);

  return (
    <header className="header" role="banner">
      <h1 className="header__title">
        <span aria-hidden="true">🌿 </span>
        {APP_META.name}
      </h1>

      <p className="header__subtitle">{APP_META.description}</p>

      <div className="header__user">
        {user && (
          <span className="header__user-name">
            Hi, {user.displayName || 'User'}
          </span>
        )}
        <button
          className="btn btn--small"
          onClick={handleAuthClick}
          type="button"
          aria-label={user ? 'Sign out of your account' : 'Sign in with Google'}
        >
          {user ? '🚪 Sign Out' : '🔑 Sign In with Google'}
        </button>
      </div>

      {/* Live region for screen reader announcements */}
      <span role="status" aria-live="polite" className="sr-only">
        {statusMessage}
      </span>
    </header>
  );
};

export default Header;
