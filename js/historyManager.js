// History Manager for Undo/Redo functionality
// Tracks lineup changes and allows reverting to previous states

const HistoryManager = {
    history: [],
    currentIndex: -1,
    maxHistorySize: 50,
    
    // Initialize history manager
    init() {
        this.saveInitialState();
        this.setupHistoryControls();
        console.log('History Manager initialized');
    },

    // Save the initial state
    saveInitialState() {
        const initialState = this.captureCurrentState('Initial state');
        this.history = [initialState];
        this.currentIndex = 0;
        this.updateHistoryControls();
    },

    // Capture current lineup state
    captureCurrentState(actionDescription) {
        return {
            timestamp: Date.now(),
            action: actionDescription,
            state: {
                currentPeriod: LineupManager.getCurrentPeriod(),
                lineup: JSON.parse(JSON.stringify(LineupManager.getFullLineup()))
            }
        };
    },

    // Save state after an action
    saveState(actionDescription) {
        // Remove any future history if we're not at the end
        if (this.currentIndex < this.history.length - 1) {
            this.history = this.history.slice(0, this.currentIndex + 1);
        }

        // Add new state
        const newState = this.captureCurrentState(actionDescription);
        this.history.push(newState);

        // Maintain max history size
        if (this.history.length > this.maxHistorySize) {
            this.history.shift();
        } else {
            this.currentIndex++;
        }

        this.updateHistoryControls();
        console.log(`History: Saved state "${actionDescription}"`);
    },

    // Undo last action
    undo() {
        if (!this.canUndo()) return false;

        this.currentIndex--;
        const previousState = this.history[this.currentIndex];
        this.restoreState(previousState);
        
        ToastManager.info(`Undid: ${previousState.action}`, 3000);
        this.showActionFeedback(`↶ Undid: ${previousState.action}`);
        this.updateHistoryControls();
        
        return true;
    },

    // Redo next action
    redo() {
        if (!this.canRedo()) return false;

        this.currentIndex++;
        const nextState = this.history[this.currentIndex];
        this.restoreState(nextState);
        
        ToastManager.info(`Redid: ${nextState.action}`, 3000);
        this.showActionFeedback(`↷ Redid: ${nextState.action}`);
        this.updateHistoryControls();
        
        return true;
    },

    // Check if undo is possible
    canUndo() {
        return this.currentIndex > 0;
    },

    // Check if redo is possible
    canRedo() {
        return this.currentIndex < this.history.length - 1;
    },

    // Restore a specific state
    restoreState(historyState) {
        // Temporarily disable state saving to avoid circular saves
        this.isRestoring = true;
        
        try {
            LineupManager.importState(historyState.state);
            UIManager.updateDisplay();
        } catch (error) {
            console.error('Failed to restore state:', error);
            ToastManager.error('Failed to restore previous state');
        } finally {
            this.isRestoring = false;
        }
    },

    // Setup history control buttons in the UI
    setupHistoryControls() {
        const periodNav = document.querySelector('.period-nav');
        if (!periodNav) return;

        // Create history controls container
        const historyControls = document.createElement('div');
        historyControls.className = 'history-controls';
        
        // Undo button
        const undoBtn = document.createElement('button');
        undoBtn.id = 'undoBtn';
        undoBtn.className = 'history-btn';
        undoBtn.innerHTML = '↶ Undo';
        undoBtn.onclick = () => this.undo();
        
        // Redo button
        const redoBtn = document.createElement('button');
        redoBtn.id = 'redoBtn';
        redoBtn.className = 'history-btn';
        redoBtn.innerHTML = '↷ Redo';
        redoBtn.onclick = () => this.redo();
        
        historyControls.appendChild(undoBtn);
        historyControls.appendChild(redoBtn);
        periodNav.appendChild(historyControls);

        // Add keyboard shortcuts
        this.setupKeyboardShortcuts();
    },

    // Setup keyboard shortcuts for undo/redo
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Z or Cmd+Z for undo
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.undo();
            }
            
            // Ctrl+Y or Ctrl+Shift+Z or Cmd+Shift+Z for redo
            if (((e.ctrlKey || e.metaKey) && e.key === 'y') ||
                ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'z')) {
                e.preventDefault();
                this.redo();
            }
        });
    },

    // Update history control button states
    updateHistoryControls() {
        const undoBtn = document.getElementById('undoBtn');
        const redoBtn = document.getElementById('redoBtn');
        
        if (undoBtn) {
            undoBtn.disabled = !this.canUndo();
            undoBtn.title = this.canUndo() ? 
                `Undo: ${this.history[this.currentIndex - 1]?.action || 'Previous action'}` : 
                'Nothing to undo';
        }
        
        if (redoBtn) {
            redoBtn.disabled = !this.canRedo();
            redoBtn.title = this.canRedo() ? 
                `Redo: ${this.history[this.currentIndex + 1]?.action || 'Next action'}` : 
                'Nothing to redo';
        }
    },

    // Show temporary action feedback
    showActionFeedback(message) {
        let feedbackEl = document.getElementById('actionFeedback');
        
        if (!feedbackEl) {
            feedbackEl = document.createElement('div');
            feedbackEl.id = 'actionFeedback';
            feedbackEl.className = 'action-feedback';
            document.body.appendChild(feedbackEl);
        }
        
        feedbackEl.textContent = message;
        feedbackEl.classList.add('show');
        
        setTimeout(() => {
            feedbackEl.classList.remove('show');
        }, 1500);
    },

    // Get history summary for debugging
    getHistorySummary() {
        return {
            totalStates: this.history.length,
            currentIndex: this.currentIndex,
            canUndo: this.canUndo(),
            canRedo: this.canRedo(),
            currentAction: this.history[this.currentIndex]?.action,
            recentActions: this.history.slice(-5).map(h => h.action)
        };
    },

    // Clear history (useful for testing or reset)
    clearHistory() {
        this.history = [];
        this.currentIndex = -1;
        this.saveInitialState();
    },

    // Export history for debugging/analysis
    exportHistory() {
        const exportData = {
            metadata: {
                exportDate: new Date().toISOString(),
                totalActions: this.history.length,
                currentIndex: this.currentIndex
            },
            history: this.history.map(state => ({
                timestamp: state.timestamp,
                action: state.action,
                period: state.state.currentPeriod,
                // Don't export full lineup data to keep size manageable
                hasLineupData: !!state.state.lineup
            }))
        };
        
        return JSON.stringify(exportData, null, 2);
    },

    // Smart action grouping for related actions
    groupActions: {
        timeout: null,
        pendingAction: null,
        
        // Group rapid sequential actions
        saveGroupedAction(actionDescription) {
            clearTimeout(this.timeout);
            
            // If it's the same type of action within 2 seconds, group it
            if (this.pendingAction && 
                this.areSimilarActions(this.pendingAction, actionDescription)) {
                
                this.pendingAction = actionDescription;
                this.timeout = setTimeout(() => {
                    HistoryManager.saveState(this.pendingAction);
                    this.pendingAction = null;
                }, 2000);
            } else {
                // Different action, save previous and start new
                if (this.pendingAction) {
                    HistoryManager.saveState(this.pendingAction);
                }
                this.pendingAction = actionDescription;
                this.timeout = setTimeout(() => {
                    HistoryManager.saveState(this.pendingAction);
                    this.pendingAction = null;
                }, 2000);
            }
        },
        
        areSimilarActions(action1, action2) {
            // Simple grouping logic - can be enhanced
            const keywords1 = action1.toLowerCase().split(' ');
            const keywords2 = action2.toLowerCase().split(' ');
            
            // Check if they share common action words
            const commonWords = ['assign', 'move', 'bench', 'jersey'];
            const hasCommonAction = commonWords.some(word => 
                keywords1.includes(word) && keywords2.includes(word)
            );
            
            return hasCommonAction;
        }
    }
};

// Enhanced LineupManager integration with history tracking
(function() {
    // Store original methods
    const originalMethods = {
        assignPlayerToPosition: LineupManager.assignPlayerToPosition,
        addPlayerToBench: LineupManager.addPlayerToBench,
        addPlayerToJersey: LineupManager.addPlayerToJersey,
        removePlayerFromAll: LineupManager.removePlayerFromAll,
        clearCurrentPeriod: LineupManager.clearCurrentPeriod,
        clearAllPeriods: LineupManager.clearAllPeriods,
        setCurrentPeriod: LineupManager.setCurrentPeriod
    };

    // Wrap methods with history tracking
    LineupManager.assignPlayerToPosition = function(playerName, position) {
        const result = originalMethods.assignPlayerToPosition.call(this, playerName, position);
        
        if (result && !HistoryManager.isRestoring) {
            const positionName = SoccerConfig.utils.getPositionAbbrev(position);
            HistoryManager.saveState(`Assigned ${playerName} to ${positionName}`);
        }
        
        return result;
    };

    LineupManager.addPlayerToBench = function(playerName) {
        originalMethods.addPlayerToBench.call(this, playerName);
        
        if (!HistoryManager.isRestoring) {
            HistoryManager.saveState(`Moved ${playerName} to bench`);
        }
    };

    LineupManager.addPlayerToJersey = function(playerName) {
        originalMethods.addPlayerToJersey.call(this, playerName);
        
        if (!HistoryManager.isRestoring) {
            HistoryManager.saveState(`Moved ${playerName} to jersey prep`);
        }
    };

    LineupManager.removePlayerFromAll = function(playerName) {
        originalMethods.removePlayerFromAll.call(this, playerName);
        
        if (!HistoryManager.isRestoring) {
            HistoryManager.saveState(`Removed ${playerName} from lineup`);
        }
    };

    LineupManager.clearCurrentPeriod = function() {
        const period = this.getCurrentPeriod();
        originalMethods.clearCurrentPeriod.call(this);
        
        if (!HistoryManager.isRestoring) {
            HistoryManager.saveState(`Cleared Period ${period}`);
        }
    };

    LineupManager.clearAllPeriods = function() {
        originalMethods.clearAllPeriods.call(this);
        
        if (!HistoryManager.isRestoring) {
            HistoryManager.saveState('Cleared all periods');
        }
    };

    LineupManager.setCurrentPeriod = function(period) {
        const oldPeriod = this.getCurrentPeriod();
        const result = originalMethods.setCurrentPeriod.call(this, period);
        
        if (result && !HistoryManager.isRestoring) {
            HistoryManager.saveState(`Switched from Period ${oldPeriod} to Period ${period}`);
        }
        
        return result;
    };
})();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = HistoryManager;
}