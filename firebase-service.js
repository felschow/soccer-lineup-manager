/**
 * Firebase Service Layer
 * Handles authentication, data storage, and real-time sync
 */

class FirebaseService {
    constructor() {
        this.auth = window.firebaseAuth;
        this.db = window.firebaseDb;
        this.currentUser = null;
        this.isInitialized = false;

        // Wait for Firebase to be ready before setting up auth listener
        this.initializeAuthListener();
    }

    initializeAuthListener() {
        // Check if Firebase auth is available
        if (!this.auth || !this.auth.onAuthStateChanged) {
            console.log('Firebase auth not ready, retrying...');
            setTimeout(() => this.initializeAuthListener(), 100);
            return;
        }

        // Additional check for Firebase readiness
        if (!window.firebaseAuth || !window.firebaseDb) {
            console.log('Firebase services not ready, retrying...');
            setTimeout(() => this.initializeAuthListener(), 100);
            return;
        }

        // Set up auth state listener
        this.auth.onAuthStateChanged((user) => {
            this.currentUser = user;
            this.onAuthStateChanged(user);
        });
    }

    // ===== AUTHENTICATION =====

    async signInWithEmail(email, password) {
        try {
            const userCredential = await this.auth.signInWithEmailAndPassword(email, password);
            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signUpWithEmail(email, password) {
        try {
            const userCredential = await this.auth.createUserWithEmailAndPassword(email, password);

            // Create user profile in Firestore
            await this.createUserProfile(userCredential.user);

            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signInWithGoogle() {
        try {
            const provider = new firebase.auth.GoogleAuthProvider();
            const userCredential = await this.auth.signInWithPopup(provider);

            // Create user profile if new user
            await this.createUserProfile(userCredential.user);

            return { success: true, user: userCredential.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            await this.auth.signOut();
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // ===== USER PROFILE =====

    async createUserProfile(user) {
        try {
            const userRef = this.db.collection('users').doc(user.uid);
            const userSnap = await userRef.get();

            // Only create if doesn't exist
            if (!userSnap.exists) {
                await userRef.set({
                    uid: user.uid,
                    email: user.email,
                    displayName: user.displayName || 'Soccer Coach',
                    photoURL: user.photoURL || null,
                    createdAt: new Date().toISOString(),
                    lastLoginAt: new Date().toISOString()
                });
            } else {
                // Update last login
                await userRef.update({
                    lastLoginAt: new Date().toISOString()
                });
            }
        } catch (error) {
            console.error('Error creating user profile:', error);
            if (window.errorHandler) {
                window.errorHandler.reportCustomError('Authentication Error',
                    'Failed to create user profile', { error: error.message });
            }
        }
    }

    // ===== TEAM MANAGEMENT =====

    async saveTeam(teamData) {
        if (!this.currentUser) throw new Error('User not authenticated');

        try {
            const teamWithMeta = {
                ...teamData,
                userId: this.currentUser.uid,
                createdAt: teamData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (teamData.id) {
                // Update existing team
                const teamRef = this.db.collection('teams').doc(teamData.id);
                await teamRef.set(teamWithMeta);
                return teamData.id;
            } else {
                // Create new team
                const teamsRef = this.db.collection('teams');
                const docRef = await teamsRef.add(teamWithMeta);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving team:', error);
            if (window.errorHandler) {
                window.errorHandler.reportCustomError('Data Loss Error',
                    'Failed to save team data', { error: error.message, teamName: teamData.name });
            }
            throw error;
        }
    }

    async getTeams() {
        if (!this.currentUser) return [];

        try {
            const teamsRef = this.db.collection('teams');
            const querySnapshot = await teamsRef
                .where('userId', '==', this.currentUser.uid)
                .orderBy('updatedAt', 'desc')
                .get();

            const teams = [];
            querySnapshot.forEach((doc) => {
                teams.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return teams;
        } catch (error) {
            console.error('Error getting teams:', error);
            return [];
        }
    }

    async deleteTeam(teamId) {
        if (!this.currentUser) throw new Error('User not authenticated');

        try {
            const teamRef = this.db.collection('teams').doc(teamId);
            await teamRef.delete();

            return { success: true };
        } catch (error) {
            console.error('Error deleting team:', error);
            throw error;
        }
    }

    // ===== GAME MANAGEMENT =====

    async saveGame(gameData) {
        if (!this.currentUser) throw new Error('User not authenticated');

        try {
            const gameWithMeta = {
                ...gameData,
                userId: this.currentUser.uid,
                createdAt: gameData.createdAt || new Date().toISOString(),
                updatedAt: new Date().toISOString()
            };

            if (gameData.id) {
                // Update existing game
                const gameRef = this.db.collection('games').doc(gameData.id);
                await gameRef.set(gameWithMeta);
                return gameData.id;
            } else {
                // Create new game
                const gamesRef = this.db.collection('games');
                const docRef = await gamesRef.add(gameWithMeta);
                return docRef.id;
            }
        } catch (error) {
            console.error('Error saving game:', error);
            throw error;
        }
    }

    async getCurrentGame() {
        if (!this.currentUser) return null;

        try {
            const gamesRef = this.db.collection('games');
            const querySnapshot = await gamesRef
                .where('userId', '==', this.currentUser.uid)
                .where('completed', '==', null) // Active games
                .orderBy('updatedAt', 'desc')
                .limit(1)
                .get();

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting current game:', error);
            return null;
        }
    }

    async getCurrentGameForTeam(teamId) {
        if (!this.currentUser) return null;

        try {
            const gamesRef = this.db.collection('games');
            const querySnapshot = await gamesRef
                .where('userId', '==', this.currentUser.uid)
                .where('teamId', '==', teamId)
                .where('completed', '==', null) // Active games
                .orderBy('updatedAt', 'desc')
                .limit(1)
                .get();

            if (!querySnapshot.empty) {
                const doc = querySnapshot.docs[0];
                return {
                    id: doc.id,
                    ...doc.data()
                };
            }

            return null;
        } catch (error) {
            console.error('Error getting current game for team:', error);
            return null;
        }
    }

    async getCompletedGames() {
        if (!this.currentUser) return [];

        try {
            const gamesRef = this.db.collection('games');
            const querySnapshot = await gamesRef
                .where('userId', '==', this.currentUser.uid)
                .where('completed', '!=', null) // Completed games
                .orderBy('completed', 'desc')
                .get();

            const games = [];
            querySnapshot.forEach((doc) => {
                games.push({
                    id: doc.id,
                    ...doc.data()
                });
            });

            return games;
        } catch (error) {
            console.error('Error getting completed games:', error);
            return [];
        }
    }

    async deleteGame(gameId) {
        if (!this.currentUser) throw new Error('User not authenticated');

        try {
            const gameRef = this.db.collection('games').doc(gameId);
            await gameRef.delete();

            return { success: true };
        } catch (error) {
            console.error('Error deleting game:', error);
            throw error;
        }
    }

    // ===== REAL-TIME SYNC =====

    onTeamsChange(callback) {
        if (!this.currentUser) return () => {};

        const teamsRef = this.db.collection('teams');
        return teamsRef
            .where('userId', '==', this.currentUser.uid)
            .orderBy('updatedAt', 'desc')
            .onSnapshot((querySnapshot) => {
                const teams = [];
                querySnapshot.forEach((doc) => {
                    teams.push({
                        id: doc.id,
                        ...doc.data()
                    });
                });
                callback(teams);
            });
    }

    // ===== AUTH STATE MANAGEMENT =====

    onAuthStateChanged(user) {
        if (user) {
            console.log('User signed in:', user.email);
            console.log('Dispatching userSignedIn event with user:', user);
            // Trigger app to load user data
            const event = new CustomEvent('userSignedIn', { detail: user });
            console.log('Created event:', event);
            window.dispatchEvent(event);
            console.log('userSignedIn event dispatched');
        } else {
            console.log('User signed out');
            // Trigger app to clear data and show login
            window.dispatchEvent(new CustomEvent('userSignedOut'));
        }
    }

    // ===== UTILITY METHODS =====

    isAuthenticated() {
        return !!this.currentUser;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    getCurrentUserId() {
        return this.currentUser?.uid || null;
    }

    getCurrentUserEmail() {
        return this.currentUser?.email || null;
    }

    getCurrentUserDisplayName() {
        return this.currentUser?.displayName || this.currentUser?.email || 'Soccer Coach';
    }
}

// Create global Firebase service instance
window.firebaseService = new FirebaseService();