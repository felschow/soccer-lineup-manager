// Availability UI Manager
// Handles user interactions for player availability status

const AvailabilityUI = {
    // Initialize availability UI
    init() {
        this.setupEventListeners();
        this.createAvailabilitySummary();
        console.log('Availability UI initialized');
    },

    // Setup event listeners for availability controls
    setupEventListeners() {
        // Double-click to open availability controls
        document.addEventListener('dblclick', (e) => {
            const playerCard = e.target.closest('.player-card');
            if (playerCard) {
                const playerName = playerCard.dataset.player;
                if (playerName) {
                    this.toggleAvailabilityControls(playerCard, playerName);
                }
            }
        });

        // Right-click context menu for quick availability
        document.addEventListener('contextmenu', (e) => {
            const playerCard = e.target.closest('.player-card');
            if (playerCard) {
                e.preventDefault();
                const playerName = playerCard.dataset.player;
                if (playerName) {
                    this.showQuickAvailabilityMenu(e, playerCard, playerName);
                }
            }
        });

        // Click outside to close controls
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.availability-controls') && !e.target.closest('.player-card')) {
                this.closeAllAvailabilityControls();
            }
        });

        // Listen for availability changes
        document.addEventListener('playerAvailabilityChanged', (e) => {
            this.updateAvailabilitySummary();
        });
    },

    // Toggle availability controls for a player card
    toggleAvailabilityControls(playerCard, playerName) {
        const controls = playerCard.querySelector('.availability-controls');
        if (!controls) return;

        const isVisible = controls.style.display !== 'none';
        
        // Close all other controls first
        this.closeAllAvailabilityControls();

        if (!isVisible) {
            // Show controls
            controls.style.display = 'block';
            this.initializeAvailabilityControls(controls, playerName);
        }
    },

    // Initialize controls with current availability data
    initializeAvailabilityControls(controls, playerName) {
        const availability = PlayerAvailability.getPlayerAvailability(playerName);
        
        // Set current status button as selected
        const buttons = controls.querySelectorAll('.availability-btn');
        buttons.forEach(btn => {
            btn.classList.remove('selected');
            if (btn.dataset.status === availability.status) {
                btn.classList.add('selected');
            }
        });

        // Set current notes
        const notesInput = controls.querySelector('.availability-notes-input');
        if (notesInput) {
            notesInput.value = availability.notes || '';
        }

        // Setup button event listeners
        buttons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                buttons.forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
            });
        });

        // Setup save button
        const saveBtn = controls.querySelector('.availability-save-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.savePlayerAvailability(controls, playerName);
            });
        }

        // Setup enter key on notes input
        if (notesInput) {
            notesInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.savePlayerAvailability(controls, playerName);
                }
            });
        }
    },

    // Save player availability from controls
    savePlayerAvailability(controls, playerName) {
        const selectedBtn = controls.querySelector('.availability-btn.selected');
        const notesInput = controls.querySelector('.availability-notes-input');
        
        if (!selectedBtn) return;

        const status = selectedBtn.dataset.status;
        const notes = notesInput ? notesInput.value.trim() : '';

        const success = PlayerAvailability.setPlayerAvailability(playerName, status, notes);
        
        if (success) {
            if (window.ToastManager) {
                const statusInfo = PlayerAvailability.getStatusDisplayInfo(status);
                ToastManager.show(`${playerName} marked as ${statusInfo.label.toLowerCase()}`, 'success');
            }
            
            // Close controls
            controls.style.display = 'none';
        }
    },

    // Close all availability controls
    closeAllAvailabilityControls() {
        const allControls = document.querySelectorAll('.availability-controls');
        allControls.forEach(controls => {
            controls.style.display = 'none';
        });
    },

    // Show quick availability context menu
    showQuickAvailabilityMenu(event, playerCard, playerName) {
        const menu = this.createQuickMenu(playerName);
        
        // Position menu at cursor
        menu.style.left = event.pageX + 'px';
        menu.style.top = event.pageY + 'px';
        
        document.body.appendChild(menu);
        
        // Remove menu after delay or when clicked elsewhere
        setTimeout(() => {
            if (menu.parentNode) {
                menu.remove();
            }
        }, 5000);
    },

    // Create quick availability menu
    createQuickMenu(playerName) {
        const menu = document.createElement('div');
        menu.className = 'availability-quick-menu';
        menu.innerHTML = `
            <div class="quick-menu-header">${playerName}</div>
            <button class="quick-menu-btn" data-status="available" data-player="${playerName}">
                ✅ Available
            </button>
            <button class="quick-menu-btn" data-status="injured" data-player="${playerName}">
                🤕 Injured
            </button>
            <button class="quick-menu-btn" data-status="absent" data-player="${playerName}">
                ❌ Absent
            </button>
            <button class="quick-menu-btn" data-status="late" data-player="${playerName}">
                ⏰ Late
            </button>
        `;

        // Add styles
        menu.style.cssText = `
            position: absolute;
            background: white;
            border: 1px solid #d1d5db;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
            z-index: 1000;
            min-width: 120px;
        `;

        // Add button event listeners
        menu.querySelectorAll('.quick-menu-btn').forEach(btn => {
            btn.style.cssText = `
                display: block;
                width: 100%;
                padding: 6px 8px;
                border: none;
                background: white;
                text-align: left;
                cursor: pointer;
                border-radius: 4px;
                font-size: 12px;
                transition: background 0.2s;
            `;
            
            btn.addEventListener('mouseenter', () => {
                btn.style.background = '#f3f4f6';
            });
            
            btn.addEventListener('mouseleave', () => {
                btn.style.background = 'white';
            });
            
            btn.addEventListener('click', (e) => {
                const status = btn.dataset.status;
                const player = btn.dataset.player;
                
                PlayerAvailability.setPlayerAvailability(player, status);
                
                if (window.ToastManager) {
                    const statusInfo = PlayerAvailability.getStatusDisplayInfo(status);
                    ToastManager.show(`${player} marked as ${statusInfo.label.toLowerCase()}`, 'success');
                }
                
                menu.remove();
            });
        });

        return menu;
    },

    // Create availability summary widget
    createAvailabilitySummary() {
        const quickStatsSection = document.getElementById('quickStats');
        if (!quickStatsSection) return;

        const summaryDiv = document.createElement('div');
        summaryDiv.id = 'availabilitySummary';
        summaryDiv.className = 'availability-summary';
        
        quickStatsSection.appendChild(summaryDiv);
        this.updateAvailabilitySummary();
    },

    // Update availability summary
    updateAvailabilitySummary() {
        const summaryDiv = document.getElementById('availabilitySummary');
        if (!summaryDiv) return;

        const summary = PlayerAvailability.getAvailabilitySummary();
        const statusInfo = PlayerAvailability.STATUS_INFO;
        
        summaryDiv.innerHTML = `
            <h4>Player Status</h4>
            <div class="availability-counts-grid">
                <div class="availability-count">
                    <span>Available:</span>
                    <span class="count" style="background: ${statusInfo.available.color}">${summary.available}</span>
                </div>
                <div class="availability-count">
                    <span>Injured:</span>
                    <span class="count" style="background: ${statusInfo.injured.color}">${summary.injured}</span>
                </div>
                <div class="availability-count">
                    <span>Absent:</span>
                    <span class="count" style="background: ${statusInfo.absent.color}">${summary.absent}</span>
                </div>
                <div class="availability-count">
                    <span>Late:</span>
                    <span class="count" style="background: ${statusInfo.late.color}">${summary.late}</span>
                </div>
            </div>
            <button id="resetAvailabilityBtn" class="availability-reset-btn">Reset All</button>
        `;

        // Add reset button functionality
        const resetBtn = document.getElementById('resetAvailabilityBtn');
        if (resetBtn) {
            resetBtn.style.cssText = `
                width: 100%;
                padding: 6px 8px;
                background: #f3f4f6;
                border: 1px solid #d1d5db;
                border-radius: 4px;
                cursor: pointer;
                font-size: 11px;
                transition: background 0.2s;
            `;
            
            resetBtn.addEventListener('click', () => {
                if (confirm('Reset all players to available?')) {
                    PlayerAvailability.resetAllToAvailable();
                }
            });
        }
    },

    // Add availability controls to team management
    addToTeamManager() {
        const teamInfo = document.getElementById('currentTeamInfo');
        if (!teamInfo) return;

        const availabilitySection = document.createElement('div');
        availabilitySection.className = 'team-availability-section';
        availabilitySection.innerHTML = `
            <h4>Team Availability</h4>
            <div class="team-availability-controls">
                <button id="bulkAvailableBtn" class="bulk-availability-btn">Mark All Available</button>
                <button id="exportAvailabilityBtn" class="bulk-availability-btn">Export Status</button>
                <button id="importAvailabilityBtn" class="bulk-availability-btn">Import Status</button>
            </div>
        `;

        teamInfo.appendChild(availabilitySection);
        this.setupTeamAvailabilityControls();
    },

    // Setup team-level availability controls
    setupTeamAvailabilityControls() {
        const bulkAvailableBtn = document.getElementById('bulkAvailableBtn');
        const exportBtn = document.getElementById('exportAvailabilityBtn');
        const importBtn = document.getElementById('importAvailabilityBtn');

        if (bulkAvailableBtn) {
            bulkAvailableBtn.addEventListener('click', () => {
                PlayerAvailability.resetAllToAvailable();
            });
        }

        if (exportBtn) {
            exportBtn.addEventListener('click', () => {
                const data = PlayerAvailability.exportAvailabilityData();
                const blob = new Blob([JSON.stringify(data, null, 2)], { 
                    type: 'application/json' 
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `availability-${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                URL.revokeObjectURL(url);
            });
        }

        if (importBtn) {
            importBtn.addEventListener('click', () => {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                            try {
                                const data = JSON.parse(e.target.result);
                                PlayerAvailability.importAvailabilityData(data);
                            } catch (error) {
                                if (window.ToastManager) {
                                    ToastManager.show('Invalid availability file', 'error');
                                }
                            }
                        };
                        reader.readAsText(file);
                    }
                };
                input.click();
            });
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AvailabilityUI;
}