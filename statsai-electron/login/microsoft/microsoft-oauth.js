/**
 * Microsoft OAuth Handler for AtlasWeb Email Assistant
 * Handles Microsoft Entra ID (Azure AD) authentication for Outlook/Exchange access
 */

class MicrosoftOAuthHandler {
    constructor() {
        this.config = {
            // Microsoft Azure AD configuration  
            clientId: '1701d37c-ee90-45e5-8476-1d235cab71a0',
            tenantId: '9cef4078-3934-49cd-b448-c0d1d2f482fc',
            redirectUri: 'https://oauthtest-609535336419.us-central1.run.app/auth/microsoft/callback',
            scopes: [
                'https://graph.microsoft.com/Mail.Read',
                'https://graph.microsoft.com/User.Read', 
                'https://graph.microsoft.com/Mail.ReadBasic',
                'offline_access'
            ],
            authority: 'https://login.microsoftonline.com/organizations',
            
            // GCP backend for token processing (similar to Google)
            tokenProcessorUrl: 'https://authhandler-609535336419.us-central1.run.app'
        };
        
        this.state = {
            isAuthenticated: false,
            user: null,
            outlookAccess: false,
            accessToken: null
        };
        
        console.log('📧 Microsoft OAuth Handler initialized');
        console.log('🔧 Config:', this.config);
        console.log('🎯 Authority URL:', this.config.authority);
        console.log('🔗 Redirect URI:', this.config.redirectUri);
        this.initializeMSAL();
    }
    
    // Detect environment and return appropriate redirect URI
    getRedirectUri() {
        const currentUrl = window.location.href;
        
        if (currentUrl.includes('localhost:')) {
            // Local development
            return window.location.origin + window.location.pathname;
        } else if (currentUrl.includes('atlasweb.info')) {
            // Production
            return 'https://atlasweb.info/email-assistant.html';
        } else {
            // Fallback to current location
            return window.location.origin + window.location.pathname;
        }
    }
    
    // Initialize Microsoft Authentication Library (MSAL)
    initializeMSAL() {
        // For production, we'd use @azure/msal-browser
        // For now, we'll use the authorization code flow manually
        
        // Check for existing authentication
        this.checkExistingAuth();
        
        // Handle callback if present
        this.handleCallback();
    }
    
    // Start Microsoft OAuth flow
    startMicrosoftAuth() {
        console.log('🔑 Starting Microsoft OAuth flow...');
        
        // Always use real OAuth flow (simulation removed)
        this.continueOAuthFlow();
    }
    
    // Continue with OAuth flow
    continueOAuthFlow() {
        console.log('🔄 Continuing with Microsoft OAuth flow...');
        
        // Generate and store state token for CSRF protection
        const state = this.generateStateToken();
        localStorage.setItem('microsoft_oauth_state', state);
        localStorage.setItem('microsoft_oauth_start_time', Date.now().toString());
        
        // Build authorization URL
        const authParams = new URLSearchParams({
            client_id: this.config.clientId,
            response_type: 'code',
            redirect_uri: this.getRedirectUri(),
            scope: this.config.scopes.join(' '),
            state: state,
            response_mode: 'query',
            prompt: 'select_account'
        });
        
        const authUrl = `${this.config.authority}/oauth2/v2.0/authorize?${authParams.toString()}`;
        
        console.log('🔗 Redirecting to Microsoft authorization URL');
        console.log('📍 Redirect URI:', this.getRedirectUri());
        
        // Show loading state
        this.showMicrosoftLoading();
        
        // Redirect to Microsoft OAuth
        window.location.href = authUrl;
    }
    
    // Simulate authentication for local development
    async simulateLocalAuth() {
        console.log('🧪 Simulating Microsoft authentication for local testing...');
        
        // Show loading state
        this.showMicrosoftLoading();
        
        // Simulate OAuth delay
        await this.delay(2000);
        
        // Remove loading modal
        this.closeModal();
        
        // Simulate successful authentication
        const mockCode = 'demo_auth_code_' + Date.now();
        await this.processMicrosoftCallback(mockCode);
    }
    
    // Handle OAuth callback
    handleCallback() {
        const urlParams = new URLSearchParams(window.location.search);
        const code = urlParams.get('code');
        const state = urlParams.get('state');
        const error = urlParams.get('error');
        
        // Check if this is a Microsoft OAuth callback
        if (code && state) {
            const storedState = localStorage.getItem('microsoft_oauth_state');
            
            if (state === storedState) {
                this.processMicrosoftCallback(code);
            } else {
                this.handleMicrosoftError('Invalid state parameter');
            }
        } else if (error) {
            this.handleMicrosoftError(error);
        }
    }
    
    // Process Microsoft OAuth callback
    async processMicrosoftCallback(code) {
        console.log('🔄 Processing Microsoft OAuth callback with authorization code...');
        
        try {
            // Use the live authhandler to exchange the code for tokens
            const tokenResponse = await this.exchangeCodeForToken(code);
            if (!tokenResponse.access_token) {
                throw new Error('Failed to obtain access token from backend.');
            }

            this.state.accessToken = tokenResponse.access_token;
            
            const userProfile = await this.fetchUserProfile();
            
            // Update state
            this.state.isAuthenticated = true;
            this.state.outlookAccess = true;
            this.state.user = {
                name: userProfile.displayName,
                email: userProfile.mail || userProfile.userPrincipalName,
                avatar: this.generateAvatar(userProfile.displayName),
                provider: 'microsoft',
                id: userProfile.id
            };
            
            // Store the authentication state locally
            localStorage.setItem('microsoft_authenticated', 'true');
            localStorage.setItem('microsoft_user', JSON.stringify(this.state.user));
            localStorage.setItem('microsoft_access_token', this.state.accessToken);
            localStorage.setItem('microsoft_auth_timestamp', Date.now().toString());

            // Clean up URL
            this.cleanupUrl();
            
            // Notify email assistant to trigger backend email fetching
            this.notifyEmailAssistant('microsoft_auth_success', { userEmail: this.state.user.email });
            
            // Show brief success notification instead of modal
            this.showMicrosoftSuccessNotification();
            
        } catch (error) {
            console.error('❌ Microsoft callback processing failed:', error);
            this.handleMicrosoftError('Authentication processing failed');
        }
    }

    // Exchange authorization code for an access token via our backend
    async exchangeCodeForToken(code) {
        console.log('🔄 Exchanging authorization code for access token via backend...');
        const response = await fetch(`${this.config.tokenProcessorUrl}/auth/microsoft/token`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ code }),
        });

        if (!response.ok) {
            const errorBody = await response.text();
            throw new Error(`Token exchange failed: ${errorBody}`);
        }
        return response.json();
    }

    // Fetch user profile from Microsoft Graph API
    async fetchUserProfile() {
        console.log('👤 Fetching user profile from Microsoft Graph API...');
        if (!this.state.accessToken) {
            throw new Error('Cannot fetch user profile without an access token.');
        }
        const response = await fetch('https://graph.microsoft.com/v1.0/me', {
            headers: {
                'Authorization': `Bearer ${this.state.accessToken}`,
            },
        });
        if (!response.ok) {
            throw new Error('Failed to fetch user profile from Microsoft Graph.');
        }
        return response.json();
    }
    
    // Handle Microsoft OAuth error
    handleMicrosoftError(error) {
        console.error('❌ Microsoft OAuth error:', error);
        
        this.showMicrosoftError(error);
        this.cleanupUrl();
        this.notifyEmailAssistant('microsoft_auth_error', error);
    }
    
    // Check for existing Microsoft authentication
    checkExistingAuth() {
        const isAuthenticated = localStorage.getItem('microsoft_authenticated') === 'true';
        const authTimestamp = localStorage.getItem('microsoft_auth_timestamp');
        const userData = localStorage.getItem('microsoft_user');
        
        if (isAuthenticated && authTimestamp && userData) {
            const authAge = Date.now() - parseInt(authTimestamp);
            const maxAge = 24 * 60 * 60 * 1000; // 24 hours
            
            if (authAge < maxAge) {
                this.state.isAuthenticated = true;
                this.state.outlookAccess = true;
                this.state.user = JSON.parse(userData);
                console.log('✅ Existing Microsoft authentication found');
                return true;
            } else {
                // Clear expired authentication
                this.clearAuthentication();
            }
        }
        
        return false;
    }
    
    // Clear Microsoft authentication
    clearAuthentication() {
        localStorage.removeItem('microsoft_authenticated');
        localStorage.removeItem('microsoft_user');
        localStorage.removeItem('microsoft_auth_timestamp');
        localStorage.removeItem('microsoft_oauth_state');
        localStorage.removeItem('microsoft_oauth_start_time');
        
        this.state.isAuthenticated = false;
        this.state.outlookAccess = false;
        this.state.user = null;
        this.state.accessToken = null;
        
        console.log('🧹 Microsoft authentication cleared');
    }
    
    // Generate avatar initials
    generateAvatar(name) {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
    }
    
    // Generate secure state token
    generateStateToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    
    // Show Microsoft loading state
    showMicrosoftLoading() {
        const loadingHtml = `
            <div id="microsoft-loading" class="oauth-overlay">
                <div class="oauth-loading-card">
                    <div class="loading-spinner"></div>
                    <h3>🔑 Connecting to Microsoft</h3>
                    <p>Redirecting to Microsoft for secure authentication...</p>
                    <small>This may take a few seconds</small>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', loadingHtml);
    }
    
    // Show Microsoft success notification (non-blocking)
    showMicrosoftSuccessNotification() {
        console.log('✅ Microsoft Connected Successfully! Transitioning to main app...');
        
        // Create a brief toast notification instead of modal
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 16px 24px;
            border-radius: 12px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.15);
            z-index: 10000;
            font-family: system-ui, sans-serif;
            font-size: 14px;
            transition: all 0.3s ease;
        `;
        notification.innerHTML = '✅ Microsoft Connected - Loading your emails...';
        
        document.body.appendChild(notification);
        
        // Remove after 3 seconds
        setTimeout(() => {
            if (notification.parentNode) {
                notification.style.transform = 'translateX(100%)';
                setTimeout(() => notification.remove(), 300);
            }
        }, 3000);
    }
    
    // Show Microsoft success state (kept for compatibility)
    showMicrosoftSuccess() {
        const successHtml = `
            <div id="microsoft-success" class="oauth-overlay oauth-success">
                <div class="oauth-success-card">
                    <div class="success-icon">✅</div>
                    <h3>Microsoft Connected Successfully!</h3>
                    <p>Your email assistant is now ready with Outlook access.</p>
                    <div class="oauth-features">
                        <div>📧 Read Outlook emails</div>
                        <div>🔍 Search messages</div>
                        <div>🤖 AI assistance</div>
                    </div>
                    <button onclick="microsoftOAuth.closeModal()" class="btn-primary">
                        Get Started
                    </button>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', successHtml);
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            this.closeModal();
        }, 5000);
    }
    
    // Show Microsoft error state
    showMicrosoftError(error) {
        const errorHtml = `
            <div id="microsoft-error" class="oauth-overlay oauth-error">
                <div class="oauth-error-card">
                    <div class="error-icon">❌</div>
                    <h3>Microsoft Connection Failed</h3>
                    <p>Unable to connect to your Microsoft account.</p>
                    <details class="error-details">
                        <summary>Error Details</summary>
                        <code>${error}</code>
                    </details>
                    <div class="oauth-actions">
                        <button onclick="microsoftOAuth.startMicrosoftAuth()" class="btn-primary">
                            Try Again
                        </button>
                        <button onclick="microsoftOAuth.closeModal()" class="btn-secondary">
                            Cancel
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', errorHtml);
    }
    
    // Close modal
    closeModal() {
        const modals = document.querySelectorAll('.oauth-overlay');
        modals.forEach(modal => modal.remove());
    }
    
    // Clean up URL parameters
    cleanupUrl() {
        if (window.history && window.history.pushState) {
            const url = new URL(window.location);
            url.searchParams.delete('code');
            url.searchParams.delete('state');
            url.searchParams.delete('error');
            url.searchParams.delete('error_description');
            window.history.pushState({}, '', url.toString());
        }
    }
    
    // Notify email assistant
    notifyEmailAssistant(event, data = null) {
        const customEvent = new CustomEvent('microsoftAuthChange', {
            detail: { event, data, state: this.state }
        });
        window.dispatchEvent(customEvent);
        
        console.log('📢 Microsoft auth event dispatched:', event);
    }
    
    // Utility delay function
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Public methods
    isMicrosoftConnected() {
        return this.state.isAuthenticated && this.state.outlookAccess;
    }
    
    connectMicrosoft() {
        if (this.isMicrosoftConnected()) {
            console.log('📧 Microsoft already connected - triggering UI transition');
            
            // Since we're already authenticated, notify the email assistant to show main app
            this.notifyEmailAssistant('microsoft_auth_success');
            
            // Show brief notification
            this.showMicrosoftSuccessNotification();
            return;
        }
        
        this.startMicrosoftAuth();
    }
    
    disconnectMicrosoft() {
        this.clearAuthentication();
        this.notifyEmailAssistant('microsoft_auth_disconnected');
        console.log('📧 Microsoft disconnected');
    }
    
    getAuthStatus() {
        return {
            isAuthenticated: this.state.isAuthenticated,
            outlookAccess: this.state.outlookAccess,
            user: this.state.user,
            canUseEmailAssistant: this.state.isAuthenticated && this.state.outlookAccess
        };
    }
    
    // Get access token for API calls
    getAccessToken() {
        return this.state.accessToken;
    }
}

// Initialize Microsoft OAuth handler when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.microsoftOAuth = new MicrosoftOAuthHandler();
    });
} else {
    window.microsoftOAuth = new MicrosoftOAuthHandler();
}