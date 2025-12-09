// Storage Management System
class StorageManager {
    constructor() {
        this.init();
    }

    init() {
        // Initialize default data if not exists
        this.initializeDefaultData();
    }

    initializeDefaultData() {
        // Initialize demo user for easy testing
        if (!localStorage.getItem('users')) {
            const demoUsers = {
                'demo@library.com': {
                    email: 'demo@library.com',
                    name: 'Demo User',
                    password: this.hashPassword('demo123'),
                    subscriptionCode: 'STUDY2024',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                    lastLogin: null
                }
            };
            localStorage.setItem('users', JSON.stringify(demoUsers));
        }

        // Initialize study sessions
        if (!localStorage.getItem('studySessions')) {
            const defaultSessions = [
                {
                    id: '1',
                    title: 'Pomodoro Focus Session',
                    description: '25-minute focused study session using the Pomodoro technique',
                    duration: 25,
                    goal: 'Complete assigned readings',
                    status: 'active',
                    participants: 3,
                    maxParticipants: 6,
                    createdAt: new Date().toISOString(),
                    createdBy: 'demo@library.com',
                    requiresCode: false
                },
                {
                    id: '2',
                    title: 'Deep Work: Mathematics',
                    description: '50-minute intensive mathematics study session',
                    duration: 50,
                    goal: 'Practice calculus problems',
                    status: 'active',
                    participants: 2,
                    maxParticipants: 4,
                    createdAt: new Date().toISOString(),
                    createdBy: 'demo@library.com',
                    requiresCode: true,
                    roomCode: 'MATH2024'
                },
                {
                    id: '3',
                    title: 'Language Learning Circle',
                    description: 'Practice conversation in Spanish with fellow learners',
                    duration: 90,
                    goal: 'Improve conversational skills',
                    status: 'upcoming',
                    participants: 1,
                    maxParticipants: 8,
                    createdAt: new Date().toISOString(),
                    createdBy: 'demo@library.com',
                    requiresCode: false
                },
                {
                    id: '4',
                    title: 'Research Writing Workshop',
                    description: 'Collaborative writing session for research papers',
                    duration: 120,
                    goal: 'Complete research paper sections',
                    status: 'active',
                    participants: 4,
                    maxParticipants: 6,
                    createdAt: new Date().toISOString(),
                    createdBy: 'demo@library.com',
                    requiresCode: true,
                    roomCode: 'WRITE2024'
                }
            ];
            localStorage.setItem('studySessions', JSON.stringify(defaultSessions));
        }

        // Initialize user statistics
        if (!localStorage.getItem('userStats')) {
            localStorage.setItem('userStats', JSON.stringify({}));
        }

        // Initialize session history
        if (!localStorage.getItem('sessionHistory')) {
            localStorage.setItem('sessionHistory', JSON.stringify([]));
        }

        // Initialize achievements
        if (!localStorage.getItem('achievements')) {
            localStorage.setItem('achievements', JSON.stringify({}));
        }

        // Initialize subscription codes
        if (!localStorage.getItem('subscriptionCodes')) {
            const codes = {
                'STUDY2024': { isActive: true, expiresAt: '2025-12-31', usedBy: [] },
                'LIBRARY50': { isActive: true, expiresAt: '2025-06-30', usedBy: [] },
                'FOCUS2024': { isActive: true, expiresAt: '2025-12-31', usedBy: [] },
                'MATH2024': { isActive: true, expiresAt: '2025-12-31', usedBy: [] },
                'WRITE2024': { isActive: true, expiresAt: '2025-12-31', usedBy: [] }
            };
            localStorage.setItem('subscriptionCodes', JSON.stringify(codes));
        }
    }

    // Study Sessions Management
    getStudySessions() {
        const sessions = localStorage.getItem('studySessions');
        return sessions ? JSON.parse(sessions) : [];
    }

    saveStudySessions(sessions) {
        localStorage.setItem('studySessions', JSON.stringify(sessions));
    }

    createStudySession(sessionData) {
        const sessions = this.getStudySessions();
        const newSession = {
            id: Date.now().toString(),
            ...sessionData,
            participants: 0,
            createdAt: new Date().toISOString()
        };
        sessions.push(newSession);
        this.saveStudySessions(sessions);
        return newSession;
    }

    updateStudySession(sessionId, updates) {
        const sessions = this.getStudySessions();
        const sessionIndex = sessions.findIndex(s => s.id === sessionId);
        
        if (sessionIndex !== -1) {
            sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
            this.saveStudySessions(sessions);
            return sessions[sessionIndex];
        }
        return null;
    }

    deleteStudySession(sessionId) {
        const sessions = this.getStudySessions();
        const filteredSessions = sessions.filter(s => s.id !== sessionId);
        this.saveStudySessions(filteredSessions);
    }

    getStudySession(sessionId) {
        const sessions = this.getStudySessions();
        return sessions.find(s => s.id === sessionId);
    }

    // User Statistics Management
    getUserStats(userEmail) {
        const stats = localStorage.getItem('userStats');
        const allStats = stats ? JSON.parse(stats) : {};
        return allStats[userEmail] || {
            totalStudyHours: 0,
            weeklyGoal: 20,
            currentWeekHours: 0,
            lastUpdated: null,
            streak: 0,
            achievements: []
        };
    }

    saveUserStats(userEmail, stats) {
        const allStats = localStorage.getItem('userStats');
        const statsData = allStats ? JSON.parse(allStats) : {};
        statsData[userEmail] = stats;
        localStorage.setItem('userStats', JSON.stringify(statsData));
    }

    updateUserStats(userEmail, additionalMinutes, goalAchieved = false) {
        const stats = this.getUserStats(userEmail);
        const now = new Date();
        const currentWeek = this.getWeekNumber(now);
        const lastUpdate = stats.lastUpdated ? new Date(stats.lastUpdated) : null;
        const lastWeek = lastUpdate ? this.getWeekNumber(lastUpdate) : currentWeek;

        // Update total hours
        stats.totalStudyHours += additionalMinutes / 60;

        // Check if it's a new week
        if (currentWeek !== lastWeek) {
            stats.currentWeekHours = 0;
        }

        // Update current week hours
        stats.currentWeekHours += additionalMinutes / 60;

        // Update streak
        if (goalAchieved && currentWeek === lastWeek) {
            stats.streak += 1;
        } else if (currentWeek !== lastWeek) {
            stats.streak = goalAchieved ? 1 : 0;
        }

        // Check for achievements
        this.checkAndAwardAchievements(userEmail, stats);

        stats.lastUpdated = now.toISOString();
        this.saveUserStats(userEmail, stats);
        return stats;
    }

    // Session History Management
    getSessionHistory(userEmail) {
        const history = localStorage.getItem('sessionHistory');
        const allHistory = history ? JSON.parse(history) : [];
        return allHistory.filter(h => h.userEmail === userEmail);
    }

    addSessionToHistory(userEmail, sessionData) {
        const history = localStorage.getItem('sessionHistory');
        const allHistory = history ? JSON.parse(history) : [];
        
        const sessionRecord = {
            id: Date.now().toString(),
            userEmail,
            sessionId: sessionData.id,
            sessionTitle: sessionData.title,
            duration: sessionData.duration,
            goalAchieved: sessionData.goalAchieved,
            focusLevel: sessionData.focusLevel,
            notes: sessionData.notes,
            completedAt: new Date().toISOString()
        };

        allHistory.push(sessionRecord);
        localStorage.setItem('sessionHistory', JSON.stringify(allHistory));
        
        return sessionRecord;
    }

    // Achievements Management
    getUserAchievements(userEmail) {
        const achievements = localStorage.getItem('achievements');
        const allAchievements = achievements ? JSON.parse(achievements) : {};
        return allAchievements[userEmail] || [];
    }

    awardAchievement(userEmail, achievementId, achievementData) {
        const achievements = localStorage.getItem('achievements');
        const allAchievements = achievements ? JSON.parse(achievements) : {};
        
        if (!allAchievements[userEmail]) {
            allAchievements[userEmail] = [];
        }

        // Check if achievement already exists
        const existing = allAchievements[userEmail].find(a => a.id === achievementId);
        if (!existing) {
            allAchievements[userEmail].push({
                id: achievementId,
                ...achievementData,
                earnedAt: new Date().toISOString()
            });
            localStorage.setItem('achievements', JSON.stringify(allAchievements));
            return true;
        }
        return false;
    }

    checkAndAwardAchievements(userEmail, stats) {
        const achievements = [];

        // First session achievement
        if (stats.totalStudyHours >= 0.5) {
            const awarded = this.awardAchievement(userEmail, 'first-session', {
                title: 'First Steps',
                description: 'Completed your first study session',
                icon: 'fas fa-star'
            });
            if (awarded) achievements.push('First Steps');
        }

        // 5 hours achievement
        if (stats.totalStudyHours >= 5) {
            const awarded = this.awardAchievement(userEmail, 'five-hours', {
                title: 'Getting Started',
                description: 'Studied for 5 hours total',
                icon: 'fas fa-graduation-cap'
            });
            if (awarded) achievements.push('Getting Started');
        }

        // 20 hours achievement
        if (stats.totalStudyHours >= 20) {
            const awarded = this.awardAchievement(userEmail, 'twenty-hours', {
                title: 'Dedicated Learner',
                description: 'Studied for 20 hours total',
                icon: 'fas fa-book'
            });
            if (awarded) achievements.push('Dedicated Learner');
        }

        // Weekly goal achievement
        if (stats.currentWeekHours >= stats.weeklyGoal) {
            const awarded = this.awardAchievement(userEmail, 'weekly-goal', {
                title: 'Goal Crusher',
                description: 'Achieved your weekly study goal',
                icon: 'fas fa-trophy'
            });
            if (awarded) achievements.push('Goal Crusher');
        }

        // Streak achievements
        if (stats.streak >= 3) {
            const awarded = this.awardAchievement(userEmail, 'three-day-streak', {
                title: 'On a Roll',
                description: '3-day study streak',
                icon: 'fas fa-fire'
            });
            if (awarded) achievements.push('On a Roll');
        }

        if (stats.streak >= 7) {
            const awarded = this.awardAchievement(userEmail, 'seven-day-streak', {
                title: 'Weekly Warrior',
                description: '7-day study streak',
                icon: 'fas fa-calendar-week'
            });
            if (awarded) achievements.push('Weekly Warrior');
        }

        return achievements;
    }

    // Subscription Code Management
    validateSubscriptionCode(code) {
        const codes = localStorage.getItem('subscriptionCodes');
        const allCodes = codes ? JSON.parse(codes) : {};
        const codeData = allCodes[code.toUpperCase()];

        if (!codeData) return { valid: false, reason: 'Invalid code' };

        const now = new Date();
        const expiryDate = new Date(codeData.expiresAt);

        if (!codeData.isActive) {
            return { valid: false, reason: 'Code is not active' };
        }

        if (now > expiryDate) {
            return { valid: false, reason: 'Code has expired' };
        }

        return { valid: true, codeData };
    }

    useSubscriptionCode(code, userEmail) {
        const codes = localStorage.getItem('subscriptionCodes');
        const allCodes = codes ? JSON.parse(codes) : {};
        const codeData = allCodes[code.toUpperCase()];

        if (!codeData) return false;

        // Check if user already used this code
        if (codeData.usedBy.includes(userEmail)) {
            return false;
        }

        // Add user to usedBy list
        codeData.usedBy.push(userEmail);
        allCodes[code.toUpperCase()] = codeData;
        localStorage.setItem('subscriptionCodes', JSON.stringify(allCodes));

        return true;
    }

    // Helper Methods
    hashPassword(password) {
        // Simple hash function for demo purposes
        let hash = 0;
        for (let i = 0; i < password.length; i++) {
            const char = password.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Data Export/Import for backup
    exportData() {
        const data = {
            users: localStorage.getItem('users'),
            userStats: localStorage.getItem('userStats'),
            sessionHistory: localStorage.getItem('sessionHistory'),
            achievements: localStorage.getItem('achievements'),
            subscriptionCodes: localStorage.getItem('subscriptionCodes'),
            studySessions: localStorage.getItem('studySessions')
        };
        return data;
    }

    importData(data) {
        try {
            Object.keys(data).forEach(key => {
                if (data[key]) {
                    localStorage.setItem(key, data[key]);
                }
            });
            return true;
        } catch (error) {
            console.error('Error importing data:', error);
            return false;
        }
    }

    // Clear all data (for testing/reset)
    clearAllData() {
        const keysToKeep = ['users']; // Keep user accounts
        Object.keys(localStorage).forEach(key => {
            if (!keysToKeep.includes(key)) {
                localStorage.removeItem(key);
            }
        });
        this.initializeDefaultData();
    }
}

// Initialize storage manager
const storageManager = new StorageManager();