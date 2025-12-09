// WebRTC Test Mode for Development and Testing
class WebRTCTestMode {
    constructor() {
        this.isTestMode = false;
        this.testParticipants = [];
        this.init();
    }

    init() {
        // Check if test mode is enabled via URL parameter
        const urlParams = new URLSearchParams(window.location.search);
        this.isTestMode = urlParams.get('test') === 'true' || urlParams.get('webrtc-test') === 'true';
        
        if (this.isTestMode) {
            console.log('WebRTC Test Mode Enabled');
            this.setupTestMode();
        }
    }

    setupTestMode() {
        // Add test mode UI
        this.addTestModeUI();
        
        // Create mock participants
        this.createMockParticipants();
        
        // Setup test event listeners
        this.setupTestEventListeners();
    }

    addTestModeUI() {
        const testModeIndicator = document.createElement('div');
        testModeIndicator.id = 'testModeIndicator';
        testModeIndicator.className = 'test-mode-indicator';
        testModeIndicator.innerHTML = `
            <i class="fas fa-flask"></i>
            <span>WebRTC Test Mode Active</span>
            <button id="closeTestMode" class="test-mode-close">×</button>
        `;
        document.body.appendChild(testModeIndicator);

        // Add test mode styles
        const testStyles = document.createElement('style');
        testStyles.textContent = `
            .test-mode-indicator {
                position: fixed;
                top: 10px;
                right: 10px;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 8px 16px;
                border-radius: 20px;
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 12px;
                font-weight: 600;
                z-index: 10000;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            }
            .test-mode-close {
                background: none;
                border: none;
                color: white;
                font-size: 16px;
                cursor: pointer;
                margin-left: 4px;
                opacity: 0.8;
            }
            .test-mode-close:hover {
                opacity: 1;
            }
            .mock-participant {
                position: absolute;
                top: 10px;
                left: 10px;
                background: var(--surface);
                border: 1px solid var(--border-secondary);
                border-radius: var(--border-radius-sm);
                padding: var(--space-xs);
                font-size: 0.75rem;
                color: var(--text-secondary);
            }
        `;
        document.head.appendChild(testStyles);
    }

    createMockParticipants() {
        const mockParticipants = [
            { id: 'mock-1', name: 'Alice', color: '#ff6b6b' },
            { id: 'mock-2', name: 'Bob', color: '#4ecdc4' },
            { id: 'mock-3', name: 'Charlie', color: '#45b7d1' }
        ];

        mockParticipants.forEach(participant => {
            this.createMockParticipant(participant);
        });
    }

    createMockParticipant(participantData) {
        // Create mock video element
        const mockVideo = document.createElement('video');
        mockVideo.className = 'mock-video';
        mockVideo.autoplay = true;
        mockVideo.muted = true;
        mockVideo.playsInline = true;
        
        // Create canvas with participant info
        const canvas = document.createElement('canvas');
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext('2d');
        
        // Draw mock participant "video"
        ctx.fillStyle = participantData.color;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        ctx.font = 'bold 24px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(participantData.name, canvas.width / 2, canvas.height / 2);
        
        // Convert canvas to video stream
        canvas.toBlob(blob => {
            const videoURL = URL.createObjectURL(blob);
            mockVideo.src = videoURL;
        });

        // Store mock participant
        this.testParticipants.push({
            ...participantData,
            element: mockVideo,
            canvas: canvas,
            connected: false
        });
    }

    setupTestEventListeners() {
        // Close test mode
        document.addEventListener('click', (e) => {
            if (e.target.id === 'closeTestMode') {
                this.disableTestMode();
            }
        });

        // Mock connection button in video room
        const videoRoom = document.getElementById('videoRoom');
        if (videoRoom) {
            const mockConnectionBtn = document.createElement('button');
            mockConnectionBtn.id = 'mockConnectBtn';
            mockConnectionBtn.className = 'btn btn-secondary';
            mockConnectionBtn.innerHTML = '<i class="fas fa-users"></i> Mock Connect';
            mockConnectionBtn.style.marginLeft = '8px';
            
            const connectionControls = document.querySelector('.connection-controls');
            if (connectionControls) {
                connectionControls.appendChild(mockConnectionBtn);
                
                mockConnectionBtn.addEventListener('click', () => {
                    this.mockConnectParticipants();
                });
            }
        }
    }

    async mockConnectParticipants() {
        if (!window.videoManager || !window.videoManager.isInitialized) {
            app.showToast('Please join a session first', 'error');
            return;
        }

        app.showToast('Connecting mock participants...', 'info');

        // Simulate connecting to mock participants
        for (let i = 0; i < Math.min(2, this.testParticipants.length); i++) {
            const mockParticipant = this.testParticipants[i];
            
            setTimeout(async () => {
                try {
                    // Create mock media stream
                    const mockStream = this.createMockMediaStream(mockParticipant);
                    
                    // Add to video manager
                    window.videoManager.addRemoteStream(mockParticipant.id, mockStream);
                    
                    // Update mock participant status
                    mockParticipant.connected = true;
                    
                    app.showToast(`Connected to ${mockParticipant.name}`, 'success');
                    
                } catch (error) {
                    console.error('Error connecting mock participant:', error);
                }
            }, i * 1000); // Stagger connections
        }
    }

    createMockMediaStream(mockParticipant) {
        // Create a mock media stream from canvas
        const stream = new MediaStream();
        
        // Add video track from canvas
        const videoTrack = this.canvasToVideoTrack(mockParticipant.canvas);
        if (videoTrack) {
            stream.addTrack(videoTrack);
        }

        // Add mock audio track (silent)
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const destination = audioContext.createMediaStreamDestination();
        oscillator.connect(destination);
        oscillator.frequency.setValueAtTime(0, audioContext.currentTime); // Silent
        oscillator.start();
        
        const audioTrack = destination.stream.getAudioTracks()[0];
        if (audioTrack) {
            stream.addTrack(audioTrack);
        }

        return stream;
    }

    canvasToVideoTrack(canvas) {
        try {
            const stream = canvas.captureStream(30); // 30 FPS
            return stream.getVideoTracks()[0];
        } catch (error) {
            console.warn('Canvas captureStream not supported:', error);
            return null;
        }
    }

    disableTestMode() {
        // Remove test UI
        const indicator = document.getElementById('testModeIndicator');
        if (indicator) {
            indicator.remove();
        }

        // Remove mock connection button
        const mockBtn = document.getElementById('mockConnectBtn');
        if (mockBtn) {
            mockBtn.remove();
        }

        // Clear mock participants
        this.testParticipants.forEach(participant => {
            if (participant.element && participant.element.parentNode) {
                participant.element.parentNode.removeChild(participant.element);
            }
        });
        this.testParticipants = [];

        this.isTestMode = false;
        console.log('WebRTC Test Mode Disabled');
    }

    // Helper method to check if in test mode
    isEnabled() {
        return this.isTestMode;
    }

    // Get mock participants for testing
    getMockParticipants() {
        return this.testParticipants;
    }
}

// Initialize WebRTC test mode
const webRTCTestMode = new WebRTCTestMode();

// Make available globally
window.webRTCTestMode = webRTCTestMode;