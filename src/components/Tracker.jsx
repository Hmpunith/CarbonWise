/**
 * @fileoverview Activity tracker panel for CarbonWise.
 * Provides quick-add buttons, a custom activity form, and a timeline
 * of logged activities persisted in Firebase Firestore.
 * @module components/Tracker
 */

import { useState, useEffect, useCallback } from 'react';
import {
  DEFAULT_ACTIVITIES,
  CARBON_CATEGORIES,
} from '../constants.js';
import {
  saveActivity,
  getActivities,
  trackEvent,
} from '../firebase.js';
import LoadingSpinner from './LoadingSpinner.jsx';

/**
 * Formats carbon value to display string.
 * @param {number|null|undefined} carbonKg
 * @returns {string}
 */
const formatCarbonValue = (carbonKg) => {
  if (carbonKg === null || carbonKg === undefined) {
    return '—';
  }
  return `${carbonKg >= 0 ? '+' : ''}${carbonKg.toFixed(1)} kg`;
};

/**
 * Returns the emoji icon for a given category id.
 * @param {string} categoryId
 * @returns {string}
 */
const getCategoryIcon = (categoryId) => {
  const cat = CARBON_CATEGORIES.find((c) => c.id === categoryId);
  return cat ? cat.icon : '📊';
};

/**
 * Formats a Firestore timestamp or Date into a human-readable string.
 * @param {Object|Date|null} ts
 * @returns {string}
 */
const formatTimestamp = (ts) => {
  if (!ts) {return 'Just now';}
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

/**
 * Activity tracker tab panel with quick-add, custom logging, and
 * a timeline of past activities pulled from Firestore.
 *
 * @returns {JSX.Element}
 */
const Tracker = () => {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [customDesc, setCustomDesc] = useState('');
  const [customCarbon, setCustomCarbon] = useState('');
  const [customCategory, setCustomCategory] = useState('transport');

  /* ── Fetch recent activities on mount ─────────────────── */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await getActivities(30);
        if (!cancelled) {setActivities(data);}
      } catch {
        if (!cancelled) { setError('Failed to load activity history.'); }
      } finally {
        if (!cancelled) { setLoading(false); }
      }
    })();
    return () => { cancelled = true; };
  }, []);

  /**
   * Logs a quick-add activity to Firestore.
   * @param {import('../constants.js').DefaultActivity} activity
   */
  const handleQuickAdd = useCallback(async (activity) => {
    setSaving(true);
    setError('');
    trackEvent('quick_add_activity', { activityId: activity.id });
    try {
      await saveActivity({
        category: activity.category,
        description: activity.description,
        carbonKg: activity.estimatedKg,
      });
      const refreshed = await getActivities(30);
      setActivities(refreshed);
    } catch {
      setError('Failed to log activity. Please try again.');
    } finally {
      setSaving(false);
    }
  }, []);

  /**
   * Logs a custom activity from the form.
   * @param {React.FormEvent} e
   */
  const handleCustomSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      if (!customDesc.trim()) {return;}
      setSaving(true);
      setError('');
      trackEvent('custom_activity_logged', { category: customCategory });
      try {
        await saveActivity({
          category: customCategory,
          description: customDesc.trim(),
          carbonKg: parseFloat(customCarbon) || 0,
        });
        setCustomDesc('');
        setCustomCarbon('');
        const refreshed = await getActivities(30);
        setActivities(refreshed);
      } catch {
        setError('Failed to log activity. Please try again.');
      } finally {
        setSaving(false);
      }
    },
    [customDesc, customCarbon, customCategory],
  );

  return (
    <section
      className="panel"
      role="tabpanel"
      id="panel-tracker"
      aria-labelledby="tab-tracker"
      aria-busy={loading || saving}
    >
      <h2 className="section-title">Activity Tracker</h2>
      <p className="section-subtitle">
        Log your daily activities to build a personal carbon profile.
      </p>

      {/* Quick-add buttons */}
      <div className="quick-add" role="group" aria-label="Quick-add common activities">
        {DEFAULT_ACTIVITIES.map((act) => (
          <button
            key={act.id}
            type="button"
            className="btn btn--small"
            onClick={() => handleQuickAdd(act)}
            disabled={saving}
            aria-label={`Log ${act.label} — estimated ${act.estimatedKg} kg CO₂`}
          >
            <span aria-hidden="true">{act.icon}</span> {act.label}
          </button>
        ))}
      </div>

      {/* Custom activity form */}
      <form onSubmit={handleCustomSubmit} className="card card--spaced">
        <h3 className="heading--form">
          Log Custom Activity
        </h3>

        <div className="form-group">
          <label htmlFor="tracker-desc">Description</label>
          <input
            id="tracker-desc"
            className="input"
            type="text"
            maxLength={1000}
            placeholder="e.g. Cycled to the grocery store"
            value={customDesc}
            onChange={(e) => setCustomDesc(e.target.value)}
            aria-required="true"
          />
        </div>

        <div className="form-row">
          <div className="form-group form-row__field">
            <label htmlFor="tracker-carbon">CO₂ (kg)</label>
            <input
              id="tracker-carbon"
              className="input"
              type="number"
              step="0.1"
              min="0"
              placeholder="0.0"
              value={customCarbon}
              onChange={(e) => setCustomCarbon(e.target.value)}
              aria-label="Estimated carbon dioxide in kilograms"
            />
          </div>

          <div className="form-group form-row__field">
            <label htmlFor="tracker-category">Category</label>
            <select
              id="tracker-category"
              className="input"
              value={customCategory}
              onChange={(e) => setCustomCategory(e.target.value)}
              aria-label="Activity category"
            >
              {CARBON_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mt-md">
          <button
            type="submit"
            className="btn btn--primary"
            disabled={saving || !customDesc.trim()}
            aria-label="Log this custom activity"
          >
            {saving ? '⏳ Saving…' : '📝 Log Activity'}
          </button>
        </div>
      </form>

      {/* Error */}
      {error && (
        <div className="error-alert" role="alert">
          <span aria-hidden="true">❌</span> {error}
        </div>
      )}

      {/* Loading */}
      {loading && <LoadingSpinner message="Loading activity history…" />}

      {/* Activity timeline */}
      {!loading && activities.length === 0 && (
        <div className="empty-state">
          <span className="empty-state__icon" aria-hidden="true">📝</span>
          <p className="empty-state__text">
            No activities logged yet. Use the quick-add buttons above or log a custom activity to get started!
          </p>
        </div>
      )}

      {!loading && activities.length > 0 && (
        <div className="timeline" aria-label="Activity history timeline">
          {activities.map((entry) => (
            <div className="timeline-entry" key={entry.id}>
              <div className="timeline-entry__dot" aria-hidden="true">
                {getCategoryIcon(entry.category)}
              </div>
              <div className="timeline-entry__content">
                <div className="timeline-entry__header">
                  <span className="timeline-entry__title">
                    {entry.description}
                  </span>
                  <span className="timeline-entry__carbon">
                    {formatCarbonValue(entry.carbonKg)}
                  </span>
                </div>
                <span className="timeline-entry__time">
                  {formatTimestamp(entry.createdAt)}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default Tracker;
