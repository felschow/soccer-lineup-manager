// Team Management Module
// Handles team creation, player management, and team persistence

const TeamManager = {
    // Current team data
    currentTeam: null,
    activeTeam: null, // The team currently being used for lineups
    teams: {},
    
    // Default position options players can select from
    positionOptions: [
        'Striker', 'Wing', 'Midfield', 'Back', 'Defense', 'Goalkeeper',
        'All', 'All except GK'
    ],

    // Initialize team management
    init() {
        this.loadTeams();
        this.setupEventListeners();
        this.createDefaultTeamIfNeeded();
    },

    // Create default team from hardcoded config if no teams exist
    createDefaultTeamIfNeeded() {
        const teams = Object.values(this.teams);
        if (teams.length === 0) {
            try {
                // Create default team from existing SoccerConfig players
                const defaultPlayers = Object.entries(SoccerConfig.players).map(([name, positions]) => ({
                    name,
                    positions
                }));
                
                const defaultTeam = this.createTeam('Default Team', defaultPlayers);
                this.loadTeam(defaultTeam.id);
                console.log('Created default team with existing players');
            } catch (error) {
                console.warn('Failed to create default team:', error);
            }
        }
    },

    // Create new team
    createTeam(teamName, players = []) {
        if (!teamName || teamName.trim() === '') {
            throw new Error('Team name is required');
        }

        const team = {
            id: this.generateTeamId(),
            name: teamName.trim(),
            logo: null, // Team logo image data (base64 or URL)
            players: {},
            created: new Date().toISOString(),
            lastModified: new Date().toISOString()
        };

        // Add players if provided
        players.forEach(player => {
            if (player.name && player.name.trim() !== '') {
                team.players[player.name.trim()] = player.positions || ['All'];
            }
        });

        this.teams[team.id] = team;
        this.saveTeams();
        return team;
    },

    // Load team as current active team
    loadTeam(teamId) {
        if (!this.teams[teamId]) {
            throw new Error('Team not found');
        }

        this.currentTeam = this.teams[teamId];
        this.updateSoccerConfig();
        
        // Trigger UI updates
        if (window.UIManager && UIManager.renderPlayerList) {
            UIManager.renderPlayerList();
            UIManager.updateDisplay();
        }
        
        return this.currentTeam;
    },

    // Update current team
    updateTeam(teamData) {
        if (!this.currentTeam) {
            throw new Error('No team currently loaded');
        }

        this.currentTeam.name = teamData.name || this.currentTeam.name;
        this.currentTeam.players = teamData.players || this.currentTeam.players;
        this.currentTeam.lastModified = new Date().toISOString();

        this.teams[this.currentTeam.id] = this.currentTeam;
        this.saveTeams();
        this.updateSoccerConfig();
    },

    // Delete team
    deleteTeam(teamId) {
        if (!this.teams[teamId]) {
            throw new Error('Team not found');
        }

        delete this.teams[teamId];
        this.saveTeams();

        // If deleted team was current, clear current
        if (this.currentTeam && this.currentTeam.id === teamId) {
            this.currentTeam = null;
            this.updateSoccerConfig();
        }
    },

    // Add player to current team
    addPlayer(playerName, positions = ['All']) {
        if (!this.currentTeam) {
            throw new Error('No team currently loaded');
        }

        if (!playerName || playerName.trim() === '') {
            throw new Error('Player name is required');
        }

        this.currentTeam.players[playerName.trim()] = positions;
        this.currentTeam.lastModified = new Date().toISOString();
        
        this.teams[this.currentTeam.id] = this.currentTeam;
        this.saveTeams();
        this.updateSoccerConfig();
    },

    // Remove player from current team
    removePlayer(playerName) {
        if (!this.currentTeam) {
            throw new Error('No team currently loaded');
        }

        delete this.currentTeam.players[playerName];
        this.currentTeam.lastModified = new Date().toISOString();
        
        this.teams[this.currentTeam.id] = this.currentTeam;
        this.saveTeams();
        this.updateSoccerConfig();

        // Remove from any lineups
        if (window.LineupManager) {
            LineupManager.removePlayerFromAllPeriods(playerName);
        }
    },

    // Update player positions
    updatePlayerPositions(playerName, positions) {
        if (!this.currentTeam) {
            throw new Error('No team currently loaded');
        }

        if (!this.currentTeam.players[playerName]) {
            throw new Error('Player not found');
        }

        this.currentTeam.players[playerName] = positions;
        this.currentTeam.lastModified = new Date().toISOString();
        
        this.teams[this.currentTeam.id] = this.currentTeam;
        this.saveTeams();
        this.updateSoccerConfig();
    },

    // Get all teams
    getAllTeams() {
        return Object.values(this.teams);
    },

    // Get current team
    getCurrentTeam() {
        return this.currentTeam;
    },

    // Update SoccerConfig with current team data
    updateSoccerConfig() {
        if (this.currentTeam) {
            SoccerConfig.players = { ...this.currentTeam.players };
        } else {
            // Fallback to empty or default
            SoccerConfig.players = {};
        }
    },

    // Generate unique team ID
    generateTeamId() {
        return 'team_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    },

    // Save teams to localStorage
    saveTeams() {
        try {
            localStorage.setItem('soccerTeams', JSON.stringify(this.teams));
            localStorage.setItem('currentTeamId', this.currentTeam ? this.currentTeam.id : '');
            localStorage.setItem('activeTeamId', this.activeTeam ? this.activeTeam.id : '');
        } catch (error) {
            console.error('Failed to save teams:', error);
        }
    },

    // Load teams from localStorage
    loadTeams() {
        try {
            const savedTeams = localStorage.getItem('soccerTeams');
            if (savedTeams) {
                this.teams = JSON.parse(savedTeams);
            }

            const currentTeamId = localStorage.getItem('currentTeamId');
            if (currentTeamId && this.teams[currentTeamId]) {
                this.currentTeam = this.teams[currentTeamId];
            }

            const activeTeamId = localStorage.getItem('activeTeamId');
            if (activeTeamId && this.teams[activeTeamId]) {
                this.activeTeam = this.teams[activeTeamId];
                this.updateSoccerConfig();
            }
        } catch (error) {
            console.error('Failed to load teams:', error);
            this.teams = {};
            this.currentTeam = null;
            this.activeTeam = null;
        }
    },

    // Export team data
    exportTeam(teamId) {
        const team = this.teams[teamId];
        if (!team) {
            throw new Error('Team not found');
        }

        return {
            version: '1.0',
            team: team,
            exportDate: new Date().toISOString()
        };
    },

    // Import team data
    importTeam(teamData) {
        if (!teamData || !teamData.team) {
            throw new Error('Invalid team data');
        }

        const team = teamData.team;
        team.id = this.generateTeamId(); // Generate new ID to avoid conflicts
        team.lastModified = new Date().toISOString();

        this.teams[team.id] = team;
        this.saveTeams();
        
        return team;
    },

    // Setup event listeners
    setupEventListeners() {
        // Listen for storage events (multiple tabs)
        window.addEventListener('storage', (e) => {
            if (e.key === 'soccerTeams') {
                this.loadTeams();
            }
        });
    },

    // Validation helpers
    validateTeamName(name) {
        if (!name || name.trim() === '') {
            return 'Team name is required';
        }
        
        if (name.trim().length > 50) {
            return 'Team name must be 50 characters or less';
        }

        // Check for duplicate names
        const existingTeams = Object.values(this.teams);
        if (existingTeams.some(team => 
            team.name.toLowerCase() === name.trim().toLowerCase() &&
            (!this.currentTeam || team.id !== this.currentTeam.id)
        )) {
            return 'A team with this name already exists';
        }

        return null;
    },

    // Set active team for lineups
    setActiveTeam(teamId) {
        const team = this.teams[teamId];
        if (!team) {
            throw new Error('Team not found');
        }

        this.activeTeam = team;
        this.updateSoccerConfig();
        this.saveTeams();
        
        // Update UI to reflect active team
        if (window.UIManager) {
            UIManager.updateDisplay();
        }
        
        // Update header display
        this.updateHeaderDisplay();
        
        console.log('Active team set:', team.name);
        return true;
    },

    // Get currently active team
    getActiveTeam() {
        return this.activeTeam;
    },

    // Update team logo
    updateTeamLogo(teamId, logoData) {
        const team = this.teams[teamId];
        if (!team) {
            throw new Error('Team not found');
        }

        team.logo = logoData;
        team.lastModified = new Date().toISOString();
        
        if (this.activeTeam && this.activeTeam.id === teamId) {
            this.activeTeam.logo = logoData;
            this.updateHeaderDisplay();
        }
        
        if (this.currentTeam && this.currentTeam.id === teamId) {
            this.currentTeam.logo = logoData;
        }

        this.saveTeams();
        return true;
    },

    // Update header display with active team info
    updateHeaderDisplay() {
        const headerElement = document.querySelector('.header h1');
        const activeTeam = this.getActiveTeam();
        
        if (!headerElement) return;
        
        if (activeTeam) {
            const logoHtml = activeTeam.logo 
                ? `<img src="${activeTeam.logo}" alt="${activeTeam.name} logo" class="team-logo" style="width: 32px; height: 32px; margin-right: 8px; border-radius: 4px; vertical-align: middle;">` 
                : '';
            
            headerElement.innerHTML = `${logoHtml}⚽ ${activeTeam.name}`;
        } else {
            headerElement.innerHTML = '⚽ Soccer Lineup Manager';
        }
        
        // Also update table view header if UIManager is available
        if (window.UIManager && UIManager.updateTableTeamHeader) {
            UIManager.updateTableTeamHeader();
        }
    },

    validatePlayerName(name) {
        if (!name || name.trim() === '') {
            return 'Player name is required';
        }
        
        if (name.trim().length > 30) {
            return 'Player name must be 30 characters or less';
        }

        return null;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamManager;
}