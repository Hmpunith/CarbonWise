/**
 * @fileoverview Carbon footprint calculator panel for CarbonWise.
 * Allows users to describe activities, select categories, and receive
 * AI-powered carbon footprint estimates with breakdowns, equivalents, and tips.
 * @module components/Calculator
 */

import { useState, useCallback, useRef } from 'react';
import { CARBON_CATEGORIES, getImpactLevel } from '../constants.js';
import { calculateCarbon } from '../utils/apiClient.js';
import { trackEvent, trackCalculation } from '../firebase.js';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Carbon footprint calculator tab panel.
 * Sends a natural-language activity description to the backend and displays
 * the estimated CO₂ output with a breakdown, equivalents, and tips.
 *
 * @returns {JSX.Element}
 */
const Calculator = () => {
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validationError, setValidationError] = useState('');
  const textareaRef = useRef(null);
  const helpId = 'calc-help-text';
  const errorId = 'calc-error-text';

  /**
   * Selects a quick category and pre-fills the textarea.
   * @param {import('../constants.js').CarbonCategory} category
   */
  const handleCategoryClick = useCallback((category) => {
    setSelectedCategory(category.id);
    setDescription((prev) =>
      prev ? prev : `My ${category.label.toLowerCase()} activities this week`,
    );
    trackEvent('category_selected', { category: category.id });
  }, []);

  /**
   * Validates input and submits to the calculation API.
   * @param {React.FormEvent} e
   */
  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      setValidationError('');
      setError('');

      if (!description.trim()) {
        setValidationError('Please describe your activity before calculating.');
        textareaRef.current?.focus();
        return;
      }

      setLoading(true);
      setResult(null);
      trackEvent('calculate_submit', { category: selectedCategory });

      try {
        const data = await calculateCarbon(description, selectedCategory);
        setResult(data);
        trackCalculation(selectedCategory || 'general');
        trackEvent('calculate_success', {
          totalCarbon: data.totalCarbonKg ?? 0,
        });
      } catch (err) {
        setError(err.message || 'Failed to calculate carbon footprint.');
        trackEvent('calculate_error', { error: err.message });
      } finally {
        setLoading(false);
      }
    },
    [description, selectedCategory],
  );

  const impactLevel = result?.totalCarbonKg
    ? getImpactLevel(result.totalCarbonKg)
    : null;

  return (
    <section
      className="panel"
      role="tabpanel"
      id="panel-calculator"
      aria-labelledby="tab-calculator"
      aria-busy={loading}
    >
      <h2 className="section-title">Carbon Calculator</h2>
      <p className="section-subtitle">
        Describe your daily activities and get an AI-powered carbon estimate.
      </p>

      {/* Category quick-select */}
      <div className="category-filters" role="group" aria-label="Activity categories">
        {CARBON_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={`category-btn ${selectedCategory === cat.id ? 'category-btn--active' : ''}`}
            onClick={() => handleCategoryClick(cat)}
            aria-pressed={selectedCategory === cat.id}
            aria-label={`${cat.label}: ${cat.description}`}
          >
            <span aria-hidden="true">{cat.icon}</span> {cat.label}
          </button>
        ))}
      </div>

      {/* Input form */}
      <form onSubmit={handleSubmit} noValidate>
        <div className="form-group">
          <label htmlFor="calc-textarea">Describe your activities</label>
          <textarea
            ref={textareaRef}
            id="calc-textarea"
            className="input"
            rows={4}
            placeholder="e.g. I drove 30 km to work, had a beef burger for lunch, and left the AC on all day…"
            value={description}
            onChange={(e) => {
              setDescription(e.target.value);
              if (validationError) setValidationError('');
            }}
            aria-describedby={`${helpId} ${validationError ? errorId : ''}`}
            aria-invalid={!!validationError}
          />
          <span id={helpId} className="input-help">
            Tip: Be specific — mention distances, quantities, and durations for a more accurate estimate.
          </span>
          {validationError && (
            <span id={errorId} className="input-error" role="alert">
              {validationError}
            </span>
          )}
        </div>

        <div className="mt-md">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={loading}
            aria-label="Calculate my carbon footprint"
          >
            {loading ? '⏳ Calculating…' : '🌍 Calculate Footprint'}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && <LoadingSpinner message="Analyzing your carbon footprint…" />}

      {/* Error */}
      {error && (
        <div className="error-alert mt-md" role="alert">
          <span aria-hidden="true">❌</span> {error}
        </div>
      )}

      {/* Results */}
      {result && !loading && (
        <div className="card mt-lg">
          {/* Total carbon */}
          <div className="carbon-result">
            <div className="carbon-result__value">
              {result.totalCarbonKg?.toFixed(1) ?? '—'}
              <span className="carbon-result__unit"> kg CO₂</span>
            </div>
            <p className="carbon-result__label">Estimated carbon footprint</p>
            {impactLevel && (
              <span className={`badge badge--${impactLevel.className} mt-sm`}>
                {impactLevel.label}
              </span>
            )}
          </div>

          {/* Impact meter */}
          {impactLevel && (
            <div className="carbon-meter" role="progressbar" aria-valuenow={result.totalCarbonKg} aria-valuemin={0} aria-valuemax={100} aria-label="Carbon impact level">
              <div
                className={`carbon-meter__fill carbon-meter__fill--${impactLevel.className}`}
                style={{ width: `${Math.min((result.totalCarbonKg / 50) * 100, 100)}%` }}
              />
            </div>
          )}

          {/* Breakdown */}
          {result.breakdown && result.breakdown.length > 0 && (
            <div className="mt-lg">
              <h3 className="section-title heading--sm">Breakdown</h3>
              <div className="breakdown-list">
                {result.breakdown.map((item, i) => (
                  <div className="breakdown-item" key={i}>
                    <span className="breakdown-item__label">
                      <span aria-hidden="true">📊</span>
                      {item.item}
                    </span>
                    <span className="breakdown-item__value">
                      {item.carbonKg?.toFixed(2) ?? '—'} kg
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Equivalents */}
          {result.equivalents && result.equivalents.length > 0 && (
            <div className="mt-lg">
              <h3 className="section-title heading--sm">That's equivalent to…</h3>
              <div className="equivalents">
                {result.equivalents.map((eq, i) => (
                  <div className="equivalent-item" key={i}>
                    <div className="equivalent-item__icon" aria-hidden="true">🔄</div>
                    <div>{eq}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {result.tips && result.tips.length > 0 && (
            <div className="mt-lg">
              <h3 className="section-title heading--sm">Tips to Reduce</h3>
              <div className="tips-list">
                {result.tips.map((tip, i) => (
                  <div className="tip-item" key={i}>
                    <span aria-hidden="true">🌱</span>
                    <span>{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};

export default Calculator;
