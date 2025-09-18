// Minimal Logger - No Classes, No Recursion
window.secureLogger = {
    debug: function(...args) {
        if (!window.PRODUCTION_MODE) console.log('[DEBUG]', ...args);
    },
    info: function(...args) {
        if (!window.PRODUCTION_MODE) console.info('[INFO]', ...args);
    },
    warn: function(...args) {
        console.warn('[WARN]', ...args);
    },
    error: function(...args) {
        console.error('[ERROR]', ...args);
    },
    success: function(message, data) {
        if (!window.PRODUCTION_MODE) console.log('[SUCCESS]', message, data);
    }
};