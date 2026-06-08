/**
 * @fileoverview Root application component for CarbonWise.
 * Provides the main layout with full WCAG AA accessibility:
 * skip link, semantic landmarks, ARIA tablist, and keyboard navigation.
 *
 * @module App
 * @version 1.0.0
 */

import { useState, useCallback, useEffect } from 'react';
import ErrorBoundary from './components/ErrorBoundary.jsx';
import Header from './components/Header.jsx';
import Navigation from './components/Navigation.jsx';
import Footer from './components/Footer.jsx';
import Calculator from './components/Calculator.jsx';
import Tracker from './components/Tracker.jsx';
import Actions from './components/Actions.jsx';
import Insights from './components/Insights.jsx';
import { TABS } from './constants.js';
import { signInWithGoogle, signOutUser, onAuthChange, trackEvent } from './firebase.js';

/**
 * Root application component.
 * Manages tab navigation state, authentication, and status announcements.
 *
 * @returns {JSX.Element} The complete CarbonWise application
 */
function App() {
  const [activeTab, setActiveTab] = useState('calculator');
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setStatusMessage(`Signed in as ${firebaseUser.displayName || 'User'}`);
      }
    });
    return unsubscribe;
  }, []);

  /**
   * Handles tab switching with analytics tracking and status announcement.
   *
   * @param {string} tabId - The ID of the tab to activate
   */
  const handleTabChange = useCallback((tabId) => {
    setActiveTab(tabId);
    const tab = TABS.find((t) => t.id === tabId);
    setStatusMessage(`${tab?.label || tabId} tab selected`);
    trackEvent('tab_change', { tab: tabId });
  }, []);

  /**
   * Handles Google Sign-In flow.
   */
  const handleSignIn = useCallback(async () => {
    try {
      setStatusMessage('Signing in...');
      await signInWithGoogle();
    } catch (_err) {
      setStatusMessage('Sign-in failed. Please try again.');
    }
  }, []);

  /**
   * Handles user sign-out.
   */
  const handleSignOut = useCallback(async () => {
    try {
      await signOutUser();
      setUser(null);
      setStatusMessage('Signed out successfully');
    } catch (_err) {
      setStatusMessage('Sign-out failed.');
    }
  }, []);

  /**
   * Renders the active tab panel component.
   *
   * @returns {JSX.Element} The currently active tab panel
   */
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'calculator':
        return <Calculator />;
      case 'tracker':
        return <Tracker user={user} />;
      case 'actions':
        return <Actions />;
      case 'insights':
        return <Insights user={user} />;
      default:
        return <Calculator />;
    }
  };

  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <ErrorBoundary>
        <Header
          user={user}
          onSignIn={handleSignIn}
          onSignOut={handleSignOut}
          statusMessage={statusMessage}
        />
        <Navigation
          tabs={TABS}
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />
        <main id="main-content">
          {renderActivePanel()}
        </main>
        <Footer />
      </ErrorBoundary>
    </>
  );
}

export default App;
