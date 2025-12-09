// Study Sessions Management
class SessionManager {
    constructor() {
        this.sessions = storageManager.getStudySessions();
        this.currentSession = null;
        this.init();
    }

    init() {
        this.loadSessions();
        this.initEventListeners();
    }

    initEventListeners() {
        // Create session button
        const createSessionBtn = document.getElementById('createSessionBtn');
        if (createSessionBtn) {
            createSessionBtn.addEventListener('click', () => this.showCreateSessionModal());
        }

        // Filter event listeners
        const durationFilter = document.getElementById('durationFilter');
        const statusFilter = document.getElementById('statusFilter');
        
        if (durationFilter) {
            durationFilter.addEventListener('change', () => this.filterSessions());
        }
        
        if (statusFilter) {
            statusFilter.addEventListener('change', () => this.filterSessions());
        }
    }

    loadSessions() {
        this.sessions = storageManager.getStudySessions();
        this.renderSessions();
    }

    renderSessions(filteredSessions = null) {
        const sessionsList = document.getElementById('sessionsList');
        if (!sessionsList) return;

        const sessionsToRender = filteredSessions || this.sessions;
        
        if (sessionsToRender.length === 0) {
            sessionsList.innerHTML = `
                <div class="no-sessions">
                    <p>No study sessions found. Create one to get started!</p>
                </div>
            `;
            return;
        }

        sessionsList.innerHTML = sessionsToRender.map(session => `
            <div class="session-card" data-session-id="${session.id}">
                <div class="session-header">
                    <div>
                        <h3 class="session-title">${this.escapeHtml(session.title)}</h3>
                        <span class="session-status ${session.status}">${this.capitalizeFirst(session.status)}</span>
                    </div>
                </div>
                <div class="session-info">
                    <div class="info-item">
                        <i class="fas fa-clock"></i>
                        <span>${session.duration} minutes</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-users"></i>
                        <span>${session.participants}/${session.maxParticipants} participants</span>
                    </div>
                    <div class="info-item">
                        <i class="fas fa-bullseye"></i>
                        <span>${this.escapeHtml(session.goal)}</span>
                    </div>
                    ${session.requiresCode ? `
                        <div class="info-item">
                            <i class="fas fa-key"></i>
                            <span>Subscription code required</span>
                        </div>
                    ` : ''}
                </div>
                <div class="session-footer">
                    <div class="participant-count">
                        <span>${session.participants} joined</span>
                    </div>
                    <div class="session-actions">
                        <button class="btn btn-primary" onclick="sessionManager.joinSession('${session.id}')">
                            ${session.status === 'active' ? 'Join Session' : 'Join Queue'}
                        </button>
                    </div>
                </div>
            </div>
        `).join('');

        // Add click handlers to session cards
        sessionsList.querySelectorAll('.session-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.closest('.btn')) {
                    const sessionId = card.dataset.sessionId;
                    this.showSessionDetails(sessionId);
                }
            });
        });
    }

    filterSessions() {
        const durationFilter = document.getElementById('durationFilter').value;
        const statusFilter = document.getElementById('statusFilter').value;

        let filtered = [...this.sessions];

        // Filter by duration
        if (durationFilter) {
            if (durationFilter === 'custom') {
                filtered = filtered.filter(s => s.duration > 60 || s.duration < 25);
            } else {
                filtered = filtered.filter(s => s.duration === parseInt(durationFilter));
            }
        }

        // Filter by status
        if (statusFilter) {
            filtered = filtered.filter(s => s.status === statusFilter);
        }

        this.renderSessions(filtered);
    }

    async joinSession(sessionId) {
        if (!authManager.isLoggedIn()) {
            app.showToast('Please log in to join sessions', 'error');
            app.navigateToPage('login');
            return;
        }

        const session = storageManager.getStudySession(sessionId);
        if (!session) {
            app.showToast('Session not found', 'error');
            return;
        }

        // Check if session is full
        if (session.participants >= session.maxParticipants) {
            app.showToast('Session is full', 'error');
            return;
        }

        // Check if subscription code is required
        if (session.requiresCode && !authManager.hasActiveSubscription()) {
            this.showRoomCodeModal(sessionId);
            return;
        }

        // Start the session
        await this.startSession(sessionId);
    }

    async startSession(sessionId) {
        try {
            // Update session participant count
            const session = storageManager.getStudySession(sessionId);
            const updatedSession = storageManager.updateStudySession(sessionId, {
                participants: session.participants + 1,
                status: 'active'
            });

            // Set current session
            this.currentSession = updatedSession;

            // Navigate to video room
            app.navigateToPage('videoRoom');

            // Initialize video session
            if (window.videoManager) {
                await videoManager.initializeSession(updatedSession);
            }

            app.showToast('Joined session successfully!', 'success');
        } catch (error) {
            console.error('Error starting session:', error);
            app.showToast('Failed to join session', 'error');
        }
    }

    showCreateSessionModal() {
        if (!authManager.isLoggedIn()) {
            app.showToast('Please log in to create sessions', 'error');
            app.navigateToPage('login');
            return;
        }

        // Create a modal for creating new session
        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>Create Study Session</h3>
                </div>
                <div class="modal-body">
                    <form id="createSessionForm">
                        <div class="form-group">
                            <label for="sessionTitle">Session Title</label>
                            <input type="text" id="sessionTitle" required placeholder="e.g., Pomodoro Focus Session">
                        </div>
                        <div class="form-group">
                            <label for="sessionDescription">Description</label>
                            <textarea id="sessionDescription" required placeholder="Describe what you'll be studying..."></textarea>
                        </div>
                        <div class="form-group">
                            <label for="sessionDuration">Duration (minutes)</label>
                            <select id="sessionDuration" required>
                                <option value="">Select duration</option>
                                <option value="25">25 minutes</option>
                                <option value="50">50 minutes</option>
                                <option value="90">90 minutes</option>
                                <option value="120">120 minutes</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label for="sessionGoal">Study Goal</label>
                            <input type="text" id="sessionGoal" required placeholder="e.g., Complete chapter 5">
                        </div>
                        <div class="form-group">
                            <label for="maxParticipants">Max Participants</label>
                            <select id="maxParticipants" required>
                                <option value="">Select limit</option>
                                <option value="2">2 people</option>
                                <option value="4">4 people</option>
                                <option value="6">6 people</option>
                                <option value="8">8 people</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>
                                <input type="checkbox" id="requiresCode">
                                Require subscription code to join
                            </label>
                        </div>
                        <div id="roomCodeGroup" class="form-group" style="display: none;">
                            <label for="roomCode">Room Code</label>
                            <input type="text" id="roomCode" placeholder="Enter unique room code">
                        </div>
                    </form>
                </div>
                <div class="modal-actions">
                    <button id="createSessionConfirmBtn" class="btn btn-primary">Create Session</button>
                    <button id="cancelCreateBtn" class="btn btn-secondary">Cancel</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event listeners
        const requiresCodeCheckbox = modal.querySelector('#requiresCode');
        const roomCodeGroup = modal.querySelector('#roomCodeGroup');
        const cancelBtn = modal.querySelector('#cancelCreateBtn');
        const createBtn = modal.querySelector('#createSessionConfirmBtn');

        requiresCodeCheckbox.addEventListener('change', (e) => {
            roomCodeGroup.style.display = e.target.checked ? 'block' : 'none';
        });

        cancelBtn.addEventListener('click', () => {
            document.body.removeChild(modal);
        });

        createBtn.addEventListener('click', () => {
            this.createSession(modal);
        });

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    createSession(modal) {
        const form = modal.querySelector('#createSessionForm');
        const formData = new FormData(form);

        const sessionData = {
            title: modal.querySelector('#sessionTitle').value,
            description: modal.querySelector('#sessionDescription').value,
            duration: parseInt(modal.querySelector('#sessionDuration').value),
            goal: modal.querySelector('#sessionGoal').value,
            maxParticipants: parseInt(modal.querySelector('#maxParticipants').value),
            status: 'active',
            createdBy: authManager.getUserEmail(),
            requiresCode: modal.querySelector('#requiresCode').checked,
            roomCode: modal.querySelector('#requiresCode').checked ? 
                     modal.querySelector('#roomCode').value : null
        };

        // Validation
        if (!sessionData.title || !sessionData.description || !sessionData.goal) {
            app.showToast('Please fill in all required fields', 'error');
            return;
        }

        if (sessionData.requiresCode && !sessionData.roomCode) {
            app.showToast('Please enter a room code', 'error');
            return;
        }

        try {
            const newSession = storageManager.createStudySession(sessionData);
            this.sessions.push(newSession);
            this.renderSessions();
            document.body.removeChild(modal);
            app.showToast('Session created successfully!', 'success');
        } catch (error) {
            console.error('Error creating session:', error);
            app.showToast('Failed to create session', 'error');
        }
    }

    showSessionDetails(sessionId) {
        const session = storageManager.getStudySession(sessionId);
        if (!session) return;

        const modal = document.createElement('div');
        modal.className = 'modal active';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3>${this.escapeHtml(session.title)}</h3>
                </div>
                <div class="modal-body">
                    <div class="session-details-full">
                        <p><strong>Description:</strong> ${this.escapeHtml(session.description)}</p>
                        <p><strong>Duration:</strong> ${session.duration} minutes</p>
                        <p><strong>Goal:</strong> ${this.escapeHtml(session.goal)}</p>
                        <p><strong>Participants:</strong> ${session.participants}/${session.maxParticipants}</p>
                        <p><strong>Status:</strong> ${this.capitalizeFirst(session.status)}</p>
                        ${session.requiresCode ? `
                            <p><strong>Access:</strong> Subscription code required</p>
                            <p><strong>Room Code:</strong> ${session.roomCode}</p>
                        ` : `
                            <p><strong>Access:</strong> Open to all users</p>
                        `}
                        <p><strong>Created:</strong> ${new Date(session.createdAt).toLocaleDateString()}</p>
                    </div>
                </div>
                <div class="modal-actions">
                    <button class="btn btn-primary" onclick="sessionManager.joinSession('${session.id}'); document.body.removeChild(this.closest('.modal'))">
                        ${session.status === 'active' ? 'Join Session' : 'Join Queue'}
                    </button>
                    <button class="btn btn-secondary" onclick="document.body.removeChild(this.closest('.modal'))">Close</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Close on backdrop click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        });
    }

    showRoomCodeModal(sessionId) {
        const modal = document.getElementById('roomCodeModal');
        if (!modal) return;

        modal.classList.add('active');
        modal.dataset.sessionId = sessionId;

        // Clear previous input
        document.getElementById('roomCodeInput').value = '';
        document.getElementById('codeValidationMessage').textContent = '';
    }

    validateRoomCode(code, userEmail) {
        const validation = storageManager.validateSubscriptionCode(code);
        
        if (!validation.valid) {
            return { valid: false, message: validation.reason };
        }

        // Check if code was already used by this user
        const codes = JSON.parse(localStorage.getItem('subscriptionCodes') || '{}');
        const codeData = codes[code.toUpperCase()];
        
        if (codeData.usedBy.includes(userEmail)) {
            return { valid: false, message: 'You have already used this code' };
        }

        return { valid: true, message: 'Code is valid' };
    }

    useRoomCode(code, sessionId, userEmail) {
        const validation = this.validateRoomCode(code, userEmail);
        
        if (!validation.valid) {
            return validation;
        }

        // Mark code as used
        const success = storageManager.useSubscriptionCode(code, userEmail);
        
        if (!success) {
            return { valid: false, message: 'Failed to validate code' };
        }

        // Update user's subscription status
        if (authManager.currentUser) {
            authManager.currentUser.isActive = true;
            localStorage.setItem('currentUser', JSON.stringify(authManager.currentUser));
            authManager.updateUI();
        }

        return { valid: true, message: 'Code validated successfully' };
    }

    leaveSession(sessionId) {
        try {
            const session = storageManager.getStudySession(sessionId);
            if (session) {
                // Decrease participant count
                const updatedSession = storageManager.updateStudySession(sessionId, {
                    participants: Math.max(0, session.participants - 1)
                });

                this.currentSession = null;
                app.showToast('Left session successfully', 'success');
            }
        } catch (error) {
            console.error('Error leaving session:', error);
            app.showToast('Failed to leave session', 'error');
        }
    }

    // Utility methods
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    capitalizeFirst(str) {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    getCurrentSession() {
        return this.currentSession;
    }
}

// Initialize session manager
const sessionManager = new SessionManager();