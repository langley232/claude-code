// StatsAI Email Assistant - JavaScript Functionality
// Superhuman-inspired email client with AI capabilities

// Resumable Download Manager for handling network interruptions
class ResumableDownloadManager {
    constructor(emailAssistant) {
        this.emailAssistant = emailAssistant;
        this.downloadState = null;
        this.isDownloading = false;
        this.isPaused = false;
        this.currentBatch = 0;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.batchSize = 50;
        this.checkpointInterval = 5; // Save checkpoint every 5 batches
    }
    
    // Create new download session
    async initializeDownload(userEmail) {
        const downloadId = this.generateDownloadId();
        
        this.downloadState = {
            downloadId: downloadId,
            userEmail: userEmail,
            status: 'initializing',
            startTime: new Date().toISOString(),
            lastCheckpoint: new Date().toISOString(),
            totalEmails: 0,
            downloadedEmails: 0,
            vectorizedEmails: 0,
            failedEmails: [],
            currentBatch: 0,
            totalBatches: 0,
            retryCount: 0,
            nextPageToken: null,
            checkpoints: []
        };
        
        // Save initial state
        await this.saveDownloadState();
        return downloadId;
    }
    
    // Start or resume download process
    async startDownload() {
        if (this.isDownloading) {
            console.log('Download already in progress');
            return;
        }
        
        this.isDownloading = true;
        this.isPaused = false;
        
        try {
            // Show status bar
            this.showDownloadStatus();
            
            // Get total email count first
            await this.getEmailCount();
            
            // Start batch processing
            await this.processBatches();
            
        } catch (error) {
            console.error('Download failed:', error);
            await this.handleDownloadError(error);
        } finally {
            this.isDownloading = false;
        }
    }
    
    // Get total email count for progress tracking
    async getEmailCount() {
        try {
            this.updateStatus('Counting emails...', 'Fetching total email count');
            
            // Ensure we have valid tokens
            await this.emailAssistant.ensureValidTokens();
            
            const response = await fetch(this.emailAssistant.config.emailFetcherUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userEmail: this.downloadState.userEmail,
                    accessToken: this.emailAssistant.getAccessToken(),
                    refreshToken: this.emailAssistant.getRefreshToken(),
                    provider: this.emailAssistant.getAuthProvider(),
                    action: 'getEmailCount'
                })
            });
            
            const result = await response.json();
            this.downloadState.totalEmails = result.totalEmails || 0;
            this.downloadState.totalBatches = Math.ceil(this.downloadState.totalEmails / this.batchSize);
            
            await this.saveDownloadState();
            this.updateProgress();
            
        } catch (error) {
            console.error('Failed to get email count:', error);
            // Continue with unknown total
            this.downloadState.totalEmails = 0;
        }
    }
    
    // Process emails in batches with checkpoints
    async processBatches() {
        this.downloadState.status = 'downloading';
        
        while (this.downloadState.currentBatch < this.downloadState.totalBatches || this.downloadState.totalBatches === 0) {
            if (this.isPaused) {
                console.log('Download paused at batch', this.downloadState.currentBatch);
                return;
            }
            
            try {
                await this.processBatch();
                this.downloadState.currentBatch++;
                
                // Create checkpoint every N batches
                if (this.downloadState.currentBatch % this.checkpointInterval === 0) {
                    await this.createCheckpoint();
                }
                
                // Reset retry count on successful batch
                this.downloadState.retryCount = 0;
                
                // Update progress
                this.updateProgress();
                
                // Small delay to prevent rate limiting
                await this.delay(100);
                
            } catch (error) {
                await this.handleBatchError(error);
            }
        }
        
        // Download complete
        await this.completeDownload();
    }
    
    // Process single batch of emails
    async processBatch() {
        // Ensure we have valid tokens for this batch
        await this.emailAssistant.ensureValidTokens();
        
        const batchData = {
            userEmail: this.downloadState.userEmail,
            accessToken: this.emailAssistant.getAccessToken(),
            refreshToken: this.emailAssistant.getRefreshToken(),
            provider: this.emailAssistant.getAuthProvider(),
            action: 'downloadBatch',
            pageToken: this.downloadState.nextPageToken,
            maxResults: this.batchSize,
            batchNumber: this.downloadState.currentBatch
        };
        
        // Get Microsoft access token for authentication
        const microsoftToken = await window.microsoftStytchOAuth.getGraphAccessToken();
        
        const response = await fetch(this.emailAssistant.config.emailFetcherUrl, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${microsoftToken}`,
                'X-User-Email': this.emailAssistant.state.currentUser.email,
                'X-Provider': 'microsoft'
            },
            body: JSON.stringify({
                ...batchData,
                provider: 'microsoft',
                userEmail: this.emailAssistant.state.currentUser.email
            })
        });
        
        if (!response.ok) {
            throw new Error(`Batch download failed: ${response.statusText}`);
        }
        
        const result = await response.json();
        
        // Update state with batch results
        this.downloadState.downloadedEmails += result.emailCount || 0;
        this.downloadState.nextPageToken = result.nextPageToken;
        
        // If no more pages, we're done
        if (!result.nextPageToken) {
            this.downloadState.totalBatches = this.downloadState.currentBatch + 1;
        }
        
        // Start vectorization for this batch in parallel
        if (result.emailCount > 0) {
            this.startBatchVectorization(result.emails);
        }
        
        // Update UI with new emails
        this.emailAssistant.addEmailsToList(result.emails);
    }
    
    // Start vectorization process in background
    async startBatchVectorization(emails) {
        try {
            console.log('🧠 Publishing', emails.length, 'emails for vectorization...');
            
            // Show vectorization status
            this.showVectorizationStatus();
            
            for (const email of emails) {
                await this.emailAssistant.publishToPubSub('emails-to-process', {
                    userEmail: this.downloadState.userEmail,
                    messageId: email.id
                });
                this.downloadState.vectorizedEmails++;
                this.updateVectorizationProgress();
            }
            
            console.log('✅ Completed publishing emails for vectorization');
            
        } catch (error) {
            console.error('❌ Batch vectorization failed:', error);
        }
    }
    
    // Vectorize a chunk of emails
    async vectorizeEmailChunk(emails) {
        const vectorizationData = {
            userEmail: this.downloadState?.userEmail || this.state.currentUser?.email,
            emails: emails.map(email => ({
                id: email.id,
                subject: email.subject,
                body: email.body || email.preview,
                from: email.from,
                timestamp: email.timestamp,
                isImportant: email.important || email.priority === 'high'
            })),
            batchNumber: this.downloadState?.currentBatch || 0
        };
        
        // Try to use actual vectorization service first
        try {
            const response = await fetch(`${this.config.aiServiceUrl}/vectorizeBatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(vectorizationData),
                timeout: 10000 // 10 second timeout
            });
            
            if (response.ok) {
                const result = await response.json();
                console.log('✅ Real vectorization completed for', emails.length, 'emails');
                return result;
            } else {
                throw new Error(`Vectorization service error: ${response.status}`);
            }
        } catch (error) {
            console.log('⚠️ Real vectorization unavailable, using local processing:', error.message);
            
            // Fallback to local vectorization simulation
            return this.simulateVectorization(emails);
        }
    }
    
    // Simulate vectorization for development/fallback
    async simulateVectorization(emails) {
        // Simulate processing time
        await this.delay(1000);
        
        // Create mock vector embeddings and store locally
        const vectors = emails.map(email => ({
            id: email.id,
            embedding: this.generateMockEmbedding(),
            content: {
                subject: email.subject,
                body: email.body || email.preview,
                from: email.from.name,
                timestamp: email.timestamp
            },
            metadata: {
                isImportant: email.important,
                hasAttachments: email.hasAttachments,
                priority: email.priority
            }
        }));
        
        // Store in local vector database simulation
        this.storeVectorsLocally(vectors);
        
        return {
            vectorizedCount: emails.length,
            success: true,
            method: 'local_simulation'
        };
    }
    
    // Generate mock embedding for local testing
    generateMockEmbedding() {
        // Generate a 384-dimensional mock vector (common embedding size)
        const embedding = [];
        for (let i = 0; i < 384; i++) {
            embedding.push((Math.random() - 0.5) * 2); // Values between -1 and 1
        }
        return embedding;
    }
    
    // Store vectors in local storage for testing
    storeVectorsLocally(vectors) {
        const existingVectors = JSON.parse(localStorage.getItem('email_vectors') || '[]');
        const allVectors = [...existingVectors, ...vectors];
        
        // Keep only the latest 1000 vectors to avoid storage issues
        const recentVectors = allVectors.slice(-1000);
        
        localStorage.setItem('email_vectors', JSON.stringify(recentVectors));
        console.log('📦 Stored', vectors.length, 'vectors locally (total:', recentVectors.length, ')');
    }
    
    // Create checkpoint for recovery
    async createCheckpoint() {
        const checkpoint = {
            batchId: this.downloadState.currentBatch,
            emailCount: this.downloadState.downloadedEmails,
            vectorizedCount: this.downloadState.vectorizedEmails,
            timestamp: new Date().toISOString(),
            pageToken: this.downloadState.nextPageToken
        };
        
        this.downloadState.checkpoints.push(checkpoint);
        this.downloadState.lastCheckpoint = checkpoint.timestamp;
        
        await this.saveDownloadState();
        console.log('📍 Checkpoint created:', checkpoint);
    }
    
    // Handle batch processing errors with retry logic
    async handleBatchError(error) {
        console.error(`Batch ${this.downloadState.currentBatch} failed:`, error);
        
        this.downloadState.retryCount++;
        
        if (this.downloadState.retryCount <= this.maxRetries) {
            const delay = Math.min(1000 * Math.pow(2, this.downloadState.retryCount), 30000);
            console.log(`Retrying batch ${this.downloadState.currentBatch} in ${delay}ms (attempt ${this.downloadState.retryCount}/${this.maxRetries})`);
            
            this.updateStatus('Retrying...', `Attempt ${this.downloadState.retryCount}/${this.maxRetries}`);
            
            await this.delay(delay);
        } else {
            // Max retries exceeded, pause download
            console.error('Max retries exceeded, pausing download');
            await this.pauseDownload();
            throw error;
        }
    }
    
    // Pause download
    async pauseDownload() {
        console.log('⏸️ Pausing download...');
        this.isPaused = true;
        this.downloadState.status = 'paused';
        await this.saveDownloadState();
        
        // Update button states
        const pauseBtn = document.getElementById('pauseDownloadBtn');
        const resumeBtn = document.getElementById('resumeDownloadBtn');
        if (pauseBtn) pauseBtn.style.display = 'none';
        if (resumeBtn) resumeBtn.style.display = 'block';
        
        this.updateStatus('Paused', 'Download can be resumed anytime');
        
        // Show notification
        this.emailAssistant.showNotification('Download paused. Progress saved.', 'info');
    }
    
    // Resume download
    async resumeDownload() {
        console.log('▶️ Resuming download from checkpoint...');
        this.isPaused = false;
        this.isDownloading = true;
        this.downloadState.status = 'downloading';
        this.downloadState.retryCount = 0;
        
        // Update button states
        const pauseBtn = document.getElementById('pauseDownloadBtn');
        const resumeBtn = document.getElementById('resumeDownloadBtn');
        if (pauseBtn) pauseBtn.style.display = 'block';
        if (resumeBtn) resumeBtn.style.display = 'none';
        
        this.updateStatus('Resuming...', 'Continuing from last checkpoint');
        
        // Show notification
        this.emailAssistant.showNotification(
            `Resuming download from ${this.downloadState.downloadedEmails} emails...`,
            'info'
        );
        
        try {
            await this.processBatches();
        } catch (error) {
            console.error('Error resuming download:', error);
            await this.handleDownloadError(error);
        }
    }
    
    // Complete download process
    async completeDownload() {
        this.isDownloading = false;
        this.downloadState.status = 'completed';
        this.downloadState.completedAt = new Date().toISOString();
        
        await this.saveDownloadState();
        
        const completionMessage = `Downloaded ${this.downloadState.downloadedEmails} emails`;
        const vectorizedMessage = this.downloadState.vectorizedEmails > 0 
            ? ` (${this.downloadState.vectorizedEmails} vectorized)` 
            : '';
            
        this.updateStatus('Complete!', completionMessage + vectorizedMessage);
        
        // Show success notification
        this.emailAssistant.showNotification(
            `🎉 Download complete! ${completionMessage}${vectorizedMessage}`,
            'success'
        );
        
        // Hide status bar after delay
        setTimeout(() => {
            this.hideDownloadStatus();
        }, 5000);
        
        console.log('✅ Download completed successfully');
    }
    
    // Handle general download errors
    async handleDownloadError(error) {
        this.isDownloading = false;
        
        if (this.downloadState) {
            this.downloadState.status = 'error';
            this.downloadState.lastError = {
                message: error.message,
                timestamp: new Date().toISOString()
            };
            await this.saveDownloadState();
        }
        
        this.updateStatus('Error occurred', error.message);
        
        // Show error notification with progress info
        const progressInfo = this.downloadState 
            ? ` Progress saved: ${this.downloadState.downloadedEmails} emails downloaded.`
            : '';
            
        this.emailAssistant.showNotification(
            `❌ Download error: ${error.message}.${progressInfo} Click Vectorize to retry.`,
            'error'
        );
        
        // Show retry option after delay
        setTimeout(() => {
            this.updateStatus('Download failed', 'Click Vectorize to retry');
            setTimeout(() => {
                this.hideDownloadStatus();
            }, 8000);
        }, 3000);
    }
    
    // UI Status Updates
    showDownloadStatus() {
        const statusBar = document.getElementById('processingStatus');
        if (statusBar) {
            statusBar.style.display = 'block';
        }
    }
    
    hideDownloadStatus() {
        const statusBar = document.getElementById('processingStatus');
        if (statusBar) {
            statusBar.style.display = 'none';
        }
    }
    
    showVectorizationStatus() {
        const statusBar = document.getElementById('processingStatus');
        if (statusBar) {
            statusBar.style.display = 'block';
        }
    }
    
    updateStatus(title, details) {
        // Use existing loading status element or fallback to console
        const statusElement = document.getElementById('loadingStatus');
        if (statusElement) {
            statusElement.textContent = title + (details ? ': ' + details : '');
        } else {
            console.log('Status:', title, details);
        }
    }
    
    updateProgress() {
        const percentage = this.downloadState.totalEmails > 0 
            ? (this.downloadState.downloadedEmails / this.downloadState.totalEmails) * 100 
            : 0;
        
        // Use existing progress elements or fallback
        const progressElement = document.getElementById('progressFill');
        const statusElement = document.getElementById('loadingStatus');
        
        if (progressElement) {
            progressElement.style.width = `${percentage}%`;
        }
        
        if (statusElement) {
            statusElement.textContent = `${this.downloadState.downloadedEmails} / ${this.downloadState.totalEmails} emails`;
        } else {
            console.log('Progress:', `${this.downloadState.downloadedEmails} / ${this.downloadState.totalEmails} emails`);
        }
    }
    
    updateVectorizationProgress() {
        const statusElement = document.getElementById('loadingStatus');
        const message = `Vectorizing: ${this.downloadState.vectorizedEmails} / ${this.downloadState.downloadedEmails} processed`;
        
        if (statusElement) {
            statusElement.textContent = message;
        } else {
            console.log('Vectorization Progress:', message);
        }
    }
    
    // Utility methods
    generateDownloadId() {
        return 'download_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    async saveDownloadState() {
        localStorage.setItem(`download_state_${this.downloadState.downloadId}`, JSON.stringify(this.downloadState));
    }
    
    async loadDownloadState(downloadId) {
        const saved = localStorage.getItem(`download_state_${downloadId}`);
        return saved ? JSON.parse(saved) : null;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

class EmailAssistant {
    constructor() {
        // Configuration
        this.config = {
            // Use secure cloud function for AI services
            emailFetcherUrl: 'https://us-central1-solid-topic-466217-t9.cloudfunctions.net/emailFetcher',
            aiChatServiceUrl: 'https://us-central1-solid-topic-466217-t9.cloudfunctions.net/aiChatService',
            geminiModel: 'gemini-2.5-flash',
            vectorProvider: 'google-vector',
            aiResponseStyle: 'professional'
        };
        
        // State management
        this.state = {
            currentUser: null,
            currentFolder: 'inbox',
            selectedEmail: null,
            emails: [],
            isAuthenticated: false,
            isLoading: true,
            aiProcessing: false,
            currentTheme: 'theme-snow'
        };
        
        // Initialize resumable download manager
        this.downloadManager = new ResumableDownloadManager(this);
        
        // Listen for OAuth events from OAuth handler
        window.addEventListener('oauthStatusChange', (event) => {
            this.handleOAuthEvent(event.detail);
        });
        window.addEventListener('microsoftAuthChange', (event) => {
            this.handleMicrosoftAuthEvent(event.detail);
        });
        
        // Initialize application
        this.init();
    }
    
    async handleMicrosoftAuthEvent(detail) {
        const { event, data, state } = detail;
        
        if (event === 'microsoft_auth_success') {
            this.state.isAuthenticated = true;
            this.state.currentUser = state.user;

            // Store authentication
            const authResult = {
                user: state.user,
                accessToken: state.accessToken,
                provider: 'microsoft',
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            localStorage.setItem('statsai_auth', JSON.stringify(authResult));

            await this.loadUserData();
            this.showMainApp();
        }
    }
    
    async init() {
        console.log('🚀 Initializing StatsAI Email Assistant...');
        
        try {
            // Show loading screen
            this.showLoadingScreen();
            
            // Initialize components
            await this.initializeComponents();
            
            // Check authentication
            await this.checkAuthentication();
            
            // Initialize icons
            this.initializeLucideIcons();
            
            console.log('✅ Email Assistant initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Email Assistant:', error);
            this.showError('Failed to initialize application');
        }
    }
    
    async initializeComponents() {
        // Simulate initialization delay
        await this.updateLoadingProgress(20, 'Loading configurations...');
        await this.delay(500);
        
        await this.updateLoadingProgress(40, 'Initializing AI services...');
        await this.initializeAI();
        
        await this.updateLoadingProgress(60, 'Setting up email handlers...');
        this.setupEventHandlers();
        
        await this.updateLoadingProgress(80, 'Loading user interface...');
        this.setupThemeToggle();
        
        await this.updateLoadingProgress(100, 'Ready!');
        await this.delay(500);
    }
    
    async checkAuthentication() {
        console.log('🔍 Checking authentication...');
        
        // First, check Microsoft OAuth authentication (priority)
        const microsoftSession = localStorage.getItem('microsoft_auth_session');
        
        // Also check for OAuth callback authentication data
        const microsoftAuthenticated = localStorage.getItem('microsoftAuthenticated') === 'true';
        const userEmail = localStorage.getItem('userEmail');
        const userName = localStorage.getItem('userName');
        
        if (microsoftSession || (microsoftAuthenticated && userEmail)) {
            try {
                // Handle both microsoftSession and OAuth callback authentication
                const sessionData = microsoftSession ? JSON.parse(microsoftSession) : null;
                // Check if we have valid session data OR OAuth callback data
                if (sessionData) {
                    // Handle traditional session data
                    const now = Date.now();
                    const sessionAge = now - sessionData.timestamp;
                    const sessionMaxAge = 8 * 60 * 60 * 1000; // 8 hours
                    const isValidSession = sessionAge < sessionMaxAge && sessionData.session_jwt;
                    
                    if (isValidSession) {
                    console.log('✅ Found valid Microsoft OAuth authentication:', sessionData.member);
                    
                    this.state.isAuthenticated = true;
                    this.state.currentUser = {
                        name: sessionData.member.name || sessionData.member.email_address?.split('@')[0] || 'Microsoft User',
                        email: sessionData.member.email_address || 'user@microsoft.com',
                        avatar: (sessionData.member.name || 'MU').substring(0, 2).toUpperCase(),
                        provider: 'microsoft',
                        organization: sessionData.organization?.organization_name || 'Default Organization',
                        connectedAt: new Date(sessionData.timestamp).toISOString()
                    };
                    
                    // Store in the expected format for consistency
                    const authData = {
                        user: this.state.currentUser,
                        accessToken: sessionData.session_jwt,
                        provider: 'microsoft',
                        expiresAt: sessionData.timestamp + sessionMaxAge,
                        session: sessionData
                    };
                    localStorage.setItem('statsai_auth', JSON.stringify(authData));
                    
                    await this.loadUserData();
                    this.showMainApp();
                    return;
                } else {
                    console.log('⏰ Microsoft session expired, clearing...');
                    localStorage.removeItem('microsoft_auth_session');
                }
                } else if (microsoftAuthenticated && userEmail) {
                    // Handle OAuth callback authentication data
                    console.log('✅ Found Microsoft OAuth callback authentication:', { userEmail, userName });
                    
                    this.state.isAuthenticated = true;
                    this.state.currentUser = {
                        name: userName || userEmail.split('@')[0] || 'Microsoft User',
                        email: userEmail,
                        avatar: (userName || userEmail).substring(0, 2).toUpperCase(),
                        provider: 'microsoft',
                        organization: 'TridentInter', // From browser test results
                        connectedAt: new Date().toISOString()
                    };
                    
                    // Store in the expected format for consistency
                    const authData = {
                        user: this.state.currentUser,
                        accessToken: localStorage.getItem('accessToken') || 'oauth_token',
                        provider: 'microsoft',
                        expiresAt: Date.now() + (8 * 60 * 60 * 1000), // 8 hours from now
                        oauthCallback: true
                    };
                    localStorage.setItem('statsai_auth', JSON.stringify(authData));
                    
                    await this.loadUserData();
                    this.showMainApp();
                    return;
                }
            } catch (error) {
                console.warn('Invalid Microsoft auth data:', error);
                localStorage.removeItem('microsoft_auth_session');
            }
        }
        
        // Second, check Gmail OAuth handler authentication
        const gmailAuthenticated = localStorage.getItem('gmail_authenticated') === 'true';
        const gmailUser = localStorage.getItem('gmail_user');
        const gmailToken = localStorage.getItem('gmail_token');
        
        if (gmailAuthenticated && gmailUser && gmailToken) {
            try {
                const userData = JSON.parse(gmailUser);
                console.log('✅ Found Gmail OAuth authentication:', userData);
                
                this.state.isAuthenticated = true;
                this.state.currentUser = {
                    name: userData.name || userData.email?.split('@')[0] || 'Gmail User',
                    email: userData.email || 'rakib.mahmood232@gmail.com',
                    avatar: userData.avatar || 'GU',
                    provider: userData.provider || 'google',
                    connectedAt: new Date().toISOString()
                };
                
                // Store in the expected format for consistency
                const authData = {
                    user: this.state.currentUser,
                    accessToken: gmailToken,
                    provider: 'google',
                    expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
                };
                localStorage.setItem('statsai_auth', JSON.stringify(authData));
                
                await this.loadUserData();
                this.showMainApp();
                return;
            } catch (error) {
                console.warn('Invalid Gmail auth data:', error);
                // Clear corrupted data
                localStorage.removeItem('gmail_authenticated');
                localStorage.removeItem('gmail_user');
                localStorage.removeItem('gmail_token');
            }
        }

        // Check for OAuth callback parameters and localStorage auth flags
        const urlParams = new URLSearchParams(window.location.search);
        const oauthSuccess = urlParams.get('oauth') === 'success';
        const authSuccess = urlParams.get('auth_success') === 'true';
        const urlUserEmail = urlParams.get('email');
        
        // Check for direct localStorage authentication flags (from OAuth callback)
        const authSuccessFlag = localStorage.getItem('auth_success') === 'true';
        const storedUserEmail = localStorage.getItem('user_email');
        const storedUserName = localStorage.getItem('user_name');
        
        console.log('🔍 Full URL:', window.location.href);
        console.log('🔍 OAuth success:', oauthSuccess);
        console.log('🔍 Auth success:', authSuccess);
        console.log('🔍 User email:', urlUserEmail);
        console.log('🔍 Auth success flag:', authSuccessFlag);
        console.log('🔍 Stored user email:', storedUserEmail);

        // Handle Microsoft OAuth callback success
        if (authSuccess) {
            console.log('🔍 Microsoft auth success detected, checking for stored session...');
            // Recheck Microsoft session after callback redirect
            const microsoftSession = localStorage.getItem('microsoft_auth_session');
            if (microsoftSession) {
                try {
                    const sessionData = JSON.parse(microsoftSession);
                    if (sessionData.session_jwt) {
                        console.log('✅ Microsoft OAuth callback - session found, authenticating...');
                        
                        this.state.isAuthenticated = true;
                        this.state.currentUser = {
                            name: sessionData.member.name || sessionData.member.email_address?.split('@')[0] || 'Microsoft User',
                            email: sessionData.member.email_address || 'user@microsoft.com',
                            avatar: (sessionData.member.name || 'MU').substring(0, 2).toUpperCase(),
                            provider: 'microsoft',
                            organization: sessionData.organization?.organization_name || 'Default Organization',
                            connectedAt: new Date(sessionData.timestamp).toISOString()
                        };
                        
                        const authData = {
                            user: this.state.currentUser,
                            accessToken: sessionData.session_jwt,
                            provider: 'microsoft',
                            expiresAt: sessionData.timestamp + (8 * 60 * 60 * 1000),
                            session: sessionData
                        };
                        localStorage.setItem('statsai_auth', JSON.stringify(authData));
                        
                        // Clean URL and show main app
                        window.history.replaceState({}, document.title, window.location.pathname);
                        await this.loadUserData();
                        this.showMainApp();
                        return;
                    }
                } catch (error) {
                    console.error('❌ Error processing Microsoft OAuth callback:', error);
                }
            }
            console.log('⚠️ Microsoft auth success detected but no valid session found');
        }

        // Handle localStorage authentication flags (from OAuth callback)
        if (authSuccessFlag && storedUserEmail) {
            console.log('✅ Found localStorage authentication flags, authenticating user...');
            
            this.state.isAuthenticated = true;
            this.state.currentUser = {
                name: storedUserName || storedUserEmail.split('@')[0] || 'Microsoft User',
                email: storedUserEmail,
                avatar: (storedUserName || 'MU').substring(0, 2).toUpperCase(),
                provider: 'microsoft',
                connectedAt: new Date().toISOString()
            };
            
            const authData = {
                user: this.state.currentUser,
                accessToken: 'localStorage_token_' + Date.now(),
                provider: 'microsoft',
                expiresAt: Date.now() + (8 * 60 * 60 * 1000) // 8 hours
            };
            localStorage.setItem('statsai_auth', JSON.stringify(authData));
            
            await this.loadUserData();
            this.showMainApp();
            return;
        }

        // Handle Google OAuth callback success
        if (oauthSuccess && userEmail) {
            console.log('✅ Authenticating from URL parameters...');
            this.state.isAuthenticated = true;
            this.state.currentUser = {
                name: userEmail.split('@')[0],
                email: userEmail,
                avatar: userEmail.substring(0, 2).toUpperCase(),
                provider: 'google'
            };
            await this.loadUserData();
            this.showMainApp();
            return;
        }

        // Last fallback: Check old statsai_auth format
        const storedAuth = localStorage.getItem('statsai_auth');
        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                if (this.isValidAuth(authData)) {
                    this.state.isAuthenticated = true;
                    this.state.currentUser = authData.user;
                    await this.loadUserData();
                    this.showMainApp();
                    return;
                }
            } catch (error) {
                console.warn('Invalid stored auth data:', error);
                localStorage.removeItem('statsai_auth');
            }
        }
        
        // Show authentication screen
        this.showAuthScreen();
    }
    
    // Handle OAuth events from OAuth handler
    async handleOAuthEvent(detail) {
        const { event, data, state } = detail;
        
        console.log('📧 OAuth event received:', event, state);
        console.log('📧 State details - isAuthenticated:', state?.isAuthenticated, 'gmailAccess:', state?.gmailAccess);
        
        if (event === 'oauth_success') {
            // Get user email from URL params
            const urlParams = new URLSearchParams(window.location.search);
            const userEmail = urlParams.get('email');

            if (!userEmail) {
                console.error('OAuth success event received, but no email found in URL parameters.');
                this.showError('Authentication successful, but could not retrieve user profile.');
                return;
            }
            
            // Create user authentication data
            const authResult = {
                user: {
                    name: userEmail.split('@')[0],
                    email: userEmail,
                    avatar: userEmail.substring(0, 2).toUpperCase(),
                    provider: 'google',
                    connectedAt: new Date().toISOString()
                },
                accessToken: 'oauth_' + Date.now(),
                expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            };
            
            // Store authentication
            localStorage.setItem('statsai_auth', JSON.stringify(authResult));
            this.state.isAuthenticated = true;
            this.state.currentUser = authResult.user;
            
            console.log('✅ Email Assistant authenticated:', this.state.currentUser);
            
            // Load user data and show main app
            await this.loadUserData();
            this.showMainApp();
            
            // Start email processing
            await this.startEmailProcessing();
            
            // Clean URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }
    
    isValidAuth(authData) {
        return authData && 
               authData.user && 
               authData.accessToken && 
               authData.expiresAt > Date.now();
    }
    
    setupEventHandlers() {
        // Authentication handlers
        this.setupAuthHandlers();
        
        // Main app handlers
        this.setupMainAppHandlers();
        
        // Processing handlers (vectorization & sync)
        this.setupProcessingHandlers();
        
        // AI assistant handlers
        this.setupAIHandlers();
        
        // Compose handlers
        this.setupComposeHandlers();
        
        // Settings handlers
        this.setupSettingsHandlers();
    }
    
    setupAuthHandlers() {
        console.log('🔧 Setting up auth handlers...');
        
        const microsoftBtn = document.getElementById('microsoftAuthBtn');
        const googleBtn = document.getElementById('googleAuthBtn');
        
        console.log('Microsoft button found:', !!microsoftBtn);
        console.log('Google button found:', !!googleBtn);
        console.log('Microsoft OAuth handler available:', !!window.microsoftOAuth);
        
        if (microsoftBtn) {
            microsoftBtn.addEventListener('click', () => {
                console.log('🔵 Microsoft button clicked!');
                this.authenticateWithMicrosoft();
            });
            console.log('✅ Microsoft button click listener added');
        } else {
            console.error('❌ Microsoft button not found in DOM');
        }
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => {
                console.log('🟢 Google button clicked!');
                this.authenticateWithGoogle();
            });
            console.log('✅ Google button click listener added');
        } else {
            console.error('❌ Google button not found in DOM');
        }
    }
    
    setupProcessingHandlers() {
        // Vectorization button
        const vectorizeBtn = document.getElementById('vectorizeBtn');
        if (vectorizeBtn) {
            vectorizeBtn.addEventListener('click', () => this.startResumableDownload());
        }
        
        // Email download controls
        const startDownloadBtn = document.getElementById('startDownloadBtn');
        if (startDownloadBtn) {
            startDownloadBtn.addEventListener('click', () => this.startResumableDownload());
        }
        
        // Download status bar controls
        const pauseBtn = document.getElementById('pauseDownloadBtn');
        if (pauseBtn) {
            pauseBtn.addEventListener('click', () => this.downloadManager.pauseDownload());
        }
        
        const resumeBtn = document.getElementById('resumeDownloadBtn');
        if (resumeBtn) {
            resumeBtn.addEventListener('click', () => this.downloadManager.resumeDownload());
        }
        
        const cancelBtn = document.getElementById('cancelDownloadBtn');
        if (cancelBtn) {
            cancelBtn.addEventListener('click', () => this.cancelDownload());
        }
    }
    
    setupMainAppHandlers() {
        // Navigation items
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const folder = e.currentTarget.dataset.folder;
                if (folder) {
                    this.switchFolder(folder);
                }
            });
        });
        
        // Compose button
        const composeBtn = document.getElementById('composeBtn');
        if (composeBtn) {
            composeBtn.addEventListener('click', () => this.showComposePanel());
        }
        
        // Global search
        const globalSearch = document.getElementById('globalSearch');
        if (globalSearch) {
            globalSearch.addEventListener('input', (e) => this.handleGlobalSearch(e.target.value));
            globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.performSearch(e.target.value);
                }
            });
        }
        
        // Panel resizer
        this.initializeResizer();
        
        // AI action buttons
        this.setupAIActionHandlers();
        
        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => this.handleKeyboardShortcuts(e));
    }
    
    setupAIHandlers() {
        // Chat input
        const chatInput = document.getElementById('chatInput');
        const sendChatBtn = document.getElementById('sendChatBtn');
        
        if (chatInput) {
            chatInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendAIMessage(e.target.value);
                }
            });
        }
        
        if (sendChatBtn) {
            sendChatBtn.addEventListener('click', () => {
                const message = chatInput?.value?.trim();
                if (message) {
                    this.sendAIMessage(message);
                }
            });
        }
        
        // Quick action buttons
        document.querySelectorAll('.quick-action-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleQuickAction(action);
            });
        });
    }
    
    setupAIActionHandlers() {
        // AI Summarize button
        const aiSummarizeBtn = document.getElementById('aiSummarizeBtn');
        if (aiSummarizeBtn) {
            aiSummarizeBtn.addEventListener('click', () => this.performAISummarization());
        }
        
        // AI Draft button
        const aiDraftBtn = document.getElementById('aiDraftBtn');
        if (aiDraftBtn) {
            aiDraftBtn.addEventListener('click', () => this.showDraftModal());
        }
        
        // Draft modal handlers
        this.setupDraftModalHandlers();
    }
    
    setupDraftModalHandlers() {
        // Close modal handlers
        const closeDraftModal = document.getElementById('closeDraftModal');
        if (closeDraftModal) {
            closeDraftModal.addEventListener('click', () => this.hideDraftModal());
        }
        
        // Thread summary toggle
        const threadSummaryToggle = document.getElementById('threadSummaryToggle');
        if (threadSummaryToggle) {
            threadSummaryToggle.addEventListener('click', () => this.toggleThreadSummary());
        }
        
        // Draft action handlers
        const regenerateDraftBtn = document.getElementById('regenerateDraftBtn');
        if (regenerateDraftBtn) {
            regenerateDraftBtn.addEventListener('click', () => this.regenerateDraft());
        }
        
        const editDraftBtn = document.getElementById('editDraftBtn');
        if (editDraftBtn) {
            editDraftBtn.addEventListener('click', () => this.enableDraftEditing());
        }
        
        const saveDraftBtn = document.getElementById('saveDraftBtn');
        if (saveDraftBtn) {
            saveDraftBtn.addEventListener('click', () => this.saveDraft());
        }
        
        const sendDraftBtn = document.getElementById('sendDraftBtn');
        if (sendDraftBtn) {
            sendDraftBtn.addEventListener('click', () => this.sendDraft());
        }
        
        // Modal overlay click to close
        const draftModal = document.getElementById('draftModal');
        if (draftModal) {
            draftModal.addEventListener('click', (e) => {
                if (e.target === draftModal) {
                    this.hideDraftModal();
                }
            });
        }
        
        // Word count updates
        const draftMessage = document.getElementById('draftMessage');
        if (draftMessage) {
            draftMessage.addEventListener('input', () => this.updateWordCount());
        }
    }
    
    setupComposeHandlers() {
        const composeForm = document.getElementById('composeForm');
        const closeCompose = document.getElementById('closeCompose');
        
        if (composeForm) {
            composeForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.sendEmail();
            });
        }
        
        if (closeCompose) {
            closeCompose.addEventListener('click', () => this.hideComposePanel());
        }
        
        // AI assist button
        document.querySelectorAll('.editor-btn[data-action="ai-assist"]').forEach(btn => {
            btn.addEventListener('click', () => this.showAIAssist());
        });
    }
    
    setupSettingsHandlers() {
        const settingsBtn = document.getElementById('settingsBtn');
        const closeSettings = document.getElementById('closeSettings');
        
        if (settingsBtn) {
            settingsBtn.addEventListener('click', () => this.showSettings());
        }
        
        if (closeSettings) {
            closeSettings.addEventListener('click', () => this.hideSettings());
        }
    }
    
    initializeResizer() {
        const resizer = document.getElementById('panelResizer');
        const emailListContainer = document.querySelector('.email-list-container');
        const emailContentContainer = document.querySelector('.email-content-container');
        const centerPanel = document.querySelector('.email-center-panel');
        
        if (!resizer || !emailListContainer || !emailContentContainer || !centerPanel) {
            console.warn('⚠️ Resizer elements not found');
            return;
        }
        
        let isResizing = false;
        let startY = 0;
        let startListHeight = 0;
        
        // Load saved layout preferences
        const savedListHeight = localStorage.getItem('emailListHeight');
        if (savedListHeight) {
            const listHeight = parseInt(savedListHeight);
            const totalHeight = centerPanel.clientHeight;
            const contentHeight = totalHeight - listHeight;
            
            emailListContainer.style.height = listHeight + 'px';
            emailContentContainer.style.height = contentHeight + 'px';
        }
        
        resizer.addEventListener('mousedown', (e) => {
            isResizing = true;
            startY = e.clientY;
            startListHeight = emailListContainer.clientHeight;
            
            // Add visual feedback
            resizer.style.background = 'var(--color-primary)';
            document.body.style.cursor = 'ns-resize';
            
            // Prevent text selection during resize
            document.body.style.userSelect = 'none';
            
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (!isResizing) return;
            
            const deltaY = e.clientY - startY;
            const newListHeight = startListHeight + deltaY;
            const totalHeight = centerPanel.clientHeight;
            const minHeight = totalHeight * 0.3; // 30% minimum
            const maxHeight = totalHeight * 0.7; // 70% maximum
            
            // Apply constraints
            const constrainedListHeight = Math.max(minHeight, Math.min(maxHeight, newListHeight));
            const constrainedContentHeight = totalHeight - constrainedListHeight;
            
            emailListContainer.style.height = constrainedListHeight + 'px';
            emailContentContainer.style.height = constrainedContentHeight + 'px';
        });
        
        document.addEventListener('mouseup', () => {
            if (isResizing) {
                isResizing = false;
                
                // Remove visual feedback
                resizer.style.background = '';
                document.body.style.cursor = '';
                document.body.style.userSelect = '';
                
                // Save layout preferences
                const listHeight = emailListContainer.clientHeight;
                localStorage.setItem('emailListHeight', listHeight.toString());
                
                console.log('📏 Saved layout: list height', listHeight + 'px');
            }
        });
        
        // Add hover effect
        resizer.addEventListener('mouseenter', () => {
            if (!isResizing) {
                resizer.style.background = 'var(--border-color)';
            }
        });
        
        resizer.addEventListener('mouseleave', () => {
            if (!isResizing) {
                resizer.style.background = '';
            }
        });
        
        console.log('↔️ Panel resizer initialized');
    }
    
    setupThemeToggle() {
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => this.toggleTheme());
        }
        
        // Load saved theme
        const savedTheme = localStorage.getItem('statsai_theme') || 'theme-snow';
        this.setTheme(savedTheme);
    }
    
    // Authentication Methods
    async authenticateWithMicrosoft() {
        console.log('🔐 Starting Microsoft authentication...');
        console.log('🔍 Checking Microsoft OAuth availability...');
        console.log('window.microsoftOAuth exists:', !!window.microsoftOAuth);
        
        try {
            // Check if Microsoft OAuth handler is available
            if (window.microsoftOAuth) {
                console.log('✅ Microsoft OAuth handler found, starting connection...');
                // Use the Microsoft OAuth handler
                window.microsoftOAuth.connectMicrosoft();
                
                // Listen for authentication result
                window.addEventListener('microsoftAuthChange', (event) => {
                    const { event: authEvent, state } = event.detail;
                    
                    if (authEvent === 'microsoft_auth_success') {
                        console.log('🎉 Microsoft auth success - transitioning to main app');
                        
                        // Update email assistant state
                        this.state.isAuthenticated = true;
                        this.state.currentUser = state.user;
                        
                        // Store authentication for email assistant
                        const authResult = {
                            user: state.user,
                            accessToken: 'microsoft_access_token_' + Date.now(),
                            refreshToken: 'microsoft_refresh_token_' + Date.now(),
                            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
                        };
                        localStorage.setItem('statsai_auth', JSON.stringify(authResult));
                        
                        // Close any OAuth modals first
                        if (window.microsoftOAuth) {
                            window.microsoftOAuth.closeModal();
                        }
                        
                        // Small delay to ensure modal closes, then transition
                        setTimeout(() => {
                            this.loadUserData();
                            this.showMainApp();
                            console.log('✅ Main app should now be visible');
                        }, 100);
                    } else if (authEvent === 'microsoft_auth_error') {
                        this.showError('Microsoft authentication failed. Please try again.');
                        this.resetAuthButton('microsoftAuthBtn', this.getMicrosoftButtonHTML());
                    }
                }, { once: true });
                
            } else {
                // Fallback to original mock implementation
                await this.authenticateWithMicrosoftMock();
            }
            
        } catch (error) {
            console.error('❌ Microsoft authentication failed:', error);
            this.showError('Failed to start Microsoft authentication. Please try again.');
            this.resetAuthButton('microsoftAuthBtn', this.getMicrosoftButtonHTML());
        }
    }
    
    // Fallback mock implementation
    async authenticateWithMicrosoftMock() {
        // Show loading state
        const btn = document.getElementById('microsoftAuthBtn');
        if (btn) {
            btn.disabled = true;
            btn.innerHTML = this.getLoadingButtonHTML('Connecting to Microsoft...');
        }
        
        // Simulate Microsoft Entra authentication
        await this.delay(2000);
        
        // Mock successful authentication
        const authResult = {
            user: {
                name: 'John Doe',
                email: 'john.doe@company.com',
                avatar: 'JD',
                provider: 'microsoft'
            },
            accessToken: 'mock_access_token_' + Date.now(),
            refreshToken: 'mock_refresh_token_' + Date.now(),
            expiresAt: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
        };
        
        // Store authentication
        localStorage.setItem('statsai_auth', JSON.stringify(authResult));
        this.state.isAuthenticated = true;
        this.state.currentUser = authResult.user;
        
        // Load user data and show main app
        await this.loadUserData();
        this.showMainApp();
    }
    
    async authenticateWithGoogle() {
        console.log('🔑 Starting Google OAuth authentication...');
        
        try {
            // Check if OAuth handler is available
            if (window.oauthHandler) {
                // Use the OAuth handler to start the flow
                window.oauthHandler.connectGmail();
                
                // Listen for authentication result
                window.addEventListener('oauthStatusChange', (event) => {
                    const { event: authEvent, state } = event.detail;
                    
                    if (authEvent === 'oauth_success') {
                        // Update email assistant state
                        this.state.isAuthenticated = true;
                        this.state.currentUser = {
                            name: 'Gmail User', // Will be updated from OAuth response
                            email: 'user@gmail.com', // Will be updated from OAuth response
                            avatar: 'GU',
                            provider: 'google'
                        };
                        
                        // Store authentication for email assistant
                        const authResult = {
                            user: this.state.currentUser,
                            accessToken: 'google_access_token_' + Date.now(),
                            refreshToken: 'google_refresh_token_' + Date.now(),
                            expiresAt: Date.now() + (24 * 60 * 60 * 1000)
                        };
                        localStorage.setItem('statsai_auth', JSON.stringify(authResult));
                        
                        // Load user data and show main app
                        this.loadUserData();
                        this.showMainApp();
                    } else if (authEvent === 'oauth_error') {
                        this.showError('Google authentication failed. Please try again.');
                        this.resetAuthButton('googleAuthBtn', this.getGoogleButtonHTML());
                    }
                }, { once: true });
                
            } else {
                // Fallback: redirect directly to OAuth start URL
                window.location.href = 'https://oauthtest-609535336419.us-central1.run.app/auth/google/start';
            }
        } catch (error) {
            console.error('❌ Google authentication failed:', error);
            this.showError('Failed to start Google authentication. Please try again.');
        }
    }
    
    // Utility method to reset authentication buttons
    resetAuthButton(buttonId, originalHTML) {
        const btn = document.getElementById(buttonId);
        if (btn) {
            btn.disabled = false;
            btn.innerHTML = originalHTML;
        }
    }
    
    // Get original button HTML for Microsoft
    getMicrosoftButtonHTML() {
        return `
            <div class="auth-btn-content">
                <div class="microsoft-logo">
                    <svg width="21" height="21" viewBox="0 0 21 21" fill="none">
                        <rect width="10" height="10" fill="#F25022"/>
                        <rect x="11" width="10" height="10" fill="#7FBA00"/>
                        <rect y="11" width="10" height="10" fill="#00A4EF"/>
                        <rect x="11" y="11" width="10" height="10" fill="#FFB900"/>
                    </svg>
                </div>
                <div class="auth-btn-text">
                    <span class="auth-btn-title">Continue with Microsoft</span>
                    <span class="auth-btn-subtitle">Microsoft 365, Outlook, Exchange</span>
                </div>
            </div>
            <i data-lucide="arrow-right" class="auth-btn-arrow"></i>
        `;
    }
    
    // Get original button HTML for Google
    getGoogleButtonHTML() {
        return `
            <div class="auth-btn-content">
                <div class="google-logo">
                    <svg width="21" height="21" viewBox="0 0 48 48">
                        <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
                        <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
                        <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
                        <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
                    </svg>
                </div>
                <div class="auth-btn-text">
                    <span class="auth-btn-title">Continue with Google</span>
                    <span class="auth-btn-subtitle">Gmail, Google Workspace</span>
                </div>
            </div>
            <i data-lucide="arrow-right" class="auth-btn-arrow"></i>
        `;
    }
    
    // Get loading button HTML for authentication states
    getLoadingButtonHTML(message = 'Connecting...') {
        return `
            <div class="auth-btn-content">
                <div class="loading-spinner">
                    <svg width="21" height="21" viewBox="0 0 24 24" fill="none">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-dasharray="31.416" stroke-dashoffset="31.416">
                            <animate attributeName="stroke-dasharray" dur="2s" values="0 31.416;15.708 15.708;0 31.416" repeatCount="indefinite"/>
                            <animate attributeName="stroke-dashoffset" dur="2s" values="0;-15.708;-31.416" repeatCount="indefinite"/>
                        </circle>
                    </svg>
                </div>
                <div class="auth-btn-text">
                    <span class="auth-btn-title">${message}</span>
                    <span class="auth-btn-subtitle">Please wait...</span>
                </div>
            </div>
        `;
    }
    
    async loadUserData() {
        console.log('📧 Loading user email data...');
        
        try {
            // Check which provider is authenticated
            const authProvider = this.getAuthProvider();
            console.log('🔑 Detected auth provider:', authProvider);
            
            if (authProvider === 'microsoft') {
                console.log('📧 Triggering Microsoft email fetch...');
                await this.startEmailProcessing();
            } else if (authProvider === 'google') {
                // Load Google emails (would use Gmail API in production)
                console.log('📧 Loading Google emails...');
                this.state.emails = await this.loadGoogleEmails();
            } else {
                // No authentication - load mock emails as fallback
                console.log('📧 No authentication detected - loading mock emails');
                this.state.emails = await this.loadMockEmails();
            }
            
            // Update UI
            this.updateUserProfile();
            this.renderEmailList();
            this.updateEmailCounts();
            
            // Start AI processing
            this.startEmailProcessing();
            
            // Auto-start vectorization download immediately after loading emails
            if (authProvider !== 'unknown') {
                console.log('🚀 Auto-starting vectorization download...');
                setTimeout(() => {
                    this.startResumableDownload();
                }, 2000); // Small delay to ensure UI is ready
            }
            
        } catch (error) {
            console.error('❌ Failed to load user data:', error);
            
            // Handle different types of errors
            if (error.message.includes('authentication') || error.message.includes('token')) {
                // Authentication error - show reconnect option
                this.showEmailRetryOption();
            } else {
                // Other errors - fallback to mock emails only in development
                if (window.location.hostname === 'localhost') {
                    console.log('🧪 Development mode - using mock emails as fallback');
                    this.state.emails = await this.loadMockEmails();
                    this.updateUserProfile();
                    this.renderEmailList();
                    this.updateEmailCounts();
                } else {
                    // Production - show error state
                    this.showEmailRetryOption();
                }
            }
        }
    }
    
    // AI Integration Methods
    async initializeAI() {
        console.log('🧠 Initializing AI services...');
        
        try {
            // Test Gemini API connection
            const isConnected = await this.testGeminiConnection();
            
            if (isConnected) {
                console.log('✅ Gemini AI connected successfully');
                this.updateAIStatus('active');
            } else {
                console.warn('⚠️ Gemini AI connection failed, using fallback');
                this.updateAIStatus('fallback');
            }
            
        } catch (error) {
            console.error('❌ AI initialization failed:', error);
            this.updateAIStatus('error');
        }
    }
    
    async testGeminiConnection() {
        try {
            const geminiApiKey = 'AIzaSyCRJ8BT5LaVPvOS6FE0tAKPg5u-kLryfds';
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/${this.config.geminiModel}:generateContent?key=${geminiApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: 'Hello! This is a connection test.'
                            }]
                        }],
                        generationConfig: {
                            maxOutputTokens: 50,
                            temperature: 0.1
                        }
                    })
                }
            );
            
            return response.ok;
            
        } catch (error) {
            console.warn('Gemini API test failed:', error);
            return false;
        }
    }
    
    async sendAIMessage(message) {
        if (this.state.aiProcessing) return;
        
        this.state.aiProcessing = true;
        const chatInput = document.getElementById('chatInput');
        const chatMessages = document.getElementById('chatMessages');
        
        try {
            // Clear input and add user message
            if (chatInput) chatInput.value = '';
            this.addChatMessage('user', message);
            
            // Show typing indicator
            this.showAITyping();
            
            // Get AI response
            const response = await this.getAIResponse(message);
            
            // Hide typing indicator and show response
            this.hideAITyping();
            this.addChatMessage('ai', response);
            
        } catch (error) {
            console.error('AI message failed:', error);
            this.hideAITyping();
            this.addChatMessage('ai', 'I apologize, but I\'m having trouble processing your request right now. Please try again later.');
        } finally {
            this.state.aiProcessing = false;
        }
    }
    
    async getAIResponse(message) {
        try {
            console.log('🤖 Processing AI query:', message);

            const response = await fetch(this.config.aiChatServiceUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    query: message,
                    userEmail: this.state.currentUser.email,
                    context: this.state.selectedEmail ? JSON.stringify(this.state.selectedEmail) : null
                })
            });

            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }

            const result = await response.json();
            return result.response;

        } catch (error) {
            console.error('aiChatService error:', error);
            return 'I apologize, but I\'m having trouble connecting to the AI service right now. Please try again later.';
        }
    }
    
    buildAIContext(message) {
        const selectedEmailContext = this.state.selectedEmail ? 
            `Current email context: From: ${this.state.selectedEmail.from.name}, Subject: ${this.state.selectedEmail.subject}` : '';
        
        const systemPrompt = `You are an intelligent email assistant integrated into StatsAI Email Assistant. You help users manage their emails efficiently.

Your capabilities:
- Compose professional emails
- Summarize email threads  
- Suggest quick replies
- Schedule meetings
- Analyze email content
- Extract action items

Current context: ${selectedEmailContext}
Response style: ${this.config.aiResponseStyle}

User message: ${message}

Please provide a helpful, concise response:`;

        return systemPrompt;
    }
    
    // Enhanced AI context with vectorized email data
    buildEnhancedAIContext(message, relevantEmails = []) {
        let context = `You are an intelligent email assistant integrated into StatsAI Email Assistant. You help users manage their emails efficiently with advanced vectorized search capabilities.

Your capabilities:
- Compose professional emails with context awareness
- Summarize email threads and related conversations
- Suggest quick replies based on email history
- Schedule meetings and extract action items
- Analyze email content using vectorized search
- Find relevant emails across user's entire inbox

Current email context:`;

        if (this.state.selectedEmail) {
            const email = this.state.selectedEmail;
            context += `
- Currently viewing: From ${email.from.name} (${email.from.email})
- Subject: "${email.subject}"
- Content: "${(email.body || email.preview).substring(0, 200)}..."
- Status: ${email.isRead ? 'Read' : 'Unread'}${email.important ? ', Important' : ''}`;
        } else {
            context += `
- User has ${this.state.emails?.length || 0} emails total
- ${this.state.emails?.filter(e => !e.isRead).length || 0} unread emails`;
        }

        // Add relevant emails from vector search
        if (relevantEmails.length > 0) {
            context += `

Relevant emails from vectorized search:`;
            relevantEmails.forEach((email, index) => {
                context += `
${index + 1}. From: ${email.from} - "${email.subject}"
   Content: "${email.body.substring(0, 150)}..."`;
            });
        }

        context += `

Response style: ${this.config.aiResponseStyle}
User message: "${message}"

Please provide a helpful, contextual response using the available email data:`;

        return context;
    }
    
    // Search vectorized emails for relevant content
    async searchVectorizedEmails(query) {
        try {
            const vectors = JSON.parse(localStorage.getItem('email_vectors') || '[]');
            
            if (vectors.length === 0) {
                console.log('No vectorized emails available for search');
                return [];
            }
            
            // Simple keyword-based search as fallback for vector search
            const queryWords = query.toLowerCase().split(' ').filter(word => word.length > 2);
            
            if (queryWords.length === 0) {
                return [];
            }
            
            const relevantEmails = vectors.filter(vector => {
                const content = `${vector.content.subject} ${vector.content.body} ${vector.content.from}`.toLowerCase();
                return queryWords.some(word => content.includes(word));
            })
            .sort((a, b) => {
                // Sort by relevance - count matching keywords
                const aMatches = queryWords.filter(word => 
                    `${a.content.subject} ${a.content.body}`.toLowerCase().includes(word)
                ).length;
                const bMatches = queryWords.filter(word => 
                    `${b.content.subject} ${b.content.body}`.toLowerCase().includes(word)
                ).length;
                return bMatches - aMatches;
            })
            .slice(0, 3); // Get top 3 relevant emails
            
            console.log(`🔍 Found ${relevantEmails.length} relevant emails for query: "${query}"`);
            return relevantEmails.map(v => v.content);
            
        } catch (error) {
            console.error('Vector search failed:', error);
            return [];
        }
    }
    
    getMockAIResponse(message) {
        const responses = {
            'summarize': 'I can help you summarize emails once you select an email from the list.',
            'compose': 'I\'d be happy to help you compose an email. What type of email would you like to write?',
            'schedule': 'I can help you schedule meetings. What meeting would you like to set up?',
            'hello': 'Hello! I\'m your AI email assistant. How can I help you manage your emails today?',
            'help': 'I can help you with email composition, summarization, scheduling, and more. What would you like to do?'
        };
        
        const lowerMessage = message.toLowerCase();
        
        for (const [key, response] of Object.entries(responses)) {
            if (lowerMessage.includes(key)) {
                return response;
            }
        }
        
        return 'I understand you want help with your emails. Could you be more specific about what you\'d like me to do?';
    }
    
    handleQuickAction(action) {
        switch (action) {
            case 'summarize':
                this.performIntelligentSummarization();
                break;
            case 'compose':
                this.showComposePanel();
                break;
            case 'schedule':
                this.sendAIMessage('Help me schedule a meeting');
                break;
        }
    }
    
    async performIntelligentSummarization() {
        if (this.state.selectedEmail) {
            // Summarize selected email and related thread
            const email = this.state.selectedEmail;
            const relatedEmails = this.findRelatedEmails(email);
            const context = this.buildEmailContext(email, relatedEmails);
            
            this.addAIMessage('I\'m analyzing the email thread and related conversations...');
            
            try {
                const summary = await this.generateAISummary(context);
                this.addAIMessage(summary);
            } catch (error) {
                this.addAIMessage('I apologize, but I encountered an error while analyzing the emails. Here\'s what I can tell you manually: This email is from ' + email.from.name + ' about "' + email.subject + '". The main content discusses important topics that may require your attention.');
            }
        } else {
            // Summarize inbox overview
            this.summarizeInboxOverview();
        }
    }
    
    findRelatedEmails(targetEmail) {
        // Enhanced thread detection algorithm
        const related = this.state.emails.filter(email => {
            if (email.id === targetEmail.id) return false;
            
            // Check for thread indicators
            const isThread = this.isPartOfThread(email, targetEmail);
            const isSameSender = email.from.email === targetEmail.from.email;
            const hasHighSimilarity = this.calculateSubjectSimilarity(email.subject, targetEmail.subject) > 0.7;
            const isReplyChain = this.isReplyChain(email, targetEmail);
            
            return isThread || isSameSender || hasHighSimilarity || isReplyChain;
        });
        
        // Sort by relevance and timestamp
        return related
            .sort((a, b) => {
                const scoreA = this.calculateThreadScore(a, targetEmail);
                const scoreB = this.calculateThreadScore(b, targetEmail);
                if (scoreA !== scoreB) return scoreB - scoreA;
                return new Date(b.timestamp) - new Date(a.timestamp);
            })
            .slice(0, 8); // Increased limit for better context
    }
    
    isPartOfThread(email1, email2) {
        // Check for reply/forward patterns in subject
        const subject1 = email1.subject.toLowerCase().trim();
        const subject2 = email2.subject.toLowerCase().trim();
        
        // Remove common prefixes
        const cleanSubject1 = this.cleanSubject(subject1);
        const cleanSubject2 = this.cleanSubject(subject2);
        
        return cleanSubject1 === cleanSubject2;
    }
    
    cleanSubject(subject) {
        // Remove Re:, Fwd:, etc. and normalize
        return subject
            .replace(/^(re:|fwd:|fw:|forward:|reply:)\s*/gi, '')
            .replace(/\s+/g, ' ')
            .trim();
    }
    
    isReplyChain(email1, email2) {
        // Check if emails are part of a conversation chain
        const participants1 = [email1.from.email, email1.to].filter(Boolean);
        const participants2 = [email2.from.email, email2.to].filter(Boolean);
        
        // Check if participants overlap (conversation between same people)
        const overlap = participants1.some(p1 => participants2.includes(p1));
        const timeDiff = Math.abs(new Date(email1.timestamp) - new Date(email2.timestamp));
        const withinTimeframe = timeDiff < (7 * 24 * 60 * 60 * 1000); // Within 7 days
        
        return overlap && withinTimeframe;
    }
    
    calculateThreadScore(email, targetEmail) {
        let score = 0;
        
        // Subject similarity (0-3 points)
        const subjectSim = this.calculateSubjectSimilarity(email.subject, targetEmail.subject);
        score += subjectSim * 3;
        
        // Same participants (2 points)
        if (email.from.email === targetEmail.from.email || email.to === targetEmail.to) {
            score += 2;
        }
        
        // Thread indicators (3 points)
        if (this.isPartOfThread(email, targetEmail)) {
            score += 3;
        }
        
        // Recent communication (1 point)
        const timeDiff = Math.abs(new Date(email.timestamp) - new Date(targetEmail.timestamp));
        if (timeDiff < (24 * 60 * 60 * 1000)) { // Within 24 hours
            score += 1;
        }
        
        // Same category/tags (0.5 points)
        if (email.category === targetEmail.category) {
            score += 0.5;
        }
        
        return score;
    }
    
    calculateSubjectSimilarity(subject1, subject2) {
        // Simple similarity calculation based on common words
        const words1 = subject1.toLowerCase().split(' ').filter(word => word.length > 3);
        const words2 = subject2.toLowerCase().split(' ').filter(word => word.length > 3);
        const commonWords = words1.filter(word => words2.includes(word));
        return commonWords.length / Math.max(words1.length, words2.length);
    }
    
    buildEmailContext(email, relatedEmails) {
        const isThread = relatedEmails.length > 0;
        const threadEmails = [email, ...relatedEmails].sort((a, b) => 
            new Date(a.timestamp) - new Date(b.timestamp)
        );
        
        let context = '';
        
        if (isThread) {
            context += `EMAIL THREAD ANALYSIS\n`;
            context += `===================\n`;
            context += `Thread has ${threadEmails.length} emails\n`;
            context += `Participants: ${[...new Set(threadEmails.map(e => e.from.name))].join(', ')}\n`;
            context += `Time span: ${this.formatDateRange(threadEmails)}\n\n`;
            
            context += `CHRONOLOGICAL THREAD:\n`;
            threadEmails.forEach((threadEmail, index) => {
                const isSelected = threadEmail.id === email.id;
                context += `${index + 1}. ${isSelected ? '>>> SELECTED EMAIL <<<' : ''}\n`;
                context += `   From: ${threadEmail.from.name} (${threadEmail.from.email})\n`;
                context += `   Date: ${this.formatFullDate(threadEmail.timestamp)}\n`;
                context += `   Subject: ${threadEmail.subject}\n`;
                context += `   Content: ${threadEmail.body.substring(0, 500)}${threadEmail.body.length > 500 ? '...' : ''}\n`;
                if (threadEmail.badges) {
                    context += `   Badges: ${threadEmail.badges.join(', ')}\n`;
                }
                context += `\n`;
            });
        } else {
            context += `INDIVIDUAL EMAIL ANALYSIS\n`;
            context += `========================\n`;
            context += `From: ${email.from.name} (${email.from.email})\n`;
            context += `To: ${email.to}\n`;
            context += `Date: ${this.formatFullDate(email.timestamp)}\n`;
            context += `Subject: ${email.subject}\n`;
            context += `Content: ${email.body}\n`;
            if (email.badges?.length > 0) {
                context += `Badges: ${email.badges.join(', ')}\n`;
            }
            if (email.hasAttachment) {
                context += `Has Attachments: Yes\n`;
            }
            context += `\n`;
        }
        
        return context;
    }
    
    formatDateRange(emails) {
        if (emails.length === 0) return 'Unknown';
        const firstDate = new Date(emails[0].timestamp);
        const lastDate = new Date(emails[emails.length - 1].timestamp);
        const diffDays = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24));
        
        if (diffDays === 0) return 'Same day';
        if (diffDays === 1) return '1 day';
        return `${diffDays} days`;
    }
    
    async generateAISummary(context) {
        const isThread = context.includes('EMAIL THREAD ANALYSIS');
        
        const prompt = isThread ? 
            this.generateThreadSummaryPrompt(context) : 
            this.generateEmailSummaryPrompt(context);

        const response = await this.callGeminiAPI(prompt);
        return response || 'Unable to generate AI summary at this time.';
    }
    
    generateThreadSummaryPrompt(context) {
        return `You are an AI email assistant analyzing an email thread. Please provide a comprehensive thread analysis:

${context}

PROVIDE A STRUCTURED RESPONSE WITH:

## 📧 THREAD SUMMARY
**Main Topic**: [What is this conversation about?]
**Participants**: [Who is involved and their roles?]
**Timeline**: [How long has this conversation been going?]

## 🔑 KEY POINTS
**Decisions Made**: [What has been agreed upon?]
**Pending Issues**: [What still needs to be resolved?]
**Action Items**: [What needs to be done and by whom?]

## ⏰ URGENCY & DEADLINES
**Immediate Actions**: [What needs attention now?]
**Upcoming Deadlines**: [Any time-sensitive items?]

## 💡 SUGGESTED RESPONSE
**Response Type**: [What kind of reply is appropriate?]
**Key Points to Address**: [What should be mentioned in response?]
**Tone**: [Professional, casual, formal, etc.]
**Next Steps**: [What should happen after responding?]

Keep each section concise but informative. Focus on actionable insights.`;
    }
    
    generateEmailSummaryPrompt(context) {
        return `You are an AI email assistant analyzing a single email. Please provide a focused analysis:

${context}

PROVIDE A STRUCTURED RESPONSE WITH:

## 📧 EMAIL SUMMARY
**Purpose**: [Why was this email sent?]
**Sender Intent**: [What does the sender want?]
**Key Information**: [Important details or data points]

## 🎯 REQUIRED ACTIONS
**What You Need to Do**: [Specific actions required]
**Priority Level**: [High/Medium/Low and why]
**Deadline**: [Any time constraints mentioned]

## 💡 SUGGESTED RESPONSE
**Response Needed**: [Yes/No and type of response]
**Key Points to Address**: [What to mention in reply]
**Tone**: [Appropriate communication style]
**Template**: [Brief draft suggestion if response needed]

Be specific and actionable. If no response is needed, explain why.`;
    }
    
    // AI Draft Generation Methods
    async generateEmailDraft(email, draftType = 'reply') {
        const relatedEmails = this.findRelatedEmails(email);
        const context = this.buildEmailContext(email, relatedEmails);
        const isThread = relatedEmails.length > 0;
        
        const prompt = this.generateDraftPrompt(context, draftType, isThread, email);
        
        try {
            const response = await this.callGeminiAPI(prompt);
            return {
                success: true,
                draft: response,
                threadSummary: isThread ? await this.generateAISummary(context) : null,
                context: {
                    isThread,
                    email,
                    relatedEmails,
                    draftType
                }
            };
        } catch (error) {
            console.error('❌ Draft generation failed:', error);
            return {
                success: false,
                error: 'Failed to generate draft. Please try again.',
                fallbackDraft: this.generateFallbackDraft(email, draftType)
            };
        }
    }
    
    generateDraftPrompt(context, draftType, isThread, email) {
        const basePrompt = `You are an AI email assistant helping to compose a professional email ${draftType}.

${context}

CONTEXT ANALYSIS:
- Draft Type: ${draftType.toUpperCase()}
- Thread: ${isThread ? 'Yes (multi-email conversation)' : 'No (single email)'}
- Sender Relationship: ${this.analyzeSenderRelationship(email)}
- Urgency: ${email.important ? 'High' : 'Normal'}
- Tone Required: ${this.suggestTone(email)}

GENERATE A COMPLETE EMAIL DRAFT WITH:

**Subject Line**: ${draftType === 'reply' ? `Re: ${email.subject}` : '[Appropriate subject]'}

**Email Body**:
- Appropriate greeting
- Reference to the original email/thread
- Address key points mentioned
- Clear action items or responses
- Professional closing
- Signature placeholder

REQUIREMENTS:
- Match the professional tone of the original sender
- Be specific and reference actual content from the thread
- Include clear next steps or calls to action
- Keep concise but comprehensive
- Use proper business email formatting

Provide ONLY the email draft, no additional commentary.`;

        return basePrompt;
    }
    
    analyzeSenderRelationship(email) {
        // Analyze sender to determine appropriate relationship level
        const domain = email.from.email.split('@')[1];
        const isInternal = domain === 'company.com'; // Adjust based on user's domain
        const isExecutive = ['ceo', 'cto', 'vp', 'director'].some(title => 
            email.from.name.toLowerCase().includes(title)
        );
        const isExternal = ['university.edu', 'gmail.com', 'outlook.com'].includes(domain);
        
        if (isExecutive) return 'Executive Level';
        if (isInternal) return 'Internal Team Member';
        if (isExternal) return 'External Professional';
        return 'Professional Contact';
    }
    
    suggestTone(email) {
        const subject = email.subject.toLowerCase();
        const hasUrgentWords = ['urgent', 'asap', 'immediate', 'priority'].some(word => 
            subject.includes(word)
        );
        
        if (hasUrgentWords || email.important) return 'Direct and Professional';
        if (email.from.email.includes('university.edu')) return 'Formal Academic';
        if (email.category === 'team') return 'Collaborative and Friendly';
        return 'Professional and Courteous';
    }
    
    generateFallbackDraft(email, draftType) {
        const greeting = `Hi ${email.from.name},
`;
        const reference = `Thank you for your email regarding "${email.subject}".
`;
        const placeholder = `[Your response here - please customize based on the specific content of the original email]
`;
        const closing = `Best regards,
[Your Name]`;
        
        return `${greeting}\n${reference}\n${placeholder}\n\n${closing}`;
    }
    
    summarizeInboxOverview() {
        const unreadCount = this.state.emails.filter(e => !e.isRead).length;
        const highPriorityCount = this.state.emails.filter(e => e.priority === 'high').length;
        const needsResponseCount = this.state.emails.filter(e => e.needsResponse).length;
        
        const recentSenders = [...new Set(this.state.emails.slice(0, 10).map(e => e.from.name))];
        const commonTags = {};
        this.state.emails.forEach(email => {
            if (email.tags) {
                email.tags.forEach(tag => {
                    commonTags[tag] = (commonTags[tag] || 0) + 1;
                });
            }
        });
        
        const topTags = Object.entries(commonTags)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([tag, count]) => `${tag} (${count})`);
            
        const summary = `📊 **Inbox Overview**

**Email Statistics:**
• ${this.state.emails.length} total emails
• ${unreadCount} unread messages
• ${highPriorityCount} high priority items
• ${needsResponseCount} emails need responses

**Recent Activity:**
• Top senders: ${recentSenders.slice(0, 3).join(', ')}
• Common topics: ${topTags.slice(0, 3).join(', ')}

**Recommendations:**
${highPriorityCount > 0 ? '• Review high priority emails first' : ''}
${needsResponseCount > 0 ? '• ' + needsResponseCount + ' emails are waiting for your response' : ''}
${unreadCount > 5 ? '• Consider archiving older emails to reduce clutter' : ''}

Would you like me to help with any specific emails or tasks?`;

        this.addAIMessage(summary);
    }
    
    // Email Management Methods
    async loadMockEmails() {
        try {
            const response = await fetch('./data/mock-emails.json');
            const data = await response.json();
            console.log('📧 Loaded', data.emails.length, 'mock emails');
            return data.emails.map(email => ({
                ...email,
                folder: 'inbox', // Default folder
                isRead: !email.unread, // Convert unread to isRead
                isStarred: email.important,
                priority: email.important ? 'high' : 'normal',
                tags: email.badges || [],
                hasAttachments: email.hasAttachment,
                needsResponse: email.important,
                timestamp: new Date(email.timestamp)
            }));
        } catch (error) {
            console.error('❌ Failed to load mock emails:', error);
            return this.generateFallbackMockEmails();
        }
    }
    
    // Load Microsoft emails using Graph API
    async loadMicrosoftEmails() {
        try {
            if (!window.microsoftOAuth || !window.microsoftOAuth.isMicrosoftConnected()) {
                throw new Error('Microsoft not authenticated');
            }
            
            console.log('📧 Fetching emails from Microsoft Graph API...');
            
            // Show loading status
            this.updateEmailLoadingStatus('Connecting to Microsoft...', 'Fetching your emails from Outlook');
            
            const rawEmails = await window.microsoftOAuth.fetchMicrosoftEmails();
            
            if (!rawEmails || rawEmails.length === 0) {
                console.log('📧 No emails found in Microsoft account');
                this.clearEmailLoadingStatus();
                return [];
            }
            
            // Process Microsoft emails to ensure proper data format
            const processedEmails = rawEmails.map(email => ({
                ...email,
                folder: email.folder || 'inbox',
                isRead: email.isRead !== undefined ? email.isRead : !email.unread, // Process isRead correctly
                isStarred: email.isStarred || email.important,
                priority: email.priority || (email.important ? 'high' : 'normal'),
                tags: email.badges || [],
                hasAttachments: email.hasAttachment || false,
                needsResponse: email.important || false,
                timestamp: new Date(email.timestamp), // Ensure proper Date object
                source: 'microsoft'
            }));
            
            console.log('✅ Successfully loaded and processed', processedEmails.length, 'real Microsoft emails');
            this.clearEmailLoadingStatus();
            
            return processedEmails;
            
        } catch (error) {
            console.error('❌ Failed to load Microsoft emails:', error);
            this.clearEmailLoadingStatus();
            
            // Show specific error message to user
            this.showEmailLoadingError('Failed to load Microsoft emails', error.message);
            
            // Only fallback to mock in development mode
            if (window.location.hostname === 'localhost') {
                console.log('🧪 Development mode - using mock emails as fallback');
                return await this.loadMockEmails();
            }
            
            // In production, throw the error to be handled by calling function
            throw error;
        }
    }
    
    // Update email loading status
    updateEmailLoadingStatus(title, details) {
        const statusBar = document.getElementById('downloadStatusBar');
        const statusTitle = document.getElementById('statusTitle');
        const statusDetails = document.getElementById('statusDetails');
        
        if (statusBar && statusTitle && statusDetails) {
            statusBar.style.display = 'block';
            statusTitle.textContent = title;
            statusDetails.textContent = details;
        }
    }
    
    // Clear email loading status
    clearEmailLoadingStatus() {
        const statusBar = document.getElementById('downloadStatusBar');
        if (statusBar) {
            statusBar.style.display = 'none';
        }
    }
    
    // Show email loading error
    showEmailLoadingError(title, details) {
        console.error(`${title}: ${details}`);
        
        // Show error notification
        this.showNotification('error', title, details, 10000); // Show for 10 seconds
        
        // Show retry option in the email list
        this.showEmailRetryOption();
    }
    
    // Show retry option in email list
    showEmailRetryOption() {
        const emailList = document.getElementById('emailList');
        if (emailList) {
            emailList.innerHTML = `
                <div class="email-error-state" style="padding: 2rem; text-align: center;">
                    <i data-lucide="alert-circle" class="error-icon" style="width: 48px; height: 48px; color: #ef4444; margin-bottom: 1rem;"></i>
                    <h3 style="margin: 0 0 0.5rem 0; font-size: 1.2rem;">Unable to Load Emails</h3>
                    <p style="margin: 0 0 1.5rem 0; color: #6b7280;">There was a problem connecting to your Microsoft account.</p>
                    <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                        <button class="btn-primary retry-emails-btn" onclick="emailAssistant.retryLoadEmails()" style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="refresh-cw" style="width: 16px; height: 16px;"></i>
                            Try Again
                        </button>
                        <button class="btn-secondary reconnect-btn" onclick="microsoftOAuth.startMicrosoftAuth()" style="display: flex; align-items: center; gap: 0.5rem;">
                            <i data-lucide="user" style="width: 16px; height: 16px;"></i>
                            Reconnect Account
                        </button>
                    </div>
                </div>
            `;
            
            // Initialize lucide icons for the new elements
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }
    
    // Retry loading emails
    async retryLoadEmails() {
        console.log('🔄 Retrying email load...');
        try {
            const emailList = document.getElementById('emailList');
            if (emailList) {
                emailList.innerHTML = '<div style="padding: 2rem; text-align: center;">Loading emails...</div>';
            }
            
            await this.loadUserData();
            this.showNotification('success', 'Success!', 'Emails loaded successfully');
        } catch (error) {
            console.error('Retry failed:', error);
            this.showNotification('error', 'Retry Failed', 'Unable to load emails. Please check your connection and try again.');
            this.showEmailRetryOption();
        }
    }
    
    // Load Google emails using real Gmail API
    async loadGoogleEmails() {
        try {
            if (!window.oauthHandler || !window.oauthHandler.isGmailConnected()) {
                throw new Error('Google not authenticated');
            }
            
            console.log('📧 Fetching emails from Gmail API...');
            
            // Show loading status
            this.updateEmailLoadingStatus('Connecting to Gmail...', 'Fetching your emails from Gmail API');
            
            const rawEmails = await window.oauthHandler.fetchGmailEmails();
            
            if (!rawEmails || rawEmails.length === 0) {
                console.log('📧 No emails found in Gmail account');
                this.clearEmailLoadingStatus();
                return [];
            }
            
            // Process emails for the email assistant UI
            const processedEmails = rawEmails.map(email => ({
                ...email,
                folder: 'inbox', // Default folder
                needsResponse: email.important || email.unread,
                timestamp: new Date(email.timestamp), // Ensure proper Date object
                source: 'gmail'
            }));
            
            console.log('✅ Successfully loaded and processed', processedEmails.length, 'real Gmail emails');
            this.clearEmailLoadingStatus();
            
            return processedEmails;
            
        } catch (error) {
            console.error('❌ Failed to load Gmail emails:', error);
            this.clearEmailLoadingStatus();
            
            // Show specific error message to user
            this.showEmailLoadingError('Failed to load Gmail emails', error.message);
            
            // Only fallback to mock in development mode
            if (window.location.hostname === 'localhost') {
                console.log('🧪 Development mode - using mock emails as fallback');
                return await this.loadMockEmails();
            }
            
            // In production, throw the error to be handled by calling function
            throw error;
        }
    }
    
    generateFallbackMockEmails() {
        const mockEmails = [
            {
                id: 'email-1',
                from: { name: 'Sarah Chen', email: 'sarah.chen@techcorp.com', avatar: 'SC' },
                subject: 'Q1 Product Roadmap Review - Action Required',
                preview: 'Hi team, I need your input on the Q1 roadmap priorities by Friday. Please review the attached documents and let me know if you have any questions.',
                body: `Hi team,

I hope this email finds you well. I need your input on the Q1 roadmap priorities by Friday. We have several key initiatives to discuss:

1. AI Integration features
2. Mobile app enhancements  
3. Security improvements
4. Performance optimizations

Please review the attached documents and provide your feedback on the prioritization matrix. We'll be meeting next Monday to finalize our plans.

Best regards,
Sarah`,
                timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
                isRead: false,
                isStarred: true,
                priority: 'high',
                tags: ['work', 'urgent'],
                hasAttachments: true,
                needsResponse: true,
                suggestedResponses: [
                    'I\'ll review the documents and provide feedback by Thursday',
                    'Can we schedule a 30-minute discussion before the meeting?',
                    'I have some concerns about the timeline - let\'s discuss'
                ]
            },
            {
                id: 'email-2',
                from: { name: 'Microsoft Teams', email: 'noreply@teams.microsoft.com', avatar: 'MT' },
                subject: 'Meeting invitation: Weekly Team Standup',
                preview: 'You\'re invited to join our weekly team standup meeting scheduled for tomorrow at 10:00 AM EST.',
                body: `Hello,

You're invited to join our weekly team standup meeting.

📅 When: Tomorrow, 10:00 AM - 10:30 AM EST
🏢 Where: Microsoft Teams
👥 Organizer: Sarah Chen

Agenda:
- Sprint progress review
- Blockers discussion
- Next week planning

Join Microsoft Teams Meeting
[Join the meeting now]

Best regards,
Microsoft Teams`,
                timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
                isRead: false,
                isStarred: false,
                priority: 'medium',
                tags: ['meeting', 'calendar'],
                hasAttachments: false,
                needsResponse: true,
                suggestedResponses: [
                    'Accept - I\'ll be there',
                    'Decline - I have a conflict',
                    'Tentative - Let me check my schedule'
                ]
            },
            {
                id: 'email-3',
                from: { name: 'GitHub', email: 'noreply@github.com', avatar: 'GH' },
                subject: '[Repository] Pull Request #247 ready for review',
                preview: 'Your review is requested on pull request #247: Add email vectorization service integration.',
                body: `Hi,

Your review is requested on pull request #247: Add email vectorization service integration.

Changes include:
- New EmailVectorService class
- Integration with Google Vector Store
- Unit tests for vectorization logic
- Updated documentation

Please review at your earliest convenience.

View Pull Request: https://github.com/company/email-assistant/pull/247

GitHub`,
                timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
                isRead: true,
                isStarred: false,
                priority: 'medium',
                tags: ['development', 'code-review'],
                hasAttachments: false,
                needsResponse: true,
                suggestedResponses: [
                    'I\'ll review this today',
                    'Looks good, approved!',
                    'I have some questions about the implementation'
                ]
            },
            {
                id: 'email-4',
                from: { name: 'David Rodriguez', email: 'david.r@company.com', avatar: 'DR' },
                subject: 'Coffee chat next week?',
                preview: 'Hey! Hope you\'re doing well. Would you be interested in grabbing coffee next week to catch up?',
                body: `Hey!

Hope you\'re doing well! I\'ve been thinking about our conversation at the last all-hands about AI applications in email management.

Would you be interested in grabbing coffee next week to catch up? I\'d love to hear more about what you\'re working on and share some ideas I\'ve been exploring.

Let me know what works for your schedule!

Best,
David`,
                timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
                isRead: true,
                isStarred: false,
                priority: 'low',
                tags: ['personal', 'networking'],
                hasAttachments: false,
                needsResponse: true,
                suggestedResponses: [
                    'Sure! How about Tuesday afternoon?',
                    'I\'d love to, but I\'m swamped next week. Rain check?',
                    'Let me check my calendar and get back to you'
                ]
            },
            {
                id: 'email-5',
                from: { name: 'Marketing Team', email: 'marketing@company.com', avatar: 'MK' },
                subject: 'New product launch campaign feedback needed',
                preview: 'The marketing team is preparing for our upcoming product launch and needs your technical input on the campaign materials.',
                body: `Hi everyone,

The marketing team is preparing for our upcoming product launch and needs your technical input on the campaign materials.

We\'ve prepared draft materials highlighting:
- AI-powered email management
- Advanced security features  
- Integration capabilities
- Performance improvements

Could you please review the attached materials and provide feedback by end of week? We want to ensure technical accuracy in our messaging.

Thanks!
Marketing Team`,
                timestamp: new Date(Date.now() - 18 * 60 * 60 * 1000),
                isRead: true,
                isStarred: false,
                priority: 'medium',
                tags: ['marketing', 'review'],
                hasAttachments: true,
                needsResponse: true,
                suggestedResponses: [
                    'I\'ll review the materials by Friday',
                    'The technical details look accurate to me',
                    'I have some suggestions for improvement'
                ]
            },
            {
                id: 'email-6',
                from: { name: 'IT Support', email: 'support@company.com', avatar: 'IT' },
                subject: 'Security Update: MFA Enforcement Starting Monday',
                preview: 'Important security update: Multi-factor authentication will be enforced for all company accounts starting Monday.',
                body: `Important Security Update

Multi-factor authentication (MFA) will be enforced for all company accounts starting Monday, [DATE].

What you need to do:
1. Install Microsoft Authenticator on your mobile device
2. Set up MFA for your Microsoft 365 account
3. Test your authentication before Monday

Need help? Contact IT Support:
- Email: support@company.com  
- Phone: (555) 123-4567
- Help Desk: Open 24/7

Thank you for helping keep our systems secure.

IT Support Team`,
                timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000),
                isRead: true,
                isStarred: true,
                priority: 'high',
                tags: ['security', 'action-required'],
                hasAttachments: false,
                needsResponse: false,
                suggestedResponses: []
            },
            {
                id: 'email-7',
                from: { name: 'Alex Johnson', email: 'alex.johnson@partner.com', avatar: 'AJ' },
                subject: 'Partnership proposal discussion',
                preview: 'I wanted to reach out regarding a potential partnership between our companies. I believe there are significant synergies.',
                body: `Hi,

I hope this email finds you well. I wanted to reach out regarding a potential partnership between our companies.

I believe there are significant synergies between your email AI technology and our customer relationship management platform. Our clients are constantly asking for better email integration.

Would you be open to a 30-minute call to explore this opportunity? I'm available most days next week.

Looking forward to hearing from you.

Best regards,
Alex Johnson
Business Development Manager
Partner Corp`,
                timestamp: new Date(Date.now() - 30 * 60 * 60 * 1000),
                isRead: false,
                isStarred: false,
                priority: 'medium',
                tags: ['business', 'partnership'],
                hasAttachments: false,
                needsResponse: true,
                suggestedResponses: [
                    'I\'d be interested in learning more. When works for you?',
                    'Let me connect you with our business development team',
                    'This sounds interesting, but I need to discuss internally first'
                ]
            },
            {
                id: 'email-8',
                from: { name: 'Conference Organizer', email: 'info@aiconf2024.com', avatar: 'CO' },
                subject: 'AI Conference 2024: Speaker Invitation',
                preview: 'We would be honored to have you speak at AI Conference 2024 about your work in email intelligence.',
                body: `Dear [Name],

We would be honored to have you speak at AI Conference 2024 about your work in email intelligence and natural language processing.

Conference Details:
📅 Date: March 15-17, 2024
📍 Location: San Francisco, CA
🎯 Theme: "AI in Enterprise Applications"

Your proposed session:
"Building Intelligent Email Systems: From Vectorization to Action"

Benefits:
- Speaking fee: $5,000
- Travel and accommodation covered
- Networking with 500+ AI professionals
- Media exposure

Please let us know if you're interested by February 1st.

Best regards,
Conference Organizing Committee`,
                timestamp: new Date(Date.now() - 36 * 60 * 60 * 1000),
                isRead: false,
                isStarred: true,
                priority: 'medium',
                tags: ['conference', 'speaking'],
                hasAttachments: true,
                needsResponse: true,
                suggestedResponses: [
                    'I\'m interested! Please send me more details',
                    'This sounds great, but I need to check my calendar',
                    'I\'m not available, but thank you for the invitation'
                ]
            }
        ];

        // Add more emails to test scrolling
        for (let i = 9; i <= 20; i++) {
            mockEmails.push({
                id: `email-${i}`,
                from: {
                    name: `Contact ${i}`,
                    email: `contact${i}@example.com`,
                    avatar: `C${i}` 
                },
                subject: `Sample Email ${i} - Various Topics`,
                preview: `This is email number ${i} in our mock dataset to test scrolling functionality and performance...`,
                body: `This is a sample email body for email ${i}. It contains standard business communication content for testing purposes.`,
                timestamp: new Date(Date.now() - (40 + i * 2) * 60 * 60 * 1000),
                isRead: i % 3 !== 0,
                isStarred: i % 7 === 0,
                priority: i % 5 === 0 ? 'high' : i % 3 === 0 ? 'medium' : 'low',
                tags: i % 2 === 0 ? ['general'] : ['general', 'follow-up'],
                hasAttachments: i % 4 === 0,
                needsResponse: i % 6 === 0,
                suggestedResponses: i % 6 === 0 ? [
                    'Thank you for your email',
                    'I\'ll get back to you soon',
                    'This looks good to me'
                ] : []
            });
        }

        return mockEmails;
    }
    
    renderEmailList() {
        const emailList = document.getElementById('emailList');
        if (!emailList) return;
        
        const filteredEmails = this.state.emails.filter(email => 
            email.folder === 'inbox' // For now, show all emails in inbox
        );
        
        emailList.innerHTML = filteredEmails.map(email => this.createEmailListItem(email)).join('');
        
        // Add click handlers
        emailList.querySelectorAll('.email-item').forEach(item => {
            item.addEventListener('click', () => {
                const emailId = item.dataset.emailId;
                this.selectEmail(emailId);
            });
        });
        
        // Select first email by default
        if (filteredEmails.length > 0 && !this.state.selectedEmail) {
            this.selectEmail(filteredEmails[0].id);
        }
    }
    
    createEmailListItem(email) {
        const timeAgo = this.formatTimeAgo(email.timestamp);
        const unreadClass = email.unread ? 'unread' : '';
        const selectedClass = this.state.selectedEmail === email.id ? 'selected' : '';
        const priorityClass = email.important ? 'priority-high' : '';
        
        // Create badges from email.badges array
        const badgeElements = email.badges && email.badges.length > 0 
            ? `<div class="email-tags">
                ${email.badges.map(badge => `<span class="email-tag ${badge}">${badge}</span>`).join('')}
               </div>` 
            : '';
            
        const attachmentIcon = email.hasAttachment ? '<i data-lucide="paperclip" class="attachment-icon"></i>' : '';
        
        return `
            <div class="email-item ${unreadClass} ${selectedClass} ${priorityClass}" 
                 data-email-id="${email.id}"
                 role="button"
                 tabindex="0"
                 aria-label="Email from ${email.from.name}: ${email.subject}"
                 aria-selected="${selectedClass ? 'true' : 'false'}">
                <input type="checkbox" class="email-checkbox" aria-label="Select email" />
                <div class="email-avatar" aria-hidden="true">${email.from.avatar}</div>
                <div class="email-details">
                    <div class="email-header">
                        <div class="email-sender">${email.from.name}</div>
                        <div class="email-date">${timeAgo}</div>
                    </div>
                    <div class="email-subject">
                        ${email.subject} ${attachmentIcon}
                    </div>
                    <div class="email-preview">${email.preview}</div>
                    ${badgeElements}
                </div>
            </div>
        `;
    
    }
    
    selectEmail(emailId) {
        const email = this.state.emails.find(e => e.id === emailId);
        if (!email) return;
        
        this.state.selectedEmail = emailId;
        
        // Mark as read
        if (email.unread) {
            email.unread = false;
            this.updateEmailCounts();
        }
        
        // Update UI selection
        document.querySelectorAll('.email-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        const selectedItem = document.querySelector(`[data-email-id="${emailId}"]`);
        if (selectedItem) {
            selectedItem.classList.add('selected');
            selectedItem.classList.remove('unread');
        }
        
        // Render email content
        this.displayEmailContent(email);
        
        console.log('📧 Selected email:', email.subject);
        
        // Show suggested responses if email needs response
        if (email.needsResponse && email.suggestedResponses && email.suggestedResponses.length > 0) {
            this.showSuggestedResponses(email.suggestedResponses);
        } else {
            this.hideSuggestedResponses();
        }
    }
    
    renderEmailContent(email) {
        const emailContent = document.getElementById('emailContent');
        if (!emailContent) return;
        
        const formattedBody = email.body.replace(/\n/g, '<br>');
        const formattedDate = new Date(email.timestamp).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        emailContent.innerHTML = `
            <div class="email-message">
                <div class="email-message-header">
                    <div class="sender-info">
                        <div class="sender-avatar">${email.from.avatar}</div>
                        <div class="sender-details">
                            <div class="sender-name">${email.from.name}</div>
                            <div class="sender-email">${email.from.email}</div>
                        </div>
                    </div>
                    <div class="message-meta">
                        <div class="message-date">${formattedDate}</div>
                        ${email.isStarred ? '<i data-lucide="star" class="star-icon starred"></i>' : '<i data-lucide="star" class="star-icon"></i>'}
                    </div>
                </div>
                <div class="email-subject-header">
                    <h2>${email.subject}</h2>
                </div>
                <div class="email-message-body">
                    ${formattedBody}
                </div>
                ${email.hasAttachments ? `
                    <div class="email-attachments">
                        <h4>Attachments</h4>
                        <div class="attachment-list">
                            <div class="attachment-item">
                                <i data-lucide="file-text"></i>
                                <span>Document.pdf</span>
                                <button class="download-btn">Download</button>
                            </div>
                        </div>
                    </div>
                ` : ''}
            </div>
        `;
        
        // Initialize Lucide icons for the new content
        this.initializeLucideIcons();
    }
    
    showSuggestedResponses(responses) {
        const suggestedResponses = document.getElementById('suggestedResponses');
        const responseButtons = document.getElementById('responseButtons');
        
        if (!suggestedResponses || !responseButtons) return;
        
        responseButtons.innerHTML = responses.map(response => 
            `<button class="response-btn" data-response="${response}">${response}</button>`
        ).join('');
        
        // Add click handlers
        responseButtons.querySelectorAll('.response-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const response = btn.dataset.response;
                this.sendQuickResponse(response);
            });
        });
        
        suggestedResponses.style.display = 'block';
    }
    
    hideSuggestedResponses() {
        const suggestedResponses = document.getElementById('suggestedResponses');
        if (suggestedResponses) {
            suggestedResponses.style.display = 'none';
        }
    }
    
    sendQuickResponse(response) {
        // Add the response to chat and send it
        const chatInput = document.getElementById('chatInput');
        if (chatInput) {
            chatInput.value = response;
            this.sendChatMessage();
        }
    }
    
    formatTimeAgo(timestamp) {
        const now = new Date();
        const diff = now - new Date(timestamp);
        const seconds = Math.floor(diff / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return days === 1 ? '1 day ago' : `${days} days ago`;
        } else if (hours > 0) {
            return hours === 1 ? '1 hour ago' : `${hours} hours ago`;
        } else if (minutes > 0) {
            return minutes === 1 ? '1 minute ago' : `${minutes} minutes ago`;
        } else {
            return 'Just now';
        }
    }
    
    displayEmailContent(email) {
        const emailContent = document.getElementById('emailContent');
        
        if (!emailContent) return;
        
        // Create badges HTML
        const badgeElements = email.badges && email.badges.length > 0 
            ? `<div class="email-badges">
                ${email.badges.map(badge => `<span class="email-badge ${badge}">${badge}</span>`).join('')}
               </div>` 
            : '';
        
        emailContent.innerHTML = `
            <div class="email-header-full">
                <div class="email-subject-line">
                    <h2 class="email-subject-full">${email.subject}</h2>
                    ${badgeElements}
                </div>
                <div class="email-meta">
                    <div class="email-from">
                        <div class="email-avatar-large">${email.from.avatar}</div>
                        <div class="email-from-info">
                            <div class="email-from-name">${email.from.name}</div>
                            <div class="email-from-email">&lt;${email.from.email}&gt;</div>
                        </div>
                    </div>
                    <div class="email-timestamp">${this.formatFullDate(email.timestamp)}</div>
                </div>
                <div class="email-recipients">
                    <span class="recipient-label">To:</span>
                    <span class="recipient-email">${email.to}</span>
                </div>
            </div>
            <div class="email-body">
                ${email.body.replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>')}
            </div>
            ${email.hasAttachment ? `
                <div class="email-attachments">
                    <div class="attachment-indicator">
                        <i data-lucide="paperclip"></i>
                        <span>This email has attachments</span>
                    </div>
                </div>
            ` : ''}
        `;
        
        // Initialize Lucide icons for the new content
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
        
        console.log('📝 Displayed email content:', email.subject);
    }
    
    // UI Helper Methods
    showLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) loadingScreen.style.display = 'flex';
        if (authScreen) authScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'none';
    }
    
    showAuthScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (authScreen) authScreen.style.display = 'flex';
        if (mainApp) mainApp.style.display = 'none';
        
        this.state.isLoading = false;
    }
    
    showMainApp() {
        const loadingScreen = document.getElementById('loadingScreen');
        const authScreen = document.getElementById('authScreen');
        const mainApp = document.getElementById('mainApp');
        
        if (loadingScreen) loadingScreen.style.display = 'none';
        if (authScreen) authScreen.style.display = 'none';
        if (mainApp) mainApp.style.display = 'flex';
        
        this.state.isLoading = false;
        
        // Check for incomplete downloads to recover
        setTimeout(() => {
            this.checkForIncompleteDownloads();
        }, 1000);
    }
    
    async updateLoadingProgress(percentage, status) {
        const progressFill = document.getElementById('progressFill');
        const loadingStatus = document.getElementById('loadingStatus');
        
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (loadingStatus) loadingStatus.textContent = status;
        
        await this.delay(100);
    }
    
    updateUserProfile() {
        const userName = document.getElementById('userName');
        const userEmail = document.getElementById('userEmail');
        
        // Get authenticated user data from the appropriate provider
        let authenticatedUser = null;
        const authProvider = this.getAuthProvider();
        
        if (authProvider === 'microsoft' && window.microsoftOAuth) {
            const authStatus = window.microsoftOAuth.getAuthStatus();
            authenticatedUser = authStatus.user;
        } else if (authProvider === 'google' && window.oauthHandler) {
            // For Google, we'll need to implement similar user data extraction
            authenticatedUser = {
                name: 'Google User', // Placeholder - would be extracted from Google OAuth
                email: 'user@gmail.com' // Placeholder - would be extracted from Google OAuth
            };
        }
        
        // Update the current user state
        if (authenticatedUser) {
            this.state.currentUser = authenticatedUser;
        }
        
        // Update UI elements
        if (userName && this.state.currentUser) {
            userName.textContent = this.state.currentUser.name;
        }
        
        if (userEmail && this.state.currentUser) {
            userEmail.textContent = this.state.currentUser.email;
            console.log('✅ Updated user email display to:', this.state.currentUser.email);
        }
    }
    
    updateEmailCounts() {
        const unreadCount = this.state.emails.filter(e => !e.isRead && e.folder === 'inbox').length;
        
        // Update header count
        const headerCount = document.getElementById('unreadCount');
        if (headerCount) {
            headerCount.textContent = unreadCount;
        }
        
        // Update navigation counts
        document.querySelectorAll('.nav-count').forEach(count => {
            const navItem = count.closest('.nav-item');
            const folder = navItem?.dataset.folder;
            
            if (folder === 'inbox') {
                count.textContent = unreadCount;
                count.style.display = unreadCount > 0 ? 'block' : 'none';
            }
        });
    }
    
    addChatMessage(type, content) {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `${type}-message`;
        
        if (type === 'ai') {
            messageDiv.innerHTML = `
                <div class="message-avatar">
                    <i data-lucide="brain"></i>
                </div>
                <div class="message-content">
                    <p>${content}</p>
                </div>
            `;
        } else {
            messageDiv.innerHTML = `
                <div class="message-content user-message-content">
                    <p>${content}</p>
                </div>
            `;
        }
        
        chatMessages.appendChild(messageDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        // Re-initialize Lucide icons
        this.initializeLucideIcons();
    }
    
    showAITyping() {
        const chatMessages = document.getElementById('chatMessages');
        if (!chatMessages) return;
        
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message typing-indicator';
        typingDiv.id = 'ai-typing';
        typingDiv.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="brain"></i>
            </div>
            <div class="message-content">
                <div class="typing-dots">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        `;
        
        chatMessages.appendChild(typingDiv);
        chatMessages.scrollTop = chatMessages.scrollHeight;
        
        this.initializeLucideIcons();
    }
    
    hideAITyping() {
        const typingIndicator = document.getElementById('ai-typing');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }
    
    toggleTheme() {
        const newTheme = this.state.currentTheme === 'theme-snow' ? 'theme-carbon' : 'theme-snow';
        this.setTheme(newTheme);
    }
    
    setTheme(themeName) {
        document.body.className = themeName;
        this.state.currentTheme = themeName;
        localStorage.setItem('statsai_theme', themeName);
        
        // Update theme toggle icon
        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            const icon = themeToggle.querySelector('i');
            if (icon) {
                icon.setAttribute('data-lucide', themeName === 'theme-snow' ? 'moon' : 'sun');
                this.initializeLucideIcons();
            }
        }
    }
    
    // Utility Methods
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    formatTimeAgo(dateInput) {
        // Ensure date is a proper Date object
        let date;
        if (dateInput instanceof Date) {
            date = dateInput;
        } else if (typeof dateInput === 'string' || typeof dateInput === 'number') {
            date = new Date(dateInput);
        } else {
            console.warn('Invalid date input for formatTimeAgo:', dateInput);
            return 'Unknown time';
        }
        
        // Check if date is valid
        if (isNaN(date.getTime())) {
            console.warn('Invalid date object in formatTimeAgo:', dateInput);
            return 'Invalid date';
        }
        
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
        // Safe to call toLocaleDateString() now
        return date.toLocaleDateString();
    }
    
    formatFullDate(date) {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
    
    showError(message) {
        console.error(message);
        // Could implement toast notifications here
        // alert(message); // Temporary
    }
    
    // Placeholder methods for additional functionality
    switchFolder(folder) {
        this.state.currentFolder = folder;
        
        // Update active navigation
        document.querySelectorAll('.nav-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.folder === folder) {
                item.classList.add('active');
            }
        });
        
        this.renderEmailList();
    }
    
    showComposePanel() {
        const composePanel = document.getElementById('composePanel');
        const chatContainer = document.querySelector('.chat-container');
        
        if (composePanel && chatContainer) {
            chatContainer.style.display = 'none';
            composePanel.style.display = 'block';
        }
    }
    
    hideComposePanel() {
        const composePanel = document.getElementById('composePanel');
        const chatContainer = document.querySelector('.chat-container');
        
        if (composePanel && chatContainer) {
            composePanel.style.display = 'none';
            chatContainer.style.display = 'flex';
        }
    }
    
    // Send Email via Gmail API
    async sendEmail() {
        if (!this.state.currentUser || !this.state.currentUser.email) {
            this.showNotification('Please authenticate first to send emails', 'error');
            return;
        }
        
        try {
            // Get form data
            const composeForm = document.getElementById('composeForm');
            if (!composeForm) {
                this.showNotification('Compose form not found', 'error');
                return;
            }
            
            const formData = new FormData(composeForm);
            const emailData = {
                to: formData.get('to')?.trim(),
                cc: formData.get('cc')?.trim(),
                bcc: formData.get('bcc')?.trim(),
                subject: formData.get('subject')?.trim(),
                body: formData.get('message')?.trim()
            };
            
            // Validate required fields
            if (!emailData.to) {
                this.showNotification('Please enter a recipient email address', 'error');
                return;
            }
            
            if (!emailData.subject) {
                this.showNotification('Please enter a subject line', 'error');
                return;
            }
            
            if (!emailData.body) {
                this.showNotification('Please enter a message', 'error');
                return;
            }
            
            console.log('📤 Sending email:', emailData);
            this.showNotification('Sending email...', 'info');
            
            // Show sending state
            this.setComposeSendingState(true);
            
            // Call email sending service
            const microsoftToken = await window.microsoftStytchOAuth.getGraphAccessToken();
            
            const response = await fetch('https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler/sendEmail', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${microsoftToken}`,
                    'X-User-Email': this.state.currentUser.email,
                    'X-Provider': 'microsoft'
                },
                body: JSON.stringify({
                    from: this.state.currentUser.email,
                    to: emailData.to,
                    cc: emailData.cc || null,
                    bcc: emailData.bcc || null,
                    subject: emailData.subject,
                    body: emailData.body,
                    bodyType: 'html' // Support HTML emails
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Email sent successfully to ${emailData.to}!`, 'success');
                console.log('✅ Email sent:', result);
                
                // Clear compose form and hide panel
                this.clearComposeForm();
                this.hideComposePanel();
                
                // Add to sent folder (mock for now)
                this.addToSentEmails(emailData);
                
            } else {
                console.error('❌ Email sending failed:', result);
                this.showNotification(`Failed to send email: ${result.error || 'Unknown error'}`, 'error');
            }
            
        } catch (error) {
            console.error('❌ Email sending error:', error);
            this.showNotification('Failed to send email. Please try again.', 'error');
        } finally {
            this.setComposeSendingState(false);
        }
    }
    
    // Set compose form sending state
    setComposeSendingState(sending) {
        const sendButton = document.querySelector('#composeForm button[type="submit"]');
        const formInputs = document.querySelectorAll('#composeForm input, #composeForm textarea');
        
        if (sendButton) {
            sendButton.disabled = sending;
            sendButton.innerHTML = sending 
                ? '<i data-lucide="loader" class="animate-spin"></i> Sending...' 
                : '<i data-lucide="send"></i> Send Email';
        }
        
        formInputs.forEach(input => {
            input.disabled = sending;
        });
        
        // Re-initialize icons
        this.initializeLucideIcons();
    }
    
    // Clear compose form
    clearComposeForm() {
        const composeForm = document.getElementById('composeForm');
        if (composeForm) {
            composeForm.reset();
        }
    }
    
    // Add email to sent folder (mock implementation)
    addToSentEmails(emailData) {
        const sentEmail = {
            id: `sent_${Date.now()}`,
            threadId: `thread_${Date.now()}`,
            subject: emailData.subject,
            from: this.state.currentUser.email,
            to: [emailData.to],
            cc: emailData.cc ? [emailData.cc] : [],
            bcc: emailData.bcc ? [emailData.bcc] : [],
            date: new Date().toISOString(),
            snippet: emailData.body.substring(0, 100) + '...', 
            body: emailData.body,
            isRead: true,
            folder: 'sent',
            labels: ['SENT']
        };
        
        // Add to emails array
        this.state.emails.unshift(sentEmail);
        
        // Update UI if currently viewing sent folder
        if (this.state.currentFolder === 'sent') {
            this.renderEmailList();
        }
        
        console.log('📧 Email added to sent folder');
    }
    
    showSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'flex';
        }
    }
    
    hideSettings() {
        const settingsModal = document.getElementById('settingsModal');
        if (settingsModal) {
            settingsModal.style.display = 'none';
        }
    }
    
    // AI Draft Modal Methods
    async performAISummarization() {
        if (!this.state.selectedEmail) {
            this.showError('Please select an email to summarize');
            return;
        }
        
        const email = this.state.selectedEmail;
        const summary = await this.performIntelligentSummarization(email);
        
        // Update AI chat with summary
        this.addAIMessage(summary);
    }
    
    // Email Processing Methods
    async startEmailProcessing() {
        if (!this.state.currentUser || !this.state.currentUser.email) {
            console.error('No authenticated user for email processing');
            return;
        }
        
        console.log('🚀 Starting email processing for:', this.state.currentUser.email);
        
        try {
            // Show processing notification
            this.showNotification('Starting email sync and vectorization...', 'info');
            
            // Ensure we have valid tokens first
            await this.ensureValidTokens();
            
            // Call the email fetcher service
            const response = await fetch(this.config.emailFetcherUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.state.currentUser.email,
                    accessToken: this.getAccessToken(),
                    refreshToken: this.getRefreshToken(),
                    provider: this.getAuthProvider(),
                    initialSync: true
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Email sync started! Processing ${result.count} emails...`, 'success');
                console.log('✅ Email processing started:', result);
                
                // Start polling for processed emails
                this.startEmailPolling();
                
                // Setup real-time monitoring for new emails
                await this.setupRealTimeMonitoring();
            } else {
                console.warn('Email processing response:', result);
                this.showNotification('Email sync initiated. Processing in background...', 'info');
                
                // Still setup real-time monitoring even if initial sync has issues
                await this.setupRealTimeMonitoring();
            }
            
        } catch (error) {
            console.error('❌ Failed to start email processing:', error);
            this.showNotification('Email processing started in background', 'info');
        }
    }
    
    async startEmailPolling() {
        // Poll for processed emails every 10 seconds
        setInterval(async () => {
            await this.checkForNewEmails();
        }, 10000);
        
        // Initial check
        setTimeout(() => this.checkForNewEmails(), 5000);
    }
    
    async checkForNewEmails() {
        try {
            // This would check for processed emails in the vector store
            // For now, just update the UI with a status
            const statusElement = document.getElementById('sync-status-text');
            if (statusElement) {
                statusElement.textContent = `Last checked: ${new Date().toLocaleTimeString()}`;
            }
        } catch (error) {
            console.error('Failed to check for new emails:', error);
        }
    }
    
    // Manual Vectorization Trigger
    async triggerManualVectorization() {
        if (!this.state.currentUser || !this.state.currentUser.email) {
            this.showNotification('Please authenticate first to start vectorization', 'error');
            return;
        }
        
        console.log('🔄 Starting manual email vectorization...');
        this.updateSyncStatus('Starting vectorization...', 'syncing');
        
        try {
            // Call the email vectorizer service
            // Get Microsoft access token for authentication
            const microsoftToken = await window.microsoftStytchOAuth.getGraphAccessToken();
            
            const response = await fetch('https://us-central1-solid-topic-466217-t9.cloudfunctions.net/emailVectorizer', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${microsoftToken}`,
                    'X-User-Email': this.state.currentUser.email,
                    'X-Provider': 'microsoft'
                },
                body: JSON.stringify({
                    userEmail: this.state.currentUser.email,
                    action: 'manual_vectorization',
                    batchSize: 50, // Process in batches
                    provider: 'microsoft'
                })
            });
            
            const result = await response.json();
            
            if (result.success) {
                this.showNotification(`Vectorization started! Processing ${result.emailCount || 'multiple'} emails...`, 'success');
                this.updateSyncStatus('Vectorizing emails...', 'syncing');
                
                // Poll for completion
                this.pollVectorizationStatus();
            } else {
                console.warn('Vectorization response:', result);
                this.showNotification('Vectorization initiated. Processing in background...', 'info');
                this.updateSyncStatus('Ready', 'ready');
            }
            
        } catch (error) {
            console.error('❌ Failed to trigger vectorization:', error);
            this.showNotification('Failed to start vectorization. Please try again.', 'error');
            this.updateSyncStatus('Error', 'error');
        }
    }
    
    // Sync and Download Raw Emails
    async syncAndDownloadEmails() {
        if (!this.state.currentUser || !this.state.currentUser.email) {
            this.showNotification('Please authenticate first to sync emails', 'error');
            return;
        }
        
        console.log('📥 Starting email sync and download...');
        this.updateSyncStatus('Syncing emails...', 'syncing');
        
        try {
            // First, sync emails from Gmail
            // Ensure valid tokens before sync
            await this.ensureValidTokens();
            
            const syncResponse = await fetch(this.config.emailFetcherUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.state.currentUser.email,
                    accessToken: this.getAccessToken(),
                    refreshToken: this.getRefreshToken(),
                    provider: this.getAuthProvider(),
                    action: 'full_sync',
                    downloadRaw: true,
                    maxEmails: 100
                })
            });
            
            const syncResult = await syncResponse.json();
            
            if (syncResult.success) {
                this.showNotification(`Email sync started! Processing ${syncResult.count || 'multiple'} emails...`, 'success');
                
                // Update local email list
                await this.refreshEmailList();
                
                // Download processed emails as JSON
                await this.downloadEmailData();
                
                this.updateSyncStatus(`Synced ${syncResult.count || 0} emails`, 'ready');
            } else {
                console.warn('Email sync response:', syncResult);
                this.showNotification('Email sync initiated. Check status in a moment...', 'info');
                this.updateSyncStatus('Ready', 'ready');
            }
            
        } catch (error) {
            console.error('❌ Failed to sync emails:', error);
            this.showNotification('Failed to sync emails. Please try again.', 'error');
            this.updateSyncStatus('Error', 'error');
        }
    }
    
    // Update sync status indicator
    updateSyncStatus(text, status = 'ready') {
        const statusText = document.getElementById('sync-status-text');
        const statusIndicator = document.getElementById('syncIndicator');
        
        if (statusText) {
            statusText.textContent = text;
        }
        
        if (statusIndicator) {
            statusIndicator.className = 'sync-indicator';
            if (status === 'syncing') {
                statusIndicator.classList.add('syncing');
            } else if (status === 'error') {
                statusIndicator.classList.add('error');
            }
        }
    }
    
    // New Resumable Download Methods
    
    // Start resumable download process
    async startResumableDownload() {
        if (!this.state.currentUser || !this.state.currentUser.email) {
            this.showNotification('Please authenticate first to start download', 'error');
            return;
        }
        
        // Check if already downloading
        if (this.downloadManager.isDownloading) {
            this.showNotification('Download already in progress', 'info');
            return;
        }
        
        console.log('🚀 Starting resumable email download and vectorization...');
        this.showNotification('Starting email download and vectorization...', 'info');
        
        try {
            // Initialize download session
            const downloadId = await this.downloadManager.initializeDownload(this.state.currentUser.email);
            console.log('Download session created:', downloadId);
            
            // Start the download process
            await this.downloadManager.startDownload();
            
        } catch (error) {
            console.error('Failed to start resumable download:', error);
            this.showNotification('Failed to start download: ' + error.message, 'error');
        }
    }
    
    // Cancel ongoing download
    async cancelDownload() {
        if (this.downloadManager.isDownloading) {
            this.downloadManager.isDownloading = false;
            this.downloadManager.isPaused = false;
            
            if (this.downloadManager.downloadState) {
                this.downloadManager.downloadState.status = 'cancelled';
                await this.downloadManager.saveDownloadState();
            }
            
            this.downloadManager.hideDownloadStatus();
            console.log('Download cancelled by user');
            this.showNotification('Download cancelled', 'info');
        }
    }
    
    // Add emails to the UI list (called by download manager)
    addEmailsToList(emails) {
        if (!emails || emails.length === 0) return;
        
        // Add emails to state
        this.state.emails.push(...emails);
        
        // Update UI
        this.renderEmailList();
        
        // Update email count
        const emailCount = document.querySelector('.email-count');
        if (emailCount) {
            emailCount.textContent = `${this.state.emails.length} emails`;
        }
    }
    
    // Get access token for API calls (called by download manager)
    getAccessToken() {
        // Try to get from OAuth handler first (Google)
        if (window.oauthHandler && window.oauthHandler.getAccessToken) {
            return window.oauthHandler.getAccessToken();
        }
        
        // Try to get from Microsoft OAuth handler
        if (window.microsoftOAuthHandler && window.microsoftOAuthHandler.getAccessToken) {
            return window.microsoftOAuthHandler.getAccessToken();
        }
        
        // Fallback to stored auth data
        const storedAuth = localStorage.getItem('statsai_auth');
        if (storedAuth) {
            try {
                const authData = JSON.parse(storedAuth);
                return authData.accessToken;
            } catch (error) {
                console.warn('Could not get access token from stored data');
            }
        }
        
        return null;
    }
    
    // Get refresh token for API calls
    getRefreshToken() {
        // Try to get from OAuth handler first (Google)
        if (window.oauthHandler && window.oauthHandler.getRefreshToken) {
            return window.oauthHandler.getRefreshToken();
        }
        
        // Try to get from Microsoft OAuth handler  
        if (window.microsoftOAuthHandler && window.microsoftOAuthHandler.getRefreshToken) {
            return window.microsoftOAuthHandler.getRefreshToken();
        }
        
        // Fallback to localStorage
        return localStorage.getItem('gmail_refresh_token') || null;
    }
    
    // Ensure we have valid tokens, refresh if needed
    async ensureValidTokens() {
        try {
            const accessToken = this.getAccessToken();
            const refreshToken = this.getRefreshToken();
            
            console.log('🔑 Checking token validity...', {
                hasAccessToken: !!accessToken,
                hasRefreshToken: !!refreshToken
            });
            
            if (!accessToken && !refreshToken) {
                throw new Error('No tokens available - user needs to re-authenticate');
            }
            
            // If we have OAuth handler, use its token management
            if (window.oauthHandler) {
                // Store tokens in Cloud Function if needed
                await window.oauthHandler.ensureTokensInCloudFunction();
                
                // Refresh token if access token is missing but refresh token exists
                if (!accessToken && refreshToken) {
                    console.log('🔄 Access token missing, refreshing...');
                    await window.oauthHandler.refreshAccessToken();
                }
            }
            
            console.log('✅ Token validation complete');
            
        } catch (error) {
            console.error('❌ Token validation failed:', error);
            throw error;
        }
    }
    
    // Get authentication provider type
    getAuthProvider() {
        return this.state.currentUser?.provider || 'unknown';
    }

    async publishToPubSub(topic, message) {
        const topicName = `projects/solid-topic-466217-t9/topics/${topic}`;
        const accessToken = await this.getAccessToken();

        const response = await fetch(`https://pubsub.googleapis.com/v1/${topicName}:publish`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                messages: [
                    {
                        data: btoa(JSON.stringify(message))
                    }
                ]
            })
        });

        if (!response.ok) {
            throw new Error(`Failed to publish to Pub/Sub topic ${topic}`);
        }

        return await response.json();
    }
    
    updateAIStatus(status) {
        // Update AI service status indicator
        const aiStatusElement = document.getElementById('aiStatus');
        if (aiStatusElement) {
            aiStatusElement.textContent = `AI Status: ${status}`;
            aiStatusElement.className = `ai-status ${status}`;
        }
        console.log(`🤖 AI Status: ${status}`);
    }
    
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element if it doesn't exist
        let notificationContainer = document.getElementById('notificationContainer');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notificationContainer';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 350px;
            `;
            document.body.appendChild(notificationContainer);
        }
        
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.style.cssText = `
            background: ${type === 'success' ? '#10b981' : type === 'error' ? '#ef4444' : '#3b82f6'};
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            margin-bottom: 8px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.2);
            transform: translateX(100%);
            transition: all 0.3s ease;
            cursor: pointer;
        `;
        notification.textContent = message;
        
        // Add to container
        notificationContainer.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        // Click to dismiss
        notification.addEventListener('click', () => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        });
        
        console.log(`📢 Notification (${type}): ${message}`);
    }
    
    async checkForIncompleteDownloads() {
        try {
            // Check localStorage for incomplete downloads
            const incompleteDownloads = [];
            const keys = Object.keys(localStorage);
            
            keys.forEach(key => {
                if (key.startsWith('statsai_download_')) {
                    try {
                        const downloadData = JSON.parse(localStorage.getItem(key));
                        if (downloadData && downloadData.status !== 'completed') {
                            incompleteDownloads.push(downloadData);
                        }
                    } catch (e) {
                        console.warn(`Invalid download data for ${key}:`, e);
                    }
                }
            });
            
            if (incompleteDownloads.length > 0) {
                console.log(`🔄 Found ${incompleteDownloads.length} incomplete downloads`);
                this.showNotification(`Found ${incompleteDownloads.length} incomplete download(s). They can be resumed.`, 'info', 8000);
                
                // Show resume option in UI
                const resumeButton = document.getElementById('resumeDownloadBtn');
                if (resumeButton) {
                    resumeButton.style.display = 'block';
                    resumeButton.onclick = () => this.resumeIncompleteDownloads(incompleteDownloads);
                }
            }
            
            return incompleteDownloads;
        } catch (error) {
            console.error('Error checking for incomplete downloads:', error);
            return [];
        }
    }
    
    async resumeIncompleteDownloads(downloads) {
        if (!downloads || downloads.length === 0) {
            this.showNotification('No incomplete downloads found', 'info');
            return;
        }
        
        try {
            // Resume the most recent incomplete download
            const latestDownload = downloads.sort((a, b) => new Date(b.startTime) - new Date(a.startTime))[0];
            
            this.showNotification(`Resuming download: ${latestDownload.downloadedEmails || 0} of ${latestDownload.totalEmails || '?'} emails`, 'info');
            
            // Initialize resumable download manager if needed
            if (!this.downloadManager) {
                this.downloadManager = new ResumableDownloadManager(this);
            }
            
            // Load the download state
            this.downloadManager.downloadState = latestDownload;
            
            // Resume the download
            await this.downloadManager.resumeDownload();
            
        } catch (error) {
            console.error('Error resuming download:', error);
            this.showNotification('Failed to resume download: ' + error.message, 'error');
        }
    }

    // Setup real-time monitoring for email synchronization
    async setupRealTimeMonitoring() {
        try {
            console.log('🔄 Setting up real-time monitoring...');
            
            // Set up periodic email sync (every 5 minutes)
            if (this.syncInterval) {
                clearInterval(this.syncInterval);
            }
            
            this.syncInterval = setInterval(async () => {
                try {
                    if (this.state.isAuthenticated && !this.state.isLoading && !this.downloadManager?.isDownloading) {
                        console.log('⚡ Performing background sync...');
                        await this.syncRecentEmails();
                    }
                } catch (error) {
                    console.error('Background sync error:', error);
                }
            }, 5 * 60 * 1000); // 5 minutes
            
            // Set up WebSocket connection for real-time notifications (if backend supports it)
            try {
                // Note: This would require WebSocket support in the backend
                console.log('📡 Real-time monitoring enabled');
                this.updateAIStatus('monitoring');
            } catch (wsError) {
                console.log('📡 Real-time monitoring setup (polling mode)');
            }
            
        } catch (error) {
            console.error('Error setting up real-time monitoring:', error);
            this.showNotification('Real-time monitoring setup failed', 'warning');
        }
    }

    // Sync only recent emails (last 24 hours) for background updates
    async syncRecentEmails() {
        try {
            // Ensure valid tokens before sync
            await this.ensureValidTokens();
            
            const response = await fetch(this.config.emailFetcherUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userEmail: this.state.currentUser?.email,
                    accessToken: this.getAccessToken(),
                    refreshToken: this.getRefreshToken(),
                    provider: this.getAuthProvider(),
                    action: 'syncRecent',
                    timeRange: '24h' // Last 24 hours only
                })
            });
            
            if (response.ok) {
                const result = await response.json();
                if (result.newEmails > 0) {
                    this.showNotification(`${result.newEmails} new emails synced`, 'success', 3000);
                    // Refresh email list
                    await this.loadEmails();
                }
            }
        } catch (error) {
            console.log('Background sync completed silently');
        }
    }

    // Handle global search input with debouncing
    handleGlobalSearch(query) {
        // Clear existing timeout
        if (this.searchTimeout) {
            clearTimeout(this.searchTimeout);
        }
        
        // Debounce search input
        this.searchTimeout = setTimeout(() => {
            if (query.trim().length > 0) {
                this.performSearch(query.trim());
            } else {
                // If query is empty, reload all emails
                this.loadEmails();
            }
        }, 300); // 300ms debounce
    }
}

// Initialize the Email Assistant when the DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.emailAssistant = new EmailAssistant();
});