// Comprehensive Error Handling System
class ErrorHandler {
    constructor() {
        this.setupGlobalErrorHandling();
        this.errorQueue = [];
        this.maxErrors = 10; // Prevent error spam
    }

    setupGlobalErrorHandling() {
        // Catch unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: 'JavaScript Error',
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });

        // Catch unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: 'Unhandled Promise Rejection',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack
            });
        });

        // Catch network errors
        this.setupNetworkErrorHandling();
    }

    setupNetworkErrorHandling() {
        // Monitor fetch requests
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            try {
                const response = await originalFetch(...args);
                if (!response.ok) {
                    this.handleError({
                        type: 'Network Error',
                        message: `HTTP ${response.status}: ${response.statusText}`,
                        url: args[0]
                    });
                }
                return response;
            } catch (error) {
                this.handleError({
                    type: 'Network Error',
                    message: error.message,
                    url: args[0]
                });
                throw error;
            }
        };
    }

    handleError(errorInfo) {
        // Prevent error spam
        if (this.errorQueue.length >= this.maxErrors) {
            return;
        }

        // Add timestamp and environment info
        const enrichedError = {
            ...errorInfo,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href,
            environment: window.appConfig?.getEnvironment() || 'unknown'
        };

        this.errorQueue.push(enrichedError);

        // Log error (only in development)
        if (window.appConfig?.getFeatureFlags().enableDebugLogging) {
            console.error('Error captured:', enrichedError);
        }

        // Report error in production
        if (window.appConfig?.getFeatureFlags().enableErrorReporting) {
            this.reportError(enrichedError);
        }

        // Show user-friendly message
        this.showUserError(errorInfo);
    }

    reportError(errorInfo) {
        // In a real app, you'd send this to an error reporting service
        // like Sentry, LogRocket, or Firebase Crashlytics

        // For now, just store locally for debugging
        try {
            const storedErrors = JSON.parse(localStorage.getItem('app_errors') || '[]');
            storedErrors.push(errorInfo);

            // Keep only last 50 errors
            if (storedErrors.length > 50) {
                storedErrors.splice(0, storedErrors.length - 50);
            }

            localStorage.setItem('app_errors', JSON.stringify(storedErrors));
        } catch (e) {
            // If we can't even store the error, just ignore
        }
    }

    showUserError(errorInfo) {
        // Don't show error popup for every error - only critical ones
        const criticalErrors = ['Network Error', 'Authentication Error', 'Data Loss Error'];

        if (criticalErrors.some(type => errorInfo.type?.includes(type))) {
            this.showErrorModal(errorInfo);
        } else {
            // For non-critical errors, just show a brief toast
            this.showErrorToast(errorInfo);
        }
    }

    showErrorModal(errorInfo) {
        // Create error modal if it doesn't exist
        let modal = document.getElementById('errorModal');
        if (!modal) {
            modal = this.createErrorModal();
            document.body.appendChild(modal);
        }

        // Update modal content
        const title = modal.querySelector('.error-title');
        const message = modal.querySelector('.error-message');
        const details = modal.querySelector('.error-details');

        title.textContent = this.getUserFriendlyTitle(errorInfo.type);
        message.textContent = this.getUserFriendlyMessage(errorInfo);
        details.textContent = window.appConfig?.isDevelopment() ?
            JSON.stringify(errorInfo, null, 2) : '';

        // Show modal
        modal.style.display = 'flex';
    }

    createErrorModal() {
        const modal = document.createElement('div');
        modal.id = 'errorModal';
        modal.className = 'modal error-modal';
        modal.innerHTML = `
            <div class="modal-content error-modal-content">
                <div class="error-header">
                    <h3 class="error-title">Something went wrong</h3>
                    <button class="error-close-btn">&times;</button>
                </div>
                <div class="error-body">
                    <p class="error-message">We encountered an unexpected error.</p>
                    <div class="error-actions">
                        <button class="btn secondary error-retry-btn">Try Again</button>
                        <button class="btn primary error-refresh-btn">Refresh Page</button>
                    </div>
                    <details class="error-details-container" style="margin-top: 15px;">
                        <summary>Technical Details</summary>
                        <pre class="error-details" style="font-size: 12px; overflow: auto; max-height: 200px;"></pre>
                    </details>
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.error-close-btn').addEventListener('click', () => {
            modal.style.display = 'none';
        });

        modal.querySelector('.error-retry-btn').addEventListener('click', () => {
            modal.style.display = 'none';
            // App can implement retry logic
            window.dispatchEvent(new CustomEvent('errorRetry'));
        });

        modal.querySelector('.error-refresh-btn').addEventListener('click', () => {
            window.location.reload();
        });

        return modal;
    }

    showErrorToast(errorInfo) {
        // Create toast container if it doesn't exist
        let container = document.getElementById('errorToastContainer');
        if (!container) {
            container = document.createElement('div');
            container.id = 'errorToastContainer';
            container.className = 'error-toast-container';
            document.body.appendChild(container);
        }

        // Create toast
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="error-toast-content">
                <span class="error-toast-icon">⚠️</span>
                <span class="error-toast-message">${this.getUserFriendlyMessage(errorInfo)}</span>
                <button class="error-toast-close">&times;</button>
            </div>
        `;

        container.appendChild(toast);

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 5000);

        // Manual close
        toast.querySelector('.error-toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    getUserFriendlyTitle(errorType) {
        const titles = {
            'JavaScript Error': 'Application Error',
            'Network Error': 'Connection Problem',
            'Authentication Error': 'Login Issue',
            'Data Loss Error': 'Data Save Failed',
            'Unhandled Promise Rejection': 'Unexpected Error'
        };

        return titles[errorType] || 'Something went wrong';
    }

    getUserFriendlyMessage(errorInfo) {
        // Return user-friendly messages based on error type
        const type = errorInfo.type;
        const message = errorInfo.message || '';

        if (type === 'Network Error') {
            if (message.includes('Failed to fetch')) {
                return 'Please check your internet connection and try again.';
            }
            if (message.includes('401') || message.includes('403')) {
                return 'Please sign in again to continue.';
            }
            return 'There was a problem connecting to our servers. Please try again.';
        }

        if (type === 'Authentication Error') {
            return 'There was a problem with your login. Please sign in again.';
        }

        if (message.includes('permission') || message.includes('unauthorized')) {
            return 'You don\'t have permission to access this data.';
        }

        if (message.includes('quota') || message.includes('limit')) {
            return 'Service is temporarily unavailable. Please try again later.';
        }

        // Generic message
        return 'An unexpected error occurred. Please try refreshing the page.';
    }

    // Method for manual error reporting
    reportCustomError(type, message, details = {}) {
        this.handleError({
            type: type,
            message: message,
            ...details
        });
    }

    // Clear error queue
    clearErrors() {
        this.errorQueue = [];
    }

    // Get error history (for debugging)
    getErrorHistory() {
        return this.errorQueue;
    }
}

// Create global error handler instance
window.errorHandler = new ErrorHandler();