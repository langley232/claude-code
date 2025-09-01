const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { google } = require('googleapis');
const cors = require('cors')({origin: true});

const secretManager = new SecretManagerServiceClient();

// OAuth Configuration
const OAUTH_CONFIG = {
    clientId: '609535336419-nar9fcv646la5lne0h10n2dcdmlm7qak.apps.googleusercontent.com',
    redirectUri: 'https://oauthtest-qjyr5poabq-uc.a.run.app/auth/google/callback',
    scopes: [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ]
};

// Main OAuth handler
const oauthHandler = async (req, res) => {
    console.log('🔑 OAuth Test function called:', { method: req.method, path: req.path });
    
    try {
        const path = req.path || '/';
        
        if (path.includes('/auth/google/callback')) {
            await handleGoogleCallback(req, res);
        } else if (path.includes('/auth/google/start')) {
            await handleGoogleStart(req, res);
        } else {
            res.status(404).json({ error: 'Endpoint not found', path: path });
        }
    } catch (error) {
        console.error('❌ OAuth handler error:', error);
        res.status(500).json({ 
            error: 'OAuth handler failed', 
            details: error.message 
        });
    }
};

// Handle Google OAuth callback with authorization code
async function handleGoogleCallback(req, res) {
    console.log('🔑 Handling Google OAuth callback');
    
    try {
        const { code, state, error } = req.query;
        
        if (error) {
            console.error('❌ OAuth error:', error);
            return res.redirect(`http://localhost:3000/email-assistant.html?oauth=error&error=${error}`);
        }
        
        if (!code) {
            console.error('❌ No authorization code received');
            return res.status(400).json({ error: 'No authorization code received' });
        }
        
        console.log('🔑 Exchanging authorization code for tokens...');
        
        // Get client secret from Secret Manager
        const clientSecret = await getGoogleClientSecret();
        console.log('🔑 Client ID:', OAUTH_CONFIG.clientId);
        console.log('🔑 Client Secret length:', clientSecret ? clientSecret.length : 'NOT FOUND');
        console.log('🔑 Redirect URI:', OAUTH_CONFIG.redirectUri);
        
        // Create OAuth2 client
        const oauth2Client = new google.auth.OAuth2(
            OAUTH_CONFIG.clientId,
            clientSecret,
            OAUTH_CONFIG.redirectUri
        );
        
        // Exchange authorization code for tokens
        const { tokens } = await oauth2Client.getToken(code);
        console.log('✅ Token exchange successful');
        
        // Get user info
        oauth2Client.setCredentials(tokens);
        const oauth2 = google.oauth2({ version: 'v2', auth: oauth2Client });
        const { data: userInfo } = await oauth2.userinfo.get();
        
        console.log('👤 User info retrieved:', userInfo.email);
        
        // Store refresh token in Secret Manager
        if (tokens.refresh_token) {
            await storeRefreshToken(userInfo.email, tokens.refresh_token);
            console.log('✅ Refresh token stored successfully');
        } else {
            console.warn('⚠️ No refresh token received - user may need to re-consent');
        }
        
        // Redirect to success page
        const successUrl = `https://atlasweb.info/email-assistant.html?oauth=success&email=${encodeURIComponent(userInfo.email)}&status=ready`;
        console.log('🔄 Redirecting to success page:', successUrl);
        
        res.redirect(successUrl);
        
    } catch (error) {
        console.error('❌ OAuth callback failed:', error);
        res.status(500).json({ 
            error: 'OAuth callback failed', 
            details: error.message 
        });
    }
}

// Handle Google OAuth start
async function handleGoogleStart(req, res) {
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
            prompt: 'consent', // Force consent to get refresh token
            state: 'oauth_' + Date.now()
        });
        
        console.log('🔄 Redirecting to Google OAuth:', authUrl);
        res.redirect(authUrl);
        
    } catch (error) {
        console.error('❌ OAuth start failed:', error);
        res.status(500).json({ 
            error: 'OAuth start failed', 
            details: error.message 
        });
    }
}

// Get Google client secret from Secret Manager
async function getGoogleClientSecret() {
    try {
        const [secret] = await secretManager.accessSecretVersion({
            name: 'projects/609535336419/secrets/google-oauth-client-secret/versions/latest'
        });
        return secret.payload.data.toString();
    } catch (error) {
        console.error('❌ Failed to get Google client secret:', error);
        throw new Error('Failed to retrieve Google client secret');
    }
}

// Store refresh token in Secret Manager
async function storeRefreshToken(userEmail, refreshToken) {
    try {
        const userIdClean = userEmail.replace('@', '_').replace(/\./g, '_');
        const secretName = `projects/609535336419/secrets/user-refresh-token-${userIdClean}`;
        
        // Try to add a new version to existing secret
        try {
            await secretManager.addSecretVersion({
                parent: secretName,
                payload: {
                    data: Buffer.from(refreshToken, 'utf8')
                }
            });
            console.log(`✅ Added new version to existing secret: user-refresh-token-${userIdClean}`);
        } catch (addError) {
            // If secret doesn't exist, create it first
            if (addError.code === 5) { // NOT_FOUND
                console.log(`🔧 Creating new secret: user-refresh-token-${userIdClean}`);
                
                await secretManager.createSecret({
                    parent: 'projects/609535336419',
                    secretId: `user-refresh-token-${userIdClean}`,
                    secret: {
                        replication: {
                            automatic: {}
                        }
                    }
                });
                
                // Now add the version
                await secretManager.addSecretVersion({
                    parent: secretName,
                    payload: {
                        data: Buffer.from(refreshToken, 'utf8')
                    }
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

// Wrap with CORS
functions.http('oauthTest', (req, res) => {
    cors(req, res, () => {
        oauthHandler(req, res);
    });
});