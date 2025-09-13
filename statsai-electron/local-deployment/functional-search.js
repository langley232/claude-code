// Functional Search - Google One AI Premium Integration
// Gemini-inspired interface with GCP backend integration

class FunctionalSearch {
    constructor() {
        this.currentFeature = 'web';
        this.apiConfig = {
            apiKey: localStorage.getItem('gcp_api_key') || '',
            projectId: localStorage.getItem('gcp_project_id') || '',
            baseUrl: 'https://your-gcp-endpoint.com/api' // Replace with your GCP endpoint
        };
        this.usageTracking = {
            searchesToday: parseInt(localStorage.getItem('searches_today') || '0'),
            totalCost: parseFloat(localStorage.getItem('total_cost') || '0.00'),
            lastResetDate: localStorage.getItem('last_reset_date') || new Date().toDateString()
        };
        this.rateLimits = {
            searchAPI: { current: 0, max: 100 },
            videoAPI: { current: 0, max: 10 },
            imageAPI: { current: 0, max: 50 }
        };

        this.init();
    }

    init() {
        this.initializeElements();
        this.bindEvents();
        this.resetDailyUsageIfNeeded();
        this.updateUsageDisplay();
        this.initializeLucideIcons();
        
        console.log('🔍 Functional Search initialized with Gemini-inspired design');
    }

    initializeElements() {
        // Core elements
        this.searchInput = document.getElementById('searchInput');
        this.searchSubmit = document.getElementById('searchSubmit');
        this.resultsSection = document.getElementById('resultsSection');
        
        // Feature tabs
        this.featureTabs = document.querySelectorAll('.feature-tab');
        
        // Result containers
        this.webResults = document.getElementById('webResults');
        this.youtubeResults = document.getElementById('youtubeResults');
        this.socialResults = document.getElementById('socialResults');
        this.documentProcessor = document.getElementById('documentProcessor');
        this.videoCreator = document.getElementById('videoCreator');
        this.imageGenerator = document.getElementById('imageGenerator');
        
        // Loading and error states
        this.loadingContainer = document.getElementById('loadingContainer');
        this.errorContainer = document.getElementById('errorContainer');
        
        // Settings and usage
        this.usageIndicator = document.getElementById('usageIndicator');
        this.settingsBtn = document.getElementById('settingsBtn');
        this.settingsModal = document.getElementById('settingsModal');
    }

    bindEvents() {
        // Search functionality
        this.searchSubmit.addEventListener('click', () => this.performSearch());
        this.searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });

        // Feature tab switching
        this.featureTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchFeature(e.target.dataset.feature));
        });

        // Settings modal
        this.settingsBtn.addEventListener('click', () => this.openSettings());
        document.getElementById('modalClose').addEventListener('click', () => this.closeSettings());
        document.getElementById('cancelConfig').addEventListener('click', () => this.closeSettings());
        document.getElementById('saveConfig').addEventListener('click', () => this.saveConfiguration());

        // Document upload
        const fileInput = document.getElementById('fileInput');
        const dropZone = document.getElementById('dropZone');
        
        dropZone.addEventListener('click', () => fileInput.click());
        dropZone.addEventListener('dragover', (e) => this.handleDragOver(e));
        dropZone.addEventListener('drop', (e) => this.handleFileDrop(e));
        fileInput.addEventListener('change', (e) => this.handleFileSelect(e));

        // Video creation
        document.querySelectorAll('.create-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.handleVideoCreation(e));
        });

        // Image generation
        document.querySelector('.generate-btn').addEventListener('click', () => this.generateImage());

        // Style selection for images
        document.querySelectorAll('.style-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.selectImageStyle(e.target));
        });

        // Error retry
        document.getElementById('retryBtn').addEventListener('click', () => this.performSearch());

        // Sidebar toggle
        document.getElementById('sidebarToggle').addEventListener('click', () => this.toggleSidebar());
    }

    initializeLucideIcons() {
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    switchFeature(feature) {
        this.currentFeature = feature;
        
        // Update active tab
        this.featureTabs.forEach(tab => tab.classList.remove('active'));
        document.querySelector(`[data-feature="${feature}"]`).classList.add('active');
        
        // Hide all result containers
        const resultContainers = [
            this.webResults, this.youtubeResults, this.socialResults,
            this.documentProcessor, this.videoCreator, this.imageGenerator
        ];
        resultContainers.forEach(container => {
            if (container) container.style.display = 'none';
        });
        
        // Show relevant container based on feature
        switch (feature) {
            case 'web':
                if (this.webResults) this.webResults.style.display = 'block';
                this.searchInput.placeholder = 'Search the web with AI-powered insights...';
                break;
            case 'youtube':
                if (this.youtubeResults) this.youtubeResults.style.display = 'block';
                this.searchInput.placeholder = 'Search YouTube videos and channels...';
                break;
            case 'social':
                if (this.socialResults) this.socialResults.style.display = 'block';
                this.searchInput.placeholder = 'Search across social media platforms...';
                break;
            case 'documents':
                if (this.documentProcessor) this.documentProcessor.style.display = 'block';
                this.searchInput.placeholder = 'Search or upload documents for analysis...';
                break;
            case 'video':
                if (this.videoCreator) this.videoCreator.style.display = 'block';
                this.searchInput.placeholder = 'Describe the video you want to create...';
                break;
            case 'image':
                if (this.imageGenerator) this.imageGenerator.style.display = 'block';
                this.searchInput.placeholder = 'Describe the image you want to generate...';
                break;
        }
        
        console.log(`🎯 Switched to ${feature} feature`);
    }

    async performSearch() {
        const query = this.searchInput.value.trim();
        if (!query) return;

        console.log(`🔍 Performing ${this.currentFeature} search for: "${query}"`);
        
        this.showLoading();
        this.hideError();
        
        try {
            switch (this.currentFeature) {
                case 'web':
                    await this.performWebSearch(query);
                    break;
                case 'youtube':
                    await this.performYouTubeSearch(query);
                    break;
                case 'social':
                    await this.performSocialSearch(query);
                    break;
                case 'documents':
                    await this.searchDocuments(query);
                    break;
                case 'video':
                    await this.createVideo(query);
                    break;
                case 'image':
                    await this.generateImageFromText(query);
                    break;
            }
            
            this.incrementUsage('search');
            this.hideLoading();
            
        } catch (error) {
            console.error('Search error:', error);
            this.showError(error.message);
            this.hideLoading();
        }
    }

    async performWebSearch(query) {
        // Simulate API call - replace with actual GCP integration
        await this.simulateAPICall();
        
        const mockResults = [
            {
                title: 'Advanced AI Research Results',
                url: 'https://example.com/research',
                snippet: 'Comprehensive analysis powered by Google\'s Gemini AI...',
                source: 'Research Portal'
            },
            {
                title: 'Deep Learning Insights',
                url: 'https://example.com/insights',
                snippet: 'Latest developments in artificial intelligence and machine learning...',
                source: 'AI Journal'
            }
        ];
        
        this.displayWebResults(mockResults);
    }

    async performYouTubeSearch(query) {
        await this.simulateAPICall();
        
        const mockVideos = [
            {
                title: 'AI Tutorial: Getting Started',
                channel: 'Tech Educator',
                thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23f0f0f0"/><text x="160" y="90" text-anchor="middle" dy=".35em" fill="%23666">Video Thumbnail</text></svg>',
                duration: '15:30',
                views: '1.2M views',
                published: '2 days ago'
            }
        ];
        
        this.displayYouTubeResults(mockVideos);
    }

    async performSocialSearch(query) {
        await this.simulateAPICall();
        
        const mockPosts = [
            {
                platform: 'twitter',
                author: '@tech_news',
                content: 'Breaking: New AI developments are changing the landscape...',
                engagement: '234 likes, 56 retweets',
                timestamp: '2 hours ago'
            }
        ];
        
        this.displaySocialResults(mockPosts);
    }

    async createVideo(prompt) {
        await this.simulateAPICall(3000); // Longer for video generation
        
        const mockVideo = {
            id: 'video_' + Date.now(),
            status: 'completed',
            thumbnail: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="320" height="180" viewBox="0 0 320 180"><rect width="320" height="180" fill="%23e0e0e0"/><text x="160" y="90" text-anchor="middle" dy=".35em" fill="%23666">Generated Video</text></svg>',
            duration: '0:30'
        };
        
        this.displayVideoResult(mockVideo);
        this.incrementUsage('video', 0.50); // $0.50 per video
    }

    async generateImageFromText(prompt) {
        await this.simulateAPICall(2000);
        
        const mockImage = {
            id: 'image_' + Date.now(),
            url: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512"><rect width="512" height="512" fill="%23f5f5f5"/><text x="256" y="256" text-anchor="middle" dy=".35em" fill="%23888">Generated Image</text></svg>',
            style: document.querySelector('.style-btn.active').dataset.style
        };
        
        this.displayImageResult(mockImage);
        this.incrementUsage('image', 0.10); // $0.10 per image
    }

    // Display Methods
    displayWebResults(results) {
        const resultsList = document.getElementById('webResultsList');
        resultsList.innerHTML = results.map(result => `
            <div class="result-card">
                <h3 class="result-title">
                    <a href="${result.url}" target="_blank">${result.title}</a>
                </h3>
                <p class="result-snippet">${result.snippet}</p>
                <div class="result-meta">
                    <span class="result-source">${result.source}</span>
                    <span class="result-url">${result.url}</span>
                </div>
            </div>
        `).join('');
        
        document.getElementById('resultsCount').textContent = `${results.length} results`;
        document.getElementById('resultsTime').textContent = '0.34s';
        this.webResults.style.display = 'block';
    }

    displayYouTubeResults(videos) {
        const youtubeGrid = document.getElementById('youtubeGrid');
        youtubeGrid.innerHTML = videos.map(video => `
            <div class="youtube-card">
                <div class="video-thumbnail">
                    <img src="${video.thumbnail}" alt="${video.title}">
                    <span class="video-duration">${video.duration}</span>
                </div>
                <div class="video-info">
                    <h3 class="video-title">${video.title}</h3>
                    <p class="video-channel">${video.channel}</p>
                    <div class="video-meta">
                        <span>${video.views}</span>
                        <span>${video.published}</span>
                    </div>
                </div>
            </div>
        `).join('');
    }

    displaySocialResults(posts) {
        const socialFeed = document.getElementById('socialFeed');
        socialFeed.innerHTML = posts.map(post => `
            <div class="social-card ${post.platform}">
                <div class="social-header">
                    <div class="platform-icon ${post.platform}"></div>
                    <span class="social-author">${post.author}</span>
                    <span class="social-time">${post.timestamp}</span>
                </div>
                <div class="social-content">${post.content}</div>
                <div class="social-engagement">${post.engagement}</div>
            </div>
        `).join('');
    }

    displayVideoResult(video) {
        const videoResults = document.getElementById('videoResults');
        videoResults.innerHTML = `
            <div class="generated-video">
                <h3>Generated Video</h3>
                <div class="video-preview">
                    <img src="${video.thumbnail}" alt="Video thumbnail">
                    <div class="video-controls">
                        <button class="play-btn">
                            <i data-lucide="play"></i>
                        </button>
                        <span class="video-duration">${video.duration}</span>
                    </div>
                </div>
                <div class="video-actions">
                    <button class="btn-primary">Download</button>
                    <button class="btn-secondary">Share</button>
                </div>
            </div>
        `;
        this.initializeLucideIcons();
    }

    displayImageResult(image) {
        const imageResults = document.getElementById('imageResults');
        imageResults.innerHTML = `
            <div class="generated-image">
                <h3>Generated Image</h3>
                <div class="image-preview">
                    <img src="${image.url}" alt="Generated image">
                </div>
                <div class="image-meta">
                    <span>Style: ${image.style}</span>
                    <span>Resolution: 512x512</span>
                </div>
                <div class="image-actions">
                    <button class="btn-primary">Download</button>
                    <button class="btn-secondary">Edit</button>
                    <button class="btn-secondary">Generate Variations</button>
                </div>
            </div>
        `;
    }

    // File handling
    handleDragOver(e) {
        e.preventDefault();
        e.currentTarget.classList.add('drag-over');
    }

    handleFileDrop(e) {
        e.preventDefault();
        e.currentTarget.classList.remove('drag-over');
        const files = Array.from(e.dataTransfer.files);
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = Array.from(e.target.files);
        this.processFiles(files);
    }

    processFiles(files) {
        const documentResults = document.getElementById('documentResults');
        documentResults.innerHTML = files.map(file => `
            <div class="document-card processing">
                <div class="doc-info">
                    <i data-lucide="file-text"></i>
                    <div>
                        <h4>${file.name}</h4>
                        <p>${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                    </div>
                </div>
                <div class="doc-status">Processing...</div>
            </div>
        `).join('');
        
        this.initializeLucideIcons();
        
        // Simulate processing
        setTimeout(() => {
            documentResults.innerHTML = files.map(file => `
                <div class="document-card completed">
                    <div class="doc-info">
                        <i data-lucide="check-circle"></i>
                        <div>
                            <h4>${file.name}</h4>
                            <p>Analysis complete</p>
                        </div>
                    </div>
                    <div class="doc-actions">
                        <button class="btn-secondary">View Summary</button>
                        <button class="btn-secondary">Ask Questions</button>
                    </div>
                </div>
            `).join('');
            this.initializeLucideIcons();
        }, 2000);
    }

    selectImageStyle(styleBtn) {
        document.querySelectorAll('.style-btn').forEach(btn => btn.classList.remove('active'));
        styleBtn.classList.add('active');
    }

    // Utility methods
    showLoading() {
        this.loadingContainer.style.display = 'block';
        this.resultsSection.appendChild(this.loadingContainer);
        
        // Animate progress bar
        const progressBar = document.getElementById('progressBar');
        progressBar.style.width = '0%';
        
        let progress = 0;
        const progressInterval = setInterval(() => {
            progress += Math.random() * 15;
            if (progress > 90) progress = 90;
            progressBar.style.width = progress + '%';
        }, 100);
        
        this.progressInterval = progressInterval;
    }

    hideLoading() {
        this.loadingContainer.style.display = 'none';
        if (this.progressInterval) {
            clearInterval(this.progressInterval);
        }
    }

    showError(message) {
        document.getElementById('errorMessage').textContent = message;
        this.errorContainer.style.display = 'block';
    }

    hideError() {
        this.errorContainer.style.display = 'none';
    }

    async simulateAPICall(delay = 1000) {
        return new Promise(resolve => setTimeout(resolve, delay));
    }

    // Settings and configuration
    openSettings() {
        this.settingsModal.style.display = 'flex';
        document.getElementById('gcpApiKey').value = this.apiConfig.apiKey;
        document.getElementById('projectId').value = this.apiConfig.projectId;
    }

    closeSettings() {
        this.settingsModal.style.display = 'none';
    }

    saveConfiguration() {
        const apiKey = document.getElementById('gcpApiKey').value;
        const projectId = document.getElementById('projectId').value;
        
        if (apiKey && projectId) {
            this.apiConfig.apiKey = apiKey;
            this.apiConfig.projectId = projectId;
            
            localStorage.setItem('gcp_api_key', apiKey);
            localStorage.setItem('gcp_project_id', projectId);
            
            this.closeSettings();
            console.log('✅ Configuration saved successfully');
        }
    }

    // Usage tracking
    incrementUsage(type, cost = 0.01) {
        this.usageTracking.searchesToday++;
        this.usageTracking.totalCost += cost;
        
        localStorage.setItem('searches_today', this.usageTracking.searchesToday.toString());
        localStorage.setItem('total_cost', this.usageTracking.totalCost.toFixed(2));
        
        this.updateUsageDisplay();
        
        // Update rate limits
        if (this.rateLimits[type + 'API']) {
            this.rateLimits[type + 'API'].current++;
        }
    }

    updateUsageDisplay() {
        if (this.usageIndicator) {
            const usageText = this.usageIndicator.querySelector('.usage-text');
            if (usageText) {
                usageText.textContent = `Usage: $${this.usageTracking.totalCost.toFixed(2)}`;
            }
        }
        
        // Update sidebar stats
        const searchesTodayEl = document.getElementById('searchesToday');
        const totalCostEl = document.getElementById('totalCost');
        
        if (searchesTodayEl) searchesTodayEl.textContent = this.usageTracking.searchesToday;
        if (totalCostEl) totalCostEl.textContent = `$${this.usageTracking.totalCost.toFixed(2)}`;
    }

    resetDailyUsageIfNeeded() {
        const today = new Date().toDateString();
        if (this.usageTracking.lastResetDate !== today) {
            this.usageTracking.searchesToday = 0;
            this.usageTracking.lastResetDate = today;
            localStorage.setItem('searches_today', '0');
            localStorage.setItem('last_reset_date', today);
        }
    }

    toggleSidebar() {
        const sidebar = document.getElementById('searchSidebar');
        sidebar.classList.toggle('collapsed');
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    new FunctionalSearch();
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    console.log('🌟 Functional Search - Google One AI Premium Interface Loaded');
});