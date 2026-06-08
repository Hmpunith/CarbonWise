/**
 * @fileoverview Firebase integration for CarbonWise.
 * Provides Analytics, Authentication, Firestore, and Performance monitoring.
 * All Firebase config values are sourced from VITE_ environment variables
 * with demo/placeholder fallbacks for local development.
 * @module firebase
 */

import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { getAnalytics, logEvent, isSupported } from 'firebase/analytics';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';
import { getPerformance } from 'firebase/performance';

/**
 * Firebase configuration sourced from Vite environment variables.
 * Falls back to demo values for local development without a real project.
 * @type {import('firebase/app').FirebaseOptions}
 */
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

/** Firebase application instance. */
const app = initializeApp(firebaseConfig);

/** Firestore database instance. */
export const db = getFirestore(app);

/** Firebase Authentication instance. */
export const auth = getAuth(app);

/**
 * Firebase Analytics instance.
 * Initialised asynchronously — may be `null` if analytics is not supported
 * (e.g. in non-browser environments or when blocked by extensions).
 * @type {import('firebase/analytics').Analytics | null}
 */
export let analytics = null;

/**
 * Firebase Performance Monitoring instance.
 * Initialised asynchronously — may be `null` if performance is not supported.
 * @type {import('firebase/performance').FirebasePerformance | null}
 */
export let perf = null;

/* ---------- Async initialisation of Analytics & Performance ---------- */

(async () => {
  try {
    const supported = await isSupported();
    if (supported) {
      analytics = getAnalytics(app);
    }
  } catch {
    // Analytics not available — silently skip.
  }

  try {
    perf = getPerformance(app);
  } catch {
    // Performance monitoring not available — silently skip.
  }
})();

/* ==================================================================
   Analytics Helpers
   ================================================================== */

/**
 * Logs a custom analytics event.
 * Safely no-ops when analytics is unavailable.
 *
 * @param {string} eventName - The name of the event to log (e.g. 'calculate_carbon').
 * @param {Record<string, string | number | boolean>} [params={}] - Optional key/value parameters attached to the event.
 * @returns {void}
 */
export const trackEvent = (eventName, params = {}) => {
  if (analytics) {
    logEvent(analytics, eventName, params);
  }
};

/**
 * Tracks a carbon calculation event for a specific category.
 *
 * @param {string} category - The carbon category id (e.g. 'transport', 'food').
 * @returns {void}
 */
export const trackCalculation = (category) => {
  trackEvent('calculate_carbon', { category, timestamp: Date.now() });
};

/**
 * Tracks when a user views the insights panel.
 *
 * @returns {void}
 */
export const trackInsightViewed = () => {
  trackEvent('insight_viewed', { timestamp: Date.now() });
};

/* ==================================================================
   Authentication Helpers
   ================================================================== */

/** Google OAuth provider instance. */
const googleProvider = new GoogleAuthProvider();

/**
 * Initiates Google Sign-In via a popup window.
 *
 * @returns {Promise<import('firebase/auth').UserCredential>} The signed-in user credential.
 * @throws {Error} When the sign-in flow is cancelled or fails.
 */
export const signInWithGoogle = async () => {
  const result = await signInWithPopup(auth, googleProvider);
  trackEvent('sign_in', { method: 'google' });
  return result;
};

/**
 * Signs the current user out of Firebase Authentication.
 *
 * @returns {Promise<void>}
 */
export const signOutUser = async () => {
  trackEvent('sign_out');
  await signOut(auth);
};

/**
 * Subscribes to Firebase Authentication state changes.
 *
 * @param {(user: import('firebase/auth').User | null) => void} callback - Called whenever the auth state changes.
 * @returns {import('firebase/auth').Unsubscribe} Unsubscribe function to detach the listener.
 */
export const onAuthChange = (callback) => {
  return onAuthStateChanged(auth, callback);
};

/* ==================================================================
   Firestore Helpers
   ================================================================== */

/**
 * Saves a carbon activity document to the Firestore `activities` collection.
 *
 * @param {Object} activity - The activity data to persist.
 * @param {string} activity.category - Carbon category id (e.g. 'transport').
 * @param {string} activity.description - Human-readable description of the activity.
 * @param {number} activity.carbonKg - Estimated carbon footprint in kg CO₂.
 * @param {string} [activity.userId] - Optional UID of the signed-in user.
 * @returns {Promise<import('firebase/firestore').DocumentReference>} Reference to the newly created document.
 */
export const saveActivity = async (activity) => {
  const docRef = await addDoc(collection(db, 'activities'), {
    ...activity,
    userId: auth.currentUser?.uid || 'anonymous',
    createdAt: serverTimestamp(),
  });
  trackEvent('activity_logged', { category: activity.category });
  return docRef;
};

/**
 * Retrieves the most recent carbon activities from Firestore.
 *
 * @param {number} [count=20] - Maximum number of activities to return.
 * @returns {Promise<Array<Object>>} Array of activity objects, each including its Firestore document `id`.
 */
export const getActivities = async (count = 20) => {
  const q = query(
    collection(db, 'activities'),
    orderBy('createdAt', 'desc'),
    limit(count),
  );
  const snapshot = await getDocs(q);
  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...doc.data(),
  }));
};
