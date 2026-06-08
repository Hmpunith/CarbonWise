/**
 * @fileoverview Eco-actions panel for CarbonWise.
 * Displays a filterable grid of actionable recommendations to reduce
 * carbon footprint, fetched from the backend API.
 * @module components/Actions
 */

import { useState, useEffect, useCallback } from 'react';
import { CARBON_CATEGORIES } from '../constants.js';
import { fetchActions as fetchActionsApi } from '../utils/apiClient.js';
import { trackEvent } from '../firebase.js';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Eco-actions tab panel with category filters and action cards.
 *
 * @returns {JSX.Element}
 */
const Actions = () => {
  const [actions, setActions] = useState([]);
  const [activeCategory, setActiveCategory] = useState('transport');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Fetches actions for the given category from the backend.
   * @param {string} category
   */
  const handleFetchActions = useCallback(async (category) => {
    setLoading(true);
    setError('');
    trackEvent('actions_fetch', { category });

    try {
      const data = await fetchActionsApi(category);
      setActions(data.actions || data || []);
    } catch (err) {
      setError(err.message || 'Failed to load actions.');
      trackEvent('actions_error', { error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  /* Fetch default category on mount */
  useEffect(() => {
    handleFetchActions(activeCategory);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /**
   * Handles category filter button click.
   * @param {string} categoryId
   */
  const handleCategoryChange = useCallback(
    (categoryId) => {
      setActiveCategory(categoryId);
      trackEvent('actions_category_change', { category: categoryId });
      handleFetchActions(categoryId);
    },
    [handleFetchActions],
  );

  /**
   * Returns a CSS class name for the difficulty badge.
   * @param {string} difficulty
   * @returns {string}
   */
  const getDifficultyClass = (difficulty) => {
    const d = (difficulty || '').toLowerCase();
    if (d === 'easy') return 'difficulty--easy';
    if (d === 'medium') return 'difficulty--medium';
    return 'difficulty--committed';
  };

  return (
    <section
      className="panel"
      role="tabpanel"
      id="panel-actions"
      aria-labelledby="tab-actions"
      aria-busy={loading}
    >
      <h2 className="section-title">Eco Actions</h2>
      <p className="section-subtitle">
        Discover practical steps to reduce your carbon footprint.
      </p>

      {/* Category filters */}
      <div className="category-filters" role="group" aria-label="Filter actions by category">
        {CARBON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-btn ${activeCategory === cat.id ? 'category-btn--active' : ''}`}
            onClick={() => handleCategoryChange(cat.id)}
            aria-pressed={activeCategory === cat.id}
            aria-label={`Show ${cat.label} actions`}
          >
            <span aria-hidden="true">{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Loading */}
      {loading && <LoadingSpinner message="Finding eco-friendly actions…" />}

      {/* Error */}
      {error && (
        <div className="error-alert" role="alert">
          <span aria-hidden="true">❌</span> {error}
        </div>
      )}

      {/* Actions grid */}
      {!loading && !error && actions.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">🌱</span>
          <p className="empty-state__text">
            No actions found for this category yet. Try selecting a different category above.
          </p>
        </div>
      )}

      {!loading && actions.length > 0 && (
        <div className="actions-grid" role="list" aria-label="Eco-friendly actions">
          {actions.map((action, index) => (
            <article
              className="action-card"
              key={action.id || index}
              role="listitem"
            >
              <div className="action-card__icon" aria-hidden="true">
                {action.icon || '🌍'}
              </div>
              <h3 className="action-card__title">{action.title}</h3>
              <p className="action-card__description">
                {action.description}
              </p>
              <div className="action-card__footer">
                {action.annualSaving && (
                  <span
                    className="action-card__saving"
                    aria-label={`Saves ${action.annualSaving} kg CO₂ per year`}
                  >
                    💚 {action.annualSaving} kg/yr
                  </span>
                )}
                {action.difficulty && (
                  <span
                    className={`difficulty ${getDifficultyClass(action.difficulty)}`}
                    aria-label={`Difficulty: ${action.difficulty}`}
                  >
                    {action.difficulty}
                  </span>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
};

export default Actions;
