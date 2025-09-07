#!/usr/bin/env node

/**
 * Microsoft OAuth AuthHandler Backend for AtlasWeb
 * Dedicated Cloud Run service for Microsoft Entra ID (Azure AD) authentication
 * Separate from Google OAuth service for clean architecture
 */

const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const cors = require('cors');
const express = require('express');

const app = express();
const secretManager = new SecretManagerServiceClient();

// Middleware
app.use(cors({ origin: true }));
app.use(express.json());

// Microsoft OAuth Configuration
const MICROSOFT_CONFIG = {
    clientId: '1701d37c-ee90-45e5-8476-1d235cab71a0',
    tenantId: '9cef4078-3934-49cd-b448-c0d1d2f482fc',
    redirectUri: 'https://atlasweb.info/email-assistant.html',
    scopes: [
        'https://graph.microsoft.com/Mail.Read',
        'https://graph.microsoft.com/User.Read',
        'https://graph.microsoft.com/Mail.ReadBasic',
        'offline_access'
    ],
    tokenEndpoint: `https://login.microsoftonline.com/organizations/oauth2/v2.0/token`,
    profileEndpoint: 'https://graph.microsoft.com/v1.0/me'
};

// --- Helper Functions ---

async function getMicrosoftClientSecret() {
    try {
        const [secret] = await secretManager.accessSecretVersion({
            name: 'projects/solid-topic-466217-t9/secrets/microsoft-oauth-client-secret/versions/latest'
        });
        return secret.payload.data.toString();
    } catch (error) {
        console.error('❌ Failed to get Microsoft client secret:', error);
        throw new Error('Failed to retrieve Microsoft client secret');
    }
}

async function storeUserRefreshToken(userEmail, refreshToken) {
    try {
        const userIdClean = userEmail.replace(/[@.]/g, '_');
        const secretName = `projects/solid-topic-466217-t9/secrets/microsoft-user-refresh-token-${userIdClean}`;
        
        try {
            await secretManager.addSecretVersion({
                parent: secretName,
                payload: { data: Buffer.from(refreshToken, 'utf8') }
            });
            console.log(`✅ Added Microsoft refresh token version: ${userIdClean}`);
        } catch (addError) {
            if (addError.code === 5) { // NOT_FOUND
                console.log(`🔧 Creating new Microsoft secret: microsoft-user-refresh-token-${userIdClean}`);
                await secretManager.createSecret({
                    parent: 'projects/solid-topic-466217-t9',
                    secretId: `microsoft-user-refresh-token-${userIdClean}`,
                    secret: { replication: { automatic: {} } }
                });
                await secretManager.addSecretVersion({
                    parent: secretName,
                    payload: { data: Buffer.from(refreshToken, 'utf8') }
                });
                console.log(`✅ Created Microsoft secret: microsoft-user-refresh-token-${userIdClean}`);
            } else {
                throw addError;
            }
        }
    } catch (error) {
        console.error('❌ Failed to store Microsoft refresh token:', error);
        throw error;
    }
}

// --- Microsoft OAuth Routes ---

// Exchange authorization code for tokens
app.post('/auth/microsoft/token', async (req, res) => {
    console.log('🔑 Microsoft token exchange request received');
    
    try {
        const { code } = req.body;
        if (!code) {
            return res.status(400).json({ error: 'Authorization code is required' });
        }

        console.log('🔄 Exchanging Microsoft authorization code for tokens...');
        const clientSecret = await getMicrosoftClientSecret();
        
        // Exchange code for tokens with Microsoft
        const tokenParams = new URLSearchParams({
            client_id: MICROSOFT_CONFIG.clientId,
            client_secret: clientSecret,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: MICROSOFT_CONFIG.redirectUri,
            scope: MICROSOFT_CONFIG.scopes.join(' ')
        });

        const tokenResponse = await fetch(MICROSOFT_CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: tokenParams.toString()
        });

        const tokenData = await tokenResponse.json();

        if (!tokenResponse.ok) {
            console.error('❌ Microsoft token exchange failed:', tokenData);
            return res.status(400).json({
                error: 'Token exchange failed',
                details: tokenData.error_description || tokenData.error
            });
        }

        console.log('✅ Microsoft token exchange successful');

        // Get user profile to identify user for refresh token storage
        const profileResponse = await fetch(MICROSOFT_CONFIG.profileEndpoint, {
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`
            }
        });

        if (profileResponse.ok) {
            const profile = await profileResponse.json();
            const userEmail = profile.mail || profile.userPrincipalName;
            
            // Store refresh token if provided
            if (tokenData.refresh_token && userEmail) {
                await storeUserRefreshToken(userEmail, tokenData.refresh_token);
            }
        }

        // Return tokens to frontend
        res.json({
            access_token: tokenData.access_token,
            refresh_token: tokenData.refresh_token,
            expires_in: tokenData.expires_in,
            token_type: tokenData.token_type || 'Bearer',
            scope: tokenData.scope
        });

    } catch (error) {
        console.error('❌ Microsoft token exchange failed:', error);
        res.status(500).json({
            error: 'Internal server error during token exchange',
            details: error.message
        });
    }
});

// Refresh Microsoft access token
app.post('/auth/microsoft/refresh', async (req, res) => {
    console.log('🔄 Microsoft token refresh request received');
    
    try {
        const { refresh_token } = req.body;
        if (!refresh_token) {
            return res.status(400).json({ error: 'Refresh token is required' });
        }

        const clientSecret = await getMicrosoftClientSecret();
        
        // Refresh tokens with Microsoft
        const refreshParams = new URLSearchParams({
            client_id: MICROSOFT_CONFIG.clientId,
            client_secret: clientSecret,
            refresh_token: refresh_token,
            grant_type: 'refresh_token',
            scope: MICROSOFT_CONFIG.scopes.join(' ')
        });

        const refreshResponse = await fetch(MICROSOFT_CONFIG.tokenEndpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: refreshParams.toString()
        });

        const refreshData = await refreshResponse.json();

        if (!refreshResponse.ok) {
            console.error('❌ Microsoft token refresh failed:', refreshData);
            return res.status(400).json({
                error: 'Token refresh failed',
                details: refreshData.error_description || refreshData.error
            });
        }

        console.log('✅ Microsoft token refresh successful');

        res.json({
            access_token: refreshData.access_token,
            refresh_token: refreshData.refresh_token || refresh_token, // Some providers don't return new refresh tokens
            expires_in: refreshData.expires_in,
            token_type: refreshData.token_type || 'Bearer',
            scope: refreshData.scope
        });

    } catch (error) {
        console.error('❌ Microsoft token refresh failed:', error);
        res.status(500).json({
            error: 'Internal server error during token refresh',
            details: error.message
        });
    }
});

// Health check endpoint
app.get('/', (req, res) => {
    res.status(200).json({
        service: 'Microsoft OAuth AuthHandler',
        status: 'operational',
        timestamp: new Date().toISOString()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        service: 'Microsoft OAuth AuthHandler',
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});

// --- Server Start ---
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🚀 Microsoft OAuth AuthHandler running on port ${PORT}`);
    console.log(`🔧 Client ID: ${MICROSOFT_CONFIG.clientId}`);
    console.log(`🏢 Tenant ID: ${MICROSOFT_CONFIG.tenantId}`);
    console.log(`🔗 Redirect URI: ${MICROSOFT_CONFIG.redirectUri}`);
});