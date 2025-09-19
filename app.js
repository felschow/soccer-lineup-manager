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

        // History functionality
        this.historicalGame = null;
        this.isViewingHistory = false;

        // Authentication enforcement
        this.isAuthenticated = false;
        this.enforceAuthentication();

        // Game Timer functionality
        this.gameTimer = {
            isRunning: false,
            startTime: null,
            elapsedTime: 0,
            intervalId: null,
            notifications: [],
            threeMinuteWarning: false,
            oneMinuteWarning: false
        };
        
        // Device detection for mobile vs desktop experience protection
        this.isMobile = this.detectMobileDevice();
        this.isTouch = 'ontouchstart' in window;
        this.isDesktop = !this.isMobile;
        
        // Position mappings
        this.positionGroups = {
            'Forward': ['LF', 'CF', 'RF'],
            'Midfield': ['LM', 'CM', 'CM1', 'CM2', 'CM3', 'RM'],
            'Defense': ['LB', 'CB', 'CB1', 'CB2', 'CB3', 'RB'],
            'Goalkeeper': ['GK']
        };
        
        // Formation definitions by team size
        this.formations = {
            4: {
                '2-2': { name: '2-2', description: 'Balanced', positions: ['LB', 'RB', 'LF', 'RF'] },
                '1-3': { name: '1-3', description: 'Attacking', positions: ['CB', 'LF', 'CF', 'RF'] },
                '3-1': { name: '3-1', description: 'Defensive', positions: ['LB', 'CB', 'RB', 'CF'] }
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
        
        // Note: init() will be called asynchronously after DOM is ready
    }
    
    // ===== DEVICE DETECTION FOR MOBILE VS DESKTOP PROTECTION =====
    detectMobileDevice() {
        // Multiple detection methods for reliability
        const userAgent = navigator.userAgent.toLowerCase();
        const mobileKeywords = ['mobile', 'android', 'iphone', 'ipad', 'ipod', 'blackberry', 'windows phone'];
        const hasMobileKeyword = mobileKeywords.some(keyword => userAgent.includes(keyword));
        
        // Check screen size (below 768px is considered mobile)
        const isSmallScreen = window.innerWidth <= 768;
        
        // Check for touch capability
        const isTouchDevice = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        
        // Mobile if any condition is true, but prioritize screen size for responsive behavior
        return isSmallScreen || (hasMobileKeyword && isTouchDevice);
    }
    
    // Method to ensure desktop functionality is protected
    protectDesktopFeature(callback) {
        if (this.isDesktop) {
            return callback();
        }
        // Return null or default behavior for mobile to prevent desktop feature execution
        return null;
    }
    
    // Method to safely add mobile-only features
    addMobileOnlyFeature(callback) {
        if (this.isMobile) {
            return callback();
        }
        return null;
    }
    
    async init() {

        // Add device classes to body for CSS targeting
        document.body.classList.add(this.isMobile ? 'mobile-device' : 'desktop-device');
        if (this.isTouch) document.body.classList.add('touch-device');

        // Initialize authentication
        this.initializeAuth();

        await this.loadData();
        this.setupEventListeners();
        this.renderTeams();
        this.updateUI();
        this.initializeNavigation();
    }

    // ===== AUTHENTICATION =====
    initializeAuth() {
        try {
            // Wait for Firebase service to be available
            if (typeof window.firebaseService === 'undefined' || !window.firebaseAuth || !window.firebaseDb) {
                console.log('Waiting for Firebase services...');
                setTimeout(() => this.initializeAuth(), 200);
                return;
            }

            // Additional check for Firebase readiness
            if (!window.firebaseService.auth || !window.firebaseService.db) {
                console.log('Firebase service not fully initialized...');
                setTimeout(() => this.initializeAuth(), 200);
                return;
            }

        } catch (error) {
            console.error('Error during Firebase initialization check:', error);
            // Show user-friendly error instead of infinite retry
            if (window.errorHandler) {
                window.errorHandler.reportCustomError('Initialization Error',
                    'Failed to connect to database services', { error: error.message });
            }
            setTimeout(() => this.initializeAuth(), 1000);
            return;
        }

        // Set up authentication event listeners
        window.addEventListener('userSignedIn', (event) => {
            this.onUserSignedIn(event.detail);
        });

        window.addEventListener('userSignedOut', () => {
            this.onUserSignedOut();
        });

        // Set up auth form event listeners
        this.setupAuthEventListeners();
        this.setupAuthTabs();

        // Check initial auth state
        if (window.firebaseService.isAuthenticated()) {
            this.hideAuthModal();
            this.showUserMenu();
            this.loadCloudData();
        } else {
            this.showAuthPage();
        }
    }

    setupAuthTabs() {
        const loginTab = document.getElementById('loginTabBtn');
        const signupTab = document.getElementById('signupTabBtn');
        const loginForm = document.getElementById('signInForm');
        const signupForm = document.getElementById('signUpForm');

        if (loginTab && signupTab && loginForm && signupForm) {
            loginTab.addEventListener('click', () => {
                loginTab.classList.add('active');
                signupTab.classList.remove('active');
                loginForm.classList.add('active');
                signupForm.classList.remove('active');
            });

            signupTab.addEventListener('click', () => {
                signupTab.classList.add('active');
                loginTab.classList.remove('active');
                signupForm.classList.add('active');
                loginForm.classList.remove('active');
            });
        }
    }

    setupAuthEventListeners() {

        // Use event delegation for form toggles
        document.addEventListener('click', (e) => {

            // Sign up form toggle
            if (e.target.id === 'showSignUpBtn' || e.target.closest('#showSignUpBtn')) {
                this.switchAuthForm('signUp');
            }

            // Sign in form toggle
            if (e.target.id === 'showSignInBtn' || e.target.closest('#showSignInBtn')) {
                this.switchAuthForm('signIn');
            }
        });

        // Google sign in buttons
        // Google sign-in removed per user request

        // Email forms
        const emailSignInForm = document.getElementById('emailSignInForm');
        const emailSignUpForm = document.getElementById('emailSignUpForm');

        if (emailSignInForm) {
            emailSignInForm.addEventListener('submit', (e) => this.handleEmailSignIn(e));
        }

        if (emailSignUpForm) {
            emailSignUpForm.addEventListener('submit', (e) => this.handleEmailSignUp(e));
        }

        // User menu
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }

        // User icon click to toggle menu
        const userIcon = document.getElementById('userIcon');
        if (userIcon) {
            userIcon.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleUserMenu();
            });
        }

        // Auth error handling
        const authErrorClose = document.getElementById('authErrorClose');
        if (authErrorClose) {
            authErrorClose.addEventListener('click', () => this.hideAuthError());
        }

        // Click outside user menu to close
        document.addEventListener('click', (e) => {
            const userMenu = document.getElementById('userMenu');
            const userIcon = document.getElementById('userIcon');

            if (userMenu && userMenu.style.display !== 'none' &&
                !userMenu.contains(e.target) &&
                !userIcon.contains(e.target)) {
                userMenu.style.display = 'none';
            }
        });
    }

    switchAuthForm(formType) {
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');

        if (!signInForm || !signUpForm) return;

        // Remove active class from both forms
        signInForm.classList.remove('active');
        signUpForm.classList.remove('active');

        // Add active class to target form
        if (formType === 'signUp') {
            signUpForm.classList.add('active');

            // On mobile/small screen, scroll to show the sign up form
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    const authModal = document.querySelector('.auth-modal');
                    if (authModal && signUpForm) {
                        // Scroll to the bottom of the modal to show sign up form
                        authModal.scrollTo({
                            top: authModal.scrollHeight,
                            behavior: 'smooth'
                        });
                    }
                }, 200);
            }
        } else {
            signInForm.classList.add('active');

            // On mobile/small screen, scroll to the new form
            if (window.innerWidth <= 768) {
                setTimeout(() => {
                    const authModal = document.querySelector('.auth-modal');
                    if (authModal) {
                        authModal.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    }
                }, 200);
            }
        }
    }

    async handleGoogleSignIn() {
        this.showAuthLoading();

        const result = await window.firebaseService.signInWithGoogle();

        if (result.success) {
            // Success is handled by the auth state listener
        } else {
            this.showAuthError(result.error);
            if (window.errorHandler) {
                window.errorHandler.reportCustomError('Authentication Error',
                    'Google sign in failed', { error: result.error });
            }
        }

        this.hideAuthLoading();
    }

    async handleEmailSignIn(event) {
        event.preventDefault();
        this.showAuthLoading();

        const email = document.getElementById('signInEmail').value;
        const password = document.getElementById('signInPassword').value;

        const result = await window.firebaseService.signInWithEmail(email, password);

        if (result.success) {
            // Success is handled by the auth state listener
        } else {
            this.showAuthError(result.error);
        }
    }

    async handleEmailSignUp(event) {
        event.preventDefault();

        const email = document.getElementById('signUpEmail').value;
        const password = document.getElementById('signUpPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (password !== confirmPassword) {
            this.showAuthError('Passwords do not match');
            return;
        }

        if (password.length < 6) {
            this.showAuthError('Password must be at least 6 characters');
            return;
        }

        this.showAuthLoading();

        const result = await window.firebaseService.signUpWithEmail(email, password);

        if (result.success) {
            // Success is handled by the auth state listener
        } else {
            this.showAuthError(result.error);
        }
    }

    async handleSignOut() {
        const result = await window.firebaseService.signOut();

        if (result.success) {
            // Sign out is handled by the auth state listener
        } else {
            console.error('Sign out error:', result.error);
        }
    }

    onUserSignedIn(user) {
        this.hideAuthModal();
        this.showUserMenu();
        this.updateUserDisplay(user);
        this.loadCloudData();
    }

    onUserSignedOut() {
        this.hideUserMenu();
        this.showAuthModal();
        this.clearLocalData();
    }

    updateUserDisplay(user) {
        const userDisplayName = document.getElementById('userDisplayName');
        const userEmail = document.getElementById('userEmail');
        const userAvatar = document.getElementById('userAvatar');
        const userInitials = document.getElementById('userInitials');

        if (userDisplayName) {
            userDisplayName.textContent = user.displayName || user.email.split('@')[0];
        }

        if (userEmail) {
            userEmail.textContent = user.email;
        }

        if (user.photoURL && userAvatar) {
            userAvatar.src = user.photoURL;
            userAvatar.style.display = 'block';
            userInitials.style.display = 'none';
        } else if (userInitials) {
            const name = user.displayName || user.email;
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
            userInitials.textContent = initials;
            userInitials.style.display = 'flex';
            if (userAvatar) userAvatar.style.display = 'none';
        }
    }

    // Auth UI Management
    showAuthModal() {
        const authModal = document.getElementById('authModal');
        if (authModal) {
            authModal.style.display = 'flex';
            this.hideAuthLoading();
            this.hideAuthError();
        }
    }

    showAuthPage() {
        const authPage = document.getElementById('authPage');
        if (authPage) {
            authPage.style.display = 'block';
        }
    }

    hideAuthPage() {
        const authPage = document.getElementById('authPage');
        if (authPage) {
            authPage.style.display = 'none';
        }
    }

    // Legacy method for compatibility
    hideAuthModal() {
        this.hideAuthPage();
    }

    showUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.style.display = 'block';
        }
    }

    hideUserMenu() {
        const userMenu = document.getElementById('userMenu');
        if (userMenu) {
            userMenu.style.display = 'none';
        }
    }

    showAuthLoading() {
        const authLoading = document.getElementById('authLoading');
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');
        const authError = document.getElementById('authError');

        if (authLoading) authLoading.style.display = 'block';
        if (signInForm) signInForm.style.display = 'none';
        if (signUpForm) signUpForm.style.display = 'none';
        if (authError) authError.style.display = 'none';
    }

    hideAuthLoading() {
        const authLoading = document.getElementById('authLoading');
        const signInForm = document.getElementById('signInForm');

        if (authLoading) authLoading.style.display = 'none';
        if (signInForm) signInForm.style.display = 'block';
    }

    showAuthError(message) {
        const authError = document.getElementById('authError');
        const errorMessage = authError?.querySelector('.error-message');
        const authLoading = document.getElementById('authLoading');
        const signInForm = document.getElementById('signInForm');
        const signUpForm = document.getElementById('signUpForm');

        if (authError && errorMessage) {
            errorMessage.textContent = message;
            authError.style.display = 'block';
        }

        if (authLoading) authLoading.style.display = 'none';
        if (signInForm) signInForm.style.display = 'none';
        if (signUpForm) signUpForm.style.display = 'none';
    }

    hideAuthError() {
        const authError = document.getElementById('authError');
        const signInForm = document.getElementById('signInForm');

        if (authError) authError.style.display = 'none';
        if (signInForm) signInForm.style.display = 'block';
    }

    async loadCloudData() {
        try {
            // Load teams from Firestore
            const cloudTeams = await window.firebaseService.getTeams();
            if (cloudTeams.length > 0) {
                this.teams = cloudTeams;
            }

            // Load current game from Firestore
            const currentGame = await window.firebaseService.getCurrentGame();
            if (currentGame) {
                this.currentGame = currentGame;
                this.currentTeam = this.teams.find(t => t.id === currentGame.teamId);
            }

            // Refresh UI with cloud data
            this.renderTeams();
            this.updateUI();
            this.initializeNavigation();

        } catch (error) {
            console.error('Error loading cloud data:', error);
            // Fall back to local data if cloud fails
            this.loadData();
        }
    }

    clearLocalData() {
        // Clear local state
        this.teams = [];
        this.currentTeam = null;
        this.currentGame = null;
        this.currentPeriod = 1;
        this.historicalGame = null;
        this.isViewingHistory = false;

        // Clear localStorage as backup
        localStorage.removeItem('soccer_teams');
        localStorage.removeItem('soccer_current_game');
        localStorage.removeItem('soccer_completed_games');

        // Reset UI
        this.renderTeams();
        this.updateUI();
        this.switchTab('teamsTab');
    }

    async handleSignOut() {
        try {
            // Sign out from Firebase
            const result = await window.firebaseService.signOut();

            if (result.success) {
                // The userSignedOut event will be triggered automatically by Firebase
                // which will call handleUserSignedOut() to clear data and update UI
            } else {
                console.error('Sign out error:', result.error);
                this.showErrorMessage('Failed to sign out. Please try again.');
            }
        } catch (error) {
            console.error('Sign out error:', error);
            this.showErrorMessage('Failed to sign out. Please try again.');
        }
    }

    async onUserSignedIn(user) {

        try {
            // Mark as authenticated and unblock app
            this.isAuthenticated = true;
            this.unblockAllInteractions();

            // Show user icon, hide auth page, show app
            const userIcon = document.getElementById('userIcon');
            const authPage = document.getElementById('authPage');
            const appContainer = document.querySelector('.app-container');

            if (userIcon) userIcon.style.display = 'block';
            if (authPage) authPage.style.display = 'none';
            if (appContainer) appContainer.style.display = 'block';
        } catch (error) {
            console.error('Error updating UI elements:', error);
        }

        try {
            // Update user info in menu
            const userDisplayName = document.getElementById('userDisplayName');
            const userEmail = document.getElementById('userEmail');

            if (userDisplayName) userDisplayName.textContent = user.displayName || user.email;
            if (userEmail) userEmail.textContent = user.email;

            // Create initials from email or display name
            const name = user.displayName || user.email;
            const initials = name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

            // Set user avatar or initials in both menu and icon
            const menuAvatar = document.getElementById('userAvatar');
            const menuInitials = document.getElementById('userInitials');
            const iconAvatar = document.getElementById('userIconAvatar');
            const iconInitials = document.getElementById('userIconInitials');

            if (user.photoURL) {
                // Set photo for both menu and icon
                if (menuAvatar) {
                    menuAvatar.src = user.photoURL;
                    menuAvatar.style.display = 'block';
                }
                if (menuInitials) menuInitials.style.display = 'none';

                if (iconAvatar) {
                    iconAvatar.src = user.photoURL;
                    iconAvatar.style.display = 'block';
                }
                if (iconInitials) iconInitials.style.display = 'none';
            } else {
                // Set initials for both menu and icon
                if (menuAvatar) menuAvatar.style.display = 'none';
                if (menuInitials) {
                    menuInitials.style.display = 'flex';
                    menuInitials.textContent = initials;
                }

                if (iconAvatar) iconAvatar.style.display = 'none';
                if (iconInitials) {
                    iconInitials.style.display = 'flex';
                    iconInitials.textContent = initials;
                }
            }
        } catch (error) {
            console.error('Error updating user display:', error);
        }

        // Load user's cloud data
        try {
            await this.loadCloudData();
        } catch (error) {
            console.error('Error loading cloud data:', error);
        }
    }

    onUserSignedOut() {

        // Hide user icon and menu
        document.getElementById('userIcon').style.display = 'none';
        document.getElementById('userMenu').style.display = 'none';

        // Show authentication modal
        document.getElementById('authModal').style.display = 'block';

        // Clear user data and switch to localStorage
        this.handleUserSignedOut();
    }

    handleUserSignedOut() {
        // Mark as not authenticated and enforce login
        this.isAuthenticated = false;
        this.enforceAuthentication();

        // Clear all user data
        this.clearLocalData();

        // Re-render teams (will show empty state for non-authenticated user)
        this.renderTeams();

        // Switch back to teams tab
        this.switchTab('teamsTab');

        // Update UI
        this.updateUI();
    }

    toggleUserMenu() {
        try {
            const userMenu = document.getElementById('userMenu');
            if (userMenu) {
                if (userMenu.style.display === 'none' || userMenu.style.display === '') {
                    userMenu.style.display = 'flex';
                } else {
                    userMenu.style.display = 'none';
                }
            }
        } catch (error) {
            console.error('Error toggling user menu:', error);
        }
    }

    // ===== TAB NAVIGATION =====
    async switchTab(targetTab) {
        // Hide all tab contents
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        // Remove active state from all nav items
        document.querySelectorAll('.nav-item, .nav-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        
        // Show target tab content
        document.getElementById(targetTab).classList.add('active');
        
        // Activate nav item
        document.querySelector(`[data-tab="${targetTab}"]`).classList.add('active');
        
        // Update header title
        this.updateHeaderForTab(targetTab);
        
        // Handle tab-specific logic
        if (targetTab === 'fieldTab' || targetTab === 'tableTab') {
            // Ensure we have a current game (unless viewing history)
            if (!this.currentGame && !this.isViewingHistory) {
                this.switchTab('teamsTab');
                return;
            }
        }

        if (targetTab === 'fieldTab') {
            this.renderField();
            this.updateGameInfo();
        } else if (targetTab === 'tableTab') {
            this.renderTable();
            this.updateExportButtonVisibility();
            this.updateTeamHeader();
        } else if (targetTab === 'historyTab') {
            await this.renderGameHistory();
        } else if (targetTab === 'timerTab') {
            this.initializeGameTimer();
        }
        
        // Update FAB
        this.updateFAB(targetTab);
    }
    
    handleFabClick() {
        const activeTab = document.querySelector('.tab-content.active').id;
        
        switch(activeTab) {
            case 'teamsTab':
                if (this.currentTeam && !this.currentGame) {
                    this.showGameModal();
                } else {
                    this.showTeamCreation();
                }
                break;
            case 'fieldTab':
            case 'tableTab':
                this.completeGame();
                break;
            case 'settingsTab':
                // Could add settings actions here
                break;
        }
    }
    
    updateFAB(activeTab) {
        const fab = document.getElementById('fab');
        const fabIcon = document.querySelector('.fab-icon');
        
        // FAB element was removed from HTML, so skip if not found
        if (!fab) {
            return;
        }
        
        switch(activeTab) {
            case 'teamsTab':
                if (this.currentTeam && !this.currentGame) {
                    fab.classList.add('show');
                    fabIcon.textContent = '🎮';
                    fab.title = 'Start New Game';
                } else {
                    fab.classList.add('show');
                    fabIcon.textContent = '+';
                    fab.title = 'Create Team';
                }
                break;
            case 'fieldTab':
            case 'tableTab':
                if (this.currentGame) {
                    fab.classList.add('show');
                    fabIcon.textContent = '✅';
                    fab.title = 'Complete Game';
                } else {
                    fab.classList.remove('show');
                }
                break;
            case 'settingsTab':
                fab.classList.remove('show');
                break;
            default:
                fab.classList.remove('show');
        }
    }
    
    updateHeaderForTab(tabId) {
        // Header elements removed - unified headers handle this now
        // Method kept for compatibility but no longer performs any actions
    }
    
    initializeNavigation() {
        // Start with teams tab if no current game, otherwise field tab
        if (this.currentGame) {
            this.switchTab('fieldTab');
        } else {
            this.switchTab('teamsTab');
        }
    }
    
    // ===== DATA PERSISTENCE =====
    async loadData() {
        // For authenticated users, use Firebase; otherwise use localStorage as fallback
        if (window.firebaseService && window.firebaseService.isAuthenticated()) {
            try {
                // Load teams from Firebase
                this.teams = await window.firebaseService.getTeams();

                // Load current game from Firebase
                const currentGame = await window.firebaseService.getCurrentGame();
                if (currentGame) {
                    this.currentGame = currentGame;
                    // Find the team for this game
                    this.currentTeam = this.teams.find(t => t.id === this.currentGame.teamId);
                }
            } catch (error) {
                console.error('Error loading cloud data:', error);
                // Fallback to localStorage
                this.loadLocalData();
            }
        } else {
            // Load from localStorage for non-authenticated users
            this.loadLocalData();
        }
    }

    loadLocalData() {
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
            console.error('Error loading local data:', error);
        }
    }

    async saveData() {
        // For authenticated users, save to Firebase; otherwise use localStorage
        if (window.firebaseService && window.firebaseService.isAuthenticated()) {
            try {
                // Save teams to Firebase
                await this.saveTeamsToFirebase();

                // Save current game to Firebase
                if (this.currentGame) {
                    await window.firebaseService.saveGame(this.currentGame);
                }
            } catch (error) {
                console.error('Error saving to cloud:', error);
                // Fallback to localStorage
                this.saveLocalData();
            }
        } else {
            // Save to localStorage for non-authenticated users
            this.saveLocalData();
        }
    }

    saveLocalData() {
        try {
            localStorage.setItem('soccer_teams', JSON.stringify(this.teams));
            if (this.currentGame) {
                localStorage.setItem('soccer_current_game', JSON.stringify(this.currentGame));
            } else {
                localStorage.removeItem('soccer_current_game');
            }
        } catch (error) {
            console.error('Error saving local data:', error);
        }
    }

    async saveTeamsToFirebase() {
        // Save each team individually to Firebase
        for (const team of this.teams) {
            try {
                await window.firebaseService.saveTeam(team);
            } catch (error) {
                console.error('Error saving team to Firebase:', team.name, error);
            }
        }
    }
    
    // ===== EVENT LISTENERS =====
    setupEventListeners() {
        // Navigation (both new and legacy)
        document.querySelectorAll('.nav-item, .nav-tab').forEach(tab => {
            tab.addEventListener('click', async (e) => {
                const targetTab = e.currentTarget.dataset.tab;
                await this.switchTab(targetTab);
            });
        });

        // Team management - Create team button with document delegation
        document.addEventListener('click', (e) => {
            if (e.target.closest('.create-team-btn') || e.target.closest('#createTeamBtn')) {
                console.log('Create team button clicked via document delegation!');
                this.showTeamCreation();
            }
        });
        
        // Team creation page
        const backToTeamsBtn = document.getElementById('backToTeamsBtn');
        if (backToTeamsBtn) backToTeamsBtn.addEventListener('click', () => this.showTeamSection());
        const cancelTeamBtn = document.getElementById('cancelTeamBtn');
        if (cancelTeamBtn) cancelTeamBtn.addEventListener('click', () => this.showTeamSection());
        const addPlayerBtn = document.getElementById('addPlayerBtn');
        if (addPlayerBtn) addPlayerBtn.addEventListener('click', () => this.addPlayerRow());
        const teamForm = document.getElementById('teamForm');
        if (teamForm) teamForm.addEventListener('submit', (e) => this.handleTeamSubmit(e));
        
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
        
        // Period selector - will be added dynamically
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('period-btn')) {
                this.currentPeriod = parseInt(e.target.dataset.period);
                this.updatePeriodSelector();
                this.renderField();
            }
        });
        
        // Game completion
        const completeGameBtn = document.getElementById('completeGameBtn');
        if (completeGameBtn) completeGameBtn.addEventListener('click', () => this.completeGame());
        
        // Clear Period
        const clearPeriodBtn = document.getElementById('clearPeriodBtn');
        if (clearPeriodBtn) clearPeriodBtn.addEventListener('click', () => this.clearCurrentPeriod());
        
        // Floating action button (if exists)
        const fab = document.getElementById('fab');
        if (fab) fab.addEventListener('click', () => this.handleFabClick());
        
        // Export table functionality
        const exportTableBtn = document.getElementById('exportTableBtn');
        if (exportTableBtn) exportTableBtn.addEventListener('click', () => this.exportTableView());

        // Settings functionality
        const exportDataBtn = document.getElementById('exportDataBtn');
        if (exportDataBtn) exportDataBtn.addEventListener('click', () => this.exportAllData());
        const clearDataBtn = document.getElementById('clearDataBtn');
        if (clearDataBtn) clearDataBtn.addEventListener('click', () => this.clearAllData());

        // History functionality
        const backToCurrentBtn = document.getElementById('backToCurrentBtn');
        if (backToCurrentBtn) backToCurrentBtn.addEventListener('click', () => this.backToCurrentGame());
        const historicalFieldBtn = document.getElementById('historicalFieldBtn');
        if (historicalFieldBtn) historicalFieldBtn.addEventListener('click', () => this.showHistoricalView('field'));
        const historicalTableBtn = document.getElementById('historicalTableBtn');
        if (historicalTableBtn) historicalTableBtn.addEventListener('click', () => this.showHistoricalView('table'));

        // Game Timer functionality
        const timerPlayPause = document.getElementById('timerPlayPause');
        if (timerPlayPause) timerPlayPause.addEventListener('click', () => this.toggleTimer());
        const timerPrevious = document.getElementById('timerPrevious');
        if (timerPrevious) timerPrevious.addEventListener('click', () => this.previousPeriod());
        const timerNext = document.getElementById('timerNext');
        if (timerNext) timerNext.addEventListener('click', () => this.nextPeriod());
        const emergencySubBtn = document.getElementById('emergencySubBtn');
        if (emergencySubBtn) emergencySubBtn.addEventListener('click', () => this.showEmergencySubModal());
        const injurySubBtn = document.getElementById('injurySubBtn');
        if (injurySubBtn) injurySubBtn.addEventListener('click', () => this.showInjurySubModal());
        const skipPeriodBtn = document.getElementById('skipPeriodBtn');
        if (skipPeriodBtn) skipPeriodBtn.addEventListener('click', () => this.skipToNextPeriod());
        const gameNotesBtn = document.getElementById('gameNotesBtn');
        if (gameNotesBtn) gameNotesBtn.addEventListener('click', () => this.showGameNotesModal());
        
        // Modal handling
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && (e.target.classList.contains('modal') || e.target.classList.contains('modal-close'))) {
                this.closeModals();
            }
        });
        
        // Player option selection in modal
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && (e.target.classList.contains('player-option') || e.target.closest('.player-option'))) {
                const option = e.target.classList.contains('player-option') ? e.target : e.target.closest('.player-option');
                const position = option.dataset.position;
                const playerName = option.dataset.player;
                if (position && playerName) {
                    this.assignPlayer(position, playerName);
                    this.closeModals();
                }
            }
        });
        
        // Form submissions
        const gameForm = document.getElementById('gameForm');
        if (gameForm) gameForm.addEventListener('submit', (e) => this.handleGameSubmit(e));
        
        // Field position clicks - handle both selection and removal
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('position')) {
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
            if (e.target && e.target.classList && e.target.classList.contains('remove-player-btn')) {
                e.target.closest('.player-row').remove();
            }
        });
        
        // Drag and Drop + Tap interactions (desktop only)
        this.protectDesktopFeature(() => {
            this.setupDragAndDrop();
            this.setupDesktopTapInteractions();
        });
        
        // Mobile-specific field interactions
        this.addMobileOnlyFeature(() => {
            this.setupMobileFieldInteractions();
        });
    }
    
    // ===== MOBILE-SPECIFIC FIELD INTERACTIONS =====
    setupMobileFieldInteractions() {
        // Replace drag-and-drop with tap-to-select for mobile
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('position')) {
                e.preventDefault();
                const position = e.target.dataset.position;
                if (position) {
                    this.showPlayerSelectionModal(position);
                }
            }
            
            // Handle clicks on bench and jersey prep headers
            if (e.target && e.target.tagName === 'H3') {
                if (e.target.textContent === 'Bench') {
                    e.preventDefault();
                    this.showPlayerSelectionModal('bench');
                }
                if (e.target.textContent === 'Jersey Prep') {
                    e.preventDefault();
                    this.showPlayerSelectionModal('jersey');
                }
            }
            
            // Handle clicks on bench and jersey prep player items to remove them
            if (e.target && e.target.classList && 
                (e.target.classList.contains('bench-player') || e.target.classList.contains('jersey-player'))) {
                e.preventDefault();
                const playerNameElement = e.target.querySelector('.player-name');
                const playerName = playerNameElement ? playerNameElement.textContent : e.target.textContent;
                if (playerName) {
                    this.moveToAvailable(playerName.trim());
                }
            }
            
            // Handle clicks on player name spans within bench/jersey items
            if (e.target && e.target.classList && e.target.classList.contains('player-name')) {
                const playerItem = e.target.closest('.bench-player') || e.target.closest('.jersey-player');
                if (playerItem) {
                    e.preventDefault();
                    const playerName = e.target.textContent;
                    if (playerName) {
                        this.moveToAvailable(playerName.trim());
                    }
                }
            }
        });
        
        // Enhanced touch feedback for field positions
        document.addEventListener('touchstart', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('position')) {
                e.target.classList.add('touch-active');
            }
        });
        
        document.addEventListener('touchend', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('position')) {
                setTimeout(() => {
                    e.target.classList.remove('touch-active');
                }, 150);
            }
        });
    }
    
    setupDragAndDrop() {
        document.addEventListener('dragstart', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('player-item')) {
                // Get player name from the player-name span
                const playerNameElement = e.target.querySelector('.player-name');
                this.draggedPlayer = playerNameElement ? playerNameElement.textContent : e.target.textContent;
                e.target.classList.add('dragging');
                
                // Highlight drop targets
                document.querySelectorAll('.position:not(.occupied), .players-list, .jersey-slot').forEach(el => {
                    el.classList.add('drop-target');
                });
            }
        });
        
        document.addEventListener('dragend', (e) => {
            if (e.target && e.target.classList && e.target.classList.contains('player-item')) {
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
            if (e.target && e.target.classList && (e.target.classList.contains('position') || e.target.classList.contains('players-list') || e.target.classList.contains('jersey-slot'))) {
                e.target.classList.add('drop-over');
            }
        });
        
        document.addEventListener('dragleave', (e) => {
            if (e.target && e.target.classList && (e.target.classList.contains('position') || e.target.classList.contains('players-list') || e.target.classList.contains('jersey-slot'))) {
                e.target.classList.remove('drop-over');
            }
        });
        
        document.addEventListener('drop', (e) => {
            e.preventDefault();
            if (e.target && e.target.classList) {
                e.target.classList.remove('drop-over');
            }
            
            if (this.draggedPlayer && e.target) {
                if (e.target.classList && e.target.classList.contains('position')) {
                    this.assignPlayer(e.target.dataset.position, this.draggedPlayer);
                } else if (e.target.id === 'jerseyPlayers' || (e.target.classList && e.target.classList.contains('jersey-slot'))) {
                    this.moveToJersey(this.draggedPlayer);
                } else if (e.target.id === 'benchPlayers' || (e.target.classList && e.target.classList.contains('bench'))) {
                    this.moveToBench(this.draggedPlayer);
                } else if (e.target.id === 'availablePlayers' || (e.target.classList && e.target.classList.contains('available'))) {
                    this.moveToAvailable(this.draggedPlayer);
                }
            }
        });
    }
    
    // ===== DESKTOP TAP INTERACTIONS =====
    setupDesktopTapInteractions() {
        // Desktop click handlers for player names (show available positions)
        document.addEventListener('click', (e) => {
            // Only proceed if not already handled by drag operations
            if (this.draggedPlayer) return;
            
            // Handle player name clicks in available players list
            if (e.target && e.target.classList && e.target.classList.contains('player-name')) {
                const playerItem = e.target.closest('.player-item');
                if (playerItem && !playerItem.classList.contains('dragging')) {
                    e.preventDefault();
                    e.stopPropagation();
                    const playerName = e.target.textContent.trim();
                    this.showPositionSelectionModal(playerName);
                }
            }
            
            // Handle direct player item clicks (for players without nested elements)
            if (e.target && e.target.classList && e.target.classList.contains('player-item') && 
                !e.target.classList.contains('dragging')) {
                const playerNameElement = e.target.querySelector('.player-name');
                if (playerNameElement) {
                    e.preventDefault();
                    e.stopPropagation();
                    const playerName = playerNameElement.textContent.trim();
                    this.showPositionSelectionModal(playerName);
                }
            }
            
            // Handle position clicks (show available players) - when no drag operation
            if (e.target && e.target.classList && e.target.classList.contains('position') && 
                !e.target.classList.contains('occupied')) {
                e.preventDefault();
                e.stopPropagation();
                const position = e.target.dataset.position;
                if (position) {
                    this.showPlayerSelectionModal(position);
                }
            }
            
            // Handle bench/jersey area clicks
            if (e.target && e.target.id === 'benchPlayers') {
                e.preventDefault();
                e.stopPropagation();
                this.showPlayerSelectionModal('bench');
            }
            
            if (e.target && e.target.id === 'jerseyPlayers') {
                e.preventDefault();
                e.stopPropagation();
                this.showPlayerSelectionModal('jersey');
            }
            
            // Handle bench/jersey section header clicks
            if (e.target && e.target.tagName === 'H3') {
                if (e.target.textContent === 'Bench') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPlayerSelectionModal('bench');
                }
                if (e.target.textContent === 'Jersey Prep') {
                    e.preventDefault();
                    e.stopPropagation();
                    this.showPlayerSelectionModal('jersey');
                }
            }
        });
        
        // Handle modal option clicks for both player and position selection
        document.addEventListener('click', (e) => {
            if (e.target && e.target.classList) {
                // Handle player option clicks (assign player to position)
                if (e.target.classList.contains('player-option')) {
                    e.preventDefault();
                    const playerName = e.target.dataset.player;
                    const position = e.target.dataset.position;
                    
                    if (position === 'bench') {
                        this.moveToBench(playerName);
                    } else if (position === 'jersey') {
                        this.moveToJersey(playerName);
                    } else {
                        this.assignPlayer(position, playerName);
                    }
                    
                    // Close modal
                    document.getElementById('playerModal').style.display = 'none';
                }
                
                // Handle position option clicks (assign position to player)
                if (e.target.classList.contains('position-option')) {
                    e.preventDefault();
                    const playerName = e.target.dataset.player;
                    const position = e.target.dataset.position;
                    const positionType = e.target.dataset.positionType;
                    
                    if (positionType === 'bench') {
                        this.moveToBench(playerName);
                    } else if (positionType === 'jersey') {
                        this.moveToJersey(playerName);
                    } else {
                        this.assignPlayer(position, playerName);
                    }
                    
                    // Close modal
                    document.getElementById('playerModal').style.display = 'none';
                }
            }
        });
    }
    
    // ===== TEAM MANAGEMENT =====
    showTeamSection() {
        // Hide team creation overlay and return to teams tab
        document.getElementById('teamCreationSection').style.display = 'none';
        this.switchTab('teamsTab');
    }
    
    showTeamCreation(team = null) {
        console.log('showTeamCreation called', team); // Debug log

        // Show the team creation overlay
        const teamCreationSection = document.getElementById('teamCreationSection');
        if (!teamCreationSection) {
            console.error('teamCreationSection element not found');
            return;
        }
        teamCreationSection.style.display = 'block';
        
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
            
            // Handle existing logo
            const preview = document.getElementById('logoPreview');
            const previewImg = document.getElementById('logoPreviewImg');
            const logoInput = document.getElementById('teamLogoInput');
            
            if (team.logo) {
                previewImg.src = team.logo;
                preview.style.display = 'block';
                window.currentLogoData = team.logo;
            } else {
                preview.style.display = 'none';
                window.currentLogoData = null;
            }
            logoInput.value = '';
        } else {
            title.textContent = 'Create New Team';
            nameInput.value = '';
            delete nameInput.dataset.teamId;
            
            // Reset form
            document.querySelectorAll('input[name="teamSize"]').forEach(input => input.checked = false);
            document.querySelectorAll('input[name="formation"]').forEach(input => input.checked = false);
            document.getElementById('formationSelector').innerHTML = '<p class="empty-state">Select team size first</p>';
            
            // Reset logo
            const preview = document.getElementById('logoPreview');
            const logoInput = document.getElementById('teamLogoInput');
            preview.style.display = 'none';
            logoInput.value = '';
            window.currentLogoData = null;
            
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
                <div class="formation-preview">${this.generateFormationPreview(formation.positions)}</div>
                <div class="formation-name">${formation.name}</div>
                <div class="formation-description">${formation.description}</div>
            </label>
        `).join('');
    }
    
    generateFormationPreview(positions) {
        // Group positions by their field sections
        const sections = {
            goalkeeper: [],
            defense: [],
            midfield: [],
            forward: []
        };
        
        positions.forEach(position => {
            const group = this.getPositionGroup(position);
            if (group === 'Goalkeeper') {
                sections.goalkeeper.push(position);
            } else if (group === 'Defense') {
                sections.defense.push(position);
            } else if (group === 'Midfield') {
                sections.midfield.push(position);
            } else if (group === 'Forward') {
                sections.forward.push(position);
            }
        });
        
        let html = '<div class="mini-field">';
        
        // Goalkeeper section
        if (sections.goalkeeper.length > 0) {
            html += '<div class="mini-section goalkeeper">';
            sections.goalkeeper.forEach(pos => {
                html += `<div class="mini-position ${this.getPositionColorClass(pos)}"></div>`;
            });
            html += '</div>';
        }
        
        // Defense section
        if (sections.defense.length > 0) {
            html += '<div class="mini-section defense">';
            sections.defense.forEach(pos => {
                html += `<div class="mini-position ${this.getPositionColorClass(pos)}"></div>`;
            });
            html += '</div>';
        }
        
        // Midfield section
        if (sections.midfield.length > 0) {
            html += '<div class="mini-section midfield">';
            sections.midfield.forEach(pos => {
                html += `<div class="mini-position ${this.getPositionColorClass(pos)}"></div>`;
            });
            html += '</div>';
        }
        
        // Forward section
        if (sections.forward.length > 0) {
            html += '<div class="mini-section forward">';
            sections.forward.forEach(pos => {
                html += `<div class="mini-position ${this.getPositionColorClass(pos)}"></div>`;
            });
            html += '</div>';
        }
        
        html += '</div>';
        return html;
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
                <label data-position="Forward">
                    <input type="checkbox" value="Forward" ${selectedPositions.includes('Forward') ? 'checked' : ''}> 
                    Fwd
                </label>
                <label data-position="Midfield">
                    <input type="checkbox" value="Midfield" ${selectedPositions.includes('Midfield') ? 'checked' : ''}> 
                    Mid
                </label>
                <label data-position="Defense">
                    <input type="checkbox" value="Defense" ${selectedPositions.includes('Defense') ? 'checked' : ''}> 
                    Def
                </label>
                <label data-position="Goalkeeper">
                    <input type="checkbox" value="Goalkeeper" ${selectedPositions.includes('Goalkeeper') ? 'checked' : ''}> 
                    GK
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
                // Update logo if provided
                if (window.currentLogoData !== undefined) {
                    team.logo = window.currentLogoData;
                }
            }
        } else {
            // Create new team
            const team = {
                id: 'team_' + Date.now(),
                name: name,
                players: players,
                teamSize: teamSize,
                formation: formation,
                logo: window.currentLogoData || null,
                created: new Date().toISOString()
            };
            this.teams.push(team);
        }
        
        this.saveData();
        this.renderTeams();
        this.showTeamSection();
        this.showSuccessMessage(`Team "${name}" saved successfully!`);
        
        // Clear logo data
        window.currentLogoData = null;
    }

    async loadCurrentGameForTeam(teamId) {
        try {
            if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                // Load from Firebase - get active game for specific team
                this.currentGame = await window.firebaseService.getCurrentGameForTeam(teamId);
            } else {
                // Load from localStorage
                const games = JSON.parse(localStorage.getItem('soccer_games') || '[]');
                const activeGame = games.find(game =>
                    game.teamId === teamId && !game.completed
                );

                this.currentGame = activeGame || null;
            }
        } catch (error) {
            console.error('Error loading current game for team:', error);
            this.currentGame = null;
        }
    }

    async selectTeam(teamId) {
        this.currentTeam = this.teams.find(t => t.id === teamId);

        // Find the active game for this specific team
        await this.loadCurrentGameForTeam(teamId);

        // Re-render teams to update game buttons and selection state
        this.renderTeams();

        // Update header status
        this.updateHeaderForTab('teamsTab');

        // Update navigation state based on whether this team has a game
        this.initializeNavigation();
    }
    
    async deleteTeam(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (team && confirm(`Are you sure you want to delete "${team.name}"?`)) {
            try {
                // Delete from Firebase if authenticated
                if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                    await window.firebaseService.deleteTeam(teamId);
                }

                // Update local data
                this.teams = this.teams.filter(t => t.id !== teamId);
                if (this.currentTeam && this.currentTeam.id === teamId) {
                    this.currentTeam = null;
                    this.currentGame = null;
                }

                await this.saveData();
                this.renderTeams();
                this.updateHeaderForTab('teamsTab');

                this.showSuccessMessage(`Team "${team.name}" deleted successfully`);
            } catch (error) {
                console.error('Error deleting team:', error);
                this.showErrorMessage('Failed to delete team. Please try again.');
            }
        }
    }
    
    renderTeams() {
        const container = document.getElementById('teamsList');
        
        if (!container) {
            console.error('❌ teamsList container not found!');
            return;
        }
        
        // Create Team Card (always show)
        const createTeamCard = `
            <div class="create-team-card" id="createTeamCard">
                <div class="create-team-content">
                    <div class="create-team-icon">🚀</div>
                    <h3>Create New Team</h3>
                    <p>Build your perfect lineup with players and formations</p>
                    <button class="create-team-btn" id="createTeamBtn">
                        <span class="btn-text">Get Started</span>
                        <span class="btn-arrow">→</span>
                    </button>
                </div>
            </div>
        `;

        if (this.teams.length === 0) {
            container.innerHTML = createTeamCard;
            // Still need to attach event listeners even when no teams exist
            this.attachTeamEventListeners();
            return;
        }

        // Render teams with Create Team card at the end
        const teamsHTML = this.teams.map(team => {
            const teamInfo = this.getTeamInfo(team);
            const logoHtml = team.logo ? `<img src="${team.logo}" alt="${team.name} logo" class="team-logo">` : '';
            const isSelected = this.currentTeam && this.currentTeam.id === team.id;
            const hasCurrentGame = this.currentGame && this.currentGame.teamId === team.id;
            
            
            return `
                <div class="team-card ${isSelected ? 'selected' : ''}" 
                     data-team-id="${team.id}">
                    <div class="team-header">
                        ${logoHtml}
                        <div class="team-title">
                            <h3>${team.name}</h3>
                            <p class="team-info">${teamInfo}</p>
                        </div>
                    </div>
                    <div class="team-actions">
                        ${isSelected ?
                            (hasCurrentGame ?
                                '<button class="btn success continue-game-btn" data-team-id="' + team.id + '">🎮 Continue Game</button>' :
                                '<button class="btn primary start-game-btn" data-team-id="' + team.id + '">🎮 Start New Game</button>'
                            ) :
                            ''
                        }
                        <button class="btn secondary edit-team-btn" data-team-id="${team.id}">✏️ Edit</button>
                        <button class="btn secondary delete-team-btn" data-team-id="${team.id}" style="color: #dc2626;">🗑️ Delete</button>
                    </div>
                </div>
            `;
        }).join('');

        // Add Create Team card at the end
        container.innerHTML = teamsHTML + createTeamCard;

        // Add event listeners for team interactions
        this.attachTeamEventListeners();
    }
    
    attachTeamEventListeners() {
        // Team card selection
        document.querySelectorAll('.team-card').forEach(card => {
            card.addEventListener('click', async (e) => {
                // Don't trigger if clicking on action buttons
                if (e.target.closest('.team-actions')) return;

                const teamId = card.dataset.teamId;
                await this.selectTeam(teamId);
            });
        });
        
        // Edit buttons
        document.querySelectorAll('.edit-team-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const teamId = btn.dataset.teamId;
                this.editTeam(teamId);
            });
        });
        
        // Delete buttons
        document.querySelectorAll('.delete-team-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                e.stopPropagation();
                const teamId = btn.dataset.teamId;
                await this.deleteTeam(teamId);
            });
        });
        
        // Start game buttons
        document.querySelectorAll('.start-game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const teamId = btn.dataset.teamId;
                this.showGameModal();
            });
        });

        // Continue game buttons
        document.querySelectorAll('.continue-game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                e.stopPropagation();
                const teamId = btn.dataset.teamId;
                this.continueGame(teamId);
            });
        });

        // Create team button is now handled globally in setupEventListeners()
    }
    
    continueGame(teamId) {
        // The current game should already be loaded and this.currentTeam should be set
        if (this.currentGame && this.currentGame.teamId === teamId) {
            // Switch to field tab to continue the game
            this.switchTab('fieldTab');
        } else {
            console.error('No active game found for team:', teamId);
            this.showErrorMessage('No active game found for this team');
        }
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
    
    getTeamInfo(team) {
        // Use actual team size if available, otherwise estimate
        const teamSize = team.teamSize ? `${team.teamSize}v${team.teamSize}` : this.getEstimatedTeamSize(team);
        return `${team.players.length} players | ${teamSize} team`;
    }
    
    getEstimatedTeamSize(team) {
        // Estimate team size based on player count
        if (team.players.length >= 11) return '11v11';
        if (team.players.length >= 9) return '9v9';
        if (team.players.length >= 7) return '7v7';
        if (team.players.length >= 5) return '5v5';
        return '3v3';
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
    
    async handleGameSubmit(e) {
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
            lineup[i] = { positions: {}, bench: [], jersey: [] };
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
            completed: null, // null indicates active game
            lineup: lineup
        };
        
        await this.saveData();
        this.closeModals();
        this.showGameSection();
        this.renderTeams(); // Re-render teams to show "Continue Game" button
        this.showSuccessMessage(`Game vs ${opponent} started! ${periodCount} periods of ${periodDuration} min each`);
    }
    
    showGameSection() {
        // Switch to field tab when game starts
        this.switchTab('fieldTab');
        this.updateGameInfo();
        this.updateTeamHeader();
        this.renderPeriodSelector();
        this.renderField();
        this.updatePeriodSelector();
    }
    
    updateGameInfo() {
        if (this.currentGame && this.currentTeam) {
            // Update field view game header
            document.getElementById('currentTeamName').textContent = this.currentTeam.name;
            const gameDate = new Date(this.currentGame.date).toLocaleDateString();
            document.getElementById('currentGameInfo').textContent = 
                `vs ${this.currentGame.opponent} • ${gameDate}`;
            
            // Update team logo in field view
            const currentTeamLogo = document.getElementById('currentTeamLogo');
            if (currentTeamLogo) {
                if (this.currentTeam.logo) {
                    currentTeamLogo.src = this.currentTeam.logo;
                    currentTeamLogo.style.display = 'block';
                } else {
                    currentTeamLogo.style.display = 'none';
                }
            }
        }
    }
    
    updateTeamHeader() {
        // Update table view team header only (field view handled by updateGameInfo)
        const tableTeamHeaderLogo = document.getElementById('tableTeamHeaderLogo');
        const tableTeamHeaderName = document.getElementById('tableTeamHeaderName');
        const tableTeamHeaderGameInfo = document.getElementById('tableTeamHeaderGameInfo');
        
        if (this.currentTeam && this.currentGame && tableTeamHeaderName) {
            const gameDate = new Date(this.currentGame.date).toLocaleDateString();
            const gameInfoText = `vs ${this.currentGame.opponent} • ${gameDate}`;
            
            // Update table view header
            tableTeamHeaderName.textContent = this.currentTeam.name;
            tableTeamHeaderGameInfo.textContent = gameInfoText;
            
            if (this.currentTeam.logo && tableTeamHeaderLogo) {
                tableTeamHeaderLogo.src = this.currentTeam.logo;
                tableTeamHeaderLogo.style.display = 'block';
            } else if (tableTeamHeaderLogo) {
                tableTeamHeaderLogo.style.display = 'none';
            }
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
        
        // Ensure current period is valid
        if (this.currentPeriod > periodCount) {
            this.currentPeriod = 1;
        }
        
        if (this.isMobile) {
            // Mobile carousel-style period selector
            const canGoLeft = this.currentPeriod > 1;
            const canGoRight = this.currentPeriod < periodCount;
            
            // Calculate time range for current period
            const startTime = (this.currentPeriod - 1) * periodDuration;
            const endTime = this.currentPeriod * periodDuration;
            const formatTime = (minutes) => {
                const mins = Math.floor(minutes);
                const secs = Math.round((minutes % 1) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            const timeRange = `${formatTime(startTime)}-${formatTime(endTime)}`;
            
            container.innerHTML = `
                <button class="period-nav-btn ${!canGoLeft ? 'disabled' : ''}" 
                        id="periodPrev" 
                        ${!canGoLeft ? 'disabled' : ''}>
                    ←
                </button>
                <div class="current-period-display">
                    Period ${this.currentPeriod}
                </div>
                <button class="period-nav-btn ${!canGoRight ? 'disabled' : ''}" 
                        id="periodNext" 
                        ${!canGoRight ? 'disabled' : ''}>
                    →
                </button>
            `;
            
            // Add navigation event listeners
            const prevBtn = document.getElementById('periodPrev');
            const nextBtn = document.getElementById('periodNext');
            
            if (prevBtn && !prevBtn.disabled) {
                prevBtn.addEventListener('click', () => {
                    if (this.currentPeriod > 1) {
                        this.currentPeriod--;
                        this.renderPeriodSelector();
                        this.renderField();
                    }
                });
            }
            
            if (nextBtn && !nextBtn.disabled) {
                nextBtn.addEventListener('click', () => {
                    if (this.currentPeriod < periodCount) {
                        this.currentPeriod++;
                        this.renderPeriodSelector();
                        this.renderField();
                    }
                });
            }
            
        } else {
            // Desktop grid-style period selector (unchanged)
            const periodsPerHalf = periodCount / 2;
            let buttonsHTML = '';
            
            for (let i = 1; i <= periodCount; i++) {
                const isActive = i === this.currentPeriod;
                const halfNumber = i <= periodsPerHalf ? 1 : 2;
                
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
                            title="Period ${i} (Half ${halfNumber}, ${formatTime(startTime)} - ${formatTime(endTime)})">
                        ${i}
                    </button>
                `;
            }
            
            container.innerHTML = `
                <div class="periods-label">Periods</div>
                <div class="periods-buttons">
                    ${buttonsHTML}
                </div>
            `;
            
            // Re-attach event listeners for desktop period buttons
            container.querySelectorAll('.period-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    this.currentPeriod = parseInt(e.currentTarget.dataset.period);
                    this.updatePeriodSelector();
                    this.renderField();
                });
            });
        }
    }
    
    async completeGame() {
        if (!this.currentGame) return;

        const opponent = this.currentGame.opponent;
        if (confirm(`Complete the game vs ${opponent}?\\n\\nThis will save the game and allow you to start a new one.`)) {
            try {
                // Mark game as completed
                const completedGame = {
                    ...this.currentGame,
                    completed: new Date().toISOString()
                };

                // Save to Firebase if authenticated, otherwise save to localStorage
                if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                    await window.firebaseService.saveGame(completedGame);
                } else {
                    // Fallback to localStorage
                    const completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
                    completedGames.push(completedGame);
                    localStorage.setItem('soccer_completed_games', JSON.stringify(completedGames));
                }

                // Clear current game
                this.currentGame = null;
                await this.saveData();

                // Return to team section
                this.showTeamSection();
                this.showSuccessMessage(`Game vs ${opponent} completed and saved!`);
            } catch (error) {
                console.error('Error completing game:', error);
                this.showErrorMessage('Failed to complete game. Please try again.');
            }
        }
    }
    
    clearCurrentPeriod() {
        if (!this.currentGame || !this.currentPeriod) return;
        
        if (confirm(`Clear all player assignments for Period ${this.currentPeriod}?\n\nThis will move all players back to Available.`)) {
            // Clear the current period's assignments
            const periodLineup = this.currentGame.lineup[this.currentPeriod];
            if (periodLineup) {
                periodLineup.positions = {};
                periodLineup.bench = [];
                periodLineup.jersey = [];
            }
            
            // Save changes and refresh the field view
            this.saveData();
            this.renderField();
            this.renderPlayers();
            this.showSuccessMessage(`Period ${this.currentPeriod} cleared!`);
        }
    }
    
    // ===== LINEUP MANAGEMENT =====
    renderField() {
        if (!this.currentGame || !this.currentTeam) return;
        
        // First, render the period selector
        this.renderPeriodSelector();
        
        // Then, render the field layout based on team formation
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
        
        // Render bench and jersey players
        this.renderJerseyPlayers();
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
            fieldContainer.innerHTML = this.getDefaultFieldHTML() + this.getBenchPositionsHTML();
            return;
        }
        
        const formation = this.formations[this.currentTeam.teamSize][this.currentTeam.formation];
        if (!formation) {
            fieldContainer.innerHTML = this.getDefaultFieldHTML() + this.getBenchPositionsHTML();
            return;
        }
        
        // Create field sections based on formation
        fieldContainer.innerHTML = this.createFormationHTML(formation) + this.getBenchPositionsHTML();
    }
    
    getBenchPositionsHTML() {
        return `
            <div class="field-bench-area">
                <div class="bench-position" data-bench="1"></div>
                <div class="bench-position" data-bench="2"></div>
                <div class="bench-position" data-bench="3"></div>
                <div class="bench-position" data-bench="4"></div>
                <div class="bench-position" data-bench="5"></div>
            </div>
        `;
    }
    
    getDefaultFieldHTML() {
        return `
            ${this.getFieldMarkings()}
            <div class="field-section goalkeeper">
                <div class="position ${this.getPositionColorClass('GK')}" data-position="GK">GK</div>
            </div>
            <div class="field-section defense">
                <div class="position ${this.getPositionColorClass('LB')}" data-position="LB">LB</div>
                <div class="position ${this.getPositionColorClass('CB1')}" data-position="CB1">CB</div>
                <div class="position ${this.getPositionColorClass('CB2')}" data-position="CB2">CB</div>
                <div class="position ${this.getPositionColorClass('RB')}" data-position="RB">RB</div>
            </div>
            <div class="field-section midfield">
                <div class="position ${this.getPositionColorClass('LM')}" data-position="LM">LM</div>
                <div class="position ${this.getPositionColorClass('CM1')}" data-position="CM1">CM</div>
                <div class="position ${this.getPositionColorClass('CM2')}" data-position="CM2">CM</div>
                <div class="position ${this.getPositionColorClass('RM')}" data-position="RM">RM</div>
            </div>
            <div class="field-section forward">
                <div class="position ${this.getPositionColorClass('LF')}" data-position="LF">LF</div>
                <div class="position ${this.getPositionColorClass('CF')}" data-position="CF">CF</div>
                <div class="position ${this.getPositionColorClass('RF')}" data-position="RF">RF</div>
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
                html += `<div class="position ${this.getPositionColorClass(pos)}" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        // Defense section
        if (sections.defense.length > 0) {
            html += '<div class="field-section defense">';
            sections.defense.forEach(pos => {
                html += `<div class="position ${this.getPositionColorClass(pos)}" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        // Midfield section
        if (sections.midfield.length > 0) {
            html += '<div class="field-section midfield">';
            sections.midfield.forEach(pos => {
                html += `<div class="position ${this.getPositionColorClass(pos)}" data-position="${pos}">${pos}</div>`;
            });
            html += '</div>';
        }
        
        // Forward section (now on right)
        if (sections.forward.length > 0) {
            html += '<div class="field-section forward">';
            sections.forward.forEach(pos => {
                html += `<div class="position ${this.getPositionColorClass(pos)}" data-position="${pos}">${pos}</div>`;
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
        
        if (!container) {
            console.error('❌ availablePlayers container not found!');
            return;
        }
        
        if (!this.currentGame || !this.currentGame.lineup) {
            console.error('❌ No current game or lineup data!');
            return;
        }
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const assignedPlayers = new Set(Object.values(currentLineup.positions));
        const benchPlayers = new Set(currentLineup.bench);
        const jerseyPlayers = new Set(currentLineup.jersey || []);
        
        const availablePlayers = this.currentTeam.players.filter(player => 
            !assignedPlayers.has(player.name) && 
            !benchPlayers.has(player.name) && 
            !jerseyPlayers.has(player.name)
        );
        
        container.innerHTML = availablePlayers.map(player => {
            const sittingCount = this.calculatePlayerSittingCount(player.name);
            return `<div class="player-item" draggable="true" data-positions="${player.positions.join(',')}">
                <span class="player-name">${player.name}</span>
                <span class="sitting-count">${sittingCount} sits</span>
            </div>`
        }).join('');
    }
    
    calculatePlayerSittingCount(playerName) {
        let sittingCount = 0;
        
        // Count bench and jersey periods across all periods
        for (let period = 1; period <= this.currentGame.periodCount; period++) {
            const lineup = this.currentGame.lineup[period];
            if (lineup.bench.includes(playerName) || (lineup.jersey && lineup.jersey.includes(playerName))) {
                sittingCount++;
            }
        }
        
        return sittingCount;
    }
    
    renderJerseyPlayers() {
        const container = document.getElementById('jerseyPlayers');
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Ensure jersey array exists
        if (!currentLineup.jersey) {
            currentLineup.jersey = [];
        }
        
        const jerseyPlayerObjects = currentLineup.jersey.map(playerName => 
            this.currentTeam.players.find(p => p.name === playerName)
        ).filter(p => p);
        
        if (jerseyPlayerObjects.length === 0) {
            container.innerHTML = '';
        } else {
            const player = jerseyPlayerObjects[0]; // Only show first player since jersey is for 1 player
            const sittingCount = this.calculatePlayerSittingCount(player.name);
            container.innerHTML = `<div class="player-item jersey-player" draggable="true" data-positions="${player.positions.join(',')}">
                <span class="player-name">${player.name}</span>
                <span class="sitting-count">${sittingCount} sits</span>
            </div>`;
        }
    }

    renderBenchPlayers() {
        const container = document.getElementById('benchPlayers');
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        const benchPlayerObjects = currentLineup.bench.map(playerName => 
            this.currentTeam.players.find(p => p.name === playerName)
        ).filter(p => p);
        
        container.innerHTML = benchPlayerObjects.map(player => {
            const sittingCount = this.calculatePlayerSittingCount(player.name);
            return `<div class="player-item bench-player" draggable="true" data-positions="${player.positions.join(',')}">
                <span class="player-name">${player.name}</span>
                <span class="sitting-count">${sittingCount} sits</span>
            </div>`;
        }).join('');
    }
    
    assignPlayer(position, playerName) {
        if (!this.currentGame) return;
        
        const player = this.currentTeam.players.find(p => p.name === playerName);
        if (!player) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Handle bench and jersey assignments
        if (position === 'bench') {
            this.moveToBench(playerName);
            return;
        }
        
        if (position === 'jersey') {
            this.moveToJersey(playerName);
            return;
        }
        
        // Handle regular field position assignments
        const validation = this.validatePlayerPosition(player, position);
        
        // Show warning for non-preferred positions but allow assignment
        if (validation.status === 'not-preferred') {
            const confirm = window.confirm(
                `⚠️ ${playerName} doesn't prefer ${this.getPositionGroup(position)} positions.\n\nAssign anyway?`
            );
            if (!confirm) return;
        }
        
        // Remove player from current position/bench/jersey
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        if (currentLineup.jersey) {
            currentLineup.jersey = currentLineup.jersey.filter(p => p !== playerName);
        }
        
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
    
    createPositionCard(position, isBench = false, substitutionPlayer = null) {
        if (isBench) {
            return '<span class="position-card bench">Bench</span>';
        }
        
        const positionGroup = this.getPositionGroup(position);
        if (!positionGroup) return position;
        
        const groupClass = positionGroup.toLowerCase();
        
        if (substitutionPlayer) {
            // Display position indicator above player name for substitutions
            return `<div class="position-substitution">
                        <span class="position-card ${groupClass}">${position}</span>
                        <div class="substitution-player">${substitutionPlayer}</div>
                    </div>`;
        }
        
        return `<span class="position-card ${groupClass}">${position}</span>`;
    }
    
    getPositionColorClass(position) {
        const positionGroup = this.getPositionGroup(position);
        if (!positionGroup) return '';
        
        return `position-${positionGroup.toLowerCase()}`;
    }
    
    createStatPositionCard(position, count) {
        // Handle special case for Jersey
        if (position === 'Jersey') {
            return `<span class="stat-position-card jersey">${position}: ${count}</span>`;
        }
        
        const positionGroup = this.getPositionGroup(position);
        if (!positionGroup) return `${position}: ${count}`;
        
        const groupClass = positionGroup.toLowerCase();
        return `<span class="stat-position-card ${groupClass}">${position}: ${count}</span>`;
    }
    
    moveToJersey(playerName) {
        if (!this.currentGame) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Ensure jersey array exists
        if (!currentLineup.jersey) {
            currentLineup.jersey = [];
        }
        
        // Remove player from current position/bench/jersey
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        currentLineup.jersey = currentLineup.jersey.filter(p => p !== playerName);
        
        // Add to jersey
        currentLineup.jersey.push(playerName);
        
        this.saveData();
        this.renderField();
        this.showSuccessMessage(`${playerName} preparing for goalkeeper shift`);
    }

    moveToBench(playerName) {
        if (!this.currentGame) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Remove player from current position/bench/jersey  
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        currentLineup.jersey = currentLineup.jersey.filter(p => p !== playerName);
        
        // Add to bench
        currentLineup.bench.push(playerName);
        
        this.saveData();
        this.renderField();
    }
    
    moveToAvailable(playerName) {
        if (!this.currentGame) return;
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        
        // Remove player from current position/bench/jersey
        Object.keys(currentLineup.positions).forEach(pos => {
            if (currentLineup.positions[pos] === playerName) {
                delete currentLineup.positions[pos];
            }
        });
        currentLineup.bench = currentLineup.bench.filter(p => p !== playerName);
        if (currentLineup.jersey) {
            currentLineup.jersey = currentLineup.jersey.filter(p => p !== playerName);
        }
        
        this.saveData();
        this.renderField();
    }
    
    // ===== PLAYER SELECTION MODAL =====
    showPlayerSelectionModal(position) {
        if (!this.currentGame || !this.currentTeam) return;
        
        const modal = document.getElementById('playerModal');
        const title = document.getElementById('playerModalTitle');
        const playersList = document.getElementById('playersList');
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const assignedPlayers = new Set(Object.values(currentLineup.positions));
        const benchPlayers = new Set(currentLineup.bench);
        const jerseyPlayers = new Set(currentLineup.jersey || []);
        
        // Handle bench and jersey prep selections differently
        if (position === 'bench' || position === 'jersey') {
            const sectionName = position === 'bench' ? 'Bench' : 'Jersey Prep';
            title.textContent = `Add Player to ${sectionName}`;
            
            // Show available players not assigned anywhere
            let availablePlayers = this.currentTeam.players.filter(player => {
                const isAvailable = !assignedPlayers.has(player.name) && 
                                   !benchPlayers.has(player.name) && 
                                   !jerseyPlayers.has(player.name);
                
                // For jersey prep, only show players who can play goalkeeper
                if (position === 'jersey') {
                    const canPlayGoalkeeper = player.positions.includes('Goalkeeper') || 
                                            player.positions.includes('All');
                    return isAvailable && canPlayGoalkeeper;
                }
                
                // For bench, show all available players
                return isAvailable;
            });
            
            playersList.innerHTML = availablePlayers.map(player => {
                return `
                    <div class="player-option" 
                         data-position="${position}" 
                         data-player="${player.name}">
                        ${player.name}
                    </div>
                `;
            }).join('');
            
            if (availablePlayers.length === 0) {
                const emptyMessage = position === 'jersey' 
                    ? 'No available goalkeepers' 
                    : 'No available players';
                playersList.innerHTML = `<p class="empty-state">${emptyMessage}</p>`;
            }
            
            modal.style.display = 'flex';
            return;
        }
        
        const positionGroup = this.getPositionGroup(position);
        title.textContent = `Select Player for ${position} (${positionGroup})`;
        
        // Get players who were on bench in the previous period (for prioritization)
        const previousPeriodBench = new Set();
        if (this.currentPeriod > 1) {
            const previousLineup = this.currentGame.lineup[this.currentPeriod - 1];
            if (previousLineup && previousLineup.bench) {
                previousLineup.bench.forEach(playerName => previousPeriodBench.add(playerName));
            }
        }
        
        // Show available players who prefer this position (excluding those already assigned anywhere)
        let availablePlayers = this.currentTeam.players.filter(player => {
            const isAvailable = !assignedPlayers.has(player.name) && 
                               !benchPlayers.has(player.name) && 
                               !jerseyPlayers.has(player.name);
            const prefersPosition = player.positions.includes(positionGroup);
            return isAvailable && prefersPosition;
        });
        
        // Add current player in position if any (even if they don't prefer it)
        const currentPlayerName = currentLineup.positions[position];
        if (currentPlayerName) {
            const currentPlayerObj = this.currentTeam.players.find(p => p.name === currentPlayerName);
            if (currentPlayerObj && !availablePlayers.find(p => p.name === currentPlayerName)) {
                availablePlayers.unshift(currentPlayerObj);
            }
        }
        
        // Sort by priority: previous period bench players first, then others
        availablePlayers.sort((a, b) => {
            const aWasBenched = previousPeriodBench.has(a.name);
            const bWasBenched = previousPeriodBench.has(b.name);
            const aIsCurrent = currentPlayerName === a.name;
            const bIsCurrent = currentPlayerName === b.name;
            
            // Current player always first
            if (aIsCurrent && !bIsCurrent) return -1;
            if (!aIsCurrent && bIsCurrent) return 1;
            
            // Then prioritize players who were benched in previous period
            if (aWasBenched && !bWasBenched) return -1;
            if (!aWasBenched && bWasBenched) return 1;
            
            // Then alphabetical
            return a.name.localeCompare(b.name);
        });
        
        playersList.innerHTML = availablePlayers.map(player => {
            const isCurrent = currentPlayerName === player.name;
            const wasBenched = previousPeriodBench.has(player.name);
            const priorityIcon = wasBenched ? '❗' : '';
            const priorityText = wasBenched ? 'from bench' : '';
            
            return `
                <div class="player-option preferred" 
                     data-position="${position}" 
                     data-player="${player.name}">
                    ${priorityIcon} ${player.name} 
                    ${priorityText ? `<small>(${priorityText})</small>` : ''}
                    ${isCurrent ? '<strong>(current)</strong>' : ''}
                </div>
            `;
        }).join('');
        
        if (availablePlayers.length === 0) {
            playersList.innerHTML = '<p class="empty-state">No available players prefer this position</p>';
        }
        
        modal.style.display = 'flex';
    }
    
    showPositionSelectionModal(playerName) {
        if (!this.currentGame || !this.currentTeam) return;
        
        const modal = document.getElementById('playerModal');
        const title = document.getElementById('playerModalTitle');
        const playersList = document.getElementById('playersList');
        
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const player = this.currentTeam.players.find(p => p.name === playerName);
        
        if (!player) return;
        
        
        title.textContent = `Select Position for ${playerName}`;
        
        // Get all available positions (not currently occupied)
        const occupiedPositions = new Set(Object.keys(currentLineup.positions));
        
        // Get the current position of this player (if any)
        let currentPlayerPosition = null;
        for (const [pos, name] of Object.entries(currentLineup.positions)) {
            if (name === playerName) {
                currentPlayerPosition = pos;
                break;
            }
        }
        
        
        // Generate available position options
        const availablePositions = [];
        
        // Add field positions based on formation
        const teamSize = this.currentTeam.teamSize;
        const formation = this.currentTeam.formation;
        
        if (teamSize && formation && this.formations[teamSize] && this.formations[teamSize][formation]) {
            const formationData = this.formations[teamSize][formation];
            const formationPositions = formationData.positions;
            
            formationPositions.forEach(pos => {
                const occupiedByOtherPlayer = currentLineup.positions[pos] && currentLineup.positions[pos] !== playerName;
                const positionGroup = this.getPositionGroup(pos);
                const canPlay = player.positions.includes(positionGroup) || player.positions.includes('All');
                const isCurrent = currentPlayerPosition === pos;
                
                
                // Include position if it's not occupied by another player
                if (!occupiedByOtherPlayer) {
                    availablePositions.push({
                        position: pos,
                        type: 'field',
                        canPlay: canPlay,
                        isCurrent: isCurrent
                    });
                }
            });
        } else {
        }
        
        // Add bench option
        const isOnBench = currentLineup.bench.includes(playerName);
        availablePositions.push({
            position: 'bench',
            type: 'bench', 
            canPlay: true,
            isCurrent: isOnBench
        });
        
        // Add jersey prep option (only for goalkeepers)
        const canPlayGoalkeeper = player.positions.includes('Goalkeeper') || player.positions.includes('All');
        const isInJersey = currentLineup.jersey && currentLineup.jersey.includes(playerName);
        if (canPlayGoalkeeper) {
            availablePositions.push({
                position: 'jersey',
                type: 'jersey',
                canPlay: true,
                isCurrent: isInJersey
            });
        }
        
        // Sort positions: current first, then preferred, then others
        availablePositions.sort((a, b) => {
            if (a.isCurrent && !b.isCurrent) return -1;
            if (!a.isCurrent && b.isCurrent) return 1;
            if (a.canPlay && !b.canPlay) return -1;
            if (!a.canPlay && b.canPlay) return 1;
            return 0;
        });
        
        playersList.innerHTML = availablePositions.map(pos => {
            const currentClass = pos.isCurrent ? 'current-assignment' : '';
            const preferredClass = pos.canPlay ? 'preferred-position' : 'non-preferred-position';
            const positionDisplay = pos.position === 'bench' ? 'Bench' : 
                                   pos.position === 'jersey' ? 'Jersey Prep' : pos.position;
            const icon = pos.isCurrent ? '✓ ' : pos.canPlay ? '' : '⚠️ ';
            
            return `
                <div class="position-option ${currentClass} ${preferredClass}" 
                     data-player="${playerName}" 
                     data-position="${pos.position}"
                     data-position-type="${pos.type}">
                    ${icon}${positionDisplay}
                </div>
            `;
        }).join('');
        
        
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
                const periodLineup = this.currentGame.lineup[period];
                
                if (periodLineup) {
                    // Check if player is in a field position
                    for (const [position, player] of Object.entries(periodLineup.positions)) {
                        if (player === playerName) {
                            let substitutionPlayer = null;
                            
                            // Check for substitution (if not first period)
                            if (period > 1) {
                                const previousLineup = this.currentGame.lineup[period - 1];
                                if (previousLineup && previousLineup.positions[position]) {
                                    const previousPlayer = previousLineup.positions[position];
                                    // If this player wasn't in this position last period
                                    if (previousPlayer !== playerName) {
                                        substitutionPlayer = previousPlayer;
                                    }
                                }
                            }
                            
                            assignment = this.createPositionCard(position, false, substitutionPlayer);
                            break;
                        }
                    }
                    
                    // If not in a field position, check if on bench or jersey
                    if (assignment === '-' && periodLineup.jersey && periodLineup.jersey.includes(playerName)) {
                        assignment = '<span class="position-card jersey">Jersey</span>';
                    } else if (assignment === '-' && periodLineup.bench.includes(playerName)) {
                        assignment = '<span class="position-card bench">Bench</span>';
                    }
                }
                
                row += `<td>${assignment}</td>`;
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

        // Also render mobile accordion version
        this.renderMobileAccordion();
    }

    // ===== MOBILE ACCORDION TABLE =====
    renderMobileAccordion() {
        if (!this.currentGame || !this.currentTeam) return;

        const accordion = document.getElementById('mobileLineupAccordion');
        const statsContent = document.getElementById('mobileStatsContent');

        if (!accordion || !statsContent) return;

        const periodCount = this.currentGame.periodCount || 4;
        const periodDuration = this.currentGame.periodDuration || 15;

        // Clear existing content
        accordion.innerHTML = '';

        // Create period sections
        for (let period = 1; period <= periodCount; period++) {
            const periodLineup = this.currentGame.lineup[period];
            const startTime = (period - 1) * periodDuration;
            const endTime = period * periodDuration;

            const periodSection = document.createElement('div');
            periodSection.className = 'accordion-section';

            const header = document.createElement('div');
            header.className = 'accordion-header';
            header.dataset.section = `period-${period}`;

            const timeRange = `${this.formatTimeMinutes(startTime)}-${this.formatTimeMinutes(endTime)}`;
            header.innerHTML = `
                <h3>⚽ Period ${period} <small>(${timeRange})</small></h3>
                <span class="accordion-toggle">▼</span>
            `;

            const content = document.createElement('div');
            content.className = 'accordion-content';
            content.innerHTML = this.createPeriodContent(period, periodLineup);

            periodSection.appendChild(header);
            periodSection.appendChild(content);
            accordion.appendChild(periodSection);

            // Add click handler for accordion toggle
            header.addEventListener('click', () => {
                this.toggleAccordionSection(header, content);
            });
        }

        // Render statistics content
        this.renderMobileStats(statsContent);

        // Add click handler for stats section
        const statsHeader = document.querySelector('[data-section="stats"]');
        const statsContentElement = document.getElementById('mobileStatsContent');
        if (statsHeader && statsContentElement) {
            statsHeader.addEventListener('click', () => {
                this.toggleAccordionSection(statsHeader, statsContentElement);
            });
        }
    }

    createPeriodContent(period, periodLineup) {
        if (!periodLineup) {
            return '<div class="period-lineup"><p class="empty-state">No lineup set for this period</p></div>';
        }

        const assignments = [];
        const benchPlayers = [];
        const jerseyPlayers = [];

        // Process field positions
        Object.entries(periodLineup.positions || {}).forEach(([position, playerName]) => {
            const positionGroup = this.getPositionGroup(position);
            assignments.push({
                player: playerName,
                position: position,
                positionGroup: positionGroup?.toLowerCase() || 'other'
            });
        });

        // Process bench players
        if (periodLineup.bench) {
            periodLineup.bench.forEach(playerName => {
                benchPlayers.push(playerName);
            });
        }

        // Process jersey players
        if (periodLineup.jersey) {
            periodLineup.jersey.forEach(playerName => {
                jerseyPlayers.push(playerName);
            });
        }

        // Sort assignments by position group for better organization
        assignments.sort((a, b) => {
            const order = { 'forward': 1, 'midfield': 2, 'defense': 3, 'goalkeeper': 4 };
            return (order[a.positionGroup] || 5) - (order[b.positionGroup] || 5);
        });

        let html = '<div class="period-lineup">';

        // Field assignments
        if (assignments.length > 0) {
            assignments.forEach(assignment => {
                html += `
                    <div class="player-assignment ${assignment.positionGroup}">
                        <span class="player-name-mobile">${assignment.player}</span>
                        <span class="position-badge-mobile ${assignment.positionGroup}">${assignment.position}</span>
                    </div>
                `;
            });
        }

        // Bench players
        if (benchPlayers.length > 0) {
            benchPlayers.forEach(playerName => {
                html += `
                    <div class="player-assignment bench">
                        <span class="player-name-mobile">${playerName}</span>
                        <span class="position-badge-mobile bench">Bench</span>
                    </div>
                `;
            });
        }

        // Jersey players
        if (jerseyPlayers.length > 0) {
            jerseyPlayers.forEach(playerName => {
                html += `
                    <div class="player-assignment jersey">
                        <span class="player-name-mobile">${playerName}</span>
                        <span class="position-badge-mobile jersey">Jersey</span>
                    </div>
                `;
            });
        }

        html += '</div>';
        return html;
    }

    renderMobileStats(statsContent) {
        if (!this.currentTeam) return;

        let html = '<div class="stats-grid">';

        this.currentTeam.players.forEach(player => {
            const stats = this.calculatePlayerStats(player.name);
            if (!stats) return;

            const positionCounts = stats.positionCounts;
            const mostPlayedPosition = Object.entries(positionCounts)
                .reduce((a, b) => (positionCounts[a[0]] || 0) > (positionCounts[b[0]] || 0) ? a : b, ['None', 0]);

            const playingTime = `${stats.totalPlayingMinutes}min`;
            const mostPlayed = mostPlayedPosition[1] > 0 ?
                `${mostPlayedPosition[0]} (${mostPlayedPosition[1]}x)` : 'None';

            html += `
                <div class="stat-player">
                    <div class="stat-player-name">${player.name}</div>
                    <div class="stat-summary">
                        <span>${playingTime}</span>
                        <span>${mostPlayed}</span>
                        <span>Sits: ${stats.benchCount}</span>
                    </div>
                </div>
            `;
        });

        html += '</div>';
        statsContent.innerHTML = html;
    }

    toggleAccordionSection(header, content) {
        const isActive = header.classList.contains('active');

        // Close all other sections
        document.querySelectorAll('.accordion-header.active').forEach(activeHeader => {
            if (activeHeader !== header) {
                activeHeader.classList.remove('active');
                const activeContent = activeHeader.nextElementSibling;
                if (activeContent) {
                    activeContent.classList.remove('expanded');
                }
            }
        });

        // Toggle current section
        if (isActive) {
            header.classList.remove('active');
            content.classList.remove('expanded');
        } else {
            header.classList.add('active');
            content.classList.add('expanded');
        }
    }

    formatTimeMinutes(minutes) {
        const hrs = Math.floor(minutes / 60);
        const mins = minutes % 60;
        if (hrs > 0) {
            return `${hrs}:${mins.toString().padStart(2, '0')}`;
        }
        return `${mins}min`;
    }

    // ===== PLAYER STATISTICS =====
    calculatePlayerStats(playerName) {
        if (!this.currentGame || !this.currentTeam) return null;
        
        const periodCount = this.currentGame.periodCount || 4;
        const periodDuration = this.currentGame.periodDuration || 15;
        
        let benchCount = 0;
        let jerseyCount = 0;
        let totalPlayingMinutes = 0;
        const positionCounts = {};
        
        // Iterate through all periods
        for (let period = 1; period <= periodCount; period++) {
            const periodLineup = this.currentGame.lineup[period];
            
            if (periodLineup) {
                // Check if player is on jersey (preparing for GK)
                if (periodLineup.jersey && periodLineup.jersey.includes(playerName)) {
                    jerseyCount++;
                    positionCounts['Jersey'] = (positionCounts['Jersey'] || 0) + 1;
                } else if (periodLineup.bench.includes(playerName)) {
                    // Check if player is on bench
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
            jerseyCount,
            totalPlayingMinutes,
            positionCounts,
            periodsPlayed: periodCount - benchCount - jerseyCount,
            averageMinutesPerPeriod: totalPlayingMinutes / Math.max(1, periodCount - benchCount - jerseyCount)
        };
    }
    
    formatPlayerStats(stats) {
        if (!stats) return '-';
        
        const positionList = Object.entries(stats.positionCounts)
            .sort((a, b) => b[1] - a[1]) // Sort by frequency
            .map(([pos, count]) => this.createStatPositionCard(pos, count))
            .join(' ');
        
        return `
            <div class="player-stats">
                <div class="stat-line"><strong>${stats.totalPlayingMinutes}min</strong> total</div>
                <div class="stat-line">Sits: ${stats.benchCount}</div>
                ${positionList ? `<div class="stat-line positions">${positionList}</div>` : ''}
            </div>
        `;
    }
    
    updatePeriodSelector() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.classList.toggle('active', parseInt(btn.dataset.period) === this.currentPeriod);
        });
    }
    
    // ===== EXPORT FUNCTIONALITY =====
    async exportTableView() {
        if (!this.currentGame || !this.currentTeam) {
            this.showErrorMessage('No game or team data to export');
            return;
        }
        
        try {
            // Load html2canvas if not already loaded
            if (typeof html2canvas === 'undefined') {
                await this.loadHtml2Canvas();
            }
            
            // Get the entire table section including team header
            const tableSection = document.querySelector('#tableTab .tab-section');
            
            // Temporarily modify the container for full capture
            const tableContainer = document.querySelector('#tableTab .table-container');
            const originalHeight = tableContainer.style.height;
            const originalOverflow = tableContainer.style.overflow;
            
            tableContainer.style.height = 'auto';
            tableContainer.style.overflow = 'visible';
            
            // Small delay to ensure layout is updated
            await new Promise(resolve => setTimeout(resolve, 100));
            
            const canvas = await html2canvas(tableSection, {
                backgroundColor: '#ffffff',
                scale: 2,
                logging: false,
                useCORS: true,
                height: tableSection.scrollHeight,
                windowHeight: tableSection.scrollHeight
            });
            
            // Restore original styles
            tableContainer.style.height = originalHeight;
            tableContainer.style.overflow = originalOverflow;
            
            // Create download link with enhanced filename
            const gameDate = new Date(this.currentGame.date).toISOString().split('T')[0]; // YYYY-MM-DD format
            const teamName = this.currentTeam.name.replace(/[^a-z0-9]/gi, '_'); // Clean team name
            const opponent = this.currentGame.opponent.replace(/[^a-z0-9]/gi, '_'); // Clean opponent name
            
            const link = document.createElement('a');
            link.download = `${teamName}_vs_${opponent}_${gameDate}_lineup.png`;
            link.href = canvas.toDataURL();
            link.click();
            
            this.showSuccessMessage('✅ Table exported successfully!');
        } catch (error) {
            console.error('Export failed:', error);
            this.showErrorMessage('❌ Failed to export table');
            
            // Restore styles in case of error
            const tableContainer = document.querySelector('#tableTab .table-container');
            tableContainer.style.height = 'calc(100vh - 280px)';
            tableContainer.style.overflow = 'auto';
        }
    }
    
    loadHtml2Canvas() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    updateExportButtonVisibility() {
        const exportBtn = document.getElementById('exportTableBtn');
        if (this.currentGame && this.currentTeam) {
            exportBtn.style.display = 'block';
        } else {
            exportBtn.style.display = 'none';
        }
    }

    // ===== UI HELPERS =====
    updateUI() {
        // Show appropriate sections
        if (this.currentGame && this.currentTeam) {
            this.showGameSection();
        } else {
            this.showTeamSection();
        }
        
        // Update new game button visibility (if it exists)
        const newGameBtn = document.getElementById('newGameBtn');
        if (newGameBtn) {
            newGameBtn.style.display = this.currentTeam && !this.currentGame ? 'inline-flex' : 'none';
        }
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
    }

    // ===== GAME TIMER FUNCTIONALITY =====
    initializeGameTimer() {
        const gameTimerContainer = document.getElementById('gameTimerContainer');
        const noGameMessage = document.getElementById('noGameTimerMessage');

        if (!this.currentGame) {
            // Show no game message
            if (gameTimerContainer) gameTimerContainer.style.display = 'none';
            if (noGameMessage) noGameMessage.style.display = 'block';
            return;
        }

        // Show timer interface
        if (gameTimerContainer) gameTimerContainer.style.display = 'block';
        if (noGameMessage) noGameMessage.style.display = 'none';

        const periodCount = this.currentGame.periodCount || 4;
        const periodDuration = this.currentGame.periodDuration || 15;

        // Update period title
        const timerPeriodTitle = document.getElementById('timerPeriodTitle');
        if (timerPeriodTitle) {
            timerPeriodTitle.textContent = `Period ${this.currentPeriod} of ${periodCount}`;
        }

        // Update timer total
        const timerTotal = document.getElementById('timerTotal');
        if (timerTotal) {
            timerTotal.textContent = this.formatTime(periodDuration * 60);
        }

        // Reset timer if not running
        if (!this.gameTimer.isRunning && this.gameTimer.elapsedTime === 0) {
            this.resetTimer();
        }

        // Update display
        this.updateTimerDisplay();
        this.updateUpcomingSubstitutions();
    }

    toggleTimer() {
        if (this.gameTimer.isRunning) {
            this.pauseTimer();
        } else {
            this.startTimer();
        }
    }

    startTimer() {
        if (!this.currentGame) return;

        this.gameTimer.isRunning = true;
        this.gameTimer.startTime = Date.now() - this.gameTimer.elapsedTime;

        // Update UI
        const playPauseBtn = document.getElementById('timerPlayPause');
        playPauseBtn.querySelector('.control-icon').textContent = '⏸️';

        // Start interval
        this.gameTimer.intervalId = setInterval(() => {
            this.updateTimerDisplay();
        }, 1000);
    }

    pauseTimer() {
        this.gameTimer.isRunning = false;
        if (this.gameTimer.intervalId) {
            clearInterval(this.gameTimer.intervalId);
            this.gameTimer.intervalId = null;
        }

        // Update UI
        const playPauseBtn = document.getElementById('timerPlayPause');
        playPauseBtn.querySelector('.control-icon').textContent = '▶️';
    }

    resetTimer() {
        this.gameTimer.isRunning = false;
        this.gameTimer.elapsedTime = 0;
        this.gameTimer.startTime = null;
        this.gameTimer.threeMinuteWarning = false;
        this.gameTimer.oneMinuteWarning = false;

        if (this.gameTimer.intervalId) {
            clearInterval(this.gameTimer.intervalId);
            this.gameTimer.intervalId = null;
        }

        this.updateTimerDisplay();
    }

    updateTimerDisplay() {
        if (!this.currentGame) return;

        const periodDuration = this.currentGame.periodDuration || 15;
        const totalSeconds = periodDuration * 60;

        // Calculate current elapsed time
        if (this.gameTimer.isRunning && this.gameTimer.startTime) {
            this.gameTimer.elapsedTime = Date.now() - this.gameTimer.startTime;
        }

        const currentSeconds = Math.floor(this.gameTimer.elapsedTime / 1000);
        const remainingSeconds = Math.max(0, totalSeconds - currentSeconds);
        const progressPercent = Math.min(100, (currentSeconds / totalSeconds) * 100);

        // Update timer elements
        document.getElementById('timerCurrent').textContent = this.formatTime(currentSeconds);
        document.getElementById('timerTimeRemaining').textContent = `${this.formatTime(remainingSeconds)} remaining`;
        document.getElementById('timerProgressPercent').textContent = `${Math.round(progressPercent)}%`;
        document.getElementById('timerProgressFill').style.width = `${progressPercent}%`;

        // Check for warnings
        this.checkTimeWarnings(remainingSeconds);

        // Check for period end
        if (currentSeconds >= totalSeconds && this.gameTimer.isRunning) {
            this.onPeriodEnd();
        }
    }

    checkTimeWarnings(remainingSeconds) {
        // 3 minute warning
        if (remainingSeconds <= 180 && remainingSeconds > 179 && !this.gameTimer.threeMinuteWarning && this.gameTimer.isRunning) {
            this.gameTimer.threeMinuteWarning = true;
            this.playWarningSound();
            this.showTimeWarning('3 minutes remaining!');
        }

        // 1 minute warning
        if (remainingSeconds <= 60 && remainingSeconds > 59 && !this.gameTimer.oneMinuteWarning && this.gameTimer.isRunning) {
            this.gameTimer.oneMinuteWarning = true;
            this.playWarningSound();
            this.showTimeWarning('1 minute remaining!');
        }
    }

    playWarningSound() {
        // Create audio context for beep sound
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.frequency.value = 800; // 800 Hz beep
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);

            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio not available:', error);
        }
    }

    showTimeWarning(message) {
        // Visual notification
        const notification = document.createElement('div');
        notification.className = 'time-warning-notification';
        notification.textContent = message;

        // Add to timer container
        const timerContainer = document.getElementById('gameTimerContainer');
        if (timerContainer) {
            timerContainer.appendChild(notification);

            // Auto-remove after 3 seconds
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 3000);
        }

        // Also show browser notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Soccer Timer', {
                body: message,
                icon: '⏱️'
            });
        }
    }

    formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    onPeriodEnd() {
        this.pauseTimer();

        const periodCount = this.currentGame.periodCount || 4;

        if (this.currentPeriod < periodCount) {
            // Show period end notification
            if (confirm(`Period ${this.currentPeriod} complete!\n\nAdvance to Period ${this.currentPeriod + 1}?`)) {
                this.nextPeriod();
            }
        } else {
            // Game complete
            alert(`Game Complete!\n\nAll ${periodCount} periods finished.`);
        }
    }

    nextPeriod() {
        if (!this.currentGame) return;

        const periodCount = this.currentGame.periodCount || 4;

        if (this.currentPeriod < periodCount) {
            this.currentPeriod++;
            this.resetTimer();
            this.updatePeriodSelector();
            this.renderField();
            this.initializeGameTimer();
            this.saveData();
        }
    }

    previousPeriod() {
        if (!this.currentGame) return;

        if (this.currentPeriod > 1) {
            this.currentPeriod--;
            this.resetTimer();
            this.updatePeriodSelector();
            this.renderField();
            this.initializeGameTimer();
            this.saveData();
        }
    }

    skipToNextPeriod() {
        if (confirm('Skip to next period?\n\nThis will end the current period timer.')) {
            this.nextPeriod();
        }
    }

    updateUpcomingSubstitutions() {
        const upcomingContainer = document.getElementById('timerUpcomingSubs');
        if (!upcomingContainer || !this.currentGame) return;

        // This is a placeholder - we'll implement smart substitution predictions
        const currentLineup = this.currentGame.lineup[this.currentPeriod];
        const nextPeriodLineup = this.currentGame.lineup[this.currentPeriod + 1];

        if (!nextPeriodLineup) {
            upcomingContainer.innerHTML = '<p class="no-subs-message">No upcoming substitutions scheduled</p>';
            return;
        }

        // Compare current and next period to find changes
        const changes = this.detectLineupChanges(currentLineup, nextPeriodLineup);

        if (changes.length === 0) {
            upcomingContainer.innerHTML = '<p class="no-subs-message">No substitutions planned for next period</p>';
        } else {
            const changesHtml = changes.map(change =>
                `<div class="upcoming-sub">
                    <span class="sub-time">Next period:</span>
                    <span class="sub-change">${change.out} OUT → ${change.in} IN (${change.position})</span>
                </div>`
            ).join('');
            upcomingContainer.innerHTML = changesHtml;
        }
    }

    detectLineupChanges(currentLineup, nextLineup) {
        const changes = [];

        if (!currentLineup?.positions || !nextLineup?.positions) return changes;

        // Compare each position
        for (const position in nextLineup.positions) {
            const currentPlayer = currentLineup.positions[position];
            const nextPlayer = nextLineup.positions[position];

            if (currentPlayer && nextPlayer && currentPlayer !== nextPlayer) {
                changes.push({
                    position: position,
                    out: currentPlayer,
                    in: nextPlayer
                });
            }
        }

        return changes;
    }


    // Quick action methods (placeholders for now)
    showEmergencySubModal() {
        alert('Emergency substitution feature coming soon!');
    }

    showInjurySubModal() {
        alert('Injury substitution feature coming soon!');
    }

    showGameNotesModal() {
        alert('Game notes feature coming soon!');
    }

    // ===== HISTORY FUNCTIONALITY =====
    async renderGameHistory() {
        const gameHistoryList = document.getElementById('gameHistoryList');
        const historicalGameView = document.getElementById('historicalGameView');

        // Show the game list, hide the historical game view
        gameHistoryList.style.display = 'block';
        historicalGameView.style.display = 'none';

        // Load completed games from Firebase if authenticated, otherwise from localStorage
        let completedGames = [];
        try {
            if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                completedGames = await window.firebaseService.getCompletedGames();
            } else {
                completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
            }
        } catch (error) {
            console.error('Error loading game history:', error);
            completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
        }

        if (completedGames.length === 0) {
            gameHistoryList.innerHTML = '<p class="empty-state">No completed games yet. Complete a game to see it here!</p>';
            return;
        }

        // Sort games by completion date (most recent first)
        completedGames.sort((a, b) => new Date(b.completed) - new Date(a.completed));

        const gameCards = completedGames.map(game => {
            const team = this.teams.find(t => t.id === game.teamId);
            const teamName = team ? team.name : 'Unknown Team';
            const gameDate = new Date(game.date).toLocaleDateString();
            const completedDate = new Date(game.completed).toLocaleDateString();

            return `
                <div class="game-card" data-game-id="${game.id}">
                    <div class="game-header">
                        <h3>${teamName} vs ${game.opponent}</h3>
                        <span class="game-date">${gameDate}</span>
                    </div>
                    <div class="game-details">
                        <span class="game-info">${game.periodCount} periods • ${game.periodDuration} min each</span>
                        <span class="completed-date">Completed: ${completedDate}</span>
                    </div>
                    <div class="game-actions">
                        <button class="btn secondary view-game-btn" data-game-id="${game.id}">
                            📋 View Game
                        </button>
                        <button class="btn danger delete-game-btn" data-game-id="${game.id}">
                            🗑️ Delete
                        </button>
                    </div>
                </div>
            `;
        }).join('');

        gameHistoryList.innerHTML = gameCards;

        // Add event listeners for view game buttons
        document.querySelectorAll('.view-game-btn').forEach(btn => {
            btn.addEventListener('click', async (e) => {
                const gameId = e.target.dataset.gameId;
                await this.viewHistoricalGame(gameId);
            });
        });

        // Add event listeners for delete game buttons
        document.querySelectorAll('.delete-game-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const gameId = e.target.dataset.gameId;
                this.deleteHistoricalGame(gameId);
            });
        });
    }

    async viewHistoricalGame(gameId) {
        // Load completed games from the same source as renderGameHistory
        let completedGames = [];
        try {
            if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                completedGames = await window.firebaseService.getCompletedGames();
            } else {
                completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
            }
        } catch (error) {
            console.error('Error loading completed games:', error);
            completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
        }

        const game = completedGames.find(g => g.id === gameId);

        if (!game) {
            console.error('Game not found:', gameId);
            return;
        }

        this.historicalGame = game;
        this.isViewingHistory = true;

        // Find the team for this historical game
        const team = this.teams.find(t => t.id === game.teamId);

        // Show historical game view
        const gameHistoryList = document.getElementById('gameHistoryList');
        const historicalGameView = document.getElementById('historicalGameView');

        if (!gameHistoryList || !historicalGameView) {
            console.error('Required elements not found for historical game view');
            return;
        }

        gameHistoryList.style.display = 'none';
        historicalGameView.style.display = 'block';

        // Update game title and info
        const gameDate = new Date(game.date).toLocaleDateString();
        const historicalGameTitle = document.getElementById('historicalGameTitle');
        const historicalGameDate = document.getElementById('historicalGameDate');

        if (historicalGameTitle) {
            historicalGameTitle.textContent = `${team ? team.name : 'Unknown Team'} vs ${game.opponent}`;
        }
        if (historicalGameDate) {
            historicalGameDate.textContent = `${gameDate} • ${game.periodCount} periods`;
        }

        // Show back to current game button if there's a current game
        const backToCurrentBtn = document.getElementById('backToCurrentBtn');
        if (backToCurrentBtn && this.currentGame) {
            backToCurrentBtn.style.display = 'inline-flex';
        }

        // Default to table view
        this.showHistoricalView('table');
    }

    async deleteHistoricalGame(gameId) {
        // Find the game to get details for confirmation
        let completedGames = [];
        try {
            if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                completedGames = await window.firebaseService.getCompletedGames();
            } else {
                completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
            }
        } catch (error) {
            console.error('Error loading completed games:', error);
            completedGames = JSON.parse(localStorage.getItem('soccer_completed_games') || '[]');
        }

        const game = completedGames.find(g => g.id === gameId);
        if (!game) return;

        const team = this.teams.find(t => t.id === game.teamId);
        const teamName = team ? team.name : 'Unknown Team';
        const gameDate = new Date(game.date).toLocaleDateString();

        if (confirm(`Are you sure you want to delete this game?\n\n${teamName} vs ${game.opponent}\n${gameDate}\n\nThis action cannot be undone.`)) {
            try {
                // Delete from Firebase if authenticated, otherwise from localStorage
                if (window.firebaseService && window.firebaseService.isAuthenticated()) {
                    await window.firebaseService.deleteGame(gameId);
                } else {
                    // Fallback to localStorage
                    const updatedGames = completedGames.filter(g => g.id !== gameId);
                    localStorage.setItem('soccer_completed_games', JSON.stringify(updatedGames));
                }

                // If we're currently viewing this historical game, go back to history list
                if (this.isViewingHistory && this.historicalGame && this.historicalGame.id === gameId) {
                    this.isViewingHistory = false;
                    this.historicalGame = null;
                }

                // Re-render the game history to update the list
                await this.renderGameHistory();

                this.showSuccessMessage(`Game vs ${game.opponent} deleted from history`);
            } catch (error) {
                console.error('Error deleting game:', error);
                this.showErrorMessage('Failed to delete game. Please try again.');
            }
        }
    }

    showHistoricalView(viewType) {
        const fieldView = document.getElementById('historicalFieldView');
        const tableView = document.getElementById('historicalTableView');
        const fieldBtn = document.getElementById('historicalFieldBtn');
        const tableBtn = document.getElementById('historicalTableBtn');

        // Update button states
        fieldBtn.classList.toggle('active', viewType === 'field');
        tableBtn.classList.toggle('active', viewType === 'table');

        if (viewType === 'field') {
            fieldView.style.display = 'block';
            tableView.style.display = 'none';
            this.renderHistoricalField();
        } else {
            fieldView.style.display = 'none';
            tableView.style.display = 'block';
            this.renderHistoricalTable();
        }
    }

    renderHistoricalField() {
        if (!this.historicalGame) return;

        // This would be similar to renderField() but read-only
        // For now, we'll focus on the table view as it's more important
        const fieldContainer = document.getElementById('historicalSoccerField');
        fieldContainer.innerHTML = '<p class="empty-state">Field view for historical games coming soon!</p>';
    }

    renderHistoricalTable() {
        if (!this.historicalGame) return;

        const team = this.teams.find(t => t.id === this.historicalGame.teamId);
        if (!team) return;

        const table = document.getElementById('historicalLineupTable');
        const tbody = table.querySelector('tbody');

        // Update table headers based on period count
        const thead = table.querySelector('thead tr');
        const periodCount = this.historicalGame.periodCount || 4;

        // Clear and rebuild headers
        thead.innerHTML = '<th>Player</th>';
        for (let i = 1; i <= periodCount; i++) {
            thead.innerHTML += `<th>Period ${i}</th>`;
        }
        thead.innerHTML += '<th>Statistics</th>';

        // Build table rows using the same logic as renderTable()
        this.renderTableForGame(this.historicalGame, team, tbody);
    }

    renderTableForGame(game, team, tbody) {
        let tableHTML = '';

        team.players.forEach(player => {
            const playerName = player.name;
            const stats = this.calculatePlayerStatsForGame(game, playerName);

            let row = `<tr><td class="player-name">${playerName}</td>`;

            // Add period columns
            for (let period = 1; period <= game.periodCount; period++) {
                const periodLineup = game.lineup[period];
                let assignment = '-';

                if (periodLineup && periodLineup.positions) {
                    // Check field positions
                    for (const [position, assignedPlayer] of Object.entries(periodLineup.positions)) {
                        if (assignedPlayer === playerName) {
                            assignment = this.createPositionCard(position, false);
                            break;
                        }
                    }

                    // If not in a field position, check if on bench or jersey
                    if (assignment === '-' && periodLineup.jersey && periodLineup.jersey.includes(playerName)) {
                        assignment = '<span class="position-card jersey">Jersey</span>';
                    } else if (assignment === '-' && periodLineup.bench.includes(playerName)) {
                        assignment = '<span class="position-card bench">Bench</span>';
                    }
                }

                row += `<td>${assignment}</td>`;
            }

            // Add statistics
            const positionCounts = stats.positionCounts;
            const positionsHtml = Object.entries(positionCounts)
                .filter(([_, count]) => count > 0)
                .map(([position, count]) => this.createStatPositionCard(position, count))
                .join(' ');

            row += `<td class="player-stats">
                <div class="stat-line positions">${positionsHtml}</div>
                <div class="stat-line">Sits: ${stats.benchCount}</div>
            </td>`;

            row += '</tr>';
            tableHTML += row;
        });

        tbody.innerHTML = tableHTML;
    }

    calculatePlayerStatsForGame(game, playerName) {
        let benchCount = 0;
        let jerseyCount = 0;
        const positionCounts = {};
        let periodCount = 0;
        let totalPlayingMinutes = 0;

        const periodDuration = game.periodDuration || 15;

        for (let period = 1; period <= game.periodCount; period++) {
            const periodLineup = game.lineup[period];
            if (periodLineup) {
                periodCount++;
                let wasPlaying = false;

                // Check field positions
                for (const [position, assignedPlayer] of Object.entries(periodLineup.positions || {})) {
                    if (assignedPlayer === playerName) {
                        const positionGroup = this.getPositionGroup(position);
                        positionCounts[positionGroup] = (positionCounts[positionGroup] || 0) + 1;
                        totalPlayingMinutes += periodDuration;
                        wasPlaying = true;
                        break;
                    }
                }

                // Check if player is on jersey (preparing for GK)
                if (periodLineup.jersey && periodLineup.jersey.includes(playerName)) {
                    jerseyCount++;
                    positionCounts['Jersey'] = (positionCounts['Jersey'] || 0) + 1;
                } else if (periodLineup.bench.includes(playerName)) {
                    // Check if player is on bench
                    benchCount++;
                }
            }
        }

        return {
            positionCounts,
            benchCount,
            jerseyCount,
            periodCount,
            totalPlayingMinutes,
            periodsPlayed: periodCount - benchCount - jerseyCount,
            averageMinutesPerPeriod: totalPlayingMinutes / Math.max(1, periodCount - benchCount - jerseyCount)
        };
    }

    backToCurrentGame() {
        this.isViewingHistory = false;
        this.historicalGame = null;

        // Hide back button
        document.getElementById('backToCurrentBtn').style.display = 'none';

        // Go back to field tab for current game
        this.switchTab('fieldTab');
    }

    // ===== SETTINGS FUNCTIONALITY =====
    exportAllData() {
        const data = {
            teams: this.teams,
            currentGame: this.currentGame,
            completedGames: JSON.parse(localStorage.getItem('soccer_completed_games') || '[]'),
            exported: new Date().toISOString()
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `soccer-manager-data-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    clearAllData() {
        if (confirm('Are you sure you want to clear ALL data? This will delete all teams, games, and history. This cannot be undone.')) {
            localStorage.removeItem('soccer_teams');
            localStorage.removeItem('soccer_current_game');
            localStorage.removeItem('soccer_completed_games');

            // Reset app state
            this.teams = [];
            this.currentTeam = null;
            this.currentGame = null;
            this.historicalGame = null;
            this.isViewingHistory = false;

            // Go back to teams tab
            this.switchTab('teamsTab');
            this.renderTeams();

            alert('All data has been cleared.');
        }
    }
}

// ===== INITIALIZE APP =====
let app;
document.addEventListener('DOMContentLoaded', async () => {
    app = new SoccerApp();
    // Make app globally accessible for onclick handlers
    window.app = app;
    // Initialize the app asynchronously
    await app.init();
});

// ===== LOGO UPLOAD FUNCTIONALITY =====
function handleLogoUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    // Validate file type
    if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        input.value = '';
        return;
    }
    
    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
        alert('Image must be smaller than 2MB');
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

function removeLogo() {
    const preview = document.getElementById('logoPreview');
    const input = document.getElementById('teamLogoInput');
    
    preview.style.display = 'none';
    input.value = '';
    window.currentLogoData = null;
}

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

// ===== NATIVE MOBILE INTERACTIONS =====
class MobileInteractions {
    constructor() {
        this.isMobile = window.innerWidth <= 768;
        this.isTouch = 'ontouchstart' in window;
        this.pullToRefreshThreshold = 60;
        this.swipeThreshold = 50;
        this.vibrationEnabled = 'vibrate' in navigator;

        if (this.isMobile && this.isTouch) {
            this.initializeMobileInteractions();
        }
    }

    initializeMobileInteractions() {
        // Disabled: this.setupPullToRefresh();
        // Disabled: this.setupSwipeNavigation();
        this.setupTouchRipples();
        this.setupHapticFeedback();
        this.setupFloatingActionButton();
        this.setupDynamicNavbar();
        this.setupLongPressGestures();
    }

    // Pull-to-refresh functionality
    setupPullToRefresh() {
        let startY = 0;
        let pullDistance = 0;
        let isPulling = false;
        let isRefreshing = false;

        const indicator = this.createPullToRefreshIndicator();

        document.addEventListener('touchstart', (e) => {
            const scrollTop = document.querySelector('.tab-content.active')?.scrollTop || 0;
            if (scrollTop <= 0) {
                startY = e.touches[0].clientY;
                isPulling = true;
            }
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isPulling || isRefreshing) return;

            const currentY = e.touches[0].clientY;
            pullDistance = Math.max(0, currentY - startY);

            if (pullDistance > 10) {
                e.preventDefault();
                const progress = Math.min(pullDistance / this.pullToRefreshThreshold, 1);
                this.updatePullIndicator(indicator, progress);
            }
        }, { passive: false });

        document.addEventListener('touchend', () => {
            if (!isPulling) return;

            if (pullDistance > this.pullToRefreshThreshold && !isRefreshing) {
                this.triggerRefresh(indicator);
                this.hapticFeedback('medium');
            }

            this.resetPullIndicator(indicator);
            isPulling = false;
            pullDistance = 0;
        });
    }

    createPullToRefreshIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'pull-to-refresh-indicator';
        indicator.innerHTML = '<div class="spinner"></div>';
        document.body.appendChild(indicator);
        return indicator;
    }

    updatePullIndicator(indicator, progress) {
        indicator.style.opacity = progress;
        indicator.style.transform = `translateX(-50%) scale(${0.5 + progress * 0.5})`;
    }

    resetPullIndicator(indicator) {
        indicator.classList.remove('active');
        indicator.style.opacity = '0';
        indicator.style.transform = 'translateX(-50%) scale(0.5)';
    }

    async triggerRefresh(indicator) {
        indicator.classList.add('active');

        // Refresh current view
        if (app.currentView === 'teams') {
            await app.loadTeams();
        } else if (app.currentView === 'game' && app.currentGame) {
            app.renderField();
        }

        // Show completion after delay
        setTimeout(() => {
            this.resetPullIndicator(indicator);
        }, 1000);
    }

    // Swipe navigation between tabs
    setupSwipeNavigation() {
        let startX = 0;
        let startY = 0;
        let isSwipeValid = false;

        const feedback = this.createSwipeFeedback();

        document.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            isSwipeValid = true;
        }, { passive: true });

        document.addEventListener('touchmove', (e) => {
            if (!isSwipeValid) return;

            const deltaX = e.touches[0].clientX - startX;
            const deltaY = e.touches[0].clientY - startY;

            // If vertical movement is too much, cancel swipe
            if (Math.abs(deltaY) > Math.abs(deltaX) * 2) {
                isSwipeValid = false;
                return;
            }

            // Show swipe feedback
            if (Math.abs(deltaX) > this.swipeThreshold) {
                this.showSwipeFeedback(feedback, deltaX > 0 ? 'right' : 'left');
            }
        }, { passive: true });

        document.addEventListener('touchend', (e) => {
            if (!isSwipeValid) return;

            const deltaX = e.changedTouches[0].clientX - startX;

            if (Math.abs(deltaX) > this.swipeThreshold) {
                this.handleSwipeNavigation(deltaX > 0 ? 'right' : 'left');
                this.hapticFeedback('light');
            }

            this.hideSwipeFeedback(feedback);
            isSwipeValid = false;
        });
    }

    createSwipeFeedback() {
        const left = document.createElement('div');
        left.className = 'swipe-feedback left';
        left.textContent = '← Back';

        const right = document.createElement('div');
        right.className = 'swipe-feedback right';
        right.textContent = 'Next →';

        document.body.appendChild(left);
        document.body.appendChild(right);

        return { left, right };
    }

    showSwipeFeedback(feedback, direction) {
        feedback[direction].classList.add('show');
    }

    hideSwipeFeedback(feedback) {
        feedback.left.classList.remove('show');
        feedback.right.classList.remove('show');
    }

    handleSwipeNavigation(direction) {
        const tabs = ['teams', 'game'];
        const currentIndex = tabs.indexOf(app.currentView);

        if (direction === 'left' && currentIndex < tabs.length - 1) {
            app.setActiveTab(tabs[currentIndex + 1]);
        } else if (direction === 'right' && currentIndex > 0) {
            app.setActiveTab(tabs[currentIndex - 1]);
        }
    }

    // Touch ripple effects
    setupTouchRipples() {
        document.addEventListener('touchstart', (e) => {
            const button = e.target.closest('.btn, .nav-item, .player-item');
            if (!button) return;

            button.classList.add('ripple');
            setTimeout(() => button.classList.remove('ripple'), 400);
        });
    }

    // Haptic feedback
    setupHapticFeedback() {
        // Add haptic feedback to important interactions
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.btn.primary, .nav-item, .position-button');
            if (target) {
                this.hapticFeedback('light');
            }
        });
    }

    hapticFeedback(intensity = 'light') {
        if (!this.vibrationEnabled) return;

        const patterns = {
            light: [10],
            medium: [20],
            heavy: [30],
            success: [10, 10, 10],
            error: [100, 50, 100]
        };

        if (patterns[intensity]) {
            navigator.vibrate(patterns[intensity]);
        }
    }

    // Floating Action Button
    setupFloatingActionButton() {
        const fab = document.createElement('button');
        fab.className = 'fab mobile-only';
        fab.innerHTML = '+';
        fab.setAttribute('aria-label', 'Quick action');

        fab.addEventListener('click', () => {
            this.handleFabClick();
            this.hapticFeedback('medium');
        });

        document.body.appendChild(fab);
        this.updateFabIcon();

        // Update FAB icon based on current view
        const observer = new MutationObserver(() => {
            this.updateFabIcon();
        });

        observer.observe(document.querySelector('.app-container'), {
            attributes: true,
            subtree: true
        });
    }

    updateFabIcon() {
        const fab = document.querySelector('.fab');
        if (!fab) return;

        if (app.currentView === 'teams') {
            fab.innerHTML = '👥';
            fab.title = 'Create new team';
        } else if (app.currentView === 'game' && app.currentTeam) {
            fab.innerHTML = '⚽';
            fab.title = 'Start new game';
        } else {
            fab.style.display = 'none';
            return;
        }

        fab.style.display = 'flex';
    }

    handleFabClick() {
        if (app.currentView === 'teams') {
            app.showCreateTeamModal();
        } else if (app.currentView === 'game' && app.currentTeam) {
            app.startNewGame();
        }
    }

    // Dynamic navbar scroll effects
    setupDynamicNavbar() {
        let lastScrollY = 0;
        const navbar = document.querySelector('.native-nav');

        const handleScroll = () => {
            const scrollY = document.querySelector('.tab-content.active')?.scrollTop || 0;

            if (scrollY > 50) {
                navbar?.classList.add('scrolled');
            } else {
                navbar?.classList.remove('scrolled');
            }

            lastScrollY = scrollY;
        };

        // Add scroll listener to active tab content
        const observer = new MutationObserver(() => {
            const activeTab = document.querySelector('.tab-content.active');
            if (activeTab) {
                activeTab.addEventListener('scroll', handleScroll, { passive: true });
            }
        });

        observer.observe(document.querySelector('.app-container'), {
            attributes: true,
            subtree: true
        });
    }

    // Enhanced loading states with smooth transitions
    showLoadingState(element) {
        if (!element) return;

        element.style.opacity = '0.6';
        element.style.pointerEvents = 'none';
        element.style.transform = 'scale(0.98)';
        element.style.transition = 'all 0.2s ease';
    }

    hideLoadingState(element) {
        if (!element) return;

        element.style.opacity = '1';
        element.style.pointerEvents = 'auto';
        element.style.transform = 'scale(1)';
    }

    // Long press gesture detection
    setupLongPressGestures() {
        let pressTimer;
        let isLongPress = false;

        document.addEventListener('touchstart', (e) => {
            const target = e.target.closest('.player-item, .team-card, .btn');
            if (!target) return;

            isLongPress = false;
            pressTimer = setTimeout(() => {
                isLongPress = true;
                this.handleLongPress(target, e);
                this.hapticFeedback('medium');
            }, 500);
        });

        document.addEventListener('touchend', () => {
            clearTimeout(pressTimer);
        });

        document.addEventListener('touchmove', () => {
            clearTimeout(pressTimer);
        });
    }

    handleLongPress(target, event) {
        // Show context menu or additional options
        if (target.classList.contains('player-item')) {
            this.showPlayerContextMenu(target, event);
        } else if (target.classList.contains('team-card')) {
            this.showTeamContextMenu(target, event);
        }
    }

    showPlayerContextMenu(playerElement, event) {
        // Create contextual menu for player actions
        const menu = document.createElement('div');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <div class="context-menu-item">Edit Player</div>
            <div class="context-menu-item">Remove from Lineup</div>
            <div class="context-menu-item">Player Stats</div>
        `;

        document.body.appendChild(menu);
        this.positionContextMenu(menu, event);

        setTimeout(() => menu.remove(), 3000);
    }

    positionContextMenu(menu, event) {
        const rect = event.target.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = `${rect.top - 10}px`;
        menu.style.left = `${rect.left}px`;
        menu.style.zIndex = '10000';
    }
}

// Enhanced scroll behavior management
class ScrollBehaviorManager {
    constructor() {
        this.setupInertialScrolling();
        this.setupScrollOptimizations();
    }

    setupInertialScrolling() {
        // Add momentum scrolling for iOS
        const scrollContainers = document.querySelectorAll('.tab-content, .modal-content');
        scrollContainers.forEach(container => {
            container.style.webkitOverflowScrolling = 'touch';
            container.style.overflowScrolling = 'touch';
        });
    }

    setupScrollOptimizations() {
        // Passive scroll listeners for better performance
        document.addEventListener('scroll', this.handleScroll.bind(this), { passive: true });
        document.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: true });
    }

    handleScroll() {
        // Debounced scroll handling
        if (this.scrollTimeout) {
            clearTimeout(this.scrollTimeout);
        }

        this.scrollTimeout = setTimeout(() => {
            this.updateScrollIndicators();
        }, 16); // ~60fps
    }

    updateScrollIndicators() {
        const scrollContainers = document.querySelectorAll('.tab-content');
        scrollContainers.forEach(container => {
            const indicator = container.querySelector('.scroll-indicator');
            if (!indicator) return;

            const isScrollable = container.scrollHeight > container.clientHeight;
            const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - 10;

            if (isScrollable && !isNearBottom) {
                indicator.classList.add('visible');
            } else {
                indicator.classList.remove('visible');
            }
        });
    }

    handleTouchStart() {
        // Prepare for smooth scrolling
        document.body.style.touchAction = 'manipulation';
    }
}

// Performance monitoring and optimization
class PerformanceOptimizer {
    constructor() {
        this.setupLazyLoading();
        this.setupImageOptimization();
        this.setupMemoryManagement();
    }

    setupLazyLoading() {
        // Lazy load non-critical content
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    this.loadLazyContent(entry.target);
                    observer.unobserve(entry.target);
                }
            });
        }, { rootMargin: '50px' });

        // Observe elements marked for lazy loading
        document.querySelectorAll('[data-lazy]').forEach(el => {
            observer.observe(el);
        });
    }

    loadLazyContent(element) {
        // Load content when it comes into view
        const src = element.dataset.src;
        if (src) {
            element.src = src;
            element.removeAttribute('data-src');
        }
    }

    setupImageOptimization() {
        // Optimize images for mobile
        const images = document.querySelectorAll('img');
        images.forEach(img => {
            img.loading = 'lazy';
            img.decoding = 'async';
        });
    }

    setupMemoryManagement() {
        // Clean up unused DOM elements periodically
        setInterval(() => {
            this.cleanupUnusedElements();
        }, 30000); // Every 30 seconds
    }

    cleanupUnusedElements() {
        // Remove hidden modals and temporary elements
        const hiddenModals = document.querySelectorAll('.modal[style*="display: none"]');
        hiddenModals.forEach(modal => {
            const content = modal.querySelector('.modal-content');
            if (content && content.children.length === 0) {
                modal.remove();
            }
        });
    }
}

// App startup and splash screen management
class AppStartup {
    constructor() {
        this.splashScreen = document.getElementById('splash-screen');
        this.appContainer = document.querySelector('.app-container');
        this.minSplashTime = 2000; // Minimum 2 seconds for branding
        this.startTime = Date.now();

        this.initializeApp();
    }

    // Authentication enforcement - NOBODY gets past without login
    enforceAuthentication() {
        // Ensure app container is hidden until authenticated
        const appContainer = document.querySelector('.app-container');
        const authPage = document.getElementById('authPage');

        if (appContainer) appContainer.style.display = 'none';
        if (authPage) authPage.style.display = 'block';

        // Block all app functionality until authenticated
        this.blockAllInteractions();
    }

    blockAllInteractions() {
        // Disable all buttons and interactions
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const selects = document.querySelectorAll('select');

        buttons.forEach(btn => {
            if (!btn.closest('#authPage')) {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
            }
        });

        inputs.forEach(input => {
            if (!input.closest('#authPage')) {
                input.disabled = true;
            }
        });

        selects.forEach(select => {
            if (!select.closest('#authPage')) {
                select.disabled = true;
            }
        });
    }

    unblockAllInteractions() {
        // Re-enable all buttons and interactions after authentication
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const selects = document.querySelectorAll('select');

        buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
        });

        inputs.forEach(input => {
            input.disabled = false;
        });

        selects.forEach(select => {
            select.disabled = false;
        });
    }

    // Authentication enforcement - NOBODY gets past without login
    enforceAuthentication() {
        // Ensure app container is hidden until authenticated
        const appContainer = document.querySelector('.app-container');
        const authPage = document.getElementById('authPage');

        if (appContainer) appContainer.style.display = 'none';
        if (authPage) authPage.style.display = 'block';

        // Block all app functionality until authenticated
        this.blockAllInteractions();
    }

    blockAllInteractions() {
        // Disable all buttons and interactions
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const selects = document.querySelectorAll('select');

        buttons.forEach(btn => {
            if (!btn.closest('#authPage')) {
                btn.disabled = true;
                btn.style.pointerEvents = 'none';
            }
        });

        inputs.forEach(input => {
            if (!input.closest('#authPage')) {
                input.disabled = true;
            }
        });

        selects.forEach(select => {
            if (!select.closest('#authPage')) {
                select.disabled = true;
            }
        });
    }

    unblockAllInteractions() {
        // Re-enable all buttons and interactions after authentication
        const buttons = document.querySelectorAll('button');
        const inputs = document.querySelectorAll('input');
        const selects = document.querySelectorAll('select');

        buttons.forEach(btn => {
            btn.disabled = false;
            btn.style.pointerEvents = 'auto';
        });

        inputs.forEach(input => {
            input.disabled = false;
        });

        selects.forEach(select => {
            select.disabled = false;
        });
    }

    async initializeApp() {
        try {
            // Simulate app loading and initialization
            await Promise.all([
                this.loadCriticalResources(),
                this.initializeServices(),
                this.waitMinimumTime()
            ]);

            this.hideSplashScreen();
        } catch (error) {
            console.error('App initialization failed:', error);
            this.hideSplashScreen(); // Still show app even if some initialization fails
        }
    }

    async loadCriticalResources() {
        // Preload critical resources
        const promises = [];

        // Preload Firebase if not already loaded
        if (!window.firebase) {
            promises.push(new Promise(resolve => {
                const checkFirebase = () => {
                    if (window.firebase) resolve();
                    else setTimeout(checkFirebase, 100);
                };
                checkFirebase();
            }));
        }

        return Promise.all(promises);
    }

    async initializeServices() {
        // Initialize app services
        return new Promise(resolve => {
            // Wait for DOM to be fully ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', resolve);
            } else {
                resolve();
            }
        });
    }

    async waitMinimumTime() {
        const elapsed = Date.now() - this.startTime;
        const remaining = Math.max(0, this.minSplashTime - elapsed);

        if (remaining > 0) {
            return new Promise(resolve => setTimeout(resolve, remaining));
        }
    }

    hideSplashScreen() {
        this.splashScreen.classList.add('fade-out');

        setTimeout(() => {
            this.splashScreen.style.display = 'none';
            this.appContainer.style.display = 'flex';

            // Trigger app initialization
            this.startMainApp();
        }, 500);
    }

    startMainApp() {
        // Initialize all app components
        new MobileInteractions();
        new ScrollBehaviorManager();
        new PerformanceOptimizer();
        new PWAInstallManager();

        // Signal that app is ready
        window.dispatchEvent(new CustomEvent('appReady'));
    }
}

// PWA Installation and App Badge Management

class PWAInstallManager {
    constructor() {
        this.deferredPrompt = null;
        this.isInstalled = this.checkIfInstalled();

        this.setupInstallPrompt();
        this.setupAppBadge();
    }

    checkIfInstalled() {
        // Check if app is installed
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone === true ||
               document.referrer.includes('android-app://');
    }

    setupInstallPrompt() {
        // Get the header install button
        this.installBtn = document.getElementById('installAppBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            // Prevent default mini-infobar
            e.preventDefault();
            this.deferredPrompt = e;

            // Show header install button
            this.showHeaderInstallBtn();
        });

        window.addEventListener('appinstalled', () => {
            this.isInstalled = true;
            this.hideInstallPrompt();
            this.hideHeaderInstallBtn();
            this.showInstallSuccess();
        });

        // Add click handler for header install button
        if (this.installBtn) {
            this.installBtn.addEventListener('click', () => {
                this.triggerInstall();
            });
        }
    }

    showHeaderInstallBtn() {
        if (this.installBtn && !this.isInstalled) {
            this.installBtn.style.display = 'flex';
        }
    }

    hideHeaderInstallBtn() {
        if (this.installBtn) {
            this.installBtn.style.display = 'none';
        }
    }

    showInstallPrompt() {
        if (this.isInstalled) return;

        // Create install prompt
        const installPrompt = document.createElement('div');
        installPrompt.className = 'install-prompt';
        installPrompt.innerHTML = `
            <div class="install-content">
                <div class="install-icon">⚽</div>
                <div class="install-text">
                    <h3>Install SimpleSquad</h3>
                    <p>Get the full app experience with offline access</p>
                </div>
                <div class="install-actions">
                    <button class="btn primary install-btn">Install</button>
                    <button class="btn secondary dismiss-btn">Later</button>
                </div>
            </div>
        `;

        // Add event listeners
        installPrompt.querySelector('.install-btn').addEventListener('click', () => {
            this.triggerInstall();
        });

        installPrompt.querySelector('.dismiss-btn').addEventListener('click', () => {
            installPrompt.remove();
        });

        document.body.appendChild(installPrompt);

        // Auto-show after delay
        setTimeout(() => {
            installPrompt.classList.add('show');
        }, 100);

        // Auto-dismiss after 10 seconds
        setTimeout(() => {
            if (installPrompt.parentNode) {
                installPrompt.classList.remove('show');
                setTimeout(() => installPrompt.remove(), 300);
            }
        }, 10000);
    }

    async triggerInstall() {
        if (!this.deferredPrompt) return;

        this.deferredPrompt.prompt();
        const { outcome } = await this.deferredPrompt.userChoice;

        if (outcome === 'accepted') {
            console.log('User accepted install prompt');
        }

        this.deferredPrompt = null;
        document.querySelector('.install-prompt')?.remove();
    }

    hideInstallPrompt() {
        document.querySelector('.install-prompt')?.remove();
    }

    showInstallSuccess() {
        const successToast = document.createElement('div');
        successToast.className = 'install-success-toast';
        successToast.innerHTML = `
            <div class="toast-content">
                <div class="toast-icon">✅</div>
                <div class="toast-text">
                    <strong>App Installed!</strong>
                    <p>SimpleSquad is now available on your home screen</p>
                </div>
            </div>
        `;

        document.body.appendChild(successToast);

        setTimeout(() => {
            successToast.classList.add('show');
        }, 100);

        setTimeout(() => {
            successToast.classList.remove('show');
            setTimeout(() => successToast.remove(), 300);
        }, 4000);
    }

    setupAppBadge() {
        // Setup app badge for notifications (if supported)
        if ('setAppBadge' in navigator) {
            this.updateAppBadge();
        }
    }

    updateAppBadge(count = 0) {
        if ('setAppBadge' in navigator) {
            if (count > 0) {
                navigator.setAppBadge(count);
            } else {
                navigator.clearAppBadge();
            }
        }
    }
}

// Initialize app startup
document.addEventListener('DOMContentLoaded', () => {
    new AppStartup();
});