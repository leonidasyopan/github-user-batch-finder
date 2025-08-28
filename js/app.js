/**
 * Main Application Controller following SOLID principles
 * Orchestrates all components and handles application lifecycle
 */

import { CONFIG, FEATURES } from './config.js';
import { Logger } from './utils/logger.js';
import { SecurityValidator } from './utils/validator.js';
import { GitHubApiService } from './services/github-api.js';
import { BatchProcessor } from './services/batch-processor.js';
import { UserCardFactory } from './components/user-card.js';
import { ProgressBar } from './components/progress-bar.js';

const logger = new Logger('App');

/**
 * Main Application Class following Single Responsibility Principle
 * Coordinates all application components and user interactions
 */
export class GitHubProfileIdentifier {
    constructor() {
        this.apiService = new GitHubApiService();
        this.batchProcessor = new BatchProcessor(this.apiService);
        this.progressBar = null;
        this.userCards = [];

        // DOM elements
        this.elements = {
            searchInput: null,
            searchButton: null,
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
            logger.info('Initializing GitHub Profile Identifier application');
            this.initializeElements();
            this.bindEvents();
            this.setupKeyboardShortcuts();
            logger.info('Application initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize application', error);
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
        this.elements.resultsContainer = document.getElementById('results');
        this.elements.errorContainer = document.getElementById('error-container');
        this.elements.progressContainer = document.getElementById('progress-container');

        if (!this.elements.searchInput || !this.elements.searchButton || !this.elements.resultsContainer) {
            throw new Error('Required DOM elements not found');
        }
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
                logger.info('Search cancellation requested (not implemented)');
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
            logger.info('Search already in progress, ignoring new request');
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
            logger.error('Search failed', error);
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
}

// Initialize application when DOM is loaded
document.addEventListener('DOMContentLoaded', async () => {
    const app = new GitHubProfileIdentifier();
    await app.initialize();
});
