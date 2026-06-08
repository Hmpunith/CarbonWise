/**
 * @fileoverview Tab navigation component for CarbonWise.
 * Renders a horizontal tab bar with full keyboard navigation
 * following WAI-ARIA Authoring Practices for tab lists.
 * @module components/Navigation
 */

import { useCallback, useRef, useEffect } from 'react';
import useKeyboardNav from '../hooks/useKeyboardNav.js';
import { trackEvent } from '../firebase.js';

/**
 * Accessible tab navigation bar.
 *
 * @param {Object} props
 * @param {Array<{ id: string, label: string, icon: string, ariaLabel: string }>} props.tabs - Tab definitions to render.
 * @param {string} props.activeTab - The `id` of the currently active tab.
 * @param {(tabId: string) => void} props.onTabChange - Callback invoked when a tab is selected.
 * @param {Object.<string, number>} [props.counts={}] - Optional map of tab id → notification count to display badges.
 * @returns {JSX.Element}
 */
const Navigation = ({ tabs = [], activeTab = '', onTabChange, counts = {} }) => {
  const safeTabs = Array.isArray(tabs) ? tabs : [];
  const tabRefs = useRef({});
  const { onKeyDown } = useKeyboardNav(safeTabs, activeTab, onTabChange);

  /**
   * Handles tab button click.
   * @param {string} tabId
   */
  const handleTabClick = useCallback(
    (tabId) => {
      trackEvent('tab_change', { tab: tabId });
      if (typeof onTabChange === 'function') onTabChange(tabId);
    },
    [onTabChange],
  );

  /* Move DOM focus to the active tab when it changes */
  useEffect(() => {
    const el = tabRefs.current[activeTab];
    if (el) el.focus();
  }, [activeTab]);

  return (
    <div
      className="tab-nav"
      role="tablist"
      aria-label="Main navigation"
      onKeyDown={onKeyDown}
    >
      {safeTabs.map((tab) => {
        const isActive = tab.id === activeTab;
        const count = counts[tab.id] || 0;
        return (
          <button
            key={tab.id}
            ref={(el) => {
              tabRefs.current[tab.id] = el;
            }}
            role="tab"
            type="button"
            id={`tab-${tab.id}`}
            className="tab-btn"
            aria-selected={isActive}
            aria-controls={`panel-${tab.id}`}
            aria-current={isActive ? 'page' : undefined}
            aria-label={
              count > 0
                ? `${tab.ariaLabel} (${count} items)`
                : tab.ariaLabel
            }
            tabIndex={isActive ? 0 : -1}
            onClick={() => handleTabClick(tab.id)}
          >
            <span className="tab-btn__icon tab-btn__icon--lg" aria-hidden="true">
              {tab.icon}
            </span>
            <span className="tab-btn__label">{tab.label}</span>
            {count > 0 && (
              <span className="tab-btn__count" aria-hidden="true">
                {count > 99 ? '99+' : count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
