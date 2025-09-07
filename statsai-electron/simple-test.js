const functions = require('@google-cloud/functions-framework');
const { google } = require('googleapis');

// Simple OAuth test function
functions.http('simpleOAuthTest', async (req, res) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    
    if (req.method === 'OPTIONS') {
        return res.status(204).send('');
    }
    
    const { code } = req.query;
    
    if (!code) {
        // Start OAuth flow
        const clientId = process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID";
        const redirectUri = "https://us-central1-solid-topic-466217-t9.cloudfunctions.net/simpleOAuthTest";
        
        const authUrl = `https://accounts.google.com/o/oauth2/auth?` +
            `client_id=${encodeURIComponent(clientId)}&` +
            `redirect_uri=${encodeURIComponent(redirectUri)}&` +
            `scope=${encodeURIComponent('https://www.googleapis.com/auth/gmail.readonly')}&` +
            `response_type=code&` +
            `access_type=offline&` +
            `prompt=consent`;
            
        return res.redirect(authUrl);
    }
    
    // Handle callback
    try {
        const oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID || "YOUR_GOOGLE_CLIENT_ID",
            process.env.GOOGLE_CLIENT_SECRET || "YOUR_GOOGLE_CLIENT_SECRET",
            "https://us-central1-solid-topic-466217-t9.cloudfunctions.net/simpleOAuthTest"
        );
        
        console.log('Testing token exchange with hardcoded credentials...');
        const { tokens } = await oauth2Client.getToken(code);
        
        res.json({
            success: true,
            message: 'OAuth successful!',
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
});