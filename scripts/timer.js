// Session Timer Management
class SessionTimer {
    constructor() {
        this.duration = 0;
        this.remainingTime = 0;
        this.isActive = false;
        this.isPaused = false;
        this.startTime = null;
        this.endTime = null;
        this.interval = null;
        this.audioContext = null;
        this.init();
    }

    init() {
        this.initializeAudioContext();
        this.updateTimerDisplay();
    }

    initializeAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported:', error);
        }
    }

    start(duration) {
        this.duration = duration * 60; // Convert to seconds
        this.remainingTime = this.duration;
        this.isActive = true;
        this.isPaused = false;
        this.startTime = new Date();
        this.endTime = new Date(this.startTime.getTime() + (this.duration * 1000));

        // Start the countdown
        this.startCountdown();

        // Update UI
        this.updateTimerDisplay();
        this.updateSessionTimer();

        app.showToast(`Study session started! Duration: ${duration} minutes`, 'success');
    }

    startCountdown() {
        this.stopCountdown(); // Clear any existing interval
        
        this.interval = setInterval(() => {
            if (!this.isActive || this.isPaused) return;

            this.remainingTime--;

            // Update displays
            this.updateTimerDisplay();
            this.updateSessionTimer();

            // Check for notifications
            this.checkTimeNotifications();

            // Check if session is complete
            if (this.remainingTime <= 0) {
                this.complete();
            }
        }, 1000);
    }

    stopCountdown() {
        if (this.interval) {
            clearInterval(this.interval);
            this.interval = null;
        }
    }

    pause() {
        if (this.isActive && !this.isPaused) {
            this.isPaused = true;
            this.stopCountdown();
            app.showToast('Session paused', 'info');
        }
    }

    resume() {
        if (this.isActive && this.isPaused) {
            this.isPaused = false;
            this.startCountdown();
            app.showToast('Session resumed', 'info');
        }
    }

    stop() {
        this.isActive = false;
        this.isPaused = false;
        this.stopCountdown();
        this.updateTimerDisplay();
        this.updateSessionTimer();
        app.showToast('Session stopped', 'info');
    }

    complete() {
        this.isActive = false;
        this.isPaused = false;
        this.remainingTime = 0;
        this.stopCountdown();

        // Play completion sound
        this.playNotificationSound('complete');

        // Show goal assessment modal
        if (window.videoManager) {
            videoManager.showGoalAssessment();
        }

        // Update displays
        this.updateTimerDisplay();
        this.updateSessionTimer();

        app.showToast('Study session completed! Time to assess your progress.', 'success');
    }

    checkTimeNotifications() {
        // Notify at 25%, 50%, 75% completion
        const progress = (this.duration - this.remainingTime) / this.duration;
        
        // Notify at 50% (halfway point)
        if (progress >= 0.5 && !this.halfwayNotified) {
            this.halfwayNotified = true;
            this.playNotificationSound('halfway');
            app.showToast('Halfway point reached! Keep going!', 'info');
        }

        // Notify at 10 minutes remaining (if session is longer than 20 minutes)
        if (this.duration > 1200 && this.remainingTime === 600 && !this.tenMinNotified) {
            this.tenMinNotified = true;
            this.playNotificationSound('warning');
            app.showToast('10 minutes remaining!', 'warning');
        }

        // Notify at 5 minutes remaining
        if (this.remainingTime === 300 && !this.fiveMinNotified) {
            this.fiveMinNotified = true;
            this.playNotificationSound('warning');
            app.showToast('5 minutes remaining!', 'warning');
        }

        // Notify at 1 minute remaining
        if (this.remainingTime === 60 && !this.oneMinNotified) {
            this.oneMinNotified = true;
            this.playNotificationSound('warning');
            app.showToast('1 minute remaining!', 'warning');
        }
    }

    playNotificationSound(type) {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Different sounds for different notifications
            switch (type) {
                case 'complete':
                    // Three ascending tones
                    this.playTone(523, 0.2); // C5
                    setTimeout(() => this.playTone(659, 0.2), 300); // E5
                    setTimeout(() => this.playTone(784, 0.4), 600); // G5
                    break;
                    
                case 'halfway':
                    // Two medium tones
                    this.playTone(440, 0.3); // A4
                    setTimeout(() => this.playTone(554, 0.3), 400); // C#5
                    break;
                    
                case 'warning':
                    // Single low tone
                    this.playTone(330, 0.5); // E4
                    break;
                    
                default:
                    // Default notification
                    this.playTone(440, 0.2);
            }
        } catch (error) {
            console.warn('Error playing notification sound:', error);
        }
    }

    playTone(frequency, duration) {
        if (!this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
            oscillator.type = 'sine';

            gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.1, this.audioContext.currentTime + 0.01);
            gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + duration);

            oscillator.start(this.audioContext.currentTime);
            oscillator.stop(this.audioContext.currentTime + duration);
        } catch (error) {
            console.warn('Error playing tone:', error);
        }
    }

    updateTimerDisplay() {
        const timerElement = document.getElementById('sessionTimer');
        if (timerElement) {
            if (this.isActive) {
                timerElement.textContent = this.formatTime(this.remainingTime);
                timerElement.className = this.getTimerClass();
            } else {
                timerElement.textContent = '00:00';
                timerElement.className = 'timer-inactive';
            }
        }
    }

    updateSessionTimer() {
        // Update any other timer displays in the session
        const allTimerElements = document.querySelectorAll('.session-timer');
        allTimerElements.forEach(element => {
            if (this.isActive) {
                element.textContent = this.formatTime(this.remainingTime);
            } else {
                element.textContent = '00:00';
            }
        });
    }

    formatTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = seconds % 60;

        if (hours > 0) {
            return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        } else {
            return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
        }
    }

    getTimerClass() {
        if (this.remainingTime <= 60) {
            return 'timer-warning'; // Red
        } else if (this.remainingTime <= 300) {
            return 'timer-caution'; // Yellow
        } else {
            return 'timer-normal'; // Green
        }
    }

    // Progress tracking
    getProgress() {
        if (!this.isActive || this.duration === 0) return 0;
        return ((this.duration - this.remainingTime) / this.duration) * 100;
    }

    getElapsedTime() {
        if (!this.startTime) return 0;
        const now = new Date();
        return Math.floor((now - this.startTime) / 1000);
    }

    getRemainingTime() {
        return this.remainingTime;
    }

    // Statistics
    getSessionStats() {
        return {
            duration: this.duration,
            elapsed: this.getElapsedTime(),
            remaining: this.remainingTime,
            progress: this.getProgress(),
            isActive: this.isActive,
            isPaused: this.isPaused
        };
    }

    // Reset notification flags
    resetNotifications() {
        this.halfwayNotified = false;
        this.tenMinNotified = false;
        this.fiveMinNotified = false;
        this.oneMinNotified = false;
    }

    // Cleanup
    destroy() {
        this.stopCountdown();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}

// Timer utilities and helpers
class TimerUtils {
    static formatDuration(minutes) {
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        
        if (hours > 0) {
            return `${hours}h ${mins}m`;
        } else {
            return `${mins}m`;
        }
    }

    static parseDuration(timeString) {
        // Parse time strings like "25", "1:30", "2h 15m"
        const timeString = timeString.toLowerCase().trim();
        
        // Handle "Xh Ym" format
        const hMatch = timeString.match(/(\d+)h/);
        const mMatch = timeString.match(/(\d+)m/);
        
        if (hMatch && mMatch) {
            return parseInt(hMatch[1]) * 60 + parseInt(mMatch[1]);
        }
        
        // Handle "X:Y" format
        if (timeString.includes(':')) {
            const [hours, minutes] = timeString.split(':').map(Number);
            return hours * 60 + minutes;
        }
        
        // Handle just minutes
        const numMatch = timeString.match(/^\d+$/);
        if (numMatch) {
            return parseInt(numMatch[0]);
        }
        
        return null;
    }

    static getSuggestedDurations() {
        return [
            { value: 25, label: 'Pomodoro (25 min)', description: 'Short focused session' },
            { value: 45, label: 'Standard (45 min)', description: 'Balanced study time' },
            { value: 50, label: 'Deep Focus (50 min)', description: 'Extended concentration' },
            { value: 90, label: 'Extended (90 min)', description: 'Long study block' },
            { value: 120, label: 'Marathon (2 hours)', description: 'Maximum focus' }
        ];
    }

    static calculateBreakTime(studyTime) {
        // Pomodoro technique: 5min break for every 25min study
        const pomodoros = Math.floor(studyTime / 25);
        return Math.max(5, pomodoros * 5);
    }
}

// Initialize global session timer
const sessionTimer = new SessionTimer();

// Export for global access
window.sessionTimer = sessionTimer;
window.TimerUtils = TimerUtils;