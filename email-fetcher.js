const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');
const axios = require('axios');
const cors = require('cors')({origin: true});

const secretManager = new SecretManagerServiceClient();
const pubsub = new PubSub();

// Main function logic
const emailFetcherLogic = async (req, res) => {
    console.log('📧 Email Fetcher triggered:', { method: req.method, body: req.body });
    
    try {
        const { userEmail, initialSync = true, provider = 'google' } = req.body;
        
        if (!userEmail) {
            return res.status(400).json({ error: 'User email required' });
        }

        if (provider === 'microsoft') {
            // Handle Microsoft email fetching
            const userIdClean = userEmail.replace(/[@.]/g, '_');
            const refreshToken = await getMicrosoftRefreshToken(userIdClean);
            if (!refreshToken) {
                return res.status(404).json({ error: 'No Microsoft refresh token found for user' });
            }
            
            const accessToken = await getMicrosoftAccessToken(refreshToken);
            const messages = await fetchMicrosoftEmails(accessToken);
            
            // Publish Microsoft emails to Pub/Sub
            const publishPromises = messages.map(message => {
                const messageData = { userEmail, provider, message };
                return pubsub.topic('emails-to-process').publishMessage({ data: Buffer.from(JSON.stringify(messageData)) });
            });
            await Promise.all(publishPromises);

            return res.json({ success: true, message: `Queued ${messages.length} Microsoft emails for processing.` });

        } else {
            // Handle Google email fetching
            const userIdClean = userEmail.replace('@', '_').replace(/\./g, '_');
            const refreshToken = await getRefreshToken(userIdClean);
            
            if (!refreshToken) {
                return res.status(404).json({ 
                    error: 'No refresh token found for user',
                    userEmail,
                    suggestion: 'Complete OAuth flow first'
                });
            }
            
            const gmail = await initializeGmailClient(refreshToken);
            
            let messageIds;
            if (initialSync) {
                messageIds = await fetchInitialEmails(gmail, userEmail);
            } else {
                messageIds = await fetchNewEmails(gmail, userEmail);
            }
            
            if (messageIds.length === 0) {
                return res.json({
                    success: true,
                    message: 'No emails to process',
                    count: 0,
                    userEmail
                });
            }
            
            const publishPromises = messageIds.map(messageId => 
                publishToProcessingQueue(userEmail, messageId)
            );
            
            await Promise.all(publishPromises);
            
            await publishProgressUpdate(userEmail, {
                type: 'fetch_complete',
                count: messageIds.length,
                status: 'queued_for_processing'
            });
            
            res.json({
                success: true,
                message: 'Emails queued for processing',
                count: messageIds.length,
                userEmail,
                syncType: initialSync ? 'initial' : 'incremental'
            });
        }
        
    } catch (error) {
        console.error('❌ Email fetcher error:', error);
        res.status(500).json({
            error: 'Email fetching failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

async function getMicrosoftAccessToken(refreshToken) {
    const tenantId = '9cef4078-3934-49cd-b448-c0d1d2f482fc';
    const clientId = '1701d37c-ee90-45e5-8476-1d235cab71a0';
    const clientSecret = await getMicrosoftClientSecret();

    const tokenUrl = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`;
    
    const params = new URLSearchParams();
    params.append('client_id', clientId);
    params.append('scope', 'https://graph.microsoft.com/Mail.Read offline_access');
    params.append('refresh_token', refreshToken);
    params.append('grant_type', 'refresh_token');
    params.append('client_secret', clientSecret);

    const response = await axios.post(tokenUrl, params, {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    return response.data.access_token;
}

async function fetchMicrosoftEmails(accessToken, maxResults = 50) {
    const response = await axios.get(`https://graph.microsoft.com/v1.0/me/messages?$top=${maxResults}&$select=id,subject,from,receivedDateTime,bodyPreview,isRead`, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    return response.data.value;
}

// Wrap the main logic with the CORS middleware
functions.http('emailFetcher', (req, res) => {
    cors(req, res, () => {
        emailFetcherLogic(req, res);
    });
});

// Get refresh token from Secret Manager
async function getRefreshToken(userId) {
    try {
        const [secret] = await secretManager.accessSecretVersion({
            name: `projects/609535336419/secrets/user-refresh-token-${userId}/versions/latest`
        });
        
        return secret.payload.data.toString();
    } catch (error) {
        console.error(`❌ Failed to get refresh token for ${userId}:`, error.message);
        return null;
    }
}

// Initialize Gmail API client with refresh token
async function initializeGmailClient(refreshToken) {
    const { google } = require('googleapis');
    // Get OAuth credentials
    const [clientIdSecret] = await secretManager.accessSecretVersion({
        name: 'projects/609535336419/secrets/google-oauth-client-id/versions/latest'
    });
    
    const [clientSecretSecret] = await secretManager.accessSecretVersion({
        name: 'projects/609535336419/secrets/google-oauth-client-secret/versions/latest'
    });
    
    const clientId = clientIdSecret.payload.data.toString();
    const clientSecret = clientSecretSecret.payload.data.toString();
    
    // Create OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
        clientId,
        clientSecret,
        'https://us-central1-solid-topic-466217-t9.cloudfunctions.net/oauthTest/auth/google/callback'
    );
    
    // Set refresh token
    oauth2Client.setCredentials({
        refresh_token: refreshToken
    });
    
    // Create Gmail client
    const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
    
    return gmail;
}

// Fetch initial emails (for first sync)
async function fetchInitialEmails(gmail, userEmail) {
    console.log(`📥 Starting initial email fetch for ${userEmail}`);
    
    const messageIds = [];
    let pageToken = null;
    let totalFetched = 0;
    const maxEmails = 50; // Limit for initial sync - for testing functionality
    
    do {
        try {
            const response = await gmail.users.messages.list({
                userId: 'me',
                maxResults: 100, // Gmail API limit per request
                pageToken: pageToken,
                q: '-in:chats' // Exclude chat messages
            });
            
            const messages = response.data.messages || [];
            messages.forEach(msg => messageIds.push(msg.id));
            
            totalFetched += messages.length;
            pageToken = response.data.nextPageToken;
            
            console.log(`📊 Fetched ${totalFetched} emails so far...`);
            
            // Respect rate limits and avoid overwhelming the system
            if (totalFetched >= maxEmails) {
                console.log(`📈 Reached max email limit (${maxEmails}) for initial sync`);
                break;
            }
            
        } catch (error) {
            console.error('❌ Error fetching email batch:', error);
            break;
        }
        
    } while (pageToken);
    
    console.log(`✅ Initial fetch complete: ${messageIds.length} emails for ${userEmail}`);
    return messageIds;
}

// Fetch new emails (for incremental sync)
async function fetchNewEmails(gmail, userEmail) {
    console.log(`📨 Fetching new emails for ${userEmail}`);
    
    try {
        // For incremental sync, get emails from last 24 hours
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
        const query = `after:${Math.floor(yesterday.getTime() / 1000)} -in:chats`;
        
        const response = await gmail.users.messages.list({
            userId: 'me',
            maxResults: 100,
            q: query
        });
        
        const messages = response.data.messages || [];
        const messageIds = messages.map(msg => msg.id);
        
        console.log(`✅ Found ${messageIds.length} new emails for ${userEmail}`);
        return messageIds;
        
    } catch (error) {
        console.error('❌ Error fetching new emails:', error);
        return [];
    }
}

// Publish message to processing queue
async function publishToProcessingQueue(userEmail, messageId) {
    const topic = pubsub.topic('emails-to-process');
    
    const messageData = {
        userEmail,
        messageId,
        timestamp: new Date().toISOString(),
        source: 'email-fetcher'
    };
    
    const dataBuffer = Buffer.from(JSON.stringify(messageData));
    
    try {
        await topic.publishMessage({ data: dataBuffer });
        console.log(`📤 Queued message ${messageId} for processing`);
    } catch (error) {
        console.error(`❌ Failed to queue message ${messageId}:`, error);
        throw error;
    }
}

// Get Microsoft refresh token from Secret Manager
async function getMicrosoftRefreshToken(userId) {
    try {
        const [secret] = await secretManager.accessSecretVersion({
            name: `projects/609535336419/secrets/microsoft-refresh-token-${userId}/versions/latest`
        });
        return secret.payload.data.toString();
    } catch (error) {
        console.error(`❌ Failed to get Microsoft refresh token for ${userId}:`, error.message);
        return null;
    }
}

// Get Microsoft client secret from Secret Manager
async function getMicrosoftClientSecret() {
    try {
        const [secret] = await secretManager.accessSecretVersion({
            name: 'projects/609535336419/secrets/microsoft-client-secret/versions/latest'
        });
        return secret.payload.data.toString();
    } catch (error) {
        console.error('❌ Failed to get Microsoft client secret:', error.message);
        throw error;
    }
}

// Publish progress update
async function publishProgressUpdate(userEmail, progressData) {
    const topic = pubsub.topic('frontend-updates');
    
    const updateData = {
        userEmail,
        type: 'progress_update',
        data: progressData,
        timestamp: new Date().toISOString()
    };
    
    const dataBuffer = Buffer.from(JSON.stringify(updateData));
    
    try {
        await topic.publishMessage({ data: dataBuffer });
        console.log(`📢 Published progress update for ${userEmail}`);
    } catch (error) {
        console.error(`❌ Failed to publish progress update:`, error);
    }
}