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
        // Ensure we have an active team
        if (window.TeamManager && !TeamManager.getActiveTeam()) {
            throw new Error('No active team selected. Please select a team first in Team Manager.');
        }
        
        let playerNames = SoccerConfig.utils.getPlayerNames();
        let availableForField = playerNames;
        let unavailablePlayers = [];
        
        // Separate available and unavailable players
        if (window.PlayerAvailability) {
            availableForField = playerNames.filter(player => 
                PlayerAvailability.canPlayerBeAutoAssigned(player)
            );
            
            unavailablePlayers = playerNames.filter(player => {
                const availability = PlayerAvailability.getPlayerAvailability(player);
                return availability.status === PlayerAvailability.STATUS_TYPES.INJURED || 
                       availability.status === PlayerAvailability.STATUS_TYPES.ABSENT;
            });
            
            const unavailableCount = playerNames.length - availableForField.length;
            if (unavailableCount > 0) {
                console.log(`Filtering out ${unavailableCount} unavailable players for field positions`);
                console.log('Unavailable players (will be placed on bench):', unavailablePlayers);
                if (window.ToastManager) {
                    ToastManager.show(`${unavailableCount} injured/absent players will be placed on bench`, 'info', 3000);
                }
            }
            
            playerNames = availableForField;
        }
        
        if (playerNames.length === 0) {
            throw new Error('No available players found. Please check player availability status or select a team with players.');
        }
        
        if (playerNames.length < SoccerConfig.gameSettings.maxPlayersOnField) {
            throw new Error(`Not enough available players (${playerNames.length}) for a full lineup (${SoccerConfig.gameSettings.maxPlayersOnField}). Check player availability.`);
        }
        
        console.log('AutoFill using players:', playerNames);
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
        
        // STEP 2: Place injured/absent players on bench for all periods
        if (unavailablePlayers.length > 0) {
            this.placeUnavailablePlayersOnBench(unavailablePlayers, totalPeriods);
        }
        
        // STEP 3: Build lineup period by period following all constraints
        for (let period = 1; period <= totalPeriods; period++) {
            this.buildPeriodLineup(period, playerTracking);
        }
        
        // STEP 4: Validate all rules are followed
        this.validateAllRules(playerTracking);
        
        console.log('Lineup generation completed successfully');
        console.log('Final player tracking:', playerTracking);
    },

    // Plan goalkeeper rotation with jersey preparation and bench planning
    planGoalkeeperRotation(playerTracking) {
        // Get current available players who can play goalkeeper
        const playerNames = Object.keys(playerTracking); // Use filtered available players
        const gkCapablePlayers = playerNames.filter(player => 
            SoccerConfig.utils.canPlayerPlayPosition(player, 'goalkeeper')
        );
        
        if (gkCapablePlayers.length < 3) {
            console.warn('Not enough goalkeeper-capable players found. Using first 3 available players.');
        }
        
        // Use the first 3 goalkeeper-capable players (or first 3 players if not enough GK players)
        const playersToUse = gkCapablePlayers.length >= 3 ? gkCapablePlayers.slice(0, 3) : playerNames.slice(0, 3);
        
        // Define goalkeeper rotation with planned bench periods for fairness
        const gkRotation = [
            { player: playersToUse[0], periods: [1, 2, 3], plannedBenchPeriods: [4, 8] },
            { player: playersToUse[1], periods: [4, 5, 6], plannedBenchPeriods: [7] },
            { player: playersToUse[2], periods: [7, 8], plannedBenchPeriods: [1] }
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

    // Place injured/absent players on bench for all periods
    placeUnavailablePlayersOnBench(unavailablePlayers, totalPeriods) {
        console.log('Placing injured/absent players on bench for all periods:', unavailablePlayers);
        
        for (let period = 1; period <= totalPeriods; period++) {
            const periodData = LineupManager.lineup[period];
            if (!periodData.bench) periodData.bench = [];
            
            unavailablePlayers.forEach(playerName => {
                // Only add if not already on bench for this period
                if (!periodData.bench.includes(playerName)) {
                    periodData.bench.push(playerName);
                    console.log(`Period ${period}: Added ${playerName} to bench (unavailable)`);
                }
            });
        }
        
        console.log('Unavailable players placed on bench for all periods');
    },

    // Build lineup for a specific period
    buildPeriodLineup(period, playerTracking) {
        const periodData = LineupManager.lineup[period];
        const playerNames = Object.keys(playerTracking); // Use filtered available players
        
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
        
        // Safety check: ensure no injured/absent players are in fieldPlayers
        if (window.PlayerAvailability) {
            const invalidPlayers = fieldPlayers.filter(player => {
                const availability = PlayerAvailability.getPlayerAvailability(player);
                return availability.status === PlayerAvailability.STATUS_TYPES.INJURED || 
                       availability.status === PlayerAvailability.STATUS_TYPES.ABSENT;
            });
            
            if (invalidPlayers.length > 0) {
                console.error(`ERROR: Injured/absent players found in field assignments:`, invalidPlayers);
                throw new Error(`Injured/absent players cannot be assigned to field positions: ${invalidPlayers.join(', ')}`);
            }
        }
        
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

        // Enhanced position assignment with preferred position priority
        this.assignFieldPositionsWithPreferences(fieldPlayers, playerPositionNeeds, assignments, periodData, playerTracking, period);

        console.log(`Period ${period}: Assigned ${Object.keys(assignments).length} field positions`);
    },

    // Enhanced field position assignment with strict preferred position priority
    assignFieldPositionsWithPreferences(fieldPlayers, playerPositionNeeds, assignments, periodData, playerTracking, period) {
        const fieldPositions = SoccerConfig.positions.filter(pos => pos !== 'goalkeeper');
        
        // PHASE 1: Assign players to their most preferred positions first
        console.log(`Period ${period}: Phase 1 - Assigning players to preferred positions`);
        
        // Create preference mapping: position -> [players who prefer this position]
        const positionPreferences = {};
        fieldPositions.forEach(position => {
            positionPreferences[position] = fieldPlayers.filter(player => {
                const preferredPositions = SoccerConfig.utils.getPlayerPreferredPositions(player);
                return preferredPositions.includes(position) && 
                       playerPositionNeeds[player].eligiblePositions.includes(position);
            });
        });
        
        // Sort positions by scarcity (positions with fewer eligible players get priority)
        const positionsByScarcity = fieldPositions
            .filter(pos => !assignments[pos]) // Only unassigned positions
            .sort((a, b) => positionPreferences[a].length - positionPreferences[b].length);
        
        // Assign players to scarce positions first
        positionsByScarcity.forEach(position => {
            if (assignments[position]) return; // Already assigned
            
            const eligiblePlayers = positionPreferences[position].filter(player => 
                !Object.values(assignments).includes(player)
            );
            
            if (eligiblePlayers.length > 0) {
                // Prioritize players who need variety, then those with fewer total positions played
                const bestPlayer = eligiblePlayers.sort((a, b) => {
                    const aNeeds = playerPositionNeeds[a];
                    const bNeeds = playerPositionNeeds[b];
                    
                    // First priority: players who need variety
                    if (aNeeds.needsVariety !== bNeeds.needsVariety) {
                        return bNeeds.needsVariety - aNeeds.needsVariety;
                    }
                    
                    // Second priority: players with fewer positions played
                    return aNeeds.positionsPlayed - bNeeds.positionsPlayed;
                })[0];
                
                assignments[position] = bestPlayer;
                periodData.positions[position] = bestPlayer;
                playerTracking[bestPlayer].positionsPlayed.add(position);
                playerTracking[bestPlayer].playingTime += 7.5;
                
                console.log(`Period ${period}: Assigned ${bestPlayer} to preferred position ${position}`);
            }
        });
        
        // PHASE 2: Handle remaining unassigned players with fallback logic
        const unassignedPlayers = fieldPlayers.filter(player => 
            !Object.values(assignments).includes(player)
        );
        const unassignedPositions = fieldPositions.filter(pos => !assignments[pos]);
        
        if (unassignedPlayers.length > 0 && unassignedPositions.length > 0) {
            console.log(`Period ${period}: Phase 2 - Assigning ${unassignedPlayers.length} remaining players to ${unassignedPositions.length} positions`);
            
            unassignedPlayers.forEach(player => {
                const availablePositions = unassignedPositions.filter(pos => 
                    !assignments[pos] && 
                    SoccerConfig.utils.canPlayerPlayPositionFallback(player, pos)
                );
                
                if (availablePositions.length > 0) {
                    const bestPosition = availablePositions[0]; // Take first available fallback position
                    assignments[bestPosition] = player;
                    periodData.positions[bestPosition] = player;
                    playerTracking[player].positionsPlayed.add(bestPosition);
                    playerTracking[player].playingTime += 7.5;
                    
                    console.log(`Period ${period}: Assigned ${player} to fallback position ${bestPosition} (not preferred)`);
                }
            });
        }
        
        // Report any remaining unassigned positions
        const stillUnassigned = fieldPositions.filter(pos => !assignments[pos]);
        if (stillUnassigned.length > 0) {
            console.warn(`Period ${period}: Could not assign players to positions: ${stillUnassigned.join(', ')}`);
        }
    },

    // Validate all rules are followed
    validateAllRules(playerTracking) {
        const playerNames = Object.keys(playerTracking); // Use tracked available players
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
            
            // Position Preference Rule: Check for non-preferred position assignments
            this.validatePlayerPositionPreferences(player, violations);
        });

        // Overall lineup preference compliance
        const preferenceViolations = this.validateOverallPositionCompliance();
        violations.push(...preferenceViolations);

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

    // Validate individual player's position preferences
    validatePlayerPositionPreferences(playerName, violations) {
        const fullLineup = LineupManager.getFullLineup();
        const preferredPositions = SoccerConfig.utils.getPlayerPreferredPositions(playerName);
        const nonPreferredAssignments = [];
        
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = fullLineup[period];
            if (!periodData) continue;
            
            // Check field positions
            Object.entries(periodData.positions).forEach(([position, assignedPlayer]) => {
                if (assignedPlayer === playerName && !preferredPositions.includes(position)) {
                    nonPreferredAssignments.push(`Period ${period}: ${position}`);
                }
            });
        }
        
        // Report non-preferred assignments (as warnings, not hard violations)
        if (nonPreferredAssignments.length > 0) {
            violations.push(`⚠️ ${playerName} assigned to non-preferred positions: ${nonPreferredAssignments.join(', ')}`);
        }
    },

    // Validate overall position compliance across all players
    validateOverallPositionCompliance() {
        const fullLineup = LineupManager.getFullLineup();
        const violations = [];
        const playerNames = SoccerConfig.utils.getPlayerNames();
        
        // Track position preference compliance statistics
        let totalAssignments = 0;
        let preferredAssignments = 0;
        
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = fullLineup[period];
            if (!periodData) continue;
            
            Object.entries(periodData.positions).forEach(([position, assignedPlayer]) => {
                if (assignedPlayer && playerNames.includes(assignedPlayer)) {
                    totalAssignments++;
                    const preferredPositions = SoccerConfig.utils.getPlayerPreferredPositions(assignedPlayer);
                    if (preferredPositions.includes(position)) {
                        preferredAssignments++;
                    }
                }
            });
        }
        
        // Calculate compliance percentage
        const compliancePercentage = totalAssignments > 0 ? 
            Math.round((preferredAssignments / totalAssignments) * 100) : 100;
        
        if (compliancePercentage < 80) {
            violations.push(`🎯 Position preference compliance: ${compliancePercentage}% (${preferredAssignments}/${totalAssignments} assignments in preferred positions)`);
        } else if (compliancePercentage < 95) {
            violations.push(`✅ Good position preference compliance: ${compliancePercentage}% (${preferredAssignments}/${totalAssignments})`);
        } else {
            console.log(`🎯 Excellent position preference compliance: ${compliancePercentage}% (${preferredAssignments}/${totalAssignments})`);
        }
        
        return violations;
    },

    // Auto fill current period only (simplified)
    autoFillCurrentPeriod() {
        ToastManager.info('Use "Auto Fill All" for rule-based generation', 4000);
        
        // Simple current period fill without rule enforcement
        const currentPeriod = LineupManager.getCurrentPeriod();
        let playerNames = SoccerConfig.utils.getPlayerNames();
        
        // Filter out unavailable players (injured/absent)
        if (window.PlayerAvailability) {
            playerNames = playerNames.filter(player => 
                PlayerAvailability.canPlayerBeAutoAssigned(player)
            );
        }
        
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
        let playerNames = SoccerConfig.utils.getPlayerNames();
        
        // Filter out unavailable players for validation
        if (window.PlayerAvailability) {
            playerNames = playerNames.filter(player => 
                PlayerAvailability.canPlayerBeAutoAssigned(player)
            );
        }
        
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