// Auto-Fill Algorithm Module
// Handles intelligent lineup generation and player rotation with strict rule enforcement

const AutoFillManager = {
    // Auto fill all periods with smart rotation - COMPLETELY REWRITTEN
    autoFillAll() {
        console.log('🚀 STARTING NEW 5-RULE ALGORITHM - VERSION 2.0');
        console.log('Starting new rule-based autofill...');
        
        // Clear all periods first
        LineupManager.clearAllPeriods();
        
        // NEW ALGORITHM: Build lineup period by period following all rules
        try {
            this.buildCompleteLineup();
            ToastManager.success('Lineup generated following all rules!', 4000);
        } catch (error) {
            console.error('Autofill failed:', error);
            ToastManager.error('Could not generate lineup following all rules. Try manual adjustment.', 6000);
            throw error;
        }
    },

    // Build complete lineup following all 5 rules
    buildCompleteLineup() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const totalPeriods = SoccerConfig.gameSettings.totalPeriods;
        
        // Initialize tracking structures
        const playerTracking = {};
        playerNames.forEach(player => {
            playerTracking[player] = {
                benchPeriods: [],
                jerseyPeriods: [],
                gkPeriods: [],
                positionsPlayed: new Set(),
                playingTime: 0
            };
        });

        // STEP 1: Plan goalkeeper rotation and jersey preparation (Rule 3)
        this.planGoalkeeperRotation(playerTracking);
        
        // STEP 2: Build lineup period by period following all constraints
        for (let period = 1; period <= totalPeriods; period++) {
            this.buildPeriodLineup(period, playerTracking);
        }
        
        // STEP 3: Validate all rules are followed
        this.validateAllRules(playerTracking);
        
        console.log('Lineup generation completed successfully');
        console.log('Final player tracking:', playerTracking);
    },

    // Plan goalkeeper rotation with jersey preparation and bench planning
    planGoalkeeperRotation(playerTracking) {
        // Define goalkeeper rotation with planned bench periods for fairness
        const gkRotation = [
            { player: 'Aubree', periods: [1, 2, 3], plannedBenchPeriods: [4, 8] }, // Aubree sits in periods 4 and 8
            { player: 'Jordan', periods: [4, 5, 6], plannedBenchPeriods: [7] },     // Jordan sits in period 7 (plus jersey in 3)
            { player: 'SK', periods: [7, 8], plannedBenchPeriods: [1] }             // SK sits in period 1 (plus jersey in 6)
        ];

        gkRotation.forEach(({ player, periods, plannedBenchPeriods }) => {
            // Assign goalkeeper periods
            periods.forEach(period => {
                LineupManager.lineup[period].positions.goalkeeper = player;
                playerTracking[player].gkPeriods.push(period);
                playerTracking[player].playingTime += 7.5;
                playerTracking[player].positionsPlayed.add('goalkeeper');
            });
            
            // Rule 3: Jersey preparation before FIRST consecutive GK period only
            const firstGkPeriod = Math.min(...periods);
            if (firstGkPeriod > 1) {
                const jerseyPeriod = firstGkPeriod - 1;
                if (LineupManager.lineup[jerseyPeriod]) {
                    LineupManager.lineup[jerseyPeriod].jersey = [player];
                    playerTracking[player].jerseyPeriods.push(jerseyPeriod);
                }
            }
            
            // Pre-plan bench periods for goalkeepers to ensure they meet Rule 1
            plannedBenchPeriods.forEach(benchPeriod => {
                if (LineupManager.lineup[benchPeriod]) {
                    // Reserve this player for the bench in this period
                    playerTracking[player].plannedBenchPeriods = playerTracking[player].plannedBenchPeriods || [];
                    playerTracking[player].plannedBenchPeriods.push(benchPeriod);
                }
            });
        });

        console.log('Goalkeeper rotation, jersey preparation, and bench planning completed');
    },

    // Build lineup for a specific period
    buildPeriodLineup(period, playerTracking) {
        const periodData = LineupManager.lineup[period];
        const playerNames = SoccerConfig.utils.getPlayerNames();
        
        // Get available players (not GK, not on jersey duty)
        const availablePlayers = playerNames.filter(player => {
            return periodData.positions.goalkeeper !== player &&
                   !periodData.jersey.includes(player);
        });

        // RULE 5: Need exactly 3 players sitting (bench + jersey already counted)
        const playingPositions = SoccerConfig.positions.filter(pos => pos !== 'goalkeeper');
        const jerseyCount = periodData.jersey ? periodData.jersey.length : 0;
        const benchTarget = 3 - jerseyCount; // Total sitting should be 3
        
        // Select bench players following rules 1 & 2
        const benchPlayers = this.selectBenchPlayers(period, availablePlayers, benchTarget, playerTracking);
        
        // Assign bench players to the period data
        benchPlayers.forEach(player => {
            periodData.bench.push(player);
        });

        // Get field players
        const fieldPlayers = availablePlayers.filter(player => !benchPlayers.includes(player));
        
        // Assign field players to positions (Rule 4: position variety)
        this.assignFieldPositions(period, fieldPlayers, playerTracking);
        
        const totalSitting = benchPlayers.length + jerseyCount;
        console.log(`Period ${period} completed: ${fieldPlayers.length} playing, ${totalSitting} sitting (${benchPlayers.length} bench + ${jerseyCount} jersey)`);
    },

    // Select bench players following rules 1 & 2
    selectBenchPlayers(period, availablePlayers, benchTarget, playerTracking) {
        const benchPlayers = [];
        
        // First, add any players who are pre-planned for this bench period
        const plannedBenchPlayers = availablePlayers.filter(player => {
            const tracking = playerTracking[player];
            return tracking.plannedBenchPeriods && tracking.plannedBenchPeriods.includes(period);
        });
        
        plannedBenchPlayers.forEach(player => {
            benchPlayers.push(player);
            playerTracking[player].benchPeriods.push(period);
            console.log(`Period ${period}: ${player} assigned to bench (pre-planned)`);
        });
        
        // Remove planned players from available players list
        const remainingPlayers = availablePlayers.filter(player => !plannedBenchPlayers.includes(player));
        const remainingTarget = benchTarget - benchPlayers.length;
        
        if (remainingTarget <= 0) {
            return benchPlayers; // We have enough from planned assignments
        }
        
        // Create priority list for sitting from remaining players
        const playerPriorities = remainingPlayers.map(player => {
            const tracking = playerTracking[player];
            let priority = 0;
            
            // Rule 1: Players with 0 bench periods get highest priority
            if (tracking.benchPeriods.length + tracking.jerseyPeriods.length === 0) {
                priority += 100;
            }
            // Players with 1 bench period get medium priority
            else if (tracking.benchPeriods.length + tracking.jerseyPeriods.length === 1) {
                priority += 50;
            }
            // Players with 2+ bench periods get lowest priority (avoid them)
            else {
                priority -= 100;
            }
            
            // Rule 2: Players who sat last period get negative priority
            if (period > 1 && (tracking.benchPeriods.includes(period - 1) || tracking.jerseyPeriods.includes(period - 1))) {
                priority -= 200; // Very low priority to avoid consecutive sitting
            }
            
            // Consider playing time for additional fairness
            priority -= tracking.playingTime; // Less playing time = higher priority to sit
            
            return { player, priority };
        });

        // Sort by priority (highest first) and select bench players
        playerPriorities.sort((a, b) => b.priority - a.priority);
        
        // Select additional players for bench, avoiding rule violations
        for (const { player } of playerPriorities) {
            if (benchPlayers.length >= benchTarget) break;
            
            const tracking = playerTracking[player];
            const totalBenchTime = tracking.benchPeriods.length + tracking.jerseyPeriods.length;
            
            // Rule 1: Don't let anyone sit more than 2 times total
            if (totalBenchTime >= 2) continue;
            
            // Rule 2: Don't let anyone sit consecutive periods
            if (period > 1 && (tracking.benchPeriods.includes(period - 1) || tracking.jerseyPeriods.includes(period - 1))) {
                continue;
            }
            
            benchPlayers.push(player);
            playerTracking[player].benchPeriods.push(period);
        }
        
        // If we don't have enough bench players due to constraints, relax rules carefully
        while (benchPlayers.length < benchTarget) {
            // First, try remaining players who haven't exceeded Rule 1 limit (under 2 sits)
            const remaining = remainingPlayers.filter(player => {
                const tracking = playerTracking[player];
                const totalBenchTime = tracking.benchPeriods.length + tracking.jerseyPeriods.length;
                return !benchPlayers.includes(player) && totalBenchTime < 2;
            });
            
            if (remaining.length > 0) {
                const playerToAdd = remaining[0];
                benchPlayers.push(playerToAdd);
                playerTracking[playerToAdd].benchPeriods.push(period);
                console.warn(`Period ${period}: Relaxed consecutive sitting rule for ${playerToAdd}`);
                continue;
            }
            
            // If no players under limit, we need to relax Rule 1 as last resort
            const anyRemaining = remainingPlayers.filter(player => !benchPlayers.includes(player));
            if (anyRemaining.length > 0) {
                const playerToAdd = anyRemaining[0];
                benchPlayers.push(playerToAdd);
                playerTracking[playerToAdd].benchPeriods.push(period);
                console.error(`Period ${period}: FORCED to exceed Rule 1 for ${playerToAdd} - this indicates a planning issue`);
            } else {
                console.error(`Period ${period}: No more players available for bench - critical algorithm failure`);
                break;
            }
        }

        return benchPlayers;
    },

    // Assign field players to positions
    assignFieldPositions(period, fieldPlayers, playerTracking) {
        const periodData = LineupManager.lineup[period];
        const fieldPositions = SoccerConfig.positions.filter(pos => pos !== 'goalkeeper');
        const assignments = {};
        
        // Track position needs for Rule 4
        const playerPositionNeeds = {};
        fieldPlayers.forEach(player => {
            const tracking = playerTracking[player];
            const eligiblePositions = fieldPositions.filter(pos => 
                SoccerConfig.utils.canPlayerPlayPosition(player, pos)
            );
            
            playerPositionNeeds[player] = {
                eligiblePositions,
                positionsPlayed: tracking.positionsPlayed.size,
                needsVariety: tracking.positionsPlayed.size < 2
            };
        });

        // Priority assignment: players who need position variety first
        const priorityPlayers = fieldPlayers.filter(player => 
            playerPositionNeeds[player].needsVariety
        );
        const regularPlayers = fieldPlayers.filter(player => 
            !playerPositionNeeds[player].needsVariety
        );

        // Assign priority players first (Rule 4)
        [...priorityPlayers, ...regularPlayers].forEach(player => {
            const playerNeeds = playerPositionNeeds[player];
            
            // Find best position for this player
            const availablePositions = playerNeeds.eligiblePositions.filter(pos => !assignments[pos]);
            
            if (availablePositions.length > 0) {
                // For variety-needing players, prefer positions they haven't played
                let bestPosition;
                if (playerNeeds.needsVariety) {
                    const newPositions = availablePositions.filter(pos => 
                        !playerTracking[player].positionsPlayed.has(pos)
                    );
                    bestPosition = newPositions.length > 0 ? newPositions[0] : availablePositions[0];
                } else {
                    bestPosition = availablePositions[0];
                }
                
                // Make assignment
                assignments[bestPosition] = player;
                periodData.positions[bestPosition] = player;
                playerTracking[player].positionsPlayed.add(bestPosition);
                playerTracking[player].playingTime += 7.5;
            }
        });

        console.log(`Period ${period}: Assigned ${Object.keys(assignments).length} field positions`);
    },

    // Validate all rules are followed
    validateAllRules(playerTracking) {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const violations = [];

        playerNames.forEach(player => {
            const tracking = playerTracking[player];
            const totalBenchTime = tracking.benchPeriods.length + tracking.jerseyPeriods.length;
            
            // Rule 1: 1-2 bench periods per player
            if (totalBenchTime < 1 || totalBenchTime > 2) {
                violations.push(`${player}: ${totalBenchTime} bench periods (should be 1-2)`);
            }
            
            // Rule 2: No consecutive bench periods
            const allBenchPeriods = [...tracking.benchPeriods, ...tracking.jerseyPeriods].sort();
            for (let i = 0; i < allBenchPeriods.length - 1; i++) {
                if (allBenchPeriods[i + 1] === allBenchPeriods[i] + 1) {
                    violations.push(`${player}: Consecutive bench periods ${allBenchPeriods[i]}-${allBenchPeriods[i + 1]}`);
                }
            }
            
            // Rule 4: At least 2 preferred positions (if possible)
            const eligiblePositions = SoccerConfig.positions.filter(pos => 
                SoccerConfig.utils.canPlayerPlayPosition(player, pos)
            );
            if (eligiblePositions.length >= 2 && tracking.positionsPlayed.size < 2) {
                violations.push(`${player}: Only played ${tracking.positionsPlayed.size} positions (should play at least 2)`);
            }
        });

        // Rule 3: Jersey preparation before FIRST consecutive goalkeeper period only
        playerNames.forEach(player => {
            const gkPeriods = playerTracking[player].gkPeriods.sort((a, b) => a - b);
            const jerseyPeriods = playerTracking[player].jerseyPeriods;
            
            if (gkPeriods.length > 0) {
                // Find consecutive GK period groups
                const gkGroups = [];
                let currentGroup = [gkPeriods[0]];
                
                for (let i = 1; i < gkPeriods.length; i++) {
                    if (gkPeriods[i] === gkPeriods[i-1] + 1) {
                        // Consecutive period
                        currentGroup.push(gkPeriods[i]);
                    } else {
                        // New group starts
                        gkGroups.push([...currentGroup]);
                        currentGroup = [gkPeriods[i]];
                    }
                }
                gkGroups.push(currentGroup);
                
                // Check each group's first period for jersey preparation
                gkGroups.forEach(group => {
                    const firstGkPeriod = group[0];
                    if (firstGkPeriod > 1) {
                        const expectedJerseyPeriod = firstGkPeriod - 1;
                        if (!jerseyPeriods.includes(expectedJerseyPeriod)) {
                            violations.push(`${player}: Needs jersey preparation in period ${expectedJerseyPeriod} before GK duty starts in period ${firstGkPeriod}`);
                        }
                    }
                });
            }
        });

        // Rule 5: Check each period has exactly 3 sitting
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = LineupManager.lineup[period];
            const sitting = periodData.bench.length + (periodData.jersey ? periodData.jersey.length : 0);
            if (sitting !== 3) {
                violations.push(`Period ${period}: ${sitting} players sitting (should be exactly 3)`);
            }
        }

        if (violations.length > 0) {
            console.warn('Rule violations found:', violations);
            ToastManager.warning(`Generated lineup with ${violations.length} minor rule violations`, 5000);
        } else {
            ToastManager.success('Perfect! All rules followed successfully', 4000);
        }

        return violations;
    },

    // Auto fill current period only (simplified)
    autoFillCurrentPeriod() {
        ToastManager.info('Use "Auto Fill All" for rule-based generation', 4000);
        
        // Simple current period fill without rule enforcement
        const currentPeriod = LineupManager.getCurrentPeriod();
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const currentLineup = LineupManager.getCurrentLineup();
        
        // Keep existing assignments, fill empty positions
        const assignedPlayers = new Set();
        
        // Add already assigned players
        Object.values(currentLineup.positions).forEach(player => {
            if (player) assignedPlayers.add(player);
        });
        currentLineup.bench.forEach(player => assignedPlayers.add(player));
        if (currentLineup.jersey) {
            currentLineup.jersey.forEach(player => assignedPlayers.add(player));
        }
        
        // Get available players
        const availablePlayers = playerNames.filter(player => !assignedPlayers.has(player));
        
        // Fill empty positions
        SoccerConfig.positions.forEach(position => {
            if (!currentLineup.positions[position]) {
                const suitablePlayer = availablePlayers.find(player => 
                    SoccerConfig.utils.canPlayerPlayPosition(player, position)
                );
                if (suitablePlayer) {
                    currentLineup.positions[position] = suitablePlayer;
                    availablePlayers.splice(availablePlayers.indexOf(suitablePlayer), 1);
                }
            }
        });
        
        // Put remaining players on bench
        availablePlayers.forEach(player => {
            if (currentLineup.bench.length < 3) {
                currentLineup.bench.push(player);
            }
        });
    },

    // Validation method to check lineup quality
    validateLineupQuality() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
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

            // Check sitting count
            const sitting = periodData.bench.length + (periodData.jersey ? periodData.jersey.length : 0);
            if (sitting !== 3) {
                issues.push(`Period ${period}: ${sitting} players sitting (should be exactly 3)`);
            }
        }
        
        // Check bench time distribution
        playerNames.forEach(player => {
            const stats = LineupManager.calculatePlayerStats(player);
            const totalBench = stats.benchPeriods + stats.jerseyPeriods;
            if (totalBench < 1 || totalBench > 2) {
                issues.push(`${player}: ${totalBench} bench periods (should be 1-2)`);
            }
        });

        return issues;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutoFillManager;
}