// Application Router - Manages user flow and navigation
// Creates clear step-by-step journey: Login → Teams → Games → In-Game

import authManager from './auth.js';
import databaseManager from './databaseManager.js';

class AppRouter {
    constructor() {
        this.currentView = null;
        this.viewStack = [];
        this.init();
    }

    init() {
        // Listen for auth state changes to route appropriately
        authManager.onAuthStateChange((event, user) => {
            if (event === 'signin') {
                this.navigateTo('dashboard');
            } else if (event === 'signout') {
                this.navigateTo('login');
            }
        });

        // Initialize routing based on current auth state
        if (authManager.isAuthenticated()) {
            this.navigateTo('dashboard');
        } else {
            this.navigateTo('login');
        }

        // Handle browser back/forward
        window.addEventListener('popstate', (e) => {
            if (e.state?.view) {
                this.showView(e.state.view, e.state.data, false);
            }
        });
    }

    // **NAVIGATION METHODS**
    navigateTo(view, data = null, pushState = true) {
        this.showView(view, data, pushState);
    }

    goBack() {
        if (this.viewStack.length > 1) {
            this.viewStack.pop(); // Remove current
            const previous = this.viewStack[this.viewStack.length - 1];
            this.showView(previous.view, previous.data, false);
        }
    }

    // **VIEW MANAGEMENT**
    showView(viewName, data = null, pushState = true) {
        // Hide all views
        document.querySelectorAll('[data-view]').forEach(view => {
            view.style.display = 'none';
        });

        // Update navigation state
        if (pushState) {
            this.viewStack.push({ view: viewName, data });
            history.pushState({ view: viewName, data }, '', `#${viewName}`);
        }

        this.currentView = viewName;

        // Show requested view and update navigation
        this.renderView(viewName, data);
        this.updateNavigation();
    }

    renderView(viewName, data) {
        switch (viewName) {
            case 'login':
                this.renderLoginView();
                break;
            case 'register':
                this.renderRegisterView();
                break;
            case 'dashboard':
                this.renderDashboardView();
                break;
            case 'team-setup':
                this.renderTeamSetupView(data);
                break;
            case 'game-planning':
                this.renderGamePlanningView(data);
                break;
            case 'active-game':
                this.renderActiveGameView(data);
                break;
            default:
                this.renderDashboardView();
        }
    }

    // **VIEW RENDERERS**
    renderLoginView() {
        const container = this.getOrCreateView('login');
        container.innerHTML = `
            <div class="auth-container">
                <div class="auth-card">
                    <div class="auth-header">
                        <h2>⚽ Soccer Coach</h2>
                        <p>Manage your team lineups and game strategy</p>
                    </div>
                    <form id="loginForm" class="auth-form">
                        <div class="form-group">
                            <input type="email" id="email" placeholder="Email Address" required>
                        </div>
                        <div class="form-group">
                            <input type="password" id="password" placeholder="Password" required>
                        </div>
                        <button type="submit" class="btn-primary">Sign In</button>
                        <button type="button" id="googleLoginBtn" class="btn-secondary">
                            <span class="icon">🔗</span> Sign in with Google
                        </button>
                    </form>
                    <div class="auth-footer">
                        <p>Don't have an account? 
                            <a href="#" id="showRegister">Create one</a>
                        </p>
                    </div>
                </div>
            </div>
        `;

        // Add event listeners
        document.getElementById('loginForm').addEventListener('submit', this.handleLogin.bind(this));
        document.getElementById('googleLoginBtn').addEventListener('click', this.handleGoogleLogin.bind(this));
        document.getElementById('showRegister').addEventListener('click', (e) => {
            e.preventDefault();
            this.navigateTo('register');
        });
    }

    renderDashboardView() {
        const container = this.getOrCreateView('dashboard');
        container.innerHTML = `
            <div class="dashboard-container">
                <div class="dashboard-header">
                    <h1>My Teams</h1>
                    <button id="createTeamBtn" class="btn-primary">
                        <span class="icon">➕</span> Create Team
                    </button>
                </div>
                <div id="teamsGrid" class="teams-grid">
                    <div class="loading">Loading your teams...</div>
                </div>
            </div>
        `;

        // Load and display teams
        this.loadTeams();

        // Add event listeners
        document.getElementById('createTeamBtn').addEventListener('click', () => {
            this.navigateTo('team-setup');
        });
    }

    renderTeamSetupView(teamData = null) {
        const isEdit = teamData !== null;
        const container = this.getOrCreateView('team-setup');
        
        container.innerHTML = `
            <div class="team-setup-container">
                <div class="setup-header">
                    <button id="backBtn" class="btn-back">← Back</button>
                    <h1>${isEdit ? 'Edit Team' : 'Create New Team'}</h1>
                </div>
                
                <form id="teamSetupForm" class="team-setup-form">
                    <div class="setup-section">
                        <h3>Team Information</h3>
                        <div class="form-group">
                            <label>Team Name</label>
                            <input type="text" id="teamName" required 
                                   value="${teamData?.name || ''}" placeholder="Enter team name">
                        </div>
                        <div class="form-group">
                            <label>Team Logo</label>
                            <input type="file" id="logoUpload" accept="image/*">
                            ${teamData?.logo_url ? `<img src="${teamData.logo_url}" class="current-logo">` : ''}
                        </div>
                    </div>

                    <div class="setup-section">
                        <h3>Game Format</h3>
                        <div class="player-count-selector">
                            ${[4, 7, 9, 11].map(count => `
                                <label class="count-option">
                                    <input type="radio" name="playerCount" value="${count}"
                                           ${(teamData?.player_count || 11) === count ? 'checked' : ''}>
                                    <span>${count}v${count}</span>
                                </label>
                            `).join('')}
                        </div>
                    </div>

                    <div class="setup-section">
                        <h3>Formation</h3>
                        <div id="formationSelector" class="formation-selector">
                            <!-- Will be populated based on player count -->
                        </div>
                    </div>

                    <div class="setup-section">
                        <h3>Players</h3>
                        <div id="playersSection" class="players-section">
                            <!-- Will be populated dynamically -->
                        </div>
                        <button type="button" id="addPlayerBtn" class="btn-secondary">
                            Add Player
                        </button>
                    </div>

                    <div class="setup-actions">
                        <button type="submit" class="btn-primary">
                            ${isEdit ? 'Update Team' : 'Create Team'}
                        </button>
                    </div>
                </form>
            </div>
        `;

        // Add event listeners
        document.getElementById('backBtn').addEventListener('click', () => this.goBack());
        document.getElementById('teamSetupForm').addEventListener('submit', this.handleTeamSave.bind(this));
        
        // Initialize form based on player count
        this.initializeTeamSetupForm(teamData);
    }

    // **EVENT HANDLERS**
    async handleLogin(e) {
        e.preventDefault();
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;

        const result = await authManager.login(email, password);
        if (!result.success) {
            this.showError(result.error);
        }
        // Success handled by auth state change listener
    }

    async handleGoogleLogin() {
        const result = await authManager.loginWithGoogle();
        if (!result.success) {
            this.showError(result.error);
        }
    }

    async handleTeamSave(e) {
        e.preventDefault();
        // Implementation for saving team data
        // Will integrate with databaseManager
    }

    // **UTILITY METHODS**
    getOrCreateView(viewName) {
        let view = document.querySelector(`[data-view="${viewName}"]`);
        if (!view) {
            view = document.createElement('div');
            view.setAttribute('data-view', viewName);
            view.className = 'app-view';
            document.body.appendChild(view);
        }
        return view;
    }

    async loadTeams() {
        try {
            const teams = await databaseManager.getTeams();
            this.renderTeamsGrid(teams);
        } catch (error) {
            this.showError('Failed to load teams');
        }
    }

    renderTeamsGrid(teams) {
        const grid = document.getElementById('teamsGrid');
        if (teams.length === 0) {
            grid.innerHTML = `
                <div class="empty-state">
                    <h3>No teams yet</h3>
                    <p>Create your first team to get started</p>
                </div>
            `;
            return;
        }

        grid.innerHTML = teams.map(team => `
            <div class="team-card" data-team-id="${team.id}">
                ${team.logo_url ? `<img src="${team.logo_url}" class="team-logo">` : '<div class="team-logo-placeholder">⚽</div>'}
                <h3>${team.name}</h3>
                <p>${team.player_count}v${team.player_count} • ${Object.keys(team.players || {}).length} players</p>
                <div class="team-actions">
                    <button class="btn-primary" onclick="appRouter.selectTeam('${team.id}')">
                        Plan Game
                    </button>
                    <button class="btn-secondary" onclick="appRouter.editTeam('${team.id}')">
                        Edit
                    </button>
                </div>
            </div>
        `).join('');
    }

    selectTeam(teamId) {
        this.navigateTo('game-planning', { teamId });
    }

    editTeam(teamId) {
        // Load team data and navigate to edit view
        databaseManager.getTeams().then(teams => {
            const team = teams.find(t => t.id === teamId);
            if (team) {
                this.navigateTo('team-setup', team);
            }
        });
    }

    updateNavigation() {
        // Update desktop sidebar and mobile navigation state
        // Hide/show navigation based on current view
        const needsNavigation = ['dashboard', 'game-planning', 'active-game'].includes(this.currentView);
        
        const sidebar = document.querySelector('.desktop-sidebar');
        const mobileNav = document.querySelector('.mobile-bottom-nav');
        
        if (sidebar) sidebar.style.display = needsNavigation ? 'flex' : 'none';
        if (mobileNav) mobileNav.style.display = needsNavigation ? 'block' : 'none';
    }

    showError(message) {
        // Integrate with existing toast system
        if (window.ToastManager) {
            ToastManager.show(message, 'error');
        } else {
            alert(message);
        }
    }
}

// Export singleton instance
const appRouter = new AppRouter();
window.appRouter = appRouter; // Make available globally for HTML onclick handlers
export default appRouter;