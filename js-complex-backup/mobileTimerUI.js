// Mobile Timer UI Manager
// Handles the mobile timer page display and navigation

const MobileTimerUI = {
    currentView: 'field', // 'field', 'table', or 'timer'
    
    // Initialize mobile timer UI
    init() {
        this.updateMobileTimerDisplay();
        this.updateMobilePeriodChanges();
    },

    // Show timer page
    showTimerPage() {
        // Hide other views
        this.hideAllViews();
        
        // Show timer page
        const timerPage = document.getElementById('mobileTimerPage');
        if (timerPage) {
            timerPage.style.display = 'block';
        }
        
        this.currentView = 'timer';
        this.updateMobileNavState();
        this.updateMobileTimerDisplay();
        this.updateMobilePeriodChanges();
    },

    // Show field view
    showFieldView() {
        this.hideAllViews();
        
        const mainContent = document.querySelector('.main-content');
        if (mainContent) {
            mainContent.style.display = 'grid';
        }
        
        this.currentView = 'field';
        this.updateMobileNavState();
        
        // Update main UI
        if (window.UIManager) {
            UIManager.isTableView = false;
            UIManager.updateDisplay();
        }
    },

    // Show table view
    showTableView() {
        this.hideAllViews();
        
        const tableView = document.getElementById('tableView');
        if (tableView) {
            tableView.style.display = 'block';
        }
        
        this.currentView = 'table';
        this.updateMobileNavState();
        
        // Update main UI
        if (window.UIManager) {
            UIManager.isTableView = true;
            UIManager.updateDisplay();
        }
    },

    // Hide all main views
    hideAllViews() {
        const mainContent = document.querySelector('.main-content');
        const tableView = document.getElementById('tableView');
        const timerPage = document.getElementById('mobileTimerPage');
        
        if (mainContent) mainContent.style.display = 'none';
        if (tableView) tableView.style.display = 'none';
        if (timerPage) timerPage.style.display = 'none';
    },

    // Update mobile navigation button states
    updateMobileNavState() {
        const fieldButton = document.getElementById('mobileViewToggle');
        const timerButton = document.getElementById('mobileTimerToggle');
        
        if (fieldButton) {
            const icon = fieldButton.querySelector('.icon');
            const text = fieldButton.querySelector('span:last-child');
            
            if (this.currentView === 'timer') {
                if (icon) icon.textContent = '⚽';
                if (text) text.textContent = 'Field';
            } else if (this.currentView === 'field') {
                if (icon) icon.textContent = '📊';
                if (text) text.textContent = 'Table';
            } else { // table view
                if (icon) icon.textContent = '⚽';
                if (text) text.textContent = 'Field';
            }
        }
        
        // Update timer button appearance
        if (timerButton) {
            if (this.currentView === 'timer') {
                timerButton.classList.add('active');
            } else {
                timerButton.classList.remove('active');
            }
        }
    },

    // Toggle between field and table (called by existing mobile nav button)
    toggleFieldTable() {
        if (this.currentView === 'field') {
            this.showTableView();
        } else {
            this.showFieldView();
        }
    },

    // Update mobile timer display
    updateMobileTimerDisplay() {
        const mobileTimerDisplay = document.getElementById('mobileGameTimerDisplay');
        const mobileCurrentPeriod = document.getElementById('mobileCurrentPeriod');
        const mobilePeriodTime = document.getElementById('mobilePeriodTime');
        const mobileProgressBar = document.getElementById('mobilePeriodProgressBar');
        const mobileTimerBtn = document.getElementById('mobileTimerToggleBtn');

        if (mobileTimerDisplay && window.PeriodTimer) {
            // Update timer display
            const totalMinutes = Math.floor(PeriodTimer.gameTimer.currentTime / 60);
            const seconds = PeriodTimer.gameTimer.currentTime % 60;
            mobileTimerDisplay.textContent = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }

        if (mobileCurrentPeriod && window.LineupManager) {
            const currentPeriod = LineupManager.getCurrentPeriod();
            mobileCurrentPeriod.textContent = `Period ${currentPeriod}`;
        }

        if (mobilePeriodTime && window.SoccerConfig && window.LineupManager) {
            const currentPeriod = LineupManager.getCurrentPeriod();
            const timeInfo = SoccerConfig.utils.getPeriodTime(currentPeriod);
            mobilePeriodTime.textContent = timeInfo.display;
        }

        if (mobileProgressBar && window.PeriodTimer) {
            const periodLength = SoccerConfig.gameSettings.periodLength * 60; // Convert to seconds
            const timeInCurrentPeriod = PeriodTimer.gameTimer.currentTime % periodLength;
            const progress = (timeInCurrentPeriod / periodLength) * 100;
            
            mobileProgressBar.style.width = Math.min(progress, 100) + '%';
            
            // Color based on remaining time
            const remainingTime = periodLength - timeInCurrentPeriod;
            if (remainingTime <= 60) { // Last minute
                mobileProgressBar.style.backgroundColor = '#ef4444';
            } else if (remainingTime <= 180) { // Last 3 minutes
                mobileProgressBar.style.backgroundColor = '#f59e0b';
            } else {
                mobileProgressBar.style.backgroundColor = '#10b981';
            }
        }

        if (mobileTimerBtn && window.PeriodTimer) {
            mobileTimerBtn.textContent = PeriodTimer.gameTimer.isRunning ? '⏸️ Pause' : '▶️ Start';
            mobileTimerBtn.classList.toggle('running', PeriodTimer.gameTimer.isRunning);
        }
    },

    // Update mobile period changes
    updateMobilePeriodChanges() {
        const element = document.getElementById('mobilePeriodChangesList');
        if (!element) {
            return;
        }

        // Get lineup data directly without depending on PeriodTransitionUI
        const currentPeriod = LineupManager.getCurrentPeriod();
        const nextPeriod = currentPeriod + 1;

        if (nextPeriod > SoccerConfig.gameSettings.totalPeriods) {
            element.innerHTML = '<div class="no-changes">Game Complete</div>';
            return;
        }

        // Get lineup data directly
        const fullLineup = LineupManager.getFullLineup();
        const currentLineup = fullLineup[currentPeriod];
        const nextLineup = fullLineup[nextPeriod];
        
        if (!currentLineup || !nextLineup) {
            element.innerHTML = '<div class="no-changes">Lineup data not available</div>';
            return;
        }

        // Check if periods have data
        const hasCurrentData = Object.values(currentLineup.positions).some(p => p !== null) || currentLineup.bench.length > 0;
        const hasNextData = Object.values(nextLineup.positions).some(p => p !== null) || nextLineup.bench.length > 0;
        
        if (!hasCurrentData && !hasNextData) {
            element.innerHTML = '<div class="no-changes">Both periods are empty. Use AutoFill or assign players.</div>';
            return;
        } else if (!hasCurrentData) {
            element.innerHTML = `<div class="no-changes">Period ${currentPeriod} is empty. Assign players to see changes.</div>`;
            return;
        } else if (!hasNextData) {
            element.innerHTML = `<div class="no-changes">Period ${nextPeriod} is empty. Use AutoFill or set up next period.</div>`;
            return;
        }

        // Find actual changes between periods
        const changes = [];
        
        SoccerConfig.positions.forEach(position => {
            const currentPlayer = currentLineup.positions[position];
            const nextPlayer = nextLineup.positions[position];

            if (currentPlayer !== nextPlayer && nextPlayer) {
                // Check if player is coming from bench
                const isFromBench = currentLineup.bench.includes(nextPlayer);
                
                const positionAbbrev = SoccerConfig.positionAbbreviations[position];
                const positionClass = SoccerConfig.positionClasses[position];
                
                if (isFromBench) {
                    changes.push(`<div class="period-change">🪑 <strong>${nextPlayer}</strong> (from bench) → <span class="position-square ${positionClass}">${positionAbbrev}</span>${currentPlayer ? ` replacing ${currentPlayer}` : ''}</div>`);
                } else if (currentPlayer) {
                    changes.push(`<div class="period-change"><span class="position-square ${positionClass}">${positionAbbrev}</span> <strong>${currentPlayer}</strong> → <strong>${nextPlayer}</strong></div>`);
                } else {
                    changes.push(`<div class="period-change"><strong>${nextPlayer}</strong> → <span class="position-square ${positionClass}">${positionAbbrev}</span></div>`);
                }
            }
        });

        if (changes.length === 0) {
            element.innerHTML = `<div class="no-changes">No differences between Period ${currentPeriod} and ${nextPeriod}.</div>`;
        } else {
            element.innerHTML = changes.join('');
        }
    },

    // Handle period change updates
    onPeriodChange() {
        this.updateMobileTimerDisplay();
        this.updateMobilePeriodChanges();
    },

    // Get current view
    getCurrentView() {
        return this.currentView;
    }
};

// Global functions for mobile navigation
function showTimerPage() {
    MobileTimerUI.showTimerPage();
}

function toggleMobileView() {
    MobileTimerUI.toggleFieldTable();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MobileTimerUI;
}