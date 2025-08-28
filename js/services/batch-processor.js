/**
 * Batch Processing Service following SOLID principles
 * Handles chunked processing of multiple GitHub users with intelligent rate limiting
 */

import { CONFIG } from '../config.js';
import { Logger } from '../utils/logger.js';
import { GitHubApiService } from './github-api.js';

const logger = new Logger('BatchProcessor');

export class BatchProcessor {
    constructor(apiService = new GitHubApiService()) {
        this.apiService = apiService;
        this.chunkSize = CONFIG.BATCH.CHUNK_SIZE;
        this.delayBetweenChunks = CONFIG.BATCH.DELAY_BETWEEN_CHUNKS;
        this.isProcessing = false;
        this.currentOperation = null;
        this.results = new Map();
    }

    /**
     * Process multiple users in batches with progress callbacks
     * @param {string[]} usernames - Array of usernames to process
     * @param {Function} onProgress - Progress callback function
     * @param {Function} onResult - Individual result callback function
     * @returns {Promise<Object[]>} Array of all results
     */
    async processUsers(usernames, onProgress = () => {}, onResult = () => {}) {
        if (this.isProcessing) {
            throw new Error('Batch processor is already running');
        }

        this.isProcessing = true;
        this.results.clear();

        const operation = new BatchOperation(usernames, this.apiService, {
            chunkSize: this.chunkSize,
            delayBetweenChunks: this.delayBetweenChunks
        });

        this.currentOperation = operation;

        try {
            logger.info('Starting batch processing', { 
                totalUsers: usernames.length,
                chunkSize: this.chunkSize 
            });

            const results = await operation.execute(onProgress, onResult);
            
            // Cache results
            results.forEach(result => {
                if (result.username) {
                    this.results.set(result.username, result);
                }
            });

            logger.info('Batch processing completed', { 
                totalProcessed: results.length,
                successful: results.filter(r => r.success).length
            });

            return results;

        } finally {
            this.isProcessing = false;
            this.currentOperation = null;
        }
    }

    /**
     * Cancel current batch operation
     */
    cancel() {
        if (this.currentOperation) {
            this.currentOperation.cancel();
            this.isProcessing = false;
            logger.info('Batch operation cancelled');
        }
    }

    /**
     * Get cached result for a username
     * @param {string} username - Username to lookup
     * @returns {Object|null} Cached result or null
     */
    getCachedResult(username) {
        return this.results.get(username) || null;
    }

    /**
     * Clear all cached results
     */
    clearCache() {
        this.results.clear();
        logger.debug('Cache cleared');
    }

    /**
     * Check if processor is currently running
     * @returns {boolean} True if processing
     */
    isRunning() {
        return this.isProcessing;
    }
}

/**
 * Individual batch operation handler
 * Follows Single Responsibility Principle - handles one batch operation
 */
class BatchOperation {
    constructor(usernames, apiService, options = {}) {
        this.usernames = usernames;
        this.apiService = apiService;
        this.chunkSize = options.chunkSize || CONFIG.BATCH.CHUNK_SIZE;
        this.delayBetweenChunks = options.delayBetweenChunks || CONFIG.BATCH.DELAY_BETWEEN_CHUNKS;
        this.cancelled = false;
        this.chunks = this._createChunks(usernames);
        this.stats = {
            processed: 0,
            successful: 0,
            failed: 0,
            rateLimitHits: 0,
            startTime: null,
            endTime: null
        };
    }

    /**
     * Execute the batch operation
     * @param {Function} onProgress - Progress callback
     * @param {Function} onResult - Result callback
     * @returns {Promise<Object[]>} Results array
     */
    async execute(onProgress, onResult) {
        this.stats.startTime = Date.now();
        const allResults = [];

        logger.debug('Executing batch operation', {
            totalUsers: this.usernames.length,
            totalChunks: this.chunks.length,
            chunkSize: this.chunkSize
        });

        for (let chunkIndex = 0; chunkIndex < this.chunks.length; chunkIndex++) {
            if (this.cancelled) {
                logger.info('Batch operation cancelled during execution');
                break;
            }

            const chunk = this.chunks[chunkIndex];
            
            // Report progress before processing chunk
            this._reportProgress(onProgress, chunkIndex);

            try {
                const chunkResults = await this._processChunk(chunk, chunkIndex);
                
                // Stream individual results
                chunkResults.forEach(result => {
                    allResults.push(result);
                    this._updateStats(result);
                    onResult(result);
                });

                // Delay between chunks (except for last chunk)
                if (chunkIndex < this.chunks.length - 1 && !this.cancelled) {
                    await this._delay(this.delayBetweenChunks);
                }

            } catch (error) {
                logger.error('Chunk processing failed', { 
                    chunkIndex, 
                    chunk: chunk.map(u => u.username || u),
                    error 
                });

                // Create error results for failed chunk
                const errorResults = chunk.map(username => ({
                    success: false,
                    username: typeof username === 'string' ? username : username.username,
                    error: 'Chunk processing failed',
                    errorType: 'PROCESSING_ERROR'
                }));

                errorResults.forEach(result => {
                    allResults.push(result);
                    this._updateStats(result);
                    onResult(result);
                });
            }
        }

        this.stats.endTime = Date.now();
        
        // Final progress report
        this._reportProgress(onProgress, this.chunks.length, true);

        logger.info('Batch operation completed', {
            ...this.stats,
            duration: this.stats.endTime - this.stats.startTime
        });

        return allResults;
    }

    /**
     * Cancel the operation
     */
    cancel() {
        this.cancelled = true;
    }

    /**
     * Process a single chunk of usernames
     * @private
     * @param {string[]} chunk - Chunk of usernames
     * @param {number} chunkIndex - Index of current chunk
     * @returns {Promise<Object[]>} Chunk results
     */
    async _processChunk(chunk, chunkIndex) {
        logger.debug('Processing chunk', { chunkIndex, usernames: chunk });

        const promises = chunk.map(username => 
            this.apiService.fetchUserWithRetry(username)
        );

        try {
            const results = await Promise.all(promises);
            
            // Check for rate limiting in results
            const rateLimitedResults = results.filter(r => r.errorType === 'RATE_LIMITED');
            if (rateLimitedResults.length > 0) {
                this.stats.rateLimitHits++;
                logger.warn('Rate limiting detected in chunk', { 
                    chunkIndex, 
                    rateLimitedCount: rateLimitedResults.length 
                });
            }

            return results;

        } catch (error) {
            logger.error('Chunk processing error', { chunkIndex, error });
            throw error;
        }
    }

    /**
     * Create chunks from usernames array
     * @private
     * @param {string[]} usernames - Array of usernames
     * @returns {string[][]} Array of chunks
     */
    _createChunks(usernames) {
        const chunks = [];
        for (let i = 0; i < usernames.length; i += this.chunkSize) {
            chunks.push(usernames.slice(i, i + this.chunkSize));
        }
        return chunks;
    }

    /**
     * Report progress to callback
     * @private
     * @param {Function} onProgress - Progress callback
     * @param {number} currentChunk - Current chunk index
     * @param {boolean} isComplete - Whether operation is complete
     */
    _reportProgress(onProgress, currentChunk, isComplete = false) {
        const progressData = {
            processed: this.stats.processed,
            total: this.usernames.length,
            currentChunk: currentChunk + 1,
            totalChunks: this.chunks.length,
            rateLimitHits: this.stats.rateLimitHits,
            successful: this.stats.successful,
            failed: this.stats.failed,
            isComplete,
            cancelled: this.cancelled
        };

        onProgress(progressData);
    }

    /**
     * Update operation statistics
     * @private
     * @param {Object} result - Individual result
     */
    _updateStats(result) {
        this.stats.processed++;
        if (result.success) {
            this.stats.successful++;
        } else {
            this.stats.failed++;
        }
    }

    /**
     * Utility delay method
     * @private
     * @param {number} ms - Milliseconds to delay
     * @returns {Promise} Promise that resolves after delay
     */
    _delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}
