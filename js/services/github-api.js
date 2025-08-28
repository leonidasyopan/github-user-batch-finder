/**
 * GitHub API Service following Single Responsibility Principle
 * Handles all GitHub API interactions with proper error handling and rate limiting
 */

import { CONFIG } from '../config.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('GitHubAPI');

export class GitHubApiService {
    constructor() {
        this.baseUrl = CONFIG.API.BASE_URL;
        this.rateLimitInfo = {
            remaining: null,
            resetTime: null,
            limit: null
        };
    }

    /**
     * Fetch a single user from GitHub API
     * @param {string} username - GitHub username
     * @returns {Promise<Object>} User data or error object
     */
    async fetchUser(username) {
        const url = `${this.baseUrl}${CONFIG.API.ENDPOINTS.USER}/${encodeURIComponent(username)}`;
        
        logger.debug('Fetching user', { username, url });

        try {
            const response = await fetch(url);
            
            // Update rate limit info from headers
            this._updateRateLimitInfo(response);

            if (response.ok) {
                const userData = await response.json();
                logger.debug('User fetch successful', { username, userData });
                return {
                    success: true,
                    data: userData,
                    username
                };
            }

            // Handle specific error cases
            if (response.status === 404) {
                logger.info('User not found', { username });
                return {
                    success: false,
                    error: CONFIG.MESSAGES.ERRORS.USER_NOT_FOUND.replace('{username}', username),
                    errorType: 'NOT_FOUND',
                    username
                };
            }

            if (response.status === 403) {
                logger.warn('Rate limit exceeded', { username, rateLimitInfo: this.rateLimitInfo });
                return {
                    success: false,
                    error: 'Rate limit exceeded',
                    errorType: 'RATE_LIMITED',
                    username,
                    retryAfter: this._calculateRetryDelay()
                };
            }

            // Generic API error
            logger.error('API error', { username, status: response.status, statusText: response.statusText });
            return {
                success: false,
                error: CONFIG.MESSAGES.ERRORS.API_ERROR,
                errorType: 'API_ERROR',
                username
            };

        } catch (error) {
            logger.error('Network error during user fetch', { username, error });
            return {
                success: false,
                error: CONFIG.MESSAGES.ERRORS.NETWORK_ERROR,
                errorType: 'NETWORK_ERROR',
                username
            };
        }
    }

    /**
     * Fetch multiple users with retry logic
     * @param {string} username - GitHub username
     * @param {number} maxRetries - Maximum number of retries
     * @returns {Promise<Object>} User data with retry information
     */
    async fetchUserWithRetry(username, maxRetries = CONFIG.API.RATE_LIMIT.MAX_RETRIES) {
        let lastError = null;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            logger.debug('Fetch attempt', { username, attempt, maxRetries });

            const result = await this.fetchUser(username);

            if (result.success) {
                return result;
            }

            lastError = result;

            // Don't retry for certain error types
            if (result.errorType === 'NOT_FOUND' || result.errorType === 'API_ERROR') {
                break;
            }

            // Handle rate limiting
            if (result.errorType === 'RATE_LIMITED') {
                if (attempt < maxRetries) {
                    const delay = result.retryAfter || CONFIG.API.RATE_LIMIT.RETRY_DELAY;
                    logger.info('Rate limited, waiting before retry', { username, delay, attempt });
                    await this._delay(delay);
                    continue;
                }
                break;
            }

            // Exponential backoff for network errors
            if (result.errorType === 'NETWORK_ERROR' && attempt < maxRetries) {
                const delay = Math.pow(2, attempt) * 1000; // 2s, 4s, 8s...
                logger.info('Network error, retrying with backoff', { username, delay, attempt });
                await this._delay(delay);
                continue;
            }

            break;
        }

        return lastError;
    }

    /**
     * Get current rate limit information
     * @returns {Object} Rate limit information
     */
    getRateLimitInfo() {
        return { ...this.rateLimitInfo };
    }

    /**
     * Check if we're currently rate limited
     * @returns {boolean} True if rate limited
     */
    isRateLimited() {
        if (!this.rateLimitInfo.remaining || !this.rateLimitInfo.resetTime) {
            return false;
        }

        return this.rateLimitInfo.remaining <= 0 && 
               Date.now() < this.rateLimitInfo.resetTime;
    }

    /**
     * Update rate limit information from response headers
     * @private
     * @param {Response} response - Fetch response object
     */
    _updateRateLimitInfo(response) {
        const remaining = response.headers.get('X-RateLimit-Remaining');
        const reset = response.headers.get('X-RateLimit-Reset');
        const limit = response.headers.get('X-RateLimit-Limit');

        if (remaining !== null) {
            this.rateLimitInfo.remaining = parseInt(remaining, 10);
        }
        if (reset !== null) {
            this.rateLimitInfo.resetTime = parseInt(reset, 10) * 1000; // Convert to milliseconds
        }
        if (limit !== null) {
            this.rateLimitInfo.limit = parseInt(limit, 10);
        }

        logger.debug('Rate limit info updated', this.rateLimitInfo);
    }

    /**
     * Calculate delay before retry based on rate limit info
     * @private
     * @returns {number} Delay in milliseconds
     */
    _calculateRetryDelay() {
        if (this.rateLimitInfo.resetTime) {
            const now = Date.now();
            const resetTime = this.rateLimitInfo.resetTime;
            
            if (resetTime > now) {
                return Math.min(resetTime - now, CONFIG.API.RATE_LIMIT.RETRY_DELAY);
            }
        }

        return CONFIG.API.RATE_LIMIT.RETRY_DELAY;
    }

    /**
     * Utility method for delays
     * @private
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
