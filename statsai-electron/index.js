const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { google } = require('googleapis');
const cors = require('cors')({origin: true});

const secretManager = new SecretManagerServiceClient();

// Register HTTP function
functions.http('oauthTest', (req, res) => {
    cors(req, res, async () => {
        const path = req.path || req.url;
        console.log('OAuth Test Request:', { method: req.method, path, query: req.query });
        
        try {
            if (path === '/auth/google/callback') {
                return await handleOAuthCallback(req, res);
            } else if (path === '/auth/google/start') {
                return handleOAuthStart(req, res);
            } else if (path === '/simple-test') {
                return handleSimpleTest(req, res);
            } else if (path === '/test' || path === '/') {
                return res.json({ 
                    status: 'OAuth Test Service Active',
                    endpoints: {
                        start: '/auth/google/start',
                        callback: '/auth/google/callback',
                        simpleTest: '/simple-test'
                    },
                    timestamp: new Date().toISOString()
                });
            } else {
                return res.status(404).json({ error: 'Endpoint not found', path });
            }
        } catch (error) {
            console.error('OAuth Test Error:', error);
            return res.status(500).json({ 
                error: 'Internal server error', 
                details: error.message 
            });
        }
    });
});

async function handleOAuthStart(req, res) {
    const clientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
    const redirectUri = "https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/auth/google/callback";
    const scope = "https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.metadata https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile";
    const state = `test-${Date.now()}`;

    const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
        `client_id=${encodeURIComponent(clientId)}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `scope=${encodeURIComponent(scope)}&` +
        `response_type=code&` +
        `state=${encodeURIComponent(state)}&` +
        `access_type=offline&` +
        `prompt=consent`;

    res.redirect(authUrl);
}

async function handleOAuthCallback(req, res) {
    const { code, state, error } = req.query;
    
    if (error) {
        console.error('OAuth error:', error);
        return res.status(400).json({ error: 'OAuth authorization failed', details: error });
    }

    if (!code) {
        return res.status(400).json({ error: 'No authorization code received' });
    }

    console.log('OAuth callback received:', { code: code.substring(0, 10) + '...', state });

    try {
        // Use hardcoded credentials that we know work
        const clientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET";

        // Create OAuth2 client  
        const oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret,
            'https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/auth/google/callback'
        );

        // Exchange authorization code for tokens
        console.log('Attempting token exchange with code:', code.substring(0, 10) + '...');
        console.log('Using client_id:', clientId);
        console.log('Using client_secret:', clientSecret ? 'Present' : 'Missing');
        console.log('Using redirect_uri:', 'https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/auth/google/callback');
        
        const tokenResponse = await oauth2Client.getToken(code);
        const tokens = tokenResponse.tokens;
        console.log('Tokens received successfully:', Object.keys(tokens));

        // Skip Gmail API test for now - just store the refresh token
        oauth2Client.setCredentials(tokens);
        
        // Extract email from id_token instead of API call
        let userEmail = 'unknown_user';
        if (tokens.id_token) {
            try {
                // Decode JWT token to get email (simple base64 decode of payload)
                const payload = JSON.parse(Buffer.from(tokens.id_token.split('.')[1], 'base64').toString());
                userEmail = payload.email || 'unknown_user';
                console.log('User email from ID token:', userEmail);
            } catch (e) {
                console.warn('Failed to decode ID token, using fallback');
            }
        }

        // Store refresh token for this user
        const userId = userEmail.replace('@', '_').replace(/\./g, '_');
        if (tokens.refresh_token) {
            try {
                await secretManager.secretVersionsAdd({
                    parent: `projects/solid-topic-466217-t9/secrets/user-refresh-token-${userId}`,
                    payload: {
                        data: Buffer.from(tokens.refresh_token),
                    },
                });
                console.log('✅ Refresh token stored for user:', userId);
            } catch (error) {
                // Create secret if it doesn't exist
                try {
                    await secretManager.createSecret({
                        parent: 'projects/solid-topic-466217-t9',
                        secretId: `user-refresh-token-${userId}`,
                        secret: {
                            replication: { automatic: {} }
                        }
                    });
                    await secretManager.secretVersionsAdd({
                        parent: `projects/solid-topic-466217-t9/secrets/user-refresh-token-${userId}`,
                        payload: {
                            data: Buffer.from(tokens.refresh_token),
                        },
                    });
                    console.log('✅ Created new secret and stored refresh token for user:', userId);
                } catch (createError) {
                    console.error('❌ Failed to store refresh token:', createError.message);
                }
            }
        }

        // Redirect back to IONOS frontend with success
        const redirectUrl = new URL('https://atlasweb.info/email-assistant.html');
        redirectUrl.searchParams.set('oauth', 'success');
        redirectUrl.searchParams.set('email', userEmail);
        redirectUrl.searchParams.set('status', 'ready');
        
        res.redirect(redirectUrl.toString());

    } catch (error) {
        console.error('OAuth callback error:', error);
        res.status(500).json({ 
            error: 'OAuth callback failed', 
            details: error.message
        });
    }
}

async function handleSimpleTest(req, res) {
    const { code } = req.query;
    
    if (!code) {
        // Start OAuth flow with direct credentials
        const clientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
        const redirectUri = "https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/simple-test";
        
        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly')}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `prompt=consent`;
            
        return res.redirect(authUrl);
    }
    
    // Handle callback with hardcoded credentials
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
            process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
            "https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/simple-test"
        );
        
        console.log('Simple test: Attempting token exchange with hardcoded credentials...');
        const { tokens } = await oauth2Client.getToken(code);
        
        res.json({
            success: true,
            message: 'OAuth successful with hardcoded credentials!',
            tokens: Object.keys(tokens),
            hasRefreshToken: !!tokens.refresh_token
        });
        
    } catch (error) {
        console.error('Simple OAuth test error:', error);
        res.json({
            success: false,
            error: error.message,
            details: error.response?.data || 'No additional details'
        });
    }
}