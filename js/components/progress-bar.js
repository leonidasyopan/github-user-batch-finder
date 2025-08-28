/**
 * Progress Bar Component following Single Responsibility Principle
 * Handles progress visualization for batch operations
 */

import { CONFIG } from '../config.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('ProgressBar');

export class ProgressBar {
    constructor(container) {
        this.container = container;
        this.element = null;
        this.progressBar = null;
        this.progressText = null;
        this.warningText = null;
        this.isVisible = false;
    }

    /**
     * Initialize and render the progress bar
     */
    initialize() {
        this.element = this._createElement();
        this.container.appendChild(this.element);
        this._bindElements();
        logger.debug('Progress bar initialized');
    }

    /**
     * Show the progress bar
     */
    show() {
        if (this.element) {
            this.progressWarning.className = this.isVisible ? 'progress__warning progress__warning--visible' : 'progress__warning';
            this.isVisible = true;
            logger.debug('Progress bar shown');
        }
    }

    /**
     * Hide the progress bar
     */
    hide() {
        if (this.element) {
            this.element.style.display = 'none';
            this.isVisible = false;
            logger.debug('Progress bar hidden');
        }
    }

    /**
     * Update progress with new data
     * @param {Object} progressData - Progress information
     */
    updateProgress(progressData) {
        if (!this.isVisible) {
            this.show();
        }

        const percentage = this._calculatePercentage(progressData.processed, progressData.total);
        
        this._updateProgressBar(percentage);
        this._updateProgressText(progressData);
        this._updateWarningText(progressData);

        logger.debug('Progress updated', { 
            percentage, 
            processed: progressData.processed, 
            total: progressData.total 
        });
    }

    /**
     * Reset progress to initial state
     */
    reset() {
        if (this.progressBar) {
            this.progressBar.style.width = '0%';
            this.progressBar.textContent = '0%';
        }
        if (this.progressText) {
            this.progressText.textContent = 'Preparing...';
        }
        if (this.warningText) {
            this.warningText.style.display = 'none';
            this.warningText.textContent = '';
        }
        logger.debug('Progress bar reset');
    }

    /**
     * Set completion state
     * @param {Object} completionData - Completion information
     */
    setComplete(completionData) {
        this._updateProgressBar(100);
        this.progressText.textContent = `Completed: ${completionData.successful} of ${completionData.total} users found`;
        
        // Auto-hide after delay
        setTimeout(() => {
            this.hide();
        }, 2000);

        logger.debug('Progress bar set to complete', completionData);
    }

    /**
     * Create the progress bar DOM structure
     * @private
     * @returns {HTMLElement} Progress bar container
     */
    _createElement() {
        const container = document.createElement('div');
        container.className = 'progress';
        container.style.display = 'none';

        container.innerHTML = `
            <div class="progress__container">
                <div class="progress__bar">0%</div>
            </div>
            <div class="progress__text">Preparing...</div>
            <div class="progress__warning"></div>
        `;

        return container;
    }

    /**
     * Bind DOM elements to class properties
     * @private
     */
    _bindElements() {
        this.progressBar = this.element.querySelector('.progress__bar');
        this.progressText = this.element.querySelector('.progress__text');
        this.warningText = this.element.querySelector('.progress__warning');
    }

    /**
     * Calculate percentage from processed/total
     * @private
     * @param {number} processed - Processed count
     * @param {number} total - Total count
     * @returns {number} Percentage (0-100)
     */
    _calculatePercentage(processed, total) {
        if (total === 0) return 0;
        return Math.round((processed / total) * 100);
    }

    /**
     * Update the visual progress bar
     * @private
     * @param {number} percentage - Percentage to display
     */
    _updateProgressBar(percentage) {
        // Update progress bar width
        this.progressBar.className = `progress__bar progress__bar--${percentage}`;
        this.progressBar.textContent = `${percentage}%`;
    }

    /**
     * Update the progress text
     * @private
     * @param {Object} progressData - Progress data
     */
    _updateProgressText(progressData) {
        if (!this.progressText) return;

        if (progressData.isComplete) {
            this.progressText.textContent = `Completed: ${progressData.successful} of ${progressData.total} users`;
        } else if (progressData.cancelled) {
            this.progressText.textContent = 'Operation cancelled';
        } else {
            this.progressText.textContent = 
                `Processing chunk ${progressData.currentChunk}/${progressData.totalChunks} - ` +
                `${progressData.processed}/${progressData.total} users completed`;
        }
    }

    /**
     * Update warning text for rate limiting
     * @private
     * @param {Object} progressData - Progress data
     */
    _updateWarningText(progressData) {
        if (!this.warningText) return;

        if (progressData.rateLimitHits > 0) {
            this.warningText.style.display = 'block';
            this.warningText.textContent = `Rate limit encounters: ${progressData.rateLimitHits}`;
        } else {
            this.warningText.style.display = 'none';
        }
    }
}
