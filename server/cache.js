/**
 * @fileoverview Response caching module for CarbonWise.
 * Provides an in-memory cache with MD5 hash keys for AI response deduplication.
 *
 * @module cache
 * @version 1.0.0
 */

import NodeCache from 'node-cache';
import crypto from 'crypto';
import config from './config.js';
import { logger } from './logger.js';

/** @type {NodeCache} In-memory cache with configurable TTL */
export const responseCache = new NodeCache({
  stdTTL: config.cache.stdTTL,
  checkperiod: config.cache.checkperiod,
});

/**
 * Generates an MD5 hash of the input string for cache key generation.
 * Normalizes input by trimming whitespace and converting to lowercase.
 *
 * @param {string} prefix - Cache key namespace prefix
 * @param {string} input - The string to hash
 * @returns {string} The formatted cache key
 */
export function generateCacheKey(prefix, input) {
  const hash = crypto.createHash('md5').update(input.trim().toLowerCase()).digest('hex');
  return `${prefix}:${hash}`;
}

/**
 * Retrieves a cached response by key.
 *
 * @param {string} key - Cache key to look up
 * @returns {object|undefined} Cached data or undefined
 */
export function getCached(key) {
  const cached = responseCache.get(key);
  if (cached) {
    logger.info({ cacheKey: key.substring(0, 25) }, 'Cache Hit');
  }
  return cached;
}

/**
 * Stores a response in the cache.
 *
 * @param {string} key - Cache key
 * @param {object} data - Data to cache
 * @returns {boolean} True if cached successfully
 */
export function setCache(key, data) {
  const success = responseCache.set(key, data);
  if (success) {
    logger.info({ cacheKey: key.substring(0, 25) }, 'Response cached');
  }
  return success;
}
