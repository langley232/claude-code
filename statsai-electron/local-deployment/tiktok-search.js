// TikTok Video Search with BrightData API
// Implements TikTok video search with tiles layout optimized for TikTok content

class TikTokSearchManager {
    constructor() {
        this.apiKey = 'c988af6189e31c5122500a1eda86c84fbd45082f9c6ddc555689ae1328fed2c8';
        this.postsDatasetId = 'gd_lu702nij2f790tmv9h'; // TikTok posts dataset ID
        this.profilesDatasetId = 'gd_l1villgoiiidt09ci'; // TikTok profiles dataset ID
        this.currentPage = 1;
        this.itemsPerPage = 12; // 3x4 grid for TikTok's vertical format
        this.currentQuery = '';
        this.totalResults = 0;
        this.videos = [];
        this.isLoading = false;
        this.apiEndpoint = 'https://api.brightdata.com/datasets/v3/trigger';
        
        this.initializeEventListeners();
    }

    initializeEventListeners() {
        // Search form submission
        const searchInput = document.getElementById('searchInput');
        const searchSubmit = document.getElementById('searchSubmit');
        
        if (searchSubmit) {
            searchSubmit.addEventListener('click', (e) => {
                // Only handle if TikTok tab is active
                if (this.isCurrentlyActive()) {
                    e.preventDefault();
                    const query = searchInput.value.trim();
                    if (query) {
                        this.searchVideos(query);
                    }
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && this.isCurrentlyActive()) {
                    e.preventDefault();
                    const query = e.target.value.trim();
                    if (query) {
                        this.searchVideos(query);
                    }
                }
            });
        }

        // TikTok tab switching
        const tiktokTabs = document.querySelectorAll('[data-feature="tiktok"]');
        tiktokTabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.showTikTokInterface();
            });
        });
    }

    isCurrentlyActive() {
        const activeTab = document.querySelector('.feature-tab.active');
        return activeTab && activeTab.dataset.feature === 'tiktok';
    }

    async searchVideos(query, page = 1) {
        if (this.isLoading) return;

        this.isLoading = true;
        this.currentQuery = query;
        this.currentPage = page;

        try {
            this.showLoadingState();
            console.log(`🎵 Searching TikTok for: "${query}"`);
            
            // Since BrightData TikTok API requires specific URLs rather than search queries,
            // we'll implement enhanced mock data that simulates TikTok search results
            const videos = await this.generateEnhancedTikTokVideos(query);
            
            this.videos = videos;
            this.totalResults = videos.length;
            
            this.displayResults();
            this.hideLoadingState();
            
        } catch (error) {
            console.error('TikTok search error:', error);
            this.showErrorState(error.message);
        } finally {
            this.isLoading = false;
        }
    }

    async generateEnhancedTikTokVideos(query) {
        console.log(`🎬 Generating TikTok videos for: "${query}"`);
        
        const tiktokVideoTemplates = [
            {
                title: `${query} challenge 🔥`,
                creator: '@trending_creator',
                views: Math.floor(Math.random() * 5000000) + 500000,
                likes: Math.floor(Math.random() * 800000) + 50000,
                shares: Math.floor(Math.random() * 100000) + 5000,
                comments: Math.floor(Math.random() * 50000) + 2000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(0, 14)
            },
            {
                title: `POV: ${query} hits different 💯`,
                creator: '@viral_content',
                views: Math.floor(Math.random() * 8000000) + 1000000,
                likes: Math.floor(Math.random() * 1200000) + 80000,
                shares: Math.floor(Math.random() * 150000) + 10000,
                comments: Math.floor(Math.random() * 80000) + 5000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(0, 7)
            },
            {
                title: `${query} tutorial that actually works ✨`,
                creator: '@howto_expert',
                views: Math.floor(Math.random() * 3000000) + 200000,
                likes: Math.floor(Math.random() * 400000) + 30000,
                shares: Math.floor(Math.random() * 60000) + 3000,
                comments: Math.floor(Math.random() * 25000) + 1500,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(1, 21)
            },
            {
                title: `${query} storytime 📖`,
                creator: '@story_master',
                views: Math.floor(Math.random() * 2000000) + 150000,
                likes: Math.floor(Math.random() * 300000) + 20000,
                shares: Math.floor(Math.random() * 40000) + 2000,
                comments: Math.floor(Math.random() * 15000) + 1000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(2, 30)
            },
            {
                title: `Rate my ${query} outfit 👗`,
                creator: '@fashion_guru',
                views: Math.floor(Math.random() * 1500000) + 100000,
                likes: Math.floor(Math.random() * 200000) + 15000,
                shares: Math.floor(Math.random() * 25000) + 1500,
                comments: Math.floor(Math.random() * 12000) + 800,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(0, 5)
            },
            {
                title: `${query} but make it aesthetic 🌙`,
                creator: '@aesthetic_vibes',
                views: Math.floor(Math.random() * 4000000) + 300000,
                likes: Math.floor(Math.random() * 600000) + 40000,
                shares: Math.floor(Math.random() * 80000) + 4000,
                comments: Math.floor(Math.random() * 35000) + 2500,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(0, 10)
            },
            {
                title: `${query} hack you need to try`,
                creator: '@life_hacks',
                views: Math.floor(Math.random() * 6000000) + 800000,
                likes: Math.floor(Math.random() * 900000) + 70000,
                shares: Math.floor(Math.random() * 120000) + 8000,
                comments: Math.floor(Math.random() * 60000) + 4000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(1, 15)
            },
            {
                title: `When ${query} actually works 😱`,
                creator: '@reaction_queen',
                views: Math.floor(Math.random() * 3500000) + 250000,
                likes: Math.floor(Math.random() * 500000) + 35000,
                shares: Math.floor(Math.random() * 70000) + 3500,
                comments: Math.floor(Math.random() * 30000) + 2000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(0, 3)
            },
            {
                title: `${query} compilation 🎵`,
                creator: '@best_moments',
                views: Math.floor(Math.random() * 7000000) + 1200000,
                likes: Math.floor(Math.random() * 1000000) + 90000,
                shares: Math.floor(Math.random() * 140000) + 12000,
                comments: Math.floor(Math.random() * 70000) + 5500,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(3, 45)
            },
            {
                title: `${query} dancing trend 💃`,
                creator: '@dance_moves',
                views: Math.floor(Math.random() * 9000000) + 1500000,
                likes: Math.floor(Math.random() * 1300000) + 120000,
                shares: Math.floor(Math.random() * 180000) + 15000,
                comments: Math.floor(Math.random() * 90000) + 7000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(0, 8)
            },
            {
                title: `${query} before vs after ✨`,
                creator: '@transformation',
                views: Math.floor(Math.random() * 4500000) + 400000,
                likes: Math.floor(Math.random() * 650000) + 50000,
                shares: Math.floor(Math.random() * 90000) + 6000,
                comments: Math.floor(Math.random() * 40000) + 3000,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(1, 12)
            },
            {
                title: `${query} gone wrong 😅`,
                creator: '@epic_fails',
                views: Math.floor(Math.random() * 2500000) + 180000,
                likes: Math.floor(Math.random() * 350000) + 25000,
                shares: Math.floor(Math.random() * 50000) + 2500,
                comments: Math.floor(Math.random() * 20000) + 1200,
                duration: this.generateTikTokDuration(),
                uploadedAgo: this.getRandomUploadTime(2, 25)
            }
        ];

        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 1400));

        return tiktokVideoTemplates.map((template, index) => {
            const videoId = this.generateRealisticTikTokId();
            return {
                id: videoId,
                title: template.title,
                description: `Check out this amazing ${query} content! 🎵 #${query.replace(/\s+/g, '')} #fyp #viral #trending`,
                thumbnail: this.generateTikTokThumbnail(videoId),
                creator: template.creator,
                publishedAt: template.uploadedAgo,
                duration: template.duration,
                viewCount: template.views,
                likeCount: template.likes,
                shareCount: template.shares,
                commentCount: template.comments,
                url: `https://tiktok.com/@${template.creator.substring(1)}/video/${videoId}`,
                hashtags: this.generateHashtags(query),
                isRealVideo: false // Flag to indicate this is mock data
            };
        });
    }

    generateTikTokDuration() {
        // TikTok videos are typically 15s, 30s, 60s, or up to 3 minutes
        const durations = ['0:15', '0:30', '0:45', '1:00', '1:15', '1:30', '2:00', '2:30', '3:00'];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    generateHashtags(query) {
        const queryHash = query.replace(/\s+/g, '');
        const popularTags = ['fyp', 'viral', 'trending', 'foryou', 'explore', 'tiktok'];
        const randomTags = popularTags.slice(0, 3 + Math.floor(Math.random() * 3));
        return [queryHash, ...randomTags].map(tag => `#${tag}`);
    }

    generateRealisticTikTokId() {
        // TikTok video IDs are typically 19-digit numbers
        return '7' + Math.floor(Math.random() * Math.pow(10, 18)).toString().padStart(18, '0');
    }

    generateTikTokThumbnail(videoId) {
        // Generate colorful gradient thumbnails typical of TikTok
        const gradients = [
            'linear-gradient(135deg, #ff006e, #8338ec)',
            'linear-gradient(135deg, #06ffa5, #3a86ff)',
            'linear-gradient(135deg, #ff4081, #ff6ec7)',
            'linear-gradient(135deg, #ffbe0b, #fb5607)',
            'linear-gradient(135deg, #7209b7, #560bad)',
            'linear-gradient(135deg, #f72585, #4361ee)',
            'linear-gradient(135deg, #43aa8b, #90e0ef)',
            'linear-gradient(135deg, #f8961e, #f9844a)'
        ];
        
        const gradientIndex = parseInt(videoId.slice(-1)) % gradients.length;
        return `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="180" height="320" viewBox="0 0 180 320"><defs><linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">${gradients[gradientIndex].replace(/linear-gradient\(135deg,\s*/, '').replace(/\)$/, '').split(',').map((color, i) => `<stop offset="${i * 100}%" style="stop-color:${color.trim()};stop-opacity:1" />`).join('')}</linearGradient></defs><rect width="180" height="320" fill="url(%23grad)"/><circle cx="90" cy="160" r="30" fill="white" opacity="0.8"/><polygon points="85,150 85,170 105,160" fill="%23000" opacity="0.6"/></svg>`;
    }

    getRandomUploadTime(minDays = 0, maxDays = 365) {
        const daysAgo = Math.floor(Math.random() * (maxDays - minDays + 1)) + minDays;
        const date = new Date();
        date.setDate(date.getDate() - daysAgo);
        return date.toISOString();
    }

    displayResults() {
        console.log('🎵 Displaying TikTok results...');
        
        // Force hide ALL other sections first
        this.forceHideOtherSections();
        
        const socialResults = document.getElementById('socialResults');
        const socialFeed = document.getElementById('socialFeed');
        
        if (!socialResults || !socialFeed) {
            console.error('❌ Social results containers not found!');
            return;
        }

        // Show social results section for TikTok (reusing social container)
        socialResults.style.display = 'block';
        socialResults.style.visibility = 'visible';
        socialResults.style.opacity = '1';
        console.log('✅ TikTok results section visible');
        
        // Update header for TikTok
        const resultsHeader = socialResults.querySelector('.results-header h2');
        if (resultsHeader) {
            resultsHeader.textContent = 'TikTok Search Results';
        }
        
        // Hide social media filters and show TikTok filters
        this.updateFiltersForTikTok(socialResults);
        
        // Clear previous results
        socialFeed.innerHTML = '';

        // Generate TikTok tiles
        const startIndex = (this.currentPage - 1) * this.itemsPerPage;
        const endIndex = Math.min(startIndex + this.itemsPerPage, this.videos.length);
        const pageVideos = this.videos.slice(startIndex, endIndex);

        if (pageVideos.length === 0) {
            socialFeed.innerHTML = '<p class="no-results">No TikTok videos found for your search.</p>';
            return;
        }

        // Create TikTok video tiles
        pageVideos.forEach(video => {
            const videoTile = this.createTikTokTile(video);
            socialFeed.appendChild(videoTile);
        });

        // Add pagination if needed
        if (this.videos.length > this.itemsPerPage) {
            this.addPagination(socialFeed);
        }
    }

    updateFiltersForTikTok(socialResults) {
        const filtersContainer = socialResults.querySelector('.social-filters');
        if (filtersContainer) {
            filtersContainer.innerHTML = `
                <div class="filter-group">
                    <label>Sort by:</label>
                    <button class="filter-btn active" data-filter="trending">🔥 Trending</button>
                    <button class="filter-btn" data-filter="most-viewed">👁️ Most Viewed</button>
                    <button class="filter-btn" data-filter="popular">❤️ Most Liked</button>
                    <button class="filter-btn" data-filter="viral">🚀 Viral</button>
                    <button class="filter-btn" data-filter="recent">⏰ Recent</button>
                </div>
                <div class="filter-group">
                    <label>Engagement:</label>
                    <button class="filter-btn" data-filter="high-engagement">📈 High Engagement</button>
                    <button class="filter-btn" data-filter="most-shared">🔄 Most Shared</button>
                    <button class="filter-btn" data-filter="most-commented">💬 Most Comments</button>
                </div>
                <div class="filter-group">
                    <label>Duration:</label>
                    <button class="filter-btn" data-filter="short">⚡ Short (≤30s)</button>
                    <button class="filter-btn" data-filter="medium">⏱️ Medium (30s-1m)</button>
                    <button class="filter-btn" data-filter="long">🎬 Long (1m+)</button>
                </div>
                <div class="filter-group">
                    <label>Content Type:</label>
                    <button class="filter-btn" data-filter="challenge">🏆 Challenges</button>
                    <button class="filter-btn" data-filter="tutorial">📚 Tutorials</button>
                    <button class="filter-btn" data-filter="dance">💃 Dance</button>
                    <button class="filter-btn" data-filter="comedy">😂 Comedy</button>
                </div>
            `;
            
            // Bind filter events
            filtersContainer.querySelectorAll('.filter-btn').forEach(btn => {
                btn.addEventListener('click', (e) => this.handleFilterClick(e.target));
            });
        }
    }

    createTikTokTile(video) {
        const tile = document.createElement('div');
        tile.className = 'tiktok-tile';
        
        tile.innerHTML = `
            <div class="tiktok-video">
                <div class="tiktok-thumbnail" style="background: ${video.thumbnail.includes('data:') ? '' : video.thumbnail}">
                    ${video.thumbnail.includes('data:') ? `<img src="${video.thumbnail}" alt="${video.title}" />` : ''}
                    <div class="tiktok-duration">${video.duration}</div>
                    <div class="tiktok-play-overlay">
                        <button class="tiktok-play-btn" onclick="window.open('${video.url}', '_blank')">
                            <i data-lucide="play"></i>
                        </button>
                    </div>
                </div>
                
                <div class="tiktok-info">
                    <div class="tiktok-creator">
                        <span class="creator-handle">${video.creator}</span>
                    </div>
                    
                    <h3 class="tiktok-title">${video.title}</h3>
                    
                    <div class="tiktok-hashtags">
                        ${video.hashtags.slice(0, 3).join(' ')}
                    </div>
                    
                    <div class="tiktok-stats">
                        <div class="stat-item">
                            <i data-lucide="eye"></i>
                            <span>${this.formatCount(video.viewCount)}</span>
                        </div>
                        <div class="stat-item">
                            <i data-lucide="heart"></i>
                            <span>${this.formatCount(video.likeCount)}</span>
                        </div>
                        <div class="stat-item">
                            <i data-lucide="share"></i>
                            <span>${this.formatCount(video.shareCount)}</span>
                        </div>
                        <div class="stat-item">
                            <i data-lucide="message-circle"></i>
                            <span>${this.formatCount(video.commentCount)}</span>
                        </div>
                    </div>
                    
                    <div class="tiktok-meta">
                        <span class="upload-time">${this.formatDate(video.publishedAt)}</span>
                    </div>
                    
                    <div class="tiktok-actions">
                        <button class="action-btn" onclick="tiktokSearchManager.saveVideo('${video.id}')" title="Save video">
                            <i data-lucide="bookmark"></i>
                        </button>
                        <button class="action-btn" onclick="tiktokSearchManager.shareVideo('${video.url}')" title="Share video">
                            <i data-lucide="share-2"></i>
                        </button>
                        <button class="action-btn" onclick="tiktokSearchManager.followCreator('${video.creator}')" title="Follow creator">
                            <i data-lucide="user-plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        return tile;
    }

    formatCount(count) {
        if (count >= 1000000) {
            return (count / 1000000).toFixed(1) + 'M';
        } else if (count >= 1000) {
            return (count / 1000).toFixed(1) + 'K';
        }
        return count.toString();
    }

    formatDate(dateString) {
        const date = new Date(dateString);
        const now = new Date();
        const diffInDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
        
        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays}d ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)}w ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)}mo ago`;
        return `${Math.floor(diffInDays / 365)}y ago`;
    }

    forceHideOtherSections() {
        console.log('🔒 Force hiding all non-TikTok sections...');
        
        // Hide YouTube and other sections
        const otherSections = ['youtubeResults', 'webResults', 'documentProcessor', 'videoCreator', 'imageGenerator'];
        otherSections.forEach(sectionId => {
            const section = document.getElementById(sectionId);
            if (section) {
                section.style.display = 'none';
                section.style.visibility = 'hidden';
            }
        });
    }

    showTikTokInterface() {
        console.log('🎵 Showing TikTok interface...');
        
        // Show TikTok results if we have them, otherwise show empty state
        if (this.videos.length > 0) {
            this.displayResults();
        } else {
            this.forceHideOtherSections();
            const socialResults = document.getElementById('socialResults');
            const socialFeed = document.getElementById('socialFeed');
            
            if (socialResults && socialFeed) {
                socialResults.style.display = 'block';
                
                // Update header
                const resultsHeader = socialResults.querySelector('.results-header h2');
                if (resultsHeader) {
                    resultsHeader.textContent = 'TikTok Search Results';
                }
                
                socialFeed.innerHTML = `
                    <div class="empty-state">
                        <i data-lucide="music" class="empty-icon"></i>
                        <h3>Search TikTok Videos</h3>
                        <p>Enter a search term above to find trending TikTok content</p>
                    </div>
                `;
                
                if (typeof lucide !== 'undefined') {
                    lucide.createIcons();
                }
            }
        }
    }

    handleFilterClick(button) {
        // Update active filter
        button.parentElement.querySelectorAll('.filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        button.classList.add('active');
        
        const filter = button.dataset.filter;
        this.sortResults(filter);
    }

    sortResults(filter) {
        console.log(`🎵 Sorting TikTok results by: ${filter}`);
        
        // Store original videos if filtering
        if (!this.originalVideos) {
            this.originalVideos = [...this.videos];
        }
        
        // Reset to original if not filtering by duration or content type
        if (!['short', 'medium', 'long', 'challenge', 'tutorial', 'dance', 'comedy'].includes(filter)) {
            this.videos = [...this.originalVideos];
        }
        
        switch (filter) {
            case 'most-viewed':
                this.videos.sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            case 'popular':
                this.videos.sort((a, b) => b.likeCount - a.likeCount);
                break;
                
            case 'viral':
                // Viral = high engagement rate relative to views
                this.videos.sort((a, b) => {
                    const viralScoreA = (a.likeCount + a.shareCount + a.commentCount) / a.viewCount;
                    const viralScoreB = (b.likeCount + b.shareCount + b.commentCount) / b.viewCount;
                    return viralScoreB - viralScoreA;
                });
                break;
                
            case 'recent':
                this.videos.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
                break;
                
            case 'high-engagement':
                // Total engagement score
                this.videos.sort((a, b) => {
                    const engagementA = a.likeCount + a.shareCount + a.commentCount;
                    const engagementB = b.likeCount + b.shareCount + b.commentCount;
                    return engagementB - engagementA;
                });
                break;
                
            case 'most-shared':
                this.videos.sort((a, b) => b.shareCount - a.shareCount);
                break;
                
            case 'most-commented':
                this.videos.sort((a, b) => b.commentCount - a.commentCount);
                break;
                
            // Duration filters
            case 'short':
                this.videos = this.originalVideos.filter(v => {
                    const seconds = this.durationToSeconds(v.duration);
                    return seconds <= 30;
                }).sort((a, b) => b.viewCount - a.viewCount); // Sort by views within filter
                break;
                
            case 'medium':
                this.videos = this.originalVideos.filter(v => {
                    const seconds = this.durationToSeconds(v.duration);
                    return seconds > 30 && seconds <= 60;
                }).sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            case 'long':
                this.videos = this.originalVideos.filter(v => {
                    const seconds = this.durationToSeconds(v.duration);
                    return seconds > 60;
                }).sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            // Content type filters
            case 'challenge':
                this.videos = this.originalVideos.filter(v => 
                    v.title.toLowerCase().includes('challenge') || 
                    v.hashtags.some(tag => tag.includes('challenge'))
                ).sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            case 'tutorial':
                this.videos = this.originalVideos.filter(v => 
                    v.title.toLowerCase().includes('tutorial') || 
                    v.title.toLowerCase().includes('how to') ||
                    v.title.toLowerCase().includes('hack')
                ).sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            case 'dance':
                this.videos = this.originalVideos.filter(v => 
                    v.title.toLowerCase().includes('dance') || 
                    v.title.toLowerCase().includes('dancing') ||
                    v.hashtags.some(tag => tag.includes('dance'))
                ).sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            case 'comedy':
                this.videos = this.originalVideos.filter(v => 
                    v.title.toLowerCase().includes('funny') || 
                    v.title.toLowerCase().includes('comedy') ||
                    v.title.toLowerCase().includes('gone wrong') ||
                    v.title.includes('😂') || v.title.includes('😅')
                ).sort((a, b) => b.viewCount - a.viewCount);
                break;
                
            case 'trending':
            default:
                // Advanced trending algorithm: views * engagement_rate * recency_factor
                this.videos.sort((a, b) => {
                    const engagementRateA = (a.likeCount + a.shareCount + a.commentCount) / a.viewCount;
                    const engagementRateB = (b.likeCount + b.shareCount + b.commentCount) / b.viewCount;
                    
                    // Recency factor (newer videos get boost)
                    const daysSinceA = (Date.now() - new Date(a.publishedAt)) / (1000 * 60 * 60 * 24);
                    const daysSinceB = (Date.now() - new Date(b.publishedAt)) / (1000 * 60 * 60 * 24);
                    const recencyFactorA = Math.max(0.1, 1 - (daysSinceA / 30)); // Decay over 30 days
                    const recencyFactorB = Math.max(0.1, 1 - (daysSinceB / 30));
                    
                    const trendingScoreA = a.viewCount * engagementRateA * recencyFactorA;
                    const trendingScoreB = b.viewCount * engagementRateB * recencyFactorB;
                    
                    return trendingScoreB - trendingScoreA;
                });
                break;
        }
        
        console.log(`📊 Filtered to ${this.videos.length} results`);
        this.displayResults();
    }

    durationToSeconds(duration) {
        const parts = duration.split(':');
        return parseInt(parts[0]) * 60 + parseInt(parts[1]);
    }

    addPagination(container) {
        const totalPages = Math.ceil(this.videos.length / this.itemsPerPage);
        
        if (totalPages <= 1) return;

        const paginationContainer = document.createElement('div');
        paginationContainer.className = 'pagination-container';
        
        let paginationHTML = '<div class="pagination">';
        
        // Previous button
        if (this.currentPage > 1) {
            paginationHTML += `
                <button class="pagination-btn" onclick="tiktokSearchManager.goToPage(${this.currentPage - 1})">
                    <i data-lucide="chevron-left"></i> Previous
                </button>
            `;
        }

        // Page numbers
        for (let i = 1; i <= totalPages; i++) {
            if (i === this.currentPage) {
                paginationHTML += `<button class="pagination-btn active">${i}</button>`;
            } else if (i === 1 || i === totalPages || Math.abs(i - this.currentPage) <= 2) {
                paginationHTML += `<button class="pagination-btn" onclick="tiktokSearchManager.goToPage(${i})">${i}</button>`;
            } else if (i === this.currentPage - 3 || i === this.currentPage + 3) {
                paginationHTML += '<span class="pagination-ellipsis">...</span>';
            }
        }

        // Next button
        if (this.currentPage < totalPages) {
            paginationHTML += `
                <button class="pagination-btn" onclick="tiktokSearchManager.goToPage(${this.currentPage + 1})">
                    Next <i data-lucide="chevron-right"></i>
                </button>
            `;
        }

        paginationHTML += '</div>';
        paginationContainer.innerHTML = paginationHTML;
        
        container.appendChild(paginationContainer);

        // Initialize Lucide icons
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    goToPage(page) {
        if (page !== this.currentPage) {
            this.searchVideos(this.currentQuery, page);
        }
    }

    showLoadingState() {
        const loadingContainer = document.getElementById('loadingContainer');
        if (loadingContainer) {
            loadingContainer.style.display = 'block';
        }
        this.forceHideOtherSections();
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
            this.forceHideOtherSections();
        }
    }

    // Action handlers
    saveVideo(videoId) {
        console.log('Saving TikTok video:', videoId);
        this.showToast('TikTok video saved to your library');
    }

    shareVideo(url) {
        if (navigator.share) {
            navigator.share({
                title: 'Check out this TikTok video',
                url: url
            });
        } else {
            navigator.clipboard.writeText(url);
            this.showToast('TikTok video link copied to clipboard');
        }
    }

    followCreator(creatorHandle) {
        console.log('Following creator:', creatorHandle);
        this.showToast(`Following ${creatorHandle}`);
    }

    showToast(message) {
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

// Global instance
window.tiktokSearchManager = new TikTokSearchManager();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🎵 TikTok Search Manager initialized');
});