// Mobile Navigation Module
// Provides consistent navigation between desktop and mobile

const MobileNavigation = {
    
    // Initialize mobile navigation
    init() {
        this.updateNavigationButtons();
    },
    
    // Show mobile menu modal
    showMobileMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
            // Prevent body scroll while menu is open
            document.body.style.overflow = 'hidden';
        }
    },
    
    // Hide mobile menu modal
    hideMobileMenu() {
        const overlay = document.getElementById('mobileMenuOverlay');
        if (overlay) {
            overlay.style.display = 'none';
            document.body.style.overflow = '';
        }
    },
    
    // Update navigation button states to match desktop
    updateNavigationButtons() {
        // Update mobile view toggle to match desktop
        this.updateViewToggleButton();
        
        // Update mobile period navigation to match desktop
        this.updatePeriodNavigation();
    },
    
    // Update view toggle button text/icon
    updateViewToggleButton() {
        const mobileIcon = document.getElementById('mobileViewIcon');
        const mobileText = document.getElementById('mobileViewText');
        const desktopToggle = document.getElementById('viewToggle');
        const headerToggle = document.getElementById('mobileViewToggleHeader');
        
        // Use desktop toggle state as source of truth
        if (desktopToggle && mobileIcon && mobileText) {
            const isTableView = UIManager.isTableView;
            
            if (isTableView) {
                mobileIcon.textContent = '⚽';
                mobileText.textContent = 'Field';
                if (headerToggle) {
                    headerToggle.innerHTML = '<span class="icon">⚽</span>Field View';
                }
            } else {
                mobileIcon.textContent = '📊';
                mobileText.textContent = 'Table';
                if (headerToggle) {
                    headerToggle.innerHTML = '<span class="icon">📊</span>Table View';
                }
            }
        }
    },
    
    // Update period navigation buttons to match desktop state
    updatePeriodNavigation() {
        const currentPeriod = LineupManager.getCurrentPeriod();
        const totalPeriods = SoccerConfig.gameSettings.totalPeriods;
        
        // Update mobile period buttons to match desktop state
        const mobilePrevBtn = document.querySelector('.mobile-period-button:first-child');
        const mobileNextBtn = document.querySelector('.mobile-period-button:last-child');
        
        if (mobilePrevBtn) {
            mobilePrevBtn.disabled = currentPeriod === 1;
        }
        
        if (mobileNextBtn) {
            mobileNextBtn.disabled = currentPeriod === totalPeriods;
        }
        
        // Update period display
        const mobilePeriodTitle = document.getElementById('mobilePeriodTitle');
        const mobilePeriodTime = document.getElementById('mobilePeriodTime');
        
        if (mobilePeriodTitle) {
            mobilePeriodTitle.textContent = `Period ${currentPeriod}`;
        }
        
        if (mobilePeriodTime) {
            const timeInfo = SoccerConfig.utils.getPeriodTime(currentPeriod);
            mobilePeriodTime.textContent = timeInfo.display;
        }
    },
    
    // Handle unified view toggle for both desktop and mobile
    toggleView() {
        // Call the main UI manager toggle
        if (UIManager && UIManager.toggleView) {
            UIManager.toggleView();
            
            // Update navigation buttons after toggle
            setTimeout(() => {
                this.updateNavigationButtons();
            }, 50);
        }
    },
    
    // Handle period navigation that works on both desktop and mobile
    navigateToPeriod(direction) {
        let success = false;
        
        if (direction === 'next') {
            success = nextPeriod();
        } else if (direction === 'prev') {
            success = previousPeriod();
        }
        
        // Update navigation buttons after period change
        if (success) {
            setTimeout(() => {
                this.updateNavigationButtons();
            }, 50);
        }
        
        return success;
    }
};

// Global functions for HTML event handlers
function showMobileMenu() {
    MobileNavigation.showMobileMenu();
}

function hideMobileMenu() {
    MobileNavigation.hideMobileMenu();
}

// Override toggleView to ensure consistency
function toggleView() {
    MobileNavigation.toggleView();
}

// Enhanced period navigation functions
function nextPeriod() {
    const result = LineupManager.nextPeriod();
    if (result && UIManager) {
        UIManager.updateDisplay();
        MobileNavigation.updateNavigationButtons();
    }
    return result;
}

function previousPeriod() {
    const result = LineupManager.previousPeriod();
    if (result && UIManager) {
        UIManager.updateDisplay();
        MobileNavigation.updateNavigationButtons();
    }
    return result;
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    MobileNavigation.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileNavigation;
}