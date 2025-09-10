// Game Manager UI Module
// Handles the user interface for game management and history

const GameManagerUI = {
    currentView: 'games', // 'games', 'history', 'stats'
    isOpen: false,
    
    // Initialize UI
    init() {
        this.createGameManagementModal();
        this.setupEventListeners();
    },

    // Create the game management modal
    createGameManagementModal() {
        // Remove any existing modal
        const existingModal = document.getElementById('gameManagementModal');
        if (existingModal) {
            existingModal.remove();
        }

        const gameModal = document.createElement('div');
        gameModal.id = 'gameManagementModal';
        gameModal.className = 'modal';
        gameModal.style.display = 'none';
        gameModal.innerHTML = `
            <div class="modal-content game-modal-content">
                <span class="close" id="closeGameModal">&times;</span>
                <h2>🎮 Game Management</h2>
                <div class="game-controls">
                    <div class="game-tabs">
                        <button id="gamesTab" class="tab-button active" data-view="games">Current Game</button>
                        <button id="historyTab" class="tab-button" data-view="history">Game History</button>
                        <button id="statsTab" class="tab-button" data-view="stats">Team Stats</button>
                    </div>
                    
                    <!-- Current Game View -->
                    <div id="gamesView" class="game-view active">
                        <div class="current-game-info">
                            <div id="currentGameDisplay">No game selected</div>
                            <div class="game-actions">
                                <button id="newGameBtn" class="btn btn-primary">New Game</button>
                                <button id="loadGameBtn" class="btn btn-secondary">Load Game</button>
                                <button id="saveGameBtn" class="btn btn-success" style="display:none;">Save Game</button>
                                <button id="completeGameBtn" class="btn btn-warning" style="display:none;">Complete Game</button>
                            </div>
                        </div>
                    </div>
                    
                    <!-- Game History View -->
                    <div id="historyView" class="game-view" style="display:none;">
                        <div class="history-controls">
                            <input type="text" id="historySearch" placeholder="Search games..." class="search-input">
                            <select id="historyFilter" class="filter-select">
                                <option value="all">All Games</option>
                                <option value="completed">Completed</option>
                                <option value="active">Active</option>
                            </select>
                        </div>
                        <div id="gameHistoryList" class="game-history-list">
                            <p>No games found</p>
                        </div>
                    </div>
                    
                    <!-- Team Stats View -->
                    <div id="statsView" class="game-view" style="display:none;">
                        <div id="teamStatsDisplay" class="team-stats-display">
                            <p>No statistics available</p>
                        </div>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(gameModal);
        
        // Create sub-modals
        this.createSubModals();
    },

    // Create sub-modals for new game and complete game
    createSubModals() {
        // New Game Modal
        const newGameModal = document.createElement('div');
        newGameModal.id = 'newGameModal';
        newGameModal.className = 'modal';
        newGameModal.style.display = 'none';
        newGameModal.innerHTML = `
            <div class="modal-content">
                <span class="close" id="closeNewGameModal">&times;</span>
                <h3>Create New Game</h3>
                <form id="newGameForm">
                    <div class="form-group">
                        <label for="gameOpponent">Opponent:</label>
                        <input type="text" id="gameOpponent" required placeholder="Team name">
                    </div>
                    <div class="form-group">
                        <label for="gameDate">Date:</label>
                        <input type="date" id="gameDate" required>
                    </div>
                    <div class="form-group">
                        <label for="gameLocation">Location:</label>
                        <input type="text" id="gameLocation" placeholder="Field/venue (optional)">
                    </div>
                    <div class="form-group">
                        <label for="gameType">Game Type:</label>
                        <select id="gameType">
                            <option value="regular">Regular Game</option>
                            <option value="tournament">Tournament</option>
                            <option value="friendly">Friendly Match</option>
                        </select>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-primary">Create Game</button>
                        <button type="button" class="btn btn-secondary" id="cancelNewGame">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        // Complete Game Modal
        const completeGameModal = document.createElement('div');
        completeGameModal.id = 'completeGameModal';
        completeGameModal.className = 'modal';
        completeGameModal.style.display = 'none';
        completeGameModal.innerHTML = `
            <div class="modal-content">
                <span class="close" id="closeCompleteGameModal">&times;</span>
                <h3>Complete Game</h3>
                <form id="completeGameForm">
                    <div class="form-group">
                        <label for="finalScore">Final Score (optional):</label>
                        <div class="score-input">
                            <input type="number" id="homeScore" placeholder="Us" min="0">
                            <span>-</span>
                            <input type="number" id="awayScore" placeholder="Them" min="0">
                        </div>
                    </div>
                    <div class="form-group">
                        <label for="gameNotes">Game Notes:</label>
                        <textarea id="gameNotes" placeholder="Game summary, highlights, etc..."></textarea>
                    </div>
                    <div class="form-actions">
                        <button type="submit" class="btn btn-success">Complete Game</button>
                        <button type="button" class="btn btn-secondary" id="cancelCompleteGame">Cancel</button>
                    </div>
                </form>
            </div>
        `;
        
        document.body.appendChild(newGameModal);
        document.body.appendChild(completeGameModal);
    },

    // Setup event listeners
    setupEventListeners() {
        // Main modal close
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeGameModal' || e.target.id === 'gameManagementModal') {
                if (e.target.id === 'gameManagementModal') this.close();
                else this.close();
            }
        });
    },

    // Open the game management modal
    open() {
        console.log('GameManagerUI.open() called');
        const modal = document.getElementById('gameManagementModal');
        console.log('Modal element found:', modal);
        
        if (modal) {
            console.log('Setting modal display to flex');
            modal.style.display = 'flex';
            this.isOpen = true;
            this.refreshGameInfo();
            this.setupModalEventListeners();
            console.log('Modal should now be visible');
        } else {
            console.error('gameManagementModal element not found');
            alert('Game Management modal not found. The modal may not have been created properly.');
        }
    },

    // Close the game management modal
    close() {
        const modal = document.getElementById('gameManagementModal');
        if (modal) {
            modal.style.display = 'none';
            this.isOpen = false;
        }
    },

    // Setup event listeners for modal content
    setupModalEventListeners() {
        // Tab switching
        document.querySelectorAll('#gameManagementModal .tab-button').forEach(button => {
            button.addEventListener('click', (e) => {
                this.switchView(e.target.dataset.view);
            });
        });

        // New game
        const newGameBtn = document.getElementById('newGameBtn');
        newGameBtn?.addEventListener('click', () => this.showNewGameModal());

        // Load game
        const loadGameBtn = document.getElementById('loadGameBtn');
        loadGameBtn?.addEventListener('click', () => this.showGameHistory());

        // Save game
        const saveGameBtn = document.getElementById('saveGameBtn');
        saveGameBtn?.addEventListener('click', () => this.saveCurrentGame());

        // Complete game
        const completeGameBtn = document.getElementById('completeGameBtn');
        completeGameBtn?.addEventListener('click', () => this.showCompleteGameModal());

        // Modal controls
        this.setupModalListeners();

        // Search and filter
        const historySearch = document.getElementById('historySearch');
        historySearch?.addEventListener('input', () => this.filterGameHistory());
        
        const historyFilter = document.getElementById('historyFilter');
        historyFilter?.addEventListener('change', () => this.filterGameHistory());
    },

    // Setup modal event listeners
    setupModalListeners() {
        // New game modal
        const newGameModal = document.getElementById('newGameModal');
        const closeNewGameModal = document.getElementById('closeNewGameModal');
        const cancelNewGame = document.getElementById('cancelNewGame');
        const newGameForm = document.getElementById('newGameForm');

        closeNewGameModal?.addEventListener('click', () => this.hideNewGameModal());
        cancelNewGame?.addEventListener('click', () => this.hideNewGameModal());
        newGameForm?.addEventListener('submit', (e) => this.createNewGame(e));

        // Complete game modal
        const completeGameModal = document.getElementById('completeGameModal');
        const closeCompleteGameModal = document.getElementById('closeCompleteGameModal');
        const cancelCompleteGame = document.getElementById('cancelCompleteGame');
        const completeGameForm = document.getElementById('completeGameForm');

        closeCompleteGameModal?.addEventListener('click', () => this.hideCompleteGameModal());
        cancelCompleteGame?.addEventListener('click', () => this.hideCompleteGameModal());
        completeGameForm?.addEventListener('submit', (e) => this.completeCurrentGame(e));

        // Close modals when clicking outside
        window.addEventListener('click', (e) => {
            if (e.target === newGameModal) this.hideNewGameModal();
            if (e.target === completeGameModal) this.hideCompleteGameModal();
        });
    },

    // Switch between views
    switchView(viewName) {
        this.currentView = viewName;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-view="${viewName}"]`)?.classList.add('active');

        // Update view content
        document.querySelectorAll('.game-view').forEach(view => {
            view.style.display = 'none';
        });
        document.getElementById(`${viewName}View`).style.display = 'block';

        // Load view-specific content
        switch(viewName) {
            case 'games':
                this.refreshGameInfo();
                break;
            case 'history':
                this.loadGameHistory();
                break;
            case 'stats':
                this.loadTeamStats();
                break;
        }
    },

    // Refresh current game info
    refreshGameInfo() {
        const display = document.getElementById('currentGameDisplay');
        const saveBtn = document.getElementById('saveGameBtn');
        const completeBtn = document.getElementById('completeGameBtn');
        
        const currentGame = PersistentStorage.getCurrentGame();
        
        if (currentGame) {
            const gameDate = new Date(currentGame.date).toLocaleDateString();
            display.innerHTML = `
                <div class="current-game-card">
                    <h4>${currentGame.opponent}</h4>
                    <p><strong>Date:</strong> ${gameDate}</p>
                    <p><strong>Location:</strong> ${currentGame.location || 'TBD'}</p>
                    <p><strong>Type:</strong> ${currentGame.gameType || 'Regular'}</p>
                    <p><strong>Status:</strong> <span class="status ${currentGame.status}">${currentGame.status}</span></p>
                    <p><strong>Team:</strong> ${currentGame.teamName}</p>
                </div>
            `;
            saveBtn.style.display = 'inline-block';
            completeBtn.style.display = currentGame.status === 'active' ? 'inline-block' : 'none';
        } else {
            display.innerHTML = '<p class="no-game">No game selected. Create a new game or load an existing one.</p>';
            saveBtn.style.display = 'none';
            completeBtn.style.display = 'none';
        }
    },

    // Show new game modal
    showNewGameModal() {
        // Check multiple sources for current team
        let currentTeam = null;
        let teamName = 'Unknown Team';
        
        // Check TeamManager first (most reliable)
        if (window.TeamManager?.currentTeam) {
            currentTeam = TeamManager.currentTeam.id;
            teamName = TeamManager.currentTeam.name;
        }
        // Check PersistentStorage
        else if (PersistentStorage?.getCurrentTeamId()) {
            currentTeam = PersistentStorage.getCurrentTeamId();
            const teamData = PersistentStorage.getTeam(currentTeam);
            if (teamData) {
                teamName = teamData.name;
            }
        }
        // Check if there are players loaded (fallback)
        else if (window.SoccerConfig?.players && Object.keys(SoccerConfig.players).length > 0) {
            // Create a temporary team from current players
            currentTeam = 'temp_team_' + Date.now();
            teamName = 'Current Team';
        }
        
        if (!currentTeam) {
            if (window.ToastManager) {
                ToastManager.show('Please select a team first', 'error');
            } else {
                alert('Please select a team first');
            }
            return;
        }

        const modal = document.getElementById('newGameModal');
        const dateField = document.getElementById('gameDate');
        
        // Set today's date as default
        dateField.value = new Date().toISOString().split('T')[0];
        
        modal.style.display = 'block';
    },

    // Hide new game modal
    hideNewGameModal() {
        const modal = document.getElementById('newGameModal');
        modal.style.display = 'none';
        document.getElementById('newGameForm').reset();
    },

    // Create new game
    createNewGame(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const gameData = {
            opponent: document.getElementById('gameOpponent').value,
            date: document.getElementById('gameDate').value,
            location: document.getElementById('gameLocation').value,
            gameType: document.getElementById('gameType').value
        };

        const gameId = PersistentStorage.createGame(gameData);
        
        if (gameId) {
            this.hideNewGameModal();
            this.refreshGameInfo();
            
            if (window.ToastManager) {
                ToastManager.show(`Game created: ${gameData.opponent}`, 'success');
            }
        }
    },

    // Save current game
    saveCurrentGame() {
        const success = PersistentStorage.saveGameLineup();
        
        if (success) {
            if (window.ToastManager) {
                ToastManager.show('Game lineup saved', 'success');
            }
        } else {
            if (window.ToastManager) {
                ToastManager.show('Failed to save game lineup', 'error');
            }
        }
    },

    // Show complete game modal
    showCompleteGameModal() {
        const currentGame = PersistentStorage.getCurrentGame();
        if (!currentGame) return;
        
        const modal = document.getElementById('completeGameModal');
        modal.style.display = 'block';
    },

    // Hide complete game modal
    hideCompleteGameModal() {
        const modal = document.getElementById('completeGameModal');
        modal.style.display = 'none';
        document.getElementById('completeGameForm').reset();
    },

    // Complete current game
    completeCurrentGame(event) {
        event.preventDefault();
        
        const currentGame = PersistentStorage.getCurrentGame();
        if (!currentGame) return;
        
        const homeScore = document.getElementById('homeScore').value;
        const awayScore = document.getElementById('awayScore').value;
        const notes = document.getElementById('gameNotes').value;
        
        const finalStats = {
            score: {
                home: homeScore ? parseInt(homeScore) : null,
                away: awayScore ? parseInt(awayScore) : null
            },
            notes: notes
        };
        
        const success = PersistentStorage.completeGame(currentGame.id, finalStats);
        
        if (success) {
            this.hideCompleteGameModal();
            this.refreshGameInfo();
            
            if (window.ToastManager) {
                ToastManager.show('Game completed successfully', 'success');
            }
        }
    },

    // Load and display game history
    loadGameHistory() {
        const historyList = document.getElementById('gameHistoryList');
        const games = PersistentStorage.getGameHistory();
        
        if (games.length === 0) {
            historyList.innerHTML = '<p class="no-games">No games found for this team.</p>';
            return;
        }
        
        const html = games.map(game => {
            const gameDate = new Date(game.date).toLocaleDateString();
            const statusClass = game.status === 'completed' ? 'completed' : 
                               game.status === 'active' ? 'active' : 'cancelled';
            
            let scoreDisplay = '';
            if (game.stats?.score?.home !== null && game.stats?.score?.away !== null) {
                scoreDisplay = `<span class="score">${game.stats.score.home} - ${game.stats.score.away}</span>`;
            }
            
            return `
                <div class="game-history-item" data-game-id="${game.id}">
                    <div class="game-info">
                        <h4>${game.opponent} ${scoreDisplay}</h4>
                        <p class="game-date">${gameDate} • ${game.location || 'No location'}</p>
                        <p class="game-type">${game.gameType} • <span class="status ${statusClass}">${game.status}</span></p>
                    </div>
                    <div class="game-actions">
                        <button class="btn btn-small btn-secondary" onclick="GameManagerUI.loadGame('${game.id}')">Load</button>
                        <button class="btn btn-small btn-info" onclick="GameManagerUI.viewGameStats('${game.id}')">Stats</button>
                        <button class="btn btn-small btn-danger" onclick="GameManagerUI.deleteGame('${game.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        historyList.innerHTML = html;
    },

    // Filter game history based on search and filter
    filterGameHistory() {
        const search = document.getElementById('historySearch')?.value.toLowerCase() || '';
        const filter = document.getElementById('historyFilter')?.value || 'all';
        
        const games = PersistentStorage.getGameHistory();
        const filtered = games.filter(game => {
            const matchesSearch = game.opponent.toLowerCase().includes(search) ||
                                game.location.toLowerCase().includes(search);
            
            const matchesFilter = filter === 'all' || game.status === filter;
            
            return matchesSearch && matchesFilter;
        });
        
        this.displayFilteredGames(filtered);
    },

    // Display filtered games
    displayFilteredGames(games) {
        const historyList = document.getElementById('gameHistoryList');
        
        if (games.length === 0) {
            historyList.innerHTML = '<p class="no-games">No games match your search criteria.</p>';
            return;
        }
        
        // Same rendering logic as loadGameHistory
        const html = games.map(game => {
            const gameDate = new Date(game.date).toLocaleDateString();
            const statusClass = game.status === 'completed' ? 'completed' : 
                               game.status === 'active' ? 'active' : 'cancelled';
            
            let scoreDisplay = '';
            if (game.stats?.score?.home !== null && game.stats?.score?.away !== null) {
                scoreDisplay = `<span class="score">${game.stats.score.home} - ${game.stats.score.away}</span>`;
            }
            
            return `
                <div class="game-history-item" data-game-id="${game.id}">
                    <div class="game-info">
                        <h4>${game.opponent} ${scoreDisplay}</h4>
                        <p class="game-date">${gameDate} • ${game.location || 'No location'}</p>
                        <p class="game-type">${game.gameType} • <span class="status ${statusClass}">${game.status}</span></p>
                    </div>
                    <div class="game-actions">
                        <button class="btn btn-small btn-secondary" onclick="GameManagerUI.loadGame('${game.id}')">Load</button>
                        <button class="btn btn-small btn-info" onclick="GameManagerUI.viewGameStats('${game.id}')">Stats</button>
                        <button class="btn btn-small btn-danger" onclick="GameManagerUI.deleteGame('${game.id}')">Delete</button>
                    </div>
                </div>
            `;
        }).join('');
        
        historyList.innerHTML = html;
    },

    // Load a specific game
    loadGame(gameId) {
        const success = PersistentStorage.loadGameLineup(gameId);
        
        if (success) {
            this.switchView('games');
            this.refreshGameInfo();
            
            // Update main UI
            if (window.UIManager) {
                UIManager.updateDisplay();
            }
            
            if (window.ToastManager) {
                const game = PersistentStorage.getGame(gameId);
                ToastManager.show(`Loaded game: ${game.opponent}`, 'success');
            }
        }
    },

    // View game statistics
    viewGameStats(gameId) {
        const game = PersistentStorage.getGame(gameId);
        if (!game) return;
        
        // For now, just show an alert with basic stats
        // Could be enhanced with a detailed modal
        const playerStats = game.stats?.playerStats || {};
        const playerCount = Object.keys(playerStats).length;
        
        let message = `Game: ${game.opponent}\nDate: ${new Date(game.date).toLocaleDateString()}\n`;
        message += `Players with stats: ${playerCount}\n`;
        
        if (game.stats?.score?.home !== null) {
            message += `Score: ${game.stats.score.home} - ${game.stats.score.away}\n`;
        }
        
        if (game.stats?.notes) {
            message += `Notes: ${game.stats.notes}`;
        }
        
        alert(message);
    },

    // Delete a game
    deleteGame(gameId) {
        const game = PersistentStorage.getGame(gameId);
        if (!game) return;
        
        const confirmed = confirm(`Are you sure you want to delete the game against ${game.opponent}?`);
        
        if (confirmed) {
            const success = PersistentStorage.deleteGame(gameId);
            
            if (success) {
                this.loadGameHistory(); // Refresh the list
                
                if (window.ToastManager) {
                    ToastManager.show('Game deleted', 'success');
                }
            }
        }
    },

    // Load and display team statistics
    loadTeamStats() {
        const statsDisplay = document.getElementById('teamStatsDisplay');
        const teamStats = PersistentStorage.getTeamStats();
        
        if (!teamStats || teamStats.completedGames === 0) {
            statsDisplay.innerHTML = '<p class="no-stats">No completed games found for statistics.</p>';
            return;
        }
        
        // Create team summary
        let html = `
            <div class="team-stats-summary">
                <h3>Team Summary</h3>
                <div class="stats-grid">
                    <div class="stat-item">
                        <span class="stat-label">Total Games:</span>
                        <span class="stat-value">${teamStats.totalGames}</span>
                    </div>
                    <div class="stat-item">
                        <span class="stat-label">Completed:</span>
                        <span class="stat-value">${teamStats.completedGames}</span>
                    </div>
                </div>
            </div>
        `;
        
        // Create player stats
        if (Object.keys(teamStats.playerStats).length > 0) {
            html += `
                <div class="player-stats-section">
                    <h3>Player Statistics</h3>
                    <div class="player-stats-table">
                        <div class="stats-header">
                            <span>Player</span>
                            <span>Games</span>
                            <span>Minutes</span>
                            <span>Avg/Game</span>
                        </div>
            `;
            
            Object.entries(teamStats.playerStats)
                .sort((a, b) => b[1].totalMinutes - a[1].totalMinutes)
                .forEach(([playerName, stats]) => {
                    const avgMinutes = Math.round(stats.totalMinutes / stats.gamesPlayed);
                    
                    html += `
                        <div class="stats-row">
                            <span class="player-name">${playerName}</span>
                            <span>${stats.gamesPlayed}</span>
                            <span>${stats.totalMinutes}</span>
                            <span>${avgMinutes}</span>
                        </div>
                    `;
                });
            
            html += `</div></div>`;
        }
        
        statsDisplay.innerHTML = html;
    },

    // Show game history in the history tab
    showGameHistory() {
        this.switchView('history');
    },

    // Update UI when team changes
    onTeamChange() {
        if (this.isOpen) {
            this.refreshGameInfo();
            if (this.currentView === 'history') {
                this.loadGameHistory();
            }
            if (this.currentView === 'stats') {
                this.loadTeamStats();
            }
        }
    }
};

// Global function to open game manager (called from navigation)
function openGameManager() {
    console.log('openGameManager called');
    
    if (typeof GameManagerUI === 'undefined') {
        console.error('GameManagerUI is undefined');
        alert('GameManagerUI not loaded! Please refresh the page.');
        return;
    }
    
    console.log('GameManagerUI found, calling open()');
    try {
        GameManagerUI.open();
        console.log('GameManagerUI.open() completed');
    } catch (error) {
        console.error('Error opening GameManagerUI:', error);
        alert('Error opening Game Manager: ' + error.message);
    }
}

// Global function for completing current game from UI
function completeCurrentGame() {
    const currentGame = PersistentStorage.getCurrentGame();
    if (!currentGame) {
        if (window.ToastManager) {
            ToastManager.show('No active game to complete', 'error');
        }
        return;
    }
    
    // Simple completion without modal - just mark as completed
    const confirmed = confirm(`Complete the current game: "${currentGame.opponent}"?\n\nThis will mark the game as finished and save the current lineup.`);
    
    if (confirmed) {
        const success = PersistentStorage.completeGame(currentGame.id, {
            completedAt: new Date().toISOString(),
            notes: 'Game completed via Quick Complete'
        });
        
        if (success) {
            if (window.ToastManager) {
                ToastManager.show(`Game "${currentGame.opponent}" completed successfully!`, 'success');
            }
            
            // Update UI to reflect game completion
            if (window.GameManagerUI) {
                GameManagerUI.refreshGameInfo();
            }
            
            // Hide the complete game button
            updateGameCompletionUI();
        }
    }
}

// Update UI elements based on game status
function updateGameCompletionUI() {
    const completeBtn = document.getElementById('completeGameBtn');
    const currentGame = PersistentStorage.getCurrentGame();
    
    if (completeBtn) {
        if (currentGame && currentGame.status === 'active') {
            completeBtn.style.display = 'block';
        } else {
            completeBtn.style.display = 'none';
        }
    }
}

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // Wait a bit for other modules to initialize
    setTimeout(() => {
        try {
            GameManagerUI.init();
            console.log('GameManagerUI initialized successfully');
        } catch (error) {
            console.error('GameManagerUI initialization failed:', error);
            alert('GameManagerUI failed to initialize: ' + error.message);
        }
    }, 100);
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GameManagerUI;
}