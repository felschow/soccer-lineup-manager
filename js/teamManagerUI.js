// Team Manager UI Module
// Handles the user interface for team management

const TeamManagerUI = {
    isEditing: false,
    currentEditingTeamId: null,

    // Initialize UI
    init() {
        this.refreshTeamSelector();
        this.updateCurrentTeamInfo();
    },

    // Refresh the team selector dropdown
    refreshTeamSelector() {
        const select = document.getElementById('teamSelect');
        const teams = TeamManager.getAllTeams();
        
        // Clear existing options except first
        while (select.children.length > 1) {
            select.removeChild(select.lastChild);
        }
        
        // Add teams
        teams.forEach(team => {
            const option = document.createElement('option');
            option.value = team.id;
            option.textContent = team.name;
            if (TeamManager.currentTeam && team.id === TeamManager.currentTeam.id) {
                option.selected = true;
            }
            select.appendChild(option);
        });
    },

    // Update current team info display
    updateCurrentTeamInfo() {
        const infoSection = document.getElementById('currentTeamInfo');
        const nameElement = document.getElementById('currentTeamName');
        const statsElement = document.getElementById('currentTeamStats');
        const logoElement = document.getElementById('currentTeamLogo');
        const logoImg = document.getElementById('currentTeamLogoImg');
        const useTeamBtn = document.getElementById('useTeamBtn');
        
        if (TeamManager.currentTeam) {
            const team = TeamManager.currentTeam;
            const playerCount = Object.keys(team.players).length;
            const activeTeam = TeamManager.getActiveTeam();
            const isActiveTeam = activeTeam && activeTeam.id === team.id;
            
            nameElement.textContent = team.name;
            statsElement.textContent = `${playerCount} players • Created ${this.formatDate(team.created)}`;
            
            // Update logo display
            if (team.logo) {
                logoImg.src = team.logo;
                logoElement.style.display = 'block';
            } else {
                logoElement.style.display = 'none';
            }
            
            // Update Use Team button
            if (isActiveTeam) {
                useTeamBtn.textContent = 'Currently Active';
                useTeamBtn.disabled = true;
                useTeamBtn.classList.add('btn-success');
                useTeamBtn.classList.remove('btn-primary');
            } else {
                useTeamBtn.textContent = 'Use This Team';
                useTeamBtn.disabled = false;
                useTeamBtn.classList.add('btn-primary');
                useTeamBtn.classList.remove('btn-success');
            }
            
            infoSection.style.display = 'block';
        } else {
            infoSection.style.display = 'none';
        }
    },

    // Format date for display
    formatDate(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString();
    },

    // Show team creation form
    showCreateTeam() {
        this.isEditing = false;
        this.currentEditingTeamId = null;
        
        document.getElementById('teamFormTitle').textContent = 'Create New Team';
        document.getElementById('teamNameInput').value = '';
        document.getElementById('playersList').innerHTML = '';
        
        // Add initial empty player
        this.addPlayerRow();
        
        document.getElementById('teamSelectionSection').style.display = 'none';
        document.getElementById('teamFormSection').style.display = 'block';
    },

    // Show team editing form
    showEditTeam() {
        if (!TeamManager.currentTeam) return;
        
        this.isEditing = true;
        this.currentEditingTeamId = TeamManager.currentTeam.id;
        
        document.getElementById('teamFormTitle').textContent = 'Edit Team';
        document.getElementById('teamNameInput').value = TeamManager.currentTeam.name;
        
        // Populate logo if exists
        if (TeamManager.currentTeam.logo) {
            const preview = document.getElementById('logoPreview');
            const previewImg = document.getElementById('logoPreviewImg');
            
            previewImg.src = TeamManager.currentTeam.logo;
            preview.style.display = 'block';
            window.currentLogoData = TeamManager.currentTeam.logo;
        } else {
            const preview = document.getElementById('logoPreview');
            preview.style.display = 'none';
            window.currentLogoData = null;
        }
        
        // Populate players
        const playersList = document.getElementById('playersList');
        playersList.innerHTML = '';
        
        Object.entries(TeamManager.currentTeam.players).forEach(([name, positions]) => {
            this.addPlayerRow(name, positions);
        });
        
        // Add empty row for new players
        this.addPlayerRow();
        
        document.getElementById('teamSelectionSection').style.display = 'none';
        document.getElementById('teamFormSection').style.display = 'block';
    },

    // Add player row to form
    addPlayerRow(playerName = '', positions = ['All']) {
        const playersList = document.getElementById('playersList');
        const playerDiv = document.createElement('div');
        playerDiv.className = 'player-row';
        
        const positionCheckboxes = TeamManager.positionOptions.map(pos => {
            const isChecked = positions.includes(pos);
            return `
                <label class="position-checkbox">
                    <input type="checkbox" value="${pos}" ${isChecked ? 'checked' : ''}>
                    <span>${pos}</span>
                </label>
            `;
        }).join('');
        
        playerDiv.innerHTML = `
            <div class="player-input-group">
                <input type="text" class="player-name-input" placeholder="Player name" value="${playerName}" maxlength="30">
                <button type="button" class="btn-remove-player" onclick="TeamManagerUI.removePlayerRow(this)" title="Remove player">×</button>
            </div>
            <div class="position-preferences">
                <label class="positions-label">Positions:</label>
                <div class="position-checkboxes">
                    ${positionCheckboxes}
                </div>
            </div>
        `;
        
        playersList.appendChild(playerDiv);
        
        // Focus on the name input if it's empty
        if (!playerName) {
            playerDiv.querySelector('.player-name-input').focus();
        }
    },

    // Remove player row
    removePlayerRow(button) {
        const playerRow = button.closest('.player-row');
        playerRow.remove();
    },

    // Add new empty player row
    addNewPlayer() {
        this.addPlayerRow();
    },

    // Cancel team form
    cancelTeamForm() {
        document.getElementById('teamFormSection').style.display = 'none';
        document.getElementById('teamSelectionSection').style.display = 'block';
        this.clearFormErrors();
        
        // Clear form data
        document.getElementById('teamForm').reset();
        document.getElementById('logoPreview').style.display = 'none';
        window.currentLogoData = null;
        this.isEditing = false;
        this.currentEditingTeamId = null;
    },

    // Clear form validation errors
    clearFormErrors() {
        document.querySelectorAll('.form-error').forEach(error => {
            error.textContent = '';
        });
        document.querySelectorAll('.form-group input').forEach(input => {
            input.classList.remove('error');
        });
    },

    // Show form error
    showFormError(fieldId, message) {
        const errorElement = document.getElementById(fieldId + 'Error');
        const inputElement = document.getElementById(fieldId);
        
        if (errorElement) errorElement.textContent = message;
        if (inputElement) inputElement.classList.add('error');
    },

    // Collect form data
    collectFormData() {
        const teamName = document.getElementById('teamNameInput').value.trim();
        const logo = window.currentLogoData || null;
        const players = {};
        
        document.querySelectorAll('.player-row').forEach(row => {
            const nameInput = row.querySelector('.player-name-input');
            const name = nameInput.value.trim();
            
            if (name) {
                const checkboxes = row.querySelectorAll('.position-checkboxes input[type="checkbox"]:checked');
                const positions = Array.from(checkboxes).map(cb => cb.value);
                
                if (positions.length === 0) {
                    positions.push('All'); // Default if none selected
                }
                
                players[name] = positions;
            }
        });
        
        return { teamName, logo, players };
    },

    // Validate form data
    validateFormData(data) {
        const errors = [];
        
        // Validate team name
        const teamNameError = TeamManager.validateTeamName(data.teamName);
        if (teamNameError) {
            this.showFormError('teamNameInput', teamNameError);
            errors.push(teamNameError);
        }
        
        // Validate players
        const playerNames = Object.keys(data.players);
        if (playerNames.length === 0) {
            errors.push('At least one player is required');
        }
        
        // Check for duplicate player names
        const duplicates = playerNames.filter((name, index) => playerNames.indexOf(name) !== index);
        if (duplicates.length > 0) {
            errors.push(`Duplicate player names: ${duplicates.join(', ')}`);
        }
        
        // Validate each player name
        playerNames.forEach(name => {
            const nameError = TeamManager.validatePlayerName(name);
            if (nameError) {
                errors.push(`Player "${name}": ${nameError}`);
            }
        });
        
        return errors;
    },

    // Export current team
    exportCurrentTeam() {
        if (!TeamManager.currentTeam) {
            ToastManager.warning('No team selected to export');
            return;
        }
        
        try {
            const teamData = TeamManager.exportTeam(TeamManager.currentTeam.id);
            const dataStr = JSON.stringify(teamData, null, 2);
            const blob = new Blob([dataStr], { type: 'application/json' });
            
            const link = document.createElement('a');
            link.href = URL.createObjectURL(blob);
            link.download = `${TeamManager.currentTeam.name.replace(/[^a-z0-9]/gi, '_')}_team.json`;
            link.click();
            
            ToastManager.success('Team exported successfully');
        } catch (error) {
            console.error('Export failed:', error);
            ToastManager.error('Failed to export team');
        }
    },

    // Import team
    importTeam() {
        const fileInput = document.getElementById('teamImportFile');
        const file = fileInput.files[0];
        
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const teamData = JSON.parse(e.target.result);
                const team = TeamManager.importTeam(teamData);
                
                this.refreshTeamSelector();
                ToastManager.success(`Team "${team.name}" imported successfully`);
                
                // Clear file input
                fileInput.value = '';
            } catch (error) {
                console.error('Import failed:', error);
                ToastManager.error('Failed to import team. Invalid file format.');
            }
        };
        
        reader.readAsText(file);
    }
};

// Global functions for HTML event handlers
function openTeamManager() {
    document.getElementById('teamManagerModal').style.display = 'flex';
    TeamManagerUI.init();
}

function closeTeamManager() {
    document.getElementById('teamManagerModal').style.display = 'none';
}

// Use the currently selected team
function useCurrentTeam() {
    if (!TeamManager.currentTeam) {
        ToastManager.error('No team selected');
        return;
    }
    
    try {
        TeamManager.setActiveTeam(TeamManager.currentTeam.id);
        TeamManagerUI.updateCurrentTeamInfo();
        ToastManager.success(`Now using team: ${TeamManager.currentTeam.name}`);
        closeTeamManager();
    } catch (error) {
        console.error('Failed to set active team:', error);
        ToastManager.error('Failed to set active team');
    }
}

// Handle logo upload
function handleLogoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        ToastManager.error('Please select an image file');
        input.value = '';
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        ToastManager.error('Image must be smaller than 2MB');
        input.value = '';
        return;
    }
    
    const reader = new FileReader();
    reader.onload = (e) => {
        const logoData = e.target.result;
        
        // Show preview
        const preview = document.getElementById('logoPreview');
        const previewImg = document.getElementById('logoPreviewImg');
        
        previewImg.src = logoData;
        preview.style.display = 'block';
        
        // Store for saving
        window.currentLogoData = logoData;
    };
    
    reader.readAsDataURL(file);
}

// Remove logo
function removeLogo() {
    const preview = document.getElementById('logoPreview');
    const input = document.getElementById('teamLogoInput');
    
    preview.style.display = 'none';
    input.value = '';
    window.currentLogoData = null;
}

function handleTeamSelection() {
    const select = document.getElementById('teamSelect');
    const teamId = select.value;
    
    if (teamId) {
        try {
            TeamManager.loadTeam(teamId);
            TeamManagerUI.updateCurrentTeamInfo();
            ToastManager.success(`Loaded team: ${TeamManager.currentTeam.name}`);
        } catch (error) {
            console.error('Failed to load team:', error);
            ToastManager.error('Failed to load team');
        }
    } else {
        TeamManager.currentTeam = null;
        TeamManager.updateSoccerConfig();
        TeamManagerUI.updateCurrentTeamInfo();
        if (window.UIManager) {
            UIManager.renderPlayerList();
            UIManager.updateDisplay();
        }
    }
}

function showCreateTeam() {
    TeamManagerUI.showCreateTeam();
}

function showEditTeam() {
    TeamManagerUI.showEditTeam();
}

function addNewPlayer() {
    TeamManagerUI.addNewPlayer();
}

function cancelTeamForm() {
    TeamManagerUI.cancelTeamForm();
}

function saveTeam(event) {
    event.preventDefault();
    TeamManagerUI.clearFormErrors();
    
    const formData = TeamManagerUI.collectFormData();
    const errors = TeamManagerUI.validateFormData(formData);
    
    if (errors.length > 0) {
        ToastManager.error(errors[0]);
        return;
    }
    
    try {
        if (TeamManagerUI.isEditing) {
            // Update existing team
            TeamManager.updateTeam({
                name: formData.teamName,
                players: formData.players
            });
            
            // Update logo if changed
            if (formData.logo) {
                TeamManager.updateTeamLogo(TeamManager.currentTeam.id, formData.logo);
            }
            
            ToastManager.success('Team updated successfully');
        } else {
            // Create new team
            const team = TeamManager.createTeam(formData.teamName, 
                Object.entries(formData.players).map(([name, positions]) => ({ name, positions }))
            );
            
            // Add logo if provided
            if (formData.logo) {
                TeamManager.updateTeamLogo(team.id, formData.logo);
            }
            
            TeamManager.loadTeam(team.id);
            ToastManager.success('Team created and loaded successfully');
        }
        
        TeamManagerUI.refreshTeamSelector();
        TeamManagerUI.updateCurrentTeamInfo();
        TeamManagerUI.cancelTeamForm();
        
        // Update UI
        if (window.UIManager) {
            UIManager.renderPlayerList();
            UIManager.updateDisplay();
        }
    } catch (error) {
        console.error('Failed to save team:', error);
        ToastManager.error('Failed to save team: ' + error.message);
    }
}

function deleteCurrentTeam() {
    if (!TeamManager.currentTeam) {
        ToastManager.warning('No team selected to delete');
        return;
    }
    
    const teamName = TeamManager.currentTeam.name;
    if (confirm(`Are you sure you want to delete the team "${teamName}"? This action cannot be undone.`)) {
        try {
            const teamId = TeamManager.currentTeam.id;
            TeamManager.deleteTeam(teamId);
            
            TeamManagerUI.refreshTeamSelector();
            TeamManagerUI.updateCurrentTeamInfo();
            ToastManager.success(`Team "${teamName}" deleted`);
            
            // Update UI
            if (window.UIManager) {
                UIManager.renderPlayerList();
                UIManager.updateDisplay();
            }
        } catch (error) {
            console.error('Failed to delete team:', error);
            ToastManager.error('Failed to delete team');
        }
    }
}

function exportCurrentTeam() {
    TeamManagerUI.exportCurrentTeam();
}

function importTeam() {
    TeamManagerUI.importTeam();
}