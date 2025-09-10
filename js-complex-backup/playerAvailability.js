// Player Availability Manager
// Handles player availability status (available, injured, absent, late)

const PlayerAvailability = {
    // Availability status types
    STATUS_TYPES: {
        AVAILABLE: 'available',
        INJURED: 'injured',
        ABSENT: 'absent',
        LATE: 'late'
    },

    // Status display information
    STATUS_INFO: {
        available: {
            label: 'Available',
            emoji: '✅',
            color: '#10b981',
            description: 'Ready to play'
        },
        injured: {
            label: 'Injured',
            emoji: '🤕',
            color: '#ef4444',
            description: 'Cannot play due to injury'
        },
        absent: {
            label: 'Absent',
            emoji: '❌',
            color: '#6b7280',
            description: 'Not present at game'
        },
        late: {
            label: 'Late',
            emoji: '⏰',
            color: '#f59e0b',
            description: 'Expected to arrive late'
        }
    },

    // Current game availability data
    currentGameAvailability: {},

    // Initialize availability system
    init() {
        this.loadGameAvailability();
        console.log('Player Availability system initialized');
    },

    // Set player availability status
    setPlayerAvailability(playerName, status, notes = '') {
        if (!this.STATUS_TYPES[status.toUpperCase()]) {
            console.error('Invalid availability status:', status);
            return false;
        }

        const currentGameId = this.getCurrentGameId();
        if (!currentGameId) {
            // Store in session storage if no current game
            this.currentGameAvailability[playerName] = {
                status: status.toLowerCase(),
                notes: notes.trim(),
                setAt: new Date().toISOString()
            };
            this.saveSessionAvailability();
        } else {
            // Store in persistent storage with game
            this.savePlayerAvailabilityToGame(currentGameId, playerName, status, notes);
        }

        // Trigger UI updates
        this.onAvailabilityChanged();
        
        return true;
    },

    // Get player availability status
    getPlayerAvailability(playerName) {
        const currentGameId = this.getCurrentGameId();
        
        if (currentGameId) {
            // Get from current game data
            const gameAvailability = this.getGameAvailability(currentGameId);
            if (gameAvailability && gameAvailability[playerName]) {
                return gameAvailability[playerName];
            }
        }
        
        // Get from session data or default to available
        return this.currentGameAvailability[playerName] || {
            status: this.STATUS_TYPES.AVAILABLE,
            notes: '',
            setAt: new Date().toISOString()
        };
    },

    // Check if player is available for selection
    isPlayerAvailable(playerName) {
        const availability = this.getPlayerAvailability(playerName);
        return availability.status === this.STATUS_TYPES.AVAILABLE;
    },

    // Check if player can be auto-assigned (available or late)
    canPlayerBeAutoAssigned(playerName) {
        const availability = this.getPlayerAvailability(playerName);
        return availability.status === this.STATUS_TYPES.AVAILABLE || 
               availability.status === this.STATUS_TYPES.LATE;
    },

    // Get all players by availability status
    getPlayersByStatus(status = null) {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const result = {};

        if (status) {
            result[status] = playerNames.filter(name => 
                this.getPlayerAvailability(name).status === status
            );
        } else {
            // Return all statuses
            Object.values(this.STATUS_TYPES).forEach(statusType => {
                result[statusType] = playerNames.filter(name => 
                    this.getPlayerAvailability(name).status === statusType
                );
            });
        }

        return result;
    },

    // Get availability summary
    getAvailabilitySummary() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const summary = {
            total: playerNames.length,
            available: 0,
            injured: 0,
            absent: 0,
            late: 0
        };

        playerNames.forEach(playerName => {
            const status = this.getPlayerAvailability(playerName).status;
            summary[status]++;
        });

        return summary;
    },

    // Reset all players to available
    resetAllToAvailable() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        playerNames.forEach(playerName => {
            this.setPlayerAvailability(playerName, this.STATUS_TYPES.AVAILABLE);
        });
        
        if (window.ToastManager) {
            ToastManager.show('All players set to available', 'success');
        }
    },

    // Clear availability for current session
    clearSessionAvailability() {
        this.currentGameAvailability = {};
        this.saveSessionAvailability();
        this.onAvailabilityChanged();
    },

    // Load availability from current game or session
    loadGameAvailability() {
        const currentGameId = this.getCurrentGameId();
        
        if (currentGameId) {
            // Load from game data
            const gameAvailability = this.getGameAvailability(currentGameId);
            if (gameAvailability) {
                this.currentGameAvailability = { ...gameAvailability };
                return;
            }
        }
        
        // Load from session storage
        try {
            const sessionData = sessionStorage.getItem('player_availability');
            if (sessionData) {
                this.currentGameAvailability = JSON.parse(sessionData);
            }
        } catch (error) {
            console.warn('Failed to load session availability:', error);
        }
    },

    // Save availability to session storage
    saveSessionAvailability() {
        try {
            sessionStorage.setItem('player_availability', 
                JSON.stringify(this.currentGameAvailability));
        } catch (error) {
            console.warn('Failed to save session availability:', error);
        }
    },

    // Get current game ID (from PersistentStorage if available)
    getCurrentGameId() {
        return window.PersistentStorage?.getCurrentGameId?.() || null;
    },

    // Get game availability data
    getGameAvailability(gameId) {
        if (!window.PersistentStorage) return null;
        
        const game = PersistentStorage.getGame(gameId);
        return game?.availability || null;
    },

    // Save player availability to specific game
    savePlayerAvailabilityToGame(gameId, playerName, status, notes) {
        if (!window.PersistentStorage) return false;
        
        const game = PersistentStorage.getGame(gameId);
        if (!game) return false;

        if (!game.availability) {
            game.availability = {};
        }

        game.availability[playerName] = {
            status: status.toLowerCase(),
            notes: notes.trim(),
            setAt: new Date().toISOString()
        };

        // Update the game in storage
        PersistentStorage.updateGame(gameId, { availability: game.availability });
        return true;
    },

    // Handle availability change events
    onAvailabilityChanged() {
        // Update UI displays
        if (window.UIManager) {
            UIManager.renderPlayerList();
            UIManager.updateDisplay();
        }

        // Update mobile UI if available
        if (window.MobileUIManager) {
            MobileUIManager.updateMobileDisplay();
        }

        // Trigger custom event for other components
        document.dispatchEvent(new CustomEvent('playerAvailabilityChanged', {
            detail: this.getAvailabilitySummary()
        }));
    },

    // Get status display info
    getStatusDisplayInfo(status) {
        return this.STATUS_INFO[status] || this.STATUS_INFO.available;
    },

    // Export availability data
    exportAvailabilityData() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const data = playerNames.map(playerName => {
            const availability = this.getPlayerAvailability(playerName);
            return {
                player: playerName,
                status: availability.status,
                notes: availability.notes,
                setAt: availability.setAt
            };
        });

        return {
            gameId: this.getCurrentGameId(),
            exportedAt: new Date().toISOString(),
            players: data,
            summary: this.getAvailabilitySummary()
        };
    },

    // Import availability data
    importAvailabilityData(data) {
        if (!data.players || !Array.isArray(data.players)) {
            throw new Error('Invalid availability data format');
        }

        let imported = 0;
        data.players.forEach(playerData => {
            if (playerData.player && playerData.status) {
                this.setPlayerAvailability(
                    playerData.player, 
                    playerData.status, 
                    playerData.notes || ''
                );
                imported++;
            }
        });

        if (window.ToastManager) {
            ToastManager.show(`Imported availability for ${imported} players`, 'success');
        }

        return imported;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PlayerAvailability;
}