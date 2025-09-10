// Mobile Tap Assignment Module
// Handles tap-based position assignment for mobile scaled soccer field

const MobileTapAssignment = {
    // Track current state
    selectedPosition: null,
    playerSelectionModal: null,
    
    // Initialize tap assignment system
    init() {
        this.createPlayerSelectionModal();
        this.setupMobilePositionTapHandlers();
        this.setupMobileBenchTapHandlers();
        this.updateMobileScaledField();
    },
    
    // Create player selection modal
    createPlayerSelectionModal() {
        // Remove existing modal if it exists
        const existingModal = document.getElementById('mobilePlayerSelectionModal');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal structure
        const modal = document.createElement('div');
        modal.id = 'mobilePlayerSelectionModal';
        modal.className = 'mobile-player-modal';
        modal.innerHTML = `
            <div class="mobile-modal-backdrop" onclick="MobileTapAssignment.hidePlayerSelection()"></div>
            <div class="mobile-modal-content">
                <div class="mobile-modal-header">
                    <h3 id="modalPositionTitle">Select Player</h3>
                    <button class="mobile-modal-close" onclick="MobileTapAssignment.hidePlayerSelection()">×</button>
                </div>
                <div class="mobile-modal-body">
                    <div id="mobilePlayerList" class="mobile-player-selection-list"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        this.playerSelectionModal = modal;
    },
    
    // Setup tap handlers for mobile position slots
    setupMobilePositionTapHandlers() {
        // Handle taps on mobile position slots (both regular and scaled)
        document.addEventListener('click', (e) => {
            const positionSlot = e.target.closest('.mobile-position-slot, .mobile-position-slot-scaled');
            
            if (positionSlot && this.isMobileView()) {
                e.preventDefault();
                e.stopPropagation();
                this.handlePositionTap(positionSlot);
            }
        });
    },
    
    // Setup tap handlers for mobile bench areas
    setupMobileBenchTapHandlers() {
        document.addEventListener('click', (e) => {
            // Handle taps on mobile bench area
            const benchArea = e.target.closest('.mobile-bench-area');
            if (benchArea && this.isMobileView()) {
                e.preventDefault();
                e.stopPropagation();
                this.handleBenchAreaTap();
            }
            
            // Handle taps on mobile jersey area
            const jerseyArea = e.target.closest('.mobile-jersey-area');
            if (jerseyArea && this.isMobileView()) {
                e.preventDefault();
                e.stopPropagation();
                this.handleJerseyAreaTap();
            }
            
            // Handle taps on assigned players in bench/jersey
            const assignedPlayer = e.target.closest('.mobile-bench-player');
            if (assignedPlayer && this.isMobileView()) {
                e.preventDefault();
                e.stopPropagation();
                this.handleAssignedPlayerTap(assignedPlayer);
            }
        });
    },
    
    // Handle position slot tap
    handlePositionTap(positionSlot) {
        const position = positionSlot.dataset.position;
        if (!position) return;
        
        // Check for both naming conventions
        const playerNameElement = positionSlot.querySelector('.mobile-player-name, .mobile-player-name-scaled');
        const playerName = playerNameElement?.textContent?.trim();
        
        if (playerName && playerName !== 'Tap to assign' && playerName !== '') {
            // Position is occupied - show options to remove or replace
            this.showOccupiedPositionOptions(position, playerName);
        } else {
            // Position is empty - show player selection
            this.showPlayerSelection(position, 'position');
        }
    },
    
    // Handle bench area tap
    handleBenchAreaTap() {
        this.showPlayerSelection(null, 'bench');
    },
    
    // Handle jersey area tap
    handleJerseyAreaTap() {
        this.showPlayerSelection(null, 'jersey');
    },
    
    // Handle tap on assigned player in bench/jersey
    handleAssignedPlayerTap(playerElement) {
        const playerName = playerElement.textContent.replace(' (Jersey)', '').trim();
        if (playerName) {
            this.showAssignedPlayerOptions(playerName);
        }
    },
    
    // Show player selection modal
    showPlayerSelection(position, type) {
        this.selectedPosition = { position, type };
        
        // Update modal title
        const title = document.getElementById('modalPositionTitle');
        if (title) {
            if (type === 'position') {
                title.textContent = `Assign to ${position}`;
            } else if (type === 'bench') {
                title.textContent = 'Add to Bench';
            } else if (type === 'jersey') {
                title.textContent = 'Add to Jersey';
            }
        }
        
        // Populate player list
        this.populatePlayerList();
        
        // Show modal
        this.playerSelectionModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    // Show options for occupied position
    showOccupiedPositionOptions(position, playerName) {
        const modal = this.playerSelectionModal;
        const title = document.getElementById('modalPositionTitle');
        const body = document.getElementById('mobilePlayerList');
        
        if (title) title.textContent = `${position}: ${playerName}`;
        
        body.innerHTML = `
            <div class="mobile-occupied-position-options">
                <button class="mobile-option-button remove-option" onclick="MobileTapAssignment.removePlayerFromPosition('${position}', '${playerName}')">
                    <span class="option-icon">🗑️</span>
                    Remove ${playerName}
                </button>
                <button class="mobile-option-button replace-option" onclick="MobileTapAssignment.showPlayerSelection('${position}', 'position')">
                    <span class="option-icon">🔄</span>
                    Replace with another player
                </button>
                <button class="mobile-option-button bench-option" onclick="MobileTapAssignment.movePlayerToBench('${playerName}')">
                    <span class="option-icon">📋</span>
                    Move to Bench
                </button>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    // Show options for assigned player in bench/jersey
    showAssignedPlayerOptions(playerName) {
        const modal = this.playerSelectionModal;
        const title = document.getElementById('modalPositionTitle');
        const body = document.getElementById('mobilePlayerList');
        
        if (title) title.textContent = `Options for ${playerName}`;
        
        body.innerHTML = `
            <div class="mobile-assigned-player-options">
                <button class="mobile-option-button remove-option" onclick="MobileTapAssignment.removePlayerFromAll('${playerName}')">
                    <span class="option-icon">🗑️</span>
                    Remove from lineup
                </button>
                <button class="mobile-option-button position-option" onclick="MobileTapAssignment.showPositionSelection('${playerName}')">
                    <span class="option-icon">⚽</span>
                    Assign to field position
                </button>
            </div>
        `;
        
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    // Populate player list for selection
    populatePlayerList() {
        const list = document.getElementById('mobilePlayerList');
        if (!list) return;
        
        const playerNames = SoccerConfig.utils.getPlayerNames();
        let availablePlayers = playerNames.filter(name => {
            return !LineupManager.isPlayerAssigned(name);
        });
        
        // Always start with a clean slate
        list.innerHTML = '';
        
        // Filter by position preference if we're assigning to a specific position
        if (this.selectedPosition && this.selectedPosition.type === 'position' && this.selectedPosition.position) {
            const position = this.selectedPosition.position;
            availablePlayers = availablePlayers.filter(playerName => {
                return SoccerConfig.utils.canPlayerPlayPosition(playerName, position);
            });
            
            // If no preferred players are available, show all available players as fallback
            if (availablePlayers.length === 0) {
                availablePlayers = playerNames.filter(name => !LineupManager.isPlayerAssigned(name));
                // Add a note that these are not preferred players
                list.innerHTML = `
                    <div class="mobile-no-preferred-players">
                        <p>⚠️ No preferred players available</p>
                        <p class="mobile-no-players-hint">Showing all available players for ${this.selectedPosition.position}</p>
                    </div>
                    <div class="mobile-player-selection-divider"></div>
                `;
            }
        }
        
        if (availablePlayers.length === 0) {
            list.innerHTML = `
                <div class="mobile-no-players">
                    <p>No available players</p>
                    <p class="mobile-no-players-hint">All players are already assigned. Tap assigned players to move them.</p>
                </div>
            `;
            return;
        }
        
        // Sort players by preference (preferred first) and then by playing time
        const sortedPlayers = availablePlayers.sort((a, b) => {
            if (this.selectedPosition && this.selectedPosition.type === 'position') {
                const position = this.selectedPosition.position;
                const aCanPlay = SoccerConfig.utils.canPlayerPlayPosition(a, position);
                const bCanPlay = SoccerConfig.utils.canPlayerPlayPosition(b, position);
                
                // Preferred players first
                if (aCanPlay && !bCanPlay) return -1;
                if (!aCanPlay && bCanPlay) return 1;
            }
            
            // Then sort by playing time (less time first)
            const aStats = LineupManager.calculatePlayerStats(a);
            const bStats = LineupManager.calculatePlayerStats(b);
            return aStats.totalMinutes - bStats.totalMinutes;
        });
        
        const playerButtons = sortedPlayers.map(playerName => {
            const stats = LineupManager.calculatePlayerStats(playerName);
            const isPreferred = this.selectedPosition && this.selectedPosition.type === 'position' ? 
                SoccerConfig.utils.canPlayerPlayPosition(playerName, this.selectedPosition.position) : true;
            
            return `
                <button class="mobile-player-option ${isPreferred ? 'preferred' : 'non-preferred'}" onclick="MobileTapAssignment.assignPlayer('${playerName}')">
                    <div class="mobile-player-info">
                        <div class="mobile-player-name">
                            ${isPreferred ? '⭐ ' : ''}${playerName}
                        </div>
                        <div class="mobile-player-stats">${stats.totalMinutes}min played</div>
                    </div>
                </button>
            `;
        }).join('');
        
        // Append to existing content (if any, like warning messages)
        list.innerHTML += playerButtons;
    },
    
    // Show position selection for a player
    showPositionSelection(playerName) {
        const modal = this.playerSelectionModal;
        const title = document.getElementById('modalPositionTitle');
        const body = document.getElementById('mobilePlayerList');
        
        if (title) title.textContent = `Assign ${playerName} to position`;
        
        const availablePositions = SoccerConfig.positions.filter(pos => {
            const currentLineup = LineupManager.getCurrentLineup();
            return !currentLineup.positions[pos];
        });
        
        if (availablePositions.length === 0) {
            body.innerHTML = `
                <div class="mobile-no-positions">
                    <p>No available positions</p>
                    <p class="mobile-no-positions-hint">All positions are filled. Tap positions on the field to replace players.</p>
                </div>
            `;
            return;
        }
        
        const positionButtons = availablePositions.map(position => {
            return `
                <button class="mobile-position-option" onclick="MobileTapAssignment.assignPlayerToPosition('${playerName}', '${position}')">
                    <div class="mobile-position-info">
                        <div class="mobile-position-name">${position}</div>
                    </div>
                </button>
            `;
        }).join('');
        
        body.innerHTML = positionButtons;
    },
    
    // Assign player to selected position/area
    assignPlayer(playerName) {
        if (!this.selectedPosition) return;
        
        const { position, type } = this.selectedPosition;
        
        if (type === 'position' && position) {
            this.assignPlayerToPosition(playerName, position);
        } else if (type === 'bench') {
            this.movePlayerToBench(playerName);
        } else if (type === 'jersey') {
            this.movePlayerToJersey(playerName);
        }
    },
    
    // Assign player to position
    assignPlayerToPosition(playerName, position) {
        LineupManager.assignPlayerToPosition(playerName, position);
        this.updateDisplayAndHide();
    },
    
    // Move player to bench
    movePlayerToBench(playerName) {
        LineupManager.addPlayerToBench(playerName);
        this.updateDisplayAndHide();
    },
    
    // Move player to jersey
    movePlayerToJersey(playerName) {
        LineupManager.addPlayerToJersey(playerName);
        this.updateDisplayAndHide();
    },
    
    // Remove player from position
    removePlayerFromPosition(position, playerName) {
        LineupManager.removePlayerFromPosition(position);
        this.updateDisplayAndHide();
    },
    
    // Remove player from all assignments
    removePlayerFromAll(playerName) {
        LineupManager.removePlayerFromAll(playerName);
        this.updateDisplayAndHide();
    },
    
    // Update display and hide modal
    updateDisplayAndHide() {
        if (window.UIManager) {
            UIManager.updateDisplay();
        }
        this.updateMobileScaledField();
        this.hidePlayerSelection();
    },
    
    // Hide player selection modal
    hidePlayerSelection() {
        if (this.playerSelectionModal) {
            this.playerSelectionModal.style.display = 'none';
            document.body.style.overflow = '';
        }
        this.selectedPosition = null;
    },
    
    // Update mobile scaled field display
    updateMobileScaledField() {
        if (!this.isMobileView()) return;
        
        const currentLineup = LineupManager.getCurrentLineup();
        
        // Update position slots - check both regular and scaled versions
        SoccerConfig.positions.forEach(position => {
            const slot = document.querySelector(`.mobile-position-slot[data-position="${position}"], .mobile-position-slot-scaled[data-position="${position}"]`);
            if (!slot) return;
            
            const playerNameDiv = slot.querySelector('.mobile-player-name, .mobile-player-name-scaled');
            const positionLabel = slot.querySelector('.mobile-position-label, .mobile-position-label-scaled');
            
            if (!playerNameDiv) return;
            
            const playerName = currentLineup.positions[position];
            
            if (playerName) {
                // Check for substitution info
                const substitutedPlayer = LineupManager.getSubstitutionInfo(
                    LineupManager.getCurrentPeriod(), 
                    position
                );
                
                if (substitutedPlayer) {
                    playerNameDiv.innerHTML = `${playerName}<div class="mobile-substitution-info">(${substitutedPlayer})</div>`;
                } else {
                    playerNameDiv.textContent = playerName;
                }
                
                slot.classList.add('filled');
                if (positionLabel) positionLabel.style.fontSize = '0.5rem';
            } else {
                playerNameDiv.textContent = 'Tap to assign';
                slot.classList.remove('filled');
                if (positionLabel) positionLabel.style.fontSize = '0.6rem';
            }
        });
        
        // Update bench area
        this.updateMobileBenchArea();
    },
    
    // Update mobile bench area
    updateMobileBenchArea() {
        const currentLineup = LineupManager.getCurrentLineup();
        
        // Update bench
        const benchArea = document.querySelector('.mobile-bench-area .mobile-bench-players');
        if (benchArea) {
            const benchPlayers = currentLineup.bench || [];
            
            if (benchPlayers.length === 0) {
                benchArea.innerHTML = '<div class="mobile-bench-empty">Tap to add to bench</div>';
            } else {
                benchArea.innerHTML = benchPlayers.map(player => 
                    `<div class="mobile-bench-player">${player}</div>`
                ).join('');
            }
        }
        
        // Update jersey
        const jerseyArea = document.querySelector('.mobile-jersey-area .mobile-jersey-players');
        if (jerseyArea) {
            const jerseyPlayers = currentLineup.jersey || [];
            
            if (jerseyPlayers.length === 0) {
                jerseyArea.innerHTML = '<div class="mobile-jersey-empty">Tap to add jersey</div>';
            } else {
                jerseyArea.innerHTML = jerseyPlayers.map(player => 
                    `<div class="mobile-bench-player">${player} (Jersey)</div>`
                ).join('');
            }
        }
    },
    
    // Check if we're in mobile view
    isMobileView() {
        return window.innerWidth <= 768; // Increased to match standard mobile breakpoint
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    MobileTapAssignment.init();
});

// Update mobile field when UI updates
if (window.UIManager) {
    const originalUpdateDisplay = UIManager.updateDisplay;
    UIManager.updateDisplay = function() {
        originalUpdateDisplay.call(this);
        if (window.MobileTapAssignment) {
            MobileTapAssignment.updateMobileScaledField();
        }
    };
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileTapAssignment;
}