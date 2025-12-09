// Real WebRTC Video Manager with Peer-to-Peer Communication
class VideoManager {
    constructor() {
        this.localVideo = null;
        this.remoteVideos = new Map();
        this.isVideoEnabled = true;
        this.isAudioEnabled = true;
        this.currentSession = null;
        this.isInitialized = false;
        this.participants = new Map();
        this.gridLayout = 'auto';
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeVideoElements();
    }

    setupEventListeners() {
        // Video control buttons
        document.addEventListener('click', (e) => {
            if (e.target.id === 'toggleCameraBtn' || e.target.closest('#toggleCameraBtn')) {
                this.toggleCamera();
            }
            if (e.target.id === 'toggleMicBtn' || e.target.closest('#toggleMicBtn')) {
                this.toggleMicrophone();
            }
            if (e.target.id === 'leaveRoomBtn' || e.target.closest('#leaveRoomBtn')) {
                this.leaveRoom();
            }
            if (e.target.id === 'generateConnectionBtn' || e.target.closest('#generateConnectionBtn')) {
                e.preventDefault();
                this.showGenerateConnectionModal();
            }
            if (e.target.id === 'connectToPeerBtn' || e.target.closest('#connectToPeerBtn')) {
                this.showConnectToPeerModal();
            }
        });

        // Modal event listeners
        this.setupModalEventListeners();

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (this.isInitialized) {
                switch(e.key.toLowerCase()) {
                    case 'v':
                        e.preventDefault();
                        this.toggleCamera();
                        break;
                    case 'm':
                        e.preventDefault();
                        this.toggleMicrophone();
                        break;
                }
            }
        });
    }

    setupModalEventListeners() {
        // Generate connection modal
        const generateModal = document.getElementById('generateConnectionModal');
        if (generateModal) {
            generateModal.addEventListener('click', (e) => {
                if (e.target === generateModal) {
                    this.closeModal('generateConnectionModal');
                }
            });
        }

        // Connect to peer modal
        const connectModal = document.getElementById('connectToPeerModal');
        if (connectModal) {
            connectModal.addEventListener('click', (e) => {
                if (e.target === connectModal) {
                    this.closeModal('connectToPeerModal');
                }
            });
        }

        // Button events
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeGenerateModal') {
                this.closeModal('generateConnectionModal');
            }
            if (e.target.id === 'cancelConnectBtn') {
                this.closeModal('connectToPeerModal');
            }
            if (e.target.id === 'copyConnectionBtn') {
                this.copyConnectionString();
            }
            if (e.target.id === 'connectBtn') {
                this.connectToPeer();
            }
        });
    }

    async showGenerateConnectionModal() {
        const modal = document.getElementById('generateConnectionModal');
        if (!modal || !this.isInitialized) return;

        try {
            // Show loading state
            document.getElementById('connectionStringOutput').value = 'Generating connection string...';
            document.getElementById('roomIdDisplay').value = this.currentSession?.id || 'N/A';
            
            // Generate connection string
            const connectionString = await this.generateConnectionString();
            document.getElementById('connectionStringOutput').value = connectionString;

            modal.classList.add('active');
        } catch (error) {
            console.error('Error showing connection modal:', error);
            app.showToast('Failed to generate connection string', 'error');
        }
    }

    showConnectToPeerModal() {
        const modal = document.getElementById('connectToPeerModal');
        if (!modal || !this.isInitialized) return;

        // Clear previous input and validation
        document.getElementById('connectionStringInput').value = '';
        document.getElementById('connectionValidation').textContent = '';
        document.getElementById('connectionValidation').className = 'validation-message';

        modal.classList.add('active');
    }

    closeModal(modalId) {
        const modal = document.getElementById(modalId);
        if (modal) {
            modal.classList.remove('active');
        }
    }

    async generateConnectionString() {
        try {
            if (!this.isInitialized || !webrtcSignaling.localStream) {
                throw new Error('Video session not initialized');
            }

            const connectionString = await manualSignaling.generateConnectionString();
            return connectionString;
        } catch (error) {
            console.error('Error generating connection string:', error);
            app.showToast('Failed to generate connection string', 'error');
            return '';
        }
    }

    async copyConnectionString() {
        const connectionString = document.getElementById('connectionStringOutput').value;
        try {
            await navigator.clipboard.writeText(connectionString);
            app.showToast('Connection string copied to clipboard!', 'success');
        } catch (error) {
            // Fallback for older browsers
            const textArea = document.createElement('textarea');
            textArea.value = connectionString;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
            app.showToast('Connection string copied!', 'success');
        }
    }

    async connectToPeer() {
        const connectionString = document.getElementById('connectionStringInput').value.trim();
        const validationEl = document.getElementById('connectionValidation');
        
        if (!connectionString) {
            this.showValidationError('Please enter a connection string');
            return;
        }

        try {
            // Update connection status
            this.updateConnectionStatus('connecting', 'Connecting...');
            
            // Parse and validate connection string
            const connectionData = JSON.parse(atob(connectionString));
            
            if (!connectionData.offer || !connectionData.roomId) {
                this.showValidationError('Invalid connection string format');
                this.updateConnectionStatus('disconnected', 'Connection Failed');
                return;
            }

            // Handle the connection
            const peerId = connectionData.userId || `peer-${Date.now()}`;
            await webrtcSignaling.handleOffer(peerId, connectionData.offer);
            
            this.showValidationSuccess('Connection established successfully!');
            this.updateConnectionStatus('connected', 'Connected');
            
            // Add participant info
            this.addParticipant(peerId, {
                name: connectionData.userName || 'Unknown User',
                email: connectionData.userId || 'unknown@example.com'
            });
            
            setTimeout(() => {
                this.closeModal('connectToPeerModal');
            }, 1500);
            
        } catch (error) {
            console.error('Error connecting to peer:', error);
            this.showValidationError('Failed to connect. Please check the connection string.');
            this.updateConnectionStatus('disconnected', 'Connection Failed');
        }
    }

    showValidationError(message) {
        const validationEl = document.getElementById('connectionValidation');
        validationEl.textContent = message;
        validationEl.className = 'validation-message connection-validation error';
    }

    showValidationSuccess(message) {
        const validationEl = document.getElementById('connectionValidation');
        validationEl.textContent = message;
        validationEl.className = 'validation-message connection-validation success';
    }

    updateConnectionStatus(status, text) {
        const statusEl = document.getElementById('connectionStatus');
        if (statusEl) {
            const statusDot = statusEl.querySelector('.status-dot');
            const statusText = statusEl.querySelector('.status-text');
            
            statusEl.className = `status-indicator ${status}`;
            if (statusText) statusText.textContent = text;
        }
    }

    initializeVideoElements() {
        this.localVideo = document.getElementById('localVideo');
    }

    async initializeSession(session) {
        if (this.isInitialized) return;
        
        this.currentSession = session;
        
        try {
            // Initialize WebRTC and get user media
            await webrtcSignaling.joinRoom(session.id, {
                userId: authManager.getUserEmail(),
                name: authManager.getUserName(),
                email: authManager.getUserEmail()
            });

            this.isInitialized = true;
            this.updateVideoControls();
            this.setupVideoGrid();
            
            console.log('Video session initialized successfully');
        } catch (error) {
            console.error('Error initializing video session:', error);
            app.showToast('Failed to initialize video session: ' + error.message, 'error');
        }
    }

    setupLocalStream(stream) {
        if (this.localVideo) {
            this.localVideo.srcObject = stream;
            this.localVideo.muted = true; // Always mute local video to prevent feedback
            this.localVideo.play().catch(error => {
                console.log('Local video autoplay prevented:', error);
            });
        }
    }

    addRemoteStream(peerId, stream) {
        // Remove existing video element for this peer
        this.removeRemoteStream(peerId);
        
        const videoContainer = document.createElement('div');
        videoContainer.className = 'video-participant';
        videoContainer.dataset.peerId = peerId;
        
        const videoElement = document.createElement('video');
        videoElement.autoplay = true;
        videoElement.playsInline = true;
        videoElement.className = 'remote-video';
        
        const infoOverlay = document.createElement('div');
        infoOverlay.className = 'video-info-overlay';
        infoOverlay.innerHTML = `
            <span class="participant-name">${this.getParticipantName(peerId)}</span>
            <div class="connection-status">
                <span class="status-indicator online"></span>
            </div>
        `;
        
        videoContainer.appendChild(videoElement);
        videoContainer.appendChild(infoOverlay);
        
        // Add to video grid
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            videoGrid.appendChild(videoContainer);
            videoElement.srcObject = stream;
        }
        
        this.remoteVideos.set(peerId, { container: videoContainer, video: videoElement, stream: stream });
        this.updateVideoGridLayout();
        
        // Add participant info
        this.participants.set(peerId, {
            id: peerId,
            name: this.getParticipantName(peerId),
            stream: stream,
            connected: true,
            connectedAt: new Date()
        });
    }

    removeRemoteStream(peerId) {
        const videoData = this.remoteVideos.get(peerId);
        if (videoData) {
            // Stop the stream
            if (videoData.stream) {
                videoData.stream.getTracks().forEach(track => track.stop());
            }
            
            // Remove video element
            if (videoData.container && videoData.container.parentNode) {
                videoData.container.parentNode.removeChild(videoData.container);
            }
            
            this.remoteVideos.delete(peerId);
        }
        
        this.participants.delete(peerId);
        this.updateVideoGridLayout();
    }

    handleSignalingMessage(message) {
        // Handle incoming signaling messages
        console.log('Received signaling message:', message);
        
        switch (message.type) {
            case 'offer':
                this.handleIncomingOffer(message);
                break;
            case 'answer':
                this.handleIncomingAnswer(message);
                break;
            case 'ice-candidate':
                this.handleIncomingIceCandidate(message);
                break;
            case 'peer-joined':
                this.handlePeerJoined(message);
                break;
            case 'peer-left':
                this.handlePeerLeft(message);
                break;
        }
    }

    async handleIncomingOffer(message) {
        // This would be called when receiving an offer from another peer
        const peerId = message.peerId;
        await webrtcSignaling.handleOffer(peerId, message.offer);
    }

    async handleIncomingAnswer(message) {
        const peerId = message.peerId;
        await webrtcSignaling.handleAnswer(peerId, message.answer);
    }

    async handleIncomingIceCandidate(message) {
        const peerId = message.peerId;
        await webrtcSignaling.handleIceCandidate(peerId, message.candidate);
    }

    handlePeerJoined(message) {
        console.log('Peer joined:', message.peerId);
        
        // Connect to new peer
        webrtcSignaling.connectToPeer(message.peerId);
        
        // Update UI to show new participant
        this.addParticipant(message.peerId, message.userInfo);
    }

    handlePeerLeft(message) {
        console.log('Peer left:', message.peerId);
        this.removeRemoteStream(message.peerId);
        this.removeParticipant(message.peerId);
    }

    addParticipant(peerId, userInfo) {
        const participant = {
            id: peerId,
            name: userInfo.name || userInfo.email,
            email: userInfo.email,
            joinedAt: new Date(),
            connected: false
        };
        
        this.participants.set(peerId, participant);
        this.updateParticipantList();
    }

    removeParticipant(peerId) {
        this.participants.delete(peerId);
        this.updateParticipantList();
    }

    updateParticipantList() {
        const participantList = document.getElementById('participantList');
        if (participantList) {
            const participants = Array.from(this.participants.values());
            
            participantList.innerHTML = participants.map(participant => `
                <div class="participant-item ${participant.connected ? 'online' : 'offline'}">
                    <div class="participant-avatar">
                        ${participant.name.charAt(0).toUpperCase()}
                    </div>
                    <div class="participant-info">
                        <div class="participant-name">${participant.name}</div>
                        <div class="participant-status">
                            ${participant.connected ? 'Connected' : 'Connecting...'}
                        </div>
                    </div>
                </div>
            `).join('');
        }
    }

    setupVideoGrid() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        // Ensure local video is in the grid
        if (this.localVideo && !document.querySelector('.video-participant[data-local="true"]')) {
            const localContainer = document.createElement('div');
            localContainer.className = 'video-participant';
            localContainer.dataset.local = 'true';
            localContainer.innerHTML = `
                <div class="video-info-overlay">
                    <span class="participant-name">You</span>
                    <div class="connection-status">
                        <span class="status-indicator online"></span>
                    </div>
                </div>
            `;
            
            // Insert local video
            localContainer.insertBefore(this.localVideo, localContainer.firstChild);
            videoGrid.appendChild(localContainer);
        }
        
        this.updateVideoGridLayout();
    }

    updateVideoGridLayout() {
        const videoGrid = document.getElementById('videoGrid');
        if (!videoGrid) return;

        const participantCount = this.remoteVideos.size + 1; // +1 for local video
        videoGrid.className = `video-grid grid-${Math.min(participantCount, 6)}`;
        
        // Apply CSS Grid layout based on participant count
        if (participantCount <= 1) {
            videoGrid.style.gridTemplateColumns = '1fr';
            videoGrid.style.gridTemplateRows = '1fr';
        } else if (participantCount <= 2) {
            videoGrid.style.gridTemplateColumns = '1fr 1fr';
            videoGrid.style.gridTemplateRows = '1fr';
        } else if (participantCount <= 4) {
            videoGrid.style.gridTemplateColumns = '1fr 1fr';
            videoGrid.style.gridTemplateRows = '1fr 1fr';
        } else {
            videoGrid.style.gridTemplateColumns = 'repeat(auto-fit, minmax(300px, 1fr))';
            videoGrid.style.gridTemplateRows = 'repeat(auto-fit, minmax(200px, 1fr))';
        }
    }

    async toggleCamera() {
        try {
            this.isVideoEnabled = webrtcSignaling.toggleCamera();
            this.updateVideoControls();
            
            // Show notification
            app.showToast(
                this.isVideoEnabled ? 'Camera turned on' : 'Camera turned off',
                'info'
            );
            
            return this.isVideoEnabled;
        } catch (error) {
            console.error('Error toggling camera:', error);
            app.showToast('Failed to toggle camera', 'error');
            return false;
        }
    }

    async toggleMicrophone() {
        try {
            this.isAudioEnabled = webrtcSignaling.toggleMicrophone();
            this.updateVideoControls();
            
            // Show notification
            app.showToast(
                this.isAudioEnabled ? 'Microphone turned on' : 'Microphone turned off',
                'info'
            );
            
            return this.isAudioEnabled;
        } catch (error) {
            console.error('Error toggling microphone:', error);
            app.showToast('Failed to toggle microphone', 'error');
            return false;
        }
    }

    updateVideoControls() {
        const cameraBtn = document.getElementById('toggleCameraBtn');
        const micBtn = document.getElementById('toggleMicBtn');
        
        if (cameraBtn) {
            const icon = cameraBtn.querySelector('i');
            if (this.isVideoEnabled) {
                icon.className = 'fas fa-video';
                cameraBtn.classList.remove('disabled');
            } else {
                icon.className = 'fas fa-video-slash';
                cameraBtn.classList.add('disabled');
            }
        }
        
        if (micBtn) {
            const icon = micBtn.querySelector('i');
            if (this.isAudioEnabled) {
                icon.className = 'fas fa-microphone';
                micBtn.classList.remove('disabled');
            } else {
                icon.className = 'fas fa-microphone-slash';
                micBtn.classList.add('disabled');
            }
        }
    }

    leaveRoom() {
        if (this.currentSession) {
            sessionManager.leaveSession(this.currentSession.id);
        }
        
        this.cleanup();
        app.navigateToPage('sessions');
    }

    cleanup() {
        // Stop all video streams
        this.remoteVideos.forEach((videoData, peerId) => {
            this.removeRemoteStream(peerId);
        });
        
        // Stop local stream
        if (webrtcSignaling.localStream) {
            webrtcSignaling.localStream.getTracks().forEach(track => track.stop());
        }
        
        // Clean up WebRTC connections
        webrtcSignaling.cleanup();
        
        // Reset state
        this.isInitialized = false;
        this.currentSession = null;
        this.participants.clear();
        this.remoteVideos.clear();
        
        // Reset video grid
        const videoGrid = document.getElementById('videoGrid');
        if (videoGrid) {
            videoGrid.innerHTML = '';
        }
    }

    getParticipantName(peerId) {
        const participant = this.participants.get(peerId);
        return participant ? participant.name : `User ${peerId}`;
    }

    // Connection quality monitoring
    async checkConnectionQuality() {
        const qualityReports = new Map();
        
        for (const [peerId, peerConnection] of webrtcSignaling.connections) {
            try {
                const stats = await webrtcSignaling.getConnectionStats(peerId);
                if (stats) {
                    qualityReports.set(peerId, this.analyzeConnectionQuality(stats));
                }
            } catch (error) {
                console.error(`Error getting stats for peer ${peerId}:`, error);
            }
        }
        
        return qualityReports;
    }

    analyzeConnectionQuality(stats) {
        const quality = {
            video: 'good',
            audio: 'good',
            overall: 'good'
        };
        
        if (stats.inboundVideo) {
            const packetLoss = stats.inboundVideo.packetsLost / 
                (stats.inboundVideo.packetsReceived + stats.inboundVideo.packetsLost);
            
            if (packetLoss > 0.05) quality.video = 'poor';
            else if (packetLoss > 0.02) quality.video = 'fair';
            
            if (stats.inboundVideo.jitter > 100) quality.video = 'poor';
        }
        
        quality.overall = quality.video === 'good' && quality.audio === 'good' ? 'good' : 
                         quality.video === 'poor' || quality.audio === 'poor' ? 'poor' : 'fair';
        
        return quality;
    }

    // Screen sharing (future feature)
    async startScreenShare() {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: false
            });
            
            // Replace video track in all peer connections
            const videoTrack = screenStream.getVideoTracks()[0];
            
            webrtcSignaling.connections.forEach((peerConnection) => {
                const sender = peerConnection.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    sender.replaceTrack(videoTrack);
                }
            });
            
            // Handle screen share end
            videoTrack.onended = () => {
                this.stopScreenShare();
            };
            
            return true;
        } catch (error) {
            console.error('Error starting screen share:', error);
            app.showToast('Failed to start screen sharing', 'error');
            return false;
        }
    }

    async stopScreenShare() {
        // This would restore the camera feed
        // Implementation would depend on how screen sharing is set up
    }
}

// Initialize video manager
const videoManager = new VideoManager();

// Make it globally available for WebRTC signaling
window.videoManager = videoManager;