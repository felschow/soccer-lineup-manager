// ===== SOCCER LINEUP MANAGER - SIMPLE VERSION =====
// Clean, simple implementation with all requested features

class SoccerApp {
    constructor() {
        this.teams = [];
        this.currentTeam = null;
        this.currentGame = null;
        this.currentPeriod = 1;
        this.currentView = 'field'; // 'field' or 'table'
        this.draggedPlayer = null;
        
        // Position mappings
        this.positionGroups = {
            'Forward': ['LF', 'CF', 'RF'],
            'Midfield': ['LM', 'CM1', 'CM2', 'RM'],
            'Defense': ['LB', 'CB1', 'CB2', 'RB'],
            'Goalkeeper': ['GK']
        };
        
        // Formation definitions by team size
        this.formations = {
            4: {
                '1-2-1': { name: '1-2-1', description: 'Balanced', positions: ['GK', 'LB', 'RB', 'CF'] },
                '1-1-2': { name: '1-1-2', description: 'Attacking', positions: ['GK', 'CB', 'LF', 'RF'] },
                '2-1-1': { name: '2-1-1', description: 'Defensive', positions: ['GK', 'LB', 'RB', 'CF'] }
            },
            7: {
                '1-2-2-2': { name: '1-2-2-2', description: 'Balanced', positions: ['GK', 'LB', 'RB', 'CM1', 'CM2', 'LF', 'RF'] },
                '1-3-1-2': { name: '1-3-1-2', description: 'Defensive', positions: ['GK', 'LB', 'CB', 'RB', 'CM', 'LF', 'RF'] },
                '1-1-3-2': { name: '1-1-3-2', description: 'Attacking', positions: ['GK', 'CB', 'LM', 'CM', 'RM', 'LF', 'RF'] }
            },
            9: {
                '1-3-3-2': { name: '1-3-3-2', description: 'Balanced', positions: ['GK', 'LB', 'CB', 'RB', 'LM', 'CM', 'RM', 'LF', 'RF'] },
                '1-4-2-2': { name: '1-4-2-2', description: 'Defensive', positions: ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'LF', 'RF'] },
                '1-2-4-2': { name: '1-2-4-2', description: 'Attacking', positions: ['GK', 'LB', 'RB', 'LM', 'CM1', 'CM2', 'RM', 'LF', 'RF'] }
            },
            11: {
                '1-4-4-2': { name: '1-4-4-2', description: 'Classic', positions: ['GK', 'LB', 'CB1', 'CB2', 'RB', 'LM', 'CM1', 'CM2', 'RM', 'LF', 'RF'] },
                '1-4-3-3': { name: '1-4-3-3', description: 'Attacking', positions: ['GK', 'LB', 'CB1', 'CB2', 'RB', 'CM1', 'CM2', 'CM3', 'LF', 'CF', 'RF'] },
                '1-3-5-2': { name: '1-3-5-2', description: 'Midfield', positions: ['GK', 'LB', 'CB', 'RB', 'LM', 'CM1', 'CM2', 'CM3', 'RM', 'LF', 'RF'] },
                '1-5-3-2': { name: '1-5-3-2', description: 'Defensive', positions: ['GK', 'LB', 'CB1', 'CB2', 'CB3', 'RB', 'CM1', 'CM2', 'CM3', 'LF', 'RF'] }
            }
        };
        
        // Initialize app
        this.init();
    }
    
    init() {
        console.log('🚀 Initializing Simple Soccer App');
        this.loadData();
        this.setupEventListeners();
        this.renderTeams();
        this.updateUI();
    }
    
    // ===== DATA PERSISTENCE =====
    loadData() {
        try {
            const savedTeams = localStorage.getItem('soccer_teams');
            const savedGame = localStorage.getItem('soccer_current_game');
            
            if (savedTeams) {
                this.teams = JSON.parse(savedTeams);
            }
            
            if (savedGame) {
                this.currentGame = JSON.parse(savedGame);
                // Find the team for this game
                this.currentTeam = this.teams.find(t => t.id === this.currentGame.teamId);
            }
        } catch (error) {
            console.error('Error loading data:', error);
        }
    }
    
    saveData() {
        try {
            localStorage.setItem('soccer_teams', JSON.stringify(this.teams));
            if (this.currentGame) {
                localStorage.setItem('soccer_current_game', JSON.stringify(this.currentGame));
            } else {
                localStorage.removeItem('soccer_current_game');
            }
        } catch (error) {
            console.error('Error saving data:', error);
        }
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Team management
        document.getElementById('teamBtn').addEventListener('click', () => this.showTeamSection());
        document.getElementById('createTeamBtn').addEventListener('click', () => this.showTeamCreation());
        document.getElementById('newGameBtn').addEventListener('click', () => this.showGameModal());
        
        // Team creation page
        document.getElementById('backToTeamsBtn').addEventListener('click', () => this.showTeamSection());
        document.getElementById('cancelTeamBtn').addEventListener('click', () => this.showTeamSection());
        document.getElementById('addPlayerBtn').addEventListener('click', () => this.addPlayerRow());
        
        // Team size change handler
        document.addEventListener('change', (e) => {
            if (e.target.name === 'teamSize') {
                this.updateFormationSelector(parseInt(e.target.value));
            }
            
            // Game timing preview update
            if (e.target.id === 'halfDuration' || e.target.id === 'periodCount') {
                this.updateGameTimingPreview();
            }
        });
        
        // Period selector
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPeriod = parseInt(e.target.dataset.period);
                this.updatePeriodSelector();
                this.renderField();
            });
        });
        
        // View toggle
        document.getElementById('viewToggleBtn').addEventListener('click', () => this.toggleView());
        
        // Game completion
        document.getElementById('completeGameBtn').addEventListener('click', () => this.completeGame());
        
        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal') || e.target.classList.contains('modal-close')) {
                this.closeModals();
            }
        });
        
        // Form submissions
        document.getElementById('teamForm').addEventListener('submit', (e) => this.handleTeamSubmit(e));
        document.getElementById('gameForm').addEventListener('submit', (e) => this.handleGameSubmit(e));
        
        // Field position clicks - handle both selection and removal
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('position')) {
                if (e.target.classList.contains('occupied')) {
                    // Remove player from position
                    this.removePlayerFromPosition(e.target.dataset.position);
                } else {
                    // Show player selection
                    this.showPlayerSelectionModal(e.target.dataset.position);
                }
            }
        });
        
        // Dynamic remove player buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-player-btn')) {
                e.target.closest('.player-row').remove();
            }
        });
        
        // Drag and Drop
        this.setupDragAndDrop();
    }
    
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target.classList.contains('player-item')) {
                this.draggedPlayer = e.target.textContent;
                e.target.classList.add('dragging');
                
                // Highlight drop targets
                document.querySelectorAll('.position:not(.occupied), .players-list').forEach(el => {
                    el.classList.add('drop-target');
                });
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target.classList.contains('player-item')) {
                e.target.classList.remove('dragging');
                
                // Remove drop target highlights
                document.querySelectorAll('.drop-target').forEach(el => {
                    el.classList.remove('drop-target');
                });
                
                this.draggedPlayer = null;
            }
        });
        
        document.addEventListener('dragover', (e) => {
            e.preventDefault();
            if (e.target.classList.contains('position') || e.target.classList.contains('players-list')) {
                e.target.classList.add('drop-over');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            if (e.target.classList.contains('position') || e.target.classList.contains('players-list')) {
                e.target.classList.remove('drop-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            e.target.classList.remove('drop-over');
            
            if (this.draggedPlayer) {
                if (e.target.classList.contains('position')) {
                    this.assignPlayer(e.target.dataset.position, this.draggedPlayer);
                } else if (e.target.id === 'benchPlayers') {
                    this.moveToBench(this.draggedPlayer);
                } else if (e.target.id === 'availablePlayers') {
                    this.moveToAvailable(this.draggedPlayer);
                }
            }
        });
    }
    
    // ===== TEAM MANAGEMENT =====
    showTeamSection() {
        document.getElementById('teamSection').style.display = 'block';
        document.getElementById('gameSection').style.display = 'none';
    }
    
    showTeamCreation(team = null) {
        // Hide other sections
        document.getElementById('teamSection').style.display = 'none';
        document.getElementById('gameSection').style.display = 'none';
        document.getElementById('teamCreationSection').style.display = 'block';
        
        const title = document.getElementById('teamCreationTitle');
        const nameInput = document.getElementById('teamName');
        const playersContainer = document.getElementById('playersContainer');
        
        if (team) {
            title.textContent = 'Edit Team';
            nameInput.value = team.name;
            nameInput.dataset.teamId = team.id;
            
            // Set team size and formation
            if (team.teamSize) {
                document.querySelector(`input[name="teamSize"][value="${team.teamSize}"]`).checked = true;
                this.updateFormationSelector(team.teamSize);
                
                if (team.formation) {
                    setTimeout(() => {
                        const formationInput = document.querySelector(`input[name="formation"][value="${team.formation}"]`);
                        if (formationInput) formationInput.checked = true;
                    }, 100);
                }
            }
            
            // Clear container and populate with existing players
            playersContainer.innerHTML = '';
            team.players.forEach(player => {
                this.addPlayerRow(player.name, player.positions);
            });
        } else {
            title.textContent = 'Create New Team';
            nameInput.value = '';
            delete nameInput.dataset.teamId;
            
            // Reset form
            document.querySelectorAll('input[name="teamSize"]').forEach(input => input.checked = false);
            document.querySelectorAll('input[name="formation"]').forEach(input => input.checked = false);
            document.getElementById('formationSelector').innerHTML = '<p class="empty-state">Select team size first</p>';
            
            // Reset to single empty player row
            playersContainer.innerHTML = '';
            this.addPlayerRow();
        }
        
        nameInput.focus();
    }
    
    updateFormationSelector(teamSize) {
        const formationSelector = document.getElementById('formationSelector');
        const formations = this.formations[teamSize];
        
        if (!formations) {
            formationSelector.innerHTML = '<p class="empty-state">No formations available</p>';
            return;
        }
        
        formationSelector.innerHTML = Object.entries(formations).map(([key, formation]) => `
            <label class="formation-option">
                <input type="radio" name="formation" value="${key}" required>
                <div class="formation-name">${formation.name}</div>
                <div class="formation-description">${formation.description}</div>
            </label>
        `).join('');
    }
    
    addPlayerRow(playerName = '', selectedPositions = []) {
        const container = document.getElementById('playersContainer');
        const playerRow = document.createElement('div');
        playerRow.className = 'player-row';
        
        const isFirstRow = container.children.length === 0;
        
        playerRow.innerHTML = `
            <div class="player-row-header">
                <input type="text" placeholder="Player name" class="player-name" value="${playerName}" required>
                ${!isFirstRow ? '<button type="button" class="remove-player-btn">×</button>' : ''}
            </div>
            <div class="position-checkboxes">
                <label>
                    <input type="checkbox" value="Forward" ${selectedPositions.includes('Forward') ? 'checked' : ''}> 
                    ⚽ Forward
                </label>
                <label>
                    <input type="checkbox" value="Midfield" ${selectedPositions.includes('Midfield') ? 'checked' : ''}> 
                    🏃 Midfield
                </label>
                <label>
                    <input type="checkbox" value="Defense" ${selectedPositions.includes('Defense') ? 'checked' : ''}> 
                    🛡️ Defense
                </label>
                <label>
                    <input type="checkbox" value="Goalkeeper" ${selectedPositions.includes('Goalkeeper') ? 'checked' : ''}> 
                    🥅 Goalkeeper
                </label>
            </div>
        `;
        
        container.appendChild(playerRow);
    }
    
    handleTeamSubmit(e) {
        e.preventDefault();
        
        const nameInput = document.getElementById('teamName');
        const teamId = nameInput.dataset.teamId;
        const name = nameInput.value.trim();
        
        // Get team size and formation
        const selectedTeamSize = document.querySelector('input[name="teamSize"]:checked');
        const selectedFormation = document.querySelector('input[name="formation"]:checked');
        
        if (!selectedTeamSize || !selectedFormation) {
            alert('Please select team size and formation');
            return;
        }
        
        const teamSize = parseInt(selectedTeamSize.value);
        const formation = selectedFormation.value;
        
        // Collect players and their positions
        const playerRows = document.querySelectorAll('.player-row');
        const players = [];
        
        for (let row of playerRows) {
            const playerName = row.querySelector('.player-name').value.trim();
            const checkedPositions = Array.from(row.querySelectorAll('input[type="checkbox"]:checked'))
                .map(cb => cb.value);
            
            if (playerName) {
                if (checkedPositions.length === 0) {
                    alert(`Please select at least one position for ${playerName}`);
                    return;
                }
                
                players.push({
                    name: playerName,
                    positions: checkedPositions
                });
            }
        }
        
        if (!name || players.length === 0) {
            alert('Please enter team name and at least one player');
            return;
        }
        
        if (teamId) {
            // Edit existing team
            const team = this.teams.find(t => t.id === teamId);
            if (team) {
                team.name = name;
                team.players = players;
                team.teamSize = teamSize;
                team.formation = formation;
            }
        } else {
            // Create new team
            const team = {
                id: 'team_' + Date.now(),
                name: name,
                players: players,
                teamSize: teamSize,
                formation: formation,
                created: new Date().toISOString()
            };
            this.teams.push(team);
        }
        
        this.saveData();
        this.renderTeams();
        this.showTeamSection();
        this.showSuccessMessage(`Team "${name}" saved successfully!`);
    }
    
    selectTeam(teamId) {
        this.currentTeam = this.teams.find(t => t.id === teamId);
        this.renderTeams(); // Update selected state
        document.getElementById('newGameBtn').style.display = 'inline-flex';
    }
    
    deleteTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team && confirm(`Are you sure you want to delete "${team.name}"?`)) {
            this.teams = this.teams.filter(t => t.id !== teamId);
            if (this.currentTeam && this.currentTeam.id === teamId) {
                this.currentTeam = null;
                this.currentGame = null;
                document.getElementById('newGameBtn').style.display = 'none';
            }
            this.saveData();
            this.renderTeams();
            this.updateUI();
        }
    }
    
    renderTeams() {
        const container = document.getElementById('teamsList');
        
        if (this.teams.length === 0) {
            container.innerHTML = '<p class="empty-state">No teams yet. Create your first team!</p>';
            return;
        }
        
        container.innerHTML = this.teams.map(team => {
            const playerSummary = this.getPlayerSummary(team);
            return `
                <div class="team-card ${this.currentTeam && this.currentTeam.id === team.id ? 'selected' : ''}" 
                     onclick="app.selectTeam('${team.id}')">
                    <h3>${team.name}</h3>
                    <p>${team.players.length} players</p>
                    <div class="position-summary">
                        ${playerSummary}
                    </div>
                    <div class="team-actions" onclick="event.stopPropagation()">
                        <button class="btn secondary" onclick="app.editTeam('${team.id}')">✏️ Edit</button>
                        <button class="btn secondary" onclick="app.deleteTeam('${team.id}')" style="color: #dc2626;">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');
    }
    
    editTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team) {
            this.showTeamCreation(team);
        }
    }
    
    removePlayerFromPosition(position) {
        if (!this.currentGame) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const playerName = currentLineup.positions[position];
        
        if (!playerName) return;
        
        // Remove player from position
        delete currentLineup.positions[position];
        
        this.saveData();
        this.renderField();
        this.showSuccessMessage(`${playerName} removed from ${position}`);
    }
    
    getPlayerSummary(team) {
        const counts = {
            'Forward': 0,
            'Midfield': 0,
            'Defense': 0,
            'Goalkeeper': 0
        };
        
        team.players.forEach(player => {
            player.positions.forEach(pos => {
                counts[pos]++;
            });
        });
        
        return `⚽${counts.Forward} 🏃${counts.Midfield} 🛡️${counts.Defense} 🥅${counts.Goalkeeper}`;
    }
    
    // ===== GAME MANAGEMENT =====
    showGameModal() {
        if (!this.currentTeam) {
            alert('Please select a team first');
            return;
        }
        
        const modal = document.getElementById('gameModal');
        const dateInput = document.getElementById('gameDate');
        
        // Set today's date as default
        dateInput.value = new Date().toISOString().split('T')[0];
        
        // Update timing preview
        this.updateGameTimingPreview();
        
        modal.style.display = 'flex';
        document.getElementById('gameOpponent').focus();
    }
    
    updateGameTimingPreview() {
        const halfDurationSelect = document.getElementById('halfDuration');
        const periodCountSelect = document.getElementById('periodCount');
        const previewDiv = document.getElementById('timingPreview');
        
        if (!halfDurationSelect || !periodCountSelect || !previewDiv) return;
        
        const halfDuration = parseInt(halfDurationSelect.value) || 30;
        const periodCount = parseInt(periodCountSelect.value) || 4;
        
        const totalGameTime = halfDuration * 2;
        const periodDuration = totalGameTime / periodCount;
        
        // Format period duration nicely
        let periodText;
        if (periodDuration % 1 === 0) {
            periodText = `${periodDuration} minutes`;
        } else {
            periodText = `${periodDuration} minutes`;
        }
        
        previewDiv.innerHTML = `
            <h4>Game Structure:</h4>
            <p>Each period will be <strong>${periodText}</strong></p>
            <p>Total game time: <strong>${totalGameTime} minutes</strong> (2 × ${halfDuration}min halves)</p>
            <p>Periods per half: <strong>${periodCount / 2}</strong></p>
        `;
    }
    
    handleGameSubmit(e) {
        e.preventDefault();
        
        const opponent = document.getElementById('gameOpponent').value.trim();
        const date = document.getElementById('gameDate').value;
        const halfDuration = parseInt(document.getElementById('halfDuration').value);
        const periodCount = parseInt(document.getElementById('periodCount').value);
        
        if (!opponent || !date || !halfDuration || !periodCount) {
            alert('Please fill in all fields');
            return;
        }
        
        const totalGameTime = halfDuration * 2;
        const periodDuration = totalGameTime / periodCount;
        
        // Create lineup structure with dynamic periods
        const lineup = {};
        for (let i = 1; i <= periodCount; i++) {
            lineup[i] = { positions: {}, bench: [] };
        }
        
        // Create new game
        this.currentGame = {
            id: 'game_' + Date.now(),
            teamId: this.currentTeam.id,
            opponent: opponent,
            date: date,
            halfDuration: halfDuration,
            periodCount: periodCount,
            periodDuration: periodDuration,
            totalGameTime: totalGameTime,
            created: new Date().toISOString(),
            lineup: lineup
        };
        
        this.saveData();
        this.closeModals();
        this.showGameSection();
        this.showSuccessMessage(`Game vs ${opponent} started! ${periodCount} periods of ${periodDuration} min each`);
    }
    
    showGameSection() {
        document.getElementById('teamSection').style.display = 'none';
        document.getElementById('gameSection').style.display = 'block';
        this.updateGameInfo();
        this.renderPeriodSelector();
        this.renderField();
        this.updatePeriodSelector();
    }
    
    updateGameInfo() {
        if (this.currentGame && this.currentTeam) {
            document.getElementById('currentTeamName').textContent = this.currentTeam.name;
            const gameDate = new Date(this.currentGame.date).toLocaleDateString();
            const gameTiming = `${this.currentGame.periodCount} periods × ${this.currentGame.periodDuration}min`;
            document.getElementById('currentGameInfo').textContent = 
                `vs ${this.currentGame.opponent} • ${gameDate} • ${gameTiming}`;
        }
    }
    
    renderPeriodSelector() {
        const container = document.getElementById('periodSelector');
        if (!this.currentGame) {
            container.innerHTML = '';
            return;
        }
        
        const periodCount = this.currentGame.periodCount || 4;
        const periodDuration = this.currentGame.periodDuration || 15;
        const periodsPerHalf = periodCount / 2;
        
        let buttonsHTML = '';
        
        for (let i = 1; i <= periodCount; i++) {
            const isActive = i === this.currentPeriod;
            const halfNumber = i <= periodsPerHalf ? 1 : 2;
            const periodInHalf = i <= periodsPerHalf ? i : i - periodsPerHalf;
            
            // Calculate start and end times for this period
            const startTime = (i - 1) * periodDuration;
            const endTime = i * periodDuration;
            
            // Format times as MM:SS
            const formatTime = (minutes) => {
                const mins = Math.floor(minutes);
                const secs = Math.round((minutes % 1) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            buttonsHTML += `
                <button class="period-btn ${isActive ? 'active' : ''}" 
                        data-period="${i}"
                        title="Half ${halfNumber}, Period ${periodInHalf}: ${formatTime(startTime)} - ${formatTime(endTime)}">
                    <div class="period-main">Period ${i}</div>
                    <div class="period-timing">${formatTime(startTime)}-${formatTime(endTime)}</div>
                </button>
            `;
        }
        
        container.innerHTML = buttonsHTML;
        
        // Ensure current period is valid
        if (this.currentPeriod > periodCount) {
            this.currentPeriod = 1;
        }
        
        // Re-attach event listeners for period buttons
        container.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.currentPeriod = parseInt(e.currentTarget.dataset.period);
                this.updatePeriodSelector();
                this.renderField();
            });
        });
    }
    
    completeGame() {
        if (!this.currentGame) return;
        
        const opponent = this.currentGame.opponent;
        if (confirm(`Complete the game vs ${opponent}?\\n\\nThis will save the game and allow you to start a new one.`)) {
            // Save completed game to history
            const completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
            completedGames.push({
                ...this.currentGame,
                completed: new Date().toISOString()
            });
            localStorage.setItem('soccer_completed_games', JSON.stringify(completedGames));
            
            // Clear current game
            this.currentGame = null;
            this.saveData();
            
            // Return to team section
            this.showTeamSection();
            this.showSuccessMessage(`Game vs ${opponent} completed and saved!`);
        }
    }
    
    // ===== LINEUP MANAGEMENT =====
    renderField() {
        if (!this.currentGame || !this.currentTeam) return;
        
        // First, render the field layout based on team formation
        this.renderFieldLayout();
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Render field positions
        document.querySelectorAll('.position').forEach(pos => {
            const position = pos.dataset.position;
            const player = currentLineup.positions[position];
            
            if (player) {
                pos.textContent = player;
                pos.classList.add('occupied');
            } else {
                pos.textContent = position;
                pos.classList.remove('occupied');
            }
        });
        
        // Render available players
        this.renderAvailablePlayers();
        
        // Render bench players
        this.renderBenchPlayers();
        
        // Update table view if visible
        if (this.currentView === 'table') {
            this.renderTable();
        }
    }
    
    renderFieldLayout() {
        const fieldContainer = document.getElementById('soccerField');
        if (!this.currentTeam || !this.currentTeam.formation || !this.currentTeam.teamSize) {
            // Fallback to default 11v11 layout
            fieldContainer.innerHTML = this.getDefaultFieldHTML();
            return;
        }
        
        const formation = this.formations[this.currentTeam.teamSize][this.currentTeam.formation];
        if (!formation) {
            fieldContainer.innerHTML = this.getDefaultFieldHTML();
            return;
        }
        
        // Create field sections based on formation
        fieldContainer.innerHTML = this.createFormationHTML(formation);
    }
    
    getDefaultFieldHTML() {
        return `
            ${this.getFieldMarkings()}
            <div class="field-section goalkeeper">
                <div class="position" data-position="GK">GK</div>
            </div>
            <div class="field-section defense">
                <div class="position" data-position="LB">LB</div>
                <div class="position" data-position="CB1">CB</div>
                <div class="position" data-position="CB2">CB</div>
                <div class="position" data-position="RB">RB</div>
            </div>
            <div class="field-section midfield">
                <div class="position" data-position="LM">LM</div>
                <div class="position" data-position="CM1">CM</div>
                <div class="position" data-position="CM2">CM</div>
                <div class="position" data-position="RM">RM</div>
            </div>
            <div class="field-section forward">
                <div class="position" data-position="LF">LF</div>
                <div class="position" data-position="CF">CF</div>
                <div class="position" data-position="RF">RF</div>
            </div>
        `;
    }
    
    createFormationHTML(formation) {
        const positions = formation.positions;
        const sections = this.organizePositionsBySections(positions);
        
        let html = this.getFieldMarkings();
        
        // Goalkeeper section (now on left)
        if (sections.goalkeeper.length > 0) {
            html += '<div class="field-section goalkeeper">';
            sections.goalkeeper.forEach(pos => {
                html += `<div class="position" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        // Defense section
        if (sections.defense.length > 0) {
            html += '<div class="field-section defense">';
            sections.defense.forEach(pos => {
                html += `<div class="position" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        // Midfield section
        if (sections.midfield.length > 0) {
            html += '<div class="field-section midfield">';
            sections.midfield.forEach(pos => {
                html += `<div class="position" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        // Forward section (now on right)
        if (sections.forward.length > 0) {
            html += '<div class="field-section forward">';
            sections.forward.forEach(pos => {
                html += `<div class="position" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        return html;
    }
    
    getFieldMarkings() {
        return `
            <!-- Field markings -->
            <div class="penalty-area-top"></div>
            <div class="goal-area-top"></div>
            <div class="penalty-area-bottom"></div>
            <div class="goal-area-bottom"></div>
            <div class="corner-arc top-left"></div>
            <div class="corner-arc top-right"></div>
            <div class="corner-arc bottom-left"></div>
            <div class="corner-arc bottom-right"></div>
        `;
    }
    
    organizePositionsBySections(positions) {
        const sections = {
            goalkeeper: [],
            defense: [],
            midfield: [],
            forward: []
        };
        
        positions.forEach(position => {
            if (position === 'GK') {
                sections.goalkeeper.push(position);
            } else if (['LB', 'CB', 'CB1', 'CB2', 'CB3', 'RB'].includes(position)) {
                sections.defense.push(position);
            } else if (['LM', 'CM', 'CM1', 'CM2', 'CM3', 'RM'].includes(position)) {
                sections.midfield.push(position);
            } else if (['LF', 'CF', 'RF'].includes(position)) {
                sections.forward.push(position);
            }
        });
        
        return sections;
    }
    
    renderAvailablePlayers() {
        const container = document.getElementById('availablePlayers');
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const assignedPlayers = new Set(Object.values(currentLineup.positions));
        const benchPlayers = new Set(currentLineup.bench);
        
        const availablePlayers = this.currentTeam.players.filter(player => 
            !assignedPlayers.has(player.name) && !benchPlayers.has(player.name)
        );
        
        container.innerHTML = availablePlayers.map(player => 
            `<div class="player-item" draggable="true" data-positions="${player.positions.join(',')}">${player.name}</div>`
        ).join('');
    }
    
    renderBenchPlayers() {
        const container = document.getElementById('benchPlayers');
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        const benchPlayerObjects = currentLineup.bench.map(playerName => 
            this.currentTeam.players.find(p => p.name === playerName)
        ).filter(p => p);
        
        container.innerHTML = benchPlayerObjects.map(player => 
            `<div class="player-item" draggable="true" data-positions="${player.positions.join(',')}">${player.name}</div>`
        ).join('');
    }
    
    assignPlayer(position, playerName) {
        if (!this.currentGame) return;
        
        // Check position validity
        const player = this.currentTeam.players.find(p => p.name === playerName);
        if (!player) return;
        
        const validation = this.validatePlayerPosition(player, position);
        
        // Show warning for non-preferred positions but allow assignment
        if (validation.status === 'not-preferred') {
            const confirm = window.confirm(
                `⚠️ ${playerName} doesn't prefer ${this.getPositionGroup(position)} positions.\n\nAssign anyway?`
            );
            if (!confirm) return;
        }
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Remove player from current position/bench
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        
        // Remove any existing player from target position
        delete currentLineup.positions[position];
        
        // Assign player to new position
        currentLineup.positions[position] = playerName;
        
        this.saveData();
        this.renderField();
        
        // Show success message with preference indication
        if (validation.status === 'preferred') {
            this.showSuccessMessage(`✅ ${playerName} assigned to ${position} (preferred position)`);
        } else {
            this.showSuccessMessage(`⚠️ ${playerName} assigned to ${position} (not preferred)`);
        }
    }
    
    validatePlayerPosition(player, position) {
        const positionGroup = this.getPositionGroup(position);
        
        if (player.positions.includes(positionGroup)) {
            return { status: 'preferred', message: 'This is a preferred position' };
        } else {
            return { status: 'not-preferred', message: 'This is not a preferred position' };
        }
    }
    
    getPositionGroup(position) {
        for (const [group, positions] of Object.entries(this.positionGroups)) {
            if (positions.includes(position)) {
                return group;
            }
        }
        return null;
    }
    
    moveToBench(playerName) {
        if (!this.currentGame) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Remove player from current position
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        
        // Remove from bench if already there
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        
        // Add to bench
        currentLineup.bench.push(playerName);
        
        this.saveData();
        this.renderField();
    }
    
    moveToAvailable(playerName) {
        if (!this.currentGame) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Remove player from current position/bench
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        
        this.saveData();
        this.renderField();
    }
    
    // ===== PLAYER SELECTION MODAL =====
    showPlayerSelectionModal(position) {
        if (!this.currentGame || !this.currentTeam) return;
        
        const modal = document.getElementById('playerModal');
        const title = document.getElementById('playerModalTitle');
        const playersList = document.getElementById('playersList');
        
        const positionGroup = this.getPositionGroup(position);
        title.textContent = `Select Player for ${position} (${positionGroup})`;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const assignedPlayers = new Set(Object.values(currentLineup.positions));
        const benchPlayers = new Set(currentLineup.bench);
        
        let availablePlayers = this.currentTeam.players.filter(player => 
            !assignedPlayers.has(player.name) && !benchPlayers.has(player.name)
        );
        
        // Add current player in position if any
        const currentPlayerName = currentLineup.positions[position];
        if (currentPlayerName) {
            const currentPlayerObj = this.currentTeam.players.find(p => p.name === currentPlayerName);
            if (currentPlayerObj) {
                availablePlayers.unshift(currentPlayerObj);
            }
        }
        
        // Sort by preference: preferred players first
        availablePlayers.sort((a, b) => {
            const aPreferred = a.positions.includes(positionGroup);
            const bPreferred = b.positions.includes(positionGroup);
            
            if (aPreferred && !bPreferred) return -1;
            if (!aPreferred && bPreferred) return 1;
            return 0;
        });
        
        playersList.innerHTML = availablePlayers.map(player => {
            const isPreferred = player.positions.includes(positionGroup);
            const isCurrent = currentPlayerName === player.name;
            const preferenceIcon = isPreferred ? '✅' : '⚠️';
            const preferenceText = isPreferred ? 'preferred' : 'not preferred';
            
            return `
                <div class="player-option ${isPreferred ? 'preferred' : 'not-preferred'}" 
                     onclick="app.assignPlayer('${position}', '${player.name}'); app.closeModals();">
                    ${preferenceIcon} ${player.name} 
                    <small>(${preferenceText})</small>
                    ${isCurrent ? '<strong>(current)</strong>' : ''}
                </div>
            `;
        }).join('');
        
        if (availablePlayers.length === 0) {
            playersList.innerHTML = '<p class="empty-state">No available players</p>';
        }
        
        modal.style.display = 'flex';
    }
    
    // ===== VIEW MANAGEMENT =====
    toggleView() {
        this.currentView = this.currentView === 'field' ? 'table' : 'field';
        
        const fieldView = document.getElementById('fieldView');
        const tableView = document.getElementById('tableView');
        const toggleBtn = document.getElementById('viewToggleBtn');
        
        if (this.currentView === 'table') {
            fieldView.style.display = 'none';
            tableView.style.display = 'block';
            toggleBtn.textContent = '🏟️ Field View';
            this.renderTable();
        } else {
            fieldView.style.display = 'block';
            tableView.style.display = 'none';
            toggleBtn.textContent = '📋 Table View';
        }
    }
    
    renderTable() {
        if (!this.currentGame || !this.currentTeam) return;
        
        const tbody = document.querySelector('#lineupTable tbody');
        const thead = document.querySelector('#lineupTable thead tr');
        const periodCount = this.currentGame.periodCount || 4;
        
        // Update table header with dynamic periods and stats column
        let headerHTML = '<th>Player</th>';
        for (let i = 1; i <= periodCount; i++) {
            const periodDuration = this.currentGame.periodDuration || 15;
            const startTime = (i - 1) * periodDuration;
            const endTime = i * periodDuration;
            const formatTime = (minutes) => {
                const mins = Math.floor(minutes);
                const secs = Math.round((minutes % 1) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            headerHTML += `<th>P${i}<br><small>${formatTime(startTime)}-${formatTime(endTime)}</small></th>`;
        }
        headerHTML += '<th>Statistics</th>';
        thead.innerHTML = headerHTML;
        
        // Get all players from the team
        const allPlayers = this.currentTeam.players.map(p => p.name);
        
        // Create player-based rows
        tbody.innerHTML = allPlayers.map(playerName => {
            let row = `<tr><td><strong>${playerName}</strong></td>`;
            
            for (let period = 1; period <= periodCount; period++) {
                let assignment = '-';
                let substitutionInfo = '';
                const periodLineup = this.currentGame.lineup[period];
                
                if (periodLineup) {
                    // Check if player is in a field position
                    for (const [position, player] of Object.entries(periodLineup.positions)) {
                        if (player === playerName) {
                            assignment = position;
                            
                            // Check for substitution (if not first period)
                            if (period > 1) {
                                const previousLineup = this.currentGame.lineup[period - 1];
                                if (previousLineup && previousLineup.positions[position]) {
                                    const previousPlayer = previousLineup.positions[position];
                                    // If this player wasn't in this position last period
                                    if (previousPlayer !== playerName) {
                                        substitutionInfo = ` <span class="substitution">(sub for ${previousPlayer})</span>`;
                                    }
                                }
                            }
                            break;
                        }
                    }
                    
                    // If not in a field position, check if on bench
                    if (assignment === '-' && periodLineup.bench.includes(playerName)) {
                        assignment = '<span class="bench-indicator">Bench</span>';
                    }
                }
                
                row += `<td>${assignment}${substitutionInfo}</td>`;
            }
            
            // Add statistics column
            const stats = this.calculatePlayerStats(playerName);
            row += `<td class="stats-column">${this.formatPlayerStats(stats)}</td>`;
            
            row += '</tr>';
            return row;
        }).join('');
        
        // Add summary row showing players per period
        if (allPlayers.length > 0) {
            let summaryHTML = '<tr style="border-top: 2px solid #e2e8f0; background: #f8fafc;"><td><strong>Playing Count</strong></td>';
            
            // Show how many players are playing in each period
            for (let period = 1; period <= periodCount; period++) {
                const periodLineup = this.currentGame.lineup[period];
                const playingCount = periodLineup ? Object.keys(periodLineup.positions).length : 0;
                summaryHTML += `<td><small>${playingCount} players</small></td>`;
            }
            
            // Add empty stats column for summary row
            summaryHTML += '<td class="stats-column"><small>Team Stats</small></td>';
            
            summaryHTML += '</tr>';
            tbody.innerHTML += summaryHTML;
        }
    }
    
    // ===== PLAYER STATISTICS =====
    calculatePlayerStats(playerName) {
        if (!this.currentGame || !this.currentTeam) return null;
        
        const periodCount = this.currentGame.periodCount || 4;
        const periodDuration = this.currentGame.periodDuration || 15;
        
        let benchCount = 0;
        let totalPlayingMinutes = 0;
        const positionCounts = {};
        
        // Iterate through all periods
        for (let period = 1; period <= periodCount; period++) {
            const periodLineup = this.currentGame.lineup[period];
            
            if (periodLineup) {
                // Check if player is on bench
                if (periodLineup.bench.includes(playerName)) {
                    benchCount++;
                } else {
                    // Check if player is in a field position
                    let foundPosition = null;
                    for (const [position, player] of Object.entries(periodLineup.positions)) {
                        if (player === playerName) {
                            foundPosition = position;
                            break;
                        }
                    }
                    
                    if (foundPosition) {
                        // Count position occurrences
                        positionCounts[foundPosition] = (positionCounts[foundPosition] || 0) + 1;
                        // Add playing time
                        totalPlayingMinutes += periodDuration;
                    }
                }
            }
        }
        
        return {
            benchCount,
            totalPlayingMinutes,
            positionCounts,
            periodsPlayed: periodCount - benchCount,
            averageMinutesPerPeriod: totalPlayingMinutes / Math.max(1, periodCount - benchCount)
        };
    }
    
    formatPlayerStats(stats) {
        if (!stats) return '-';
        
        const positionList = Object.entries(stats.positionCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .map(([pos, count]) => `${pos}(${count})`)
            .join(', ');
        
        return `
            <div class="player-stats">
                <div class="stat-line"><strong>${stats.totalPlayingMinutes}min</strong> total</div>
                <div class="stat-line">Bench: ${stats.benchCount}x</div>
                ${positionList ? `<div class="stat-line positions">${positionList}</div>` : ''}
            </div>
        `;
    }
    
    updatePeriodSelector() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.period) === this.currentPeriod);
        });
    }
    
    // ===== UI HELPERS =====
    updateUI() {
        // Show appropriate sections
        if (this.currentGame && this.currentTeam) {
            this.showGameSection();
        } else {
            this.showTeamSection();
        }
        
        // Update new game button visibility
        document.getElementById('newGameBtn').style.display = 
            this.currentTeam && !this.currentGame ? 'inline-flex' : 'none';
    }
    
    closeModals() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
    }
    
    showSuccessMessage(message) {
        // Simple success message - could be enhanced with a proper toast system
        const originalTitle = document.title;
        document.title = `✅ ${message}`;
        setTimeout(() => {
            document.title = originalTitle;
        }, 3000);
        
        // Console log for now
        console.log(`✅ ${message}`);
    }
}

// ===== INITIALIZE APP =====
let app;
document.addEventListener('DOMContentLoaded', () => {
    console.log('🏁 DOM loaded, starting app...');
    app = new SoccerApp();
});

// ===== KEYBOARD SHORTCUTS =====
document.addEventListener('keydown', (e) => {
    // ESC to close modals
    if (e.key === 'Escape') {
        app.closeModals();
    }
    
    // Number keys to switch periods (when in game)
    if (app.currentGame && e.key >= '1' && e.key <= '4') {
        app.currentPeriod = parseInt(e.key);
        app.updatePeriodSelector();
        app.renderField();
    }
    
    // V key to toggle view
    if (app.currentGame && e.key === 'v') {
        app.toggleView();
    }
});