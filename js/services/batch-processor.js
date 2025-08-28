/**
 * Batch Processor Service following Single Responsibility Principle
 * Handles batch processing of multiple users with intelligent chunking
 */

import { CONFIG } from '../config.js';
import { Logger } from '../utils/logger.js';

export class BatchProcessor {
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
