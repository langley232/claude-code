// Advanced Search Dashboard - BrightData Integration
// Clean dashboard implementation with social media API access

class AdvancedSearchDashboard {
    constructor() {
        this.currentPlatform = 'instagram';
        this.searchResults = [];
        this.currentPage = 1;
        this.isLoading = false;
        
        // BrightData MCP configuration
        this.brightDataConfig = {
            baseUrl: 'https://api.brightdata.com/dca',
            freeRequestsLimit: 5000,
            currentUsage: parseInt(localStorage.getItem('bd_usage') || '1247'),
            apiKey: localStorage.getItem('bd_api_key') || '',
            mcpServerUrl: process.env.MCP_SERVER_URL || 'localhost:8080'
        };
        
        // Platform configurations
        this.platformConfigs = {
            instagram: {
                name: 'Instagram Search',
                description: 'Search posts, stories, profiles, and hashtags',
                icon: 'instagram',
                gradient: 'from-pink-500 to-rose-500',
                placeholder: 'Enter hashtags, usernames, or keywords...',
                filters: ['all', 'posts', 'profiles', 'hashtags']
            },
            twitter: {
                name: 'Twitter Search',
                description: 'Search tweets, users, and trending topics',
                icon: 'twitter',
                gradient: 'from-blue-400 to-blue-600',
                placeholder: 'Search tweets, @usernames, or #hashtags...',
                filters: ['all', 'tweets', 'users', 'media']
            },
            linkedin: {
                name: 'LinkedIn Search',
                description: 'Search professionals, companies, and posts',
                icon: 'linkedin',
                gradient: 'from-blue-600 to-blue-800',
                placeholder: 'Search professionals, companies, or posts...',
                filters: ['all', 'people', 'companies', 'posts', 'jobs']
            },
            tiktok: {
                name: 'TikTok Search',
                description: 'Search videos, creators, and trending sounds',
                icon: 'music',
                gradient: 'from-black to-red-600',
                placeholder: 'Search videos, @creators, or sounds...',
                filters: ['all', 'videos', 'users', 'sounds', 'hashtags']
            },
            reddit: {
                name: 'Reddit Search',
                description: 'Search posts, comments, and subreddits',
                icon: 'message-circle',
                gradient: 'from-orange-500 to-red-600',
                placeholder: 'Search posts, r/subreddits, or u/users...',
                filters: ['all', 'posts', 'comments', 'subreddits', 'users']
            },
            youtube: {
                name: 'YouTube Search',
                description: 'Search videos, channels, and playlists',
                icon: 'play',
                gradient: 'from-red-500 to-red-700',
                placeholder: 'Search videos, channels, or playlists...',
                filters: ['all', 'videos', 'channels', 'playlists']
            },
            facebook: {
                name: 'Facebook Search',
                description: 'Search posts, pages, and groups',
                icon: 'facebook',
                gradient: 'from-blue-500 to-blue-700',
                placeholder: 'Search posts, pages, or groups...',
                filters: ['all', 'posts', 'pages', 'groups', 'people']
            },
            pinterest: {
                name: 'Pinterest Search',
                description: 'Search pins, boards, and users',
                icon: 'image',
                gradient: 'from-red-500 to-pink-500',
                placeholder: 'Search pins, boards, or users...',
                filters: ['all', 'pins', 'boards', 'users']
            },
            quora: {
                name: 'Quora Search',
                description: 'Search questions, answers, and topics',
                icon: 'help-circle',
                gradient: 'from-red-600 to-red-800',
                placeholder: 'Search questions, topics, or answers...',
                filters: ['all', 'questions', 'answers', 'topics', 'users']
            },
            vimeo: {
                name: 'Vimeo Search',
                description: 'Search videos, creators, and channels',
                icon: 'video',
                gradient: 'from-blue-400 to-teal-500',
                placeholder: 'Search videos, creators, or channels...',
                filters: ['all', 'videos', 'users', 'channels']
            }
        };
        
        this.init();
    }
    
    init() {
        this.initializeElements();
        this.bindEvents();
        this.updateUsageIndicator();
        this.switchPlatform('instagram');
        this.initializeLucideIcons();
        
        console.log('🚀 Advanced Search Dashboard initialized');
        console.log('📊 BrightData MCP Server ready');
    }
    
    initializeElements() {
        // Platform navigation
        this.platformButtons = document.querySelectorAll('[data-platform]');
        
        // Header elements
        this.pageTitle = document.getElementById('pageTitle');
        this.platformIcon = document.getElementById('platformIcon');
        this.platformName = document.getElementById('platformName');
        
        // Search elements
        this.searchInput = document.getElementById('searchInput');
        this.searchBtn = document.getElementById('searchBtn');
        this.searchFilters = document.getElementById('searchFilters');
        this.filterButtons = document.querySelectorAll('.filter-btn');
        
        // Results elements
        this.resultsContainer = document.getElementById('resultsContainer');
        this.loadingState = document.getElementById('loadingState');
        this.emptyState = document.getElementById('emptyState');
        this.searchResults = document.getElementById('searchResults');
        this.resultsGrid = document.getElementById('resultsGrid');
        this.resultsCount = document.getElementById('resultsCount');
        this.loadMoreBtn = document.getElementById('loadMoreBtn');
        
        // Settings modal
        this.settingsModal = document.getElementById('settingsModal');
        this.searchSettings = document.getElementById('searchSettings');
        this.closeSettings = document.getElementById('closeSettings');
        this.saveSettings = document.getElementById('saveSettings');
        this.cancelSettings = document.getElementById('cancelSettings');
        
        // Usage indicator
        this.usageCount = document.getElementById('usageCount');
    }
    
    bindEvents() {
        // Platform switching
        this.platformButtons.forEach(btn => {
            btn.addEventListener('click', (e) => {
                const platform = e.currentTarget.dataset.platform;
                if (platform !== 'overview') {
                    this.switchPlatform(platform);
                }
            });
        });
        
        // Search functionality
        this.searchBtn.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        // Filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('filter-btn')) {
                this.setActiveFilter(e.target);
            }
        });
        
        // Load more results
        this.loadMoreBtn.addEventListener('click', () => this.loadMoreResults());
        
        // Settings modal
        this.searchSettings.addEventListener('click', () => this.openSettingsModal());
        this.closeSettings.addEventListener('click', () => this.closeSettingsModal());
        this.cancelSettings.addEventListener('click', () => this.closeSettingsModal());
        this.saveSettings.addEventListener('click', () => this.saveSearchSettings());
        
        // Click outside modal to close
        this.settingsModal.addEventListener('click', (e) => {
            if (e.target === this.settingsModal) {
                this.closeSettingsModal();
            }
        });
    }
    
    switchPlatform(platform) {
        if (!this.platformConfigs[platform]) return;
        
        this.currentPlatform = platform;
        const config = this.platformConfigs[platform];
        
        // Update active platform button
        this.platformButtons.forEach(btn => {
            btn.classList.remove('active');
            if (btn.dataset.platform === platform) {
                btn.classList.add('active');
            }
        });
        
        // Update header
        this.pageTitle.textContent = config.name;
        
        // Update search card
        this.platformIcon.className = `w-10 h-10 bg-gradient-to-br ${config.gradient} rounded-xl flex items-center justify-center`;
        this.platformIcon.innerHTML = `<i data-lucide="${config.icon}" class="w-5 h-5 text-white"></i>`;
        this.platformName.textContent = config.name;
        this.platformName.nextElementSibling.textContent = config.description;
        
        // Update search input
        this.searchInput.placeholder = config.placeholder;
        
        // Update filters
        this.updateSearchFilters(config.filters);
        
        // Reset results
        this.clearResults();
        
        this.initializeLucideIcons();
        console.log(`🔄 Switched to ${platform} platform`);
    }
    
    updateSearchFilters(filters) {
        const filterLabels = {
            all: 'All Content',
            posts: 'Posts Only',
            profiles: 'Profiles',
            hashtags: 'Hashtags',
            tweets: 'Tweets',
            users: 'Users',
            media: 'Media',
            people: 'People',
            companies: 'Companies',
            jobs: 'Jobs',
            videos: 'Videos',
            sounds: 'Sounds',
            comments: 'Comments',
            subreddits: 'Subreddits',
            channels: 'Channels',
            playlists: 'Playlists',
            pages: 'Pages',
            groups: 'Groups',
            pins: 'Pins',
            boards: 'Boards',
            questions: 'Questions',
            answers: 'Answers',
            topics: 'Topics'
        };
        
        this.searchFilters.innerHTML = filters.map((filter, index) => `
            <button class="px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 rounded-lg filter-btn ${index === 0 ? 'active' : ''}" data-filter="${filter}">
                ${filterLabels[filter] || filter}
            </button>
        `).join('');
    }
    
    setActiveFilter(filterBtn) {
        document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
        filterBtn.classList.add('active');
    }
    
    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query || this.isLoading) return;
        
        // Check usage limits
        if (this.brightDataConfig.currentUsage >= this.brightDataConfig.freeRequestsLimit) {
            this.showUpgradePrompt();
            return;
        }
        
        this.isLoading = true;
        this.showLoading();
        
        const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
        
        try {
            console.log(`🔍 Searching ${this.currentPlatform} for: "${query}" with filter: ${activeFilter}`);
            
            // Call BrightData MCP server
            const results = await this.callBrightDataAPI(query, activeFilter);
            
            this.displayResults(results);
            this.incrementUsage();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
        } finally {
            this.isLoading = false;
            this.hideLoading();
        }
    }
    
    async callBrightDataAPI(query, filter) {
        // Simulate BrightData MCP server call - replace with actual implementation
        await this.delay(2000);
        
        // Mock data based on platform
        const mockResults = this.generateMockResults(query, filter);
        return mockResults;
    }
    
    generateMockResults(query, filter) {
        const platforms = {
            instagram: this.generateInstagramResults,
            twitter: this.generateTwitterResults,
            linkedin: this.generateLinkedInResults,
            tiktok: this.generateTikTokResults,
            reddit: this.generateRedditResults,
            youtube: this.generateYouTubeResults,
            facebook: this.generateFacebookResults,
            pinterest: this.generatePinterestResults,
            quora: this.generateQuoraResults,
            vimeo: this.generateVimeoResults
        };
        
        const generator = platforms[this.currentPlatform];
        return generator ? generator.call(this, query, filter) : [];
    }
    
    generateInstagramResults(query, filter) {
        return Array.from({length: 12}, (_, i) => ({
            id: `ig_${i}`,
            type: filter === 'profiles' ? 'profile' : filter === 'hashtags' ? 'hashtag' : 'post',
            title: filter === 'hashtags' ? `#${query}${i}` : `@user${i}`,
            content: `Instagram ${filter} result for "${query}" - sample content ${i + 1}`,
            image: `https://picsum.photos/300/300?random=${i}`,
            likes: Math.floor(Math.random() * 10000),
            comments: Math.floor(Math.random() * 500),
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString(),
            author: `@user${i}`,
            verified: Math.random() > 0.7
        }));
    }
    
    generateTwitterResults(query, filter) {
        return Array.from({length: 15}, (_, i) => ({
            id: `tw_${i}`,
            type: filter === 'users' ? 'user' : 'tweet',
            title: `@user${i}`,
            content: `Tweet about "${query}" - This is a sample tweet content ${i + 1} with relevant hashtags and mentions.`,
            image: Math.random() > 0.6 ? `https://picsum.photos/400/300?random=${i}` : null,
            retweets: Math.floor(Math.random() * 1000),
            likes: Math.floor(Math.random() * 5000),
            replies: Math.floor(Math.random() * 200),
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 3).toISOString(),
            author: `@user${i}`,
            verified: Math.random() > 0.8
        }));
    }
    
    generateLinkedInResults(query, filter) {
        return Array.from({length: 10}, (_, i) => ({
            id: `li_${i}`,
            type: filter === 'companies' ? 'company' : filter === 'jobs' ? 'job' : 'post',
            title: filter === 'jobs' ? `${query} - Job Position ${i + 1}` : `Professional discussing ${query}`,
            content: `LinkedIn content about "${query}" - Professional insights and industry discussion ${i + 1}`,
            company: filter === 'jobs' ? `Company ${i + 1}` : null,
            location: filter === 'jobs' ? `City ${i + 1}` : null,
            author: `Professional User ${i + 1}`,
            connections: Math.floor(Math.random() * 500) + 100,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 14).toISOString()
        }));
    }
    
    generateTikTokResults(query, filter) {
        return Array.from({length: 18}, (_, i) => ({
            id: `tt_${i}`,
            type: filter === 'users' ? 'user' : 'video',
            title: `TikTok video about ${query} ${i + 1}`,
            content: `Creative TikTok content featuring "${query}" with trending sounds and effects`,
            thumbnail: `https://picsum.photos/300/400?random=${i}`,
            views: Math.floor(Math.random() * 1000000),
            likes: Math.floor(Math.random() * 100000),
            shares: Math.floor(Math.random() * 10000),
            duration: Math.floor(Math.random() * 60) + 15,
            author: `@tiktoker${i}`,
            verified: Math.random() > 0.85,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 5).toISOString()
        }));
    }
    
    generateRedditResults(query, filter) {
        return Array.from({length: 8}, (_, i) => ({
            id: `rd_${i}`,
            type: filter === 'subreddits' ? 'subreddit' : filter === 'users' ? 'user' : 'post',
            title: `Reddit discussion: ${query} ${i + 1}`,
            content: `Reddit post content about "${query}" with community discussion and insights`,
            subreddit: `r/relevantsubreddit${i}`,
            upvotes: Math.floor(Math.random() * 5000),
            comments: Math.floor(Math.random() * 200),
            author: `u/redditor${i}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 10).toISOString()
        }));
    }
    
    generateYouTubeResults(query, filter) {
        return Array.from({length: 12}, (_, i) => ({
            id: `yt_${i}`,
            type: filter === 'channels' ? 'channel' : 'video',
            title: `${query} - YouTube Video ${i + 1}`,
            content: `Video description about "${query}" with detailed explanation and insights`,
            thumbnail: `https://picsum.photos/480/360?random=${i}`,
            views: Math.floor(Math.random() * 1000000),
            likes: Math.floor(Math.random() * 50000),
            duration: `${Math.floor(Math.random() * 20) + 5}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            channel: `Channel ${i + 1}`,
            subscribers: Math.floor(Math.random() * 1000000),
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
        }));
    }
    
    generateFacebookResults(query, filter) {
        return Array.from({length: 10}, (_, i) => ({
            id: `fb_${i}`,
            type: filter === 'pages' ? 'page' : filter === 'groups' ? 'group' : 'post',
            title: `Facebook post about ${query}`,
            content: `Facebook content discussing "${query}" with community engagement and sharing`,
            image: Math.random() > 0.5 ? `https://picsum.photos/400/300?random=${i}` : null,
            likes: Math.floor(Math.random() * 10000),
            comments: Math.floor(Math.random() * 500),
            shares: Math.floor(Math.random() * 1000),
            author: `Facebook User ${i + 1}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 7).toISOString()
        }));
    }
    
    generatePinterestResults(query, filter) {
        return Array.from({length: 20}, (_, i) => ({
            id: `pt_${i}`,
            type: filter === 'boards' ? 'board' : 'pin',
            title: `Pin about ${query} ${i + 1}`,
            content: `Pinterest pin featuring "${query}" with creative ideas and inspiration`,
            image: `https://picsum.photos/300/400?random=${i}`,
            saves: Math.floor(Math.random() * 5000),
            board: `Board about ${query}`,
            author: `Pinterest User ${i + 1}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 20).toISOString()
        }));
    }
    
    generateQuoraResults(query, filter) {
        return Array.from({length: 6}, (_, i) => ({
            id: `qr_${i}`,
            type: filter === 'answers' ? 'answer' : 'question',
            title: `What is the best approach to ${query}?`,
            content: `Detailed Quora answer about "${query}" providing expert insights and practical advice`,
            upvotes: Math.floor(Math.random() * 1000),
            views: Math.floor(Math.random() * 50000),
            answers: filter === 'questions' ? Math.floor(Math.random() * 20) + 1 : null,
            author: `Expert ${i + 1}`,
            credentials: `Professional in ${query}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 60).toISOString()
        }));
    }
    
    generateVimeoResults(query, filter) {
        return Array.from({length: 8}, (_, i) => ({
            id: `vm_${i}`,
            type: filter === 'users' ? 'user' : 'video',
            title: `${query} - Vimeo Video ${i + 1}`,
            content: `High-quality Vimeo video about "${query}" with professional production`,
            thumbnail: `https://picsum.photos/480/270?random=${i}`,
            views: Math.floor(Math.random() * 100000),
            likes: Math.floor(Math.random() * 5000),
            duration: `${Math.floor(Math.random() * 30) + 2}:${String(Math.floor(Math.random() * 60)).padStart(2, '0')}`,
            author: `Vimeo Creator ${i + 1}`,
            timestamp: new Date(Date.now() - Math.random() * 86400000 * 45).toISOString()
        }));
    }
    
    displayResults(results) {
        this.searchResults.searchResults = results;
        this.showResults();
        
        this.resultsCount.textContent = `Found ${results.length} results`;
        this.resultsGrid.innerHTML = results.map(result => this.createResultCard(result)).join('');
        
        this.initializeLucideIcons();
    }
    
    createResultCard(result) {
        const timeAgo = this.getTimeAgo(new Date(result.timestamp));
        
        const baseCard = `
            <div class="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
                <div class="flex items-start space-x-3">
                    <div class="flex-shrink-0">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                            <span class="text-white text-xs font-medium">${result.author?.charAt(1) || 'U'}</span>
                        </div>
                    </div>
                    <div class="flex-1 min-w-0">
                        <div class="flex items-center space-x-2 mb-1">
                            <h4 class="text-sm font-semibold truncate">${result.author || 'Anonymous'}</h4>
                            ${result.verified ? '<i data-lucide="badge-check" class="w-3 h-3 text-blue-500"></i>' : ''}
                            <span class="text-xs text-muted-foreground">• ${timeAgo}</span>
                        </div>
                        <h3 class="font-medium text-sm mb-2 line-clamp-2">${result.title}</h3>
                        <p class="text-sm text-muted-foreground line-clamp-3 mb-3">${result.content}</p>
        `;
        
        const platformSpecific = this.getPlatformSpecificCard(result);
        const actions = this.getCardActions(result);
        
        return baseCard + platformSpecific + actions + '</div></div></div>';
    }
    
    getPlatformSpecificCard(result) {
        switch (this.currentPlatform) {
            case 'instagram':
                return `
                    ${result.image ? `<img src="${result.image}" alt="Post image" class="w-full h-32 object-cover rounded-lg mb-3">` : ''}
                    <div class="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span><i data-lucide="heart" class="w-3 h-3 inline mr-1"></i>${result.likes?.toLocaleString()}</span>
                        <span><i data-lucide="message-circle" class="w-3 h-3 inline mr-1"></i>${result.comments?.toLocaleString()}</span>
                    </div>
                `;
                
            case 'twitter':
                return `
                    ${result.image ? `<img src="${result.image}" alt="Tweet image" class="w-full h-32 object-cover rounded-lg mb-3">` : ''}
                    <div class="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span><i data-lucide="repeat" class="w-3 h-3 inline mr-1"></i>${result.retweets?.toLocaleString()}</span>
                        <span><i data-lucide="heart" class="w-3 h-3 inline mr-1"></i>${result.likes?.toLocaleString()}</span>
                        <span><i data-lucide="message-circle" class="w-3 h-3 inline mr-1"></i>${result.replies?.toLocaleString()}</span>
                    </div>
                `;
                
            case 'youtube':
                return `
                    <div class="relative mb-3">
                        <img src="${result.thumbnail}" alt="Video thumbnail" class="w-full h-32 object-cover rounded-lg">
                        <div class="absolute bottom-2 right-2 bg-black/80 text-white text-xs px-1.5 py-0.5 rounded">
                            ${result.duration}
                        </div>
                    </div>
                    <div class="flex items-center space-x-4 text-xs text-muted-foreground">
                        <span><i data-lucide="eye" class="w-3 h-3 inline mr-1"></i>${result.views?.toLocaleString()}</span>
                        <span><i data-lucide="thumbs-up" class="w-3 h-3 inline mr-1"></i>${result.likes?.toLocaleString()}</span>
                    </div>
                `;
                
            default:
                return '';
        }
    }
    
    getCardActions(result) {
        return `
            <div class="flex items-center justify-between mt-3 pt-3 border-t">
                <div class="flex space-x-2">
                    <button class="text-xs text-muted-foreground hover:text-primary">
                        <i data-lucide="external-link" class="w-3 h-3 inline mr-1"></i>View
                    </button>
                    <button class="text-xs text-muted-foreground hover:text-primary">
                        <i data-lucide="share" class="w-3 h-3 inline mr-1"></i>Share
                    </button>
                </div>
                <button class="text-xs text-muted-foreground hover:text-primary">
                    <i data-lucide="bookmark" class="w-3 h-3 inline mr-1"></i>Save
                </button>
            </div>
        `;
    }
    
    showLoading() {
        this.emptyState.classList.add('hidden');
        this.searchResults.classList.add('hidden');
        this.loadingState.classList.remove('hidden');
    }
    
    hideLoading() {
        this.loadingState.classList.add('hidden');
    }
    
    showResults() {
        this.emptyState.classList.add('hidden');
        this.searchResults.classList.remove('hidden');
    }
    
    clearResults() {
        this.emptyState.classList.remove('hidden');
        this.searchResults.classList.add('hidden');
        this.resultsGrid.innerHTML = '';
    }
    
    async loadMoreResults() {
        if (this.isLoading) return;
        
        this.currentPage++;
        this.isLoading = true;
        this.loadMoreBtn.textContent = 'Loading...';
        
        try {
            const query = this.searchInput.value.trim();
            const activeFilter = document.querySelector('.filter-btn.active')?.dataset.filter || 'all';
            const moreResults = await this.callBrightDataAPI(query, activeFilter);
            
            // Append new results
            const newCards = moreResults.map(result => this.createResultCard(result)).join('');
            this.resultsGrid.insertAdjacentHTML('beforeend', newCards);
            
            this.initializeLucideIcons();
            this.incrementUsage();
            
        } catch (error) {
            console.error('Load more error:', error);
        } finally {
            this.isLoading = false;
            this.loadMoreBtn.textContent = 'Load More Results';
        }
    }
    
    incrementUsage(count = 1) {
        this.brightDataConfig.currentUsage += count;
        localStorage.setItem('bd_usage', this.brightDataConfig.currentUsage.toString());
        this.updateUsageIndicator();
    }
    
    updateUsageIndicator() {
        const usage = this.brightDataConfig.currentUsage;
        const limit = this.brightDataConfig.freeRequestsLimit;
        const percentage = (usage / limit) * 100;
        
        this.usageCount.textContent = `${usage.toLocaleString()} / ${limit.toLocaleString()}`;
        
        const indicator = document.querySelector('.usage-indicator');
        if (indicator) {
            indicator.style.setProperty('--usage-percent', `${percentage}%`);
        }
        
        // Show warning if approaching limit
        if (percentage > 90) {
            this.usageCount.classList.add('text-red-500');
        } else if (percentage > 75) {
            this.usageCount.classList.add('text-yellow-500');
        }
    }
    
    showUpgradePrompt() {
        alert('You have reached your free tier limit of 5,000 requests. Please upgrade to continue searching.');
        // TODO: Implement upgrade modal
    }
    
    showError(message) {
        console.error('Search error:', message);
        // TODO: Implement error display
    }
    
    openSettingsModal() {
        this.settingsModal.classList.remove('hidden');
        this.settingsModal.classList.add('flex');
    }
    
    closeSettingsModal() {
        this.settingsModal.classList.add('hidden');
        this.settingsModal.classList.remove('flex');
    }
    
    saveSearchSettings() {
        // TODO: Implement settings save
        console.log('Settings saved');
        this.closeSettingsModal();
    }
    
    getTimeAgo(date) {
        const now = new Date();
        const diff = Math.abs(now - date);
        const minutes = Math.floor(diff / 60000);
        const hours = Math.floor(diff / 3600000);
        const days = Math.floor(diff / 86400000);
        
        if (minutes < 60) return `${minutes}m ago`;
        if (hours < 24) return `${hours}h ago`;
        return `${days}d ago`;
    }
    
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Apply Tailwind configuration
    tailwind.config = {
        darkMode: 'class',
        theme: {
            extend: {
                colors: {
                    border: "hsl(var(--border))",
                    input: "hsl(var(--input))",
                    ring: "hsl(var(--ring))",
                    background: "hsl(var(--background))",
                    foreground: "hsl(var(--foreground))",
                    primary: {
                        DEFAULT: "hsl(var(--primary))",
                        foreground: "hsl(var(--primary-foreground))"
                    },
                    secondary: {
                        DEFAULT: "hsl(var(--secondary))",
                        foreground: "hsl(var(--secondary-foreground))"
                    },
                    destructive: {
                        DEFAULT: "hsl(var(--destructive))",
                        foreground: "hsl(var(--destructive-foreground))"
                    },
                    muted: {
                        DEFAULT: "hsl(var(--muted))",
                        foreground: "hsl(var(--muted-foreground))"
                    },
                    accent: {
                        DEFAULT: "hsl(var(--accent))",
                        foreground: "hsl(var(--accent-foreground))"
                    },
                    popover: {
                        DEFAULT: "hsl(var(--popover))",
                        foreground: "hsl(var(--popover-foreground))"
                    },
                    card: {
                        DEFAULT: "hsl(var(--card))",
                        foreground: "hsl(var(--card-foreground))"
                    }
                }
            }
        }
    };
    
    new AdvancedSearchDashboard();
    
    console.log('🎯 Advanced Search Dashboard - Ready to search social media platforms via BrightData');
});

// Export for potential module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AdvancedSearchDashboard;
}
