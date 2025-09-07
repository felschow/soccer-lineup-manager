// Persistent Storage Manager
// Handles saving and loading teams and lineups using localStorage

const PersistentStorage = {
    // Storage keys
    STORAGE_KEYS: {
        TEAMS: 'soccer_lineup_teams',
        CURRENT_TEAM: 'soccer_lineup_current_team',
        LINEUPS: 'soccer_lineup_lineups',
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
            // Check if there's old data that needs migration
            const oldConfig = localStorage.getItem('soccerConfig');
            if (oldConfig) {
                console.log('Migrating old data...');
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
                
                // Remove old data
                localStorage.removeItem('soccerConfig');
                console.log('Migration completed');
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
                
                // Delete associated lineups
                this.deleteTeamLineups(teamId);
                
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
    }
};

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    PersistentStorage.init();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PersistentStorage;
}