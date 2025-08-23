// Drag and Drop Module
// Handles all drag-and-drop interactions for player assignments

const DragDropManager = {
    // State tracking
    draggedPlayer: null,
    
    // Initialize drag and drop functionality
    init() {
        this.setupPlayerCardDragEvents();
        this.setupPositionDropEvents();
        this.setupBenchDropEvents();
        this.setupClickEvents();
    },

    // Setup drag events for player cards
    setupPlayerCardDragEvents() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('player-card')) {
                this.draggedPlayer = e.target.dataset.player;
                e.target.classList.add('dragging');
                
                // Set drag effect
                e.dataTransfer.effectAllowed = 'move';
                e.dataTransfer.setData('text/plain', this.draggedPlayer);
            }
        });

        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('player-card')) {
                e.target.classList.remove('dragging');
                this.draggedPlayer = null;
                this.clearAllDropFeedback();
            }
        });
    },

    // Setup drop events for position slots
    setupPositionDropEvents() {
        SoccerConfig.positions.forEach(position => {
            const slot = document.querySelector(`[data-position="${position}"]`);
            if (!slot) return;
            
            slot.addEventListener('dragover', (e) => {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
                
                if (this.draggedPlayer && this.canDropPlayerOnPosition(this.draggedPlayer, position)) {
                    UIManager.showDropFeedback(slot, true);
                }
            });

            slot.addEventListener('dragleave', (e) => {
                UIManager.showDropFeedback(slot, false);
            });

            slot.addEventListener('drop', (e) => {
                e.preventDefault();
                UIManager.showDropFeedback(slot, false);
                
                if (this.draggedPlayer && this.canDropPlayerOnPosition(this.draggedPlayer, position)) {
                    this.handlePositionDrop(this.draggedPlayer, position);
                }
            });
        });
    },

    // Setup drop events for bench areas
    setupBenchDropEvents() {
        this.setupBenchAreaDrop('benchArea', 'bench');
        this.setupBenchAreaDrop('jerseyArea', 'jersey');
    },

    setupBenchAreaDrop(areaId, benchType) {
        const area = document.getElementById(areaId);
        if (!area) return;

        area.addEventListener('dragover', (e) => {
            e.preventDefault();
            e.dataTransfer.dropEffect = 'move';
            UIManager.showDropFeedback(area, true);
        });

        area.addEventListener('dragleave', (e) => {
            UIManager.showDropFeedback(area, false);
        });

        area.addEventListener('drop', (e) => {
            e.preventDefault();
            UIManager.showDropFeedback(area, false);
            
            if (this.draggedPlayer) {
                this.handleBenchDrop(this.draggedPlayer, benchType);
            }
        });
    },

    // Setup click events for removing players
    setupClickEvents() {
        // Position slot click to remove player
        SoccerConfig.positions.forEach(position => {
            const slot = document.querySelector(`[data-position="${position}"]`);
            if (!slot) return;
            
            slot.addEventListener('click', () => {
                const currentLineup = LineupManager.getCurrentLineup();
                if (currentLineup.positions[position]) {
                    LineupManager.removePlayerFromPosition(position);
                    UIManager.updateDisplay();
                }
            });
        });
    },

    // Drop handlers
    handlePositionDrop(playerName, position) {
        if (LineupManager.assignPlayerToPosition(playerName, position)) {
            UIManager.updateDisplay();
            const posName = SoccerConfig.utils.getPositionAbbrev(position);
            ToastManager.success(`${playerName} assigned to ${posName}`, 3000);
        } else {
            const posName = SoccerConfig.utils.getPositionAbbrev(position);
            ToastManager.error(`${playerName} cannot play ${posName}`, 4000);
        }
    },

    handleBenchDrop(playerName, benchType) {
        try {
            if (benchType === 'bench') {
                LineupManager.addPlayerToBench(playerName);
                ToastManager.success(`${playerName} moved to bench`, 3000);
            } else if (benchType === 'jersey') {
                LineupManager.addPlayerToJersey(playerName);
                ToastManager.success(`${playerName} preparing jersey`, 3000);
            }
            UIManager.updateDisplay();
        } catch (error) {
            ToastManager.error(`Error assigning ${playerName}`, 4000);
        }
    },

    // Validation methods
    canDropPlayerOnPosition(playerName, position) {
        return SoccerConfig.utils.canPlayerPlayPosition(playerName, position);
    },

    // Utility methods
    clearAllDropFeedback() {
        // Clear position slots
        document.querySelectorAll('.position-slot').forEach(slot => {
            UIManager.showDropFeedback(slot, false);
        });

        // Clear bench areas
        document.querySelectorAll('.bench-area').forEach(area => {
            UIManager.showDropFeedback(area, false);
        });
    },

    // Visual feedback (deprecated - now using ToastManager)
    showFeedback(message, type = 'info') {
        // Legacy method - now using ToastManager for better UX
        switch(type) {
            case 'success':
                ToastManager.success(message, 3000);
                break;
            case 'error':
                ToastManager.error(message, 4000);
                break;
            case 'warning':
                ToastManager.warning(message, 4000);
                break;
            default:
                ToastManager.info(message, 3000);
        }
    },

    // Touch support for mobile devices
    setupTouchSupport() {
        let touchStartPlayer = null;
        let touchStartPosition = null;

        document.addEventListener('touchstart', (e) => {
            const playerCard = e.target.closest('.player-card');
            if (playerCard) {
                touchStartPlayer = playerCard.dataset.player;
                touchStartPosition = { x: e.touches[0].clientX, y: e.touches[0].clientY };
                playerCard.classList.add('dragging');
            }
        });

        document.addEventListener('touchmove', (e) => {
            if (touchStartPlayer) {
                e.preventDefault();
                // Visual feedback for touch drag
                const touch = e.touches[0];
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Clear previous feedback
                this.clearAllDropFeedback();
                
                // Show feedback for valid drop targets
                const positionSlot = elementBelow?.closest('.position-slot');
                const benchArea = elementBelow?.closest('.bench-area');
                
                if (positionSlot) {
                    const position = positionSlot.dataset.position;
                    if (this.canDropPlayerOnPosition(touchStartPlayer, position)) {
                        UIManager.showDropFeedback(positionSlot, true);
                    }
                } else if (benchArea) {
                    UIManager.showDropFeedback(benchArea, true);
                }
            }
        });

        document.addEventListener('touchend', (e) => {
            if (touchStartPlayer) {
                const touch = e.changedTouches[0];
                const elementBelow = document.elementFromPoint(touch.clientX, touch.clientY);
                
                // Handle drop
                const positionSlot = elementBelow?.closest('.position-slot');
                const benchArea = elementBelow?.closest('.bench-area');
                
                if (positionSlot) {
                    const position = positionSlot.dataset.position;
                    this.handlePositionDrop(touchStartPlayer, position);
                } else if (benchArea) {
                    const benchType = benchArea.id === 'jerseyArea' ? 'jersey' : 'bench';
                    this.handleBenchDrop(touchStartPlayer, benchType);
                }
                
                // Cleanup
                document.querySelectorAll('.player-card').forEach(card => {
                    card.classList.remove('dragging');
                });
                this.clearAllDropFeedback();
                touchStartPlayer = null;
                touchStartPosition = null;
            }
        });
    },

    // Enhanced drag feedback
    setupEnhancedDragFeedback() {
        document.addEventListener('dragover', (e) => {
            if (!this.draggedPlayer) return;
            
            const positionSlot = e.target.closest('.position-slot');
            const benchArea = e.target.closest('.bench-area');
            
            if (positionSlot) {
                const position = positionSlot.dataset.position;
                const canDrop = this.canDropPlayerOnPosition(this.draggedPlayer, position);
                
                if (canDrop) {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'move';
                } else {
                    e.dataTransfer.dropEffect = 'none';
                }
            } else if (benchArea) {
                e.preventDefault();
                e.dataTransfer.dropEffect = 'move';
            }
        });
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DragDropManager;
}