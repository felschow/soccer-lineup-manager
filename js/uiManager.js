// UI Management Module
// Handles all DOM interactions, view updates, and visual feedback

const UIManager = {
    // State tracking
    isTableView: false,

    // Initialize UI components
    init() {
        this.updateDisplay();
        this.updateNavigationButtons();
    },

    // Main display update orchestrator
    updateDisplay() {
        this.updatePeriodInfo();
        this.updatePositions();
        this.updateBench();
        this.updatePlayerList();
        this.updateQuickStats();
        this.updateNavigationButtons();
        
        if (this.isTableView) {
            this.renderLineupTable();
        }
        
        // Update mobile display if available
        if (window.MobileUIManager) {
            MobileUIManager.updateMobileDisplay();
        }
    },

    // Period information updates
    updatePeriodInfo() {
        const period = LineupManager.getCurrentPeriod();
        const timeInfo = SoccerConfig.utils.getPeriodTime(period);
        
        document.getElementById('currentPeriodText').textContent = `Period ${period}`;
        document.getElementById('periodTitle').textContent = `Period ${period}`;
        document.getElementById('periodTime').textContent = timeInfo.display;
    },

    // Update field position displays
    updatePositions() {
        SoccerConfig.positions.forEach(position => {
            const slot = document.querySelector(`[data-position="${position}"]`);
            if (!slot) return;
            
            const currentLineup = LineupManager.getCurrentLineup();
            const playerName = currentLineup.positions[position];
            const playerNameDiv = slot.querySelector('.player-name');
            const label = slot.querySelector('.position-label');
            
            if (playerName) {
                // Check for substitution info
                const substitutedPlayer = LineupManager.getSubstitutionInfo(
                    LineupManager.getCurrentPeriod(), 
                    position
                );
                
                if (substitutedPlayer) {
                    playerNameDiv.innerHTML = `${playerName}<div class="field-substitution-info">(${substitutedPlayer})</div>`;
                } else {
                    playerNameDiv.textContent = playerName;
                }
                
                label.style.fontSize = '0.6rem';
                slot.classList.add('filled');
            } else {
                playerNameDiv.textContent = '';
                label.style.fontSize = '0.75rem';
                slot.classList.remove('filled');
            }
        });
    },

    // Update bench area displays
    updateBench() {
        this.updateBenchArea('benchArea', 'benchEmpty', 'bench', 'bench-player');
        this.updateBenchArea('jerseyArea', 'jerseyEmpty', 'jersey', 'bench-player', {
            backgroundColor: '#8B5CF6',
            suffix: ' (Jersey)'
        });
    },

    updateBenchArea(areaId, emptyId, dataKey, playerClass, customStyle = {}) {
        const area = document.getElementById(areaId);
        const emptyMessage = document.getElementById(emptyId);
        const currentLineup = LineupManager.getCurrentLineup();
        const players = currentLineup[dataKey] || [];
        
        // Remove existing player elements
        area.querySelectorAll(`.${playerClass}`).forEach(el => el.remove());
        
        if (players.length === 0) {
            emptyMessage.style.display = 'block';
        } else {
            emptyMessage.style.display = 'none';
            players.forEach(playerName => {
                const playerDiv = document.createElement('div');
                playerDiv.className = playerClass;
                playerDiv.textContent = playerName + (customStyle.suffix || '');
                
                if (customStyle.backgroundColor) {
                    playerDiv.style.backgroundColor = customStyle.backgroundColor;
                }
                
                playerDiv.addEventListener('click', () => {
                    LineupManager.removePlayerFromAll(playerName);
                    this.updateDisplay();
                });
                
                area.appendChild(playerDiv);
            });
        }
    },

    // Render player list in sidebar
    renderPlayerList() {
        const playerList = document.getElementById('playerList');
        const playerNames = SoccerConfig.utils.getPlayerNames();
        
        const playerCards = playerNames.map(playerName => {
            return EnhancedStats.generateEnhancedPlayerCard(playerName);
        }).join('');
        
        playerList.innerHTML = playerCards;
    },

    // Update player cards with current assignment status
    updatePlayerList() {
        const playerCards = document.querySelectorAll('.player-card');
        playerCards.forEach(card => {
            const playerName = card.dataset.player;
            const stats = LineupManager.calculatePlayerStats(playerName);
            const isAssigned = LineupManager.isPlayerAssigned(playerName);
            
            // Update time display
            const timeSpan = card.querySelector('.player-time');
            timeSpan.textContent = `${stats.totalMinutes}min`;
            
            // Update bench periods
            const benchStat = card.querySelector('.stat-line span:last-child');
            benchStat.textContent = stats.benchPeriods + stats.jerseyPeriods;
            
            // Update position badges
            const positionBadges = card.querySelector('.position-badges');
            const activeBadges = Object.entries(stats.positions)
                .filter(([pos, count]) => count > 0)
                .map(([pos, count]) => `<span class="position-badge">${SoccerConfig.utils.getPositionAbbrev(pos)}:${count}</span>`)
                .join('');
            
            positionBadges.innerHTML = activeBadges || '<span class="position-badge">Not assigned</span>';
            
            // Update assignment status
            if (isAssigned) {
                card.classList.add('assigned');
            } else {
                card.classList.remove('assigned');
            }
        });
    },

    // Update quick stats panel
    updateQuickStats() {
        const statsDiv = document.getElementById('quickStats');
        statsDiv.innerHTML = EnhancedStats.generateEnhancedQuickStats();
        
        // Show validation warnings if needed
        EnhancedStats.showValidationWarnings();
    },

    // Update navigation button states
    updateNavigationButtons() {
        const currentPeriod = LineupManager.getCurrentPeriod();
        document.getElementById('prevBtn').disabled = currentPeriod === 1;
        document.getElementById('nextBtn').disabled = currentPeriod === SoccerConfig.gameSettings.totalPeriods;
    },

    // View switching
    toggleView() {
        this.isTableView = !this.isTableView;
        const fieldView = document.getElementById('fieldView');
        const tableView = document.getElementById('tableView');
        const viewToggle = document.getElementById('viewToggle');
        const mainContent = document.querySelector('.main-content');
        const periodNav = document.querySelector('.period-nav');
        
        if (this.isTableView) {
            mainContent.style.display = 'none';
            tableView.style.display = 'block';
            periodNav.classList.add('hidden');
            viewToggle.textContent = '⚽ Field View';
            this.renderLineupTable();
        } else {
            mainContent.style.display = 'grid';
            tableView.style.display = 'none';
            periodNav.classList.remove('hidden');
            viewToggle.textContent = '📊 Table View';
        }
    },

    // Render complete lineup table
    renderLineupTable() {
        const tbody = document.getElementById('lineupTableBody');
        const playerNames = SoccerConfig.utils.getPlayerNames();
        const fullLineup = LineupManager.getFullLineup();
        
        tbody.innerHTML = playerNames.map(playerName => {
            const stats = LineupManager.calculatePlayerStats(playerName);
            
            // Generate cells for each period
            const periodCells = [];
            for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
                let cellContent = '';
                let cellClass = '';
                
                const periodData = fullLineup[period];
                
                // Check jersey preparation
                if (periodData.jersey && periodData.jersey.includes(playerName)) {
                    cellContent = 'JERSEY';
                    cellClass = 'jersey';
                }
                // Check bench
                else if (periodData.bench.includes(playerName)) {
                    cellContent = 'BENCH';
                    cellClass = 'bench';
                } else {
                    // Check field positions
                    for (const [position, assignedPlayer] of Object.entries(periodData.positions)) {
                        if (assignedPlayer === playerName) {
                            cellContent = SoccerConfig.utils.getPositionAbbrev(position);
                            cellClass = SoccerConfig.utils.getPositionClass(position);
                            
                            // Check for substitution
                            const substitutedPlayer = LineupManager.getSubstitutionInfo(period, position);
                            if (substitutedPlayer) {
                                cellContent += `<span class="substitution-info">(${substitutedPlayer})</span>`;
                            }
                            break;
                        }
                    }
                }
                
                if (cellContent) {
                    periodCells.push(`<td><span class="position-cell ${cellClass}">${cellContent}</span></td>`);
                } else {
                    periodCells.push(`<td>-</td>`);
                }
            }
            
            // Create stats summary
            const positionCounts = Object.entries(stats.positions)
                .filter(([pos, count]) => count > 0)
                .map(([pos, count]) => `${SoccerConfig.utils.getPositionAbbrev(pos)}:${count}`)
                .join(', ');
            
            const statsContent = `
                <div class="table-stats">
                    <div><strong>${stats.totalMinutes} min</strong></div>
                    <div>${stats.benchPeriods + stats.jerseyPeriods} sits</div>
                    <div>${positionCounts || 'No positions'}</div>
                </div>
            `;
            
            return `
                <tr>
                    <td>${playerName}</td>
                    ${periodCells.join('')}
                    <td>${statsContent}</td>
                </tr>
            `;
        }).join('');
    },

    // Show visual feedback for drag operations
    showDropFeedback(element, isValid) {
        if (isValid) {
            element.classList.add('drop-target');
        } else {
            element.classList.remove('drop-target');
        }
    },

    // Show tooltip (for future enhancements)
    showTooltip(x, y, text) {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.textContent = text;
            tooltip.style.left = x + 'px';
            tooltip.style.top = y + 'px';
            tooltip.classList.add('show');
        }
    },

    hideTooltip() {
        const tooltip = document.getElementById('tooltip');
        if (tooltip) {
            tooltip.classList.remove('show');
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}