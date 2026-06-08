/**
 * @fileoverview Personalized insights panel for CarbonWise.
 * Generates AI-powered insights from tracked activity data, displaying
 * a summary, top source, prioritised recommendations, weekly trend,
 * and comparison to average.
 * @module components/Insights
 */

import { useState, useCallback } from 'react';
import { generateInsights } from '../utils/apiClient.js';
import { trackEvent, trackInsightViewed, getActivities } from '../firebase.js';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Returns a CSS class for priority badges.
 * @param {string} priority
 * @returns {string}
 */
const getPriorityClass = (priority) => {
  const p = (priority || '').toLowerCase();
  if (p === 'high') return 'priority--high';
  if (p === 'medium') return 'priority--medium';
  return 'priority--low';
};

/**
 * Insights tab panel showing AI-generated personalised recommendations,
 * weekly trends, and comparison to average carbon output.
 *
 * @returns {JSX.Element}
 */
const Insights = () => {
  const [insights, setInsights] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Gathers tracked activities and sends them to the insights API.
   */
  const handleGenerate = useCallback(async () => {
    setLoading(true);
    setError('');
    trackEvent('insights_generate_click');

    try {
      const activities = await getActivities(50);
      if (!activities || activities.length === 0) {
        setError('No tracked activities found. Please log some activities in the Tracker tab first.');
        setLoading(false);
        return;
      }
      const data = await generateInsights(JSON.stringify(activities));
      setInsights(data);
      trackInsightViewed();
      trackEvent('insights_generated', {
        insightCount: data.insights?.length ?? 0,
      });
    } catch (err) {
      setError(err.message || 'Failed to generate insights.');
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <section
      className="panel"
      role="tabpanel"
      id="panel-insights"
      aria-labelledby="tab-insights"
      aria-busy={loading}
    >
      <h2 className="section-title">Personalized Insights</h2>
      <p className="section-subtitle">
        Get AI-powered recommendations based on your tracked activities.
      </p>

      {/* Generate button */}
      {!insights && !loading && (
        <div className="text-center py-xl">
          <button
            type="button"
            className="btn btn--primary"
            onClick={handleGenerate}
            aria-label="Generate my personalized carbon insights"
          >
            Generate My Insights
          </button>
          <p className="input-help mt-md">
            We'll analyse your tracked activities to provide tailored recommendations.
          </p>
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner message="Generating your personalized insights…" />}

      {/* Error */}
      {error && (
        <div className="error-alert mb-md" role="alert">
          <span aria-hidden="true">❌</span> {error}
        </div>
      )}

      {/* Results */}
      {insights && !loading && (
        <>
          {/* Summary */}
          {insights.summary && (
            <div className="glass glass--elevated card--spaced">
              <p className="insight-summary-text">
                {insights.summary}
              </p>
            </div>
          )}

          {/* Top source & stats row */}
          <div className="stats-row card--spaced">
            {insights.topSource && (
              <div className="stat-box">
                <div className="stat-box__value">{insights.topSource.icon || '🏭'}</div>
                <div className="stat-box__label">Top Source</div>
                <div className="stat-box__detail">
                  {insights.topSource.label || insights.topSource}
                </div>
              </div>
            )}

            {insights.weeklyTrend != null && (
              <div className="stat-box">
                <div className="stat-box__value">
                  {insights.weeklyTrend >= 0 ? '📈' : '📉'} {Math.abs(insights.weeklyTrend)}%
                </div>
                <div className="stat-box__label">Weekly Trend</div>
                <div className="stat-box__detail">
                  {insights.weeklyTrend >= 0 ? 'Increased' : 'Decreased'} from last week
                </div>
              </div>
            )}

            {insights.comparisonToAverage != null && (
              <div className="stat-box">
                <div className="stat-box__value">
                  {insights.comparisonToAverage > 0 ? '+' : ''}
                  {insights.comparisonToAverage}%
                </div>
                <div className="stat-box__label">vs Average</div>
                <div className="stat-box__detail">
                  {insights.comparisonToAverage > 0
                    ? 'Above average — room to improve'
                    : 'Below average — great job!'}
                </div>
              </div>
            )}
          </div>

          {/* Insight cards */}
          {insights.insights && insights.insights.length > 0 && (
            <div className="insights-grid">
              {insights.insights.map((insight, i) => (
                <article className="insight-card" key={insight.id || i}>
                  <div className="insight-card__header">
                    <h3 className="insight-card__title">{insight.title}</h3>
                    {insight.priority && (
                      <span
                        className={`priority ${getPriorityClass(insight.priority)}`}
                        aria-label={`Priority: ${insight.priority}`}
                      >
                        {insight.priority}
                      </span>
                    )}
                  </div>
                  <p className="insight-card__description">
                    {insight.description}
                  </p>
                  {insight.potentialSaving && (
                    <p className="insight-card__saving">
                      💚 Could save ~{insight.potentialSaving} kg CO₂/year
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}

          {/* Regenerate button */}
          <div className="text-center mt-xl">
            <button
              type="button"
              className="btn"
              onClick={handleGenerate}
              disabled={loading}
              aria-label="Regenerate personalized insights"
            >
              Regenerate Insights
            </button>
          </div>
        </>
      )}

      {/* Empty state — insights generated but empty */}
      {insights && !loading && (!insights.insights || insights.insights.length === 0) && !insights.summary && (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">📊</span>
          <p className="empty-state__text">
            Not enough data to generate insights yet. Log more activities in the Tracker tab first!
          </p>
        </div>
      )}
    </section>
  );
};

export default Insights;
