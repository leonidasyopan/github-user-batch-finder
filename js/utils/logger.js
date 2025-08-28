/**
 * Logger Utility following Single Responsibility Principle
 * Provides contextual logging capabilities with multiple levels
 */

export class Logger {
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
