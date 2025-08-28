/**
 * Input validation utilities following Single Responsibility Principle
 * Handles all validation logic for user inputs and API responses
 */

import { CONFIG } from '../config.js';
import { Logger } from './logger.js';

const logger = new Logger('Validator');

export class InputValidator {
    /**
     * Validate a single GitHub username
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid
     */
    static validateUsername(username) {
        if (!username || typeof username !== 'string') {
            return false;
        }

        const trimmed = username.trim();
        const { MIN_LENGTH, MAX_LENGTH, PATTERN } = CONFIG.VALIDATION.USERNAME;

        return trimmed.length >= MIN_LENGTH && 
               trimmed.length <= MAX_LENGTH && 
               PATTERN.test(trimmed);
    }

    /**
     * Parse and validate multiple usernames from comma-separated input
     * @param {string} input - Comma-separated usernames
     * @returns {Object} Validation result with parsed usernames and errors
     */
    static parseAndValidateUsernames(input) {
        if (!input || typeof input !== 'string') {
            return {
                valid: false,
                usernames: [],
                invalidUsernames: [],
                error: CONFIG.MESSAGES.ERRORS.EMPTY_INPUT
            };
        }

        // Parse usernames
        const usernames = input
            .split(',')
            .map(username => username.trim())
            .filter(username => username.length > 0);

        if (usernames.length === 0) {
            return {
                valid: false,
                usernames: [],
                invalidUsernames: [],
                error: CONFIG.MESSAGES.ERRORS.EMPTY_INPUT
            };
        }

        // Remove duplicates while preserving order
        const uniqueUsernames = [...new Set(usernames)];

        // Validate each username
        const invalidUsernames = uniqueUsernames.filter(
            username => !this.validateUsername(username)
        );

        const isValid = invalidUsernames.length === 0;

        logger.debug('Username validation result', {
            input,
            uniqueUsernames,
            invalidUsernames,
            isValid
        });

        return {
            valid: isValid,
            usernames: uniqueUsernames,
            invalidUsernames,
            error: isValid ? null : CONFIG.MESSAGES.ERRORS.INVALID_USERNAME
                .replace('{usernames}', invalidUsernames.join(', '))
        };
    }
}

export class SecurityValidator {
    /**
     * Validate if a URL is from an allowed GitHub domain
     * @param {string} url - URL to validate
     * @returns {boolean} True if URL is safe
     */
    static isValidGitHubImageUrl(url) {
        if (!url || typeof url !== 'string') {
            return false;
        }

        try {
            const urlObj = new URL(url);
            return CONFIG.SECURITY.ALLOWED_IMAGE_DOMAINS.includes(urlObj.hostname);
        } catch (error) {
            logger.warn('Invalid URL provided for validation', { url, error });
            return false;
        }
    }

    /**
     * Sanitize text content to prevent XSS
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    static sanitizeText(text) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Truncate text to safe display length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    static truncateText(text, maxLength) {
        if (!text || typeof text !== 'string') {
            return '';
        }

        if (text.length <= maxLength) {
            return text;
        }

        return text.substring(0, maxLength - 3) + '...';
    }
}
