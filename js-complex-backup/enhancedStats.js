// Enhanced Statistics Dashboard
// Provides advanced statistics with visual indicators and balance analysis

const EnhancedStats = {
    // Initialize enhanced statistics
    init() {
        console.log('Enhanced Statistics initialized');
    },

    // Calculate comprehensive team balance metrics
    calculateTeamBalance() {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const stats = playerNames.map(name => ({
            name,
            ...LineupManager.calculatePlayerStats(name)
        }));

        // Calculate balance metrics
        const totalMinutes = stats.reduce((sum, p) => sum + p.totalMinutes, 0);
        const avgMinutes = totalMinutes / playerNames.length;
        const maxMinutes = Math.max(...stats.map(p => p.totalMinutes));
        const minMinutes = Math.min(...stats.map(p => p.totalMinutes));
        
        const benchTimes = stats.map(p => p.benchPeriods + p.jerseyPeriods);
        const avgBench = benchTimes.reduce((sum, b) => sum + b, 0) / playerNames.length;
        
        // Calculate fairness score (0-100, where 100 is perfectly fair)
        const minuteVariance = Math.sqrt(
            stats.reduce((sum, p) => sum + Math.pow(p.totalMinutes - avgMinutes, 2), 0) / playerNames.length
        );
        const fairnessScore = Math.max(0, 100 - (minuteVariance / avgMinutes) * 100);

        return {
            stats,
            avgMinutes: Math.round(avgMinutes * 10) / 10,
            maxMinutes,
            minMinutes,
            minuteRange: maxMinutes - minMinutes,
            avgBench: Math.round(avgBench * 10) / 10,
            fairnessScore: Math.round(fairnessScore),
            totalMinutes,
            minuteVariance: Math.round(minuteVariance * 10) / 10
        };
    },

    // Get balance status for a player
    getPlayerBalanceStatus(playerStats, teamBalance) {
        const { avgMinutes, avgBench } = teamBalance;
        const minuteDiff = playerStats.totalMinutes - avgMinutes;
        const benchDiff = (playerStats.benchPeriods + playerStats.jerseyPeriods) - avgBench;

        // Determine status based on deviations
        if (Math.abs(minuteDiff) <= 7.5 && Math.abs(benchDiff) <= 1) {
            return {
                status: 'balanced',
                message: 'Well balanced',
                indicator: 'good',
                priority: 0
            };
        } else if (minuteDiff < -15 || benchDiff > 2) {
            return {
                status: 'underused',
                message: 'Needs more playing time',
                indicator: 'error',
                priority: 3
            };
        } else if (minuteDiff > 15 || benchDiff < -2) {
            return {
                status: 'overused',
                message: 'Playing too much',
                indicator: 'error',
                priority: 3
            };
        } else {
            return {
                status: 'attention',
                message: 'Minor imbalance',
                indicator: 'warning',
                priority: 1
            };
        }
    },

    // Generate enhanced quick stats HTML
    generateEnhancedQuickStats() {
        const currentStats = LineupManager.getCurrentPeriodStats();
        const teamBalance = this.calculateTeamBalance();
        
        // Current period completeness
        const completeness = (currentStats.playersOnField / currentStats.maxOnField) * 100;
        const completenessStatus = completeness === 100 ? 'good' : 
                                 completeness >= 80 ? 'warning' : 'error';

        // Overall fairness indicator
        const fairnessStatus = teamBalance.fairnessScore >= 80 ? 'good' :
                              teamBalance.fairnessScore >= 60 ? 'warning' : 'error';

        return `
            <div class="stats-row">
                <span>On Field:</span>
                <span class="stats-enhanced">
                    <strong>${currentStats.playersOnField}/${currentStats.maxOnField}</strong>
                    <span class="stats-indicator ${completenessStatus}"></span>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${completeness}%"></div>
                    </div>
                </span>
            </div>
            <div class="stats-row">
                <span>On Bench:</span>
                <span><strong>${currentStats.playersOnBench}</strong></span>
            </div>
            <div class="stats-row">
                <span>Jersey Prep:</span>
                <span><strong>${currentStats.playersOnJersey}</strong></span>
            </div>
            <div class="stats-row">
                <span>Unassigned:</span>
                <span>
                    <strong>${currentStats.unassigned}</strong>
                    ${currentStats.unassigned > 0 ? '<span class="stats-indicator warning"></span>' : ''}
                </span>
            </div>
            <hr style="margin: 8px 0; border: none; border-top: 1px solid #e2e8f0;">
            <div class="stats-row">
                <span>Fairness Score:</span>
                <span class="stats-enhanced">
                    <strong>${teamBalance.fairnessScore}%</strong>
                    <span class="stats-indicator ${fairnessStatus}"></span>
                    <div class="balance-indicator ${fairnessStatus === 'good' ? 'balanced' : fairnessStatus === 'warning' ? 'needs-attention' : 'critical'}">
                        ${this.getFairnessMessage(teamBalance.fairnessScore)}
                    </div>
                </span>
            </div>
            <div class="stats-row">
                <span>Minute Range:</span>
                <span>
                    <strong>${teamBalance.minuteRange} min</strong>
                    ${teamBalance.minuteRange > 15 ? '<span class="stats-indicator warning"></span>' : 
                      teamBalance.minuteRange > 30 ? '<span class="stats-indicator error"></span>' : ''}
                </span>
            </div>
        `;
    },

    // Get fairness message based on score
    getFairnessMessage(score) {
        if (score >= 90) return '✓ Excellent';
        if (score >= 80) return '✓ Good';
        if (score >= 70) return '⚠ Fair';
        if (score >= 60) return '⚠ Needs work';
        return '✕ Poor balance';
    },

    // Generate enhanced player list HTML with balance indicators
    generateEnhancedPlayerCard(playerName) {
        const stats = LineupManager.calculatePlayerStats(playerName);
        const teamBalance = this.calculateTeamBalance();
        const balanceStatus = this.getPlayerBalanceStatus(stats, teamBalance);
        const isAssigned = LineupManager.isPlayerAssigned(playerName);
        
        // Get player availability status
        const availability = window.PlayerAvailability ? 
            PlayerAvailability.getPlayerAvailability(playerName) : null;
        const statusInfo = availability ? 
            PlayerAvailability.getStatusDisplayInfo(availability.status) : null;
        
        // Determine if player should be dimmed or highlighted based on availability
        const availabilityClass = availability ? `availability-${availability.status}` : '';
        const isDraggable = !availability || PlayerAvailability.canPlayerBeAutoAssigned(playerName);
        
        // Position badges with usage indicators
        const positionBadges = Object.entries(stats.positions)
            .filter(([pos, count]) => count > 0)
            .map(([pos, count]) => {
                const avgForPosition = this.getAveragePositionUsage(pos);
                const badgeClass = count > avgForPosition * 1.5 ? 'overuse' : 
                                  count < avgForPosition * 0.5 ? 'underuse' : '';
                return `<span class="position-badge ${badgeClass}">${SoccerConfig.utils.getPositionAbbrev(pos)}:${count}</span>`;
            })
            .join('');

        // Playing time progress bar
        const maxPossibleMinutes = SoccerConfig.gameSettings.totalPeriods * SoccerConfig.gameSettings.periodLength;
        const timePercentage = (stats.totalMinutes / maxPossibleMinutes) * 100;
        
        return `
            <div class="player-card ${isAssigned ? 'assigned' : ''} ${availabilityClass}" 
                 draggable="${isDraggable}" data-player="${playerName}">
                <div class="player-header">
                    <div class="player-name-section">
                        <span class="player-name">${playerName}</span>
                        ${statusInfo ? `<span class="availability-badge" style="background-color: ${statusInfo.color}" title="${statusInfo.description}">
                            ${statusInfo.emoji} ${statusInfo.label}
                        </span>` : ''}
                    </div>
                    <span class="player-time">
                        ${stats.totalMinutes}min
                        <span class="stats-indicator ${balanceStatus.indicator}"></span>
                    </span>
                </div>
                <div class="player-stats">
                    <div class="stat-line">
                        <span>Periods sat:</span>
                        <span>${stats.benchPeriods + stats.jerseyPeriods}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill ${balanceStatus.status === 'overused' ? 'overuse' : 
                                                    balanceStatus.status === 'underused' ? 'underuse' : ''}" 
                             style="width: ${timePercentage}%"></div>
                    </div>
                    <div class="balance-indicator ${balanceStatus.status === 'balanced' ? 'balanced' : 
                                                   balanceStatus.priority <= 1 ? 'needs-attention' : 'critical'}">
                        ${balanceStatus.message}
                    </div>
                    <div class="position-badges">
                        ${positionBadges || '<span class="position-badge">Not assigned</span>'}
                    </div>
                    ${availability && availability.notes ? `
                    <div class="availability-notes">
                        <small>📝 ${availability.notes}</small>
                    </div>` : ''}
                </div>
                <div class="availability-controls" style="display: none;">
                    <div class="availability-buttons">
                        <button class="availability-btn" data-status="available" title="Mark as Available">✅</button>
                        <button class="availability-btn" data-status="injured" title="Mark as Injured">🤕</button>
                        <button class="availability-btn" data-status="absent" title="Mark as Absent">❌</button>
                        <button class="availability-btn" data-status="late" title="Mark as Late">⏰</button>
                    </div>
                    <input type="text" class="availability-notes-input" placeholder="Add notes..." maxlength="100">
                    <button class="availability-save-btn">Save</button>
                </div>
            </div>
        `;
    },

    // Calculate average usage for a position across all players
    getAveragePositionUsage(position) {
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const totalUsage = playerNames.reduce((sum, name) => {
            const stats = LineupManager.calculatePlayerStats(name);
            return sum + (stats.positions[position] || 0);
        }, 0);
        
        return totalUsage / playerNames.length;
    },

    // Generate lineup warnings and suggestions
    generateLineupWarnings() {
        const warnings = [];
        const suggestions = [];
        const teamBalance = this.calculateTeamBalance();
        const currentStats = LineupManager.getCurrentPeriodStats();

        // Check for unfilled positions
        if (currentStats.unassigned > 0) {
            warnings.push({
                type: 'warning',
                message: `${currentStats.unassigned} players unassigned in current period`,
                action: 'Consider using Auto Fill or manually assign players'
            });
        }

        // Check for field completeness
        if (currentStats.playersOnField < currentStats.maxOnField) {
            warnings.push({
                type: 'error',
                message: `Field not complete (${currentStats.playersOnField}/${currentStats.maxOnField} positions filled)`,
                action: 'Fill remaining positions or use Auto Fill'
            });
        }

        // Check for overused/underused players
        teamBalance.stats.forEach(playerStat => {
            const balance = this.getPlayerBalanceStatus(playerStat, teamBalance);
            if (balance.priority >= 2) {
                if (balance.status === 'underused') {
                    suggestions.push({
                        type: 'info',
                        message: `${playerStat.name} needs more playing time (${playerStat.totalMinutes} min)`,
                        action: `Consider assigning ${playerStat.name} to more periods`
                    });
                } else if (balance.status === 'overused') {
                    suggestions.push({
                        type: 'warning',
                        message: `${playerStat.name} playing too much (${playerStat.totalMinutes} min)`,
                        action: `Consider giving ${playerStat.name} more bench time`
                    });
                }
            }
        });

        // Check overall fairness
        if (teamBalance.fairnessScore < 60) {
            warnings.push({
                type: 'error',
                message: `Poor playing time balance (${teamBalance.fairnessScore}% fairness)`,
                action: 'Use Auto Fill All to improve balance'
            });
        } else if (teamBalance.fairnessScore < 80) {
            suggestions.push({
                type: 'warning',
                message: `Playing time could be more balanced (${teamBalance.fairnessScore}% fairness)`,
                action: 'Review player assignments across periods'
            });
        }

        return { warnings, suggestions };
    },

    // Show real-time validation warnings
    showValidationWarnings() {
        const { warnings, suggestions } = this.generateLineupWarnings();
        
        // Show critical warnings as toasts
        warnings.forEach(warning => {
            if (warning.type === 'error') {
                ToastManager.warning(warning.message, 8000);
            }
        });

        // Log suggestions for console debugging
        if (suggestions.length > 0) {
            console.log('Lineup Suggestions:', suggestions);
        }
    },

    // Get recommended positions for a player based on team balance
    getPositionRecommendations(playerName) {
        const teamBalance = this.calculateTeamBalance();
        const playerStats = LineupManager.calculatePlayerStats(playerName);
        const recommendations = [];

        // Check which positions need more coverage
        SoccerConfig.positions.forEach(position => {
            if (position === 'goalkeeper') return; // Special handling for GK
            
            const avgUsage = this.getAveragePositionUsage(position);
            const playerUsage = playerStats.positions[position] || 0;
            
            if (playerUsage < avgUsage && SoccerConfig.utils.canPlayerPlayPosition(playerName, position)) {
                recommendations.push({
                    position,
                    priority: avgUsage - playerUsage,
                    reason: `Under-utilized in ${SoccerConfig.utils.getPositionAbbrev(position)}`
                });
            }
        });

        // Sort by priority (highest need first)
        recommendations.sort((a, b) => b.priority - a.priority);
        
        return recommendations.slice(0, 3); // Return top 3 recommendations
    },

    // Advanced statistics for debugging and analysis
    generateAdvancedAnalytics() {
        const teamBalance = this.calculateTeamBalance();
        const fullLineup = LineupManager.getFullLineup();
        
        // Position distribution analysis
        const positionDistribution = {};
        SoccerConfig.positions.forEach(pos => {
            positionDistribution[pos] = {
                totalAssignments: 0,
                uniquePlayers: new Set(),
                avgPerPlayer: 0
            };
        });

        // Analyze each period
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const periodData = fullLineup[period];
            Object.entries(periodData.positions).forEach(([pos, player]) => {
                if (player) {
                    positionDistribution[pos].totalAssignments++;
                    positionDistribution[pos].uniquePlayers.add(player);
                }
            });
        }

        // Calculate averages
        Object.keys(positionDistribution).forEach(pos => {
            const data = positionDistribution[pos];
            data.avgPerPlayer = data.uniquePlayers.size > 0 ? 
                data.totalAssignments / data.uniquePlayers.size : 0;
            data.uniquePlayers = Array.from(data.uniquePlayers);
        });

        return {
            teamBalance,
            positionDistribution,
            periodAnalysis: this.analyzePeriodTransitions(),
            substitutionPatterns: this.analyzeSubstitutionPatterns()
        };
    },

    // Analyze transitions between periods
    analyzePeriodTransitions() {
        const transitions = [];
        const fullLineup = LineupManager.getFullLineup();

        for (let period = 2; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            const prev = fullLineup[period - 1];
            const curr = fullLineup[period];
            
            let changes = 0;
            const subs = [];

            SoccerConfig.positions.forEach(pos => {
                if (prev.positions[pos] !== curr.positions[pos]) {
                    changes++;
                    subs.push({
                        position: pos,
                        out: prev.positions[pos],
                        in: curr.positions[pos]
                    });
                }
            });

            transitions.push({
                period,
                totalChanges: changes,
                substitutions: subs
            });
        }

        return transitions;
    },

    // Analyze substitution patterns for insights
    analyzeSubstitutionPatterns() {
        const patterns = {
            mostSubstituted: {},
            positionVolatility: {},
            playerMobility: {}
        };

        // This would be implemented based on transition analysis
        // For now, return placeholder structure
        return patterns;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EnhancedStats;
}