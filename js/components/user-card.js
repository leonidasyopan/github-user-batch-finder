/**
 * User Card Component following Single Responsibility Principle
 * Handles rendering and management of individual user display cards
 */

import { CONFIG } from '../config.js';
import { SecurityValidator } from '../utils/validator.js';
import { Logger } from '../utils/logger.js';

const logger = new Logger('UserCard');

export class UserCard {
    constructor(userData, container) {
        this.userData = userData;
        this.container = container;
        this.element = null;
    }

    /**
     * Render the user card and append to container
     * @returns {HTMLElement} The created card element
     */
    render() {
        this.element = this._createElement();
        this.container.appendChild(this.element);
        
        logger.debug('User card rendered', { 
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
            logger.debug('User card removed', { username: this.userData.username });
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
        const card = document.createElement('div');
        card.className = 'user-card';
        
        if (!this.userData.success) {
            card.classList.add('user-card--error');
            card.innerHTML = this._createErrorContent();
        } else {
            card.innerHTML = this._createSuccessContent();
        }

        return card;
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
}

/**
 * User Card Factory for creating different types of cards
 * Follows Factory Pattern for flexible card creation
 */
export class UserCardFactory {
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
