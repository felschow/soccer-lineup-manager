// Period Timer Module
// Handles game timing and period transition alerts

const PeriodTimer = {
    // Game timer state
    gameTimer: {
        isRunning: false,
        startTime: null,
        pausedTime: 0,
        currentTime: 0
    },
    
    // Alert tracking per period
    alerts: {},
    
    // Initialize period timer
    init() {
        this.setupGameTimer();
        this.resetAlerts();
    },
    
    // Reset alert states
    resetAlerts() {
        for (let period = 1; period <= SoccerConfig.gameSettings.totalPeriods; period++) {
            this.alerts[period] = {
                threeMinuteAlert: false,
                oneMinuteAlert: false
            };
        }
    },
    
    // Setup game timer functionality
    setupGameTimer() {
        setInterval(() => {
            if (this.gameTimer.isRunning) {
                const now = Date.now();
                this.gameTimer.currentTime = Math.floor((now - this.gameTimer.startTime + this.gameTimer.pausedTime) / 1000);
                this.updateGameTimerDisplay();
                this.checkPeriodAlerts();
            }
        }, 1000);
    },
    
    // Start/Stop game timer
    toggleGameTimer() {
        if (this.gameTimer.isRunning) {
            this.pauseGameTimer();
        } else {
            this.startGameTimer();
        }
    },
    
    startGameTimer() {
        const now = Date.now();
        if (this.gameTimer.startTime === null) {
            this.gameTimer.startTime = now;
        } else {
            // Resuming from pause
            this.gameTimer.startTime = now - this.gameTimer.currentTime * 1000;
        }
        this.gameTimer.isRunning = true;
        this.updateTimerButton();
    },
    
    pauseGameTimer() {
        this.gameTimer.isRunning = false;
        this.updateTimerButton();
    },
    
    resetGameTimer() {
        this.gameTimer.isRunning = false;
        this.gameTimer.startTime = null;
        this.gameTimer.pausedTime = 0;
        this.gameTimer.currentTime = 0;
        this.updateGameTimerDisplay();
        this.updateTimerButton();
        this.resetAlerts();
        this.updateProgressBar();
    },
    
    // Update timer display
    updateGameTimerDisplay() {
        const timerDisplay = document.getElementById('gameTimerDisplay');
        if (timerDisplay) {
            const totalMinutes = Math.floor(this.gameTimer.currentTime / 60);
            const seconds = this.gameTimer.currentTime % 60;
            timerDisplay.textContent = `${totalMinutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
        this.updateProgressBar();
        
        // Update mobile timer display
        if (window.MobileTimerUI) {
            MobileTimerUI.updateMobileTimerDisplay();
        }
    },
    
    // Update progress bar
    updateProgressBar() {
        const progressBar = document.getElementById('periodProgressBar');
        if (!progressBar) return;
        
        const periodLength = SoccerConfig.gameSettings.periodLength * 60; // Convert to seconds
        const currentPeriod = this.getCurrentPeriodFromTime();
        const timeInCurrentPeriod = this.gameTimer.currentTime % periodLength;
        const progress = (timeInCurrentPeriod / periodLength) * 100;
        
        progressBar.style.width = Math.min(progress, 100) + '%';
        
        // Color based on remaining time
        const remainingTime = periodLength - timeInCurrentPeriod;
        if (remainingTime <= 60) { // Last minute
            progressBar.style.backgroundColor = '#ef4444';
        } else if (remainingTime <= 180) { // Last 3 minutes
            progressBar.style.backgroundColor = '#f59e0b';
        } else {
            progressBar.style.backgroundColor = '#10b981';
        }
    },
    
    updateTimerButton() {
        const timerButton = document.getElementById('timerToggleBtn');
        if (timerButton) {
            timerButton.textContent = this.gameTimer.isRunning ? '⏸️ Pause' : '▶️ Start';
            timerButton.classList.toggle('running', this.gameTimer.isRunning);
        }
        
        // Update mobile timer button
        if (window.MobileTimerUI) {
            MobileTimerUI.updateMobileTimerDisplay();
        }
    },
    
    // Get current period based on game time
    getCurrentPeriodFromTime() {
        const periodLength = SoccerConfig.gameSettings.periodLength * 60; // seconds
        const period = Math.floor(this.gameTimer.currentTime / periodLength) + 1;
        return Math.min(period, SoccerConfig.gameSettings.totalPeriods);
    },
    
    // Check for period transition alerts
    checkPeriodAlerts() {
        const periodLength = SoccerConfig.gameSettings.periodLength * 60; // seconds
        const currentPeriod = this.getCurrentPeriodFromTime();
        const timeInCurrentPeriod = this.gameTimer.currentTime % periodLength;
        const remainingTime = periodLength - timeInCurrentPeriod;
        
        // Don't alert for the last period
        if (currentPeriod >= SoccerConfig.gameSettings.totalPeriods) return;
        
        const periodAlerts = this.alerts[currentPeriod];
        if (!periodAlerts) return;
        
        // 3-minute warning
        if (remainingTime <= 180 && !periodAlerts.threeMinuteAlert) {
            this.triggerPeriodAlert(currentPeriod, 3);
            periodAlerts.threeMinuteAlert = true;
        }
        
        // 1-minute warning
        if (remainingTime <= 60 && !periodAlerts.oneMinuteAlert) {
            this.triggerPeriodAlert(currentPeriod, 1);
            periodAlerts.oneMinuteAlert = true;
        }
        
        // Auto-advance to next period when time expires
        if (remainingTime <= 0) {
            this.advanceToNextPeriod();
        }
    },
    
    // Trigger period transition alert
    triggerPeriodAlert(currentPeriod, minutesRemaining) {
        const nextPeriod = currentPeriod + 1;
        const message = `⏰ ${minutesRemaining} minute${minutesRemaining > 1 ? 's' : ''} until Period ${nextPeriod}`;
        
        if (window.ToastManager) {
            ToastManager.warning(message, 8000);
        }
        
        // Play notification sound
        this.playNotificationSound();
        
        // Update next period display
        if (window.PeriodTransitionUI) {
            PeriodTransitionUI.highlightUpcomingChanges();
        }
    },
    
    // Advance to next period automatically
    advanceToNextPeriod() {
        const currentPeriod = LineupManager.getCurrentPeriod();
        const nextPeriod = currentPeriod + 1;
        
        if (nextPeriod <= SoccerConfig.gameSettings.totalPeriods) {
            // Show transition notification
            if (window.ToastManager) {
                ToastManager.success(`⚽ Period ${nextPeriod} Started!`, 5000);
            }
            
            // Advance period in lineup manager
            if (LineupManager.nextPeriod()) {
                if (window.UIManager) {
                    UIManager.updateDisplay();
                }
            }
            
            this.playNotificationSound();
        } else {
            // Game ended
            this.gameTimer.isRunning = false;
            this.updateTimerButton();
            
            if (window.ToastManager) {
                ToastManager.success('🏁 Game Finished!', 10000);
            }
        }
    },
    
    // Play notification sound
    playNotificationSound() {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
            oscillator.frequency.setValueAtTime(600, audioContext.currentTime + 0.1);
            
            gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
            
            oscillator.start(audioContext.currentTime);
            oscillator.stop(audioContext.currentTime + 0.5);
        } catch (error) {
            console.log('Audio notification not supported');
        }
    },
    
    // Get remaining time in current period
    getRemainingTimeInPeriod() {
        const periodLength = SoccerConfig.gameSettings.periodLength * 60;
        const timeInCurrentPeriod = this.gameTimer.currentTime % periodLength;
        return Math.max(0, periodLength - timeInCurrentPeriod);
    },
    
    // Format time for display
    formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PeriodTimer;
}