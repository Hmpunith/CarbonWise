/**
 * @fileoverview Client-side constants for the CarbonWise application.
 * Contains tab definitions, API endpoints, carbon categories, impact levels,
 * action difficulties, default activities, and app metadata.
 * @module constants
 */

/**
 * @typedef {Object} TabDefinition
 * @property {string} id - Unique identifier for the tab.
 * @property {string} label - Display label shown on the tab.
 * @property {string} icon - Emoji icon rendered next to the label.
 * @property {string} ariaLabel - Accessible label read by screen readers.
 */

/**
 * Tab definitions for the main navigation.
 * @type {TabDefinition[]}
 */
export const TABS = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: '🏠',
    ariaLabel: 'Carbon footprint dashboard overview',
  },
  {
    id: 'calculator',
    label: 'Calculator',
    icon: '🧮',
    ariaLabel: 'Carbon footprint calculator',
  },
  {
    id: 'tracker',
    label: 'Tracker',
    icon: '📊',
    ariaLabel: 'Activity tracker and history',
  },
  {
    id: 'actions',
    label: 'Actions',
    icon: '🌱',
    ariaLabel: 'Eco-friendly actions to reduce carbon',
  },
  {
    id: 'insights',
    label: 'Insights',
    icon: '💡',
    ariaLabel: 'Personalized carbon insights',
  },
];

/**
 * @typedef {Object} ApiEndpoints
 * @property {string} calculate - POST endpoint for carbon footprint calculation.
 * @property {string} insights - POST endpoint for generating personalized insights.
 * @property {string} actions - POST endpoint for fetching eco-friendly actions.
 * @property {string} health - GET endpoint for server health check.
 * @property {string} stats - GET endpoint for aggregate usage statistics.
 */

/**
 * API endpoint paths for backend communication.
 * @type {ApiEndpoints}
 */
export const API_ENDPOINTS = {
  calculate: '/api/calculate',
  insights: '/api/insights',
  actions: '/api/actions',
  health: '/api/health',
  stats: '/api/stats',
};

/**
 * @typedef {Object} CarbonCategory
 * @property {string} id - Unique identifier for the category.
 * @property {string} label - Human-readable display name.
 * @property {string} icon - Emoji icon for visual representation.
 * @property {string} color - CSS color value for themed UI elements.
 * @property {string} description - Brief description of the category scope.
 */

/**
 * Carbon emission categories with metadata for display and classification.
 * @type {CarbonCategory[]}
 */
export const CARBON_CATEGORIES = [
  {
    id: 'transport',
    label: 'Transport',
    icon: '🚗',
    color: '#3b82f6',
    description: 'Driving, flying, public transit, and other travel emissions.',
  },
  {
    id: 'food',
    label: 'Food',
    icon: '🍽️',
    color: '#f59e0b',
    description: 'Diet choices, food waste, and agricultural impact.',
  },
  {
    id: 'energy',
    label: 'Energy',
    icon: '⚡',
    color: '#8b5cf6',
    description: 'Home electricity, heating, cooling, and appliance usage.',
  },
  {
    id: 'shopping',
    label: 'Shopping',
    icon: '🛍️',
    color: '#ec4899',
    description: 'Clothing, electronics, goods, and consumer purchases.',
  },
  {
    id: 'waste',
    label: 'Waste',
    icon: '♻️',
    color: '#14b8a6',
    description: 'Recycling habits, landfill waste, and composting.',
  },
];

/**
 * @typedef {Object} ImpactLevel
 * @property {string} id - Unique identifier for the impact level.
 * @property {string} label - Human-readable display name.
 * @property {string} color - CSS color value for styled badges.
 * @property {string} className - CSS class suffix for badge styling.
 * @property {number} maxKg - Upper threshold in kg CO₂ for this level (inclusive).
 */

/**
 * Impact level classifications with color-coded severity indicators.
 * @type {ImpactLevel[]}
 */
export const IMPACT_LEVELS = [
  {
    id: 'low',
    label: 'Low Impact',
    color: '#10B981',
    className: 'low',
    maxKg: 5,
  },
  {
    id: 'moderate',
    label: 'Moderate Impact',
    color: '#fbbf24',
    className: 'moderate',
    maxKg: 20,
  },
  {
    id: 'high',
    label: 'High Impact',
    color: '#f97316',
    className: 'high',
    maxKg: 50,
  },
  {
    id: 'very-high',
    label: 'Very High Impact',
    color: '#f87171',
    className: 'very-high',
    maxKg: Infinity,
  },
];

/**
 * Determines the impact level for a given carbon amount.
 * @param {number} kgCO2 - Carbon amount in kilograms of CO₂.
 * @returns {ImpactLevel} The matching impact level object.
 */
export const getImpactLevel = (kgCO2) => {
  return (
    IMPACT_LEVELS.find((level) => kgCO2 <= level.maxKg) ||
    IMPACT_LEVELS[IMPACT_LEVELS.length - 1]
  );
};

/**
 * @typedef {Object} ActionDifficulty
 * @property {string} id - Unique identifier for the difficulty tier.
 * @property {string} label - Human-readable difficulty name.
 * @property {string} color - CSS color value for styled badges.
 * @property {string} className - CSS class suffix for difficulty badge styling.
 */

/**
 * Action difficulty tiers with color-coded indicators.
 * @type {ActionDifficulty[]}
 */
export const ACTION_DIFFICULTIES = [
  {
    id: 'easy',
    label: 'Easy',
    color: '#10B981',
    className: 'easy',
  },
  {
    id: 'medium',
    label: 'Medium',
    color: '#fbbf24',
    className: 'medium',
  },
  {
    id: 'committed',
    label: 'Committed',
    color: '#f97316',
    className: 'committed',
  },
];

/**
 * @typedef {Object} DefaultActivity
 * @property {string} id - Unique identifier for the quick-add activity.
 * @property {string} label - Short display name for the button.
 * @property {string} icon - Emoji icon for visual cue.
 * @property {string} category - ID of the parent carbon category.
 * @property {string} description - Pre-filled description for the tracker input.
 * @property {number} estimatedKg - Rough estimated CO₂ in kg for quick logging.
 */

/**
 * Default activities available for quick-add in the tracker panel.
 * @type {DefaultActivity[]}
 */
export const DEFAULT_ACTIVITIES = [
  {
    id: 'car-commute',
    label: 'Car Commute',
    icon: '🚗',
    category: 'transport',
    description: 'Drove car to work and back (~30 km)',
    estimatedKg: 5.4,
  },
  {
    id: 'bus-ride',
    label: 'Bus Ride',
    icon: '🚌',
    category: 'transport',
    description: 'Took public bus to work (~15 km)',
    estimatedKg: 1.2,
  },
  {
    id: 'flight-short',
    label: 'Short Flight',
    icon: '✈️',
    category: 'transport',
    description: 'Domestic short-haul flight (~500 km)',
    estimatedKg: 120,
  },
  {
    id: 'meat-meal',
    label: 'Meat Meal',
    icon: '🥩',
    category: 'food',
    description: 'Had a meal with beef or lamb',
    estimatedKg: 6.6,
  },
  {
    id: 'vegan-meal',
    label: 'Vegan Meal',
    icon: '🥗',
    category: 'food',
    description: 'Had a fully plant-based meal',
    estimatedKg: 0.4,
  },
  {
    id: 'home-energy',
    label: 'Home Energy',
    icon: '💡',
    category: 'energy',
    description: 'Daily home electricity and heating usage',
    estimatedKg: 7.1,
  },
  {
    id: 'online-shopping',
    label: 'Online Order',
    icon: '📦',
    category: 'shopping',
    description: 'Ordered a package online with delivery',
    estimatedKg: 3.2,
  },
  {
    id: 'recycling',
    label: 'Recycled Waste',
    icon: '♻️',
    category: 'waste',
    description: 'Recycled household waste instead of landfill',
    estimatedKg: -0.5,
  },
];

/**
 * @typedef {Object} AppMetadata
 * @property {string} name - Application display name.
 * @property {string} version - Semantic version string.
 * @property {string} description - Short description of the app purpose.
 * @property {string} author - Attribution or team name.
 */

/**
 * Application metadata used in the header, footer, and document title.
 * @type {AppMetadata}
 */
export const APP_META = {
  name: 'CarbonWise',
  version: '1.0.0',
  description: 'AI-powered carbon footprint awareness platform',
  author: 'CarbonWise Team',
};
