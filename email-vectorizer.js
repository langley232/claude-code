const functions = require('@google-cloud/functions-framework');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { PubSub } = require('@google-cloud/pubsub');
const { Storage } = require('@google-cloud/storage');
const { google } = require('googleapis');
const { simpleParser } = require('mailparser');
const cheerio = require('cheerio');

const secretManager = new SecretManagerServiceClient();
const pubsub = new PubSub();
const storage = new Storage();

// Pub/Sub triggered function for email vectorization
functions.cloudEvent('emailVectorizer', async (cloudEvent) => {
    console.log('🔄 Email Vectorizer triggered:', cloudEvent.data);
    
    try {
        // Parse Pub/Sub message
        const messageData = JSON.parse(
            Buffer.from(cloudEvent.data.message.data, 'base64').toString()
        );
        
        const { userEmail, messageId } = messageData;
        
        if (!userEmail || !messageId) {
            console.error('❌ Missing required fields:', { userEmail, messageId });
            return;
        }
        
        console.log(`📧 Processing email ${messageId} for ${userEmail}`);
        
        // Step 1: Fetch email content
        const emailContent = await fetchEmailContent(userEmail, messageId);
        
        if (!emailContent) {
            console.error(`❌ Failed to fetch email content for ${messageId}`);
            return;
        }
        
        // Step 2: Store raw email in GCS
        await storeRawEmail(userEmail, messageId, emailContent.raw);
        
        // Step 3: Parse and process email
        const parsedEmail = await parseEmailContent(emailContent);
        
        // Step 4: Generate text chunks for vectorization
        const textChunks = generateTextChunks(parsedEmail, messageId);
        
        // Step 5: Generate embeddings (mock for now - will add Vertex AI)
        const embeddings = await generateEmbeddings(textChunks);
        
        // Step 6: Store in vector database (mock for now)
        await storeInVectorDB(userEmail, messageId, parsedEmail, embeddings);
        
        // Step 7: Publish progress update
        await publishProgressUpdate(userEmail, {
            type: 'email_processed',
            messageId,
            status: 'completed',
            chunks: textChunks.length
        });
        
        console.log(`✅ Successfully processed email ${messageId} for ${userEmail}`);
        
    } catch (error) {
        console.error('❌ Email vectorization failed:', error);
        
        // Publish error update
        const messageData = JSON.parse(
            Buffer.from(cloudEvent.data.message.data, 'base64').toString()
        );
        
        await publishProgressUpdate(messageData.userEmail, {
            type: 'email_processing_error',
            messageId: messageData.messageId,
            error: error.message
        });
        
        throw error; // This will cause message to go to DLQ
    }
});

// Fetch email content from Gmail API
async function fetchEmailContent(userEmail, messageId) {
    try {
        // Get user's refresh token
        const userIdClean = userEmail.replace('@', '_').replace(/\./g, '_');
        const refreshToken = await getRefreshToken(userIdClean);
        
        if (!refreshToken) {
            throw new Error(`No refresh token found for user ${userEmail}`);
        }
        
        // Initialize Gmail client
        const gmail = await initializeGmailClient(refreshToken);
        
        // Fetch email with full content
        const response = await gmail.users.messages.get({
            userId: 'me',
            id: messageId,
            format: 'full' // Get full email including body
        });
        
        return {
            raw: response.data,
            message: response.data
        };
        
    } catch (error) {
        console.error(`❌ Failed to fetch email ${messageId}:`, error);
        return null;
    }
}

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

// Initialize Gmail API client
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
    
    return google.gmail({ version: 'v1', auth: oauth2Client });
}

// Store raw email in GCS
async function storeRawEmail(userEmail, messageId, rawEmail) {
    try {
        const bucket = storage.bucket('atlasweb-emails-raw-solid-topic-466217-t9');
        const fileName = `${userEmail}/${messageId}.json`;
        const file = bucket.file(fileName);
        
        await file.save(JSON.stringify(rawEmail, null, 2), {
            metadata: {
                contentType: 'application/json',
                metadata: {
                    userEmail,
                    messageId,
                    processedAt: new Date().toISOString()
                }
            }
        });
        
        console.log(`💾 Stored raw email: ${fileName}`);
    } catch (error) {
        console.error(`❌ Failed to store raw email ${messageId}:`, error);
        throw error;
    }
}

// Parse email content
async function parseEmailContent(emailContent) {
    const message = emailContent.message;
    
    // Extract basic metadata
    const headers = {};
    if (message.payload && message.payload.headers) {
        message.payload.headers.forEach(header => {
            headers[header.name.toLowerCase()] = header.value;
        });
    }
    
    // Extract body content
    let bodyText = '';
    let bodyHtml = '';
    
    if (message.payload) {
        const extracted = extractBodyFromPayload(message.payload);
        bodyText = extracted.text;
        bodyHtml = extracted.html;
    }
    
    // Clean HTML content
    if (bodyHtml && !bodyText) {
        bodyText = cleanHtmlContent(bodyHtml);
    }
    
    return {
        messageId: message.id,
        threadId: message.threadId,
        subject: headers.subject || '',
        from: headers.from || '',
        to: headers.to || '',
        date: headers.date || '',
        bodyText: bodyText || '',
        bodyHtml: bodyHtml || '',
        snippet: message.snippet || '',
        labels: message.labelIds || []
    };
}

// Extract body from Gmail payload structure
function extractBodyFromPayload(payload) {
    let text = '';
    let html = '';
    
    if (payload.body && payload.body.data) {
        // Single part message
        const decoded = Buffer.from(payload.body.data, 'base64').toString();
        if (payload.mimeType === 'text/html') {
            html = decoded;
        } else {
            text = decoded;
        }
    } else if (payload.parts) {
        // Multi-part message
        payload.parts.forEach(part => {
            if (part.mimeType === 'text/plain' && part.body && part.body.data) {
                text += Buffer.from(part.body.data, 'base64').toString();
            } else if (part.mimeType === 'text/html' && part.body && part.body.data) {
                html += Buffer.from(part.body.data, 'base64').toString();
            } else if (part.parts) {
                // Nested parts
                const nested = extractBodyFromPayload(part);
                text += nested.text;
                html += nested.html;
            }
        });
    }
    
    return { text, html };
}

// Clean HTML content to extract text
function cleanHtmlContent(html) {
    try {
        const $ = cheerio.load(html);
        
        // Remove script and style elements
        $('script, style, meta, link').remove();
        
        // Get text content
        let text = $('body').length ? $('body').text() : $.text();
        
        // Clean up whitespace
        text = text.replace(/\s+/g, ' ').trim();
        
        return text;
    } catch (error) {
        console.error('❌ Failed to clean HTML:', error);
        return html; // Return original if cleaning fails
    }
}

// Generate text chunks for vectorization
function generateTextChunks(parsedEmail, messageId) {
    const chunks = [];
    const maxChunkSize = 500; // words per chunk
    const overlapSize = 50; // word overlap between chunks
    
    // Combine subject and body for processing
    const fullText = `Subject: ${parsedEmail.subject}\n\nFrom: ${parsedEmail.from}\n\nContent: ${parsedEmail.bodyText}`;
    
    if (!fullText.trim()) {
        console.warn(`⚠️ Empty email content for ${messageId}`);
        return [];
    }
    
    // Split into words
    const words = fullText.split(/\s+/).filter(word => word.length > 0);
    
    if (words.length <= maxChunkSize) {
        // Email is small enough to be one chunk
        chunks.push({
            chunkId: `${messageId}-001`,
            text: fullText,
            wordCount: words.length,
            chunkIndex: 0,
            totalChunks: 1
        });
    } else {
        // Split into multiple chunks with overlap
        let chunkIndex = 0;
        let startIndex = 0;
        
        while (startIndex < words.length) {
            const endIndex = Math.min(startIndex + maxChunkSize, words.length);
            const chunkWords = words.slice(startIndex, endIndex);
            const chunkText = chunkWords.join(' ');
            
            chunks.push({
                chunkId: `${messageId}-${String(chunkIndex + 1).padStart(3, '0')}`,
                text: chunkText,
                wordCount: chunkWords.length,
                chunkIndex: chunkIndex,
                totalChunks: 0 // Will be updated after all chunks are created
            });
            
            chunkIndex++;
            startIndex = endIndex - overlapSize; // Create overlap
        }
        
        // Update total chunks count
        chunks.forEach(chunk => {
            chunk.totalChunks = chunks.length;
        });
    }
    
    console.log(`📝 Generated ${chunks.length} chunks for email ${messageId}`);
    return chunks;
}

// Generate embeddings (mock implementation - will add Vertex AI)
async function generateEmbeddings(textChunks) {
    console.log(`🧠 Generating embeddings for ${textChunks.length} chunks...`);
    
    // Mock embeddings for now (768-dimensional vectors)
    const embeddings = textChunks.map(chunk => ({
        chunkId: chunk.chunkId,
        embedding: Array.from({ length: 768 }, () => Math.random() - 0.5), // Mock embedding
        text: chunk.text,
        wordCount: chunk.wordCount
    }));
    
    console.log(`✅ Generated ${embeddings.length} embeddings`);
    return embeddings;
}

// Store in vector database (mock implementation)
async function storeInVectorDB(userEmail, messageId, parsedEmail, embeddings) {
    console.log(`💾 Storing ${embeddings.length} vectors for email ${messageId}`);
    
    // Mock storage - in production this would use Vertex AI Vector Search
    const vectorData = {
        messageId,
        userEmail,
        metadata: {
            threadId: parsedEmail.threadId,
            subject: parsedEmail.subject,
            from: parsedEmail.from,
            to: parsedEmail.to,
            date: parsedEmail.date,
            labels: parsedEmail.labels
        },
        embeddings: embeddings.map(emb => ({
            chunkId: emb.chunkId,
            vector: emb.embedding,
            text: emb.text.substring(0, 200) + '...', // Store preview only
            wordCount: emb.wordCount
        }))
    };
    
    // Store in GCS bucket for now (simulating vector DB)
    try {
        const bucket = storage.bucket('atlasweb-emails-raw-solid-topic-466217-t9-vertex-index');
        const fileName = `vectors/${userEmail}/${messageId}.json`;
        const file = bucket.file(fileName);
        
        await file.save(JSON.stringify(vectorData, null, 2), {
            metadata: {
                contentType: 'application/json',
                metadata: {
                    userEmail,
                    messageId,
                    vectorCount: embeddings.length,
                    processedAt: new Date().toISOString()
                }
            }
        });
        
        console.log(`✅ Stored vector data: ${fileName}`);
    } catch (error) {
        console.error(`❌ Failed to store vector data for ${messageId}:`, error);
        throw error;
    }
}

// Publish progress update
async function publishProgressUpdate(userEmail, progressData) {
    const topic = pubsub.topic('frontend-updates');
    
    const updateData = {
        userEmail,
        type: 'vectorization_update',
        data: progressData,
        timestamp: new Date().toISOString()
    };
    
    const dataBuffer = Buffer.from(JSON.stringify(updateData));
    
    try {
        await topic.publishMessage({ data: dataBuffer });
        console.log(`📢 Published vectorization update for ${userEmail}`);
    } catch (error) {
        console.error(`❌ Failed to publish progress update:`, error);
    }
}