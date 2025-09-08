// UI Management Module
// Handles all DOM interactions, view updates, and visual feedback

const UIManager = {
    // State tracking
    isTableView: false,

    // Initialize UI components
    init() {
        this.updateDisplay();
        this.updateNavigationButtons();
        this.initializeMobileNavButton();
    },

    // Initialize mobile navigation button text
    initializeMobileNavButton() {
        const mobileViewIcon = document.getElementById('mobileViewIcon');
        const mobileViewText = document.getElementById('mobileViewText');
        
        // Start in field view, so show "Table" option
        if (mobileViewIcon) mobileViewIcon.textContent = '📊';
        if (mobileViewText) mobileViewText.textContent = 'Table';
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
        
        // Update period transition display
        if (window.PeriodTransitionUI) {
            PeriodTransitionUI.updatePeriodChangesDisplay();
        }
        
        // Update mobile timer display
        if (window.MobileTimerUI) {
            MobileTimerUI.onPeriodChange();
        }
        
        // Update mobile navigation consistency
        if (window.MobileNavigation) {
            MobileNavigation.updateNavigationButtons();
        }
        
        // Update progressive disclosure features
        if (window.ProgressiveDisclosure) {
            ProgressiveDisclosure.syncTimerDisplays();
            ProgressiveDisclosure.syncPeriodChangesDisplays();
        }
    },

    // Period information updates
    updatePeriodInfo() {
        const period = LineupManager.getCurrentPeriod();
        const timeInfo = SoccerConfig.utils.getPeriodTime(period);
        
        const currentPeriodText = document.getElementById('currentPeriodText');
        const periodTitle = document.getElementById('periodTitle');
        const periodTime = document.getElementById('periodTime');
        
        if (currentPeriodText) currentPeriodText.textContent = `Period ${period}`;
        if (periodTitle) periodTitle.textContent = `Period ${period}`;
        if (periodTime) periodTime.textContent = timeInfo.display;
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
            
            // Skip if essential elements don't exist
            if (!playerNameDiv) {
                console.warn(`Player name div not found for position: ${position}`);
                return;
            }
            
            if (playerName) {
                // Check for substitution info
                const substitutedPlayer = LineupManager.getSubstitutionInfo(
                    LineupManager.getCurrentPeriod(), 
                    position
                );
                
                // Get player availability status
                const availability = window.PlayerAvailability ? 
                    PlayerAvailability.getPlayerAvailability(playerName) : null;
                const statusInfo = availability ? 
                    PlayerAvailability.getStatusDisplayInfo(availability.status) : null;
                
                let playerDisplayContent = playerName;
                if (statusInfo && availability.status !== 'available') {
                    playerDisplayContent = `${playerName} <span class="field-availability-badge" style="background-color: ${statusInfo.color}" title="${statusInfo.description}">${statusInfo.emoji}</span>`;
                }
                
                if (substitutedPlayer) {
                    playerNameDiv.innerHTML = `${playerDisplayContent}<div class="field-substitution-info">(${substitutedPlayer})</div>`;
                } else {
                    playerNameDiv.innerHTML = playerDisplayContent;
                }
                
                // Add availability class to position slot
                if (availability) {
                    slot.classList.add(`field-availability-${availability.status}`);
                } else {
                    // Remove any existing availability classes
                    slot.classList.remove('field-availability-injured', 'field-availability-absent', 'field-availability-late');
                }
                
                if (label) label.style.fontSize = '0.6rem';
                slot.classList.add('filled');
            } else {
                playerNameDiv.textContent = '';
                if (label) label.style.fontSize = '0.75rem';
                slot.classList.remove('filled');
                // Remove any existing availability classes
                slot.classList.remove('field-availability-injured', 'field-availability-absent', 'field-availability-late');
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
        
        if (!area) {
            console.warn(`Bench area not found: ${areaId}`);
            return;
        }
        
        const currentLineup = LineupManager.getCurrentLineup();
        const players = currentLineup[dataKey] || [];
        
        // Remove existing player elements
        area.querySelectorAll(`.${playerClass}`).forEach(el => el.remove());
        
        if (players.length === 0) {
            if (emptyMessage) emptyMessage.style.display = 'block';
        } else {
            if (emptyMessage) emptyMessage.style.display = 'none';
            players.forEach(playerName => {
                const playerDiv = document.createElement('div');
                playerDiv.className = playerClass;
                
                // Get player availability status
                const availability = window.PlayerAvailability ? 
                    PlayerAvailability.getPlayerAvailability(playerName) : null;
                const statusInfo = availability ? 
                    PlayerAvailability.getStatusDisplayInfo(availability.status) : null;
                
                let playerDisplayContent = playerName + (customStyle.suffix || '');
                if (statusInfo && availability.status !== 'available') {
                    playerDisplayContent += ` ${statusInfo.emoji}`;
                    playerDiv.classList.add(`bench-availability-${availability.status}`);
                }
                
                playerDiv.textContent = playerDisplayContent;
                
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
        if (!playerList) {
            console.warn('Player list element not found');
            return;
        }
        
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
            if (timeSpan) timeSpan.textContent = `${stats.totalMinutes}min`;
            
            // Update bench periods
            const benchStat = card.querySelector('.stat-line span:last-child');
            if (benchStat) benchStat.textContent = stats.benchPeriods + stats.jerseyPeriods;
            
            // Update position badges
            const positionBadges = card.querySelector('.position-badges');
            if (positionBadges) {
                const activeBadges = Object.entries(stats.positions)
                    .filter(([pos, count]) => count > 0)
                    .map(([pos, count]) => `<span class="position-badge">${SoccerConfig.utils.getPositionAbbrev(pos)}:${count}</span>`)
                    .join('');
                
                positionBadges.innerHTML = activeBadges || '<span class="position-badge">Not assigned</span>';
            }
            
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
        const prevBtn = document.getElementById('prevBtn');
        const nextBtn = document.getElementById('nextBtn');
        
        if (prevBtn) prevBtn.disabled = currentPeriod === 1;
        if (nextBtn) nextBtn.disabled = currentPeriod === SoccerConfig.gameSettings.totalPeriods;
    },

    // View switching
    toggleView() {
        this.isTableView = !this.isTableView;
        const fieldView = document.getElementById('fieldView');
        const tableView = document.getElementById('tableView');
        const viewToggle = document.getElementById('viewToggle');
        const mainContent = document.querySelector('.main-content');
        const periodNav = document.querySelector('.period-nav');
        
        // Mobile bottom nav elements
        const mobileViewIcon = document.getElementById('mobileViewIcon');
        const mobileViewText = document.getElementById('mobileViewText');
        
        if (this.isTableView) {
            if (mainContent) mainContent.style.display = 'none';
            if (tableView) tableView.style.display = 'block';
            if (periodNav) periodNav.classList.add('hidden');
            if (viewToggle) viewToggle.textContent = '⚽ Field View';
            
            // Update mobile nav to show "Field" when in table view
            if (mobileViewIcon) mobileViewIcon.textContent = '⚽';
            if (mobileViewText) mobileViewText.textContent = 'Field';
            
            this.renderLineupTable();
            this.updateTableTeamHeader();
        } else {
            if (mainContent) mainContent.style.display = 'grid';
            if (tableView) tableView.style.display = 'none';
            if (periodNav) periodNav.classList.remove('hidden');
            if (viewToggle) viewToggle.textContent = '📊 Table View';
            
            // Update mobile nav to show "Table" when in field view
            if (mobileViewIcon) mobileViewIcon.textContent = '📊';
            if (mobileViewText) mobileViewText.textContent = 'Table';
        }
    },

    // Render complete lineup table
    renderLineupTable() {
        const tbody = document.getElementById('lineupTableBody');
        if (!tbody) {
            console.warn('Lineup table body not found');
            return;
        }
        
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
                    periodCells.push(`<td style="text-align: center;"><span class="position-cell ${cellClass}">${cellContent}</span></td>`);
                } else {
                    periodCells.push(`<td style="text-align: center;">-</td>`);
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
    },

    // Update table view team header
    updateTableTeamHeader() {
        const headerRow = document.getElementById('tableTeamHeader');
        const teamNameElement = document.getElementById('tableTeamName');
        const teamLogoElement = document.getElementById('tableTeamLogo');
        const teamLogoImg = document.getElementById('tableTeamLogoImg');
        
        if (!headerRow || !teamNameElement) return;
        
        const activeTeam = TeamManager.getActiveTeam();
        
        if (activeTeam) {
            // Show team name
            teamNameElement.textContent = activeTeam.name;
            
            // Show team logo if available
            if (activeTeam.logo && teamLogoImg) {
                teamLogoImg.src = activeTeam.logo;
                teamLogoElement.style.display = 'inline-flex';
            } else {
                teamLogoElement.style.display = 'none';
            }
            
            // Show the header row
            headerRow.style.display = 'table-row';
        } else {
            // Hide the header row if no active team
            headerRow.style.display = 'none';
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIManager;
}