/**
 * Security Utilities for Production
 * Input validation, sanitization, and rate limiting
 */

class SecurityUtils {
    constructor() {
        this.rateLimiter = new Map();
        this.maxRequestsPerMinute = 60;
        this.inputValidationRules = this.setupValidationRules();
    }

    // Rate limiting for Firebase calls
    checkRateLimit(operation, userId = 'anonymous') {
        const key = `${operation}_${userId}`;
        const now = Date.now();
        const windowStart = now - 60000; // 1 minute window

        if (!this.rateLimiter.has(key)) {
            this.rateLimiter.set(key, []);
        }

        const requests = this.rateLimiter.get(key);

        // Remove old requests outside the window
        const recentRequests = requests.filter(timestamp => timestamp > windowStart);

        // Check if limit exceeded
        if (recentRequests.length >= this.maxRequestsPerMinute) {
            window.secureLogger?.warn(`Rate limit exceeded for operation: ${operation}`);
            return false;
        }

        // Add current request
        recentRequests.push(now);
        this.rateLimiter.set(key, recentRequests);

        return true;
    }

    // Input validation and sanitization
    setupValidationRules() {
        return {
            teamName: {
                maxLength: 50,
                pattern: /^[a-zA-Z0-9\s\-_]+$/,
                required: true
            },
            playerName: {
                maxLength: 30,
                pattern: /^[a-zA-Z\s\-'\.]+$/,
                required: true
            },
            email: {
                maxLength: 254,
                pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                required: true
            },
            gameNote: {
                maxLength: 500,
                pattern: /^[a-zA-Z0-9\s\-_.,!?()]+$/,
                required: false
            }
        };
    }

    validateInput(value, type) {
        const rule = this.inputValidationRules[type];
        if (!rule) {
            window.secureLogger?.warn(`Unknown validation type: ${type}`);
            return { valid: false, error: 'Invalid input type' };
        }

        // Check required
        if (rule.required && (!value || value.trim().length === 0)) {
            return { valid: false, error: 'This field is required' };
        }

        // If not required and empty, it's valid
        if (!rule.required && (!value || value.trim().length === 0)) {
            return { valid: true, sanitized: '' };
        }

        const trimmedValue = value.trim();

        // Check length
        if (trimmedValue.length > rule.maxLength) {
            return { valid: false, error: `Maximum length is ${rule.maxLength} characters` };
        }

        // Check pattern
        if (rule.pattern && !rule.pattern.test(trimmedValue)) {
            return { valid: false, error: 'Invalid characters detected' };
        }

        // Sanitize the input
        const sanitized = this.sanitizeInput(trimmedValue, type);

        return { valid: true, sanitized };
    }

    sanitizeInput(value, type) {
        // Basic HTML escape
        let sanitized = value
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#x27;');

        // Type-specific sanitization
        switch (type) {
            case 'teamName':
            case 'playerName':
                // Remove any potential script tags or dangerous content
                sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
                break;
            case 'email':
                // Additional email sanitization
                sanitized = sanitized.toLowerCase();
                break;
            case 'gameNote':
                // Limit to safe characters for notes
                sanitized = sanitized.replace(/[^\w\s\-_.,!?()]/g, '');
                break;
        }

        return sanitized;
    }

    // XSS Prevention
    preventXSS(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    // CSRF Token generation and validation
    generateCSRFToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    validateCSRFToken(token, storedToken) {
        return token && storedToken && token === storedToken;
    }

    // Secure data storage helpers
    setSecureItem(key, value) {
        try {
            const encrypted = this.simpleEncrypt(JSON.stringify(value));
            localStorage.setItem(key, encrypted);
            return true;
        } catch (error) {
            window.secureLogger?.error('Failed to store secure item:', error);
            return false;
        }
    }

    getSecureItem(key) {
        try {
            const encrypted = localStorage.getItem(key);
            if (!encrypted) return null;

            const decrypted = this.simpleDecrypt(encrypted);
            return JSON.parse(decrypted);
        } catch (error) {
            window.secureLogger?.error('Failed to retrieve secure item:', error);
            return null;
        }
    }

    // Simple encryption for local storage (not cryptographically secure, just obfuscation)
    simpleEncrypt(text) {
        return btoa(encodeURIComponent(text));
    }

    simpleDecrypt(encoded) {
        return decodeURIComponent(atob(encoded));
    }

    // Content Security Policy helpers
    getNonce() {
        // Generate a nonce for inline scripts if needed
        const array = new Uint8Array(16);
        crypto.getRandomValues(array);
        return btoa(String.fromCharCode.apply(null, array));
    }

    // Clean up sensitive data from memory
    clearSensitiveData(obj) {
        if (typeof obj !== 'object' || obj === null) return;

        const sensitiveKeys = ['password', 'token', 'apiKey', 'secret', 'key', 'auth'];

        for (const key in obj) {
            if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
                delete obj[key];
            }
        }
    }
}

// Create global security utils instance
window.securityUtils = new SecurityUtils();

// Production security hardening
if (window.appConfig?.isProduction()) {
    // Disable eval in production
    window.eval = function() {
        window.secureLogger?.warn('eval() is disabled in production for security');
        throw new Error('eval is not allowed');
    };

    // Disable Function constructor
    const OriginalFunction = window.Function;
    window.Function = function() {
        window.secureLogger?.warn('Function constructor is disabled in production for security');
        throw new Error('Function constructor is not allowed');
    };

    // Remove dangerous global methods
    delete window.setTimeout.toString;
    delete window.setInterval.toString;

    // Disable console in production (except errors)
    if (window.secureLogger) {
        ['log', 'debug', 'info', 'trace'].forEach(method => {
            console[method] = () => {}; // Silent in production
        });
    }
}