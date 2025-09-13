/**
 * Microsoft OAuth Handler using Stytch Integration
 * Replaces direct Microsoft OAuth with Stytch-mediated authentication
 */

class MicrosoftStytchOAuth {
    constructor() {
        this.backendUrl = window.location.hostname === 'localhost' ? 'http://localhost:8080' : 'https://microsoft-authhandler-609535336419.us-central1.run.app';
        this.session = null;
        this.isAuthenticated = false;
        
        console.log('🔐 Microsoft-Stytch OAuth handler initialized');
        this.checkExistingSession();
    }

    // Check for existing session in localStorage
    checkExistingSession() {
        const sessionData = localStorage.getItem('microsoft_auth_session');
        if (sessionData) {
            try {
                const session = JSON.parse(sessionData);
                const now = Date.now();
                const sessionAge = now - session.timestamp;
                const sessionMaxAge = 8 * 60 * 60 * 1000; // 8 hours

                if (sessionAge < sessionMaxAge) {
                    this.session = session;
                    this.isAuthenticated = true;
                    console.log('✅ Found valid Microsoft session');
                    
                    // Dispatch authentication event
                    this.dispatchAuthEvent('microsoft_auth_restored', {
                        user: {
                            name: session.member.name || 'Microsoft User',
                            email: session.member.email_address,
                            provider: 'microsoft'
                        },
                        session: session
                    });
                } else {
                    console.log('⏰ Microsoft session expired, clearing...');
                    localStorage.removeItem('microsoft_auth_session');
                }
            } catch (error) {
                console.error('❌ Error parsing stored session:', error);
                localStorage.removeItem('microsoft_auth_session');
            }
        }
    }

    // Start Microsoft OAuth flow via Stytch
    async connectMicrosoft() {
        try {
            console.log('🚀 Starting Microsoft OAuth via Stytch...');
            
            // Redirect to our backend OAuth start endpoint
            // The callback will be handled by /api/callback
            window.location.href = `${this.backendUrl}/auth/microsoft/start?redirect_uri=${encodeURIComponent(window.location.origin)}`;
            
        } catch (error) {
            console.error('❌ Failed to start Microsoft OAuth:', error);
            this.dispatchAuthEvent('microsoft_auth_error', { error: error.message });
            throw error;
        }
    }

    // Check if Microsoft is connected
    isMicrosoftConnected() {
        return this.isAuthenticated && this.session && this.session.session_jwt;
    }

    // Get current user info
    getCurrentUser() {
        if (!this.session || !this.session.member) {
            return null;
        }

        return {
            name: this.session.member.name || 'Microsoft User',
            email: this.session.member.email_address,
            provider: 'microsoft',
            organization: this.session.organization?.organization_name || 'Default Organization'
        };
    }

    // Get authentication status
    getAuthStatus() {
        return {
            isAuthenticated: this.isAuthenticated,
            user: this.getCurrentUser(),
            session: this.session ? {
                expires: this.session.timestamp + (8 * 60 * 60 * 1000), // 8 hours
                organization: this.session.organization?.organization_name
            } : null
        };
    }

    // Validate current session with backend
    async validateSession() {
        if (!this.session || !this.session.session_jwt) {
            return false;
        }

        try {
            const response = await fetch(`${this.backendUrl}/auth/validate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_jwt: this.session.session_jwt
                })
            });

            const result = await response.json();
            
            if (result.valid) {
                console.log('✅ Session validated successfully');
                return true;
            } else {
                console.log('❌ Session validation failed:', result.error);
                await this.logout();
                return false;
            }
        } catch (error) {
            console.error('❌ Session validation error:', error);
            await this.logout();
            return false;
        }
    }

    // Get Microsoft Graph API access token
    async getGraphAccessToken() {
        if (!this.session || !this.session.session_jwt) {
            throw new Error('No valid session found');
        }

        try {
            const response = await fetch(`${this.backendUrl}/auth/microsoft/graph-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    session_jwt: this.session.session_jwt
                })
            });

            const result = await response.json();
            
            if (result.access_token) {
                console.log('✅ Retrieved real Microsoft Graph token');
                return result.access_token;
            } else {
                console.log('ℹ️ Graph token note:', result.note);
                throw new Error('No real Microsoft Graph token available - please ensure proper OAuth setup');
            }
        } catch (error) {
            console.error('❌ Failed to get Graph access token:', error);
            throw error;
        }
    }

    // Fetch Microsoft emails (mock implementation for now)
    async fetchMicrosoftEmails() {
        if (!this.isAuthenticated) {
            throw new Error('Not authenticated with Microsoft');
        }

        try {
            console.log('📧 Fetching Microsoft emails...');
            
            // For now, return mock data since Microsoft Graph integration requires additional setup
            const mockEmails = this.generateMockMicrosoftEmails();
            
            console.log('✅ Fetched', mockEmails.length, 'Microsoft emails');
            return mockEmails;
            
        } catch (error) {
            console.error('❌ Failed to fetch Microsoft emails:', error);
            throw error;
        }
    }

    // Generate mock Microsoft emails for testing
    generateMockMicrosoftEmails() {
        const user = this.getCurrentUser();
        const userEmail = user?.email || 'user@example.com';
        
        return [
            {
                id: 'ms-1',
                subject: 'Welcome to Microsoft 365',
                from: { name: 'Microsoft 365', email: 'noreply@microsoft.com', avatar: 'M365' },
                to: [{ name: user?.name || 'User', email: userEmail }],
                date: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
                body: `Welcome to Microsoft 365! Your account ${userEmail} has been successfully set up with email vectorization capabilities.`,
                snippet: 'Welcome to Microsoft 365! Your account has been successfully set up...',
                isRead: false,
                isStarred: false,
                labels: ['inbox'],
                hasAttachments: false,
                importance: 'normal',
                source: 'microsoft'
            },
            {
                id: 'ms-2',
                subject: 'Your Microsoft Teams meeting is starting soon',
                from: { name: 'Microsoft Teams', email: 'noreply@teams.microsoft.com', avatar: 'MT' },
                to: [{ name: user?.name || 'User', email: userEmail }],
                date: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
                body: 'Your Microsoft Teams meeting "Weekly Sync" is starting in 15 minutes. Click here to join.',
                snippet: 'Your Microsoft Teams meeting "Weekly Sync" is starting in 15 minutes...',
                isRead: true,
                isStarred: true,
                labels: ['inbox', 'important'],
                hasAttachments: false,
                importance: 'high',
                source: 'microsoft'
            },
            {
                id: 'ms-3',
                subject: 'Security alert for your Microsoft account',
                from: { name: 'Microsoft Security', email: 'security@microsoft.com', avatar: 'MSec' },
                to: [{ name: user?.name || 'User', email: userEmail }],
                date: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), // 1 day ago
                body: 'We detected a sign-in to your Microsoft account from a new location. If this was you, no action is needed.',
                snippet: 'We detected a sign-in to your Microsoft account from a new location...',
                isRead: false,
                isStarred: false,
                labels: ['inbox', 'security'],
                hasAttachments: false,
                importance: 'high',
                source: 'microsoft'
            }
        ];
    }

    // Logout and clear session
    async logout() {
        console.log('🚪 Logging out from Microsoft...');
        
        this.session = null;
        this.isAuthenticated = false;
        localStorage.removeItem('microsoft_auth_session');
        
        this.dispatchAuthEvent('microsoft_auth_logout', {});
        console.log('✅ Microsoft logout complete');
    }

    // Close any OAuth modals (compatibility method)
    closeModal() {
        // No-op for now since we use redirects
        console.log('📱 Closing OAuth modal (redirect-based flow)');
    }

    // Dispatch authentication events
    dispatchAuthEvent(event, data) {
        const customEvent = new CustomEvent('microsoftAuthChange', {
            detail: {
                event: event,
                data: data,
                timestamp: Date.now()
            }
        });
        
        window.dispatchEvent(customEvent);
        console.log('📡 Dispatched Microsoft auth event:', event);
    }

    // Start Microsoft authentication (compatibility method)
    startMicrosoftAuth() {
        return this.connectMicrosoft();
    }

    // Get access token (compatibility method)
    getAccessToken() {
        return this.getGraphAccessToken();
    }

    // Get refresh token (placeholder)
    getRefreshToken() {
        return this.session?.session_jwt || null;
    }

    // Get loading button HTML for OAuth initiation
    getLoadingButtonHTML() {
        return `
            <button id="microsoft-oauth-btn" class="oauth-button oauth-button-microsoft loading" disabled>
                <div class="oauth-button-content">
                    <div class="oauth-spinner"></div>
                    <span>Connecting to Microsoft...</span>
                </div>
            </button>
        `;
    }

    // Get normal button HTML for OAuth initiation
    getConnectButtonHTML() {
        return `
            <button id="microsoft-oauth-btn" class="oauth-button oauth-button-microsoft" onclick="window.microsoftStytchOAuth.connectMicrosoft()">
                <div class="oauth-button-content">
                    <div class="oauth-icon">
                        <svg width="20" height="20" viewBox="0 0 21 21">
                            <rect x="1" y="1" width="9" height="9" fill="#f25022"/>
                            <rect x="12" y="1" width="9" height="9" fill="#00a4ef"/>
                            <rect x="1" y="12" width="9" height="9" fill="#ffb900"/>
                            <rect x="12" y="12" width="9" height="9" fill="#7fba00"/>
                        </svg>
                    </div>
                    <span>Connect Microsoft Account</span>
                </div>
            </button>
        `;
    }

    // Get connected button HTML showing current user
    getConnectedButtonHTML() {
        const user = this.getCurrentUser();
        return `
            <button id="microsoft-oauth-btn" class="oauth-button oauth-button-microsoft connected">
                <div class="oauth-button-content">
                    <div class="oauth-icon">
                        <div class="user-avatar">${user?.name?.charAt(0) || 'M'}</div>
                    </div>
                    <div class="oauth-user-info">
                        <span class="oauth-user-name">${user?.name || 'Microsoft User'}</span>
                        <span class="oauth-user-email">${user?.email || ''}</span>
                    </div>
                    <button onclick="window.microsoftStytchOAuth.logout()" class="oauth-disconnect-btn">×</button>
                </div>
            </button>
        `;
    }
}

// Initialize Microsoft OAuth handler when script loads
window.microsoftStytchOAuth = new MicrosoftStytchOAuth();

// For backward compatibility, also set the old reference
window.microsoftOAuth = window.microsoftStytchOAuth;

console.log('✅ Microsoft-Stytch OAuth handler loaded and available globally');