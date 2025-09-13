// AtlasWeb AI Dashboard JavaScript
// Handles dashboard functionality, feature switching, and integrations

class AtlasWebDashboard {
    constructor() {
        this.currentFeature = 'search';
        this.userToken = localStorage.getItem('atlasweb_token');
        this.userData = null;
        this.chatMessages = [];
        
        // Initialize AI services
        this.aiSearchService = null;
        this.geminiChat = null;
        
        this.init();
    }

    init() {
        // Check authentication
        this.checkAuth();
        
        // Initialize router
        this.router = new DashboardRouter();
        this.router.init(this.userData?.subscriptionTier || 'basic');
        
        // Initialize UI
        this.initializeUI();
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Initialize current feature from URL hash or default to search
        const hash = window.location.hash.substring(1);
        const initialFeature = hash && this.router.routes[hash] ? hash : 'search';
        this.router.navigateToFeature(initialFeature);
        
        // Initialize AI services
        this.initializeAISearch();
        this.initializeGeminiChat();
        
        // Initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    checkAuth() {
        // Development mode: auto-setup authentication if not present
        if (!this.userToken) {
            console.log('🔧 Development mode: Setting up test authentication');
            this.userToken = 'dev-token-' + Date.now();
            localStorage.setItem('atlasweb_token', this.userToken);
            localStorage.setItem('atlasweb_user', JSON.stringify({
                firstName: 'Test',
                lastName: 'User', 
                email: 'test@example.com',
                subscriptionTier: 'Pro'
            }));
        }

        // Load user data
        try {
            this.userData = JSON.parse(localStorage.getItem('atlasweb_user'));
            if (this.userData) {
                this.updateUserInfo();
            }
        } catch (error) {
            console.error('Error loading user data:', error);
            // Clear invalid data and redirect to login
            localStorage.removeItem('atlasweb_token');
            localStorage.removeItem('atlasweb_user');
            window.location.href = '/index.html';
        }
    }

    initializeUI() {
        // Auto-resize textareas
        this.setupAutoResizeTextareas();
        
        // Setup global search shortcuts
        this.setupGlobalSearch();
        
        // Setup chat interface
        this.setupChatInterface();
        
        // Setup search interface
        this.setupSearchInterface();
    }

    setupEventListeners() {
        // Feature buttons (handled by router now)
        // Router handles feature button clicks

        // User account dropdown
        const userAccount = document.querySelector('.user-account');
        if (userAccount) {
            userAccount.addEventListener('click', this.showUserMenu.bind(this));
        }

        // Notification button
        const notificationBtn = document.querySelector('.notification-btn');
        if (notificationBtn) {
            notificationBtn.addEventListener('click', this.showNotifications.bind(this));
        }

        // Help button
        const helpBtn = document.querySelector('.help-btn');
        if (helpBtn) {
            helpBtn.addEventListener('click', this.showHelp.bind(this));
        }

        // Global keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            // CMD/Ctrl + K for global search
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                document.querySelector('.global-search-input').focus();
            }
            
            // ESC to clear global search
            if (e.key === 'Escape' && document.activeElement === document.querySelector('.global-search-input')) {
                document.querySelector('.global-search-input').value = '';
                document.querySelector('.global-search-input').blur();
            }
        });

        // Search suggestions
        document.querySelectorAll('.suggestion-tag').forEach(tag => {
            tag.addEventListener('click', (e) => {
                const query = e.target.textContent.trim();
                this.performSearch(query);
            });
        });

        // Chat suggestion chips
        document.querySelectorAll('.suggestion-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const text = e.currentTarget.textContent.trim();
                const textarea = document.querySelector('.chat-textarea');
                textarea.value = text;
                textarea.focus();
                this.autoResizeTextarea(textarea);
            });
        });
    }

    updateUserInfo() {
        if (!this.userData) return;

        // Update user name and initials
        const userName = document.getElementById('userName');
        const userInitials = document.getElementById('userInitials');
        const userTier = document.getElementById('userTier');

        if (userName) {
            userName.textContent = `${this.userData.firstName} ${this.userData.lastName}`;
        }

        if (userInitials) {
            userInitials.textContent = `${this.userData.firstName.charAt(0)}${this.userData.lastName.charAt(0)}`;
        }

        if (userTier) {
            const tier = this.userData.subscriptionTier || 'Basic';
            userTier.textContent = `${tier} Plan`;
        }

        // Update feature access based on subscription tier
        this.updateFeatureAccess();
    }

    updateFeatureAccess() {
        const tier = this.userData?.subscriptionTier || 'basic';
        
        // Enable/disable features based on subscription tier
        const websiteBuilderBtn = document.querySelector('[data-feature="website-builder"]');
        if (websiteBuilderBtn) {
            if (tier.toLowerCase() !== 'max') {
                websiteBuilderBtn.classList.add('disabled');
                websiteBuilderBtn.title = 'Website Builder - Upgrade to Max Plan';
            }
        }

        // Update other tier-specific features
        const tierMaxElements = document.querySelectorAll('.tier-max');
        tierMaxElements.forEach(element => {
            if (tier.toLowerCase() !== 'max') {
                element.classList.add('disabled');
            }
        });
    }

    switchFeature(featureName) {
        // Update active feature button
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-feature="${featureName}"]`);
        if (activeBtn && !activeBtn.classList.contains('disabled')) {
            activeBtn.classList.add('active');
            this.currentFeature = featureName;
            
            // Load feature content based on subscription tier
            this.loadFeatureContent(featureName);
        }
    }

    loadFeatureContent(featureName) {
        const middlePanel = document.querySelector('.middle-panel .search-container');
        
        switch (featureName) {
            case 'search':
                // Already loaded by default
                break;
                
            case 'bookmarks':
                this.loadBookmarksInterface(middlePanel);
                break;
                
            case 'email':
                this.loadEmailInterface(middlePanel);
                break;
                
            case 'automation':
                this.loadAutomationInterface(middlePanel);
                break;
                
            case 'website-builder':
                if (this.userData?.subscriptionTier?.toLowerCase() === 'max') {
                    this.loadWebsiteBuilderInterface(middlePanel);
                } else {
                    this.showUpgradePrompt('website-builder');
                }
                break;
                
            default:
                console.warn(`Feature ${featureName} not implemented yet`);
        }
    }

    loadBookmarksInterface(container) {
        container.innerHTML = `
            <div class="feature-interface bookmarks-interface">
                <div class="feature-header">
                    <h2 class="feature-title">Smart Bookmarks</h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn">
                            <i data-lucide="plus"></i>
                            Add Bookmark
                        </button>
                        <button class="feature-action-btn">
                            <i data-lucide="folder"></i>
                            Organize
                        </button>
                    </div>
                </div>
                
                <div class="bookmarks-search">
                    <div class="search-input-wrapper">
                        <i data-lucide="search" class="search-input-icon"></i>
                        <input type="text" placeholder="Search bookmarks..." class="bookmark-search-input">
                    </div>
                </div>
                
                <div class="bookmarks-content">
                    <div class="coming-soon">
                        <div class="coming-soon-icon">
                            <i data-lucide="bookmark"></i>
                        </div>
                        <h3>Smart Bookmarks Coming Soon</h3>
                        <p>AI-powered bookmark organization with automatic tagging, content analysis, and smart collections.</p>
                        <div class="feature-preview">
                            <div class="preview-item">✨ Auto-categorization</div>
                            <div class="preview-item">🔍 Full-text search</div>
                            <div class="preview-item">🏷️ Smart tags</div>
                            <div class="preview-item">📚 Collections</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    loadEmailInterface(container) {
        container.innerHTML = `
            <div class="feature-interface email-interface">
                <div class="feature-header">
                    <h2 class="feature-title">Email Assistant</h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn" onclick="window.open('email-assistant.html', '_blank')">
                            <i data-lucide="external-link"></i>
                            Open Full Client
                        </button>
                    </div>
                </div>
                
                <div class="email-preview">
                    <div class="email-stats">
                        <div class="stat-card">
                            <div class="stat-value">12</div>
                            <div class="stat-label">Unread</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">3</div>
                            <div class="stat-label">Priority</div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-value">28</div>
                            <div class="stat-label">Today</div>
                        </div>
                    </div>
                    
                    <div class="quick-access">
                        <button class="quick-action-card" onclick="window.open('email-assistant.html', '_blank')">
                            <div class="quick-action-icon">
                                <i data-lucide="mail"></i>
                            </div>
                            <div class="quick-action-content">
                                <h4>Full Email Client</h4>
                                <p>Access your complete email experience</p>
                            </div>
                            <i data-lucide="arrow-right" class="quick-action-arrow"></i>
                        </button>
                        
                        <button class="quick-action-card">
                            <div class="quick-action-icon">
                                <i data-lucide="bot"></i>
                            </div>
                            <div class="quick-action-content">
                                <h4>AI Compose</h4>
                                <p>Generate email drafts with AI</p>
                            </div>
                            <i data-lucide="arrow-right" class="quick-action-arrow"></i>
                        </button>
                        
                        <button class="quick-action-card">
                            <div class="quick-action-icon">
                                <i data-lucide="brain"></i>
                            </div>
                            <div class="quick-action-content">
                                <h4>Smart Summaries</h4>
                                <p>AI-powered email insights</p>
                            </div>
                            <i data-lucide="arrow-right" class="quick-action-arrow"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    loadAutomationInterface(container) {
        container.innerHTML = `
            <div class="feature-interface automation-interface">
                <div class="feature-header">
                    <h2 class="feature-title">Web Automation</h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn">
                            <i data-lucide="plus"></i>
                            New Workflow
                        </button>
                    </div>
                </div>
                
                <div class="automation-content">
                    <div class="coming-soon">
                        <div class="coming-soon-icon">
                            <i data-lucide="zap"></i>
                        </div>
                        <h3>Web Automation Studio</h3>
                        <p>Visual workflow builder for web automation tasks using n8n integration.</p>
                        <div class="feature-preview">
                            <div class="preview-item">🔄 Visual workflows</div>
                            <div class="preview-item">🕷️ Web scraping</div>
                            <div class="preview-item">📝 Form automation</div>
                            <div class="preview-item">⏰ Scheduled tasks</div>
                        </div>
                        <div class="tier-notice">
                            <i data-lucide="crown"></i>
                            <span>Available in Max Plan</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    loadWebsiteBuilderInterface(container) {
        container.innerHTML = `
            <div class="feature-interface builder-interface">
                <div class="feature-header">
                    <h2 class="feature-title">Website Builder Studio</h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn">
                            <i data-lucide="plus"></i>
                            New Site
                        </button>
                        <button class="feature-action-btn">
                            <i data-lucide="template"></i>
                            Templates
                        </button>
                    </div>
                </div>
                
                <div class="builder-content">
                    <div class="coming-soon">
                        <div class="coming-soon-icon premium">
                            <i data-lucide="layout"></i>
                        </div>
                        <h3>Professional Website Builder</h3>
                        <p>Create stunning websites with AI-powered design assistance using shadcn/ui components.</p>
                        <div class="feature-preview">
                            <div class="preview-item">🎨 AI design suggestions</div>
                            <div class="preview-item">📱 Responsive automation</div>
                            <div class="preview-item">⚡ Modern components</div>
                            <div class="preview-item">🌐 Custom domains</div>
                        </div>
                        <div class="tier-badge-premium">
                            <i data-lucide="crown"></i>
                            <span>Max Plan Exclusive</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    showUpgradePrompt(feature) {
        const modal = document.createElement('div');
        modal.className = 'upgrade-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content upgrade-content">
                <div class="upgrade-header">
                    <div class="upgrade-icon">
                        <i data-lucide="crown"></i>
                    </div>
                    <h2>Upgrade to Max Plan</h2>
                    <button class="modal-close" onclick="this.closest('.upgrade-modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                
                <div class="upgrade-body">
                    <p>Unlock the Website Builder Studio and other premium features with the Max Plan.</p>
                    
                    <div class="upgrade-features">
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>Website Builder Studio</span>
                        </div>
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>Web Automation Studio</span>
                        </div>
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>Team Collaboration (15 members)</span>
                        </div>
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>API Access</span>
                        </div>
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>24/7 Priority Support</span>
                        </div>
                    </div>
                    
                    <div class="upgrade-pricing">
                        <div class="price">$120<span>/month</span></div>
                        <div class="price-note">*Pricing varies by region</div>
                    </div>
                </div>
                
                <div class="upgrade-footer">
                    <button class="btn-secondary" onclick="this.closest('.upgrade-modal').remove()">
                        Maybe Later
                    </button>
                    <button class="btn-primary" onclick="window.location.href='pricing.html'">
                        Upgrade Now
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    setupAutoResizeTextareas() {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
            textarea.addEventListener('input', () => this.autoResizeTextarea(textarea));
        });
    }

    autoResizeTextarea(textarea) {
        textarea.style.height = 'auto';
        textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }

    setupGlobalSearch() {
        const globalSearch = document.querySelector('.global-search-input');
        if (globalSearch) {
            globalSearch.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && globalSearch.value.trim()) {
                    e.preventDefault();
                    this.performGlobalSearch(globalSearch.value.trim());
                }
            });
        }
    }

    setupChatInterface() {
        const chatTextarea = document.querySelector('.chat-textarea');
        const sendBtn = document.getElementById('sendBtn');
        const voiceBtn = document.getElementById('voiceBtn');
        
        if (chatTextarea) {
            chatTextarea.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.sendChatMessage();
                }
            });
        }
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendChatMessage());
        }
        
        if (voiceBtn) {
            voiceBtn.addEventListener('click', () => this.toggleVoiceInput());
        }
    }

    setupSearchInterface() {
        const searchInput = document.querySelector('.main-search-input');
        const searchSubmit = document.querySelector('.search-submit');
        
        if (searchInput) {
            searchInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    this.performSearch(searchInput.value.trim());
                }
            });
        }
        
        if (searchSubmit) {
            searchSubmit.addEventListener('click', () => {
                const query = document.querySelector('.main-search-input').value.trim();
                this.performSearch(query);
            });
        }
    }

    performGlobalSearch(query) {
        console.log('Performing global search:', query);
        // Switch to search feature and perform search
        this.switchFeature('search');
        document.querySelector('.main-search-input').value = query;
        this.performSearch(query);
    }

    async performSearch(query) {
        if (!query) return;
        
        console.log('🔍 Performing intelligent search:', query);
        // Display results in search panel - create or find results container
        let resultsContainer = document.getElementById('searchResults');
        if (!resultsContainer) {
            // Create results container in the search interface
            const searchInterface = document.querySelector('.search-interface');
            resultsContainer = document.createElement('div');
            resultsContainer.id = 'searchResults';
            resultsContainer.className = 'search-results-display';
            searchInterface.appendChild(resultsContainer);
        }
        const selectedModel = document.querySelector('.model-select').value;
        
        // Show enhanced loading state
        resultsContainer.innerHTML = `
            <div class="search-loading">
                <div class="loading-spinner"></div>
                <div class="loading-text">Searching with ${selectedModel === 'ensemble' ? 'AI Ensemble' : selectedModel.toUpperCase()}...</div>
                <div class="loading-subtitle">Finding results and generating AI summary...</div>
            </div>
        `;
        
        try {
            // Use AI Search Service for real search
            if (this.aiSearchService) {
                const searchOptions = {
                    model: selectedModel,
                    maxResults: 8,
                    region: 'us',
                    language: 'en'
                };
                
                const results = await this.aiSearchService.performIntelligentSearch(query, searchOptions);
                this.displayIntelligentSearchResults(results, resultsContainer);
            } else {
                // Fallback to mock results if service not available
                console.warn('AI Search Service not available, using fallback');
                setTimeout(() => {
                    this.displaySearchResults(query, selectedModel, resultsContainer);
                }, 2000);
            }
        } catch (error) {
            console.error('Search failed:', error);
            this.displaySearchError(error, query, resultsContainer);
        }
    }

    displaySearchResults(query, model, container) {
        const mockResults = {
            query: query,
            model: model,
            results: [
                {
                    title: `Search results for "${query}"`,
                    source: model === 'ensemble' ? 'Multiple Sources' : model.toUpperCase(),
                    confidence: Math.floor(Math.random() * 20) + 80,
                    content: 'This is a simulated search result. In the actual implementation, this would contain real results from the selected AI model(s).',
                    citations: ['source1.com', 'source2.org', 'source3.edu']
                }
            ]
        };
        
        container.innerHTML = `
            <div class="search-result">
                <div class="result-header">
                    <div class="result-source">
                        <span class="model-badge ${model}">${mockResults.results[0].source}</span>
                        <span class="confidence-score">${mockResults.results[0].confidence}% confidence</span>
                    </div>
                </div>
                
                <div class="result-content">
                    <h3 class="result-title">${mockResults.results[0].title}</h3>
                    <p class="result-text">${mockResults.results[0].content}</p>
                </div>
                
                <div class="result-citations">
                    <strong>Sources:</strong>
                    ${mockResults.results[0].citations.map(cite => `<span class="citation">${cite}</span>`).join('')}
                </div>
                
                <div class="result-actions">
                    <button class="result-action">
                        <i data-lucide="copy"></i>
                        Copy
                    </button>
                    <button class="result-action">
                        <i data-lucide="bookmark"></i>
                        Save
                    </button>
                    <button class="result-action">
                        <i data-lucide="share"></i>
                        Share
                    </button>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    async sendChatMessage() {
        const textarea = document.querySelector('.chat-textarea');
        const message = textarea.value.trim();
        
        if (!message) return;
        
        // Add user message
        this.addChatMessage(message, 'user');
        
        // Clear textarea
        textarea.value = '';
        this.autoResizeTextarea(textarea);
        
        // Show thinking indicator
        const thinkingMessage = this.addChatMessage('🤔 Thinking...', 'assistant');
        
        try {
            if (this.geminiChat) {
                // Get real AI response from Gemini
                const result = await this.geminiChat.sendMessage(message);
                
                // Remove thinking indicator
                thinkingMessage.remove();
                
                if (result.success) {
                    this.addChatMessage(result.response, 'assistant');
                } else {
                    this.addChatMessage(result.fallbackResponse || 'Sorry, I\'m having trouble right now. Please try again.', 'assistant');
                }
            } else {
                // Fallback to mock response if Gemini service isn't available
                setTimeout(() => {
                    thinkingMessage.remove();
                    const response = this.generateAIResponse(message);
                    this.addChatMessage(response, 'assistant');
                }, 1500);
            }
        } catch (error) {
            console.error('Chat error:', error);
            thinkingMessage.remove();
            this.addChatMessage('Sorry, I encountered an error. Please try again.', 'assistant');
        }
    }

    addChatMessage(content, sender) {
        const messagesContainer = document.getElementById('chatMessages');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${sender}-message`;
        
        messageElement.innerHTML = `
            <div class="message-avatar">
                <i data-lucide="${sender === 'user' ? 'user' : 'bot'}"></i>
            </div>
            <div class="message-content">
                <div class="message-text">${content}</div>
                ${sender === 'assistant' && !content.includes('Thinking') ? `
                    <div class="message-actions">
                        <button class="message-action" title="Copy">
                            <i data-lucide="copy"></i>
                        </button>
                        <button class="message-action" title="Like">
                            <i data-lucide="thumbs-up"></i>
                        </button>
                        <button class="message-action" title="Dislike">
                            <i data-lucide="thumbs-down"></i>
                        </button>
                    </div>
                ` : ''}
            </div>
        `;
        
        messagesContainer.appendChild(messageElement);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        return messageElement; // Return element for removal if needed
    }

    generateAIResponse(userMessage) {
        // Simple mock responses - replace with actual OpenAI integration
        const responses = [
            "I understand you're asking about that. Let me help you with a comprehensive answer.",
            "That's an interesting question! Based on my knowledge, here's what I can tell you:",
            "I'd be happy to assist you with that. Let me break this down for you:",
            "Great question! I can provide some insights on that topic:"
        ];
        
        return responses[Math.floor(Math.random() * responses.length)] + ` Your message was: "${userMessage}". This is a simulated response - in the actual implementation, this would be powered by Google Gemini.`;
    }

    toggleVoiceInput() {
        console.log('Voice input toggled - not implemented yet');
        // TODO: Implement voice input functionality
        this.showNotification('Voice input coming soon!', 'info');
    }

    showUserMenu() {
        const existingMenu = document.querySelector('.user-dropdown-menu');
        if (existingMenu) {
            existingMenu.remove();
            return;
        }
        
        const menu = document.createElement('div');
        menu.className = 'user-dropdown-menu';
        menu.innerHTML = `
            <div class="user-menu-content">
                <div class="user-menu-header">
                    <div class="user-avatar-large">
                        <span>${this.userData?.firstName?.charAt(0)}${this.userData?.lastName?.charAt(0)}</span>
                    </div>
                    <div class="user-details">
                        <strong>${this.userData?.firstName} ${this.userData?.lastName}</strong>
                        <span>${this.userData?.email}</span>
                        <span class="plan-badge">${this.userData?.subscriptionTier || 'Basic'} Plan</span>
                    </div>
                </div>
                <div class="user-menu-separator"></div>
                <div class="user-menu-items">
                    <a href="#" class="user-menu-item">
                        <i data-lucide="user"></i>
                        Profile Settings
                    </a>
                    <a href="#" class="user-menu-item">
                        <i data-lucide="credit-card"></i>
                        Billing & Usage
                    </a>
                    <a href="#" class="user-menu-item">
                        <i data-lucide="settings"></i>
                        Preferences
                    </a>
                    <a href="#" class="user-menu-item">
                        <i data-lucide="help-circle"></i>
                        Help & Support
                    </a>
                </div>
                <div class="user-menu-separator"></div>
                <div class="user-menu-items">
                    <a href="#" class="user-menu-item" onclick="dashboard.logout()">
                        <i data-lucide="log-out"></i>
                        Sign Out
                    </a>
                </div>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Position the menu
        const userAccount = document.querySelector('.user-account');
        const rect = userAccount.getBoundingClientRect();
        menu.style.position = 'fixed';
        menu.style.top = (rect.bottom + 8) + 'px';
        menu.style.right = '24px';
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target) && !userAccount.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    showNotifications() {
        console.log('Showing notifications - not implemented yet');
        this.showNotification('Notifications panel coming soon!', 'info');
    }

    showHelp() {
        console.log('Showing help - not implemented yet');
        this.showNotification('Help system coming soon!', 'info');
    }

    initializeAISearch() {
        // Initialize AI Search Service if available
        if (window.AISearchService) {
            try {
                this.aiSearchService = new window.AISearchService();
                console.log('✅ AI Search Service initialized');
            } catch (error) {
                console.error('❌ Failed to initialize AI Search Service:', error);
                this.aiSearchService = null;
            }
        } else {
            console.warn('⚠️ AI Search Service not loaded');
        }
    }

    initializeGeminiChat() {
        // Initialize Gemini Chat Service if available
        if (window.GeminiChatService) {
            try {
                this.geminiChat = new window.GeminiChatService();
                console.log('✅ Gemini Chat Service initialized with Gemini 1.5 Flash');
                
                // Update UI to show Gemini is connected
                this.updateChatStatus('online');
            } catch (error) {
                console.error('❌ Failed to initialize Gemini Chat Service:', error);
                this.geminiChat = null;
                this.updateChatStatus('offline');
            }
        } else {
            console.warn('⚠️ Gemini Chat Service not loaded');
            this.updateChatStatus('offline');
        }
    }

    updateChatStatus(status) {
        const statusElement = document.querySelector('.chat-status');
        const modelInfo = document.querySelector('.model-info span');
        
        if (statusElement) {
            statusElement.textContent = status === 'online' ? 'Online' : 'Offline';
            statusElement.className = `chat-status ${status}`;
        }
        
        if (modelInfo) {
            modelInfo.textContent = status === 'online' ? 'Powered by Google Gemini' : 'Powered by Mock Responses';
        }
    }

    displayIntelligentSearchResults(results, container) {
        if (!results || results.error) {
            this.displaySearchError(results?.errorMessage || 'Search failed', results?.query || '', container);
            return;
        }

        console.log('📊 Displaying intelligent search results:', results);

        container.innerHTML = `
            <div class="intelligent-search-results">
                <!-- AI Summary Section -->
                <div class="ai-summary-section">
                    <div class="summary-header">
                        <div class="summary-title">
                            <i data-lucide="brain" class="summary-icon"></i>
                            <h3>AI Summary</h3>
                            <span class="model-badge ${results.aiSummary.model}">${results.aiSummary.model}</span>
                        </div>
                        <div class="confidence-indicator">
                            <div class="confidence-bar">
                                <div class="confidence-fill" style="width: ${Math.round(results.confidence * 100)}%"></div>
                            </div>
                            <span class="confidence-text">${Math.round(results.confidence * 100)}% confidence</span>
                        </div>
                    </div>
                    
                    <div class="summary-content">
                        <p class="summary-text">${results.aiSummary.content}</p>
                        ${results.aiSummary.keyPoints && results.aiSummary.keyPoints.length > 0 ? `
                            <div class="key-points">
                                <h4>Key Points:</h4>
                                <ul>
                                    ${results.aiSummary.keyPoints.map(point => `<li>${point}</li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}
                    </div>
                </div>

                <!-- Search Results Section -->
                <div class="search-results-section">
                    <div class="results-header">
                        <h3>Search Results</h3>
                        <span class="results-count">${results.searchResults.length} results found</span>
                    </div>
                    
                    <div class="results-list">
                        ${results.searchResults.map((result, index) => `
                            <div class="result-item" data-position="${result.position}">
                                <div class="result-header">
                                    <div class="result-position">${result.position}</div>
                                    <div class="result-url">
                                        <span class="result-domain">${result.displayUrl}</span>
                                        <div class="result-type-badge ${result.type}">${result.type.replace('_', ' ')}</div>
                                    </div>
                                    <div class="relevance-score">
                                        ${Math.round(result.relevanceScore * 100)}%
                                    </div>
                                </div>
                                
                                <div class="result-content">
                                    <h4 class="result-title">
                                        <a href="${result.url}" target="_blank" rel="noopener noreferrer">
                                            ${result.title}
                                        </a>
                                    </h4>
                                    <p class="result-snippet">${result.snippet}</p>
                                </div>
                                
                                <div class="result-actions">
                                    <button class="result-action" onclick="navigator.clipboard.writeText('${result.url}')" title="Copy URL">
                                        <i data-lucide="copy"></i>
                                    </button>
                                    <button class="result-action" onclick="window.open('${result.url}', '_blank')" title="Open in new tab">
                                        <i data-lucide="external-link"></i>
                                    </button>
                                    <button class="result-action" title="Save bookmark">
                                        <i data-lucide="bookmark"></i>
                                    </button>
                                </div>
                            </div>
                        `).join('')}
                    </div>
                </div>

                <!-- Sources Footer -->
                <div class="search-footer">
                    <div class="search-metadata">
                        <span class="search-time">Completed in ${Date.now() - results.searchTime}ms</span>
                        <span class="model-used">Model: ${results.model}</span>
                        <span class="timestamp">${new Date(results.timestamp).toLocaleTimeString()}</span>
                    </div>
                    
                    ${results.sources && results.sources.length > 0 ? `
                        <div class="sources-section">
                            <strong>Primary Sources:</strong>
                            <div class="sources-list">
                                ${results.sources.map(source => `
                                    <a href="${source.url}" target="_blank" class="source-link" title="${source.title}">
                                        ${source.domain}
                                    </a>
                                `).join('')}
                            </div>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;

        // Reinitialize icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Add search to history
        this.addToSearchHistory(results.query, results.model);
    }

    displaySearchError(error, query, container) {
        const errorMessage = typeof error === 'string' ? error : error.message || 'Search failed';
        
        container.innerHTML = `
            <div class="search-error">
                <div class="error-icon">
                    <i data-lucide="alert-triangle"></i>
                </div>
                <div class="error-content">
                    <h3>Search Temporarily Unavailable</h3>
                    <p class="error-message">${errorMessage}</p>
                    <p class="error-suggestion">Please try:</p>
                    <ul class="error-suggestions">
                        <li>Checking your internet connection</li>
                        <li>Simplifying your search query</li>
                        <li>Trying again in a few moments</li>
                    </ul>
                    <button class="retry-search-btn" onclick="dashboard.performSearch('${query}')">
                        <i data-lucide="refresh-cw"></i>
                        Try Again
                    </button>
                </div>
            </div>
        `;

        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    addToSearchHistory(query, model) {
        // Add search to history (could be enhanced with local storage)
        const historyList = document.querySelector('.history-list');
        if (historyList && query) {
            const newHistoryItem = document.createElement('div');
            newHistoryItem.className = 'history-item';
            newHistoryItem.innerHTML = `
                <i data-lucide="clock"></i>
                <span>${query}</span>
                <div class="history-models">
                    <span class="model-badge ${model}">${model}</span>
                </div>
            `;
            
            // Add to the top of the list
            historyList.insertBefore(newHistoryItem, historyList.firstChild);
            
            // Keep only the last 5 searches
            while (historyList.children.length > 5) {
                historyList.removeChild(historyList.lastChild);
            }

            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    logout() {
        localStorage.removeItem('atlasweb_token');
        localStorage.removeItem('atlasweb_user');
        window.location.href = '/index.html';
    }

    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `dashboard-notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i data-lucide="${type === 'error' ? 'alert-circle' : type === 'success' ? 'check-circle' : 'info'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Additional CSS for dynamic elements
const additionalStyles = `
.search-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 48px 24px;
    gap: 16px;
}

.loading-text {
    font-size: 14px;
    color: #64748b;
}

.search-result {
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 20px;
    background: rgba(248, 250, 252, 0.8);
    margin-bottom: 16px;
}

.result-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
}

.result-source {
    display: flex;
    align-items: center;
    gap: 8px;
}

.confidence-score {
    font-size: 12px;
    color: #64748b;
}

.result-content {
    margin-bottom: 16px;
}

.result-title {
    font-size: 16px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 8px 0;
}

.result-text {
    font-size: 14px;
    color: #64748b;
    line-height: 1.6;
    margin: 0;
}

.result-citations {
    font-size: 12px;
    color: #64748b;
    margin-bottom: 12px;
}

.citation {
    display: inline-block;
    margin-left: 8px;
    padding: 2px 6px;
    background: rgba(99, 102, 241, 0.1);
    border-radius: 4px;
    color: #6366f1;
}

.result-actions {
    display: flex;
    gap: 8px;
}

.result-action {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 10px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 6px;
    background: transparent;
    font-size: 12px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
}

.result-action:hover {
    border-color: #6366f1;
    color: #6366f1;
}

.coming-soon {
    text-align: center;
    padding: 48px 24px;
}

.coming-soon-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 24px;
    border-radius: 16px;
    background: rgba(99, 102, 241, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
}

.coming-soon-icon.premium {
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color: white;
}

.feature-preview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 8px;
    margin: 24px 0;
}

.preview-item {
    padding: 8px 12px;
    background: rgba(248, 250, 252, 0.8);
    border-radius: 6px;
    font-size: 13px;
    color: #64748b;
}

.tier-notice,
.tier-badge-premium {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    color: white;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    margin-top: 16px;
}

.user-dropdown-menu {
    position: fixed;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    padding: 16px;
    min-width: 280px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
    z-index: 1000;
}

.user-menu-header {
    display: flex;
    gap: 12px;
    margin-bottom: 12px;
}

.user-avatar-large {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    flex-shrink: 0;
}

.user-details {
    display: flex;
    flex-direction: column;
    gap: 4px;
}

.user-details strong {
    color: #1e293b;
    font-size: 14px;
}

.user-details span {
    color: #64748b;
    font-size: 12px;
}

.plan-badge {
    display: inline-block;
    padding: 2px 6px;
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
    border-radius: 4px;
    font-weight: 500;
    width: fit-content;
}

.user-menu-separator {
    height: 1px;
    background: rgba(148, 163, 184, 0.2);
    margin: 12px 0;
}

.user-menu-items {
    display: flex;
    flex-direction: column;
    gap: 2px;
}

.user-menu-item {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px;
    border-radius: 6px;
    color: #64748b;
    text-decoration: none;
    font-size: 14px;
    transition: all 0.2s ease;
}

.user-menu-item:hover {
    background: rgba(99, 102, 241, 0.1);
    color: #6366f1;
}

.dashboard-notification {
    position: fixed;
    top: 24px;
    right: 24px;
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 1000;
    max-width: 320px;
}

.dashboard-notification.success {
    border-left: 3px solid #10b981;
}

.dashboard-notification.error {
    border-left: 3px solid #ef4444;
}

.dashboard-notification.info {
    border-left: 3px solid #6366f1;
}

.notification-content {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #1e293b;
}

.notification-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    border-radius: 4px;
    color: #94a3b8;
    cursor: pointer;
    margin-left: auto;
}

.upgrade-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.7);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
}

.upgrade-content {
    background: rgba(255, 255, 255, 0.95);
    backdrop-filter: blur(20px);
    border-radius: 16px;
    padding: 32px;
    max-width: 480px;
    width: 90vw;
    position: relative;
}

.upgrade-header {
    text-align: center;
    margin-bottom: 24px;
}

.upgrade-icon {
    width: 64px;
    height: 64px;
    margin: 0 auto 16px;
    border-radius: 16px;
    background: linear-gradient(135deg, #f59e0b, #f97316);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.upgrade-features {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin: 24px 0;
}

.upgrade-feature {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 14px;
    color: #1e293b;
}

.upgrade-feature i {
    color: #10b981;
}

.upgrade-pricing {
    text-align: center;
    margin: 24px 0;
}

.price {
    font-size: 32px;
    font-weight: 700;
    color: #1e293b;
}

.price span {
    font-size: 16px;
    color: #64748b;
}

.price-note {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
}

.upgrade-footer {
    display: flex;
    gap: 12px;
    justify-content: center;
}

.feature-interface {
    height: 100%;
}

.feature-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
}

.feature-title {
    font-size: 20px;
    font-weight: 700;
    color: #1e293b;
    margin: 0;
}

.feature-actions {
    display: flex;
    gap: 8px;
}

.feature-action-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 8px;
    background: rgba(248, 250, 252, 0.8);
    font-size: 13px;
    color: #64748b;
    cursor: pointer;
    transition: all 0.2s ease;
}

.feature-action-btn:hover {
    border-color: #6366f1;
    color: #6366f1;
}

.email-stats {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
}

.stat-card {
    text-align: center;
    padding: 16px;
    background: rgba(248, 250, 252, 0.8);
    border-radius: 10px;
}

.stat-value {
    font-size: 24px;
    font-weight: 700;
    color: #1e293b;
}

.stat-label {
    font-size: 12px;
    color: #64748b;
    margin-top: 4px;
}

.quick-access {
    display: flex;
    flex-direction: column;
    gap: 12px;
}

.quick-action-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: rgba(248, 250, 252, 0.8);
    border: 1px solid rgba(148, 163, 184, 0.2);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
}

.quick-action-card:hover {
    border-color: #6366f1;
    background: rgba(255, 255, 255, 0.9);
    transform: translateY(-1px);
}

.quick-action-icon {
    width: 40px;
    height: 40px;
    border-radius: 8px;
    background: rgba(99, 102, 241, 0.1);
    display: flex;
    align-items: center;
    justify-content: center;
    color: #6366f1;
}

.quick-action-content {
    flex: 1;
}

.quick-action-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin: 0 0 4px 0;
}

.quick-action-content p {
    font-size: 12px;
    color: #64748b;
    margin: 0;
}

.quick-action-arrow {
    color: #94a3b8;
}
`;

// Inject additional styles
const styleSheet = document.createElement('style');
styleSheet.textContent = additionalStyles;
document.head.appendChild(styleSheet);

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.dashboard = new AtlasWebDashboard();
});