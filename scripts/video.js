// Video Session Management using WebRTC
class VideoManager {
    constructor() {
        this.localStream = null;
        this.remoteStreams = new Map();
        this.peerConnections = new Map();
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.isScreenSharing = false;
        this.currentSession = null;
        this.init();
    }

    init() {
        this.initEventListeners();
        this.checkMediaPermissions();
    }

    initEventListeners() {
        // Video control buttons
        const toggleCameraBtn = document.getElementById('toggleCameraBtn');
        const toggleMicBtn = document.getElementById('toggleMicBtn');
        const shareScreenBtn = document.getElementById('shareScreenBtn');
        const leaveRoomBtn = document.getElementById('leaveRoomBtn');

        if (toggleCameraBtn) {
            toggleCameraBtn.addEventListener('click', () => this.toggleCamera());
        }

        if (toggleMicBtn) {
            toggleMicBtn.addEventListener('click', () => this.toggleMicrophone());
        }

        if (shareScreenBtn) {
            shareScreenBtn.addEventListener('click', () => this.toggleScreenShare());
        }

        if (leaveRoomBtn) {
            leaveRoomBtn.addEventListener('click', () => this.leaveRoom());
        }

        // Room code validation
        const validateCodeBtn = document.getElementById('validateCodeBtn');
        const cancelCodeBtn = document.getElementById('cancelCodeBtn');

        if (validateCodeBtn) {
            validateCodeBtn.addEventListener('click', () => this.handleRoomCodeValidation());
        }

        if (cancelCodeBtn) {
            cancelCodeBtn.addEventListener('click', () => this.hideRoomCodeModal());
        }
    }

    async checkMediaPermissions() {
        // Show camera permission modal
        const modal = document.getElementById('cameraPermissionModal');
        if (modal) {
            modal.classList.add('active');

            const allowBtn = document.getElementById('allowCameraBtn');
            const denyBtn = document.getElementById('denyCameraBtn');

            allowBtn.addEventListener('click', () => this.requestCameraPermission());
            denyBtn.addEventListener('click', () => this.handleCameraDenied());
        }
    }

    async requestCameraPermission() {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia({
                video: true,
                audio: true
            });

            // Hide permission modal
            const modal = document.getElementById('cameraPermissionModal');
            if (modal) {
                modal.classList.remove('active');
            }

            // Show time selection modal
            this.showTimeSelectionModal();

        } catch (error) {
            console.error('Error accessing media devices:', error);
            app.showToast('Camera and microphone access is required for video sessions', 'error');
            
            // Allow user to continue without camera
            this.handleCameraDenied();
        }
    }

    handleCameraDenied() {
        // Hide permission modal
        const modal = document.getElementById('cameraPermissionModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Continue without camera but with audio only
        this.localStream = null;
        app.showToast('Continuing without camera - audio only mode', 'warning');
        
        // Show time selection modal
        this.showTimeSelectionModal();
    }

    showTimeSelectionModal() {
        const modal = document.getElementById('timeSelectionModal');
        if (modal) {
            modal.classList.add('active');

            // Handle time option selection
            const timeOptions = modal.querySelectorAll('.time-option');
            const customTimeInput = document.getElementById('customTimeInput');
            const customDurationInput = document.getElementById('customDuration');
            const startSessionBtn = document.getElementById('startSessionBtn');

            let selectedDuration = null;

            timeOptions.forEach(option => {
                option.addEventListener('click', () => {
                    // Remove previous selection
                    timeOptions.forEach(opt => opt.classList.remove('selected'));
                    
                    // Add selection to clicked option
                    option.classList.add('selected');
                    
                    const duration = option.dataset.duration;
                    
                    if (duration === 'custom') {
                        customTimeInput.style.display = 'block';
                        selectedDuration = null;
                    } else {
                        customTimeInput.style.display = 'none';
                        selectedDuration = parseInt(duration);
                    }
                });
            });

            customDurationInput.addEventListener('input', () => {
                selectedDuration = parseInt(customDurationInput.value) || 30;
            });

            startSessionBtn.addEventListener('click', () => {
                if (!selectedDuration) {
                    app.showToast('Please select a duration', 'error');
                    return;
                }

                modal.classList.remove('active');
                this.startTimer(selectedDuration);
            });
        }
    }

    async initializeSession(session) {
        this.currentSession = session;
        
        // Update session info in UI
        this.updateSessionInfo(session);
        
        // Initialize local video if available
        if (this.localStream) {
            this.setupLocalVideo();
        }
        
        // Initialize WebRTC connections (simplified for demo)
        this.initializeWebRTC();
        
        // Start session timer if not already started
        if (!window.sessionTimer || !window.sessionTimer.isActive()) {
            this.startTimer(session.duration);
        }
    }

    updateSessionInfo(session) {
        const roomTitle = document.getElementById('roomTitle');
        const sessionDuration = document.getElementById('sessionDuration');
        const sessionGoal = document.getElementById('sessionGoal');

        if (roomTitle) roomTitle.textContent = session.title;
        if (sessionDuration) sessionDuration.textContent = `${session.duration} minutes`;
        if (sessionGoal) sessionGoal.textContent = session.goal;
    }

    setupLocalVideo() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        // Create local video element
        const localVideoContainer = document.createElement('div');
        localVideoContainer.className = 'video-participant local-video';
        localVideoContainer.innerHTML = `
            <video id="localVideo" autoplay muted playsinline></video>
            <div class="participant-info">
                <span>You (${authManager.getUserName()})</span>
            </div>
        `;

        // Add to grid
        videoGrid.appendChild(localVideoContainer);

        // Set local video stream
        const videoElement = localVideoContainer.querySelector('#localVideo');
        if (videoElement && this.localStream) {
            videoElement.srcObject = this.localStream;
        }
    }

    initializeWebRTC() {
        // For demo purposes, simulate other participants
        // In a real application, you would use WebRTC with a signaling server
        
        this.simulateParticipants();
        
        // Set up periodic updates for participant count
        this.updateParticipantCount();
    }

    simulateParticipants() {
        const session = this.currentSession;
        if (!session || session.participants <= 1) return;

        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        // Remove existing remote videos
        videoGrid.querySelectorAll('.remote-video').forEach(el => el.remove());

        // Simulate remote participants
        for (let i = 1; i < session.participants; i++) {
            this.addRemoteParticipant(i);
        }
    }

    addRemoteParticipant(index) {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        const remoteVideoContainer = document.createElement('div');
        remoteVideoContainer.className = 'video-participant remote-video';
        remoteVideoContainer.innerHTML = `
            <video id="remoteVideo${index}" autoplay playsinline></video>
            <div class="participant-info">
                <span>Participant ${index + 1}</span>
            </div>
        `;

        videoGrid.appendChild(remoteVideoContainer);

        // For demo, create a colored background instead of real video
        const videoElement = remoteVideoContainer.querySelector('video');
        videoElement.style.background = this.getRandomColor();
        videoElement.style.display = 'flex';
        videoElement.style.alignItems = 'center';
        videoElement.style.justifyContent = 'center';
        videoElement.style.color = 'white';
        videoElement.style.fontSize = '18px';
        videoElement.textContent = 'Video Stream';
    }

    getRandomColor() {
        const colors = [
            '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
            '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F'
        ];
        return colors[Math.floor(Math.random() * colors.length)];
    }

    updateParticipantCount() {
        const participantCount = document.getElementById('participantCount');
        if (participantCount && this.currentSession) {
            const count = this.currentSession.participants;
            participantCount.textContent = `${count} participant${count !== 1 ? 's' : ''}`;
        }
    }

    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                this.isVideoEnabled = videoTrack.enabled;
                
                // Update button icon and class
                const button = document.getElementById('toggleCameraBtn');
                if (button) {
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = this.isVideoEnabled ? 'fas fa-video' : 'fas fa-video-slash';
                    }
                    button.classList.toggle('active', !this.isVideoEnabled);
                }

                // Update local video display
                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.style.opacity = this.isVideoEnabled ? '1' : '0.5';
                }
            }
        }
    }

    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                this.isAudioEnabled = audioTrack.enabled;
                
                // Update button icon and class
                const button = document.getElementById('toggleMicBtn');
                if (button) {
                    const icon = button.querySelector('i');
                    if (icon) {
                        icon.className = this.isAudioEnabled ? 'fas fa-microphone' : 'fas fa-microphone-slash';
                    }
                    button.classList.toggle('active', !this.isAudioEnabled);
                }
            }
        }
    }

    async toggleScreenShare() {
        try {
            if (!this.isScreenSharing) {
                // Start screen sharing
                const screenStream = await navigator.mediaDevices.getDisplayMedia({
                    video: true,
                    audio: true
                });

                // Replace video track in all peer connections
                const videoTrack = screenStream.getVideoTracks()[0];
                
                // Update local video
                const localVideo = document.getElementById('localVideo');
                if (localVideo) {
                    localVideo.srcObject = screenStream;
                }

                this.isScreenSharing = true;
                
                // Update button
                const button = document.getElementById('shareScreenBtn');
                if (button) {
                    button.classList.add('screen-share');
                }

                // Handle screen share end
                videoTrack.onended = () => {
                    this.stopScreenShare();
                };

            } else {
                // Stop screen sharing
                this.stopScreenShare();
            }
        } catch (error) {
            console.error('Error toggling screen share:', error);
            app.showToast('Failed to share screen', 'error');
        }
    }

    stopScreenShare() {
        if (this.localStream && this.isScreenSharing) {
            // Restore camera stream
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = this.localStream;
            }

            this.isScreenSharing = false;
            
            // Update button
            const button = document.getElementById('shareScreenBtn');
            if (button) {
                button.classList.remove('screen-share');
            }
        }
    }

    startTimer(duration) {
        if (window.sessionTimer) {
            window.sessionTimer.start(duration);
        }
    }

    handleRoomCodeValidation() {
        const codeInput = document.getElementById('roomCodeInput');
        const validationMessage = document.getElementById('codeValidationMessage');
        const modal = document.getElementById('roomCodeModal');
        const sessionId = modal.dataset.sessionId;

        if (!codeInput || !validationMessage) return;

        const code = codeInput.value.trim();
        const userEmail = authManager.getUserEmail();

        if (!code) {
            validationMessage.textContent = 'Please enter a subscription code';
            validationMessage.className = 'validation-message error';
            return;
        }

        // Validate code
        const result = sessionManager.useRoomCode(code, sessionId, userEmail);
        
        if (result.valid) {
            validationMessage.textContent = result.message;
            validationMessage.className = 'validation-message success';
            
            // Start session after successful validation
            setTimeout(() => {
                this.hideRoomCodeModal();
                sessionManager.joinSession(sessionId);
            }, 1000);
        } else {
            validationMessage.textContent = result.message;
            validationMessage.className = 'validation-message error';
        }
    }

    hideRoomCodeModal() {
        const modal = document.getElementById('roomCodeModal');
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async leaveRoom() {
        try {
            // Stop all media tracks
            if (this.localStream) {
                this.localStream.getTracks().forEach(track => track.stop());
            }

            // Close all peer connections
            this.peerConnections.forEach(pc => pc.close());
            this.peerConnections.clear();

            // Stop screen sharing if active
            if (this.isScreenSharing) {
                this.stopScreenShare();
            }

            // Leave session in session manager
            if (this.currentSession) {
                sessionManager.leaveSession(this.currentSession.id);
            }

            // Navigate back to sessions page
            app.navigateToPage('sessions');

        } catch (error) {
            console.error('Error leaving room:', error);
            app.showToast('Error leaving room', 'error');
        }
    }

    // Utility methods for session completion
    showGoalAssessment() {
        const modal = document.getElementById('goalAssessmentModal');
        if (modal) {
            modal.classList.add('active');

            const completeBtn = document.getElementById('completeSessionBtn');
            completeBtn.addEventListener('click', () => this.completeSession());
        }
    }

    completeSession() {
        // Get assessment data
        const goalAchieved = document.querySelector('input[name="goalAchieved"]:checked')?.value;
        const focusLevel = document.querySelector('input[name="focusLevel"]:checked')?.value;
        const notes = document.getElementById('sessionNotes').value;

        if (!goalAchieved || !focusLevel) {
            app.showToast('Please answer all questions', 'error');
            return;
        }

        // Prepare session completion data
        const completionData = {
            id: this.currentSession.id,
            title: this.currentSession.title,
            duration: this.currentSession.duration,
            goalAchieved: goalAchieved === 'yes',
            focusLevel: parseInt(focusLevel),
            notes: notes
        };

        // Update user statistics
        const userEmail = authManager.getUserEmail();
        const additionalMinutes = this.currentSession.duration;
        const stats = storageManager.updateUserStats(userEmail, additionalMinutes, completionData.goalAchieved);

        // Add to session history
        storageManager.addSessionToHistory(userEmail, completionData);

        // Hide modal
        const modal = document.getElementById('goalAssessmentModal');
        if (modal) {
            modal.classList.remove('active');
        }

        // Show completion message
        const message = completionData.goalAchieved ? 
            'Great job! You achieved your goals!' : 
            'Session completed. Keep pushing forward!';
        
        app.showToast(message, 'success');

        // Leave room after completion
        setTimeout(() => {
            this.leaveRoom();
        }, 2000);
    }
}

// Initialize video manager
const videoManager = new VideoManager();