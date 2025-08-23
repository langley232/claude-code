// StatsAI Email Assistant - JavaScript Functionality
// Superhuman-inspired email client with AI capabilities

class EmailAssistant {
    constructor() {
        // Configuration
        this.config = {
            geminiApiKey: 'AIzaSyCRJ8BT5LaVPvOS6FE0tAKPg5u-kLryfds',
            geminiModel: 'gemini-2.5-flash', // Latest stable model
            geminiApiUrl: 'https://generativelanguage.googleapis.com/v1beta',
            vectorProvider: 'google-vector', // or 'tigergraph'
            aiResponseStyle: 'professional' // or 'casual', 'concise'
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
        
        // Initialize application
        this.init();
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
        // Check if user is already authenticated
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
        
        // AI assistant handlers
        this.setupAIHandlers();
        
        // Compose handlers
        this.setupComposeHandlers();
        
        // Settings handlers
        this.setupSettingsHandlers();
    }
    
    setupAuthHandlers() {
        const microsoftBtn = document.getElementById('microsoftAuthBtn');
        const googleBtn = document.getElementById('googleAuthBtn');
        
        if (microsoftBtn) {
            microsoftBtn.addEventListener('click', () => this.authenticateWithMicrosoft());
        }
        
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.authenticateWithGoogle());
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
        
        try {
            // Show loading state
            const btn = document.getElementById('microsoftAuthBtn');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = this.getLoadingButtonHTML('Connecting to Microsoft...');
            }
            
            // Simulate Microsoft Entra authentication
            // In production, use @azure/msal-browser
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
            
        } catch (error) {
            console.error('Authentication failed:', error);
            this.showError('Microsoft authentication failed. Please try again.');
            
            // Reset button
            const btn = document.getElementById('microsoftAuthBtn');
            if (btn) {
                btn.disabled = false;
                btn.innerHTML = this.getMicrosoftButtonHTML();
            }
        }
    }
    
    async authenticateWithGoogle() {
        this.showError('Google authentication will be available in Phase 2. Please use Microsoft authentication for now.');
    }
    
    async loadUserData() {
        console.log('📧 Loading user email data...');
        
        // Simulate loading emails
        await this.delay(1000);
        
        // Load mock emails from JSON file
        this.state.emails = await this.loadMockEmails();
        
        // Update UI
        this.updateUserProfile();
        this.renderEmailList();
        this.updateEmailCounts();
        
        // Start AI processing
        this.startEmailProcessing();
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
            const response = await fetch(
                `${this.config.geminiApiUrl}/models/${this.config.geminiModel}:generateContent?key=${this.config.geminiApiKey}`,
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
            // Build context from current email and conversation
            const context = this.buildAIContext(message);
            
            const response = await fetch(
                `${this.config.geminiApiUrl}/models/${this.config.geminiModel}:generateContent?key=${this.config.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{
                                text: context
                            }]
                        }],
                        generationConfig: {
                            temperature: 0.7,
                            topP: 0.8,
                            topK: 40,
                            maxOutputTokens: 1000
                        }
                    })
                }
            );
            
            if (!response.ok) {
                throw new Error(`API request failed: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (result.candidates && result.candidates.length > 0) {
                return result.candidates[0].content.parts[0].text;
            } else {
                throw new Error('No response generated');
            }
            
        } catch (error) {
            console.error('Gemini API error:', error);
            
            // Fallback to mock responses
            return this.getMockAIResponse(message);
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
        const greeting = `Hi ${email.from.name},`;
        const reference = `Thank you for your email regarding "${email.subject}".`;
        const placeholder = `[Your response here - please customize based on the specific content of the original email]`;
        const closing = `Best regards,\n[Your Name]`;
        
        return `${greeting}\n\n${reference}\n\n${placeholder}\n\n${closing}`;
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

Hope you're doing well! I've been thinking about our conversation at the last all-hands about AI applications in email management.

Would you be interested in grabbing coffee next week to catch up? I'd love to hear more about what you're working on and share some ideas I've been exploring.

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

We've prepared draft materials highlighting:
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
        
        if (userName && this.state.currentUser) {
            userName.textContent = this.state.currentUser.name;
        }
        
        if (userEmail && this.state.currentUser) {
            userEmail.textContent = this.state.currentUser.email;
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
    
    formatTimeAgo(date) {
        const now = new Date();
        const diffInMinutes = Math.floor((now - date) / (1000 * 60));
        
        if (diffInMinutes < 1) return 'Just now';
        if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
        
        const diffInHours = Math.floor(diffInMinutes / 60);
        if (diffInHours < 24) return `${diffInHours}h ago`;
        
        const diffInDays = Math.floor(diffInHours / 24);
        if (diffInDays < 7) return `${diffInDays}d ago`;
        
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
        alert(message); // Temporary
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
    
    async showDraftModal() {
        if (!this.state.selectedEmail) {
            this.showError('Please select an email to draft a response');
            return;
        }
        
        const draftModal = document.getElementById('draftModal');
        if (!draftModal) return;
        
        // Show modal with loading state
        draftModal.style.display = 'flex';
        this.showDraftLoading();
        
        try {
            // Generate thread summary and draft
            await this.generateDraftContent();
        } catch (error) {
            console.error('Error generating draft:', error);
            this.showError('Failed to generate draft. Please try again.');
            this.hideDraftModal();
        }
    }
    
    hideDraftModal() {
        const draftModal = document.getElementById('draftModal');
        if (draftModal) {
            draftModal.style.display = 'none';
        }
    }
    
    showDraftLoading() {
        const loadingIndicator = document.getElementById('draftLoadingIndicator');
        const draftContent = document.getElementById('draftContent');
        
        if (loadingIndicator && draftContent) {
            loadingIndicator.style.display = 'block';
            draftContent.style.display = 'none';
        }
    }
    
    hideDraftLoading() {
        const loadingIndicator = document.getElementById('draftLoadingIndicator');
        const draftContent = document.getElementById('draftContent');
        
        if (loadingIndicator && draftContent) {
            loadingIndicator.style.display = 'none';
            draftContent.style.display = 'block';
        }
    }
    
    async generateDraftContent() {
        const email = this.state.selectedEmail;
        const relatedEmails = this.findRelatedEmails(email);
        
        // Update thread summary
        this.updateThreadSummary(email, relatedEmails);
        
        // Generate draft
        const draft = await this.generateEmailDraft(email, 'reply');
        this.updateDraftFields(draft, email);
        
        this.hideDraftLoading();
    }
    
    updateThreadSummary(email, relatedEmails) {
        const threadSummaryContent = document.getElementById('threadSummaryContent');
        if (!threadSummaryContent) return;
        
        if (relatedEmails.length > 0) {
            const timelineHtml = this.generateThreadTimeline(email, relatedEmails);
            const keyPointsHtml = this.generateKeyPoints(email, relatedEmails);
            
            threadSummaryContent.innerHTML = `
                <div class="conversation-timeline">
                    <h4>📅 Conversation Timeline</h4>
                    ${timelineHtml}
                </div>
                <div class="key-points">
                    <h4>🎯 Key Points & Action Items</h4>
                    ${keyPointsHtml}
                </div>
            `;
        } else {
            threadSummaryContent.innerHTML = `
                <div class="single-email-summary">
                    <h4>📧 Email Summary</h4>
                    <p><strong>From:</strong> ${email.from.name} (${email.from.email})</p>
                    <p><strong>Subject:</strong> ${email.subject}</p>
                    <p><strong>Received:</strong> ${this.formatFullDate(email.timestamp)}</p>
                    <p><strong>Priority:</strong> ${email.priority.charAt(0).toUpperCase() + email.priority.slice(1)}</p>
                </div>
            `;
        }
    }
    
    generateThreadTimeline(currentEmail, relatedEmails) {
        const allEmails = [currentEmail, ...relatedEmails]
            .sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        
        return allEmails.map(email => `
            <div class="timeline-item ${email.id === currentEmail.id ? 'current' : ''}">
                <div class="timeline-marker"></div>
                <div class="timeline-content">
                    <strong>${email.from.name}</strong>
                    <span class="timeline-time">${this.formatTimeAgo(email.timestamp)}</span>
                    <p class="timeline-subject">${email.subject}</p>
                </div>
            </div>
        `).join('');
    }
    
    generateKeyPoints(currentEmail, relatedEmails) {
        // Simplified key points extraction
        const allEmails = [currentEmail, ...relatedEmails];
        const urgentEmails = allEmails.filter(e => e.priority === 'high');
        const needsResponse = allEmails.filter(e => e.needsResponse);
        
        let keyPoints = '<ul>';
        
        if (urgentEmails.length > 0) {
            keyPoints += `<li><strong>High Priority:</strong> ${urgentEmails.length} urgent email(s) in thread</li>`;
        }
        
        if (needsResponse.length > 0) {
            keyPoints += `<li><strong>Action Required:</strong> ${needsResponse.length} email(s) need responses</li>`;
        }
        
        keyPoints += `<li><strong>Thread Length:</strong> ${allEmails.length} email(s) in conversation</li>`;
        keyPoints += `<li><strong>Latest:</strong> ${currentEmail.from.name} sent "${currentEmail.subject}"</li>`;
        keyPoints += '</ul>';
        
        return keyPoints;
    }
    
    updateDraftFields(draft, email) {
        const draftSubject = document.getElementById('draftSubject');
        const draftMessage = document.getElementById('draftMessage');
        const wordCount = document.getElementById('wordCount');
        
        if (draftSubject) {
            draftSubject.value = `Re: ${email.subject}`;
        }
        
        if (draftMessage) {
            draftMessage.value = draft || this.generateFallbackDraft(email, 'reply');
        }
        
        if (wordCount) {
            const words = (draftMessage?.value || '').split(/\s+/).filter(w => w.length > 0);
            wordCount.textContent = `${words.length} words`;
        }
    }
    
    toggleThreadSummary() {
        const threadSummaryContent = document.getElementById('threadSummaryContent');
        const threadSummaryToggle = document.getElementById('threadSummaryToggle');
        
        if (threadSummaryContent && threadSummaryToggle) {
            const isCollapsed = threadSummaryContent.style.display === 'none';
            threadSummaryContent.style.display = isCollapsed ? 'block' : 'none';
            threadSummaryToggle.textContent = isCollapsed ? '▼' : '▶';
        }
    }
    
    async regenerateDraft() {
        this.showDraftLoading();
        
        try {
            const email = this.state.selectedEmail;
            const newDraft = await this.generateEmailDraft(email, 'reply');
            this.updateDraftFields(newDraft, email);
            this.hideDraftLoading();
        } catch (error) {
            console.error('Error regenerating draft:', error);
            this.showError('Failed to regenerate draft. Please try again.');
            this.hideDraftLoading();
        }
    }
    
    enableDraftEditing() {
        const draftMessage = document.getElementById('draftMessage');
        if (draftMessage) {
            draftMessage.readOnly = false;
            draftMessage.focus();
        }
    }
    
    saveDraft() {
        const draftSubject = document.getElementById('draftSubject');
        const draftMessage = document.getElementById('draftMessage');
        
        if (draftSubject && draftMessage) {
            // For now, just show success message
            alert('Draft saved successfully!');
            // In real implementation, this would save to drafts folder
        }
    }
    
    sendDraft() {
        const draftSubject = document.getElementById('draftSubject');
        const draftMessage = document.getElementById('draftMessage');
        
        if (draftSubject && draftMessage) {
            // For now, just show success message
            alert('Email sent successfully!');
            this.hideDraftModal();
            // In real implementation, this would send the email
        }
    }
    
    updateWordCount() {
        const draftMessage = document.getElementById('draftMessage');
        const wordCount = document.getElementById('wordCount');
        
        if (draftMessage && wordCount) {
            const words = draftMessage.value.split(/\s+/).filter(w => w.length > 0);
            wordCount.textContent = `${words.length} words`;
        }
    }
    
    handleKeyboardShortcuts(e) {
        // Skip if typing in input fields
        if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
            return;
        }
        
        // Cmd/Ctrl + K for search
        if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
            e.preventDefault();
            const searchInput = document.getElementById('globalSearch');
            if (searchInput) {
                searchInput.focus();
            }
            return;
        }
        
        // Email navigation with arrow keys
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            this.navigateEmails(e.key === 'ArrowUp' ? -1 : 1);
            return;
        }
        
        // Enter to open selected email  
        if (e.key === 'Enter' && this.state.selectedEmail) {
            const selectedEmail = this.state.emails.find(email => email.id === this.state.selectedEmail);
            if (selectedEmail) {
                this.displayEmailContent(selectedEmail);
            }
            return;
        }
        
        // R for reply (future feature)
        if (e.key === 'r' || e.key === 'R') {
            console.log('📨 Reply functionality (coming soon)');
            return;
        }
        
        // Delete key to delete email (future feature)
        if (e.key === 'Delete' || e.key === 'Backspace') {
            console.log('🗑️ Delete functionality (coming soon)');
            return;
        }
    }
    
    navigateEmails(direction) {
        if (!this.state.emails || this.state.emails.length === 0) return;
        
        const currentIndex = this.state.selectedEmail 
            ? this.state.emails.findIndex(email => email.id === this.state.selectedEmail)
            : -1;
            
        let newIndex;
        if (currentIndex === -1) {
            // No selection, select first email
            newIndex = 0;
        } else {
            // Move up or down
            newIndex = currentIndex + direction;
            
            // Wrap around
            if (newIndex < 0) {
                newIndex = this.state.emails.length - 1;
            } else if (newIndex >= this.state.emails.length) {
                newIndex = 0;
            }
        }
        
        const newEmail = this.state.emails[newIndex];
        if (newEmail) {
            this.selectEmail(newEmail.id);
            
            // Scroll the selected email into view
            const emailItem = document.querySelector(`[data-email-id="${newEmail.id}"]`);
            if (emailItem) {
                emailItem.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }
        }
    }
    
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
    
    getLoadingButtonHTML(text) {
        return `
            <div class="auth-btn-content">
                <div class="loading-spinner"></div>
                <span>${text}</span>
            </div>
        `;
    }
    
    updateAIStatus(status) {
        const aiIndicator = document.querySelector('.ai-indicator span');
        const processingStatus = document.getElementById('processingStatus');
        
        if (aiIndicator) {
            switch (status) {
                case 'active':
                    aiIndicator.textContent = 'AI Assistant Active';
                    break;
                case 'fallback':
                    aiIndicator.textContent = 'AI Assistant (Offline Mode)';
                    break;
                case 'error':
                    aiIndicator.textContent = 'AI Assistant Error';
                    break;
            }
        }
        
        if (processingStatus && status === 'active') {
            processingStatus.style.display = 'flex';
        }
    }
    
    startEmailProcessing() {
        // Simulate email processing for AI context
        setTimeout(() => {
            const processingStatus = document.getElementById('processingStatus');
            if (processingStatus) {
                processingStatus.innerHTML = `
                    <i data-lucide="check-circle"></i>
                    <span>Emails processed and vectorized</span>
                `;
                this.initializeLucideIcons();
            }
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.emailAssistant = new EmailAssistant();
});

// CSS for additional styling
const additionalStyles = `
<style>
.email-item {
    display: flex;
    padding: var(--spacing-3);
    border-bottom: 1px solid var(--border-subtle);
    cursor: pointer;
    transition: background-color 0.2s ease;
}

.email-item:hover {
    background: var(--bg-secondary);
}

.email-item.email-unread {
    background: var(--bg-tertiary);
    font-weight: 600;
}

.email-avatar {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: var(--font-size-sm);
    flex-shrink: 0;
    margin-right: var(--spacing-3);
}

.email-content {
    flex: 1;
    min-width: 0;
}

.email-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: var(--spacing-1);
}

.email-sender {
    font-weight: 600;
    color: var(--text-primary);
    font-size: var(--font-size-sm);
}

.email-time {
    font-size: var(--font-size-xs);
    color: var(--text-tertiary);
}

.email-subject {
    font-size: var(--font-size-sm);
    color: var(--text-primary);
    margin-bottom: var(--spacing-1);
    font-weight: 500;
}

.email-preview {
    font-size: var(--font-size-xs);
    color: var(--text-secondary);
    line-height: 1.4;
}

.email-attachments {
    font-size: var(--font-size-xs);
    color: var(--color-primary);
    margin-top: var(--spacing-1);
}

.user-message-content {
    background: var(--color-primary);
    color: white;
    padding: var(--spacing-3);
    border-radius: var(--radius-md);
    margin-left: var(--spacing-8);
}

.typing-indicator .typing-dots {
    display: flex;
    gap: var(--spacing-1);
}

.typing-dots span {
    width: 6px;
    height: 6px;
    background: var(--text-tertiary);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
}

.typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
}

.typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
}

@keyframes typing {
    0%, 80%, 100% {
        opacity: 0.4;
        transform: scale(1);
    }
    40% {
        opacity: 1;
        transform: scale(1.2);
    }
}

.loading-spinner {
    width: 16px;
    height: 16px;
    border: 2px solid var(--text-tertiary);
    border-top: 2px solid var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

.email-header-full {
    padding: var(--spacing-6);
    border-bottom: 1px solid var(--border-color);
}

.email-subject-full {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--text-primary);
    margin: 0 0 var(--spacing-4) 0;
}

.email-meta {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.email-from {
    display: flex;
    align-items: center;
    gap: var(--spacing-3);
}

.email-avatar-large {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
}

.email-from-name {
    font-weight: 600;
    color: var(--text-primary);
}

.email-from-email {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.email-timestamp {
    font-size: var(--font-size-sm);
    color: var(--text-secondary);
}

.email-body {
    padding: var(--spacing-6);
    line-height: 1.6;
    color: var(--text-primary);
}
</style>
`;

// Inject additional styles
document.head.insertAdjacentHTML('beforeend', additionalStyles);