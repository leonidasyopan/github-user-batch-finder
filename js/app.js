/**
 * Main Application Controller following SOLID principles
 * Orchestrates all components and handles application lifecycle
 */

import { CONFIG, FEATURES } from './config.js';
import { Logger } from './utils/logger.js';
import { InputValidator } from './utils/validator.js';
import { GitHubApiService } from './services/github-api.js';
import { BatchProcessor } from './services/batch-processor.js';
import { UserCardFactory } from './components/user-card.js';
import { ProgressBar } from './components/progress-bar.js';

const logger = new Logger('App');

/**
 * Main Application Class following Single Responsibility Principle
 * Coordinates all application components and user interactions
 */
export class GitHubUserFinderApp {
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
            errorContainer: null
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
            logger.info('Initializing GitHub User Finder application');
            
            this._bindDOMElements();
            this._initializeComponents();
            this._attachEventListeners();
            this._setupKeyboardShortcuts();
            
            logger.info('Application initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize application', error);
            this._showError('Failed to initialize application. Please refresh the page.');
        }
    }

    /**
     * Perform user search
     * @param {string} input - Search input (comma-separated usernames)
     */
    async searchUsers(input) {
        if (this.state.isProcessing) {
            logger.warn('Search already in progress, ignoring new request');
            return;
        }

        try {
            // Validate input
            const validation = InputValidator.parseAndValidateUsernames(input);
            if (!validation.valid) {
                this._showError(validation.error);
                return;
            }

            logger.info('Starting user search', { 
                usernames: validation.usernames,
                count: validation.usernames.length 
            });

            this._setProcessingState(true);
            this._clearResults();
            this._initializeSearch(validation.usernames.length);

            // Process users
            const results = await this.batchProcessor.processUsers(
                validation.usernames,
                (progress) => this._handleProgress(progress),
                (result) => this._handleUserResult(result)
            );

            this._finalizeSearch(results);
            this.state.lastSearch = { input, results };

        } catch (error) {
            logger.error('Search failed', error);
            this._showError(CONFIG.MESSAGES.ERRORS.BATCH_ERROR);
        } finally {
            this._setProcessingState(false);
        }
    }

    /**
     * Cancel current search operation
     */
    cancelSearch() {
        if (this.state.isProcessing) {
            this.batchProcessor.cancel();
            this._setProcessingState(false);
            this._showMessage('Search cancelled');
            logger.info('Search operation cancelled by user');
        }
    }

    /**
     * Clear all results and reset UI
     */
    clearResults() {
        this._clearResults();
        this.state.currentResults = [];
        this.state.lastSearch = null;
        logger.info('Results cleared');
    }

    /**
     * Bind DOM elements to class properties
     * @private
     */
    _bindDOMElements() {
        this.elements.searchInput = document.getElementById('search-input');
        this.elements.searchButton = document.getElementById('search-button');
        this.elements.resultsContainer = document.getElementById('results');
        this.elements.errorContainer = document.getElementById('error-container');

        // Create results structure if not exists
        if (!this.elements.resultsContainer.querySelector('.results__summary')) {
            this.elements.resultsContainer.innerHTML = `
                <div class="results__summary" id="results-summary"></div>
                <div class="results__grid" id="results-grid"></div>
            `;
        }

        this.elements.resultsGrid = document.getElementById('results-grid');
        this.elements.resultsSummary = document.getElementById('results-summary');

        logger.debug('DOM elements bound successfully');
    }

    /**
     * Initialize application components
     * @private
     */
    _initializeComponents() {
        // Initialize progress bar
        if (FEATURES.PROGRESS_INDICATORS) {
            const progressContainer = document.getElementById('progress-container') || 
                                    this._createProgressContainer();
            this.progressBar = new ProgressBar(progressContainer);
            this.progressBar.initialize();
        }

        logger.debug('Components initialized');
    }

    /**
     * Attach event listeners
     * @private
     */
    _attachEventListeners() {
        // Search button click
        this.elements.searchButton?.addEventListener('click', () => {
            const input = this.elements.searchInput?.value?.trim() || '';
            this.searchUsers(input);
        });

        // Enter key in search input
        this.elements.searchInput?.addEventListener('keypress', (event) => {
            if (event.key === 'Enter') {
                const input = event.target.value.trim();
                this.searchUsers(input);
            }
        });

        // Input validation on type (debounced)
        if (this.elements.searchInput) {
            let debounceTimer;
            this.elements.searchInput.addEventListener('input', (event) => {
                clearTimeout(debounceTimer);
                debounceTimer = setTimeout(() => {
                    this._validateInputRealTime(event.target.value);
                }, CONFIG.UI.DEBOUNCE_DELAY);
            });
        }

        logger.debug('Event listeners attached');
    }

    /**
     * Setup keyboard shortcuts
     * @private
     */
    _setupKeyboardShortcuts() {
        if (!FEATURES.KEYBOARD_SHORTCUTS) return;

        document.addEventListener('keydown', (event) => {
            // Ctrl/Cmd + K to focus search
            if ((event.ctrlKey || event.metaKey) && event.key === 'k') {
                event.preventDefault();
                this.elements.searchInput?.focus();
            }

            // Escape to cancel search
            if (event.key === 'Escape' && this.state.isProcessing) {
                this.cancelSearch();
            }

            // Ctrl/Cmd + Enter to search
            if ((event.ctrlKey || event.metaKey) && event.key === 'Enter') {
                const input = this.elements.searchInput?.value?.trim() || '';
                this.searchUsers(input);
            }
        });

        logger.debug('Keyboard shortcuts setup complete');
    }

    /**
     * Handle progress updates during batch processing
     * @private
     * @param {Object} progress - Progress data
     */
    _handleProgress(progress) {
        if (this.progressBar) {
            this.progressBar.updateProgress(progress);
        }

        // Update summary with live count
        if (this.elements.resultsSummary) {
            const message = progress.isComplete 
                ? CONFIG.MESSAGES.SUCCESS.BATCH_COMPLETE
                    .replace('{found}', progress.successful)
                    .replace('{total}', progress.total)
                : CONFIG.MESSAGES.SUCCESS.STREAMING
                    .replace('{found}', progress.successful)
                    .replace('{processed}', progress.processed);
            
            this.elements.resultsSummary.textContent = message;
        }
    }

    /**
     * Handle individual user results
     * @private
     * @param {Object} result - User result data
     */
    _handleUserResult(result) {
        if (!this.elements.resultsGrid) return;

        const userCard = UserCardFactory.create(result, this.elements.resultsGrid);
        userCard.render();
        this.userCards.push(userCard);
        this.state.currentResults.push(result);

        logger.debug('User result processed', { 
            username: result.username, 
            success: result.success 
        });
    }

    /**
     * Initialize search UI state
     * @private
     * @param {number} totalUsers - Total number of users to search
     */
    _initializeSearch(totalUsers) {
        this._hideError();
        
        if (this.elements.resultsSummary) {
            this.elements.resultsSummary.textContent = 
                CONFIG.MESSAGES.SUCCESS.PROCESSING.replace('{total}', totalUsers);
        }

        if (this.progressBar) {
            this.progressBar.reset();
            this.progressBar.show();
        }
    }

    /**
     * Finalize search and update UI
     * @private
     * @param {Object[]} results - Final results array
     */
    _finalizeSearch(results) {
        const successful = results.filter(r => r.success).length;
        
        if (this.progressBar) {
            this.progressBar.setComplete({
                successful,
                total: results.length
            });
        }

        if (this.elements.resultsSummary) {
            this.elements.resultsSummary.textContent = 
                CONFIG.MESSAGES.SUCCESS.BATCH_COMPLETE
                    .replace('{found}', successful)
                    .replace('{total}', results.length);
        }

        logger.info('Search finalized', { 
            total: results.length, 
            successful 
        });
    }

    /**
     * Set processing state and update UI
     * @private
     * @param {boolean} isProcessing - Processing state
     */
    _setProcessingState(isProcessing) {
        this.state.isProcessing = isProcessing;
        
        if (this.elements.searchButton) {
            this.elements.searchButton.disabled = isProcessing;
            this.elements.searchButton.textContent = isProcessing ? 'Searching...' : 'Search';
        }

        if (this.elements.searchInput) {
            this.elements.searchInput.disabled = isProcessing;
        }
    }

    /**
     * Clear all results from UI
     * @private
     */
    _clearResults() {
        // Remove all user cards
        this.userCards.forEach(card => card.remove());
        this.userCards = [];

        // Clear results grid
        if (this.elements.resultsGrid) {
            this.elements.resultsGrid.innerHTML = '';
        }

        // Clear summary
        if (this.elements.resultsSummary) {
            this.elements.resultsSummary.textContent = '';
        }

        // Hide progress bar
        if (this.progressBar) {
            this.progressBar.hide();
        }
    }

    /**
     * Show error message
     * @private
     * @param {string} message - Error message
     */
    _showError(message) {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.textContent = message;
            this.elements.errorContainer.className = 'error';
        }
        logger.warn('Error shown to user', { message });
    }

    /**
     * Hide error message
     * @private
     */
    _hideError() {
        if (this.elements.errorContainer) {
            this.elements.errorContainer.className = 'error--hidden';
        }
    }

    /**
     * Show general message
     * @private
     * @param {string} message - Message to show
     */
    _showMessage(message) {
        if (this.elements.resultsSummary) {
            this.elements.resultsSummary.textContent = message;
        }
    }

    /**
     * Validate input in real-time
     * @private
     * @param {string} input - Input value
     */
    _validateInputRealTime(input) {
        if (!input.trim()) {
            this._hideError();
            return;
        }

        const validation = InputValidator.parseAndValidateUsernames(input);
        if (!validation.valid) {
            this._showError(validation.error);
        } else {
            this._hideError();
        }
    }

    /**
     * Create progress container if it doesn't exist
     * @private
     * @returns {HTMLElement} Progress container element
     */
    _createProgressContainer() {
        const container = document.createElement('div');
        container.id = 'progress-container';
        
        // Insert after search section
        const searchSection = document.querySelector('.search');
        if (searchSection && searchSection.parentNode) {
            searchSection.parentNode.insertBefore(container, searchSection.nextSibling);
        } else {
            document.body.appendChild(container);
        }
        
        return container;
    }
}

/**
 * Application initialization
 */
document.addEventListener('DOMContentLoaded', async () => {
    const app = new GitHubUserFinderApp();
    await app.initialize();
    
    // Make app globally available for debugging in development
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        window.githubApp = app;
    }
});
