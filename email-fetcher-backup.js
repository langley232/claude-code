const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');
const { google } = require('googleapis');
const cors = require('cors')({origin: true});

const secretManager = new SecretManagerServiceClient();
const pubsub = new PubSub();

// Main function logic
const emailFetcherLogic = async (req, res) => {
    console.log('📧 Email Fetcher triggered:', { method: req.method, body: req.body });
    
    try {
        // Extract user email from request (from OAuth success)
        const { userEmail, initialSync = true } = req.body;
        
        if (!userEmail) {
            return res.status(400).json({ error: 'User email required' });
        }
        
        // Fetch stored refresh token for this user
        const userIdClean = userEmail.replace('@', '_').replace(/\./g, '_');
        const refreshToken = await getRefreshToken(userIdClean);
        
        if (!refreshToken) {
            return res.status(404).json({ 
                error: 'No refresh token found for user',
                userEmail,
                suggestion: 'Complete OAuth flow first'
            });
        }
        
        // Initialize Gmail API client
        const gmail = await initializeGmailClient(refreshToken);
        
        // Fetch emails based on sync type
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
        
        // Publish messages to processing queue
        const publishPromises = messageIds.map(messageId => 
            publishToProcessingQueue(userEmail, messageId)
        );
        
        await Promise.all(publishPromises);
        
        // Publish progress update
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
        
    } catch (error) {
        console.error('❌ Email fetcher error:', error);
        res.status(500).json({
            error: 'Email fetching failed',
            details: error.message,
            timestamp: new Date().toISOString()
        });
    }
};

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
            name: `projects/solid-topic-466217-t9/secrets/user-refresh-token-${userId}/versions/latest`
        });
        
        return secret.payload.data.toString();
    } catch (error) {
        console.error(`❌ Failed to get refresh token for ${userId}:`, error.message);
        return null;
    }
}

// Initialize Gmail API client with refresh token
async function initializeGmailClient(refreshToken) {
    // Get OAuth credentials
    const [clientIdSecret] = await secretManager.accessSecretVersion({
        name: 'projects/solid-topic-466217-t9/secrets/google-oauth-client-id/versions/latest'
    });
    
    const [clientSecretSecret] = await secretManager.accessSecretVersion({
        name: 'projects/solid-topic-466217-t9/secrets/google-oauth-client-secret/versions/latest'
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