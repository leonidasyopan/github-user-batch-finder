/**
 * Configuration Management following Single Responsibility Principle
 * Centralized configuration for the entire application
 */

export const CONFIG = {
    API: {
        GITHUB_BASE_URL: 'https://api.github.com',
        RATE_LIMIT_DELAY: 1000,
        MAX_RETRIES: 3,
        TIMEOUT: 10000
    },
    BATCH: {
        CHUNK_SIZE: 8,
        CHUNK_DELAY: 500,
        MAX_CONCURRENT: 5
    },
    UI: {
        MAX_DISPLAY_NAME_LENGTH: 50,
        MAX_DISPLAY_BIO_LENGTH: 150,
        DEBOUNCE_DELAY: 300
    }
};

export const FEATURES = {
    KEYBOARD_SHORTCUTS: true,
    PROGRESS_TRACKING: true,
    REAL_TIME_RESULTS: true,
    CLICKABLE_CARDS: true
};
