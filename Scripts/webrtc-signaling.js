// WebRTC Signaling System for Real Peer-to-Peer Communication
class WebRTCSignaling {
    constructor() {
        this.connections = new Map();
        this.localStream = null;
        this.isHost = false;
        this.roomId = null;
        this.participants = new Map();
        this.iceServers = {
            iceServers: [
                { urls: 'stun:stun.l.google.com:19302' },
                { urls: 'stun:stun1.l.google.com:19302' },
                { urls: 'stun:stun2.l.google.com:19302' }
            ]
        };
    }

    async initializeMedia(constraints = { video: true, audio: true }) {
        try {
            this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
            return this.localStream;
        } catch (error) {
            console.error('Error accessing media devices:', error);
            throw new Error('Camera/microphone access denied or not available');
        }
    }

    createPeerConnection(peerId, isInitiator = false) {
        const peerConnection = new RTCPeerConnection(this.iceServers);
        
        // Add local stream tracks
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => {
                peerConnection.addTrack(track, this.localStream);
            });
        }

        // Handle ICE candidates
        peerConnection.onicecandidate = (event) => {
            if (event.candidate) {
                this.sendSignalingMessage(peerId, {
                    type: 'ice-candidate',
                    candidate: event.candidate
                });
            }
        };

        // Handle remote stream
        peerConnection.ontrack = (event) => {
            const [remoteStream] = event.streams;
            this.onRemoteStream(peerId, remoteStream);
        };

        // Handle connection state changes
        peerConnection.onconnectionstatechange = () => {
            console.log(`Connection with ${peerId}: ${peerConnection.connectionState}`);
            if (peerConnection.connectionState === 'failed' || 
                peerConnection.connectionState === 'disconnected') {
                this.removePeer(peerId);
            }
        };

        this.connections.set(peerId, peerConnection);
        return peerConnection;
    }

    async createOffer(peerId) {
        const peerConnection = this.connections.get(peerId);
        if (!peerConnection) return;

        try {
            const offer = await peerConnection.createOffer();
            await peerConnection.setLocalDescription(offer);
            
            this.sendSignalingMessage(peerId, {
                type: 'offer',
                offer: offer
            });
        } catch (error) {
            console.error('Error creating offer:', error);
        }
    }

    async handleOffer(peerId, offer) {
        const peerConnection = this.connections.get(peerId) || this.createPeerConnection(peerId);
        
        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peerConnection.createAnswer();
            await peerConnection.setLocalDescription(answer);
            
            this.sendSignalingMessage(peerId, {
                type: 'answer',
                answer: answer
            });
        } catch (error) {
            console.error('Error handling offer:', error);
        }
    }

    async handleAnswer(peerId, answer) {
        const peerConnection = this.connections.get(peerId);
        if (!peerConnection) return;

        try {
            await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
        } catch (error) {
            console.error('Error handling answer:', error);
        }
    }

    async handleIceCandidate(peerId, candidate) {
        const peerConnection = this.connections.get(peerId);
        if (!peerConnection) return;

        try {
            await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (error) {
            console.error('Error handling ICE candidate:', error);
        }
    }

    async joinRoom(roomId, userInfo) {
        this.roomId = roomId;
        this.isHost = !this.participants.has('host');
        
        if (this.isHost) {
            this.participants.set('host', userInfo);
        }
        
        // Add current user to participants
        this.participants.set(userInfo.userId, userInfo);
        
        // Request media access
        await this.initializeMedia();
        
        // Initialize UI for video chat
        this.initializeVideoUI();
        
        console.log(`Joined room ${roomId} as ${this.isHost ? 'host' : 'participant'}`);
    }

    connectToPeer(peerId) {
        if (this.isHost) {
            // Host creates connections to all participants
            const peerConnection = this.createPeerConnection(peerId, true);
            this.createOffer(peerId);
        }
    }

    sendSignalingMessage(targetPeerId, message) {
        // In a real implementation, this would send through a signaling server
        // For now, we'll use a simple approach with the UI
        console.log(`Sending ${message.type} to ${targetPeerId}`, message);
        
        // Broadcast to all participants (simplified for demo)
        this.broadcastMessage(message);
    }

    broadcastMessage(message) {
        // This would typically go through a server
        // For now, simulate message delivery
        if (window.videoManager) {
            window.videoManager.handleSignalingMessage(message);
        }
    }

    onRemoteStream(peerId, stream) {
        console.log(`Received remote stream from ${peerId}`);
        if (window.videoManager) {
            window.videoManager.addRemoteStream(peerId, stream);
        }
    }

    removePeer(peerId) {
        const peerConnection = this.connections.get(peerId);
        if (peerConnection) {
            peerConnection.close();
            this.connections.delete(peerId);
        }
        
        this.participants.delete(peerId);
        
        if (window.videoManager) {
            window.videoManager.removeRemoteStream(peerId);
        }
    }

    toggleCamera() {
        if (this.localStream) {
            const videoTrack = this.localStream.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                return videoTrack.enabled;
            }
        }
        return false;
    }

    toggleMicrophone() {
        if (this.localStream) {
            const audioTrack = this.localStream.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                return audioTrack.enabled;
            }
        }
        return false;
    }

    initializeVideoUI() {
        if (window.videoManager) {
            window.videoManager.setupLocalStream(this.localStream);
        }
    }

    getConnectionStats(peerId) {
        const peerConnection = this.connections.get(peerId);
        if (!peerConnection) return null;

        return peerConnection.getStats().then(stats => {
            const connectionStats = {};
            stats.forEach(report => {
                if (report.type === 'inbound-rtp' && report.mediaType === 'video') {
                    connectionStats.inboundVideo = {
                        bytesReceived: report.bytesReceived,
                        packetsReceived: report.packetsReceived,
                        packetsLost: report.packetsLost,
                        jitter: report.jitter
                    };
                }
                if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
                    connectionStats.outboundVideo = {
                        bytesSent: report.bytesSent,
                        packetsSent: report.packetsSent,
                        packetsLost: report.packetsLost
                    };
                }
            });
            return connectionStats;
        });
    }

    cleanup() {
        // Close all peer connections
        this.connections.forEach((connection, peerId) => {
            connection.close();
        });
        this.connections.clear();
        
        // Stop local stream
        if (this.localStream) {
            this.localStream.getTracks().forEach(track => track.stop());
            this.localStream = null;
        }
        
        this.participants.clear();
        this.roomId = null;
    }
}

// Manual Signaling Interface for Real WebRTC
class ManualSignaling {
    constructor() {
        this.connectionString = '';
        this.isWaitingForAnswer = false;
    }

    async generateConnectionString() {
        try {
            const peerConnection = webrtcSignaling.createPeerConnection('manual-peer', true);
            const offer = await peerConnection.createOffer({
                offerToReceiveAudio: true,
                offerToReceiveVideo: true
            });
            
            await peerConnection.setLocalDescription(offer);
            
            // Wait for ICE gathering to complete
            await new Promise(resolve => {
                if (peerConnection.iceGatheringState === 'complete') {
                    resolve();
                } else {
                    peerConnection.addEventListener('icegatheringstatechange', () => {
                        if (peerConnection.iceGatheringState === 'complete') {
                            resolve();
                        }
                    });
                }
            });

            const data = {
                type: 'offer',
                offer: offer,
                roomId: webrtcSignaling.roomId,
                userId: authManager.getUserEmail(),
                userName: authManager.getUserName(),
                timestamp: Date.now()
            };
            
            return btoa(JSON.stringify(data));
        } catch (error) {
            console.error('Error generating connection string:', error);
            throw error;
        }
    }

    parseConnectionString(connectionString) {
        try {
            return JSON.parse(atob(connectionString));
        } catch (error) {
            console.error('Error parsing connection string:', error);
            return null;
        }
    }

    async handleIncomingConnection(connectionString) {
        const data = this.parseConnectionString(connectionString);
        if (!data || data.type !== 'offer') return false;

        // Show connection request dialog
        return this.showConnectionRequest(data);
    }

    showConnectionRequest(data) {
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Incoming Connection Request</h3>
                    </div>
                    <div class="modal-body">
                        <p>Someone wants to join your study session via video chat.</p>
                        <p><strong>Room ID:</strong> ${data.roomId}</p>
                        <p>Do you want to accept this connection?</p>
                    </div>
                    <div class="modal-actions">
                        <button id="acceptConnection" class="btn btn-primary">Accept</button>
                        <button id="rejectConnection" class="btn btn-secondary">Reject</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('acceptConnection').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });

            document.getElementById('rejectConnection').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(false);
            });
        });
    }

    async handleOutgoingConnection(targetConnectionString) {
        const data = this.parseConnectionString(targetConnectionString);
        if (!data || data.type !== 'offer') return false;

        // Show connection dialog
        return new Promise((resolve) => {
            const modal = document.createElement('div');
            modal.className = 'modal active';
            modal.innerHTML = `
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Connect to Study Session</h3>
                    </div>
                    <div class="modal-body">
                        <p>Connecting to study session with room ID: ${data.roomId}</p>
                        <div class="form-group">
                            <label>Connection String:</label>
                            <textarea readonly class="connection-string" rows="4">${targetConnectionString}</textarea>
                        </div>
                        <p><small>Share this connection string with the host to establish video connection.</small></p>
                    </div>
                    <div class="modal-actions">
                        <button id="closeConnection" class="btn btn-primary">Close</button>
                    </div>
                </div>
            `;

            document.body.appendChild(modal);

            document.getElementById('closeConnection').addEventListener('click', () => {
                document.body.removeChild(modal);
                resolve(true);
            });
        });
    }
}

// Initialize WebRTC system
const webrtcSignaling = new WebRTCSignaling();
const manualSignaling = new ManualSignaling();