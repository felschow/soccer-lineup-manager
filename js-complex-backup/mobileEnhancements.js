// Mobile Enhancements Module
// Provides enhanced touch support, gestures, and mobile-specific features

const MobileEnhancements = {
    // Touch state tracking
    touchState: {
        startX: 0,
        startY: 0,
        startTime: 0,
        draggedPlayer: null,
        initialTarget: null,
        isDragging: false,
        dragThreshold: 10,
        longPressTimer: null,
        longPressThreshold: 500
    },

    // Initialize mobile enhancements
    init() {
        this.setupTouchEvents();
        this.setupSwipeNavigation();
        this.setupHapticFeedback();
        this.optimizeForMobile();
        console.log('Mobile enhancements initialized');
    },

    // Setup enhanced touch events for drag and drop
    setupTouchEvents() {
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });
        document.addEventListener('touchcancel', (e) => this.handleTouchCancel(e));
    },

    // Handle touch start
    handleTouchStart(e) {
        const touch = e.touches[0];
        const playerCard = e.target.closest('.player-card');
        
        if (playerCard) {
            // Prevent default to avoid scrolling
            e.preventDefault();
            
            this.touchState = {
                startX: touch.clientX,
                startY: touch.clientY,
                startTime: Date.now(),
                draggedPlayer: playerCard.dataset.player,
                initialTarget: playerCard,
                isDragging: false
            };

            // Start long press timer for haptic feedback
            this.touchState.longPressTimer = setTimeout(() => {
                this.triggerHapticFeedback('light');
                playerCard.classList.add('drag-ghost');
                this.touchState.isDragging = true;
                
                // Show toast hint for first-time users
                this.showDragHint();
            }, this.touchState.longPressThreshold);

            // Visual feedback
            playerCard.style.transform = 'scale(1.02)';
            playerCard.style.transition = 'transform 0.1s ease';
        }
    },

    // Handle touch move
    handleTouchMove(e) {
        if (!this.touchState.draggedPlayer) return;
        
        const touch = e.touches[0];
        const deltaX = Math.abs(touch.clientX - this.touchState.startX);
        const deltaY = Math.abs(touch.clientY - this.touchState.startY);
        
        // Check if we've moved enough to start dragging
        if (!this.touchState.isDragging && 
            (deltaX > this.touchState.dragThreshold || deltaY > this.touchState.dragThreshold)) {
            
            clearTimeout(this.touchState.longPressTimer);
            this.touchState.isDragging = true;
            this.touchState.initialTarget.classList.add('drag-ghost');
        }

        if (this.touchState.isDragging) {
            e.preventDefault();
            
            // Find element under touch point
            const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
            this.updateDropPreview(elementBelow);
            
            // Visual feedback for drag position
            this.showDragPosition(touch.clientX, touch.clientY);
        }
    },

    // Handle touch end
    handleTouchEnd(e) {
        if (!this.touchState.draggedPlayer) return;
        
        clearTimeout(this.touchState.longPressTimer);
        
        const touch = e.changedTouches[0];
        const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
        
        if (this.touchState.isDragging) {
            // Perform drop operation
            this.performTouchDrop(elementBelow);
            
            // Haptic feedback for drop
            this.triggerHapticFeedback('medium');
        } else {
            // Short tap - show player info or quick actions
            this.handlePlayerTap(this.touchState.draggedPlayer);
        }

        // Cleanup
        this.cleanupTouchState();
    },

    // Handle touch cancel
    handleTouchCancel(e) {
        clearTimeout(this.touchState.longPressTimer);
        this.cleanupTouchState();
    },

    // Update drop preview during drag
    updateDropPreview(element) {
        // Clear previous previews
        document.querySelectorAll('.drop-preview, .invalid-drop').forEach(el => {
            el.classList.remove('drop-preview', 'invalid-drop');
        });

        if (!element) return;

        const positionSlot = element.closest('.position-slot');
        const benchArea = element.closest('.bench-area');

        if (positionSlot) {
            const position = positionSlot.dataset.position;
            const canDrop = SoccerConfig.utils.canPlayerPlayPosition(this.touchState.draggedPlayer, position);
            positionSlot.classList.add(canDrop ? 'drop-preview' : 'invalid-drop');
        } else if (benchArea) {
            benchArea.classList.add('drop-preview');
        }
    },

    // Show drag position visually
    showDragPosition(x, y) {
        let dragIndicator = document.getElementById('dragIndicator');
        
        if (!dragIndicator) {
            dragIndicator = document.createElement('div');
            dragIndicator.id = 'dragIndicator';
            dragIndicator.style.cssText = `
                position: fixed;
                width: 60px;
                height: 40px;
                background: rgba(59, 130, 246, 0.9);
                border-radius: 8px;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 12px;
                color: white;
                pointer-events: none;
                z-index: 10000;
                transform: translate(-50%, -100%);
            `;
            document.body.appendChild(dragIndicator);
        }
        
        dragIndicator.textContent = this.touchState.draggedPlayer.substring(0, 6);
        dragIndicator.style.left = x + 'px';
        dragIndicator.style.top = (y - 10) + 'px';
        dragIndicator.style.display = 'flex';
    },

    // Perform drop operation on touch end
    performTouchDrop(element) {
        const positionSlot = element?.closest('.position-slot');
        const benchArea = element?.closest('.bench-area');

        if (positionSlot) {
            const position = positionSlot.dataset.position;
            if (SoccerConfig.utils.canPlayerPlayPosition(this.touchState.draggedPlayer, position)) {
                const success = LineupManager.assignPlayerToPosition(this.touchState.draggedPlayer, position);
                if (success) {
                    ToastManager.success(`${this.touchState.draggedPlayer} assigned to ${SoccerConfig.utils.getPositionAbbrev(position)}`, 3000);
                    UIManager.updateDisplay();
                }
            } else {
                ToastManager.warning(`${this.touchState.draggedPlayer} cannot play ${SoccerConfig.utils.getPositionAbbrev(position)}`, 4000);
                this.triggerHapticFeedback('error');
            }
        } else if (benchArea) {
            const benchType = benchArea.id === 'jerseyArea' ? 'jersey' : 'bench';
            if (benchType === 'bench') {
                LineupManager.addPlayerToBench(this.touchState.draggedPlayer);
                ToastManager.success(`${this.touchState.draggedPlayer} moved to bench`, 3000);
            } else {
                LineupManager.addPlayerToJersey(this.touchState.draggedPlayer);
                ToastManager.success(`${this.touchState.draggedPlayer} preparing jersey`, 3000);
            }
            UIManager.updateDisplay();
        } else {
            // No valid drop target
            this.triggerHapticFeedback('error');
            ToastManager.info('Drop on a position or bench area', 3000);
        }
    },

    // Handle player tap for quick actions
    handlePlayerTap(playerName) {
        const assignment = LineupManager.getPlayerAssignment(playerName);
        const stats = LineupManager.calculatePlayerStats(playerName);
        
        // Show quick info toast
        let message = `${playerName}: ${stats.totalMinutes} min`;
        if (assignment.type === 'position') {
            message += ` (${SoccerConfig.utils.getPositionAbbrev(assignment.value)})`;
        } else if (assignment.type === 'bench') {
            message += ' (Bench)';
        } else if (assignment.type === 'jersey') {
            message += ' (Jersey)';
        }
        
        ToastManager.info(message, 3000);
    },

    // Show drag hint for new users
    showDragHint() {
        const hasShownHint = localStorage.getItem('soccerDragHintShown');
        if (!hasShownHint) {
            ToastManager.info('Hold and drag players to positions or bench', 4000);
            localStorage.setItem('soccerDragHintShown', 'true');
        }
    },

    // Cleanup touch state
    cleanupTouchState() {
        // Remove visual feedback
        document.querySelectorAll('.drag-ghost').forEach(el => {
            el.classList.remove('drag-ghost');
            el.style.transform = '';
            el.style.transition = '';
        });

        // Remove drop previews
        document.querySelectorAll('.drop-preview, .invalid-drop').forEach(el => {
            el.classList.remove('drop-preview', 'invalid-drop');
        });

        // Remove drag indicator
        const dragIndicator = document.getElementById('dragIndicator');
        if (dragIndicator) {
            dragIndicator.style.display = 'none';
        }

        // Reset touch state
        this.touchState = {
            startX: 0,
            startY: 0,
            startTime: 0,
            draggedPlayer: null,
            initialTarget: null,
            isDragging: false
        };
    },

    // Setup swipe navigation for periods
    setupSwipeNavigation() {
        const fieldContainer = document.getElementById('fieldView');
        if (!fieldContainer) return;

        let swipeState = {
            startX: 0,
            startY: 0,
            minSwipeDistance: 50
        };

        fieldContainer.addEventListener('touchstart', (e) => {
            if (e.target.closest('.player-card') || e.target.closest('.position-slot') || e.target.closest('.bench-area')) {
                return; // Don't interfere with drag operations
            }
            
            const touch = e.touches[0];
            swipeState.startX = touch.clientX;
            swipeState.startY = touch.clientY;
        }, { passive: true });

        fieldContainer.addEventListener('touchend', (e) => {
            if (e.target.closest('.player-card') || e.target.closest('.position-slot') || e.target.closest('.bench-area')) {
                return;
            }

            const touch = e.changedTouches[0];
            const deltaX = touch.clientX - swipeState.startX;
            const deltaY = Math.abs(touch.clientY - swipeState.startY);
            
            // Only process horizontal swipes
            if (Math.abs(deltaX) > swipeState.minSwipeDistance && deltaY < 100) {
                if (deltaX > 0) {
                    // Swipe right - previous period
                    if (LineupManager.previousPeriod()) {
                        UIManager.updateDisplay();
                        this.triggerHapticFeedback('light');
                        ToastManager.info(`Period ${LineupManager.getCurrentPeriod()}`, 2000);
                    }
                } else {
                    // Swipe left - next period
                    if (LineupManager.nextPeriod()) {
                        UIManager.updateDisplay();
                        this.triggerHapticFeedback('light');
                        ToastManager.info(`Period ${LineupManager.getCurrentPeriod()}`, 2000);
                    }
                }
            }
        }, { passive: true });
    },

    // Setup haptic feedback (if available)
    setupHapticFeedback() {
        this.hapticSupported = 'vibrate' in navigator || 
                              ('hapticFeedback' in navigator) ||
                              (window.DeviceMotionEvent !== undefined);
        
        if (this.hapticSupported) {
            console.log('Haptic feedback available');
        }
    },

    // Trigger haptic feedback
    triggerHapticFeedback(type = 'light') {
        if (!this.hapticSupported) return;

        try {
            // Different patterns for different feedback types
            const patterns = {
                light: [10],
                medium: [20],
                heavy: [50],
                error: [100, 50, 100],
                success: [20, 10, 20]
            };

            if (navigator.vibrate) {
                navigator.vibrate(patterns[type] || patterns.light);
            }
        } catch (error) {
            // Silently fail if haptic feedback isn't available
        }
    },

    // Mobile-specific optimizations
    optimizeForMobile() {
        // Prevent zoom on double tap
        let lastTouchEnd = 0;
        document.addEventListener('touchend', (e) => {
            const now = Date.now();
            if (now - lastTouchEnd <= 300) {
                e.preventDefault();
            }
            lastTouchEnd = now;
        }, false);

        // Optimize viewport for mobile
        this.optimizeViewport();

        // Add mobile-specific CSS classes
        document.body.classList.add('mobile-optimized');

        // Improve touch targets on mobile
        this.improveTouchTargets();
    },

    // Optimize viewport settings
    optimizeViewport() {
        let viewport = document.querySelector('meta[name="viewport"]');
        if (!viewport) {
            viewport = document.createElement('meta');
            viewport.name = 'viewport';
            document.head.appendChild(viewport);
        }
        
        viewport.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    },

    // Improve touch targets for mobile
    improveTouchTargets() {
        // Add CSS for better touch targets
        const style = document.createElement('style');
        style.textContent = `
            @media (max-width: 768px) {
                .player-card {
                    min-height: 44px;
                    touch-action: none;
                }
                
                .position-slot {
                    min-width: 44px;
                    min-height: 44px;
                }
                
                .btn, .history-btn {
                    min-height: 44px;
                    padding: 12px 16px;
                }
                
                .toast {
                    user-select: none;
                    -webkit-user-select: none;
                }
            }
        `;
        document.head.appendChild(style);
    },

    // Add pull-to-refresh functionality
    setupPullToRefresh() {
        let pullToRefreshState = {
            startY: 0,
            currentY: 0,
            pulling: false,
            threshold: 80
        };

        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                pullToRefreshState.startY = e.touches[0].clientY;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (window.scrollY === 0 && pullToRefreshState.startY > 0) {
                pullToRefreshState.currentY = e.touches[0].clientY;
                const pullDistance = pullToRefreshState.currentY - pullToRefreshState.startY;
                
                if (pullDistance > 0 && pullDistance < pullToRefreshState.threshold) {
                    pullToRefreshState.pulling = true;
                    // Visual feedback for pull
                    document.body.style.transform = `translateY(${pullDistance * 0.5}px)`;
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            if (pullToRefreshState.pulling) {
                const pullDistance = pullToRefreshState.currentY - pullToRefreshState.startY;
                
                if (pullDistance >= pullToRefreshState.threshold) {
                    // Trigger refresh
                    this.performPullRefresh();
                }
                
                // Reset state
                document.body.style.transform = '';
                pullToRefreshState = { startY: 0, currentY: 0, pulling: false, threshold: 80 };
            }
        });
    },

    // Perform pull to refresh action
    performPullRefresh() {
        this.triggerHapticFeedback('light');
        ToastManager.info('Refreshing lineup...', 2000);
        
        // Refresh the display
        UIManager.updateDisplay();
        
        // Show completion feedback
        setTimeout(() => {
            ToastManager.success('Lineup refreshed', 2000);
        }, 500);
    },

    // Add voice feedback for accessibility
    announceAction(message) {
        if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(message);
            utterance.volume = 0.1;
            utterance.rate = 1.2;
            speechSynthesis.speak(utterance);
        }
    },

    // Get device orientation
    getDeviceOrientation() {
        return window.innerHeight > window.innerWidth ? 'portrait' : 'landscape';
    },

    // Handle orientation change
    handleOrientationChange() {
        setTimeout(() => {
            UIManager.updateDisplay();
            ToastManager.info(`Switched to ${this.getDeviceOrientation()} mode`, 2000);
        }, 100);
    }
};

// Add orientation change listener
window.addEventListener('orientationchange', () => {
    MobileEnhancements.handleOrientationChange();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileEnhancements;
}