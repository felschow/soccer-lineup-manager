// Configuration module for the Soccer Lineup Manager
// Contains player data, position definitions, and game settings

const SoccerConfig = {
    // Player roster with position preferences
    players: {
        'Kennedy': ['Striker', 'Wing', 'Midfield'],
        'Brinley': ['Striker', 'Wing', 'Midfield'],
        'Olivia': ['Back'],
        'Chisom': ['Back'],
        'SK': ['Back', 'Goalkeeper'],
        'Aubree': ['All'],
        'Skyler': ['Midfield', 'Defense'],
        'Jordan': ['All'],
        'Addie': ['All'],
        'Charlotte': ['All except GK'],
        'Isabella': ['All except GK'],
        'Angelicka': ['Midfield', 'Defense']
    },

    // Field positions in tactical order
    positions: [
        'striker', 'left-wing', 'right-wing', 
        'center-mid-left', 'center-mid-right',
        'left-back', 'center-back', 'right-back', 'goalkeeper'
    ],

    // Position mappings for skill checking
    positionSkillMap: {
        'striker': 'Striker',
        'left-wing': 'Wing',
        'right-wing': 'Wing',
        'center-mid-left': 'Midfield',
        'center-mid-right': 'Midfield',
        'left-back': ['Back', 'Defense'],
        'center-back': ['Back', 'Defense'],
        'right-back': ['Back', 'Defense'],
        'goalkeeper': 'Goalkeeper'
    },

    // Position abbreviations for display
    positionAbbreviations: {
        'striker': 'ST',
        'left-wing': 'LW',
        'right-wing': 'RW',
        'center-mid-left': 'CM',
        'center-mid-right': 'CM',
        'left-back': 'LB',
        'center-back': 'CB',
        'right-back': 'RB',
        'goalkeeper': 'GK'
    },

    // Position classes for styling
    positionClasses: {
        'striker': 'striker',
        'left-wing': 'wing',
        'right-wing': 'wing',
        'center-mid-left': 'midfield',
        'center-mid-right': 'midfield',
        'left-back': 'defense',
        'center-back': 'defense',
        'right-back': 'defense',
        'goalkeeper': 'goalkeeper'
    },

    // Game configuration
    gameSettings: {
        totalPeriods: 8,
        periodLength: 7.5, // minutes
        maxPlayersOnField: 9,
        maxPlayersOnBench: 3
    },

    // Goalkeeper rotation configuration
    goalkeeperRotation: [
        { gk: 'Aubree', periods: [1, 2, 3], jersey: 8, restAfter: 4 },
        { gk: 'Jordan', periods: [4, 5, 6], jersey: 3, restAfter: 7 },
        { gk: 'SK', periods: [7, 8], jersey: 6, restAfter: null }
    ],

    // Position priority for auto-fill (most important first)
    positionPriority: [
        'striker', 'center-back', 'left-back', 'right-back',
        'center-mid-left', 'center-mid-right', 'left-wing', 'right-wing'
    ],

    // Utility functions
    utils: {
        // Get position abbreviation
        getPositionAbbrev(position) {
            return SoccerConfig.positionAbbreviations[position] || position;
        },

        // Get position class for styling
        getPositionClass(position) {
            return SoccerConfig.positionClasses[position] || '';
        },

        // Calculate period start/end times
        getPeriodTime(period) {
            const startTime = (period - 1) * SoccerConfig.gameSettings.periodLength;
            const endTime = period * SoccerConfig.gameSettings.periodLength;
            
            const formatTime = (minutes) => {
                const mins = Math.floor(minutes);
                const secs = Math.round((minutes % 1) * 60);
                return `${mins}:${secs.toString().padStart(2, '0')}`;
            };
            
            return {
                start: formatTime(startTime),
                end: formatTime(endTime),
                display: `${formatTime(startTime)} - ${formatTime(endTime)}`
            };
        },

        // Check if player can play position
        canPlayerPlayPosition(playerName, position) {
            const preferences = SoccerConfig.players[playerName];
            if (!preferences) return false;

            if (preferences.includes('All')) return true;
            if (preferences.includes('All except GK') && position !== 'goalkeeper') return true;
            
            const requiredSkills = SoccerConfig.positionSkillMap[position];
            if (Array.isArray(requiredSkills)) {
                return requiredSkills.some(skill => preferences.includes(skill));
            }
            
            return preferences.includes(requiredSkills);
        },

        // Get all player names
        getPlayerNames() {
            return Object.keys(SoccerConfig.players);
        },

        // Get goalkeepers for rotation
        getGoalkeepers() {
            return SoccerConfig.goalkeeperRotation.map(rotation => rotation.gk);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SoccerConfig;
}