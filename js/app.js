// Main Application Script
// Initializes all modules and provides global function access for HTML event handlers

// Global application state
let soccerLineupApp = {
    initialized: false,
    
    // Initialize the entire application
    init() {
        if (this.initialized) return;
        
        try {
            console.log('Initializing Soccer Lineup Manager...');
            
            // Initialize core modules in order
            ToastManager.init();
            TeamManager.init();
            LineupManager.init();
            HistoryManager.init();
            EnhancedStats.init();
            UIManager.init();
            DragDropManager.init();
            MobileEnhancements.init();
            PeriodTimer.init();
            PeriodTransitionUI.init();
            MobileTimerUI.init();
            
            
            // Initialize mobile-specific features if on mobile
            if (window.MobileUIManager) {
                MobileUIManager.init();
            }
            
            // Initialize PWA features
            this.initializePWA();
            
            // Set up additional features
            DragDropManager.setupTouchSupport();
            DragDropManager.setupEnhancedDragFeedback();
            
            // Render initial UI
            UIManager.renderPlayerList();
            UIManager.updateDisplay();
            
            // Update header with active team
            TeamManager.updateHeaderDisplay();
            
            
            this.initialized = true;
            console.log('Soccer Lineup Manager initialized successfully');
            ToastManager.success('Soccer Lineup Manager ready!', 3000);
            
        } catch (error) {
            console.error('Failed to initialize Soccer Lineup Manager:', error);
            this.showInitializationError(error);
        }
    },
    
    // Show initialization error to user
    showInitializationError(error) {
        const errorMessage = `
            Failed to load the Soccer Lineup Manager.
            Error: ${error.message}
            
            Please refresh the page and try again.
        `;
        alert(errorMessage);
    },
    
    // Initialize PWA features
    initializePWA() {
        // Register service worker for offline support
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('/sw.js').then(registration => {
                console.log('Service Worker registered:', registration);
            }).catch(error => {
                console.warn('Service Worker registration failed:', error);
            });
        }
        
        // Handle install prompt for PWA
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            window.deferredPrompt = e;
            this.showInstallPrompt();
        });
        
        // Handle app installed event
        window.addEventListener('appinstalled', () => {
            console.log('PWA installed successfully');
            ToastManager.success('App installed! You can now use it offline.', 5000);
        });
        
        // Handle URL parameters for deep linking
        this.handleUrlParameters();
    },
    
    // Show PWA install prompt
    showInstallPrompt() {
        if (window.innerWidth <= 768 && window.deferredPrompt) {
            setTimeout(() => {
                ToastManager.info('Add to Home Screen for better experience!', 8000);
            }, 5000);
        }
    },
    
    // Handle URL parameters for actions
    handleUrlParameters() {
        const urlParams = new URLSearchParams(window.location.search);
        const action = urlParams.get('action');
        const view = urlParams.get('view');
        
        if (action === 'autofill') {
            setTimeout(() => autoFillAll(), 1000);
        } else if (view === 'table') {
            setTimeout(() => toggleView(), 500);
        }
    }
};

// ===== GLOBAL FUNCTIONS FOR HTML EVENT HANDLERS =====
// These functions are called directly from the HTML onclick attributes

// Period navigation functions
function previousPeriod() {
    if (LineupManager.previousPeriod()) {
        UIManager.updateDisplay();
    }
}

function nextPeriod() {
    if (LineupManager.nextPeriod()) {
        UIManager.updateDisplay();
    }
}

// View toggle function
function toggleView() {
    UIManager.toggleView();
}

// Auto-fill functions
function autoFill() {
    // Redirect to the new 5-rule algorithm
    autoFillAll();
}

function autoFillAll() {
    console.log('🔥 autoFillAll() function called - about to run 5-rule algorithm');
    const loadingToast = ToastManager.loading('Auto-filling all periods with 5-rule algorithm...');
    
    try {
        // Small delay to show loading state
        setTimeout(() => {
            AutoFillManager.autoFillAll();
            UIManager.updateDisplay();
            console.log('Auto-fill completed for all periods');
            
            // Show quality check
            const issues = AutoFillManager.validateLineupQuality();
            if (issues.length > 0) {
                console.warn('Lineup quality issues:', issues);
                ToastManager.dismissLoadingToast(loadingToast, `Auto-fill complete with ${issues.length} suggestions`, 'warning');
            } else {
                ToastManager.dismissLoadingToast(loadingToast, 'All periods auto-filled perfectly!', 'success');
            }
        }, 500);
    } catch (error) {
        console.error('Auto-fill all failed:', error);
        ToastManager.dismissLoadingToast(loadingToast, 'Auto-fill failed. Please try again.', 'error');
    }
}

// Clear functions
function clearPeriod() {
    LineupManager.clearCurrentPeriod();
    UIManager.updateDisplay();
    ToastManager.info(`Period ${LineupManager.getCurrentPeriod()} cleared`, 3000);
    console.log('Current period cleared');
}

function clearAllPeriods() {
    LineupManager.clearAllPeriods();
    UIManager.updateDisplay();
    ToastManager.info('All periods cleared', 3000);
    console.log('All periods cleared');
}

// Export function
async function exportLineup() {
    try {
        const success = await ExportUtils.exportLineupScreenshot();
        if (success) {
            console.log('Lineup exported successfully');
        }
    } catch (error) {
        console.error('Export failed:', error);
        alert('Export failed. Please try again or use a different browser.');
    }
}

// Additional export functions (can be called from console or future UI elements)
window.soccerLineupExports = {
    exportData: () => ExportUtils.exportLineupData(),
    exportCSV: () => ExportUtils.exportLineupCSV(),
    importData: () => ExportUtils.importLineupData(),
    copyToClipboard: () => ExportUtils.copyLineupToClipboard(),
    print: () => ExportUtils.printLineup()
};

// ===== UTILITY FUNCTIONS =====

// Debug functions for development (accessible via console)
window.soccerLineupDebug = {
    getLineupState: () => LineupManager.getFullLineup(),
    getCurrentPeriod: () => LineupManager.getCurrentPeriod(),
    getPlayerStats: (playerName) => LineupManager.calculatePlayerStats(playerName),
    validateLineup: () => AutoFillManager.validateLineupQuality(),
    exportState: () => LineupManager.exportState(),
    importState: (state) => {
        LineupManager.importState(state);
        UIManager.updateDisplay();
    }
};

// Performance monitoring (optional)
function trackPerformance(operation, fn) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    console.log(`${operation} took ${(end - start).toFixed(2)} milliseconds`);
    return result;
}

// ===== ERROR HANDLING =====

// Global error handler for unhandled errors
window.addEventListener('error', (event) => {
    console.error('Unhandled error in Soccer Lineup Manager:', event.error);
    
    // Don't show alert for every error, just log it
    // Could be enhanced with error reporting service
});

// Handle unhandled promise rejections
window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection in Soccer Lineup Manager:', event.reason);
    event.preventDefault(); // Prevent default browser behavior
});

// ===== LOCAL STORAGE INTEGRATION =====

// Auto-save functionality
let autoSaveTimeout = null;

function triggerAutoSave() {
    // Debounce auto-save to avoid too frequent saves
    if (autoSaveTimeout) {
        clearTimeout(autoSaveTimeout);
    }
    
    autoSaveTimeout = setTimeout(() => {
        try {
            const state = LineupManager.exportState();
            localStorage.setItem('soccerLineupAutoSave', JSON.stringify(state));
            console.log('Auto-saved lineup state');
        } catch (error) {
            console.warn('Auto-save failed:', error);
        }
    }, 2000); // Save after 2 seconds of inactivity
}

// Load auto-saved state on initialization
function loadAutoSavedState() {
    try {
        const savedState = localStorage.getItem('soccerLineupAutoSave');
        if (savedState) {
            const state = JSON.parse(savedState);
            
            // Ask user if they want to restore
            const restore = confirm('A previously saved lineup was found. Would you like to restore it?');
            if (restore) {
                LineupManager.importState(state);
                UIManager.updateDisplay();
                console.log('Auto-saved state restored');
            } else {
                // Clear the auto-save if user doesn't want it
                localStorage.removeItem('soccerLineupAutoSave');
            }
        }
    } catch (error) {
        console.warn('Failed to load auto-saved state:', error);
    }
}

// Enhanced auto-save integration
const originalAssignPlayer = LineupManager.assignPlayerToPosition;
LineupManager.assignPlayerToPosition = function(playerName, position) {
    const result = originalAssignPlayer.call(this, playerName, position);
    if (result) triggerAutoSave();
    return result;
};

const originalAddToBench = LineupManager.addPlayerToBench;
LineupManager.addPlayerToBench = function(playerName) {
    originalAddToBench.call(this, playerName);
    triggerAutoSave();
};

const originalAddToJersey = LineupManager.addPlayerToJersey;
LineupManager.addPlayerToJersey = function(playerName) {
    originalAddToJersey.call(this, playerName);
    triggerAutoSave();
};

// ===== APPLICATION STARTUP =====

// Initialize when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing Soccer Lineup Manager...');
    
    // Small delay to ensure all resources are loaded
    setTimeout(() => {
        soccerLineupApp.init();
        loadAutoSavedState();
    }, 100);
});

// Handle page unload
window.addEventListener('beforeunload', (event) => {
    // Trigger final save
    triggerAutoSave();
    
    // Optional: Ask user to confirm leaving if there are unsaved changes
    // This could be enhanced to check for actual changes
    const hasChanges = Object.values(LineupManager.getFullLineup()).some(period => 
        Object.values(period.positions).some(player => player !== null) ||
        period.bench.length > 0 ||
        (period.jersey && period.jersey.length > 0)
    );
    
    if (hasChanges) {
        const message = 'You have lineup changes. Are you sure you want to leave?';
        event.returnValue = message;
        return message;
    }
});

// ===== CONSOLE WELCOME MESSAGE =====
console.log('%c⚽ Soccer Lineup Manager Loaded', 'color: #3b82f6; font-size: 16px; font-weight: bold');
console.log('Available debug functions: soccerLineupDebug');
console.log('Available export functions: soccerLineupExports');
console.log('Documentation: See Youth_Soccer_Lineup_Manager_PRD.md');