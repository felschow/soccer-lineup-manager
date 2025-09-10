// Progressive Disclosure & Unified Features Module
// Handles collapsible sections, unified timer, and touch interactions

const ProgressiveDisclosure = {
    // Track collapsed state
    sectionStates: {
        timer: false,
        changes: false,
        'period-changes': true // Mobile period changes start collapsed
    },
    
    // Initialize progressive disclosure
    init() {
        this.setupCollapsibleSections();
        this.setupUnifiedTimer();
        this.setupTouchInteractions();
        this.setupUnifiedPeriodChanges();
    },
    
    // Setup collapsible sidebar sections
    setupCollapsibleSections() {
        // Initialize section states based on screen size
        this.updateSectionVisibility();
        
        // Add resize listener to adapt to screen size changes
        window.addEventListener('resize', () => {
            this.updateSectionVisibility();
        });
        
        // Also listen for orientation changes
        window.addEventListener('orientationchange', () => {
            setTimeout(() => this.updateSectionVisibility(), 100);
        });
    },
    
    // Update section visibility based on screen size
    updateSectionVisibility() {
        const isMobile = window.innerWidth <= 768;
        const isShortScreen = window.innerHeight < 700;
        
        // On mobile or short screens, collapse advanced features by default
        if (isMobile || isShortScreen) {
            this.sectionStates.timer = true;
            this.sectionStates.changes = true;
        } else {
            // On larger screens, expand by default for better UX
            this.sectionStates.timer = false;
            this.sectionStates.changes = false;
        }
        
        // Apply states
        this.applySectionState('timer');
        this.applySectionState('changes');
    },
    
    // Toggle sidebar section
    toggleSidebarSection(sectionId) {
        this.sectionStates[sectionId] = !this.sectionStates[sectionId];
        this.applySectionState(sectionId);
    },
    
    // Apply section state (collapsed/expanded)
    applySectionState(sectionId) {
        const content = document.getElementById(`${sectionId}-content`);
        const icon = document.getElementById(`${sectionId}-icon`);
        const header = document.querySelector(`[onclick="toggleSidebarSection('${sectionId}')"]`);
        
        if (!content || !icon || !header) return;
        
        const isCollapsed = this.sectionStates[sectionId];
        
        if (isCollapsed) {
            content.classList.add('collapsed');
            header.classList.add('collapsed');
            icon.textContent = '+';
        } else {
            content.classList.remove('collapsed');
            header.classList.remove('collapsed');
            icon.textContent = '−';
        }
    },
    
    // Toggle mobile section
    toggleMobileSection(sectionId) {
        this.sectionStates[sectionId] = !this.sectionStates[sectionId];
        this.applyMobileSectionState(sectionId);
    },
    
    // Apply mobile section state
    applyMobileSectionState(sectionId) {
        const content = document.getElementById(`${sectionId}-mobile-content`);
        const icon = document.getElementById(`${sectionId}-mobile-icon`);
        const header = document.querySelector(`[onclick="toggleMobileSection('${sectionId}')"]`);
        
        if (!content || !icon || !header) return;
        
        const isCollapsed = this.sectionStates[sectionId];
        
        if (isCollapsed) {
            content.classList.add('collapsed');
            header.classList.remove('expanded');
            icon.textContent = '+';
        } else {
            content.classList.remove('collapsed');
            header.classList.add('expanded');
            icon.textContent = '−';
        }
    },
    
    // Setup unified timer functionality
    setupUnifiedTimer() {
        // Sync desktop and mobile timer displays
        this.syncTimerDisplays();
        
        // Override timer update to sync both displays
        if (window.PeriodTimer) {
            const originalUpdate = PeriodTimer.updateGameTimerDisplay;
            PeriodTimer.updateGameTimerDisplay = () => {
                originalUpdate.call(PeriodTimer);
                this.syncTimerDisplays();
            };
            
            const originalUpdateButton = PeriodTimer.updateTimerButton;
            PeriodTimer.updateTimerButton = () => {
                originalUpdateButton.call(PeriodTimer);
                this.syncTimerButtons();
            };
        }
    },
    
    // Sync timer displays between desktop and mobile
    syncTimerDisplays() {
        const desktopDisplay = document.getElementById('gameTimerDisplay');
        const mobileDisplay = document.getElementById('mobileGameTimerDisplay');
        
        if (desktopDisplay && mobileDisplay) {
            mobileDisplay.textContent = desktopDisplay.textContent;
        }
        
        // Sync progress bars
        const desktopProgress = document.getElementById('periodProgressBar');
        const mobileProgress = document.getElementById('mobilePeriodProgressBar');
        
        if (desktopProgress && mobileProgress) {
            mobileProgress.style.width = desktopProgress.style.width;
            mobileProgress.style.backgroundColor = desktopProgress.style.backgroundColor;
        }
    },
    
    // Sync timer buttons between desktop and mobile
    syncTimerButtons() {
        const desktopButton = document.getElementById('timerToggleBtn');
        const mobileButton = document.getElementById('mobileTimerToggleBtn');
        
        if (desktopButton && mobileButton) {
            const isRunning = desktopButton.textContent.includes('Pause');
            
            if (isRunning) {
                mobileButton.textContent = '⏸️';
                mobileButton.classList.add('running');
            } else {
                mobileButton.textContent = '▶️';
                mobileButton.classList.remove('running');
            }
        }
    },
    
    // Setup unified period changes
    setupUnifiedPeriodChanges() {
        // Override period changes update to sync both displays
        if (window.PeriodTransitionUI) {
            const originalUpdate = PeriodTransitionUI.updatePeriodChangesDisplay;
            PeriodTransitionUI.updatePeriodChangesDisplay = () => {
                originalUpdate.call(PeriodTransitionUI);
                this.syncPeriodChangesDisplays();
            };
        }
    },
    
    // Sync period changes between desktop and mobile
    syncPeriodChangesDisplays() {
        const desktopList = document.getElementById('periodChangesList');
        const mobileList = document.getElementById('mobilePeriodChangesList');
        
        if (desktopList && mobileList) {
            mobileList.innerHTML = desktopList.innerHTML;
        }
    },
    
    // Setup touch-first interactions
    setupTouchInteractions() {
        this.enhanceInteractiveElements();
        this.setupHybridDragDrop();
    },
    
    // Enhance all interactive elements with touch-friendly behavior
    enhanceInteractiveElements() {
        // Add touch-friendly classes to interactive elements
        const buttons = document.querySelectorAll('button, .btn, .mobile-nav-button');
        const cards = document.querySelectorAll('.player-card, .mobile-position-card');
        const draggables = document.querySelectorAll('[draggable="true"]');
        
        [...buttons, ...cards, ...draggables].forEach(element => {
            element.classList.add('interactive-element', 'touch-target');
            
            // Add touch feedback for buttons
            if (element.tagName === 'BUTTON' || element.classList.contains('btn')) {
                element.classList.add('touch-feedback');
            }
        });
    },
    
    // Setup hybrid drag-drop that works with both mouse and touch
    setupHybridDragDrop() {
        const draggableElements = document.querySelectorAll('.player-card, .mobile-position-card');
        
        draggableElements.forEach(element => {
            element.classList.add('draggable');
            
            // Touch events
            element.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            element.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            element.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
            
            // Mouse events (existing drag-drop should still work)
            element.addEventListener('mousedown', this.handleMouseDown.bind(this));
        });
    },
    
    // Touch event handlers for drag-drop
    currentTouch: null,
    touchStartPos: { x: 0, y: 0 },
    
    handleTouchStart(e) {
        e.preventDefault();
        const touch = e.touches[0];
        this.currentTouch = e.target;
        this.touchStartPos = { x: touch.clientX, y: touch.clientY };
        
        // Add dragging visual feedback
        e.target.classList.add('dragging');
    },
    
    handleTouchMove(e) {
        if (!this.currentTouch) return;
        e.preventDefault();
        
        const touch = e.touches[0];
        const deltaX = touch.clientX - this.touchStartPos.x;
        const deltaY = touch.clientY - this.touchStartPos.y;
        
        // Update visual position
        this.currentTouch.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(1.05)`;
        
        // Find drop target
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        this.updateDropTargets(elementBelow);
    },
    
    handleTouchEnd(e) {
        if (!this.currentTouch) return;
        e.preventDefault();
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        // Reset visual state
        this.currentTouch.style.transform = '';
        this.currentTouch.classList.remove('dragging');
        
        // Attempt drop
        this.attemptDrop(this.currentTouch, elementBelow);
        
        // Clear drop targets
        this.clearAllDropTargets();
        this.currentTouch = null;
    },
    
    handleMouseDown(e) {
        // Add enhanced mouse feedback for desktop users
        e.target.classList.add('dragging');
        
        const handleMouseUp = () => {
            e.target.classList.remove('dragging');
            document.removeEventListener('mouseup', handleMouseUp);
        };
        
        document.addEventListener('mouseup', handleMouseUp);
    },
    
    // Update visual drop targets
    updateDropTargets(elementBelow) {
        this.clearAllDropTargets();
        
        if (elementBelow) {
            const dropTarget = elementBelow.closest('[data-position], .bench-area, .jersey-area');
            if (dropTarget) {
                dropTarget.classList.add('drop-target');
            }
        }
    },
    
    // Clear all drop target highlights
    clearAllDropTargets() {
        document.querySelectorAll('.drop-target').forEach(el => {
            el.classList.remove('drop-target');
        });
    },
    
    // Attempt to drop element
    attemptDrop(draggedElement, dropTarget) {
        const playerName = draggedElement.dataset.player || 
                         draggedElement.querySelector('.player-name')?.textContent;
        
        if (!playerName || playerName === 'Tap to assign') return;
        
        const target = dropTarget?.closest('[data-position], .bench-area, .jersey-area');
        if (!target) return;
        
        // Use existing assignment logic
        if (target.dataset.position) {
            // Position assignment
            if (window.LineupManager) {
                LineupManager.assignPlayerToPosition(playerName, target.dataset.position);
                if (window.UIManager) UIManager.updateDisplay();
            }
        } else if (target.id === 'benchArea' || target.classList.contains('bench-area')) {
            // Bench assignment
            if (window.LineupManager) {
                LineupManager.addPlayerToBench(playerName);
                if (window.UIManager) UIManager.updateDisplay();
            }
        } else if (target.id === 'jerseyArea' || target.classList.contains('jersey-area')) {
            // Jersey assignment
            if (window.LineupManager) {
                LineupManager.addPlayerToJersey(playerName);
                if (window.UIManager) UIManager.updateDisplay();
            }
        }
    }
};

// Global functions for HTML event handlers
function toggleSidebarSection(sectionId) {
    ProgressiveDisclosure.toggleSidebarSection(sectionId);
}

function toggleMobileSection(sectionId) {
    ProgressiveDisclosure.toggleMobileSection(sectionId);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    ProgressiveDisclosure.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProgressiveDisclosure;
}