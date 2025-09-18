/**
 * Secure Production Logger
 * Removes debug logging in production and adds proper error tracking
 */

class SecureLogger {
    constructor() {
        this.isProduction = window.appConfig?.isProduction() || false;
        this.enableDebugLogging = window.appConfig?.getFeatureFlags()?.enableDebugLogging || false;
        this.enableErrorReporting = window.appConfig?.getFeatureFlags()?.enableErrorReporting || true;
    }

    // Debug logging - only in development
    debug(...args) {
        if (!this.isProduction && this.enableDebugLogging) {
            console.log('[DEBUG]', ...args);
        }
    }

    // Info logging - limited in production
    info(...args) {
        if (!this.isProduction) {
            console.info('[INFO]', ...args);
        }
    }

    // Warning logging - always enabled but sanitized
    warn(...args) {
        const sanitizedArgs = this.sanitizeLogData(args);
        console.warn('[WARN]', ...sanitizedArgs);

        if (this.isProduction && this.enableErrorReporting) {
            this.reportToErrorService('warning', sanitizedArgs);
        }
    }

    // Error logging - always enabled but sanitized
    error(...args) {
        const sanitizedArgs = this.sanitizeLogData(args);
        console.error('[ERROR]', ...sanitizedArgs);

        if (this.enableErrorReporting) {
            this.reportToErrorService('error', sanitizedArgs);
        }
    }

    // Production-safe success logging
    success(message, data = {}) {
        if (!this.isProduction) {
            console.log('[SUCCESS]', message, data);
        }
    }

    // Sanitize sensitive data from logs
    sanitizeLogData(data) {
        return data.map(item => {
            if (typeof item === 'object' && item !== null) {
                return this.sanitizeObject(item);
            }
            if (typeof item === 'string') {
                return this.sanitizeString(item);
            }
            return item;
        });
    }

    sanitizeObject(obj) {
        const sanitized = { ...obj };
        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key', 'auth', 'credential'];

        for (const key in sanitized) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                sanitized[key] = '[REDACTED]';
            }
        }

        return sanitized;
    }

    sanitizeString(str) {
        // Remove potential sensitive patterns
        return str
            .replace(/AIza[0-9A-Za-z-_]{35}/g, '[FIREBASE_API_KEY]')
            .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[EMAIL]')
            .replace(/\b\d{16}\b/g, '[CARD_NUMBER]');
    }

    // Report to error tracking service (implement based on your choice)
    reportToErrorService(level, data) {
        // This would integrate with services like Sentry, LogRocket, etc.
        if (window.errorHandler && typeof window.errorHandler.reportCustomError === 'function') {
            window.errorHandler.reportCustomError(`Log ${level}`, data.join(' '), { level });
        }
    }

    // Performance logging for production monitoring
    performanceLog(operation, duration, metadata = {}) {
        if (this.isProduction) {
            // In production, only log performance metrics
            const logData = {
                operation,
                duration,
                timestamp: new Date().toISOString(),
                ...metadata
            };

            // Send to analytics/monitoring service
            this.sendToAnalytics('performance', logData);
        } else {
            console.log(`[PERFORMANCE] ${operation}: ${duration}ms`, metadata);
        }
    }

    sendToAnalytics(category, data) {
        // Integration point for analytics services
        if (window.gtag && this.enableAnalytics) {
            window.gtag('event', category, data);
        }
    }
}

// Create global logger instance
window.secureLogger = new SecureLogger();

// Replace console methods in production
if (window.appConfig?.isProduction()) {
    // Override console methods to prevent accidental logging
    const originalConsole = { ...console };

    console.log = (...args) => window.secureLogger.debug(...args);
    console.info = (...args) => window.secureLogger.info(...args);
    console.warn = (...args) => window.secureLogger.warn(...args);
    console.error = (...args) => window.secureLogger.error(...args);

    // Keep original methods available for emergency debugging
    window._originalConsole = originalConsole;
}