// Lineup Management Module
// Handles the core game logic, lineup state, and player assignments

const LineupManager = {
    // Current state
    currentPeriod: 1,
    lineup: {},

    // Initialize lineup structure
    init() {
        this.initializeLineup();
    },

    // Create empty lineup structure for all periods
    initializeLineup() {
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            this.lineup[period] = {
                positions: {},
                bench: [], // Regular sitting players
                jersey: [] // Players sitting to prepare for goalkeeper duty
            };
            SoccerConfig.positions.forEach(pos => {
                this.lineup[period].positions[pos] = null;
            });
        }
    },

    // Player assignment methods
    assignPlayerToPosition(playerName, position) {
        if (!SoccerConfig.utils.canPlayerPlayPosition(playerName, position)) {
            console.warn(`${playerName} cannot play ${position}`);
            return false;
        }

        // Remove player from current assignments
        this.removePlayerFromAll(playerName);
        
        // Assign to new position
        this.lineup[this.currentPeriod].positions[position] = playerName;
        return true;
    },

    removePlayerFromPosition(position) {
        this.lineup[this.currentPeriod].positions[position] = null;
    },

    addPlayerToBench(playerName) {
        // Remove from current assignments
        this.removePlayerFromAll(playerName);
        
        // Add to bench
        if (!this.lineup[this.currentPeriod].bench.includes(playerName)) {
            this.lineup[this.currentPeriod].bench.push(playerName);
        }
    },

    addPlayerToJersey(playerName) {
        // Remove from current assignments
        this.removePlayerFromAll(playerName);
        
        // Add to jersey preparation
        if (!this.lineup[this.currentPeriod].jersey) {
            this.lineup[this.currentPeriod].jersey = [];
        }
        if (!this.lineup[this.currentPeriod].jersey.includes(playerName)) {
            this.lineup[this.currentPeriod].jersey.push(playerName);
        }
    },

    removePlayerFromAll(playerName) {
        const currentData = this.lineup[this.currentPeriod];
        
        // Remove from positions
        SoccerConfig.positions.forEach(pos => {
            if (currentData.positions[pos] === playerName) {
                currentData.positions[pos] = null;
            }
        });
        
        // Remove from bench
        currentData.bench = currentData.bench.filter(p => p !== playerName);
        
        // Remove from jersey
        if (currentData.jersey) {
            currentData.jersey = currentData.jersey.filter(p => p !== playerName);
        }
    },

    // Period navigation
    setCurrentPeriod(period) {
        if (period >= 1 && period <= SoccerConfig.gameSettings.totalPeriods) {
            this.currentPeriod = period;
            return true;
        }
        return false;
    },

    getCurrentPeriod() {
        return this.currentPeriod;
    },

    nextPeriod() {
        if (this.currentPeriod < SoccerConfig.gameSettings.totalPeriods) {
            this.currentPeriod++;
            return true;
        }
        return false;
    },

    previousPeriod() {
        if (this.currentPeriod > 1) {
            this.currentPeriod--;
            return true;
        }
        return false;
    },

    // Clear operations
    clearCurrentPeriod() {
        const currentData = this.lineup[this.currentPeriod];
        
        // Clear all positions
        SoccerConfig.positions.forEach(pos => {
            currentData.positions[pos] = null;
        });
        
        // Clear bench and jersey
        currentData.bench = [];
        currentData.jersey = [];
    },

    clearAllPeriods() {
        this.initializeLineup();
    },

    // Remove player from all periods (used when player is deleted from team)
    removePlayerFromAllPeriods(playerName) {
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = this.lineup[period];
            
            // Remove from positions
            SoccerConfig.positions.forEach(pos => {
                if (periodData.positions[pos] === playerName) {
                    periodData.positions[pos] = null;
                }
            });
            
            // Remove from bench
            periodData.bench = periodData.bench.filter(p => p !== playerName);
            
            // Remove from jersey
            if (periodData.jersey) {
                periodData.jersey = periodData.jersey.filter(p => p !== playerName);
            }
        }
    },

    // Statistics and analysis
    calculatePlayerStats(playerName) {
        const stats = {
            totalMinutes: 0,
            benchPeriods: 0,
            jerseyPeriods: 0,
            positions: {}
        };

        // Initialize position counters
        SoccerConfig.positions.forEach(pos => {
            stats.positions[pos] = 0;
        });

        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = this.lineup[period];
            
            // Check if player is on bench
            if (periodData.bench.includes(playerName)) {
                stats.benchPeriods++;
                continue;
            }
            
            // Check if player is preparing jersey
            if (periodData.jersey && periodData.jersey.includes(playerName)) {
                stats.jerseyPeriods++;
                continue;
            }
            
            // Check which position player is in
            for (const [position, assignedPlayer] of Object.entries(periodData.positions)) {
                if (assignedPlayer === playerName) {
                    stats.totalMinutes += SoccerConfig.gameSettings.periodLength;
                    stats.positions[position]++;
                    break;
                }
            }
        }

        return stats;
    },

    getSubstitutionInfo(period, position) {
        if (period === 1) return null;
        
        const previousPeriod = period - 1;
        const currentPlayer = this.lineup[period].positions[position];
        const previousPlayer = this.lineup[previousPeriod].positions[position];
        
        // Check if this is a substitution (different player in same position)
        if (previousPlayer && previousPlayer !== currentPlayer) {
            return previousPlayer;
        }
        
        return null;
    },

    getCurrentPeriodStats() {
        const currentData = this.lineup[this.currentPeriod];
        const playersOnField = Object.values(currentData.positions).filter(p => p !== null).length;
        const playersOnBench = currentData.bench.length;
        const playersOnJersey = (currentData.jersey || []).length;
        const totalPlayers = SoccerConfig.utils.getPlayerNames().length;
        const unassigned = totalPlayers - playersOnField - playersOnBench - playersOnJersey;
        
        return {
            playersOnField,
            playersOnBench,
            playersOnJersey,
            totalPlayers,
            unassigned,
            maxOnField: SoccerConfig.gameSettings.maxPlayersOnField
        };
    },

    // Get current lineup state
    getCurrentLineup() {
        return this.lineup[this.currentPeriod];
    },

    getFullLineup() {
        return this.lineup;
    },

    // Validation
    isPlayerAssigned(playerName) {
        const currentData = this.lineup[this.currentPeriod];
        
        // Check positions
        if (Object.values(currentData.positions).includes(playerName)) {
            return true;
        }
        
        // Check bench
        if (currentData.bench.includes(playerName)) {
            return true;
        }
        
        // Check jersey
        if (currentData.jersey && currentData.jersey.includes(playerName)) {
            return true;
        }
        
        return false;
    },

    getPlayerAssignment(playerName) {
        const currentData = this.lineup[this.currentPeriod];
        
        // Check positions
        for (const [position, assignedPlayer] of Object.entries(currentData.positions)) {
            if (assignedPlayer === playerName) {
                return { type: 'position', value: position };
            }
        }
        
        // Check bench
        if (currentData.bench.includes(playerName)) {
            return { type: 'bench' };
        }
        
        // Check jersey
        if (currentData.jersey && currentData.jersey.includes(playerName)) {
            return { type: 'jersey' };
        }
        
        return { type: 'unassigned' };
    },

    // Export current state
    exportState() {
        return {
            currentPeriod: this.currentPeriod,
            lineup: JSON.parse(JSON.stringify(this.lineup))
        };
    },

    // Import state
    importState(state) {
        if (state.currentPeriod) {
            this.currentPeriod = state.currentPeriod;
        }
        if (state.lineup) {
            this.lineup = state.lineup;
        }
    },

    // Load period data (used by PersistentStorage)
    loadPeriodData(period, periodData) {
        if (period >= 1 && period <= SoccerConfig.gameSettings.totalPeriods) {
            this.lineup[period] = {
                positions: periodData.positions || {},
                bench: periodData.bench || [],
                jersey: periodData.jersey || []
            };
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LineupManager;
}