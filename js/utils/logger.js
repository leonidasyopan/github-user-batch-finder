/**
 * Logging utility following Single Responsibility Principle
 * Provides centralized logging with different levels and environments
 */

import { ENV } from '../config.js';

export class Logger {
    constructor(context = 'GitHubUserFinder') {
        this.context = context;
        this.levels = {
            ERROR: 0,
            WARN: 1,
            INFO: 2,
            DEBUG: 3
        };
        this.currentLevel = ENV.isDevelopment() ? this.levels.DEBUG : this.levels.INFO;
    }

    /**
     * Log error messages
     * @param {string} message - Error message
     * @param {Error|Object} error - Error object or additional data
     */
    error(message, error = null) {
        if (this.currentLevel >= this.levels.ERROR) {
            console.error(`[${this.context}] ERROR: ${message}`, error);
        }
    }

    /**
     * Log warning messages
     * @param {string} message - Warning message
     * @param {Object} data - Additional data
     */
    warn(message, data = null) {
        if (this.currentLevel >= this.levels.WARN) {
            console.warn(`[${this.context}] WARN: ${message}`, data);
        }
    }

    /**
     * Log info messages
     * @param {string} message - Info message
     * @param {Object} data - Additional data
     */
    info(message, data = null) {
        if (this.currentLevel >= this.levels.INFO) {
            console.info(`[${this.context}] INFO: ${message}`, data);
        }
    }

    /**
     * Log debug messages (development only)
     * @param {string} message - Debug message
     * @param {Object} data - Additional data
     */
    debug(message, data = null) {
        if (this.currentLevel >= this.levels.DEBUG) {
            console.log(`[${this.context}] DEBUG: ${message}`, data);
        }
    }

    /**
     * Create a child logger with additional context
     * @param {string} childContext - Additional context
     * @returns {Logger} New logger instance
     */
    child(childContext) {
        return new Logger(`${this.context}:${childContext}`);
    }
}
