/**
 * GitHub API Service following Single Responsibility Principle
 * Handles all GitHub API communication and caching
 */

import { CONFIG } from '../config.js';
import { Logger } from '../utils/logger.js';

export class GitHubApiService {
    constructor() {
        this.logger = new Logger('GitHubAPI');
        this.cache = new Map();
    }

    /**
     * Fetch user data from GitHub API
     * @param {string} username - GitHub username
     * @returns {Promise<Object>} User data or error result
     */
    async fetchUser(username) {
        const cacheKey = username.toLowerCase();
        if (this.cache.has(cacheKey)) {
            this.logger.debug(`Cache hit for user: ${username}`);
            return this.cache.get(cacheKey);
        }

        try {
            this.logger.debug(`Fetching user: ${username}`);
            const response = await fetch(`${CONFIG.API.GITHUB_BASE_URL}/users/${username}`, {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'GitHub-Profile-Identifier'
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const userData = await response.json();
            const result = { success: true, data: userData };
            
            this.cache.set(cacheKey, result);
            this.logger.debug(`Successfully fetched user: ${username}`);
            return result;
            
        } catch (error) {
            const result = { 
                success: false, 
                username, 
                error: error.message || 'Failed to fetch user data' 
            };
            this.logger.error(`Failed to fetch user ${username}`, error);
            return result;
        }
    }

    /**
     * Clear the cache
     */
    clearCache() {
        this.cache.clear();
        this.logger.debug('Cache cleared');
    }

    /**
     * Get cache size
     * @returns {number} Number of cached entries
     */
    getCacheSize() {
        return this.cache.size;
    }
}
