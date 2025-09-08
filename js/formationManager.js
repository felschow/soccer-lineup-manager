// Formation Manager - Provides formations for different player counts
// Maintains 3 common formations per player count as requested

class FormationManager {
    constructor() {
        this.formations = this.initializeFormations();
    }

    initializeFormations() {
        return {
            4: [ // 4v4 formations
                {
                    id: '4v4-1-2-1',
                    name: '1-2-1',
                    description: 'Balanced formation with diamond shape',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender: { x: 30, y: 50, required: true },
                        midfielder_left: { x: 50, y: 30, required: true },
                        midfielder_right: { x: 50, y: 70, required: true }
                    }
                },
                {
                    id: '4v4-2-1-1',
                    name: '2-1-1', 
                    description: 'Strong defensive formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 30, y: 35, required: true },
                        defender_right: { x: 30, y: 65, required: true },
                        forward: { x: 70, y: 50, required: true }
                    }
                },
                {
                    id: '4v4-1-1-2',
                    name: '1-1-2',
                    description: 'Attacking formation with two forwards',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender: { x: 30, y: 50, required: true },
                        midfielder: { x: 50, y: 50, required: true },
                        forward: { x: 70, y: 40, required: true }
                    }
                }
            ],
            7: [ // 7v7 formations
                {
                    id: '7v7-2-3-1',
                    name: '2-3-1',
                    description: 'Classic 7v7 formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 25, required: true },
                        defender_right: { x: 25, y: 75, required: true },
                        midfielder_left: { x: 45, y: 20, required: true },
                        midfielder_center: { x: 45, y: 50, required: true },
                        midfielder_right: { x: 45, y: 80, required: true },
                        forward: { x: 70, y: 50, required: true }
                    }
                },
                {
                    id: '7v7-3-2-1',
                    name: '3-2-1',
                    description: 'Strong defensive setup',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 20, required: true },
                        defender_center: { x: 25, y: 50, required: true },
                        defender_right: { x: 25, y: 80, required: true },
                        midfielder_left: { x: 50, y: 35, required: true },
                        midfielder_right: { x: 50, y: 65, required: true },
                        forward: { x: 75, y: 50, required: true }
                    }
                },
                {
                    id: '7v7-2-2-2',
                    name: '2-2-2',
                    description: 'Balanced attacking formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 30, required: true },
                        defender_right: { x: 25, y: 70, required: true },
                        midfielder_left: { x: 45, y: 30, required: true },
                        midfielder_right: { x: 45, y: 70, required: true },
                        forward_left: { x: 70, y: 35, required: true },
                        forward_right: { x: 70, y: 65, required: true }
                    }
                }
            ],
            9: [ // 9v9 formations
                {
                    id: '9v9-3-3-2',
                    name: '3-3-2',
                    description: 'Standard 9v9 formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 20, required: true },
                        defender_center: { x: 25, y: 50, required: true },
                        defender_right: { x: 25, y: 80, required: true },
                        midfielder_left: { x: 45, y: 25, required: true },
                        midfielder_center: { x: 45, y: 50, required: true },
                        midfielder_right: { x: 45, y: 75, required: true },
                        forward_left: { x: 70, y: 35, required: true },
                        forward_right: { x: 70, y: 65, required: true }
                    }
                },
                {
                    id: '9v9-4-3-1',
                    name: '4-3-1',
                    description: 'Defensive formation with wide backs',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 15, required: true },
                        defender_center_left: { x: 25, y: 40, required: true },
                        defender_center_right: { x: 25, y: 60, required: true },
                        defender_right: { x: 25, y: 85, required: true },
                        midfielder_left: { x: 50, y: 30, required: true },
                        midfielder_center: { x: 50, y: 50, required: true },
                        midfielder_right: { x: 50, y: 70, required: true },
                        forward: { x: 75, y: 50, required: true }
                    }
                },
                {
                    id: '9v9-3-2-3',
                    name: '3-2-3',
                    description: 'Attacking formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 25, required: true },
                        defender_center: { x: 25, y: 50, required: true },
                        defender_right: { x: 25, y: 75, required: true },
                        midfielder_left: { x: 45, y: 35, required: true },
                        midfielder_right: { x: 45, y: 65, required: true },
                        forward_left: { x: 70, y: 25, required: true },
                        forward_center: { x: 70, y: 50, required: true },
                        forward_right: { x: 70, y: 75, required: true }
                    }
                }
            ],
            11: [ // 11v11 formations
                {
                    id: '11v11-4-4-2',
                    name: '4-4-2',
                    description: 'Classic football formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 15, required: true },
                        defender_center_left: { x: 25, y: 40, required: true },
                        defender_center_right: { x: 25, y: 60, required: true },
                        defender_right: { x: 25, y: 85, required: true },
                        midfielder_left: { x: 45, y: 15, required: true },
                        midfielder_center_left: { x: 45, y: 40, required: true },
                        midfielder_center_right: { x: 45, y: 60, required: true },
                        midfielder_right: { x: 45, y: 85, required: true },
                        forward_left: { x: 70, y: 35, required: true },
                        forward_right: { x: 70, y: 65, required: true }
                    }
                },
                {
                    id: '11v11-4-3-3',
                    name: '4-3-3',
                    description: 'Modern attacking formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 15, required: true },
                        defender_center_left: { x: 25, y: 40, required: true },
                        defender_center_right: { x: 25, y: 60, required: true },
                        defender_right: { x: 25, y: 85, required: true },
                        midfielder_left: { x: 45, y: 30, required: true },
                        midfielder_center: { x: 45, y: 50, required: true },
                        midfielder_right: { x: 45, y: 70, required: true },
                        forward_left: { x: 70, y: 20, required: true },
                        forward_center: { x: 70, y: 50, required: true },
                        forward_right: { x: 70, y: 80, required: true }
                    }
                },
                {
                    id: '11v11-3-5-2',
                    name: '3-5-2',
                    description: 'Wing-back formation',
                    positions: {
                        goalkeeper: { x: 10, y: 50, required: true },
                        defender_left: { x: 25, y: 25, required: true },
                        defender_center: { x: 25, y: 50, required: true },
                        defender_right: { x: 25, y: 75, required: true },
                        midfielder_left: { x: 45, y: 10, required: true },
                        midfielder_center_left: { x: 45, y: 35, required: true },
                        midfielder_center: { x: 45, y: 50, required: true },
                        midfielder_center_right: { x: 45, y: 65, required: true },
                        midfielder_right: { x: 45, y: 90, required: true },
                        forward_left: { x: 70, y: 40, required: true },
                        forward_right: { x: 70, y: 60, required: true }
                    }
                }
            ]
        };
    }

    // Get formations for a specific player count
    getFormationsForPlayerCount(playerCount) {
        return this.formations[playerCount] || [];
    }

    // Get a specific formation by ID
    getFormation(formationId) {
        for (const playerCount in this.formations) {
            const formation = this.formations[playerCount].find(f => f.id === formationId);
            if (formation) return formation;
        }
        return null;
    }

    // Map formation positions to field positions
    mapFormationToField(formation, fieldWidth = 100, fieldHeight = 100) {
        const mappedPositions = {};
        
        for (const [positionId, position] of Object.entries(formation.positions)) {
            mappedPositions[positionId] = {
                ...position,
                // Convert percentage positions to actual field coordinates
                fieldX: (position.x / 100) * fieldWidth,
                fieldY: (position.y / 100) * fieldHeight,
                // Map to position categories for player preferences
                category: this.getPositionCategory(positionId)
            };
        }
        
        return mappedPositions;
    }

    // Categorize positions for player preferences
    getPositionCategory(positionId) {
        if (positionId.includes('goalkeeper')) return 'Goalkeeper';
        if (positionId.includes('defender') || positionId.includes('back')) return 'Back';
        if (positionId.includes('midfielder') || positionId.includes('mid')) return 'Midfield';
        if (positionId.includes('forward') || positionId.includes('striker') || positionId.includes('wing')) return 'Forward';
        return 'Unknown';
    }

    // Validate formation against available players
    validateFormation(formation, availablePlayers, playerPreferences) {
        const issues = [];
        const positionCategories = {};
        
        // Count required positions by category
        for (const [positionId, position] of Object.entries(formation.positions)) {
            const category = this.getPositionCategory(positionId);
            positionCategories[category] = (positionCategories[category] || 0) + 1;
        }
        
        // Check if we have enough players for each category
        for (const [category, requiredCount] of Object.entries(positionCategories)) {
            const availableInCategory = availablePlayers.filter(player => 
                playerPreferences[player]?.includes(category)
            ).length;
            
            if (availableInCategory < requiredCount) {
                issues.push({
                    type: 'insufficient_players',
                    category,
                    required: requiredCount,
                    available: availableInCategory,
                    message: `Need ${requiredCount} ${category} players but only ${availableInCategory} available`
                });
            }
        }
        
        return {
            valid: issues.length === 0,
            issues
        };
    }

    // Generate position assignments based on formation and player preferences
    generateOptimalAssignment(formation, availablePlayers, playerPreferences) {
        const assignments = {};
        const usedPlayers = new Set();
        const positionQueue = Object.entries(formation.positions).slice(); // Copy array
        
        // Sort positions by specificity (goalkeeper first, then by category rarity)
        positionQueue.sort((a, b) => {
            const catA = this.getPositionCategory(a[0]);
            const catB = this.getPositionCategory(b[0]);
            
            if (catA === 'Goalkeeper') return -1;
            if (catB === 'Goalkeeper') return 1;
            
            // Assign rarer positions first
            const availableA = availablePlayers.filter(p => 
                !usedPlayers.has(p) && playerPreferences[p]?.includes(catA)
            ).length;
            const availableB = availablePlayers.filter(p => 
                !usedPlayers.has(p) && playerPreferences[p]?.includes(catB)
            ).length;
            
            return availableA - availableB;
        });
        
        // Assign players to positions
        for (const [positionId, position] of positionQueue) {
            const category = this.getPositionCategory(positionId);
            const eligiblePlayers = availablePlayers.filter(player => 
                !usedPlayers.has(player) && 
                playerPreferences[player]?.includes(category)
            );
            
            if (eligiblePlayers.length > 0) {
                // For now, assign first available. Could implement more sophisticated logic
                const assignedPlayer = eligiblePlayers[0];
                assignments[positionId] = assignedPlayer;
                usedPlayers.add(assignedPlayer);
            } else {
                // Try to assign any available player (soft warning)
                const anyAvailable = availablePlayers.filter(player => 
                    !usedPlayers.has(player)
                );
                
                if (anyAvailable.length > 0) {
                    assignments[positionId] = anyAvailable[0];
                    usedPlayers.add(anyAvailable[0]);
                }
            }
        }
        
        return {
            assignments,
            unassignedPlayers: availablePlayers.filter(player => !usedPlayers.has(player))
        };
    }

    // Get formation preview for UI
    getFormationPreview(formationId, width = 300, height = 200) {
        const formation = this.getFormation(formationId);
        if (!formation) return null;
        
        const positions = this.mapFormationToField(formation, width, height);
        return {
            ...formation,
            positions,
            preview: {
                width,
                height,
                positions: Object.entries(positions).map(([id, pos]) => ({
                    id,
                    x: pos.fieldX,
                    y: pos.fieldY,
                    category: pos.category,
                    label: id.split('_')[0].toUpperCase()
                }))
            }
        };
    }
}

// Export singleton instance
const formationManager = new FormationManager();
export default formationManager;