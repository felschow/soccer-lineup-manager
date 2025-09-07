// Period Transition UI Module
// Shows upcoming period changes and substitutions

const PeriodTransitionUI = {
    // Initialize period transition UI
    init() {
        this.updatePeriodChangesDisplay();
    },

    // Update the next period changes display
    updatePeriodChangesDisplay() {
        const changesList = document.getElementById('periodChangesList');
        if (!changesList) return;

        const currentPeriod = LineupManager.getCurrentPeriod();
        const nextPeriod = currentPeriod + 1;

        if (nextPeriod > SoccerConfig.gameSettings.totalPeriods) {
            changesList.innerHTML = '<div class="no-changes">Game Complete</div>';
            return;
        }

        const changes = this.getUpcomingChanges(currentPeriod, nextPeriod);
        
        // Check if periods have data
        const fullLineup = LineupManager.getFullLineup();
        const currentLineup = fullLineup[currentPeriod];
        const nextLineup = fullLineup[nextPeriod];
        
        const hasCurrentData = currentLineup && (
            Object.values(currentLineup.positions).some(p => p !== null) ||
            currentLineup.bench.length > 0
        );
        
        const hasNextData = nextLineup && (
            Object.values(nextLineup.positions).some(p => p !== null) ||
            nextLineup.bench.length > 0
        );
        
        if (changes.length === 0) {
            let message = 'No changes planned';
            if (!hasCurrentData && !hasNextData) {
                message = `Both periods are empty. Use AutoFill or assign players to periods ${currentPeriod} and ${nextPeriod}.`;
            } else if (!hasCurrentData) {
                message = `Period ${currentPeriod} is empty. Assign players to see changes.`;
            } else if (!hasNextData) {
                message = `Period ${nextPeriod} is empty. Use AutoFill or manually set up next period.`;
            } else {
                message = `No differences between Period ${currentPeriod} and ${nextPeriod}.`;
            }
            changesList.innerHTML = `<div class="no-changes">${message}</div>`;
            return;
        }

        const changesHtml = changes.map(change => this.renderChange(change)).join('');
        changesList.innerHTML = changesHtml;
    },

    // Get upcoming changes between current and next period
    getUpcomingChanges(currentPeriod, nextPeriod) {
        const fullLineup = LineupManager.getFullLineup();
        const currentLineup = fullLineup[currentPeriod];
        const nextLineup = fullLineup[nextPeriod];
        
        if (!currentLineup || !nextLineup) return [];

        const changes = [];

        // Check each field position for changes
        SoccerConfig.positions.forEach(position => {
            const currentPlayer = currentLineup.positions[position];
            const nextPlayer = nextLineup.positions[position];

            // If the player in this position is changing
            if (currentPlayer !== nextPlayer) {
                if (nextPlayer) {
                    // Someone is coming into this position
                    const isFromBench = this.isPlayerOnBench(nextPlayer, currentLineup);
                    const isFromField = this.findPlayerCurrentPosition(nextPlayer, currentLineup);
                    
                    if (isFromBench) {
                        // Player coming from bench to field
                        changes.push({
                            type: 'bench_to_field',
                            position: position,
                            playerIn: nextPlayer,
                            playerOut: currentPlayer,
                            description: `${nextPlayer} (bench) → ${position.toUpperCase()}${currentPlayer ? ` replacing ${currentPlayer}` : ''}`
                        });
                    } else if (isFromField && currentPlayer) {
                        // Regular substitution (field player to field player)
                        changes.push({
                            type: 'substitution',
                            position: position,
                            playerIn: nextPlayer,
                            playerOut: currentPlayer,
                            description: `${currentPlayer} → ${nextPlayer} at ${position.toUpperCase()}`
                        });
                    } else if (!currentPlayer) {
                        // Player coming into empty position
                        changes.push({
                            type: 'player_in',
                            position: position,
                            playerIn: nextPlayer,
                            playerOut: null,
                            description: `${nextPlayer} → ${position.toUpperCase()}`
                        });
                    }
                } else if (currentPlayer) {
                    // Someone is leaving this position (going to bench or another position)
                    const nextPosition = this.findPlayerInLineup(currentPlayer, nextLineup);
                    if (!nextPosition && !this.isPlayerOnBench(currentPlayer, nextLineup)) {
                        // Player leaving the game entirely
                        changes.push({
                            type: 'player_out',
                            position: position,
                            playerIn: null,
                            playerOut: currentPlayer,
                            description: `${currentPlayer} OFF from ${position.toUpperCase()}`
                        });
                    }
                }
            }
        });

        return changes;
    },

    // Check if player is on bench in given lineup
    isPlayerOnBench(playerName, lineup) {
        const bench = lineup.bench || [];
        return bench.includes(playerName);
    },

    // Find what position a player currently has (if any)
    findPlayerCurrentPosition(playerName, lineup) {
        for (const [position, player] of Object.entries(lineup.positions)) {
            if (player === playerName) {
                return position;
            }
        }
        return null;
    },

    // Find player's position in a lineup
    findPlayerInLineup(playerName, lineup) {
        for (const [position, player] of Object.entries(lineup.positions)) {
            if (player === playerName) {
                return position;
            }
        }
        return null;
    },

    // Render individual change
    renderChange(change) {
        const positionAbbrev = SoccerConfig.utils.getPositionAbbrev(change.position);
        const positionClass = SoccerConfig.utils.getPositionClass(change.position);

        switch (change.type) {
            case 'bench_to_field':
                return `
                    <div class="period-change bench-to-field">
                        <div class="change-icon">📥</div>
                        <div class="change-details">
                            <div class="change-position ${positionClass}">${positionAbbrev}</div>
                            <div class="change-description">
                                <div class="player-movement">
                                    <span class="player-in">${change.playerIn}</span>
                                    <small>(from bench)</small>
                                </div>
                                ${change.playerOut ? `<div class="replacing">replacing <span class="player-out">${change.playerOut}</span></div>` : ''}
                            </div>
                        </div>
                    </div>
                `;
            
            case 'substitution':
                return `
                    <div class="period-change substitution">
                        <div class="change-icon">🔄</div>
                        <div class="change-details">
                            <div class="change-position ${positionClass}">${positionAbbrev}</div>
                            <div class="change-description">
                                <div class="player-movement">
                                    <span class="player-out">${change.playerOut}</span>
                                    <span class="change-arrow">→</span>
                                    <span class="player-in">${change.playerIn}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            
            case 'player_in':
                return `
                    <div class="period-change player-in">
                        <div class="change-icon">⬆️</div>
                        <div class="change-details">
                            <div class="change-position ${positionClass}">${positionAbbrev}</div>
                            <div class="change-description">
                                <div class="player-movement">
                                    <span class="player-in">${change.playerIn}</span>
                                    <small>ON</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            
            case 'player_out':
                return `
                    <div class="period-change player-out">
                        <div class="change-icon">⬇️</div>
                        <div class="change-details">
                            <div class="change-position ${positionClass}">${positionAbbrev}</div>
                            <div class="change-description">
                                <div class="player-movement">
                                    <span class="player-out">${change.playerOut}</span>
                                    <small>OFF</small>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
            
            default:
                return '';
        }
    },

    // Highlight upcoming changes (called by timer alerts)
    highlightUpcomingChanges() {
        const changesList = document.getElementById('periodChangesList');
        if (changesList) {
            changesList.classList.add('highlight-changes');
            setTimeout(() => {
                changesList.classList.remove('highlight-changes');
            }, 3000);
        }
    },

    // Update display when period changes
    onPeriodChange() {
        this.updatePeriodChangesDisplay();
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PeriodTransitionUI;
}