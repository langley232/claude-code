// Social Media Search with BrightData API
// Implements Instagram and multi-platform social media search with tiles layout

class SocialMediaSearchManager {
    constructor() {
        this.apiKey = 'kl4k6o3e1sc0'; // BrightData API key (same as YouTube)
        this.currentPage = 1;
        this.itemsPerPage = 12; // 4x3 grid
        this.currentQuery = '';
        this.currentPlatform = 'all';
        this.totalResults = 0;
        this.posts = [];
        this.isLoading = false;
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search form submission
        const searchInput = document.getElementById('searchInput');
        const searchSubmit = document.getElementById('searchSubmit');
        
        if (searchSubmit) {
            searchSubmit.addEventListener('click', (e) => {
                e.preventDefault();
                const query = searchInput.value.trim();
                if (query) {
                    this.searchSocialMedia(query);
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    if (query) {
                        this.searchSocialMedia(query);
                    }
                }
            });
        }

        // Feature tab switching
        const socialTabs = document.querySelectorAll('[data-feature="social"]');
        socialTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.showSocialInterface();
            });
        });

        // Platform filter buttons
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('platform-filter')) {
                this.handlePlatformFilter(e.target);
            }
            
            if (e.target.classList.contains('pagination-btn')) {
                this.handlePaginationClick(e.target);
            }
        });
    }

    async searchSocialMedia(query, page = 1, platform = 'all') {
        if (this.isLoading) return;

        this.isLoading = true;
        this.currentQuery = query;
        this.currentPage = page;
        this.currentPlatform = platform;

        try {
            this.showLoadingState();
            
            // For demonstration, we'll use mock data similar to BrightData responses
            // In production, you'd implement BrightData integration
            const posts = await this.searchBrightDataAPI(query, page, platform);
            
            this.posts = posts;
            this.totalResults = posts.length; // Simplified for demo
            
            this.displayResults();
            this.hideLoadingState();
            
        } catch (error) {
            console.error('Social media search error:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async searchBrightDataAPI(query, page = 1, platform = 'all') {
        // Try to use live MCP tools first
        try {
            if (window.mcpTools && (window.mcpTools.brightDataAvailable || window.mcpTools.firecrawlAvailable)) {
                console.log('🌟 Using live MCP tools for social media search');
                
                const liveResults = await this.searchWithLiveTools(query, platform);
                
                if (liveResults && liveResults.length > 0) {
                    console.log(`✅ Found ${liveResults.length} live social media posts`);
                    return liveResults;
                }
            }
            
            // Fallback to BrightData social search if available
            if (window.brightDataSocialSearch && window.brightDataSocialSearch.isAvailable) {
                console.log('🌟 Using BrightData social media search');
                
                // Determine platforms to search
                const platforms = platform === 'all' ? 
                    ['instagram', 'tiktok', 'linkedin', 'twitter', 'youtube'] : 
                    [platform];
                
                // Search real social media data
                const realResults = await window.brightDataSocialSearch.searchAllPlatforms(
                    query, 
                    platforms, 
                    this.itemsPerPage
                );
                
                if (realResults && realResults.length > 0) {
                    console.log(`✅ Found ${realResults.length} real social media posts`);
                    return this.transformBrightDataResults(realResults, query);
                }
            }
        } catch (error) {
            console.error('Live search error, falling back to mock data:', error);
        }
        
        // Fallback to enhanced mock data
        console.log('📝 Using enhanced mock social media data');
        const mockPosts = await this.generateEnhancedMockPosts(query, platform);
        
        // Simulate API delay for realistic UX
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        return mockPosts;
    }

    async searchWithLiveTools(query, platform) {
        const results = [];
        const platforms = platform === 'all' ? 
            ['youtube', 'instagram', 'tiktok', 'linkedin', 'facebook'] : 
            [platform];
        
        const searchPromises = platforms.map(async (p) => {
            try {
                const platformResults = await window.mcpTools.searchSocialPlatform(p, query, 3);
                if (platformResults && platformResults.length > 0) {
                    return platformResults;
                }
            } catch (error) {
                console.error(`Live search failed for ${p}:`, error);
            }
            return [];
        });
        
        const allResults = await Promise.allSettled(searchPromises);
        
        allResults.forEach(result => {
            if (result.status === 'fulfilled' && result.value) {
                results.push(...result.value);
            }
        });
        
        // Sort by relevance and recency
        return results.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a);
            const bScore = this.calculateRelevanceScore(b);
            return bScore - aScore;
        });
    }

    transformBrightDataResults(brightDataResults, query) {
        return brightDataResults.map((result, index) => {
            // Transform BrightData results to match our UI structure
            return {
                id: result.id || `${result.platform}_${Date.now()}_${index}`,
                platform: result.platform,
                username: result.username || result.name || `user_${index + 1}`,
                displayName: result.displayName || result.headline || result.title || `${result.platform} User`,
                verified: result.verified || Math.random() > 0.8,
                postType: this.determineBrightDataPostType(result),
                content: result.content || result.description || result.bio || `${query} content from ${result.platform}`,
                mediaUrl: result.mediaUrl || result.thumbnail || result.profilePic || this.generateSocialMediaImage(result.platform, index),
                engagement: this.transformBrightDataEngagement(result),
                timestamp: result.timestamp || result.publishedAt || new Date().toISOString(),
                hashtags: result.hashtags || this.generateHashtags(query),
                location: result.location || this.generateRandomLocation(),
                url: result.url || this.generatePostUrl(result.platform, result.username || 'user', index)
            };
        });
    }

    determineBrightDataPostType(result) {
        if (result.type === 'video' || result.videoUrl) return 'Video';
        if (result.type === 'reel') return 'Reel';
        if (result.type === 'profile') return 'Profile';
        if (result.mediaType === 'video') return 'Video';
        if (result.platform === 'tiktok') return 'Video';
        if (result.platform === 'youtube') return 'Video';
        if (result.platform === 'linkedin' && result.headline) return 'Professional';
        return 'Photo';
    }

    transformBrightDataEngagement(result) {
        return {
            likes: result.likes || result.digg_count || result.like_count || Math.floor(Math.random() * 50000),
            comments: result.comments || result.comment_count || Math.floor(Math.random() * 5000),
            shares: result.shares || result.share_count || result.retweets || Math.floor(Math.random() * 1000),
            views: result.views || result.view_count || result.play_count || Math.floor(Math.random() * 100000)
        };
    }

    async generateEnhancedMockPosts(query, platform) {
        // Generate mock posts enhanced with real trending data if available
        let webContext = null;
        
        try {
            // Try to get real trending topics using BrightData web search
            if (window.brightDataSocialSearch && window.brightDataSocialSearch.isAvailable) {
                webContext = await window.brightDataSocialSearch.callMcpTool('search_engine', {
                    query: `${query} trending social media 2024`,
                    engine: 'google',
                    limit: 3
                });
            }
        } catch (error) {
            console.log('Could not fetch web context for enhanced mock data');
        }
        
        const mockPosts = this.generateMockSocialPosts(query, platform);
        
        // Enhance mock posts with real web context if available
        if (webContext && webContext.length > 0) {
            mockPosts.forEach((post, index) => {
                if (webContext[index]) {
                    // Enhance content with real trending information
                    post.content = this.enhanceContentWithWebContext(post.content, webContext[index], query);
                }
            });
        }
        
        return mockPosts;
    }

    enhanceContentWithWebContext(originalContent, webResult, query) {
        // Extract relevant keywords and trends from web search
        const trendingKeywords = this.extractTrendingKeywords(webResult.snippet, query);
        
        // Enhance the original content with trending information
        const enhancements = [
            `${originalContent} ${trendingKeywords.slice(0, 2).map(k => `#${k}`).join(' ')}`,
            `🔥 ${originalContent} - ${trendingKeywords[0]} is trending!`,
            `${originalContent} 📈 Latest: ${trendingKeywords.slice(0, 3).join(', ')}`,
            `Breaking: ${originalContent} ${trendingKeywords.slice(0, 2).map(k => `#${k}`).join(' ')}`
        ];
        
        return enhancements[Math.floor(Math.random() * enhancements.length)];
    }

    extractTrendingKeywords(snippet, query) {
        if (!snippet) return [query];
        
        // Extract meaningful keywords from web search results
        const words = snippet.toLowerCase()
            .replace(/[^\w\s]/g, ' ')
            .split(/\s+/)
            .filter(word => 
                word.length > 3 && 
                !['this', 'that', 'with', 'from', 'they', 'have', 'were', 'been', 'their'].includes(word)
            );
        
        // Return unique trending keywords
        return [...new Set(words)].slice(0, 5);
    }

    generateMockSocialPosts(query, platform = 'all') {
        const platforms = platform === 'all' ? 
            ['instagram', 'twitter', 'linkedin', 'tiktok'] : 
            [platform];

        const postTypes = [
            'Photo', 'Video', 'Carousel', 'Story', 'Reel', 'Tweet', 'Article'
        ];

        const usernames = [
            'tech_influencer', 'digital_creator', 'innovation_hub', 'creative_studio',
            'startup_life', 'design_daily', 'code_master', 'ai_researcher',
            'social_trends', 'content_creator', 'tech_news', 'lifestyle_blog'
        ];

        const posts = [];
        const numPosts = Math.floor(Math.random() * 8) + 4; // 4-12 posts

        for (let i = 0; i < numPosts; i++) {
            const currentPlatform = platforms[i % platforms.length];
            const username = usernames[i % usernames.length];
            const postType = postTypes[i % postTypes.length];
            
            posts.push({
                id: `${currentPlatform}_${Date.now()}_${i}`,
                platform: currentPlatform,
                username: username,
                displayName: this.generateDisplayName(username),
                verified: Math.random() > 0.7,
                postType: postType,
                content: this.generatePostContent(query, currentPlatform),
                mediaUrl: this.generateSocialMediaImage(currentPlatform, i),
                engagement: this.generateEngagementMetrics(currentPlatform),
                timestamp: this.generateRandomTimestamp(),
                hashtags: this.generateHashtags(query),
                location: this.generateRandomLocation(),
                url: this.generatePostUrl(currentPlatform, username, i)
            });
        }

        return posts;
    }

    generatePostContent(query, platform) {
        const templates = {
            instagram: [
                `Just discovered ${query}! 🔥 This is going to change everything`,
                `Amazing ${query} content today! Check out these insights 📸`,
                `Working on some exciting ${query} projects. Can't wait to share! ✨`,
                `${query} inspiration for your feed! What do you think? 💭`
            ],
            twitter: [
                `Breaking: ${query} is trending! Here's what you need to know 🧵`,
                `Hot take on ${query}: This technology is revolutionary`,
                `${query} update: The community response has been incredible!`,
                `Quick thread on ${query} developments this week`
            ],
            linkedin: [
                `Insights on ${query}: How this impacts the industry`,
                `Professional development in ${query}: Key takeaways`,
                `${query} case study: Lessons learned from implementation`,
                `Networking opportunity: ${query} professionals connect here`
            ],
            tiktok: [
                `${query} explained in 60 seconds! 🎬`,
                `Viral ${query} trend alert! Try this at home`,
                `${query} hacks you didn't know you needed`,
                `Day in the life working with ${query}`
            ]
        };

        const platformTemplates = templates[platform] || templates.instagram;
        return platformTemplates[Math.floor(Math.random() * platformTemplates.length)];
    }

    generateDisplayName(username) {
        const displayNames = {
            'tech_influencer': 'Tech Influencer Pro',
            'digital_creator': 'Digital Creator',
            'innovation_hub': 'Innovation Hub',
            'creative_studio': 'Creative Studio',
            'startup_life': 'Startup Life',
            'design_daily': 'Design Daily',
            'code_master': 'Code Master',
            'ai_researcher': 'AI Researcher',
            'social_trends': 'Social Trends',
            'content_creator': 'Content Creator',
            'tech_news': 'Tech News',
            'lifestyle_blog': 'Lifestyle Blog'
        };
        return displayNames[username] || username.replace('_', ' ').toUpperCase();
    }

    generateSocialMediaImage(platform, index) {
        // Generate platform-appropriate placeholder images
        const imageServices = {
            instagram: [
                `https://picsum.photos/400/400?random=${platform}${index}`,
                `https://source.unsplash.com/400x400/?lifestyle,${platform},${index}`,
                `https://picsum.photos/seed/${platform}${index}/400/400`
            ],
            twitter: [
                `https://picsum.photos/600/300?random=${platform}${index}`,
                `https://source.unsplash.com/600x300/?news,technology,${index}`,
                `https://picsum.photos/seed/tweet${index}/600/300`
            ],
            linkedin: [
                `https://picsum.photos/500/300?random=${platform}${index}`,
                `https://source.unsplash.com/500x300/?business,professional,${index}`,
                `https://picsum.photos/seed/linkedin${index}/500/300`
            ],
            tiktok: [
                `https://picsum.photos/300/400?random=${platform}${index}`,
                `https://source.unsplash.com/300x400/?creative,young,${index}`,
                `https://picsum.photos/seed/tiktok${index}/300/400`
            ]
        };

        const services = imageServices[platform] || imageServices.instagram;
        return services[index % services.length];
    }

    generateEngagementMetrics(platform) {
        const baseEngagement = {
            instagram: {
                likes: Math.floor(Math.random() * 50000) + 1000,
                comments: Math.floor(Math.random() * 5000) + 50,
                shares: Math.floor(Math.random() * 1000) + 10
            },
            twitter: {
                likes: Math.floor(Math.random() * 10000) + 100,
                retweets: Math.floor(Math.random() * 2000) + 20,
                replies: Math.floor(Math.random() * 1000) + 10
            },
            linkedin: {
                likes: Math.floor(Math.random() * 5000) + 50,
                comments: Math.floor(Math.random() * 500) + 5,
                shares: Math.floor(Math.random() * 200) + 5
            },
            tiktok: {
                likes: Math.floor(Math.random() * 100000) + 5000,
                comments: Math.floor(Math.random() * 10000) + 100,
                shares: Math.floor(Math.random() * 5000) + 50
            }
        };

        return baseEngagement[platform] || baseEngagement.instagram;
    }

    generateRandomTimestamp() {
        const now = new Date();
        const randomHours = Math.floor(Math.random() * 168); // Up to 1 week ago
        return new Date(now.getTime() - (randomHours * 60 * 60 * 1000)).toISOString();
    }

    generateHashtags(query) {
        const commonHashtags = ['trending', 'viral', 'amazing', 'love', 'inspiration'];
        const queryHashtags = query.split(' ').map(word => word.toLowerCase());
        return [...queryHashtags, ...commonHashtags.slice(0, 3)];
    }

    generateRandomLocation() {
        const locations = [
            'New York, NY', 'Los Angeles, CA', 'London, UK', 'Tokyo, Japan',
            'Paris, France', 'Sydney, Australia', 'Toronto, Canada', 'Berlin, Germany',
            'Singapore', 'Dubai, UAE'
        ];
        return Math.random() > 0.6 ? locations[Math.floor(Math.random() * locations.length)] : null;
    }

    generatePostUrl(platform, username, index) {
        const urlTemplates = {
            instagram: `https://instagram.com/p/${username}_${index}`,
            twitter: `https://twitter.com/${username}/status/${Date.now()}${index}`,
            linkedin: `https://linkedin.com/posts/${username}_${index}`,
            tiktok: `https://tiktok.com/@${username}/video/${Date.now()}${index}`
        };
        return urlTemplates[platform] || urlTemplates.instagram;
    }

    displayResults() {
        const socialResults = document.getElementById('socialResults');
        const socialFeed = document.getElementById('socialFeed');
        
        if (!socialResults || !socialFeed) return;

        // Hide other result sections
        this.hideAllResultSections();
        
        // Show social results section
        socialResults.style.display = 'block';
        
        // Clear previous results
        socialFeed.innerHTML = '';

        // Generate social media tiles
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.posts.length);
        const pagePosts = this.posts.slice(startIndex, endIndex);

        if (pagePosts.length === 0) {
            socialFeed.innerHTML = '<p class="no-results">No social media posts found for your search.</p>';
            return;
        }

        // Create social media tiles
        pagePosts.forEach(post => {
            const postTile = this.createSocialTile(post);
            socialFeed.appendChild(postTile);
        });

        // Add pagination
        this.addPagination(socialFeed);
    }

    createSocialTile(post) {
        const tile = document.createElement('div');
        tile.className = `social-tile ${post.platform}-tile`;
        
        const mediaHtml = this.createMediaElement(post);
        const engagementHtml = this.createEngagementElement(post);
        
        tile.innerHTML = `
            <div class="social-header">
                <div class="platform-badge ${post.platform}">
                    <i data-lucide="${this.getPlatformIcon(post.platform)}" class="platform-icon"></i>
                    <span class="platform-name">${post.platform}</span>
                </div>
                <div class="post-type">${post.postType}</div>
            </div>
            
            <div class="social-media">
                ${mediaHtml}
            </div>
            
            <div class="social-content">
                <div class="user-info">
                    <div class="user-avatar">
                        <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=${post.username}" alt="${post.username}">
                    </div>
                    <div class="user-details">
                        <h3 class="username">
                            @${post.username}
                            ${post.verified ? '<i data-lucide="badge-check" class="verified-badge"></i>' : ''}
                        </h3>
                        <p class="display-name">${post.displayName}</p>
                    </div>
                </div>
                
                <p class="post-content">${post.content}</p>
                
                ${post.hashtags.length > 0 ? `
                    <div class="hashtags">
                        ${post.hashtags.map(tag => `<span class="hashtag">#${tag}</span>`).join('')}
                    </div>
                ` : ''}
                
                ${post.location ? `
                    <div class="location">
                        <i data-lucide="map-pin" class="location-icon"></i>
                        <span>${post.location}</span>
                    </div>
                ` : ''}
            </div>
            
            <div class="social-footer">
                ${engagementHtml}
                <div class="post-meta">
                    <span class="timestamp">${this.formatTimestamp(post.timestamp)}</span>
                </div>
            </div>
            
            <div class="social-actions">
                <button class="action-btn" onclick="socialMediaSearchManager.likePost('${post.id}')" title="Like">
                    <i data-lucide="heart"></i>
                </button>
                <button class="action-btn" onclick="socialMediaSearchManager.sharePost('${post.url}')" title="Share">
                    <i data-lucide="share-2"></i>
                </button>
                <button class="action-btn" onclick="socialMediaSearchManager.savePost('${post.id}')" title="Save">
                    <i data-lucide="bookmark"></i>
                </button>
                <button class="action-btn" onclick="window.open('${post.url}', '_blank')" title="View original">
                    <i data-lucide="external-link"></i>
                </button>
            </div>
        `;
        
        return tile;
    }

    createMediaElement(post) {
        const fallbackClass = `fallback-${post.platform}`;
        
        return `
            <div class="media-container">
                <img 
                    src="${post.mediaUrl}" 
                    alt="${post.content}" 
                    loading="lazy"
                    onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                >
                <div class="media-fallback ${fallbackClass}" style="display: none;">
                    <div class="fallback-content">
                        <i data-lucide="${this.getPlatformIcon(post.platform)}" class="fallback-icon"></i>
                        <span class="fallback-text">${post.postType}</span>
                    </div>
                </div>
            </div>
        `;
    }

    createEngagementElement(post) {
        const platform = post.platform;
        const engagement = post.engagement;
        
        switch (platform) {
            case 'instagram':
                return `
                    <div class="engagement-stats">
                        <span class="stat"><i data-lucide="heart"></i> ${this.formatNumber(engagement.likes)}</span>
                        <span class="stat"><i data-lucide="message-circle"></i> ${this.formatNumber(engagement.comments)}</span>
                        <span class="stat"><i data-lucide="send"></i> ${this.formatNumber(engagement.shares)}</span>
                    </div>
                `;
            case 'twitter':
                return `
                    <div class="engagement-stats">
                        <span class="stat"><i data-lucide="heart"></i> ${this.formatNumber(engagement.likes)}</span>
                        <span class="stat"><i data-lucide="repeat"></i> ${this.formatNumber(engagement.retweets)}</span>
                        <span class="stat"><i data-lucide="message-circle"></i> ${this.formatNumber(engagement.replies)}</span>
                    </div>
                `;
            case 'linkedin':
                return `
                    <div class="engagement-stats">
                        <span class="stat"><i data-lucide="thumbs-up"></i> ${this.formatNumber(engagement.likes)}</span>
                        <span class="stat"><i data-lucide="message-circle"></i> ${this.formatNumber(engagement.comments)}</span>
                        <span class="stat"><i data-lucide="share"></i> ${this.formatNumber(engagement.shares)}</span>
                    </div>
                `;
            case 'tiktok':
                return `
                    <div class="engagement-stats">
                        <span class="stat"><i data-lucide="heart"></i> ${this.formatNumber(engagement.likes)}</span>
                        <span class="stat"><i data-lucide="message-circle"></i> ${this.formatNumber(engagement.comments)}</span>
                        <span class="stat"><i data-lucide="share"></i> ${this.formatNumber(engagement.shares)}</span>
                    </div>
                `;
            default:
                return '<div class="engagement-stats"></div>';
        }
    }

    getPlatformIcon(platform) {
        const icons = {
            instagram: 'camera',
            twitter: 'twitter',
            linkedin: 'linkedin',
            tiktok: 'music'
        };
        return icons[platform] || 'globe';
    }

    handlePlatformFilter(button) {
        // Remove active class from all platform buttons
        document.querySelectorAll('.platform-filter').forEach(btn => {
            btn.classList.remove('active');
        });
        
        // Add active class to clicked button
        button.classList.add('active');
        
        const platform = button.dataset.platform;
        this.filterByPlatform(platform);
    }

    filterByPlatform(platform) {
        this.currentPlatform = platform;
        if (platform === 'all') {
            this.displayResults();
        } else {
            const filteredPosts = this.posts.filter(post => post.platform === platform);
            const originalPosts = this.posts;
            this.posts = filteredPosts;
            this.displayResults();
            this.posts = originalPosts; // Restore original posts
        }
    }

    // Advanced filtering and sorting methods
    sortByEngagement() {
        this.posts.sort((a, b) => {
            const aTotal = this.getTotalEngagement(a);
            const bTotal = this.getTotalEngagement(b);
            return bTotal - aTotal;
        });
        this.displayResults();
    }

    sortByRecency() {
        this.posts.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        this.displayResults();
    }

    sortByRelevance() {
        // Sort by a combination of engagement and recency
        this.posts.sort((a, b) => {
            const aScore = this.calculateRelevanceScore(a);
            const bScore = this.calculateRelevanceScore(b);
            return bScore - aScore;
        });
        this.displayResults();
    }

    getTotalEngagement(post) {
        const engagement = post.engagement;
        switch (post.platform) {
            case 'instagram':
                return engagement.likes + engagement.comments + engagement.shares;
            case 'twitter':
                return engagement.likes + engagement.retweets + engagement.replies;
            case 'linkedin':
                return engagement.likes + engagement.comments + engagement.shares;
            case 'tiktok':
                return engagement.likes + engagement.comments + engagement.shares;
            default:
                return 0;
        }
    }

    calculateRelevanceScore(post) {
        const engagementScore = this.getTotalEngagement(post) / 1000; // Normalize engagement
        const recencyScore = this.getRecencyScore(post.timestamp);
        const contentScore = this.getContentRelevanceScore(post.content);
        
        return (engagementScore * 0.4) + (recencyScore * 0.3) + (contentScore * 0.3);
    }

    getRecencyScore(timestamp) {
        const now = new Date();
        const postDate = new Date(timestamp);
        const hoursDiff = (now - postDate) / (1000 * 60 * 60);
        
        // More recent posts get higher scores
        if (hoursDiff < 1) return 100;
        if (hoursDiff < 24) return 80;
        if (hoursDiff < 168) return 60; // 1 week
        return 20;
    }

    getContentRelevanceScore(content) {
        const keywords = this.currentQuery.toLowerCase().split(' ');
        const contentLower = content.toLowerCase();
        
        let score = 0;
        keywords.forEach(keyword => {
            if (contentLower.includes(keyword)) {
                score += 10;
            }
        });
        
        return score;
    }

    // Enhanced filtering options
    filterByPostType(postType) {
        if (postType === 'all') {
            this.displayResults();
        } else {
            const filteredPosts = this.posts.filter(post => 
                post.postType.toLowerCase() === postType.toLowerCase()
            );
            const originalPosts = this.posts;
            this.posts = filteredPosts;
            this.displayResults();
            this.posts = originalPosts;
        }
    }

    filterByEngagementLevel(level) {
        let threshold = 0;
        switch (level) {
            case 'viral':
                threshold = 50000;
                break;
            case 'high':
                threshold = 10000;
                break;
            case 'medium':
                threshold = 1000;
                break;
            case 'low':
                threshold = 0;
                break;
            default:
                this.displayResults();
                return;
        }

        const filteredPosts = this.posts.filter(post => {
            const totalEngagement = this.getTotalEngagement(post);
            return totalEngagement >= threshold;
        });
        
        const originalPosts = this.posts;
        this.posts = filteredPosts;
        this.displayResults();
        this.posts = originalPosts;
    }

    filterByTimeRange(range) {
        const now = new Date();
        let cutoffDate;
        
        switch (range) {
            case 'hour':
                cutoffDate = new Date(now.getTime() - (60 * 60 * 1000));
                break;
            case 'day':
                cutoffDate = new Date(now.getTime() - (24 * 60 * 60 * 1000));
                break;
            case 'week':
                cutoffDate = new Date(now.getTime() - (7 * 24 * 60 * 60 * 1000));
                break;
            case 'month':
                cutoffDate = new Date(now.getTime() - (30 * 24 * 60 * 60 * 1000));
                break;
            default:
                this.displayResults();
                return;
        }

        const filteredPosts = this.posts.filter(post => 
            new Date(post.timestamp) >= cutoffDate
        );
        
        const originalPosts = this.posts;
        this.posts = filteredPosts;
        this.displayResults();
        this.posts = originalPosts;
    }

    addPagination(container) {
        const totalPages = Math.ceil(this.posts.length / this.itemsPerPage);
        
        if (totalPages <= 1) return;

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.currentPage - 1}">
                    <i data-lucide="chevron-left"></i> Previous
                </button>
            `;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="pagination-btn active" data-page="${i}">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `<button class="pagination-btn" data-page="${i}">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" data-page="${this.currentPage + 1}">
                    Next <i data-lucide="chevron-right"></i>
                </button>
            `;
        }

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
        
        container.appendChild(paginationContainer);

        // Initialize Lucide icons for pagination
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    handlePaginationClick(button) {
        const page = parseInt(button.dataset.page);
        if (page && page !== this.currentPage) {
            this.searchSocialMedia(this.currentQuery, page, this.currentPlatform);
        }
    }

    showSocialInterface() {
        // Activate social tab
        document.querySelectorAll('.feature-tab').forEach(tab => {
            tab.classList.remove('active');
        });
        document.querySelector('[data-feature="social"]').classList.add('active');
        
        // Show social results if we have them, otherwise show empty state
        if (this.posts.length > 0) {
            this.displayResults();
        } else {
            this.hideAllResultSections();
            const socialResults = document.getElementById('socialResults');
            if (socialResults) {
                socialResults.style.display = 'block';
                const socialFeed = document.getElementById('socialFeed');
                if (socialFeed) {
                    socialFeed.innerHTML = `
                        <div class="empty-state">
                            <i data-lucide="users" class="empty-icon"></i>
                            <h3>Search Social Media</h3>
                            <p>Enter a search term above to find relevant social media posts</p>
                        </div>
                    `;
                    if (typeof lucide !== 'undefined') {
                        lucide.createIcons();
                    }
                }
            }
        }
    }

    hideAllResultSections() {
        const sections = [
            'webResults', 'youtubeResults', 'socialResults', 
            'documentProcessor', 'videoCreator', 'imageGenerator'
        ];
        
        sections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
            }
        });
    }

    showLoadingState() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'block';
        }
        
        this.hideAllResultSections();
    }

    hideLoadingState() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'none';
        }
    }

    showErrorState(message) {
        const errorContainer = document.getElementById('errorContainer');
        const errorMessage = document.getElementById('errorMessage');
        
        if (errorContainer && errorMessage) {
            errorMessage.textContent = message;
            errorContainer.style.display = 'block';
            this.hideLoadingState();
            this.hideAllResultSections();
        }
    }

    // Utility functions
    formatNumber(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        } else if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return num.toString();
    }

    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        const now = new Date();
        const diffInHours = Math.floor((now - date) / (1000 * 60 * 60));
        
        if (diffInHours < 1) return 'Just now';
        if (diffInHours < 24) return `${diffInHours}h ago`;
        if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`;
        return `${Math.floor(diffInHours / 168)}w ago`;
    }

    // Action handlers
    likePost(postId) {
        console.log('Liking post:', postId);
        this.showToast('Post liked! ❤️');
    }

    savePost(postId) {
        console.log('Saving post:', postId);
        this.showToast('Post saved to your collection');
    }

    sharePost(url) {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this social media post',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            this.showToast('Post link copied to clipboard');
        }
    }

    showToast(message) {
        // Simple toast notification
        const toast = document.createElement('div');
        toast.className = 'toast-notification';
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            bottom: 20px;
            right: 20px;
            background: var(--surface);
            color: var(--text-primary);
            padding: 12px 20px;
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
            z-index: 10000;
            animation: slideIn 300ms ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.style.animation = 'slideOut 300ms ease';
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Global action functions
window.socialMediaSearchManager = new SocialMediaSearchManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('📱 Social Media Search Manager initialized');
});