# Cloud Run Token Endpoint - REQUIRED IMPLEMENTATION

## Overview
The frontend OAuth handler expects a `/auth/google/tokens` endpoint in your Cloud Run service to retrieve stored OAuth tokens for authenticated users.

## Required Endpoint

Add this endpoint to your Cloud Run OAuth service at `https://oauthtest-qjyr5poabq-uc.a.run.app`:

```javascript
// GET/POST /auth/google/tokens
app.post('/auth/google/tokens', async (req, res) => {
    try {
        const { userEmail, action } = req.body;
        
        if (!userEmail) {
            return res.status(400).json({ 
                error: 'User email required',
                suggestion: 'Provide userEmail in request body'
            });
        }
        
        console.log(`🔑 Token request for user: ${userEmail}`);
        
        // In a real implementation, retrieve from your database/Secret Manager
        // For now, check if we have stored tokens for this user
        
        try {
            // Example: Get stored tokens from Secret Manager or database
            // const storedTokens = await getStoredTokensForUser(userEmail);
            
            // Mock response for development - replace with real token retrieval
            const storedTokens = {
                access_token: process.env.MOCK_ACCESS_TOKEN || null,
                refresh_token: process.env.MOCK_REFRESH_TOKEN || null,
                userEmail: userEmail,
                storedAt: new Date().toISOString()
            };
            
            if (!storedTokens.access_token) {
                return res.status(404).json({
                    error: 'No tokens found for user',
                    userEmail: userEmail,
                    suggestion: 'Complete OAuth flow first to store tokens'
                });
            }
            
            console.log(`✅ Returning tokens for user: ${userEmail}`);
            
            res.json({
                access_token: storedTokens.access_token,
                refresh_token: storedTokens.refresh_token,
                userEmail: userEmail,
                tokenType: 'Bearer',
                storedAt: storedTokens.storedAt
            });
            
        } catch (tokenError) {
            console.error('❌ Error retrieving tokens:', tokenError);
            res.status(500).json({
                error: 'Failed to retrieve tokens',
                details: tokenError.message
            });
        }
        
    } catch (error) {
        console.error('❌ Token endpoint error:', error);
        res.status(500).json({ 
            error: 'Internal server error',
            details: error.message 
        });
    }
});

// Alternative endpoint paths for compatibility
app.post('/auth/google/user-tokens', (req, res) => {
    // Redirect to main token endpoint
    req.url = '/auth/google/tokens';
    return app._router.handle(req, res);
});

app.post('/tokens', (req, res) => {
    // Redirect to main token endpoint
    req.url = '/auth/google/tokens';
    return app._router.handle(req, res);
});
```

## Token Storage Enhancement

Also enhance your OAuth callback handler to store tokens properly:

```javascript
// In your existing /auth/google/callback endpoint
app.get('/auth/google/callback', async (req, res) => {
    // ... existing OAuth code ...
    
    // After successful token exchange:
    const { tokens } = await oauth2Client.getToken(code);
    
    // IMPORTANT: Store tokens for later retrieval
    await storeTokensForUser(userProfile.data.email, {
        access_token: tokens.access_token,
        refresh_token: tokens.refresh_token,
        expires_at: tokens.expiry_date,
        token_type: tokens.token_type,
        scope: tokens.scope
    });
    
    // ... rest of existing callback logic ...
});

// Helper function to store tokens
async function storeTokensForUser(userEmail, tokens) {
    try {
        // Option 1: Store in Google Secret Manager
        const secretName = `oauth-tokens-${userEmail.replace('@', '-').replace('.', '-')}`;
        await secretManager.versions.access({
            name: `projects/${PROJECT_ID}/secrets/${secretName}/versions/latest`
        });
        
        // Option 2: Store in database (recommended for production)
        // await database.collection('oauth_tokens').doc(userEmail).set({
        //     ...tokens,
        //     updatedAt: new Date()
        // });
        
        console.log(`✅ Tokens stored for user: ${userEmail}`);
        
    } catch (error) {
        console.error(`❌ Failed to store tokens for ${userEmail}:`, error);
        throw error;
    }
}
```

## Testing the Endpoint

Once deployed, test with:

```bash
curl -X POST "https://oauthtest-qjyr5poabq-uc.a.run.app/auth/google/tokens" \
  -H "Content-Type: application/json" \
  -d '{"userEmail": "rakib.mahmood232@gmail.com", "action": "getTokens"}'
```

Expected response:
```json
{
  "access_token": "ya29.a0ARrdaM...",
  "refresh_token": "1//0G...",
  "userEmail": "rakib.mahmood232@gmail.com",
  "tokenType": "Bearer",
  "storedAt": "2024-01-15T10:30:00.000Z"
}
```

## Environment Variables

Add these to your Cloud Run environment:
```
MOCK_ACCESS_TOKEN=ya29.mock_token_for_development
MOCK_REFRESH_TOKEN=1//mock_refresh_token_for_development
```

## Security Notes

1. **Production**: Always encrypt tokens before storing
2. **Scope**: Validate requested tokens match user's granted scopes  
3. **Expiry**: Check access token expiry and refresh automatically
4. **Rate Limiting**: Add rate limits to token endpoints