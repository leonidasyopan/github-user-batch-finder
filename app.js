
/**
 * GitHub Profile Identifier - Bundled for GitHub Pages
 * Generated from modular ES6 source files
 */

/**
 * Configuration Management following Single Responsibility Principle
 * Centralized configuration for the entire application
 */

const CONFIG = {
    API: {
        GITHUB_BASE_URL: 'https://api.github.com',
        RATE_LIMIT_DELAY: 1000,
        MAX_RETRIES: 3,
        TIMEOUT: 10000,
        GITHUB_TOKEN: null // Will be set from localStorage or user input
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

const FEATURES = {
    KEYBOARD_SHORTCUTS: true,
    PROGRESS_TRACKING: true,
    REAL_TIME_RESULTS: true,
    CLICKABLE_CARDS: true
};


/**
 * Logger Utility following Single Responsibility Principle
 * Provides contextual logging capabilities with multiple levels
 */

class Logger {
    constructor(context) {
        this.context = context;
    }

    info(message, data = null) {
        console.log(`[${this.context}] ${message}`, data || '');
    }

    error(message, error = null) {
        console.error(`[${this.context}] ${message}`, error || '');
    }

    debug(message, data = null) {
        console.debug(`[${this.context}] ${message}`, data || '');
    }

    warn(message, data = null) {
        console.warn(`[${this.context}] ${message}`, data || '');
    }
}


/**
 * Security Validator following Single Responsibility Principle
 * Handles all input validation and sanitization for security
 */

class SecurityValidator {
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


/**
 * GitHub API Service following Single Responsibility Principle
 * Handles all GitHub API communication and caching
 */


class GitHubApiService {
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
            const headers = {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'GitHub-Profile-Identifier'
            };
            
            // Add authorization header if token is available
            if (CONFIG.API.GITHUB_TOKEN) {
                headers['Authorization'] = `token ${CONFIG.API.GITHUB_TOKEN}`;
            }
            
            const response = await fetch(`${CONFIG.API.GITHUB_BASE_URL}/users/${username}`, {
                headers: headers
            });

            if (!response.ok) {
                if (response.status === 403) {
                    throw new Error(`Rate limit exceeded. ${CONFIG.API.GITHUB_TOKEN ? 'Token may be invalid or expired.' : 'Consider adding a GitHub token for higher limits.'}`);
                }
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


/**
 * Batch Processor Service following Single Responsibility Principle
 * Handles batch processing of multiple users with intelligent chunking
 */


class BatchProcessor {
    constructor(apiService) {
        this.apiService = apiService;
        this.logger = new Logger('BatchProcessor');
    }

    /**
     * Process multiple users in optimized batches
     * @param {string[]} usernames - Array of usernames to process
     * @param {Function} onProgress - Progress callback (processed, total)
     * @param {Function} onResult - Result callback (result)
     * @returns {Promise<void>}
     */
    async processUsers(usernames, onProgress, onResult) {
        const chunks = this.createChunks(usernames, CONFIG.BATCH.CHUNK_SIZE);
        let processedCount = 0;
        const totalUsers = usernames.length;

        this.logger.info(`Processing ${totalUsers} users in ${chunks.length} chunks`);

        for (const [index, chunk] of chunks.entries()) {
            this.logger.debug(`Processing chunk ${index + 1}/${chunks.length} with ${chunk.length} users`);
            
            const promises = chunk.map(username => this.apiService.fetchUser(username));
            const results = await Promise.all(promises);

            for (const result of results) {
                processedCount++;
                onResult(result);
                onProgress(processedCount, totalUsers);
            }

            // Add delay between chunks to respect rate limits
            if (index < chunks.length - 1) {
                await this.delay(CONFIG.BATCH.CHUNK_DELAY);
            }
        }

        this.logger.info(`Completed processing ${totalUsers} users`);
    }

    /**
     * Create chunks from array
     * @param {Array} array - Array to chunk
     * @param {number} chunkSize - Size of each chunk
     * @returns {Array[]} Array of chunks
     */
    createChunks(array, chunkSize) {
        const chunks = [];
        for (let i = 0; i < array.length; i += chunkSize) {
            chunks.push(array.slice(i, i + chunkSize));
        }
        return chunks;
    }

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise<void>}
     */
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}


/**
 * Progress Bar Component following Single Responsibility Principle
 * Handles progress visualization and user feedback
 */


class ProgressBar {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.logger = new Logger('ProgressBar');
    }

    /**
     * Show progress bar with initial state
     * @param {number} totalUsers - Total number of users to process
     */
    show(totalUsers) {
        this.element = document.createElement('div');
        this.element.className = 'progress';
        this.element.innerHTML = `
            <div class="progress__text">Processing 0 of ${totalUsers} users...</div>
            <div class="progress__container">
                <div class="progress__bar progress__bar--0">0%</div>
            </div>
        `;
        this.container.appendChild(this.element);
        this.logger.debug(`Progress bar shown for ${totalUsers} users`);
    }

    /**
     * Update progress bar with current status
     * @param {number} processed - Number of processed users
     * @param {number} total - Total number of users
     */
    update(processed, total) {
        if (!this.element) return;

        const percentage = Math.round((processed / total) * 100);
        const textElement = this.element.querySelector('.progress__text');
        const barElement = this.element.querySelector('.progress__bar');

        if (textElement) {
            textElement.textContent = `Processing ${processed} of ${total} users...`;
        }

        if (barElement) {
            barElement.className = `progress__bar progress__bar--${percentage}`;
            barElement.textContent = `${percentage}%`;
        }

        this.logger.debug(`Progress updated: ${processed}/${total} (${percentage}%)`);
    }

    /**
     * Hide and remove progress bar
     */
    hide() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.element = null;
            this.logger.debug('Progress bar hidden');
        }
    }

    /**
     * Check if progress bar is currently visible
     * @returns {boolean} True if visible
     */
    isVisible() {
        return this.element !== null;
    }
}


/**
 * User Card Component following Single Responsibility Principle
 * Handles rendering and management of individual user display cards
 */


class UserCard {
    constructor(userData, container) {
        this.userData = userData;
        this.container = container;
        this.element = null;
        this.logger = new Logger('UserCard');
    }

    /**
     * Render the user card and append to container
     * @returns {HTMLElement} The created card element
     */
    render() {
        this.element = this._createElement();
        this.container.appendChild(this.element);
        
        this.logger.debug('User card rendered', { 
            username: this.userData.username,
            success: this.userData.success 
        });

        return this.element;
    }

    /**
     * Remove the card from DOM
     */
    remove() {
        if (this.element && this.element.parentNode) {
            this.element.parentNode.removeChild(this.element);
            this.logger.debug('User card removed', { username: this.userData.username });
        }
    }

    /**
     * Update card with new data
     * @param {Object} newData - Updated user data
     */
    update(newData) {
        this.userData = newData;
        if (this.element) {
            this.remove();
            this.render();
        }
    }

    /**
     * Create the card DOM element
     * @private
     * @returns {HTMLElement} Card element
     */
    _createElement() {
        if (!this.userData.success) {
            const card = document.createElement('div');
            card.className = 'user-card user-card--error';
            card.innerHTML = this._createErrorContent();
            return card;
        } else {
            const card = document.createElement('a');
            card.className = 'user-card';
            card.href = this._getGitHubProfileUrl();
            card.target = '_blank';
            card.rel = 'noopener noreferrer';
            card.innerHTML = this._createSuccessContent();
            return card;
        }
    }

    /**
     * Create content for successful user data
     * @private
     * @returns {string} HTML content
     */
    _createSuccessContent() {
        const user = this.userData.data || this.userData;
        
        const avatarUrl = this._getValidAvatarUrl(user.avatar_url);
        const displayName = SecurityValidator.truncateText(
            user.name || user.login || 'Unknown User',
            CONFIG.UI.MAX_DISPLAY_NAME_LENGTH
        );
        const username = SecurityValidator.sanitizeText(user.login || 'unknown');
        const displayBio = SecurityValidator.truncateText(
            user.bio || 'No description available.',
            CONFIG.UI.MAX_DISPLAY_BIO_LENGTH
        );

        return `
            <img class="user-card__avatar" 
                 src="${avatarUrl}" 
                 alt="${SecurityValidator.sanitizeText(user.login || 'User')}'s avatar"
                 loading="lazy">
            <div class="user-card__info">
                <h3 class="user-card__name">${SecurityValidator.sanitizeText(displayName)}</h3>
                <p class="user-card__username">@${username}</p>
                <p class="user-card__bio">${SecurityValidator.sanitizeText(displayBio)}</p>
            </div>
        `;
    }

    /**
     * Create content for error state
     * @private
     * @returns {string} HTML content
     */
    _createErrorContent() {
        const errorMessage = this.userData.error || 'Unknown error occurred';
        
        return `
            <div class="user-card__error">
                <strong>${SecurityValidator.sanitizeText(this.userData.username || 'Unknown')}</strong>
                <br>
                ${SecurityValidator.sanitizeText(errorMessage)}
            </div>
        `;
    }

    /**
     * Get a valid avatar URL or fallback
     * @private
     * @param {string} avatarUrl - Original avatar URL
     * @returns {string} Valid avatar URL or fallback
     */
    _getValidAvatarUrl(avatarUrl) {
        if (avatarUrl && SecurityValidator.isValidGitHubImageUrl(avatarUrl)) {
            return avatarUrl;
        }

        // Return a data URI for a placeholder image
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0iIzMzMzMzMyIvPjx0ZXh0IHg9IjUwJSIgeT0iNTAlIiBmb250LWZhbWlseT0iQXJpYWwiIGZvbnQtc2l6ZT0iMTIiIGZpbGw9IndoaXRlIiB0ZXh0LWFuY2hvcj0ibWlkZGxlIiBkeT0iLjNlbSI+Tm8gSW1hZ2U8L3RleHQ+PC9zdmc+';
    }

    /**
     * Get the GitHub profile URL for the user
     * @private
     * @returns {string} GitHub profile URL
     */
    _getGitHubProfileUrl() {
        const user = this.userData.data || this.userData;
        const username = user.login || 'github';
        return `https://github.com/${SecurityValidator.sanitizeText(username)}`;
    }
}

/**
 * User Card Factory for creating different types of cards
 * Follows Factory Pattern for flexible card creation
 */
class UserCardFactory {
    /**
     * Create a user card based on data type
     * @param {Object} userData - User data
     * @param {HTMLElement} container - Container element
     * @returns {UserCard} User card instance
     */
    static create(userData, container) {
        return new UserCard(userData, container);
    }

    /**
     * Create multiple cards from an array of user data
     * @param {Object[]} usersData - Array of user data
     * @param {HTMLElement} container - Container element
     * @returns {UserCard[]} Array of user card instances
     */
    static createMultiple(usersData, container) {
        return usersData.map(userData => 
            UserCardFactory.create(userData, container)
        );
    }
}


/**
 * Main Application Controller following SOLID principles
 * Orchestrates all components and handles application lifecycle
 */


const appLogger = new Logger('App');

/**
 * Main Application Class following Single Responsibility Principle
 * Coordinates all application components and user interactions
 */
class GitHubProfileIdentifier {
    constructor() {
        this.apiService = new GitHubApiService();
        this.batchProcessor = new BatchProcessor(this.apiService);
        this.progressBar = null;
        this.userCards = [];

        // DOM elements
        this.elements = {
            searchInput: null,
            searchButton: null,
            githubTokenInput: null,
            resultsContainer: null,
            resultsGrid: null,
            resultsSummary: null,
            errorContainer: null,
            progressContainer: null
        };

        this.state = {
            isProcessing: false,
            currentResults: [],
            lastSearch: null
        };
    }

    /**
     * Initialize the application
     */
    async initialize() {
        try {
            appLogger.info('Initializing GitHub Profile Identifier application');
            this.initializeElements();
            this.bindEvents();
            this.setupKeyboardShortcuts();
            appLogger.info('Application initialized successfully');
        } catch (error) {
            appLogger.error('Failed to initialize application', error);
            this.showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Initialize DOM elements
     * @private
     */
    initializeElements() {
        this.elements.searchInput = document.getElementById('search-input');
        this.elements.searchButton = document.getElementById('search-button');
        this.elements.githubTokenInput = document.getElementById('github-token');
        this.elements.resultsContainer = document.getElementById('results');
        this.elements.errorContainer = document.getElementById('error-container');
        this.elements.progressContainer = document.getElementById('progress-container');

        if (!this.elements.searchInput || !this.elements.searchButton || !this.elements.resultsContainer) {
            throw new Error('Required DOM elements not found');
        }

        // Load saved token from localStorage
        this.loadGitHubToken();
    }

    /**
     * Bind event listeners
     * @private
     */
    bindEvents() {
        this.elements.searchButton.addEventListener('click', () => this.handleSearch());
        this.elements.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.handleSearch();
        });
        
        // Handle GitHub token input changes
        if (this.elements.githubTokenInput) {
            this.elements.githubTokenInput.addEventListener('input', () => this.handleTokenChange());
            this.elements.githubTokenInput.addEventListener('blur', () => this.saveGitHubToken());
        }
    }

    /**
     * Setup keyboard shortcuts if enabled
     * @private
     */
    setupKeyboardShortcuts() {
        if (!FEATURES.KEYBOARD_SHORTCUTS) return;

        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + K: Focus search input
            if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
                e.preventDefault();
                this.elements.searchInput.focus();
            }
            
            // Ctrl/Cmd + Enter: Execute search
            if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                e.preventDefault();
                this.handleSearch();
            }
            
            // Escape: Cancel search (if processing)
            if (e.key === 'Escape' && this.state.isProcessing) {
                // Note: Actual cancellation would require more complex implementation
                appLogger.info('Search cancellation requested (not implemented)');
            }
        });
    }

    /**
     * Handle search button click or Enter key
     */
    async handleSearch() {
        const query = this.elements.searchInput.value.trim();
        
        if (!query) {
            this.showError('Please enter at least one GitHub username');
            return;
        }

        if (this.state.isProcessing) {
            appLogger.info('Search already in progress, ignoring new request');
            return;
        }

        const usernames = this.parseUsernames(query);
        if (usernames.length === 0) {
            this.showError('Please enter valid GitHub usernames (letters, numbers, hyphens only)');
            return;
        }

        await this.processSearch(usernames);
    }

    /**
     * Parse and validate usernames from input
     * @param {string} query - Raw input query
     * @returns {string[]} Array of valid usernames
     * @private
     */
    parseUsernames(query) {
        return query
            .split(',')
            .map(username => username.trim())
            .filter(username => SecurityValidator.validateUsername(username));
    }

    /**
     * Process the search for multiple users
     * @param {string[]} usernames - Array of usernames to search
     * @private
     */
    async processSearch(usernames) {
        try {
            this.state.isProcessing = true;
            this.state.currentResults = [];
            this.clearResults();
            this.hideError();
            
            this.elements.searchButton.disabled = true;
            this.elements.searchButton.textContent = 'Searching...';

            if (FEATURES.PROGRESS_TRACKING) {
                this.progressBar = new ProgressBar(this.elements.progressContainer);
                this.progressBar.show(usernames.length);
            }

            await this.batchProcessor.processUsers(
                usernames,
                (processed, total) => this.handleProgress(processed, total),
                (result) => this.handleResult(result)
            );

            this.showResultsSummary();
            
        } catch (error) {
            appLogger.error('Search failed', error);
            this.showError('Search failed. Please try again.');
        } finally {
            this.state.isProcessing = false;
            this.elements.searchButton.disabled = false;
            this.elements.searchButton.textContent = 'Search';
            
            if (this.progressBar) {
                this.progressBar.hide();
                this.progressBar = null;
            }
        }
    }

    /**
     * Handle progress updates
     * @param {number} processed - Number of processed users
     * @param {number} total - Total number of users
     * @private
     */
    handleProgress(processed, total) {
        if (this.progressBar && FEATURES.PROGRESS_TRACKING) {
            this.progressBar.update(processed, total);
        }
    }

    /**
     * Handle individual user result
     * @param {Object} result - User result data
     * @private
     */
    handleResult(result) {
        this.state.currentResults.push(result);
        
        if (FEATURES.REAL_TIME_RESULTS) {
            this.renderUserCard(result);
        }
    }

    /**
     * Render a user card
     * @param {Object} userData - User data to render
     * @private
     */
    renderUserCard(userData) {
        if (!this.elements.resultsGrid) {
            this.elements.resultsGrid = document.createElement('div');
            this.elements.resultsGrid.className = 'results__grid';
            this.elements.resultsContainer.appendChild(this.elements.resultsGrid);
        }

        const userCard = UserCardFactory.create(userData, this.elements.resultsGrid);
        userCard.render();
        this.userCards.push(userCard);
    }

    /**
     * Show results summary
     * @private
     */
    showResultsSummary() {
        const successful = this.state.currentResults.filter(r => r.success).length;
        const total = this.state.currentResults.length;
        
        if (!this.elements.resultsSummary) {
            this.elements.resultsSummary = document.createElement('div');
            this.elements.resultsSummary.className = 'results__summary';
            this.elements.resultsContainer.insertBefore(
                this.elements.resultsSummary, 
                this.elements.resultsGrid
            );
        }

        this.elements.resultsSummary.textContent = `Found ${successful} of ${total} users`;
    }

    /**
     * Clear all results
     * @private
     */
    clearResults() {
        this.userCards = [];
        if (this.elements.resultsGrid) {
            this.elements.resultsGrid.innerHTML = '';
        }
        if (this.elements.resultsSummary) {
            this.elements.resultsSummary.textContent = '';
        }
    }

    /**
     * Show error message
     * @param {string} message - Error message to display
     * @private
     */
    showError(message) {
        this.elements.errorContainer.textContent = message;
        this.elements.errorContainer.className = 'error';
    }

    /**
     * Hide error message
     * @private
     */
    hideError() {
        this.elements.errorContainer.className = 'error--hidden';
    }

    /**
     * Load GitHub token from localStorage
     * @private
     */
    loadGitHubToken() {
        try {
            const savedToken = localStorage.getItem('github-token');
            if (savedToken && this.elements.githubTokenInput) {
                this.elements.githubTokenInput.value = savedToken;
                CONFIG.API.GITHUB_TOKEN = savedToken;
                appLogger.debug('GitHub token loaded from localStorage');
            }
        } catch (error) {
            appLogger.warn('Failed to load GitHub token from localStorage', error);
        }
    }

    /**
     * Save GitHub token to localStorage
     * @private
     */
    saveGitHubToken() {
        try {
            const token = this.elements.githubTokenInput?.value?.trim();
            if (token) {
                localStorage.setItem('github-token', token);
                appLogger.debug('GitHub token saved to localStorage');
            } else {
                localStorage.removeItem('github-token');
                appLogger.debug('GitHub token removed from localStorage');
            }
        } catch (error) {
            appLogger.warn('Failed to save GitHub token to localStorage', error);
        }
    }

    /**
     * Handle GitHub token input changes
     * @private
     */
    handleTokenChange() {
        const token = this.elements.githubTokenInput?.value?.trim();
        CONFIG.API.GITHUB_TOKEN = token || null;
        
        if (token) {
            appLogger.debug('GitHub token updated - rate limit increased to 5,000/hour');
        } else {
            appLogger.debug('GitHub token cleared - using unauthenticated rate limit (60/hour)');
        }
    }
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new GitHubProfileIdentifier();
    await app.initialize();
});

