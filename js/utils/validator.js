/**
 * Security Validator following Single Responsibility Principle
 * Handles all input validation and sanitization for security
 */

export class SecurityValidator {
    /**
     * Sanitize text to prevent XSS attacks
     * @param {string} text - Text to sanitize
     * @returns {string} Sanitized text
     */
    static sanitizeText(text) {
        if (typeof text !== 'string') return '';
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');
    }

    /**
     * Truncate text to specified length
     * @param {string} text - Text to truncate
     * @param {number} maxLength - Maximum length
     * @returns {string} Truncated text
     */
    static truncateText(text, maxLength) {
        if (!text || typeof text !== 'string') return '';
        return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
    }

    /**
     * Validate GitHub username format
     * @param {string} username - Username to validate
     * @returns {boolean} True if valid
     */
    static validateUsername(username) {
        if (!username || typeof username !== 'string') return false;
        const trimmed = username.trim();
        if (trimmed.length === 0 || trimmed.length > 39) return false;
        return /^[a-zA-Z0-9]([a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(trimmed);
    }

    /**
     * Validate GitHub image URL
     * @param {string} url - URL to validate
     * @returns {boolean} True if valid GitHub image URL
     */
    static isValidGitHubImageUrl(url) {
        if (!url || typeof url !== 'string') return false;
        try {
            const urlObj = new URL(url);
            return urlObj.hostname === 'avatars.githubusercontent.com' || 
                   urlObj.hostname === 'github.com';
        } catch {
            return false;
        }
    }
}
