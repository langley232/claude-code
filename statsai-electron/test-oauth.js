const { google } = require('googleapis');

// Test the exact same OAuth flow as the Cloud Function
async function testTokenExchange() {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const redirectUri = "https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/auth/google/callback";

    // Test authorization URL generation
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        redirectUri
    );

    const scopes = [
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.metadata',
        'https://www.googleapis.com/auth/userinfo.email',
        'https://www.googleapis.com/auth/userinfo.profile'
    ];

    // Generate authorization URL
    const authUrl = oauth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: scopes,
        prompt: 'consent'
    });

    console.log('Generated Auth URL:', authUrl);
    console.log('\nConfiguration:');
    console.log('Client ID:', clientId);
    console.log('Client Secret ending:', clientSecret.slice(-4));
    console.log('Redirect URI:', redirectUri);
    console.log('\nThis should match what the Cloud Function is using.');
    
    // Test if we can get the OAuth2 client configuration without errors
    try {
        const authCheck = oauth2Client.getToken;
        console.log('\n✅ OAuth2 client configured successfully');
    } catch (error) {
        console.log('\n❌ OAuth2 client configuration error:', error.message);
    }
}

testTokenExchange().catch(console.error);