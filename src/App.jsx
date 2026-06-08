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
import Dashboard from './components/Dashboard.jsx';
import Toast from './components/Toast.jsx';
import { TABS } from './constants.js';
import { signInWithGoogle, signOutUser, onAuthChange, trackEvent } from './firebase.js';

/**
 * Root application component.
 * Manages tab navigation state, authentication, and status announcements.
 *
 * @returns {JSX.Element} The complete CarbonWise application
 */
function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [user, setUser] = useState(null);
  const [statusMessage, setStatusMessage] = useState('');
  const [toast, setToast] = useState(null);

  // Subscribe to Firebase Auth state changes
  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        setStatusMessage(`Signed in as ${firebaseUser.displayName || 'User'}`);
        setToast({
          type: 'success',
          title: 'Authentication',
          message: `Successfully signed in as ${firebaseUser.displayName || firebaseUser.email || 'User'}`,
        });
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
      setToast({
        type: 'info',
        title: 'Authentication',
        message: 'Signing in with Google...',
      });
      await signInWithGoogle();
    } catch (err) {
      console.error('[App] Google Sign-In Error:', err);
      setStatusMessage(`Sign-in failed: ${err.message}`);
      setToast({
        type: 'error',
        title: 'Sign-In Failed',
        message: err.message || 'Please try again. Check if popups or third-party cookies are blocked.',
        duration: 6000,
      });
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
      setToast({
        type: 'success',
        title: 'Authentication',
        message: 'Successfully signed out.',
      });
    } catch (err) {
      console.error('[App] Sign-Out Error:', err);
      setStatusMessage('Sign-out failed.');
      setToast({
        type: 'error',
        title: 'Sign-Out Failed',
        message: err.message || 'Failed to sign out. Please try again.',
      });
    }
  }, []);

  /**
   * Renders the active tab panel component.
   *
   * @returns {JSX.Element} The currently active tab panel
   */
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard user={user} onNavigate={handleTabChange} />;
      case 'calculator':
        return <Calculator />;
      case 'tracker':
        return <Tracker user={user} />;
      case 'actions':
        return <Actions />;
      case 'insights':
        return <Insights user={user} />;
      default:
        return <Dashboard user={user} onNavigate={handleTabChange} />;
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
        {toast && (
          <Toast
            type={toast.type}
            title={toast.title}
            message={toast.message}
            duration={toast.duration}
            onClose={() => setToast(null)}
          />
        )}
      </ErrorBoundary>
    </>
  );
}

export default App;
