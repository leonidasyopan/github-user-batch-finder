/**
 * Configuration management for GitHub Profile Identifier
 * Centralized configuration following Single Responsibility Principle
 */

export const CONFIG = {
    // API Configuration
    API: {
        BASE_URL: 'https://api.github.com',
        ENDPOINTS: {
            USER: '/users'
        },
        RATE_LIMIT: {
            REQUESTS_PER_HOUR: 60,
            RETRY_DELAY: 5000,
            MAX_RETRIES: 3
        }
    },

    // Batch Processing Configuration
    BATCH: {
        CHUNK_SIZE: 8,
        DELAY_BETWEEN_CHUNKS: 1000,
        MAX_CONCURRENT_REQUESTS: 8,
        PROGRESS_UPDATE_INTERVAL: 100
    },

    // UI Configuration
    UI: {
        ANIMATION_DURATION: 300,
        DEBOUNCE_DELAY: 300,
        MAX_DISPLAY_NAME_LENGTH: 50,
        MAX_DISPLAY_BIO_LENGTH: 200
    },

    // Validation Rules
    VALIDATION: {
        USERNAME: {
            MIN_LENGTH: 1,
            MAX_LENGTH: 39,
            PATTERN: /^[a-zA-Z0-9]([a-zA-Z0-9-]){0,38}$/
        }
    },

    // Security Configuration
    SECURITY: {
        ALLOWED_IMAGE_DOMAINS: [
            'avatars.githubusercontent.com',
            'github.com'
        ],
        CSP_POLICY: {
            'default-src': "'self'",
            'img-src': "'self' https://avatars.githubusercontent.com https://github.com",
            'connect-src': "'self' https://api.github.com",
            'style-src': "'self' 'unsafe-inline'",
            'script-src': "'self'"
        }
    },

    // Error Messages
    MESSAGES: {
        ERRORS: {
            EMPTY_INPUT: 'Please enter username(s).',
            INVALID_USERNAME: 'Invalid username format: {usernames}. Use only letters, numbers, and hyphens (max 39 characters).',
            NETWORK_ERROR: 'Network error. Please check your connection and try again.',
            API_ERROR: 'GitHub API error. Please try again later.',
            USER_NOT_FOUND: 'User "{username}" not found',
            BATCH_ERROR: 'An unexpected error occurred during batch processing. Please try again.',
            RATE_LIMITED: 'Rate limited - waiting {seconds} seconds...'
        },
        SUCCESS: {
            BATCH_COMPLETE: 'Completed: Found {found} of {total} users',
            PROCESSING: 'Processing {total} users...',
            STREAMING: 'Found {found} of {processed} users (streaming results...)'
        }
    }
};

/**
 * Environment-specific configuration
 */
export const ENV = {
    isDevelopment: () => window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1',
    isProduction: () => !ENV.isDevelopment()
};

/**
 * Feature flags for progressive enhancement
 */
export const FEATURES = {
    BATCH_PROCESSING: true,
    PROGRESS_INDICATORS: true,
    RESULT_CACHING: true,
    KEYBOARD_SHORTCUTS: true,
    ACCESSIBILITY_ENHANCEMENTS: true
};
