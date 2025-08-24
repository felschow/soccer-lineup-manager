// Enhanced Mobile UI Manager
// Handles mobile-specific interface updates and interactions

const MobileUIManager = {
    isMobile: false,
    
    init() {
        this.detectMobile();
        this.setupMobileUI();
        this.setupMobileInteractions();
        this.setupPullToRefresh();
        console.log('Mobile UI Manager initialized');
    },
    
    detectMobile() {
        this.isMobile = window.innerWidth <= 768;
        
        // Update on resize
        window.addEventListener('resize', () => {
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth <= 768;
            
            if (wasMobile !== this.isMobile) {
                this.updateUIForViewport();
            }
        });
    },
    
    updateUIForViewport() {
        if (this.isMobile) {
            this.enableMobileMode();
        } else {
            this.enableDesktopMode();
        }
    },
    
    enableMobileMode() {
        document.body.classList.add('mobile-mode');
        this.updateMobileDisplay();
        this.setupMobileDragDrop();
    },
    
    enableDesktopMode() {
        document.body.classList.remove('mobile-mode');
    },
    
    setupMobileUI() {
        if (!this.isMobile) return;
        
        // Create mobile player cards
        this.createMobilePlayerCards();
        
        // Setup mobile position assignments
        this.setupMobilePositionTaps();
        
        // Add haptic feedback to all interactions
        this.addHapticFeedback();
    },
    
    createMobilePlayerCards() {
        const playerList = document.getElementById('playerList');
        if (!playerList) return;
        
        // Replace existing player cards with mobile-optimized ones
        const players = SoccerConfig.utils.getPlayerNames();
        
        playerList.innerHTML = players.map(player => `
            <div class="mobile-player-card" 
                 data-player="${player}"
                 draggable="true"
                 onclick="selectMobilePlayer('${player}')">
                ${player}
                <span class="mobile-player-positions">${this.getPlayerPositionsText(player)}</span>
            </div>
        `).join('');
    },
    
    getPlayerPositionsText(player) {
        const positions = SoccerConfig.players[player] || [];
        if (positions.includes('All')) return 'All positions';
        if (positions.includes('All except GK')) return 'Field positions';
        return positions.join(', ');
    },
    
    setupMobilePositionTaps() {
        document.querySelectorAll('.mobile-position-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const position = card.dataset.position;
                this.showPlayerSelectionModal(position);
            });
        });
    },
    
    showPlayerSelectionModal(position) {
        const modal = this.createPlayerSelectionModal(position);
        document.body.appendChild(modal);
        
        // Add haptic feedback
        this.triggerHaptic('medium');
        
        // Auto-remove after selection or timeout
        setTimeout(() => {
            if (modal.parentNode) {
                modal.remove();
            }
        }, 10000);
    },
    
    createPlayerSelectionModal(position) {
        const availablePlayers = this.getAvailablePlayersForPosition(position);
        
        const modal = document.createElement('div');
        modal.className = 'mobile-selection-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentNode.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Select Player for ${this.getPositionDisplayName(position)}</h3>
                    <button class="modal-close" onclick="this.closest('.mobile-selection-modal').remove()">×</button>
                </div>
                <div class="modal-body">
                    ${availablePlayers.map(player => `
                        <button class="modal-player-option" 
                                onclick="assignPlayerToPosition('${player}', '${position}'); this.closest('.mobile-selection-modal').remove();">
                            ${player}
                        </button>
                    `).join('')}
                    ${availablePlayers.length === 0 ? '<p class="no-players">No available players for this position</p>' : ''}
                </div>
            </div>
        `;
        
        return modal;
    },
    
    getAvailablePlayersForPosition(position) {
        const allPlayers = SoccerConfig.utils.getPlayerNames();
        const currentLineup = LineupManager.getCurrentLineup();
        const assignedPlayers = new Set();
        
        // Add currently assigned players
        Object.values(currentLineup.positions).forEach(player => {
            if (player) assignedPlayers.add(player);
        });
        currentLineup.bench.forEach(player => assignedPlayers.add(player));
        if (currentLineup.jersey) {
            currentLineup.jersey.forEach(player => assignedPlayers.add(player));
        }
        
        return allPlayers.filter(player => 
            !assignedPlayers.has(player) && 
            SoccerConfig.utils.canPlayerPlayPosition(player, position)
        );
    },
    
    getPositionDisplayName(position) {
        const names = {
            'goalkeeper': 'Goalkeeper',
            'left-back': 'Left Back',
            'center-back': 'Center Back', 
            'right-back': 'Right Back',
            'center-mid-left': 'Center Mid Left',
            'center-mid-right': 'Center Mid Right',
            'left-wing': 'Left Wing',
            'striker': 'Striker',
            'right-wing': 'Right Wing',
            'bench-1': 'Bench #1',
            'bench-2': 'Bench #2',
            'bench-3': 'Bench #3',
            'jersey-1': 'Jersey Prep'
        };
        return names[position] || position;
    },
    
    updateMobileDisplay() {
        if (!this.isMobile) return;
        
        const currentLineup = LineupManager.getCurrentLineup();
        const currentPeriod = LineupManager.getCurrentPeriod();
        
        // Update mobile period display
        const periodTitle = document.getElementById('mobilePeriodTitle');
        const periodTime = document.getElementById('mobilePeriodTime');
        
        if (periodTitle) {
            periodTitle.textContent = `Period ${currentPeriod}`;
        }
        
        if (periodTime) {
            const timeInfo = SoccerConfig.utils.getPeriodTime(currentPeriod);
            periodTime.textContent = timeInfo.display;
        }
        
        // Update mobile position cards
        SoccerConfig.positions.forEach(position => {
            const element = document.getElementById(`mobile-${position}`);
            const player = currentLineup.positions[position];
            
            if (element) {
                element.textContent = player || 'Tap to assign';
                element.closest('.mobile-position-card').classList.toggle('filled', !!player);
            }
        });
        
        // Update bench
        for (let i = 1; i <= 3; i++) {
            const element = document.getElementById(`mobile-bench-${i}`);
            const player = currentLineup.bench[i - 1];
            
            if (element) {
                element.textContent = player || 'Tap to assign';
                element.closest('.mobile-position-card').classList.toggle('filled', !!player);
            }
        }
        
        // Update jersey
        const jerseyElement = document.getElementById('mobile-jersey-1');
        const jerseyPlayer = currentLineup.jersey && currentLineup.jersey[0];
        
        if (jerseyElement) {
            jerseyElement.textContent = jerseyPlayer || 'Tap to assign';
            jerseyElement.closest('.mobile-position-card').classList.toggle('filled', !!jerseyPlayer);
        }
    },
    
    setupMobileDragDrop() {
        // Enhanced drag and drop for mobile
        let draggedPlayer = null;
        let dragStartPos = { x: 0, y: 0 };
        
        document.addEventListener('touchstart', (e) => {
            const playerCard = e.target.closest('.mobile-player-card');
            if (playerCard) {
                draggedPlayer = playerCard.dataset.player;
                const touch = e.touches[0];
                dragStartPos = { x: touch.clientX, y: touch.clientY };
                
                // Visual feedback
                playerCard.classList.add('dragging');
                this.triggerHaptic('light');
            }
        }, { passive: false });
        
        document.addEventListener('touchmove', (e) => {
            if (draggedPlayer) {
                e.preventDefault();
                const touch = e.touches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Highlight valid drop zones
                document.querySelectorAll('.mobile-position-card').forEach(card => {
                    card.classList.remove('drop-hover');
                });
                
                const positionCard = element?.closest('.mobile-position-card');
                if (positionCard && this.canDropOnPosition(draggedPlayer, positionCard.dataset.position)) {
                    positionCard.classList.add('drop-hover');
                }
            }
        }, { passive: false });
        
        document.addEventListener('touchend', (e) => {
            if (draggedPlayer) {
                const touch = e.changedTouches[0];
                const element = document.elementFromPoint(touch.clientX, touch.clientY);
                const positionCard = element?.closest('.mobile-position-card');
                
                if (positionCard && this.canDropOnPosition(draggedPlayer, positionCard.dataset.position)) {
                    const position = positionCard.dataset.position;
                    this.assignPlayerToMobilePosition(draggedPlayer, position);
                    this.triggerHaptic('success');
                } else {
                    this.triggerHaptic('error');
                }
                
                // Clean up
                document.querySelectorAll('.mobile-player-card').forEach(card => {
                    card.classList.remove('dragging');
                });
                document.querySelectorAll('.mobile-position-card').forEach(card => {
                    card.classList.remove('drop-hover');
                });
                
                draggedPlayer = null;
            }
        });
    },
    
    canDropOnPosition(player, position) {
        if (position.startsWith('bench-') || position === 'jersey-1') {
            return true; // Anyone can sit on bench or do jersey prep
        }
        return SoccerConfig.utils.canPlayerPlayPosition(player, position);
    },
    
    assignPlayerToMobilePosition(player, position) {
        if (position.startsWith('bench-')) {
            const benchIndex = parseInt(position.split('-')[1]) - 1;
            LineupManager.addPlayerToBench(player, benchIndex);
        } else if (position === 'jersey-1') {
            LineupManager.assignPlayerToJersey(player);
        } else {
            LineupManager.assignPlayerToPosition(player, position);
        }
        
        this.updateMobileDisplay();
        UIManager.updateDisplay(); // Update desktop view too
    },
    
    setupPullToRefresh() {
        let startY = 0;
        let isPulling = false;
        let pullDistance = 0;
        const pullThreshold = 100;
        
        document.addEventListener('touchstart', (e) => {
            if (window.scrollY === 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        });
        
        document.addEventListener('touchmove', (e) => {
            if (isPulling && window.scrollY === 0) {
                const currentY = e.touches[0].clientY;
                pullDistance = currentY - startY;
                
                if (pullDistance > 0) {
                    e.preventDefault();
                    
                    // Visual feedback
                    const pullIndicator = this.getPullIndicator();
                    const progress = Math.min(pullDistance / pullThreshold, 1);
                    pullIndicator.style.transform = `translateY(${Math.min(pullDistance * 0.5, 50)}px)`;
                    pullIndicator.style.opacity = progress;
                    
                    if (pullDistance > pullThreshold) {
                        pullIndicator.textContent = '🔄 Release to refresh';
                        this.triggerHaptic('medium');
                    } else {
                        pullIndicator.textContent = '⬇️ Pull to refresh';
                    }
                }
            }
        });
        
        document.addEventListener('touchend', () => {
            if (isPulling) {
                const pullIndicator = this.getPullIndicator();
                
                if (pullDistance > pullThreshold) {
                    this.performPullRefresh();
                }
                
                // Reset
                pullIndicator.style.transform = 'translateY(-100px)';
                pullIndicator.style.opacity = '0';
                isPulling = false;
                pullDistance = 0;
            }
        });
    },
    
    getPullIndicator() {
        let indicator = document.getElementById('pullIndicator');
        if (!indicator) {
            indicator = document.createElement('div');
            indicator.id = 'pullIndicator';
            indicator.className = 'pull-refresh-indicator';
            indicator.textContent = '⬇️ Pull to refresh';
            document.body.appendChild(indicator);
        }
        return indicator;
    },
    
    performPullRefresh() {
        // Clear current period and update display
        LineupManager.clearCurrentPeriod();
        this.updateMobileDisplay();
        UIManager.updateDisplay();
        
        this.triggerHaptic('success');
        ToastManager.success('Period cleared!', 2000);
    },
    
    addHapticFeedback() {
        // Add haptic feedback to all clickable elements
        document.addEventListener('click', (e) => {
            if (e.target.closest('.mobile-nav-button, .mobile-action-button, .mobile-position-card, .mobile-player-card')) {
                this.triggerHaptic('light');
            }
        });
    },
    
    triggerHaptic(type) {
        if (!navigator.vibrate || !this.isMobile) return;
        
        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 10, 10],
            error: [50, 20, 50]
        };
        
        navigator.vibrate(patterns[type] || patterns.light);
    }
};

// Global functions for mobile
window.selectMobilePlayer = function(player) {
    // This can be enhanced to show a context menu
    console.log('Selected player:', player);
};

window.assignPlayerToPosition = function(player, position) {
    MobileUIManager.assignPlayerToMobilePosition(player, position);
};

// Auto-initialize if mobile
if (window.innerWidth <= 768) {
    document.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            MobileUIManager.init();
        }, 100);
    });
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileUIManager;
}