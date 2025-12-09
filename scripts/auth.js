// Authentication System
class AuthManager {
    constructor() {
        this.currentUser = null;
        this.users = this.loadUsers();
        this.init();
    }

    init() {
        // Check if user is already logged in
        const savedUser = localStorage.getItem('currentUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.updateUI();
        }

        // Initialize form handlers
        this.initFormHandlers();
    }

    loadUsers() {
        const users = localStorage.getItem('users');
        return users ? JSON.parse(users) : {};
    }

    saveUsers() {
        localStorage.setItem('users', JSON.stringify(this.users));
    }

    initFormHandlers() {
        // Login form
        const loginForm = document.getElementById('loginForm');
        if (loginForm) {
            loginForm.addEventListener('submit', (e) => this.handleLogin(e));
        }

        // Signup form
        const signupForm = document.getElementById('signupForm');
        if (signupForm) {
            signupForm.addEventListener('submit', (e) => this.handleSignup(e));
        }

        // Forgot password form
        const forgotPasswordForm = document.getElementById('forgotPasswordForm');
        if (forgotPasswordForm) {
            forgotPasswordForm.addEventListener('submit', (e) => this.handleForgotPassword(e));
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.logout();
            });
        }
    }

    async handleLogin(e) {
        e.preventDefault();
        
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;

        if (!email || !password) {
            this.showToast('Please fill in all fields', 'error');
            return;
        }

        // Check if user exists and password matches
        const user = this.users[email];
        if (!user || user.password !== this.hashPassword(password)) {
            this.showToast('Invalid email or password', 'error');
            return;
        }

        // Update last login
        user.lastLogin = new Date().toISOString();
        this.saveUsers();

        // Set current user
        this.currentUser = {
            email: user.email,
            name: user.name,
            subscriptionCode: user.subscriptionCode,
            isActive: user.isActive
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateUI();
        this.showToast('Login successful!', 'success');
        
        // Navigate to dashboard
        setTimeout(() => {
            app.navigateToPage('dashboard');
        }, 1000);
    }

    async handleSignup(e) {
        e.preventDefault();
        
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const subscriptionCode = document.getElementById('subscriptionCode').value;

        if (!name || !email || !password) {
            this.showToast('Please fill in all required fields', 'error');
            return;
        }

        // Validate email format
        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        // Check if user already exists
        if (this.users[email]) {
            this.showToast('User with this email already exists', 'error');
            return;
        }

        // Validate subscription code if provided
        let isActive = false;
        if (subscriptionCode) {
            isActive = this.validateSubscriptionCode(subscriptionCode);
            if (!isActive) {
                this.showToast('Invalid subscription code', 'error');
                return;
            }
        }

        // Create new user
        this.users[email] = {
            email,
            name,
            password: this.hashPassword(password),
            subscriptionCode: subscriptionCode || null,
            isActive,
            createdAt: new Date().toISOString(),
            lastLogin: null
        };

        this.saveUsers();

        // Auto-login after signup
        this.currentUser = {
            email,
            name,
            subscriptionCode: subscriptionCode || null,
            isActive
        };

        localStorage.setItem('currentUser', JSON.stringify(this.currentUser));
        this.updateUI();
        this.showToast('Account created successfully!', 'success');
        
        // Navigate to dashboard
        setTimeout(() => {
            app.navigateToPage('dashboard');
        }, 1000);
    }

    async handleForgotPassword(e) {
        e.preventDefault();
        
        const email = document.getElementById('resetEmail').value;

        if (!email) {
            this.showToast('Please enter your email address', 'error');
            return;
        }

        if (!this.isValidEmail(email)) {
            this.showToast('Please enter a valid email address', 'error');
            return;
        }

        if (!this.users[email]) {
            this.showToast('No account found with this email address', 'error');
            return;
        }

        // In a real application, you would send a password reset email
        // For this demo, we'll show a success message
        this.showToast('Password reset instructions have been sent to your email', 'success');
        
        // Clear the form
        document.getElementById('resetEmail').value = '';
        
        // Navigate back to login after a delay
        setTimeout(() => {
            app.navigateToPage('login');
        }, 2000);
    }

    logout() {
        this.currentUser = null;
        localStorage.removeItem('currentUser');
        this.updateUI();
        this.showToast('Logged out successfully', 'success');
        
        // Navigate to home page
        app.navigateToPage('home');
    }

    updateUI() {
        const navAuth = document.getElementById('navAuth');
        const navUser = document.getElementById('navUser');
        const userName = document.getElementById('userName');

        if (this.currentUser) {
            // User is logged in
            navAuth.style.display = 'none';
            navUser.style.display = 'flex';
            userName.textContent = this.currentUser.name;
        } else {
            // User is not logged in
            navAuth.style.display = 'flex';
            navUser.style.display = 'none';
        }
    }

    validateSubscriptionCode(code) {
        // Predefined valid subscription codes for demo
        const validCodes = {
            'STUDY2024': { isActive: true, expiresAt: '2025-12-31' },
            'LIBRARY50': { isActive: true, expiresAt: '2025-06-30' },
            'FOCUS2024': { isActive: true, expiresAt: '2025-12-31' }
        };

        const codeData = validCodes[code.toUpperCase()];
        if (!codeData) return false;

        // Check if code is still valid (not expired)
        const now = new Date();
        const expiryDate = new Date(codeData.expiresAt);
        
        return codeData.isActive && now <= expiryDate;
    }

    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }

    hashPassword(password) {
        // Simple hash function for demo purposes
        // In a real application, use proper hashing like bcrypt
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    showToast(message, type = 'info') {
        if (window.app && window.app.showToast) {
            window.app.showToast(message, type);
        }
    }

    // Helper methods
    isLoggedIn() {
        return this.currentUser !== null;
    }

    getCurrentUser() {
        return this.currentUser;
    }

    hasActiveSubscription() {
        return this.currentUser && this.currentUser.isActive;
    }

    getUserEmail() {
        return this.currentUser ? this.currentUser.email : null;
    }

    getUserName() {
        return this.currentUser ? this.currentUser.name : null;
    }
}

// Initialize auth manager
const authManager = new AuthManager();