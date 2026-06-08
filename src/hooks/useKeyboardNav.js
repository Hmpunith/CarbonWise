/**
 * @fileoverview Custom React hook for accessible keyboard navigation within
 * a tab list. Supports Arrow Left/Right to cycle between tabs and Home/End
 * to jump to the first or last tab.
 * @module hooks/useKeyboardNav
 */

import { useCallback } from 'react';

/**
 * Provides an `onKeyDown` handler that implements keyboard navigation for
 * a horizontal tab list following WAI-ARIA Authoring Practices.
 *
 * Supported keys:
 * - **ArrowRight** — move to the next tab (wraps to first).
 * - **ArrowLeft** — move to the previous tab (wraps to last).
 * - **Home** — move to the first tab.
 * - **End** — move to the last tab.
 *
 * @param {Array<{ id: string }>} tabs - Array of tab objects. Each must have an `id` property.
 * @param {string} activeTab - The `id` of the currently active tab.
 * @param {(tabId: string) => void} onTabChange - Callback invoked with the new tab `id`.
 * @returns {{ onKeyDown: (event: React.KeyboardEvent) => void }} Object containing the keydown handler.
 *
 * @example
 * const { onKeyDown } = useKeyboardNav(TABS, activeTab, setActiveTab);
 * return <div role="tablist" onKeyDown={onKeyDown}>…</div>;
 */
const useKeyboardNav = (tabs, activeTab, onTabChange) => {
  const onKeyDown = useCallback(
    (event) => {
      const currentIndex = tabs.findIndex((tab) => tab.id === activeTab);
      if (currentIndex === -1) {return;}

      let nextIndex;

      switch (event.key) {
        case 'ArrowRight':
          event.preventDefault();
          nextIndex = (currentIndex + 1) % tabs.length;
          onTabChange(tabs[nextIndex].id);
          break;

        case 'ArrowLeft':
          event.preventDefault();
          nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
          onTabChange(tabs[nextIndex].id);
          break;

        case 'Home':
          event.preventDefault();
          onTabChange(tabs[0].id);
          break;

        case 'End':
          event.preventDefault();
          onTabChange(tabs[tabs.length - 1].id);
          break;

        default:
          break;
      }
    },
    [tabs, activeTab, onTabChange],
  );

  return { onKeyDown };
};

export default useKeyboardNav;
