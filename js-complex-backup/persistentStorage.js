// Persistent Storage Manager
// Handles saving and loading teams and lineups using localStorage

const PersistentStorage = {
    // Storage keys
    STORAGE_KEYS: {
        TEAMS: 'soccer_lineup_teams',
        CURRENT_TEAM: 'soccer_lineup_current_team',
        LINEUPS: 'soccer_lineup_lineups',
        GAMES: 'soccer_lineup_games',
        CURRENT_GAME: 'soccer_lineup_current_game',
        SETTINGS: 'soccer_lineup_settings'
    },
    
    // Initialize storage system
    init() {
        this.migrateOldData();
        this.loadCurrentTeam();
        this.setupAutoSave();
        console.log('Persistent storage initialized');
    },
    
    // Migrate any old data format to new structure
    migrateOldData() {
        try {
            // Check if there's old team data that needs migration
            const oldTeams = localStorage.getItem('soccerTeams');
            const oldCurrentTeamId = localStorage.getItem('currentTeamId');
            
            if (oldTeams) {
                console.log('Migrating old team data...');
                const teams = JSON.parse(oldTeams);
                
                // Migrate all teams to new format
                Object.values(teams).forEach(oldTeam => {
                    const teamData = {
                        id: oldTeam.id,
                        name: oldTeam.name,
                        players: oldTeam.players || {},
                        gameSettings: {},
                        logo: oldTeam.logo,
                        createdAt: oldTeam.created || new Date().toISOString(),
                        lastModified: oldTeam.lastModified || new Date().toISOString()
                    };
                    
                    this.saveTeam(teamData);
                });
                
                // Set current team if it exists
                if (oldCurrentTeamId && teams[oldCurrentTeamId]) {
                    this.setCurrentTeam(oldCurrentTeamId);
                }
                
                console.log('Team migration completed');
                // Don't remove old data yet, in case something goes wrong
                // localStorage.removeItem('soccerTeams');
                // localStorage.removeItem('currentTeamId');
            }
            
            // Also check for old soccerConfig
            const oldConfig = localStorage.getItem('soccerConfig');
            if (oldConfig) {
                console.log('Migrating old config data...');
                const config = JSON.parse(oldConfig);
                
                // Save as a team if it has players
                if (config.players && Object.keys(config.players).length > 0) {
                    const teamData = {
                        id: 'migrated_team_' + Date.now(),
                        name: 'My Team',
                        players: config.players,
                        gameSettings: config.gameSettings || {},
                        createdAt: new Date().toISOString(),
                        lastModified: new Date().toISOString()
                    };
                    
                    this.saveTeam(teamData);
                    this.setCurrentTeam(teamData.id);
                }
                
                // Remove old config data
                localStorage.removeItem('soccerConfig');
                console.log('Config migration completed');
            }
        } catch (error) {
            console.warn('Error during data migration:', error);
        }
    },
    
    // Save a team
    saveTeam(teamData) {
        try {
            const teams = this.getAllTeams();
            
            // Generate ID if not provided
            if (!teamData.id) {
                teamData.id = 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            }
            
            // Add timestamps
            if (!teamData.createdAt) {
                teamData.createdAt = new Date().toISOString();
            }
            teamData.lastModified = new Date().toISOString();
            
            // Save team
            teams[teamData.id] = teamData;
            localStorage.setItem(this.STORAGE_KEYS.TEAMS, JSON.stringify(teams));
            
            console.log('Team saved:', teamData.name);
            return teamData.id;
        } catch (error) {
            console.error('Error saving team:', error);
            this.showStorageError('Failed to save team');
            return null;
        }
    },
    
    // Get all teams
    getAllTeams() {
        try {
            const teams = localStorage.getItem(this.STORAGE_KEYS.TEAMS);
            return teams ? JSON.parse(teams) : {};
        } catch (error) {
            console.error('Error loading teams:', error);
            return {};
        }
    },
    
    // Get a specific team
    getTeam(teamId) {
        try {
            const teams = this.getAllTeams();
            return teams[teamId] || null;
        } catch (error) {
            console.error('Error loading team:', error);
            return null;
        }
    },
    
    // Delete a team
    deleteTeam(teamId) {
        try {
            const teams = this.getAllTeams();
            if (teams[teamId]) {
                const teamName = teams[teamId].name;
                delete teams[teamId];
                localStorage.setItem(this.STORAGE_KEYS.TEAMS, JSON.stringify(teams));
                
                // If this was the current team, clear it
                if (this.getCurrentTeamId() === teamId) {
                    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_TEAM);
                }
                
                // Delete associated lineups and games
                this.deleteTeamLineups(teamId);
                this.deleteTeamGames(teamId);
                
                console.log('Team deleted:', teamName);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting team:', error);
            return false;
        }
    },
    
    // Set current team
    setCurrentTeam(teamId) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_TEAM, teamId);
            console.log('Current team set to:', teamId);
        } catch (error) {
            console.error('Error setting current team:', error);
        }
    },
    
    // Get current team ID
    getCurrentTeamId() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.CURRENT_TEAM);
        } catch (error) {
            console.error('Error getting current team ID:', error);
            return null;
        }
    },
    
    // Load current team into the app
    loadCurrentTeam() {
        try {
            const teamId = this.getCurrentTeamId();
            if (teamId) {
                const team = this.getTeam(teamId);
                if (team) {
                    this.loadTeamIntoApp(team);
                    return true;
                } else {
                    // Team doesn't exist, clear the reference
                    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_TEAM);
                }
            }
            return false;
        } catch (error) {
            console.error('Error loading current team:', error);
            return false;
        }
    },
    
    // Load team data into the application
    loadTeamIntoApp(teamData) {
        try {
            // Update SoccerConfig with team data
            if (teamData.players) {
                SoccerConfig.players = { ...teamData.players };
            }
            
            if (teamData.gameSettings) {
                Object.assign(SoccerConfig.gameSettings, teamData.gameSettings);
            }
            
            // Update team info in UI
            if (teamData.name) {
                SoccerConfig.teamInfo.name = teamData.name;
            }
            if (teamData.logo) {
                SoccerConfig.teamInfo.logo = teamData.logo;
            }
            
            // IMPORTANT: Synchronize with TeamManager
            if (window.TeamManager) {
                TeamManager.currentTeam = {
                    id: teamData.id,
                    name: teamData.name,
                    players: teamData.players || {},
                    logo: teamData.logo,
                    created: teamData.createdAt,
                    lastModified: teamData.lastModified
                };
                // Also update the teams collection if it exists
                if (TeamManager.teams) {
                    TeamManager.teams[teamData.id] = TeamManager.currentTeam;
                }
            }
            
            // Load saved lineups if they exist
            this.loadTeamLineups(teamData.id);
            
            // Update UI
            if (window.UIManager) {
                UIManager.updateDisplay();
            }
            
            // Update team manager UI if it exists
            if (window.TeamManagerUI) {
                TeamManagerUI.updateUI();
            }
            
            console.log('Team loaded into app:', teamData.name);
        } catch (error) {
            console.error('Error loading team into app:', error);
        }
    },
    
    // Save current lineup
    saveLineup(periodNumber = null) {
        try {
            const teamId = this.getCurrentTeamId();
            if (!teamId) return false;
            
            const currentPeriod = periodNumber || LineupManager.getCurrentPeriod();
            const lineups = this.getTeamLineups(teamId);
            
            // Get current lineup data
            const currentLineup = LineupManager.getCurrentLineup();
            
            lineups[currentPeriod] = {
                ...currentLineup,
                savedAt: new Date().toISOString()
            };
            
            // Save all lineups for the team
            const allLineups = this.getAllLineups();
            allLineups[teamId] = lineups;
            localStorage.setItem(this.STORAGE_KEYS.LINEUPS, JSON.stringify(allLineups));
            
            console.log(`Lineup saved for period ${currentPeriod}`);
            return true;
        } catch (error) {
            console.error('Error saving lineup:', error);
            return false;
        }
    },
    
    // Save all lineups for current team
    saveAllLineups() {
        try {
            const teamId = this.getCurrentTeamId();
            if (!teamId) return false;
            
            const fullLineup = LineupManager.getFullLineup();
            const allLineups = this.getAllLineups();
            
            allLineups[teamId] = {
                ...fullLineup,
                savedAt: new Date().toISOString()
            };
            
            localStorage.setItem(this.STORAGE_KEYS.LINEUPS, JSON.stringify(allLineups));
            console.log('All lineups saved');
            return true;
        } catch (error) {
            console.error('Error saving all lineups:', error);
            return false;
        }
    },
    
    // Load lineups for a team
    loadTeamLineups(teamId) {
        try {
            const allLineups = this.getAllLineups();
            const teamLineups = allLineups[teamId];
            
            if (teamLineups && LineupManager) {
                // Load the full lineup data
                Object.keys(teamLineups).forEach(period => {
                    if (period !== 'savedAt' && teamLineups[period]) {
                        LineupManager.loadPeriodData(parseInt(period), teamLineups[period]);
                    }
                });
                
                console.log('Lineups loaded for team:', teamId);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error loading team lineups:', error);
            return false;
        }
    },
    
    // Get lineups for a specific team
    getTeamLineups(teamId) {
        try {
            const allLineups = this.getAllLineups();
            return allLineups[teamId] || {};
        } catch (error) {
            console.error('Error getting team lineups:', error);
            return {};
        }
    },
    
    // Get all lineups
    getAllLineups() {
        try {
            const lineups = localStorage.getItem(this.STORAGE_KEYS.LINEUPS);
            return lineups ? JSON.parse(lineups) : {};
        } catch (error) {
            console.error('Error loading all lineups:', error);
            return {};
        }
    },
    
    // Delete lineups for a team
    deleteTeamLineups(teamId) {
        try {
            const allLineups = this.getAllLineups();
            if (allLineups[teamId]) {
                delete allLineups[teamId];
                localStorage.setItem(this.STORAGE_KEYS.LINEUPS, JSON.stringify(allLineups));
                console.log('Lineups deleted for team:', teamId);
            }
        } catch (error) {
            console.error('Error deleting team lineups:', error);
        }
    },
    
    // Setup automatic saving
    setupAutoSave() {
        // Auto-save current team when players change
        if (window.TeamManagerUI) {
            const originalSaveTeam = window.TeamManagerUI.saveTeam;
            window.TeamManagerUI.saveTeam = function(teamData) {
                if (originalSaveTeam) {
                    originalSaveTeam.call(this, teamData);
                }
                PersistentStorage.autoSaveCurrentTeam();
            };
        }
        
        // Auto-save lineup changes
        this.setupLineupAutoSave();
        
        console.log('Auto-save setup complete');
    },
    
    // Setup automatic lineup saving
    setupLineupAutoSave() {
        // Save lineup whenever assignments change
        if (window.LineupManager) {
            const originalAssignPlayer = LineupManager.assignPlayerToPosition;
            const originalRemovePlayer = LineupManager.removePlayerFromPosition;
            const originalAddToBench = LineupManager.addPlayerToBench;
            const originalAddToJersey = LineupManager.addPlayerToJersey;
            
            LineupManager.assignPlayerToPosition = function(...args) {
                const result = originalAssignPlayer.apply(this, args);
                PersistentStorage.debounceLineupSave();
                return result;
            };
            
            LineupManager.removePlayerFromPosition = function(...args) {
                const result = originalRemovePlayer.apply(this, args);
                PersistentStorage.debounceLineupSave();
                return result;
            };
            
            LineupManager.addPlayerToBench = function(...args) {
                const result = originalAddToBench.apply(this, args);
                PersistentStorage.debounceLineupSave();
                return result;
            };
            
            LineupManager.addPlayerToJersey = function(...args) {
                const result = originalAddToJersey.apply(this, args);
                PersistentStorage.debounceLineupSave();
                return result;
            };
        }
    },
    
    // Debounced lineup save to prevent excessive saving
    debounceLineupSave() {
        clearTimeout(this.lineupSaveTimeout);
        this.lineupSaveTimeout = setTimeout(() => {
            this.saveAllLineups();
            this.saveGameLineup(); // Also save to current game if one exists
        }, 1000); // Save 1 second after last change
    },
    
    // Auto-save current team
    autoSaveCurrentTeam() {
        try {
            const teamId = this.getCurrentTeamId();
            if (teamId) {
                const teamData = {
                    id: teamId,
                    name: SoccerConfig.teamInfo?.name || 'My Team',
                    players: { ...SoccerConfig.players },
                    gameSettings: { ...SoccerConfig.gameSettings },
                    logo: SoccerConfig.teamInfo?.logo
                };
                
                this.saveTeam(teamData);
            }
        } catch (error) {
            console.error('Error auto-saving team:', error);
        }
    },
    
    // Export team data
    exportTeam(teamId) {
        try {
            const team = this.getTeam(teamId);
            if (!team) return null;
            
            const lineups = this.getTeamLineups(teamId);
            
            return {
                ...team,
                lineups: lineups,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting team:', error);
            return null;
        }
    },
    
    // Import team data
    importTeam(teamData) {
        try {
            // Validate team data
            if (!teamData.players || !teamData.name) {
                throw new Error('Invalid team data');
            }
            
            // Generate new ID to avoid conflicts
            const newTeamId = 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            const team = {
                id: newTeamId,
                name: teamData.name + (teamData.name === 'My Team' ? ' (Imported)' : ''),
                players: teamData.players,
                gameSettings: teamData.gameSettings || {},
                logo: teamData.logo,
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };
            
            this.saveTeam(team);
            
            // Import lineups if they exist
            if (teamData.lineups) {
                const allLineups = this.getAllLineups();
                allLineups[newTeamId] = teamData.lineups;
                localStorage.setItem(this.STORAGE_KEYS.LINEUPS, JSON.stringify(allLineups));
            }
            
            console.log('Team imported:', team.name);
            return newTeamId;
        } catch (error) {
            console.error('Error importing team:', error);
            return null;
        }
    },
    
    // Show storage error to user
    showStorageError(message) {
        if (window.ToastManager) {
            ToastManager.show(message, 'error');
        } else {
            alert(message);
        }
    },
    
    // Get storage usage info
    getStorageInfo() {
        try {
            const teams = Object.keys(this.getAllTeams()).length;
            const lineups = Object.keys(this.getAllLineups()).length;
            
            // Estimate storage size
            let totalSize = 0;
            for (let key in localStorage) {
                if (key.startsWith('soccer_lineup_')) {
                    totalSize += localStorage[key].length;
                }
            }
            
            return {
                teams: teams,
                lineups: lineups,
                storageSize: Math.round(totalSize / 1024) + ' KB',
                available: this.isStorageAvailable()
            };
        } catch (error) {
            console.error('Error getting storage info:', error);
            return null;
        }
    },
    
    // Check if localStorage is available
    isStorageAvailable() {
        try {
            const test = '__localStorage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    },

    // ===============================
    // GAME MANAGEMENT METHODS
    // ===============================

    // Create and save a new game
    createGame(gameData) {
        try {
            let teamId = gameData.teamId || this.getCurrentTeamId();
            let teamName = 'Unknown Team';
            
            // Handle different team sources
            if (teamId && teamId.startsWith('temp_team_')) {
                // Temporary team from loaded players
                teamName = 'Current Team';
            } else {
                if (!teamId) {
                    // Try to get from TeamManager
                    if (window.TeamManager?.currentTeam) {
                        teamId = TeamManager.currentTeam.id;
                        teamName = TeamManager.currentTeam.name;
                    } else {
                        throw new Error('No team selected for game');
                    }
                }

                const team = this.getTeam(teamId);
                if (team) {
                    teamName = team.name;
                } else if (window.TeamManager?.currentTeam) {
                    teamName = TeamManager.currentTeam.name;
                } else {
                    throw new Error('Team not found');
                }
            }

            // Generate game data
            const game = {
                id: 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9),
                teamId: teamId,
                teamName: teamName,
                opponent: gameData.opponent || 'TBD',
                date: gameData.date || new Date().toISOString().split('T')[0],
                location: gameData.location || '',
                gameType: gameData.gameType || 'regular', // regular, tournament, friendly
                status: 'active', // active, completed, cancelled
                lineup: gameData.lineup || LineupManager.exportState().lineup,
                gameSettings: { ...SoccerConfig.gameSettings },
                stats: {
                    score: { home: null, away: null },
                    notes: '',
                    playerStats: {}
                },
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            // Save game
            const games = this.getAllGames();
            games[game.id] = game;
            localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(games));

            // Set as current game
            this.setCurrentGame(game.id);

            // Update game completion UI
            if (window.updateGameCompletionUI) {
                setTimeout(() => updateGameCompletionUI(), 100);
            }

            console.log('Game created:', game.opponent, 'on', game.date);
            return game.id;
        } catch (error) {
            console.error('Error creating game:', error);
            this.showStorageError('Failed to create game');
            return null;
        }
    },

    // Get all games
    getAllGames() {
        try {
            const games = localStorage.getItem(this.STORAGE_KEYS.GAMES);
            return games ? JSON.parse(games) : {};
        } catch (error) {
            console.error('Error loading games:', error);
            return {};
        }
    },

    // Get games for a specific team
    getTeamGames(teamId) {
        try {
            const allGames = this.getAllGames();
            return Object.values(allGames).filter(game => game.teamId === teamId);
        } catch (error) {
            console.error('Error loading team games:', error);
            return [];
        }
    },

    // Get a specific game
    getGame(gameId) {
        try {
            const games = this.getAllGames();
            return games[gameId] || null;
        } catch (error) {
            console.error('Error loading game:', error);
            return null;
        }
    },

    // Update game data
    updateGame(gameId, gameData) {
        try {
            const games = this.getAllGames();
            const game = games[gameId];
            if (!game) {
                throw new Error('Game not found');
            }

            // Update fields
            Object.assign(game, gameData);
            game.lastModified = new Date().toISOString();

            games[gameId] = game;
            localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(games));

            console.log('Game updated:', gameId);
            return true;
        } catch (error) {
            console.error('Error updating game:', error);
            return false;
        }
    },

    // Save current lineup to current game
    saveGameLineup(gameId = null) {
        try {
            const currentGameId = gameId || this.getCurrentGameId();
            if (!currentGameId) return false;

            const currentLineup = LineupManager.getFullLineup();
            const gameData = {
                lineup: currentLineup,
                lastModified: new Date().toISOString()
            };

            return this.updateGame(currentGameId, gameData);
        } catch (error) {
            console.error('Error saving game lineup:', error);
            return false;
        }
    },

    // Load game lineup into LineupManager
    loadGameLineup(gameId) {
        try {
            const game = this.getGame(gameId);
            if (!game || !game.lineup) return false;

            // Load the team first
            if (game.teamId && this.getTeam(game.teamId)) {
                this.setCurrentTeam(game.teamId);
                this.loadTeamIntoApp(this.getTeam(game.teamId));
            }

            // Load the lineup
            LineupManager.importState({
                currentPeriod: 1,
                lineup: game.lineup
            });

            // Set as current game
            this.setCurrentGame(gameId);

            // Update game completion UI
            if (window.updateGameCompletionUI) {
                setTimeout(() => updateGameCompletionUI(), 100);
            }

            console.log('Game lineup loaded:', gameId);
            return true;
        } catch (error) {
            console.error('Error loading game lineup:', error);
            return false;
        }
    },

    // Complete a game (mark as finished and save final stats)
    completeGame(gameId, finalStats = {}) {
        try {
            const gameData = {
                status: 'completed',
                completedAt: new Date().toISOString(),
                stats: {
                    ...finalStats,
                    playerStats: this.calculateGamePlayerStats(gameId)
                }
            };

            return this.updateGame(gameId, gameData);
        } catch (error) {
            console.error('Error completing game:', error);
            return false;
        }
    },

    // Calculate player stats for a game
    calculateGamePlayerStats(gameId) {
        try {
            const game = this.getGame(gameId);
            if (!game || !game.lineup) return {};

            const playerStats = {};
            const lineup = game.lineup;

            // Calculate stats for each player across all periods
            Object.keys(SoccerConfig.players).forEach(playerName => {
                const stats = {
                    minutesPlayed: 0,
                    positions: {},
                    benchTime: 0,
                    jerseyTime: 0
                };

                for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
                    const periodData = lineup[period];
                    if (!periodData) continue;

                    // Check positions
                    for (const [position, assignedPlayer] of Object.entries(periodData.positions || {})) {
                        if (assignedPlayer === playerName) {
                            stats.minutesPlayed += SoccerConfig.gameSettings.periodLength;
                            stats.positions[position] = (stats.positions[position] || 0) + 1;
                        }
                    }

                    // Count bench time
                    if (periodData.bench && periodData.bench.includes(playerName)) {
                        stats.benchTime += SoccerConfig.gameSettings.periodLength;
                    }

                    // Count jersey time
                    if (periodData.jersey && periodData.jersey.includes(playerName)) {
                        stats.jerseyTime += SoccerConfig.gameSettings.periodLength;
                    }
                }

                if (stats.minutesPlayed > 0 || stats.benchTime > 0 || stats.jerseyTime > 0) {
                    playerStats[playerName] = stats;
                }
            });

            return playerStats;
        } catch (error) {
            console.error('Error calculating game player stats:', error);
            return {};
        }
    },

    // Delete a game
    deleteGame(gameId) {
        try {
            const games = this.getAllGames();
            if (games[gameId]) {
                const gameName = `${games[gameId].opponent} (${games[gameId].date})`;
                delete games[gameId];
                localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(games));

                // If this was the current game, clear it
                if (this.getCurrentGameId() === gameId) {
                    localStorage.removeItem(this.STORAGE_KEYS.CURRENT_GAME);
                }

                console.log('Game deleted:', gameName);
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting game:', error);
            return false;
        }
    },

    // Set current game
    setCurrentGame(gameId) {
        try {
            localStorage.setItem(this.STORAGE_KEYS.CURRENT_GAME, gameId);
            console.log('Current game set to:', gameId);
        } catch (error) {
            console.error('Error setting current game:', error);
        }
    },

    // Get current game ID
    getCurrentGameId() {
        try {
            return localStorage.getItem(this.STORAGE_KEYS.CURRENT_GAME);
        } catch (error) {
            console.error('Error getting current game ID:', error);
            return null;
        }
    },

    // Get current game
    getCurrentGame() {
        try {
            const gameId = this.getCurrentGameId();
            return gameId ? this.getGame(gameId) : null;
        } catch (error) {
            console.error('Error getting current game:', error);
            return null;
        }
    },

    // Delete all games for a team (called when team is deleted)
    deleteTeamGames(teamId) {
        try {
            const allGames = this.getAllGames();
            const gameIds = Object.keys(allGames).filter(gameId => allGames[gameId].teamId === teamId);
            
            gameIds.forEach(gameId => {
                delete allGames[gameId];
            });
            
            localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(allGames));
            
            // Clear current game if it belonged to deleted team
            const currentGameId = this.getCurrentGameId();
            if (currentGameId && gameIds.includes(currentGameId)) {
                localStorage.removeItem(this.STORAGE_KEYS.CURRENT_GAME);
            }
            
            console.log(`Deleted ${gameIds.length} games for team:`, teamId);
        } catch (error) {
            console.error('Error deleting team games:', error);
        }
    },

    // Export game data
    exportGame(gameId) {
        try {
            const game = this.getGame(gameId);
            if (!game) return null;

            return {
                ...game,
                exportedAt: new Date().toISOString(),
                version: '1.0'
            };
        } catch (error) {
            console.error('Error exporting game:', error);
            return null;
        }
    },

    // Import game data
    importGame(gameData) {
        try {
            if (!gameData.teamId || !gameData.opponent) {
                throw new Error('Invalid game data');
            }

            // Generate new ID to avoid conflicts
            const newGameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);

            const game = {
                id: newGameId,
                teamId: gameData.teamId,
                teamName: gameData.teamName,
                opponent: gameData.opponent + (gameData.opponent === 'TBD' ? ' (Imported)' : ''),
                date: gameData.date,
                location: gameData.location || '',
                gameType: gameData.gameType || 'regular',
                status: gameData.status || 'completed',
                lineup: gameData.lineup || {},
                gameSettings: gameData.gameSettings || {},
                stats: gameData.stats || {},
                createdAt: new Date().toISOString(),
                lastModified: new Date().toISOString()
            };

            const games = this.getAllGames();
            games[newGameId] = game;
            localStorage.setItem(this.STORAGE_KEYS.GAMES, JSON.stringify(games));

            console.log('Game imported:', game.opponent, 'on', game.date);
            return newGameId;
        } catch (error) {
            console.error('Error importing game:', error);
            return null;
        }
    },

    // Get game history for current team
    getGameHistory(teamId = null) {
        try {
            const currentTeamId = teamId || this.getCurrentTeamId();
            if (!currentTeamId) return [];

            const games = this.getTeamGames(currentTeamId);
            
            // Sort by date (most recent first)
            return games.sort((a, b) => new Date(b.date) - new Date(a.date));
        } catch (error) {
            console.error('Error getting game history:', error);
            return [];
        }
    },

    // Get team statistics across all games
    getTeamStats(teamId = null) {
        try {
            const currentTeamId = teamId || this.getCurrentTeamId();
            if (!currentTeamId) return null;

            const games = this.getTeamGames(currentTeamId);
            const completedGames = games.filter(game => game.status === 'completed');

            const stats = {
                totalGames: games.length,
                completedGames: completedGames.length,
                wins: 0,
                losses: 0,
                draws: 0,
                playerStats: {}
            };

            // Aggregate player stats across all games
            completedGames.forEach(game => {
                if (game.stats && game.stats.playerStats) {
                    Object.entries(game.stats.playerStats).forEach(([playerName, gamePlayerStats]) => {
                        if (!stats.playerStats[playerName]) {
                            stats.playerStats[playerName] = {
                                totalMinutes: 0,
                                gamesPlayed: 0,
                                positions: {},
                                benchTime: 0,
                                jerseyTime: 0
                            };
                        }

                        const playerStats = stats.playerStats[playerName];
                        playerStats.totalMinutes += gamePlayerStats.minutesPlayed || 0;
                        playerStats.benchTime += gamePlayerStats.benchTime || 0;
                        playerStats.jerseyTime += gamePlayerStats.jerseyTime || 0;
                        playerStats.gamesPlayed++;

                        // Aggregate position stats
                        if (gamePlayerStats.positions) {
                            Object.entries(gamePlayerStats.positions).forEach(([position, count]) => {
                                playerStats.positions[position] = (playerStats.positions[position] || 0) + count;
                            });
                        }
                    });
                }
            });

            return stats;
        } catch (error) {
            console.error('Error calculating team stats:', error);
            return null;
        }
    }
};

// Initialize when DOM is loaded (will be called by app.js instead)
// document.addEventListener('DOMContentLoaded', () => {
//     PersistentStorage.init();
// });

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistentStorage;
}