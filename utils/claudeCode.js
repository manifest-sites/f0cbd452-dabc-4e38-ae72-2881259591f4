/**
 * Claude Code SDK utility functions
 */

let query;
let isInitializing = false;
let lastError = null;

/**
 * Initialize the Claude Code SDK
 * @returns {Promise<void>}
 */
async function initializeClaudeCode() {
    if (isInitializing) {
        console.log('Claude Code SDK initialization already in progress...');
        return;
    }
    
    isInitializing = true;
    lastError = null;
    
    try {
        console.log('Initializing Claude Code SDK...');
        const module = await import("@anthropic-ai/claude-code");
        query = module.query;
        console.log('Claude Code SDK initialized successfully');
    } catch (err) {
        lastError = err;
        console.error('Failed to import @anthropic-ai/claude-code:', err);
        console.error('Error details:', {
            name: err.name,
            message: err.message,
            code: err.code,
            stack: err.stack
        });
        throw err;
    } finally {
        isInitializing = false;
    }
}

/**
 * Get the query function
 * @returns {Function|null} The query function or null if not initialized
 */
function getQuery() {
    return query;
}

/**
 * Check if Claude Code SDK is initialized
 * @returns {boolean}
 */
function isInitialized() {
    return query !== undefined;
}

/**
 * Get the last error that occurred during initialization
 * @returns {Error|null}
 */
function getLastError() {
    return lastError;
}

/**
 * Get initialization status
 * @returns {Object}
 */
function getStatus() {
    return {
        isInitialized: isInitialized(),
        isInitializing: isInitializing,
        hasQuery: query !== undefined,
        lastError: lastError ? {
            name: lastError.name,
            message: lastError.message,
            code: lastError.code
        } : null
    };
}

module.exports = {
    initializeClaudeCode,
    getQuery,
    isInitialized,
    getLastError,
    getStatus
}; 