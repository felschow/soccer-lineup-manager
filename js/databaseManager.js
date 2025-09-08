// Database Manager for User-Specific Data Storage
// Replaces localStorage with cloud storage and user isolation

import authManager from './auth.js';

class DatabaseManager {
    constructor() {
        this.supabase = null; // Will be initialized with same instance as auth
        this.userId = null;
        this.init();
    }

    init() {
        // Import supabase from auth module to maintain single instance
        import('./auth.js').then(({ supabase }) => {
            this.supabase = supabase;
        });

        // Listen for auth changes to update userId
        authManager.onAuthStateChange((event, user) => {
            this.userId = user?.id || null;
        });
    }

    // Ensure user is authenticated before operations
    checkAuth() {
        if (!this.userId) {
            throw new Error('User must be authenticated to perform this operation');
        }
    }

    // **TEAMS MANAGEMENT**
    async getTeams() {
        this.checkAuth();
        try {
            const { data, error } = await this.supabase
                .from('teams')
                .select('*')
                .eq('coach_id', this.userId)
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching teams:', error);
            return [];
        }
    }

    async createTeam(teamData) {
        this.checkAuth();
        try {
            const team = {
                ...teamData,
                coach_id: this.userId,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('teams')
                .insert([team])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, team: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateTeam(teamId, teamData) {
        this.checkAuth();
        try {
            const { data, error } = await this.supabase
                .from('teams')
                .update(teamData)
                .eq('id', teamId)
                .eq('coach_id', this.userId) // Ensure user owns this team
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, team: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async deleteTeam(teamId) {
        this.checkAuth();
        try {
            const { error } = await this.supabase
                .from('teams')
                .delete()
                .eq('id', teamId)
                .eq('coach_id', this.userId); // Ensure user owns this team
            
            if (error) throw error;
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // **GAMES MANAGEMENT**
    async getGames(teamId) {
        this.checkAuth();
        try {
            const { data, error } = await this.supabase
                .from('games')
                .select(`
                    *,
                    teams!inner(id, name, coach_id)
                `)
                .eq('team_id', teamId)
                .eq('teams.coach_id', this.userId) // Ensure user owns the team
                .order('created_at', { ascending: false });
            
            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching games:', error);
            return [];
        }
    }

    async createGame(gameData) {
        this.checkAuth();
        try {
            // Verify team ownership
            const { data: team } = await this.supabase
                .from('teams')
                .select('coach_id')
                .eq('id', gameData.team_id)
                .single();

            if (team?.coach_id !== this.userId) {
                throw new Error('Unauthorized: Team does not belong to user');
            }

            const game = {
                ...gameData,
                created_at: new Date().toISOString()
            };

            const { data, error } = await this.supabase
                .from('games')
                .insert([game])
                .select()
                .single();
            
            if (error) throw error;
            return { success: true, game: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    async updateGame(gameId, gameData) {
        this.checkAuth();
        try {
            const { data, error } = await this.supabase
                .from('games')
                .update(gameData)
                .eq('id', gameId)
                .select(`
                    *,
                    teams!inner(coach_id)
                `)
                .single();
            
            if (error) throw error;
            
            // Check ownership
            if (data.teams.coach_id !== this.userId) {
                throw new Error('Unauthorized: Game does not belong to user');
            }
            
            return { success: true, game: data };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }

    // **MIGRATION FROM LOCAL STORAGE**
    async migrateFromLocalStorage() {
        if (!authManager.isAuthenticated()) {
            throw new Error('User must be authenticated to migrate data');
        }

        try {
            // Get existing local storage data
            const localTeams = JSON.parse(localStorage.getItem('soccer_lineup_teams') || '[]');
            const localGames = JSON.parse(localStorage.getItem('soccer_lineup_games') || '[]');

            const migrationResults = {
                teams: [],
                games: [],
                errors: []
            };

            // Migrate teams
            for (const team of localTeams) {
                const result = await this.createTeam({
                    name: team.name,
                    logo_url: team.logo,
                    players: team.players,
                    player_count: team.gameSettings?.playerCount || 11,
                    formation: team.gameSettings?.formation || 'default',
                    settings: team.gameSettings || {}
                });

                if (result.success) {
                    migrationResults.teams.push(result.team);
                } else {
                    migrationResults.errors.push(`Team ${team.name}: ${result.error}`);
                }
            }

            // Migrate games
            for (const game of localGames) {
                // Find corresponding migrated team
                const migratedTeam = migrationResults.teams.find(t => 
                    t.name === game.teamName
                );

                if (migratedTeam) {
                    const result = await this.createGame({
                        team_id: migratedTeam.id,
                        lineup_data: game.lineups || {},
                        status: game.status || 'active',
                        settings: game.settings || {}
                    });

                    if (result.success) {
                        migrationResults.games.push(result.game);
                    } else {
                        migrationResults.errors.push(`Game: ${result.error}`);
                    }
                }
            }

            return migrationResults;
        } catch (error) {
            throw new Error(`Migration failed: ${error.message}`);
        }
    }

    // **LOCAL BACKUP** (for offline usage)
    async syncToLocal() {
        if (!this.userId) return;
        
        try {
            const teams = await this.getTeams();
            localStorage.setItem(`backup_teams_${this.userId}`, JSON.stringify(teams));
        } catch (error) {
            console.warn('Failed to sync teams to local storage:', error);
        }
    }
}

// Export singleton instance
const databaseManager = new DatabaseManager();
export default databaseManager;