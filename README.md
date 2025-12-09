# Virtual Library - Study Together

A comprehensive virtual library platform that enables collaborative study sessions with video communication, session management, and progress tracking.

## Features

### 🎥 Video Study Sessions
- Real-time video/audio communication using WebRTC
- Camera permission management with clear explanations
- Screen sharing capabilities
- Multiple participant support (up to 8 people per session)
- Audio/video controls (mute, camera toggle, screen share)

### ⏰ Session Management
- Multiple session durations (25, 50, 90, 120 minutes)
- Custom duration selection
- Real-time session timer with visual indicators
- Automatic notifications at key intervals
- Sound notifications for session completion

### 🎯 Goal Tracking & Assessment
- Session goal setting and tracking
- Post-session assessment questionnaire
- Progress evaluation (goal achievement, focus level)
- Session notes and feedback
- Weekly progress monitoring

### 🔐 Authentication System
- User registration and login
- Email verification simulation
- Password reset functionality
- Secure session management

### 💳 Subscription System
- Unique room codes for premium sessions
- Code validation and usage tracking
- Subscription status management
- Multiple subscription tiers

### 📊 Dashboard & Analytics
- Total study hours tracking
- Weekly goal progress
- Achievement system with badges
- Session history and statistics
- Performance insights

### 🎨 Modern UI/UX
- Clean, minimalist design
- Responsive layout for all devices
- Accessibility features
- Intuitive navigation
- Real-time notifications

## Getting Started

### Prerequisites
- Modern web browser with WebRTC support
- Camera and microphone access
- Internet connection

### Installation
1. Open `index.html` in your web browser
2. No additional setup required - all functionality is client-side

### Quick Start Guide

#### Option 1: Use Demo Account (Recommended for testing)
- **Email**: `demo@library.com`
- **Password**: `demo123`
- This account has active subscription and sample data

#### Option 2: Create New Account
1. **Sign Up**: Click "Sign Up" and create an account
2. **Optional**: Enter subscription code during signup for premium features
3. **Login**: Use your credentials to sign in

### Testing the Features

#### 1. Authentication Flow
- Sign up with new account or use demo account
- Test "Forgot Password" functionality (shows demo message)
- Verify login persistence across page refreshes

#### 2. Study Sessions
- Browse available sessions on "Study Sessions" page
- Join any active session (no code required)
- For premium sessions, use subscription codes below

#### 3. Video Room Experience
- Grant camera/microphone permissions when prompted
- Test camera toggle (V key or button)
- Test microphone toggle (M key or button)
- Test screen sharing functionality
- Experience timer with sound notifications

#### 4. Goal Assessment
- Complete a study session
- Fill out the goal achievement assessment
- View progress in Dashboard

#### 5. Dashboard & Analytics
- Check study statistics and achievements
- View weekly progress and session history
- Monitor goal completion

## Subscription Codes

Use these demo codes to access premium sessions:
- `STUDY2024` - Valid until Dec 31, 2025
- `LIBRARY50` - Valid until Jun 30, 2025  
- `FOCUS2024` - Valid until Dec 31, 2025
- `MATH2024` - Valid until Dec 31, 2025
- `WRITE2024` - Valid until Dec 31, 2025

## Keyboard Shortcuts

When in a video session:
- **Space**: Pause/Resume timer
- **M**: Toggle microphone
- **V**: Toggle camera
- **Esc**: Leave room or close modal

## Browser Compatibility

- **Chrome/Chromium**: Full support
- **Firefox**: Full support
- **Safari**: Partial support (some WebRTC features may be limited)
- **Edge**: Full support

## Privacy & Security

- All data is stored locally in your browser
- No personal data is transmitted to external servers
- Camera/microphone access is only used for the current session
- Session recordings are not stored
- User authentication is simulated for demo purposes

## Technical Details

### Architecture
- **Frontend**: Pure HTML5, CSS3, JavaScript (ES6+)
- **Real-time Communication**: WebRTC API
- **Data Storage**: localStorage with JSON
- **Audio**: Web Audio API for notifications
- **Responsive Design**: CSS Grid and Flexbox

### File Structure
```
├── index.html              # Main application file
├── styles/
│   └── main.css           # Complete styling system
├── scripts/
│   ├── app.js            # Main application controller
│   ├── auth.js           # Authentication system
│   ├── storage.js        # Data management
│   ├── sessions.js       # Session management
│   ├── video.js          # WebRTC video handling
│   └── timer.js          # Session timer system
└── README.md             # This file
```

### Key Components

1. **Authentication Manager**: Handles user login/signup
2. **Storage Manager**: Manages local data persistence
3. **Session Manager**: Creates and manages study sessions
4. **Video Manager**: Handles WebRTC video communication
5. **Session Timer**: Controls study session timing and notifications
6. **App Controller**: Main navigation and state management

## Features in Detail

### Video Communication
- WebRTC peer-to-peer connections
- Camera and microphone controls
- Screen sharing functionality
- Multiple participant layout
- Audio level indicators

### Session Types
- **Pomodoro (25 min)**: Short focused sessions
- **Deep Focus (50 min)**: Extended concentration periods
- **Extended (90-120 min)**: Long study blocks
- **Custom**: User-defined durations

### Notifications System
- Session start confirmation
- Progress updates (25%, 50%, 75% completion)
- Time warnings (10, 5, 1 minute remaining)
- Session completion with sound
- Goal assessment prompts

### Achievement System
- First session completion
- 5-hour study milestone
- 20-hour study milestone
- Weekly goal achievement
- Study streaks (3, 7 days)

## Customization

### Adding New Session Durations
Edit the time options in `scripts/video.js`:
```javascript
// In showTimeSelectionModal()
<button class="time-option" data-duration="60">
    <div class="time-display">60 min</div>
    <div class="time-label">Hour Session</div>
</button>
```

### Modifying Notification Intervals
Adjust timing in `scripts/timer.js`:
```javascript
// In checkTimeNotifications()
if (this.remainingTime === 900) { // 15 minutes
    // Add custom notification
}
```

### Changing Subscription Codes
Update valid codes in `scripts/auth.js`:
```javascript
const validCodes = {
    'YOURCODE': { isActive: true, expiresAt: '2025-12-31' }
};
```

## Troubleshooting

### Camera/Microphone Not Working
1. Check browser permissions for camera/microphone
2. Ensure you're using HTTPS (required for WebRTC)
3. Try refreshing the page and granting permissions again

### Sessions Not Loading
1. Check if localStorage is enabled in your browser
2. Clear browser cache and reload
3. Try using an incognito/private browsing window

### Audio Notifications Not Playing
1. Ensure your browser allows autoplay with sound
2. Check system volume and browser audio settings
3. Try interacting with the page first (click somewhere)

## Real WebRTC Video Chat

This platform now features **real peer-to-peer video communication** using WebRTC technology. Unlike demo versions, this implementation provides actual video and audio streaming between participants.

### How Real Video Chat Works

#### Manual Signaling System
Since this is a client-side application without a backend server, we use a manual signaling approach:

1. **Generate Connection String**: Each participant creates a unique connection string containing their WebRTC offer
2. **Share Connection String**: Participants exchange these strings through any communication method (chat, phone, etc.)
3. **Establish Connection**: Each participant enters the other's connection string to establish the peer-to-peer connection
4. **Real Video/Audio**: Once connected, actual video and audio streams are transmitted directly between browsers

#### Connection Process

**Step 1: Join a Session**
1. Navigate to "Study Sessions"
2. Click "Join Session" on any active session
3. Grant camera/microphone permissions when prompted

**Step 2: Generate Your Connection**
1. In the video room, click "Generate Connection" button
2. Copy the generated connection string
3. Share this string with other participants (via chat, phone, etc.)

**Step 3: Connect to Others**
1. Click "Connect to Peer" button
2. Paste the connection string shared by another participant
3. Click "Connect" to establish the video connection

**Step 4: Enjoy Real Video Chat**
- See and hear other participants in real-time
- Use camera/microphone controls to manage your media
- Multiple participants can connect by repeating the process

### WebRTC Features

#### Real Peer-to-Peer Communication
- Direct browser-to-browser video/audio streaming
- No server required for media transmission
- Low latency real-time communication
- High-quality video and audio

#### Media Controls
- **Toggle Camera (V key)**: Turn camera on/off
- **Toggle Microphone (M key)**: Mute/unmute microphone
- **Leave Room**: Exit the session properly

#### Connection Quality Monitoring
- Real-time connection status indicators
- Packet loss and jitter monitoring
- Automatic reconnection handling

### Browser Requirements

- **Chrome/Edge**: Full WebRTC support
- **Firefox**: Full WebRTC support  
- **Safari**: WebRTC support (may require HTTPS)
- **Mobile Browsers**: Limited WebRTC support

### Security & Privacy

- **No Server Recording**: Video streams are never recorded or stored
- **Peer-to-Peer Only**: Media flows directly between participants
- **Local Storage**: All data stays on your device
- **No Tracking**: No analytics or user tracking implemented

### Troubleshooting WebRTC

#### Connection Issues
1. **Firewall/NAT Problems**: Some networks block peer-to-peer connections
2. **Browser Compatibility**: Ensure both participants use supported browsers
3. **HTTPS Required**: Some features require HTTPS in production
4. **Permissions**: Verify camera/microphone permissions are granted

#### Video/Audio Problems
1. **No Video**: Check camera permissions and device availability
2. **No Audio**: Verify microphone permissions and system audio settings
3. **Poor Quality**: Network connection may be affecting streaming quality
4. **Echo**: Ensure only one participant has audio enabled if experiencing echo

#### Connection String Issues
1. **Invalid Format**: Ensure connection string is copied completely
2. **Expired String**: Connection strings are time-sensitive
3. **Wrong Participant**: Make sure you're connecting to the right person

### Technical Implementation

#### WebRTC Components
- **RTCPeerConnection**: Handles peer-to-peer connections
- **getUserMedia**: Accesses camera and microphone
- **ICE/STUN Servers**: Enables NAT traversal for connections
- **Manual Signaling**: Exchanges connection information between peers

#### File Structure
- `scripts/webrtc-signaling.js`: Core WebRTC signaling logic
- `scripts/webrtc-test.js`: WebRTC test mode for development
- `scripts/video.js`: Video manager with UI integration
- Real peer connections with proper ICE candidate exchange
- Automatic connection quality monitoring

### WebRTC Test Mode

For development and testing purposes, the platform includes a **WebRTC Test Mode** that simulates real video connections without requiring multiple participants.

#### Enabling Test Mode
Add one of these URL parameters to enable test mode:
- `?test=true`
- `?webrtc-test=true`

Example: `https://yoursite.com?test=true`

#### Test Mode Features
- **Mock Participants**: Simulates other users joining your session
- **Visual Indicators**: Shows when test mode is active
- **Mock Video Streams**: Creates fake video feeds for testing
- **Connection Simulation**: Tests the connection flow without real peers

#### Using Test Mode
1. Navigate to a session with test mode enabled
2. Click "Mock Connect" button in the video room
3. Watch mock participants "connect" with simulated video feeds
4. Test all video controls and UI features
5. Click the "×" button to disable test mode

#### Test Mode Benefits
- **Development Testing**: Test features without real participants
- **UI/UX Validation**: Verify interface behavior
- **Connection Flow Testing**: Test the WebRTC connection process
- **Browser Compatibility**: Test across different browsers
- **No Privacy Concerns**: Completely local simulation

## Support

For issues or questions:
1. Check the browser console for error messages
2. Ensure you're using a supported browser
3. Verify camera/microphone permissions are granted
4. Try refreshing the page if features aren't working

## Future Enhancements

Potential additions for future versions:
- Backend integration with real databases
- Advanced scheduling and calendar integration
- File sharing during sessions
- Breakout rooms functionality
- Advanced analytics and reporting
- Mobile app versions
- Integration with learning management systems

---

**Built with ❤️ for students and lifelong learners**

Enjoy your virtual study sessions!