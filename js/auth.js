// Authentication System using Supabase
// Simple, free authentication with user isolation

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your project URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key

const supabase = createClient(supabaseUrl, supabaseKey)

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    async init() {
        // Check for existing session
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
            this.currentUser = session.user;
            this.notifyAuthCallbacks('signin', session.user);
        }

        // Listen for auth changes
        supabase.auth.onAuthStateChange((event, session) => {
            if (event === 'SIGNED_IN' && session?.user) {
                this.currentUser = session.user;
                this.notifyAuthCallbacks('signin', session.user);
            } else if (event === 'SIGNED_OUT') {
                this.currentUser = null;
                this.notifyAuthCallbacks('signout', null);
            }
        });
    }

    // Register new user
    async register(email, password, metadata = {}) {
        try {
            const { data, error } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: metadata // Can include coach name, etc.
                }
            });
            
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Login with email/password
    async login(email, password) {
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password
            });
            
            if (error) throw error;
            return { success: true, user: data.user };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Login with Google OAuth
    async loginWithGoogle() {
        try {
            const { data, error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin
                }
            });
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Logout
    async logout() {
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // Check if user is authenticated
    isAuthenticated() {
        return this.currentUser !== null;
    }

    // Get current user
    getCurrentUser() {
        return this.currentUser;
    }

    // Subscribe to auth state changes
    onAuthStateChange(callback) {
        this.authCallbacks.push(callback);
        return () => {
            this.authCallbacks = this.authCallbacks.filter(cb => cb !== callback);
        };
    }

    notifyAuthCallbacks(event, user) {
        this.authCallbacks.forEach(callback => callback(event, user));
    }
}

// Export singleton instance
const authManager = new AuthManager();
export default authManager;