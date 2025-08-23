// Toast Notification Manager
// Provides user-friendly notifications to replace alerts and console messages

const ToastManager = {
    container: null,
    toastQueue: [],
    maxToasts: 5,
    defaultDuration: 4000,

    // Initialize toast container
    init() {
        this.createToastContainer();
        console.log('Toast Manager initialized');
    },

    // Create the toast container element
    createToastContainer() {
        if (this.container) return;

        this.container = document.createElement('div');
        this.container.id = 'toast-container';
        this.container.className = 'toast-container';
        document.body.appendChild(this.container);
    },

    // Show a toast notification
    show(message, type = 'info', duration = null) {
        if (!this.container) {
            console.warn('Toast container not initialized, falling back to console');
            console.log(`${type.toUpperCase()}: ${message}`);
            return;
        }

        const toast = this.createToast(message, type, duration || this.defaultDuration);
        this.displayToast(toast);
    },

    // Create toast element
    createToast(message, type, duration) {
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        // Toast content
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        // Icon based on type
        const icon = document.createElement('span');
        icon.className = 'toast-icon';
        icon.innerHTML = this.getIcon(type);
        
        // Message
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        // Close button
        const closeBtn = document.createElement('button');
        closeBtn.className = 'toast-close';
        closeBtn.innerHTML = '×';
        closeBtn.onclick = () => this.hideToast(toast);
        
        content.appendChild(icon);
        content.appendChild(messageEl);
        content.appendChild(closeBtn);
        toast.appendChild(content);

        // Progress bar
        const progressBar = document.createElement('div');
        progressBar.className = 'toast-progress';
        toast.appendChild(progressBar);

        // Auto-hide after duration
        setTimeout(() => {
            if (toast.parentNode) {
                this.hideToast(toast);
            }
        }, duration);

        // Animate progress bar
        setTimeout(() => {
            progressBar.style.transform = 'scaleX(0)';
            progressBar.style.transition = `transform ${duration}ms linear`;
        }, 100);

        return toast;
    },

    // Display toast with animation
    displayToast(toast) {
        // Remove oldest toast if at limit
        const currentToasts = this.container.querySelectorAll('.toast');
        if (currentToasts.length >= this.maxToasts) {
            this.hideToast(currentToasts[0]);
        }

        // Add toast to container
        this.container.appendChild(toast);

        // Trigger entrance animation
        setTimeout(() => {
            toast.classList.add('toast-show');
        }, 50);

        // Add hover events to pause/resume auto-hide
        toast.addEventListener('mouseenter', () => {
            const progressBar = toast.querySelector('.toast-progress');
            progressBar.style.animationPlayState = 'paused';
        });

        toast.addEventListener('mouseleave', () => {
            const progressBar = toast.querySelector('.toast-progress');
            progressBar.style.animationPlayState = 'running';
        });
    },

    // Hide toast with animation
    hideToast(toast) {
        if (!toast || !toast.parentNode) return;

        toast.classList.add('toast-hide');
        
        setTimeout(() => {
            if (toast.parentNode) {
                this.container.removeChild(toast);
            }
        }, 300);
    },

    // Get icon for toast type
    getIcon(type) {
        const icons = {
            success: '✓',
            error: '✕',
            warning: '⚠',
            info: 'ℹ',
            loading: '⟳'
        };
        return icons[type] || icons.info;
    },

    // Convenience methods for different types
    success(message, duration) {
        this.show(message, 'success', duration);
    },

    error(message, duration) {
        this.show(message, 'error', duration || 6000);
    },

    warning(message, duration) {
        this.show(message, 'warning', duration || 5000);
    },

    info(message, duration) {
        this.show(message, 'info', duration);
    },

    loading(message) {
        const toast = this.createLoadingToast(message);
        this.displayToast(toast);
        return toast; // Return reference so it can be updated/dismissed
    },

    // Create loading toast that doesn't auto-dismiss
    createLoadingToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast toast-loading';
        
        const content = document.createElement('div');
        content.className = 'toast-content';
        
        const spinner = document.createElement('div');
        spinner.className = 'toast-spinner';
        
        const messageEl = document.createElement('span');
        messageEl.className = 'toast-message';
        messageEl.textContent = message;
        
        content.appendChild(spinner);
        content.appendChild(messageEl);
        toast.appendChild(content);

        return toast;
    },

    // Update loading toast message
    updateLoadingToast(toast, message) {
        const messageEl = toast.querySelector('.toast-message');
        if (messageEl) {
            messageEl.textContent = message;
        }
    },

    // Dismiss loading toast and optionally show completion toast
    dismissLoadingToast(toast, completionMessage, completionType = 'success') {
        this.hideToast(toast);
        
        if (completionMessage) {
            setTimeout(() => {
                this.show(completionMessage, completionType);
            }, 100);
        }
    },

    // Clear all toasts
    clearAll() {
        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => this.hideToast(toast));
    },

    // Bulk operations for feedback
    showBulkOperation(operationName, itemCount, successCallback) {
        const loadingToast = this.loading(`${operationName}...`);
        
        // Simulate progress updates (if needed)
        let progress = 0;
        const updateInterval = setInterval(() => {
            progress += Math.random() * 20;
            if (progress >= 100) {
                progress = 100;
                clearInterval(updateInterval);
                
                if (successCallback) {
                    successCallback();
                }
                
                this.dismissLoadingToast(
                    loadingToast, 
                    `${operationName} completed successfully! (${itemCount} items processed)`,
                    'success'
                );
            } else {
                this.updateLoadingToast(loadingToast, `${operationName}... ${Math.round(progress)}%`);
            }
        }, 200);
        
        return loadingToast;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ToastManager;
}