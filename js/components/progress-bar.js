/**
 * Progress Bar Component following Single Responsibility Principle
 * Handles progress visualization and user feedback
 */

import { Logger } from '../utils/logger.js';

export class ProgressBar {
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
