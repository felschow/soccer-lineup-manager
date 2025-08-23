// Auto-Fill Algorithm Module
// Handles intelligent lineup generation and player rotation

const AutoFillManager = {
    // Auto fill all periods with smart rotation
    autoFillAll() {
        // Clear all periods first
        LineupManager.clearAllPeriods();
        
        // Apply goalkeeper rotation rules
        this.applyGoalkeeperRotation();
        
        // Fill remaining positions for each period
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            this.fillNonGoalkeeperPositions(period);
        }
        
        // Apply position continuity preferences
        this.applyPositionContinuity();
        
        // Balance bench time
        this.balanceBenchTime();
    },

    // Auto fill current period only
    autoFillCurrentPeriod() {
        const currentPeriod = LineupManager.getCurrentPeriod();
        
        // Clear current period (except goalkeeper if already assigned)
        const currentLineup = LineupManager.getCurrentLineup();
        const existingGK = currentLineup.positions.goalkeeper;
        
        LineupManager.clearCurrentPeriod();
        
        // Restore goalkeeper if it was assigned
        if (existingGK) {
            currentLineup.positions.goalkeeper = existingGK;
        }
        
        // Fill remaining positions
        this.fillNonGoalkeeperPositions(currentPeriod);
    },

    // Apply predefined goalkeeper rotation
    applyGoalkeeperRotation() {
        SoccerConfig.goalkeeperRotation.forEach(({ gk, periods, jersey, restAfter }) => {
            // Assign goalkeeper periods
            periods.forEach(period => {
                const periodData = LineupManager.lineup[period];
                if (periodData) {
                    periodData.positions.goalkeeper = gk;
                }
            });
            
            // Assign jersey preparation period
            if (jersey && LineupManager.lineup[jersey]) {
                if (!LineupManager.lineup[jersey].jersey) {
                    LineupManager.lineup[jersey].jersey = [];
                }
                LineupManager.lineup[jersey].jersey.push(gk);
            }
            
            // Assign rest period after goalkeeper duty
            if (restAfter && LineupManager.lineup[restAfter]) {
                LineupManager.lineup[restAfter].bench.push(gk);
            }
        });
    },

    // Fill non-goalkeeper positions for a specific period
    fillNonGoalkeeperPositions(period) {
        const periodData = LineupManager.lineup[period];
        if (!periodData) return;

        const assignedPlayers = new Set();
        
        // Track already assigned players
        if (periodData.positions.goalkeeper) {
            assignedPlayers.add(periodData.positions.goalkeeper);
        }
        periodData.bench.forEach(p => assignedPlayers.add(p));
        if (periodData.jersey) {
            periodData.jersey.forEach(p => assignedPlayers.add(p));
        }

        // Get available players
        const availablePlayers = SoccerConfig.utils.getPlayerNames()
            .filter(p => !assignedPlayers.has(p));

        // Try to maintain positions from previous period first
        if (period > 1) {
            this.maintainPositionsFromPrevious(period, availablePlayers, assignedPlayers);
        }

        // Fill remaining empty positions
        this.fillEmptyPositions(period, availablePlayers, assignedPlayers);
        
        // Put remaining players on bench (limit to max bench size)
        const maxBench = Math.min(
            SoccerConfig.gameSettings.maxPlayersOnBench, 
            availablePlayers.length
        );
        const benchPlayers = availablePlayers.slice(0, maxBench);
        periodData.bench.push(...benchPlayers);
    },

    // Try to maintain position continuity from previous period
    maintainPositionsFromPrevious(period, availablePlayers, assignedPlayers) {
        const periodData = LineupManager.lineup[period];
        const previousPeriod = LineupManager.lineup[period - 1];
        
        SoccerConfig.positionPriority.forEach(position => {
            if (periodData.positions[position]) return; // Already filled
            
            const previousPlayer = previousPeriod.positions[position];
            if (previousPlayer && 
                availablePlayers.includes(previousPlayer) && 
                SoccerConfig.utils.canPlayerPlayPosition(previousPlayer, position)) {
                
                periodData.positions[position] = previousPlayer;
                availablePlayers.splice(availablePlayers.indexOf(previousPlayer), 1);
                assignedPlayers.add(previousPlayer);
            }
        });
    },

    // Fill empty positions with available players
    fillEmptyPositions(period, availablePlayers, assignedPlayers) {
        const periodData = LineupManager.lineup[period];
        
        SoccerConfig.positionPriority.forEach(position => {
            if (periodData.positions[position]) return; // Already filled
            
            const suitablePlayers = availablePlayers.filter(player => 
                SoccerConfig.utils.canPlayerPlayPosition(player, position)
            );
            
            if (suitablePlayers.length > 0) {
                // Choose player with least playing time in this position
                const selectedPlayer = this.selectBestPlayerForPosition(suitablePlayers, position);
                periodData.positions[position] = selectedPlayer;
                availablePlayers.splice(availablePlayers.indexOf(selectedPlayer), 1);
                assignedPlayers.add(selectedPlayer);
            }
        });
    },

    // Select the best player for a position based on various criteria
    selectBestPlayerForPosition(candidates, position) {
        if (candidates.length === 1) return candidates[0];
        
        // Score each candidate
        const scoredCandidates = candidates.map(player => {
            const stats = LineupManager.calculatePlayerStats(player);
            const score = {
                player,
                // Prefer players with less total playing time
                totalMinutesScore: -stats.totalMinutes,
                // Prefer players with less time in this specific position
                positionExperienceScore: -(stats.positions[position] || 0),
                // Prefer players who haven't sat on bench as much
                benchScore: -stats.benchPeriods
            };
            
            // Calculate weighted total score
            score.total = (score.totalMinutesScore * 0.4) + 
                         (score.positionExperienceScore * 0.4) + 
                         (score.benchScore * 0.2);
            
            return score;
        });
        
        // Sort by total score (highest first)
        scoredCandidates.sort((a, b) => b.total - a.total);
        
        return scoredCandidates[0].player;
    },

    // Apply position continuity across all periods
    applyPositionContinuity() {
        for (let period = 2; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const currentPeriod = LineupManager.lineup[period];
            const previousPeriod = LineupManager.lineup[period - 1];
            
            // Skip goalkeeper (has its own rotation rules)
            const fieldPositions = SoccerConfig.positions.filter(pos => pos !== 'goalkeeper');
            
            fieldPositions.forEach(position => {
                const previousPlayer = previousPeriod.positions[position];
                const currentPlayer = currentPeriod.positions[position];
                
                // If previous player is available and position is empty, try to keep them
                if (previousPlayer && !currentPlayer) {
                    const isAvailable = this.isPlayerAvailableInPeriod(previousPlayer, period);
                    
                    if (isAvailable && SoccerConfig.utils.canPlayerPlayPosition(previousPlayer, position)) {
                        // Try to find alternative placement for current occupant
                        const currentOccupant = this.findPlayerToSwap(period, position, previousPlayer);
                        if (currentOccupant) {
                            this.swapPlayers(period, position, previousPlayer, currentOccupant);
                        }
                    }
                }
            });
        }
    },

    // Check if player is available in a specific period
    isPlayerAvailableInPeriod(playerName, period) {
        const periodData = LineupManager.lineup[period];
        
        // Check if already assigned to a position
        for (const assignedPlayer of Object.values(periodData.positions)) {
            if (assignedPlayer === playerName) return false;
        }
        
        // Check if on bench or jersey
        if (periodData.bench.includes(playerName)) return false;
        if (periodData.jersey && periodData.jersey.includes(playerName)) return false;
        
        return true;
    },

    // Find a player that can be swapped to accommodate continuity
    findPlayerToSwap(period, targetPosition, desiredPlayer) {
        const periodData = LineupManager.lineup[period];
        
        // Look for players who could move to make room
        for (const [position, currentPlayer] of Object.entries(periodData.positions)) {
            if (!currentPlayer || position === 'goalkeeper' || position === targetPosition) continue;
            
            // Find alternative position for current player
            const alternativePosition = this.findAlternativePosition(currentPlayer, period, position);
            if (alternativePosition) {
                return { currentPlayer, currentPosition: position, newPosition: alternativePosition };
            }
        }
        
        return null;
    },

    // Find alternative position for a player
    findAlternativePosition(playerName, period, excludePosition) {
        const periodData = LineupManager.lineup[period];
        
        const availablePositions = SoccerConfig.positions.filter(pos => 
            pos !== excludePosition && 
            pos !== 'goalkeeper' && 
            !periodData.positions[pos] && 
            SoccerConfig.utils.canPlayerPlayPosition(playerName, pos)
        );
        
        return availablePositions.length > 0 ? availablePositions[0] : null;
    },

    // Swap players between positions
    swapPlayers(period, targetPosition, newPlayer, swapInfo) {
        const periodData = LineupManager.lineup[period];
        
        if (swapInfo) {
            // Move current player to new position
            periodData.positions[swapInfo.newPosition] = swapInfo.currentPlayer;
            // Clear their old position
            periodData.positions[swapInfo.currentPosition] = null;
        }
        
        // Assign new player to target position
        periodData.positions[targetPosition] = newPlayer;
    },

    // Balance bench time across all players
    balanceBenchTime() {
        // Calculate current bench distribution
        const benchStats = this.calculateBenchDistribution();
        
        // Find players who have sat too little or too much
        const averageBenchTime = this.calculateAverageBenchTime(benchStats);
        const playersNeedMoreBench = [];
        const playersNeedLessBench = [];
        
        Object.entries(benchStats).forEach(([player, benchCount]) => {
            if (benchCount < averageBenchTime - 1) {
                playersNeedMoreBench.push({ player, deficit: averageBenchTime - benchCount });
            } else if (benchCount > averageBenchTime + 1) {
                playersNeedLessBench.push({ player, excess: benchCount - averageBenchTime });
            }
        });
        
        // Try to balance by swapping between field and bench
        this.performBenchBalancing(playersNeedMoreBench, playersNeedLessBench);
    },

    // Calculate bench time distribution
    calculateBenchDistribution() {
        const distribution = {};
        
        SoccerConfig.utils.getPlayerNames().forEach(player => {
            const stats = LineupManager.calculatePlayerStats(player);
            distribution[player] = stats.benchPeriods + stats.jerseyPeriods;
        });
        
        return distribution;
    },

    // Calculate average bench time
    calculateAverageBenchTime(benchStats) {
        const totalBenchTime = Object.values(benchStats).reduce((sum, count) => sum + count, 0);
        const playerCount = Object.keys(benchStats).length;
        return Math.round(totalBenchTime / playerCount);
    },

    // Perform bench balancing swaps
    performBenchBalancing(needMoreBench, needLessBench) {
        // This is a complex optimization problem
        // For now, implement basic swapping logic
        
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = LineupManager.lineup[period];
            
            // Find opportunities to bench players who need more bench time
            needMoreBench.forEach(({ player }) => {
                if (Object.values(periodData.positions).includes(player) && 
                    periodData.bench.length < SoccerConfig.gameSettings.maxPlayersOnBench) {
                    
                    // Find their current position and remove them
                    for (const [position, assignedPlayer] of Object.entries(periodData.positions)) {
                        if (assignedPlayer === player) {
                            periodData.positions[position] = null;
                            periodData.bench.push(player);
                            
                            // Try to fill the position with someone from bench who needs less bench time
                            const replacement = this.findReplacementFromBench(
                                periodData.bench, position, needLessBench.map(p => p.player)
                            );
                            if (replacement) {
                                periodData.positions[position] = replacement;
                                periodData.bench.splice(periodData.bench.indexOf(replacement), 1);
                            }
                            break;
                        }
                    }
                }
            });
        }
    },

    // Find replacement player from bench
    findReplacementFromBench(benchPlayers, position, preferredPlayers) {
        // First try preferred players (those who need less bench time)
        for (const player of preferredPlayers) {
            if (benchPlayers.includes(player) && 
                SoccerConfig.utils.canPlayerPlayPosition(player, position)) {
                return player;
            }
        }
        
        // Then try any available player
        for (const player of benchPlayers) {
            if (SoccerConfig.utils.canPlayerPlayPosition(player, position)) {
                return player;
            }
        }
        
        return null;
    },

    // Validation method to check lineup quality
    validateLineupQuality() {
        const issues = [];
        
        // Check for unfilled positions
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = LineupManager.lineup[period];
            const emptyPositions = SoccerConfig.positions.filter(
                pos => !periodData.positions[pos]
            );
            
            if (emptyPositions.length > 0) {
                issues.push(`Period ${period}: Unfilled positions - ${emptyPositions.join(', ')}`);
            }
        }
        
        // Check bench time distribution
        const benchStats = this.calculateBenchDistribution();
        const avgBench = this.calculateAverageBenchTime(benchStats);
        const imbalanced = Object.entries(benchStats).filter(
            ([player, count]) => Math.abs(count - avgBench) > 2
        );
        
        if (imbalanced.length > 0) {
            issues.push(`Bench time imbalance: ${imbalanced.map(([p, c]) => `${p}:${c}`).join(', ')}`);
        }
        
        return issues;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoFillManager;
}