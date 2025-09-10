// Authentication System using Supabase
// Simple, free authentication with user isolation

import { createClient } from 'https://cdn.skypack.dev/@supabase/supabase-js@2'

const supabaseUrl = 'YOUR_SUPABASE_URL' // Replace with your project URL
const supabaseKey = 'YOUR_SUPABASE_ANON_KEY' // Replace with your anon key

// Check if Supabase is configured
const isSupabaseConfigured = supabaseUrl !== 'YOUR_SUPABASE_URL' && supabaseKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabase = null;
if (isSupabaseConfigured) {
    supabase = createClient(supabaseUrl, supabaseKey);
}

class AuthManager {
    constructor() {
        this.currentUser = null;
        this.authCallbacks = [];
        this.init();
    }

    async init() {
        if (!isSupabaseConfigured) {
            console.warn('Supabase not configured. Running in demo mode.');
            // In demo mode, check for localStorage session
            const demoUser = localStorage.getItem('demo_auth_user');
            if (demoUser) {
                this.currentUser = JSON.parse(demoUser);
                this.notifyAuthCallbacks('signin', this.currentUser);
            }
            return;
        }

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
            if (!isSupabaseConfigured) {
                // Demo mode: simulate registration
                const demoUser = {
                    id: 'demo_' + Date.now(),
                    email,
                    user_metadata: metadata,
                    created_at: new Date().toISOString()
                };
                
                // Store demo users list
                const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
                
                // Check if email already exists
                if (demoUsers.find(user => user.email === email)) {
                    throw new Error('User already exists');
                }
                
                demoUsers.push(demoUser);
                localStorage.setItem('demo_users', JSON.stringify(demoUsers));
                
                return { success: true, user: demoUser };
            }

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
            if (!isSupabaseConfigured) {
                // Demo mode: simulate login
                const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
                const user = demoUsers.find(user => user.email === email);
                
                if (!user) {
                    throw new Error('Invalid email or password');
                }
                
                // In demo mode, we don't actually verify password
                this.currentUser = user;
                localStorage.setItem('demo_auth_user', JSON.stringify(user));
                this.notifyAuthCallbacks('signin', user);
                
                return { success: true, user };
            }

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
            if (!isSupabaseConfigured) {
                // Demo mode: simulate Google login
                const demoUser = {
                    id: 'demo_google_' + Date.now(),
                    email: 'demo@google.com',
                    user_metadata: { name: 'Demo Google User' },
                    created_at: new Date().toISOString()
                };
                
                this.currentUser = demoUser;
                localStorage.setItem('demo_auth_user', JSON.stringify(demoUser));
                
                // Add to demo users if not exists
                const demoUsers = JSON.parse(localStorage.getItem('demo_users') || '[]');
                if (!demoUsers.find(user => user.email === demoUser.email)) {
                    demoUsers.push(demoUser);
                    localStorage.setItem('demo_users', JSON.stringify(demoUsers));
                }
                
                this.notifyAuthCallbacks('signin', demoUser);
                return { success: true, user: demoUser };
            }

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
            if (!isSupabaseConfigured) {
                // Demo mode: simulate logout
                this.currentUser = null;
                localStorage.removeItem('demo_auth_user');
                this.notifyAuthCallbacks('signout', null);
                return { success: true };
            }

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