const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { google } = require('googleapis');
const cors = require('cors');
const express = require('express');

const app = express();
const secretManager = new SecretManagerServiceClient();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// OAuth Configuration
const OAUTH_CONFIG = {
    clientId: '609535336419-nar9fcv646la5lne0h10n2dcdmlm7qak.apps.googleusercontent.com',
    redirectUri: 'https://oauthtest-609535336419.us-central1.run.app/auth/google/callback',
    scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]
};

// --- Helper Functions ---

async function getGoogleClientSecret() {
    try {
        const [secret] = await secretManager.accessSecretVersion({
            name: 'projects/solid-topic-466217-t9/secrets/google-oauth-client-secret/versions/latest'
        });
        return secret.payload.data.toString();
    } catch (error) {
        console.error('❌ Failed to get Google client secret:', error);
        throw new Error('Failed to retrieve Google client secret');
    }
}

async function getRefreshToken(userEmail) {
    try {
        const userIdClean = userEmail.replace(/[@.]/g, '_');
        const secretName = `projects/solid-topic-466217-t9/secrets/user-refresh-token-${userIdClean}/versions/latest`;
        console.log('🔍 Accessing secret:', secretName);
        const [secret] = await secretManager.accessSecretVersion({ name: secretName });
        const refreshToken = secret.payload.data.toString();
        console.log('✅ Retrieved refresh token for:', userEmail);
        return refreshToken;
    } catch (error) {
        console.error('❌ Failed to retrieve refresh token:', error);
        throw new Error(`Failed to retrieve refresh token for ${userEmail}`);
    }
}

async function storeRefreshToken(userEmail, refreshToken) {
    try {
        const userIdClean = userEmail.replace(/[@.]/g, '_');
        const secretName = `projects/solid-topic-466217-t9/secrets/user-refresh-token-${userIdClean}`;
        
        try {
            await secretManager.addSecretVersion({
                parent: secretName,
                payload: { data: Buffer.from(refreshToken, 'utf8') }
            });
            console.log(`✅ Added new version to existing secret: user-refresh-token-${userIdClean}`);
        } catch (addError) {
            if (addError.code === 5) { // NOT_FOUND
                console.log(`🔧 Creating new secret: user-refresh-token-${userIdClean}`);
                await secretManager.createSecret({
                    parent: 'projects/solid-topic-466217-t9',
                    secretId: `user-refresh-token-${userIdClean}`,
                    secret: { replication: { automatic: {} } }
                });
                await secretManager.addSecretVersion({
                    parent: secretName,
                    payload: { data: Buffer.from(refreshToken, 'utf8') }
                });
                console.log(`✅ Created secret and added version: user-refresh-token-${userIdClean}`);
            } else {
                throw addError;
            }
        }
    } catch (error) {
        console.error('❌ Failed to store refresh token:', error);
        throw error;
    }
}


// --- OAuth Routes ---

// Race condition protection: Track active token exchanges
const activeTokenExchanges = new Map();

app.get('/auth/google/start', async (req, res) => {
    console.log('🚀 Starting Google OAuth flow');
    try {
        const clientSecret = await getGoogleClientSecret();
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.clientId,
            clientSecret,
            OAUTH_CONFIG.redirectUri
        );
        const authUrl = oauth2Client.generateAuthUrl({
            access_type: 'offline',
            scope: OAUTH_CONFIG.scopes,
            prompt: 'consent',
            state: 'oauth_' + Date.now()
        });
        console.log('🔄 Redirecting to Google OAuth:', authUrl);
        res.redirect(authUrl);
    } catch (error) {
        console.error('❌ OAuth start failed:', error);
        res.status(500).json({ error: 'OAuth start failed', details: error.message });
    }
});

app.get('/auth/google/callback', async (req, res) => {
    console.log('🔑 Handling Google OAuth callback');
    
    // Race condition protection: Check for duplicate token exchanges
    const { code, error } = req.query;
    const requestId = `${code}_${Date.now()}`;
    
    if (code && activeTokenExchanges.has(code)) {
        console.log('🚫 RACE CONDITION DETECTED: Authorization code already being processed:', code.substring(0, 20) + '...');
        return res.status(429).json({ 
            error: 'Token exchange in progress', 
            details: 'This authorization code is currently being processed. Please wait.' 
        });
    }
    
    if (code) {
        activeTokenExchanges.set(code, requestId);
        console.log('🔒 Locked authorization code for processing:', code.substring(0, 20) + '...');
        
        // Auto-cleanup after 30 seconds to prevent memory leaks
        setTimeout(() => {
            activeTokenExchanges.delete(code);
            console.log('🗑️ Cleaned up authorization code lock:', code.substring(0, 20) + '...');
        }, 30000);
    }
    
    try {
        if (error) {
            console.error('❌ OAuth error:', error);
            return res.redirect(`https://atlasweb.info/email-assistant.html?oauth=error&error=${error}`);
        }
        if (!code) {
            return res.status(400).json({ error: 'No authorization code received' });
        }

        console.log('🔑 Exchanging authorization code for tokens...');
        console.log('🔍 Debug - Authorization code:', code.substring(0, 20) + '...');
        console.log('🔍 Debug - Client ID:', OAUTH_CONFIG.clientId);
        console.log('🔍 Debug - Redirect URI:', OAUTH_CONFIG.redirectUri);
        
        const clientSecret = await getGoogleClientSecret();
        console.log('🔍 Debug - Client secret length:', clientSecret ? clientSecret.length : 'NOT FOUND');
        
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.clientId,
            clientSecret,
            OAUTH_CONFIG.redirectUri
        );

        console.log('🔍 Debug - About to call oauth2Client.getToken()');
        
        // Try direct HTTP request first to isolate library vs credential issues
        console.log('🔧 Debug - Attempting direct token exchange to bypass googleapis library...');
        const directTokenExchange = async () => {
            const tokenParams = new URLSearchParams({
                client_id: OAUTH_CONFIG.clientId,
                client_secret: clientSecret,
                code: code,
                grant_type: 'authorization_code',
                redirect_uri: OAUTH_CONFIG.redirectUri
            });
            
            console.log('🔍 Direct request params (without secrets):', {
                client_id: OAUTH_CONFIG.clientId.substring(0, 10) + '...',
                code: code.substring(0, 10) + '...',
                grant_type: 'authorization_code',
                redirect_uri: OAUTH_CONFIG.redirectUri,
                client_secret_length: clientSecret.length
            });
            
            const response = await fetch('https://oauth2.googleapis.com/token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                body: tokenParams.toString()
            });
            
            const responseData = await response.json();
            console.log('🔍 Direct token exchange result:', {
                status: response.status,
                statusText: response.statusText,
                data: responseData
            });
            
            if (!response.ok) {
                throw new Error(`Direct token exchange failed: ${response.status} ${JSON.stringify(responseData)}`);
            }
            
            return responseData;
        };
        
        let tokens;
        try {
            // Try direct request first
            const directTokens = await directTokenExchange();
            tokens = directTokens;
            console.log('✅ Direct token exchange successful!');
        } catch (directError) {
            console.log('❌ Direct token exchange failed:', directError.message);
            console.log('🔄 Falling back to googleapis library...');
            
            try {
                console.log('🔍 Final Check - About to call oauth2Client.getToken() with code:', code ? code.substring(0, 20) + '...' : 'No Code');
                const tokenResult = await oauth2Client.getToken(code);
                tokens = tokenResult.tokens;
                console.log('✅ googleapis getToken() successful, token keys:', Object.keys(tokens));
            } catch (getTokenError) {
                console.log('❌ googleapis getToken() also failed:', {
                    message: getTokenError.message,
                    response: getTokenError.response?.data,
                    status: getTokenError.response?.status
                });
                throw getTokenError;
            }
        }
        console.log('✅ Token exchange successful');
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();
        console.log('👤 User info retrieved:', userInfo.email);

        if (tokens.refresh_token) {
            await storeRefreshToken(userInfo.email, tokens.refresh_token);
            console.log('✅ Refresh token stored successfully');
        }

        const profileData = {
            oauth: 'success',
            email: userInfo.email,
            name: userInfo.name,
            picture: userInfo.picture,
            hasRefreshToken: !!tokens.refresh_token,
            access_token: tokens.access_token,
            refresh_token: tokens.refresh_token,
            expires_in: tokens.expiry_date,
            token_type: 'Bearer',
            status: 'ready'
        };
        
        const productionSuccessUrl = `https://atlasweb.info/email-assistant.html?${new URLSearchParams(profileData).toString()}`;
        console.log('🔄 Redirecting to production email assistant:', productionSuccessUrl);
        
        // Release the authorization code lock on success
        if (code) {
            activeTokenExchanges.delete(code);
            console.log('✅ Released authorization code lock after successful token exchange');
        }
        
        res.redirect(productionSuccessUrl);

    } catch (error) {
        console.error('❌ OAuth callback failed:', error);
        res.status(500).json({ error: 'OAuth callback failed', details: error.message });
    }
});

app.post('/auth/google/tokens', async (req, res) => {
    console.log('🔑 Handling token retrieval request');
    try {
        const { userEmail } = req.body;
        if (!userEmail) {
            return res.status(400).json({ error: 'userEmail is required' });
        }

        console.log('🔍 Retrieving refresh token for:', userEmail);
        const refreshToken = await getRefreshToken(userEmail);
        const clientSecret = await getGoogleClientSecret();
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.clientId,
            clientSecret,
            OAUTH_CONFIG.redirectUri
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('✅ Token retrieval successful for:', userEmail);
        
        res.json({
            success: true,
            access_token: credentials.access_token,
            refresh_token: refreshToken,
            expires_in: credentials.expiry_date,
            token_type: 'Bearer'
        });
    } catch (error) {
        console.error('❌ Token retrieval failed:', error);
        res.status(500).json({ error: 'Token retrieval failed', details: error.message });
    }
});

app.post('/auth/google/refresh', async (req, res) => {
    console.log('🔄 Handling token refresh request');
    try {
        const { userEmail, refreshToken } = req.body;
        if (!userEmail || !refreshToken) {
            return res.status(400).json({ error: 'userEmail and refreshToken are required' });
        }

        console.log('🔄 Refreshing access token for:', userEmail);
        const clientSecret = await getGoogleClientSecret();
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.clientId,
            clientSecret,
            OAUTH_CONFIG.redirectUri
        );
        oauth2Client.setCredentials({ refresh_token: refreshToken });

        const { credentials } = await oauth2Client.refreshAccessToken();
        console.log('✅ Token refresh successful for:', userEmail);
        
        res.json({
            success: true,
            access_token: credentials.access_token,
            expires_in: credentials.expiry_date,
            token_type: 'Bearer'
        });
    } catch (error) {
        console.error('❌ Token refresh failed:', error);
        if (error.message.includes('invalid_grant')) {
            res.status(401).json({ error: 'Refresh token expired', action: 'reauthentication_required' });
        } else {
            res.status(500).json({ error: 'Token refresh failed', details: error.message });
        }
    }
});

// Root endpoint for health checks
app.get('/', (req, res) => {
    res.status(200).send('OAuth service is running.');
});

// --- Server Start ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 OAuth service running on port ${PORT}`);
});
