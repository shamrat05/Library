// Main Application Controller
class VirtualLibraryApp {
    constructor() {
        this.currentPage = 'home';
        this.init();
    }

    init() {
        this.initNavigation();
        this.initEventListeners();
        this.updatePageVisibility();
        this.loadDashboardData();
    }

    initNavigation() {
        // Handle navigation links with event delegation
        document.addEventListener('click', (e) => {
            const link = e.target.closest('[data-page]');
            if (link) {
                e.preventDefault();
                let page = link.dataset.page;
                
                // Handle "Get Started" button logic
                if (page === 'signup' && authManager.isLoggedIn()) {
                    page = 'dashboard'; // Redirect to dashboard if already logged in
                }
                
                console.log('Navigation link clicked:', page);
                this.navigateToPage(page);
            }
        });

        // Handle room code modal events
        this.initRoomCodeModal();
    }

    initEventListeners() {
        // Handle window resize for responsive video grid
        window.addEventListener('resize', () => {
            this.adjustVideoGrid();
        });

        // Handle beforeunload to cleanup sessions
        window.addEventListener('beforeunload', (e) => {
            if (this.currentPage === 'videoRoom' && sessionTimer.isActive) {
                e.preventDefault();
                e.returnValue = 'You have an active study session. Are you sure you want to leave?';
                return e.returnValue;
            }
        });

        // Handle visibility change to pause/resume timer when tab is hidden
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && sessionTimer.isActive && !sessionTimer.isPaused) {
                // Optional: auto-pause when tab is hidden
                // sessionTimer.pause();
            }
        });

        // Initialize keyboard shortcuts
        this.initKeyboardShortcuts();
    }

    initRoomCodeModal() {
        const modal = document.getElementById('roomCodeModal');
        if (modal) {
            // Close on backdrop click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    sessionManager.hideRoomCodeModal();
                }
            });

            // Handle Enter key in code input
            const codeInput = document.getElementById('roomCodeInput');
            if (codeInput) {
                codeInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        videoManager.handleRoomCodeValidation();
                    }
                });
            }
        }
    }

    navigateToPage(page) {
        console.log('Navigating to page:', page);
        
        // Check authentication for protected pages
        const protectedPages = ['sessions', 'dashboard', 'videoRoom'];
        if (protectedPages.includes(page) && !authManager.isLoggedIn()) {
            this.showToast('Please log in to access this page', 'error');
            page = 'login';
        }

        // Handle special page transitions
        if (page === 'videoRoom') {
            this.prepareVideoRoom();
        }

        // Update current page
        this.currentPage = page;

        // Update page visibility
        this.updatePageVisibility();

        // Load page-specific data
        this.loadPageData(page);

        // Scroll to top
        window.scrollTo(0, 0);
    }

    prepareVideoRoom() {
        // Ensure we have a current session
        const currentSession = sessionManager.getCurrentSession();
        if (!currentSession) {
            this.showToast('No active session found', 'error');
            this.navigateToPage('sessions');
            return;
        }

        // Update room info
        this.updateRoomInfo(currentSession);
    }

    updateRoomInfo(session) {
        // Update page title
        document.title = `${session.title} - Virtual Library`;
        
        // Update room header
        const roomTitle = document.getElementById('roomTitle');
        const sessionDuration = document.getElementById('sessionDuration');
        const sessionGoal = document.getElementById('sessionGoal');

        if (roomTitle) roomTitle.textContent = session.title;
        if (sessionDuration) sessionDuration.textContent = `${session.duration} minutes`;
        if (sessionGoal) sessionGoal.textContent = session.goal;
    }

    updatePageVisibility() {
        // Hide all pages
        document.querySelectorAll('.page').forEach(page => {
            page.classList.remove('active');
        });

        // Show current page
        const currentPageElement = document.getElementById(`${this.currentPage}Page`);
        if (currentPageElement) {
            currentPageElement.classList.add('active');
        }

        // Update page title
        this.updatePageTitle();
    }

    updatePageTitle() {
        const titles = {
            home: 'Virtual Library - Study Together',
            login: 'Sign In - Virtual Library',
            signup: 'Sign Up - Virtual Library',
            sessions: 'Study Sessions - Virtual Library',
            dashboard: 'Dashboard - Virtual Library',
            videoRoom: 'Study Session - Virtual Library'
        };

        document.title = titles[this.currentPage] || 'Virtual Library';
    }

    loadPageData(page) {
        switch (page) {
            case 'sessions':
                sessionManager.loadSessions();
                sessionManager.reinitialize();
                break;
            case 'dashboard':
                this.loadDashboardData();
                break;
            case 'videoRoom':
                this.initializeVideoRoom();
                break;
        }
    }

    loadDashboardData() {
        if (!authManager.isLoggedIn()) return;

        const userEmail = authManager.getUserEmail();
        const userStats = storageManager.getUserStats(userEmail);
        const sessionHistory = storageManager.getSessionHistory(userEmail);
        const achievements = storageManager.getUserAchievements(userEmail);

        // Update statistics
        this.updateDashboardStats(userStats, achievements);

        // Update weekly progress
        this.updateWeeklyProgress(userStats);

        // Update recent sessions
        this.updateRecentSessions(sessionHistory);
    }

    updateDashboardStats(stats, achievements) {
        // Update stat cards
        const totalStudyHours = document.getElementById('totalStudyHours');
        const weeklyGoal = document.getElementById('weeklyGoal');
        const achievementsCount = document.getElementById('achievementsCount');

        if (totalStudyHours) totalStudyHours.textContent = stats.totalStudyHours.toFixed(1);
        if (weeklyGoal) weeklyGoal.textContent = stats.weeklyGoal;
        if (achievementsCount) achievementsCount.textContent = achievements.length;
    }

    updateWeeklyProgress(stats) {
        const progressText = document.getElementById('weeklyProgress');
        const progressBar = document.getElementById('weeklyProgressBar');

        if (progressText) {
            progressText.textContent = `${stats.currentWeekHours.toFixed(1)} / ${stats.weeklyGoal} hours`;
        }

        if (progressBar) {
            const percentage = Math.min((stats.currentWeekHours / stats.weeklyGoal) * 100, 100);
            progressBar.style.width = `${percentage}%`;
        }
    }

    updateRecentSessions(sessionHistory) {
        const recentSessionsContainer = document.getElementById('recentSessions');
        if (!recentSessionsContainer) return;

        if (sessionHistory.length === 0) {
            recentSessionsContainer.innerHTML = `
                <div class="no-sessions">
                    <p>No recent sessions. Start studying to see your progress!</p>
                </div>
            `;
            return;
        }

        // Show last 5 sessions
        const recentSessions = sessionHistory
            .sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt))
            .slice(0, 5);

        recentSessionsContainer.innerHTML = recentSessions.map(session => `
            <div class="recent-session">
                <div class="recent-session-info">
                    <div class="recent-session-title">${this.escapeHtml(session.sessionTitle)}</div>
                    <div class="recent-session-time">${this.formatDate(session.completedAt)}</div>
                </div>
                <div class="recent-session-duration">${session.duration} min</div>
            </div>
        `).join('');
    }

    initializeVideoRoom() {
        // Adjust video grid layout
        this.adjustVideoGrid();

        // Initialize chat if needed
        this.initChat();
    }

    adjustVideoGrid() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        const participantCount = videoGrid.children.length;
        
        if (participantCount <= 1) {
            videoGrid.style.gridTemplateColumns = '1fr';
        } else if (participantCount <= 2) {
            videoGrid.style.gridTemplateColumns = '1fr 1fr';
        } else if (participantCount <= 4) {
            videoGrid.style.gridTemplateColumns = '1fr 1fr';
        } else {
            videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
        }
    }

    initChat() {
        const chatInput = document.getElementById('chatInput');
        const sendButton = document.getElementById('sendMessageBtn');

        if (chatInput && sendButton) {
            const sendMessage = () => {
                const message = chatInput.value.trim();
                if (message) {
                    this.addChatMessage(authManager.getUserName(), message);
                    chatInput.value = '';
                }
            };

            sendButton.addEventListener('click', sendMessage);
            chatInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    sendMessage();
                }
            });
        }
    }

    addChatMessage(username, message) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;

        const messageElement = document.createElement('div');
        messageElement.className = 'chat-message user';
        messageElement.innerHTML = `
            <div class="message-header">
                <strong>${this.escapeHtml(username)}</strong>
                <span class="message-time">${new Date().toLocaleTimeString()}</span>
            </div>
            <div class="message-content">${this.escapeHtml(message)}</div>
        `;

        chatMessages.appendChild(messageElement);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    showToast(message, type = 'info', duration = 5000) {
        const toastContainer = document.getElementById('toastContainer');
        if (!toastContainer) return;

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.innerHTML = `
            <div class="toast-header">${this.getToastTitle(type)}</div>
            <div class="toast-message">${this.escapeHtml(message)}</div>
        `;

        toastContainer.appendChild(toast);

        // Auto remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);

        // Manual close on click
        toast.addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    getToastTitle(type) {
        const titles = {
            success: 'Success',
            error: 'Error',
            warning: 'Warning',
            info: 'Information'
        };
        return titles[type] || 'Notification';
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffTime = Math.abs(now - date);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays === 1) {
            return 'Today';
        } else if (diffDays === 2) {
            return 'Yesterday';
        } else if (diffDays <= 7) {
            return `${diffDays - 1} days ago`;
        } else {
            return date.toLocaleDateString();
        }
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

    // Keyboard shortcuts
    initKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Only handle shortcuts when not typing in inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }

            switch (e.key) {
                case 'Escape':
                    // Close modals or leave room
                    const activeModal = document.querySelector('.modal.active');
                    if (activeModal) {
                        activeModal.classList.remove('active');
                    } else if (this.currentPage === 'videoRoom') {
                        videoManager.leaveRoom();
                    }
                    break;
                    
                case ' ':
                    // Space bar - pause/resume timer
                    if (this.currentPage === 'videoRoom' && sessionTimer.isActive) {
                        e.preventDefault();
                        if (sessionTimer.isPaused) {
                            sessionTimer.resume();
                        } else {
                            sessionTimer.pause();
                        }
                    }
                    break;
                    
                case 'm':
                case 'M':
                    // M key - toggle microphone
                    if (this.currentPage === 'videoRoom') {
                        e.preventDefault();
                        videoManager.toggleMicrophone();
                    }
                    break;
                    
                case 'v':
                case 'V':
                    // V key - toggle camera
                    if (this.currentPage === 'videoRoom') {
                        e.preventDefault();
                        videoManager.toggleCamera();
                    }
                    break;
            }
        });
    }

    // Error handling
    handleError(error, context = 'Application') {
        console.error(`${context} Error:`, error);
        this.showToast(`An error occurred in ${context}. Please try again.`, 'error');
    }

    // Performance monitoring
    logPerformance(action, duration) {
        if (typeof gtag !== 'undefined') {
            gtag('event', 'timing_complete', {
                name: action,
                value: duration
            });
        }
        console.log(`${action} took ${duration}ms`);
    }
}

// Initialize the application
const app = new VirtualLibraryApp();

// Make app globally available
window.app = app;

// Initialize keyboard shortcuts
app.initKeyboardShortcuts();

// Add some helpful console messages for development
console.log(`
🎓 Virtual Library - Study Together
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Welcome to your virtual study environment!

Available features:
• Video study sessions with WebRTC
• Session timers with notifications
• Goal tracking and achievements
• Subscription-based room access
• Real-time chat during sessions

Keyboard shortcuts (in video room):
• Space: Pause/Resume timer
• M: Toggle microphone
• V: Toggle camera
• Esc: Leave room or close modal

For support, check the help section in the dashboard.
`);

// Service Worker registration for offline functionality (optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => {
                console.log('SW registered: ', registration);
            })
            .catch(registrationError => {
                console.log('SW registration failed: ', registrationError);
            });
    });
}