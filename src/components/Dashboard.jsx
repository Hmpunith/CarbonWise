/**
 * @fileoverview Dashboard overview panel for CarbonWise.
 * Provides a unified view of the user's carbon footprint journey:
 * understand (education), track (activity summary), and reduce (goals & actions).
 * Directly addresses the challenge problem statement.
 * @module components/Dashboard
 */

import { useState, useEffect, useCallback } from 'react';
import { getActivities, trackEvent } from '../firebase.js';
import { CARBON_CATEGORIES, getImpactLevel, APP_META } from '../constants.js';
import LoadingSpinner from './LoadingSpinner.jsx';
import PropTypes from 'prop-types';

/**
 * Calculates category-level carbon totals from an activities array.
 *
 * @param {Array<Object>} activities - Array of activity objects with category and carbonKg fields.
 * @returns {Object<string, number>} Map of category id to total CO₂ in kg.
 */
const getCategoryTotals = (activities) => {
  const totals = {};
  for (const act of activities) {
    if (act.category && typeof act.carbonKg === 'number') {
      totals[act.category] = (totals[act.category] || 0) + act.carbonKg;
    }
  }
  return totals;
};

/**
 * Calculates the total carbon footprint from an activities array.
 *
 * @param {Array<Object>} activities - Array of activity objects.
 * @returns {number} Total carbon in kg CO₂.
 */
const getTotalCarbon = (activities) => {
  return activities.reduce((sum, act) => sum + (act.carbonKg || 0), 0);
};

/** @constant {number} DAILY_GOAL_KG - Recommended daily carbon budget in kg CO₂ */
const DAILY_GOAL_KG = 16.0;

/** @constant {number} GLOBAL_AVG_ANNUAL_KG - Global average annual CO₂ per person */
const GLOBAL_AVG_ANNUAL_KG = 4000;

/** @constant {number} INDIA_AVG_ANNUAL_KG - India average annual CO₂ per person */
const INDIA_AVG_ANNUAL_KG = 1900;

/**
 * @constant {Array<Object>} CARBON_FACTS
 * Educational facts about carbon footprint to help users understand their impact.
 */
const CARBON_FACTS = [
  { icon: '🌍', fact: 'The average person produces about 4 tonnes of CO₂ per year globally.' },
  { icon: '🚗', fact: 'A single car produces about 4.6 metric tonnes of CO₂ per year on average.' },
  { icon: '🥩', fact: 'Producing 1 kg of beef generates approximately 27 kg of CO₂ equivalent.' },
  { icon: '✈️', fact: 'A round-trip flight from Delhi to London produces ~1.6 tonnes of CO₂ per passenger.' },
  { icon: '🌳', fact: 'A single mature tree absorbs about 22 kg of CO₂ per year.' },
  { icon: '💡', fact: 'Switching to LED bulbs can reduce lighting energy use by 75%.' },
  { icon: '♻️', fact: 'Recycling one aluminium can saves enough energy to run a TV for 3 hours.' },
  { icon: '🏠', fact: 'Home energy use accounts for about 20% of the average carbon footprint.' },
];

/**
 * Dashboard tab panel providing a unified carbon footprint overview.
 * Shows total tracked carbon, category breakdown, daily goal progress,
 * educational facts, and quick navigation to other tabs.
 *
 * @param {Object} props
 * @param {import('firebase/auth').User | null} props.user - The currently signed-in user.
 * @param {(tabId: string) => void} props.onNavigate - Callback to switch to another tab.
 * @returns {JSX.Element}
 */
const Dashboard = ({ user, onNavigate }) => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [factIndex, setFactIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getActivities(50);
        if (!cancelled) {
          setActivities(data);
        }
      } catch {
        // Activities unavailable — show empty dashboard gracefully
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Rotate carbon facts every 8 seconds
  useEffect(() => {
    if (!isAutoPlaying) { return; }
    const interval = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % CARBON_FACTS.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [factIndex, isAutoPlaying]);

  const handleManualFactChange = useCallback((newIndex) => {
    setFactIndex(newIndex);
    setIsAutoPlaying(false);
  }, []);

  const handleNavigate = useCallback((tabId) => {
    trackEvent('dashboard_navigate', { target: tabId });
    onNavigate(tabId);
  }, [onNavigate]);

  const totalCarbon = getTotalCarbon(activities);
  const categoryTotals = getCategoryTotals(activities);
  const impactLevel = getImpactLevel(totalCarbon);
  const currentFact = CARBON_FACTS[factIndex];
  const goalProgress = Math.min((totalCarbon / DAILY_GOAL_KG) * 100, 100);
  
  let meterLevelClass = 'low';
  if (goalProgress > 80) { meterLevelClass = 'high'; }
  else if (goalProgress > 50) { meterLevelClass = 'moderate'; }

  return (
    <section
      className="panel"
      role="tabpanel"
      id="panel-dashboard"
      aria-labelledby="tab-dashboard"
      aria-busy={loading}
    >
      {/* Welcome section */}
      <h2 className="section-title">Your Carbon Dashboard</h2>
      <p className="section-subtitle">
        {user
          ? `Welcome back, ${user.displayName || 'there'}! Here's your carbon footprint overview.`
          : `Welcome to ${APP_META.name}! Sign in to track your personal carbon journey.`}
      </p>

      {loading && <LoadingSpinner message="Loading your dashboard…" />}

      {!loading && (
        <>
          {/* ── Understand Section ──────────────────────────── */}
          <div className="glass glass--elevated dashboard__fact-container">
            <h3 className="dashboard__fact-title">
              🌍 Did You Know?
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 'var(--space-md)' }}>
              <button 
                type="button" 
                className="btn btn--ghost" 
                style={{ padding: 'var(--space-xs)', minWidth: 'auto' }}
                onClick={() => handleManualFactChange((factIndex - 1 + CARBON_FACTS.length) % CARBON_FACTS.length)}
                aria-label="Previous fact"
              >
                ◀
              </button>
              <p className="dashboard__fact-text" style={{ flex: 1, margin: 0 }}>
                <span aria-hidden="true">{currentFact.icon}</span>
                {currentFact.fact}
              </p>
              <button 
                type="button" 
                className="btn btn--ghost" 
                style={{ padding: 'var(--space-xs)', minWidth: 'auto' }}
                onClick={() => handleManualFactChange((factIndex + 1) % CARBON_FACTS.length)}
                aria-label="Next fact"
              >
                ▶
              </button>
            </div>
            <div className="dashboard__fact-dots">
              {CARBON_FACTS.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => handleManualFactChange(i)}
                  className={`dashboard__fact-dot ${i === factIndex ? 'dashboard__fact-dot--active' : ''}`}
                  aria-label={`Show fact ${i + 1}`}
                />
              ))}
            </div>
          </div>

          {/* ── Track Section: Stats Overview ───────────────── */}
          <div className="stats-row card--spaced">
            <div className="stat-box">
              <div className="stat-box__value">{activities.length}</div>
              <div className="stat-box__label">Activities Tracked</div>
            </div>
            <div className="stat-box">
              <div className="stat-box__value" style={{ color: impactLevel.color }}>
                {totalCarbon.toFixed(1)}
              </div>
              <div className="stat-box__label">Total kg CO₂</div>
            </div>
            <div className="stat-box">
              <div className="stat-box__value">{Object.keys(categoryTotals).length}</div>
              <div className="stat-box__label">Categories Covered</div>
            </div>
          </div>

          {/* ── Carbon Budget Progress ──────────────────────── */}
          <div className="card card--spaced">
            <h3 className="dashboard__section-heading">
              📊 Daily Carbon Budget
            </h3>
            <p className="dashboard__budget-label">
              Recommended daily budget: {DAILY_GOAL_KG} kg CO₂ (based on global average of {GLOBAL_AVG_ANNUAL_KG / 1000} tonnes/year)
            </p>
            <div className="carbon-meter" role="progressbar" aria-valuenow={totalCarbon} aria-valuemin={0} aria-valuemax={DAILY_GOAL_KG} aria-label="Daily carbon budget usage">
              <div
                className={`carbon-meter__fill carbon-meter__fill--${meterLevelClass}`}
                style={{ width: `${goalProgress}%` }}
              />
            </div>
            <p className="dashboard__budget-status">
              {totalCarbon.toFixed(1)} / {DAILY_GOAL_KG} kg CO₂
              {goalProgress < 50 && ' — Great job staying under budget! 🌟'}
              {goalProgress >= 50 && goalProgress < 80 && ' — Getting close to your budget.'}
              {goalProgress >= 80 && ' — Over budget! Check the Actions tab for reduction tips. ⚠️'}
            </p>
          </div>

          {/* ── Category Breakdown ─────────────────────────── */}
          {Object.keys(categoryTotals).length > 0 && (
            <div className="card card--spaced">
              <h3 className="dashboard__section-heading">
                📈 Carbon by Category
              </h3>
              <div className="breakdown-list">
                {CARBON_CATEGORIES.map((cat) => {
                  const catTotal = categoryTotals[cat.id] || 0;
                  if (catTotal === 0) {return null;}
                  const percentage = totalCarbon > 0 ? ((catTotal / totalCarbon) * 100).toFixed(0) : 0;
                  return (
                    <div className="breakdown-item" key={cat.id}>
                      <span className="breakdown-item__label">
                        <span aria-hidden="true">{cat.icon}</span> {cat.label}
                      </span>
                      <span className="breakdown-item__value">
                        {catTotal.toFixed(1)} kg ({percentage}%)
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Reduce Section: Quick Actions ──────────────── */}
          <div className="card card--spaced">
            <h3 className="dashboard__section-heading">
              🌱 Take Action to Reduce Your Footprint
            </h3>
            <p className="dashboard__section-desc">
              Every small action counts. Navigate to these sections to start reducing your impact:
            </p>
            <div className="dashboard__actions-row">
              <button type="button" className="btn btn--primary" onClick={() => handleNavigate('calculator')} aria-label="Go to Carbon Calculator">
                🧮 Calculate Footprint
              </button>
              <button type="button" className="btn" onClick={() => handleNavigate('tracker')} aria-label="Go to Activity Tracker">
                📊 Log Activities
              </button>
              <button type="button" className="btn" onClick={() => handleNavigate('actions')} aria-label="Go to Eco Actions">
                🌱 Explore Actions
              </button>
              <button type="button" className="btn" onClick={() => handleNavigate('insights')} aria-label="Go to Personalized Insights">
                💡 Get Insights
              </button>
            </div>
          </div>

          {/* ── Comparison Stats ───────────────────────────── */}
          <div className="glass glass--spaced">
            <h3 className="dashboard__section-heading">
              🌏 How You Compare
            </h3>
            <div className="stats-row">
              <div className="stat-box">
                <div className="stat-box__value">{(GLOBAL_AVG_ANNUAL_KG / 365).toFixed(1)}</div>
                <div className="stat-box__label">Global Avg (kg/day)</div>
              </div>
              <div className="stat-box">
                <div className="stat-box__value">{(INDIA_AVG_ANNUAL_KG / 365).toFixed(1)}</div>
                <div className="stat-box__label">India Avg (kg/day)</div>
              </div>
              <div className="stat-box">
                <div className="stat-box__value" style={{ color: impactLevel.color }}>
                  {totalCarbon.toFixed(1)}
                </div>
                <div className="stat-box__label">Your Total (kg)</div>
              </div>
            </div>
          </div>

          {/* Empty state */}
          {activities.length === 0 && (
            <div className="empty-state">
              <span className="empty-state__icon" aria-hidden="true">🌿</span>
              <p className="empty-state__text">
                Start tracking your activities to see your carbon dashboard come to life! Use the Calculator or Tracker tabs to begin.
              </p>
            </div>
          )}
        </>
      )}
    </section>
  );
};

Dashboard.propTypes = {
  user: PropTypes.shape({
    displayName: PropTypes.string,
    uid: PropTypes.string,
  }),
  onNavigate: PropTypes.func.isRequired,
};

export default Dashboard;
