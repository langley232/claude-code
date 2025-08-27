// Simple routing system for AtlasWeb AI Dashboard
// Handles feature navigation and integration with existing pages

class DashboardRouter {
    constructor() {
        this.routes = {
            'search': {
                title: 'AI Search Engine',
                component: 'SearchInterface',
                requiresAuth: true
            },
            'email': {
                title: 'Email Assistant',
                url: 'email-assistant.html',
                component: 'EmailInterface',
                requiresAuth: true
            },
            'specialized-search': {
                title: 'Specialized Search',
                url: 'specialized-search.html',
                component: 'SpecializedSearchInterface',
                requiresAuth: true,
                requiresTier: 'pro'
            },
            'bookmarks': {
                title: 'Smart Bookmarks',
                component: 'BookmarksInterface',
                requiresAuth: true
            },
            'automation': {
                title: 'Web Automation',
                component: 'AutomationInterface',
                requiresAuth: true,
                requiresTier: 'max'
            },
            'website-builder': {
                title: 'Website Builder',
                component: 'WebsiteBuilderInterface',
                requiresAuth: true,
                requiresTier: 'max'
            }
        };
        
        this.currentRoute = 'search';
        this.userTier = 'basic'; // Will be updated from user data
    }

    init(userTier = 'basic') {
        this.userTier = userTier.toLowerCase();
        this.setupRouteHandlers();
    }

    setupRouteHandlers() {
        // Handle feature button clicks
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const feature = e.currentTarget.dataset.feature;
                this.navigateToFeature(feature);
            });
        });

        // Handle back button
        window.addEventListener('popstate', (e) => {
            if (e.state && e.state.feature) {
                this.loadFeature(e.state.feature);
            }
        });
    }

    navigateToFeature(featureName) {
        const route = this.routes[featureName];
        
        if (!route) {
            console.warn(`Route ${featureName} not found`);
            return;
        }

        // Check authentication
        if (route.requiresAuth && !this.isAuthenticated()) {
            window.location.href = '/index.html';
            return;
        }

        // Check tier requirements
        if (route.requiresTier && !this.hasRequiredTier(route.requiresTier)) {
            this.showUpgradePrompt(featureName, route.requiresTier);
            return;
        }

        // Handle external URLs (open in new tab)
        if (route.url) {
            window.open(route.url, '_blank');
            return;
        }

        // Load internal component
        this.loadFeature(featureName);
        
        // Update URL without page reload
        history.pushState({ feature: featureName }, route.title, `#${featureName}`);
        
        // Update page title
        document.title = `AtlasWeb AI - ${route.title}`;
    }

    loadFeature(featureName) {
        // Update active button state
        document.querySelectorAll('.feature-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[data-feature="${featureName}"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // Load feature content
        const middlePanel = document.querySelector('.middle-panel');
        if (middlePanel) {
            this.renderFeatureContent(featureName, middlePanel);
        }

        this.currentRoute = featureName;
    }

    renderFeatureContent(featureName, container) {
        const route = this.routes[featureName];
        
        switch (featureName) {
            case 'search':
                this.renderSearchInterface(container);
                break;
            case 'email':
                this.renderEmailInterface(container);
                break;
            case 'specialized-search':
                this.renderSpecializedSearchInterface(container);
                break;
            case 'bookmarks':
                this.renderBookmarksInterface(container);
                break;
            case 'automation':
                this.renderAutomationInterface(container);
                break;
            case 'website-builder':
                this.renderWebsiteBuilderInterface(container);
                break;
            default:
                this.renderNotFound(container);
        }
    }

    renderSearchInterface(container) {
        // Default search interface is already loaded
        const searchContainer = container.querySelector('.search-container');
        if (searchContainer) {
            searchContainer.style.display = 'flex';
        }
    }

    renderEmailInterface(container) {
        container.innerHTML = `
            <div class="feature-interface email-interface">
                <div class="feature-header">
                    <h2 class="feature-title">
                        <i data-lucide="mail"></i>
                        Email Assistant
                    </h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn" onclick="window.open('email-assistant.html', '_blank')">
                            <i data-lucide="external-link"></i>
                            Open Full Client
                        </button>
                    </div>
                </div>
                
                <div class="email-preview">
                    <div class="integration-card">
                        <div class="integration-icon">
                            <i data-lucide="mail-open"></i>
                        </div>
                        <div class="integration-content">
                            <h3>Email Assistant Integration</h3>
                            <p>Your AI-powered email management system is ready. Click below to access the full email experience with smart summaries, AI composition, and advanced organization.</p>
                            <div class="email-stats-mini">
                                <div class="stat-mini">
                                    <span class="stat-number">12</span>
                                    <span class="stat-label">Unread</span>
                                </div>
                                <div class="stat-mini">
                                    <span class="stat-number">3</span>
                                    <span class="stat-label">Priority</span>
                                </div>
                                <div class="stat-mini">
                                    <span class="stat-number">95%</span>
                                    <span class="stat-label">Processed</span>
                                </div>
                            </div>
                            <button class="integration-btn" onclick="window.open('email-assistant.html', '_blank')">
                                Launch Email Assistant
                                <i data-lucide="arrow-right"></i>
                            </button>
                        </div>
                    </div>
                    
                    <div class="quick-email-actions">
                        <div class="quick-action-grid">
                            <button class="quick-action-card mini" onclick="window.open('email-assistant.html#compose', '_blank')">
                                <i data-lucide="pen-tool"></i>
                                <span>Compose</span>
                            </button>
                            <button class="quick-action-card mini" onclick="window.open('email-assistant.html#templates', '_blank')">
                                <i data-lucide="template"></i>
                                <span>Templates</span>
                            </button>
                            <button class="quick-action-card mini" onclick="window.open('email-assistant.html#analytics', '_blank')">
                                <i data-lucide="bar-chart"></i>
                                <span>Analytics</span>
                            </button>
                            <button class="quick-action-card mini" onclick="window.open('email-assistant.html#settings', '_blank')">
                                <i data-lucide="settings"></i>
                                <span>Settings</span>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderSpecializedSearchInterface(container) {
        container.innerHTML = `
            <div class="feature-interface specialized-search-interface">
                <div class="feature-header">
                    <h2 class="feature-title">
                        <i data-lucide="target"></i>
                        Specialized Search
                        <span class="tier-badge-small pro">Pro</span>
                    </h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn" onclick="window.open('specialized-search.html', '_blank')">
                            <i data-lucide="external-link"></i>
                            Open Full Search
                        </button>
                    </div>
                </div>
                
                <div class="specialized-search-grid">
                    <div class="search-category-card" onclick="window.open('specialized-search.html#youtube', '_blank')">
                        <div class="category-icon youtube">
                            <i data-lucide="video"></i>
                        </div>
                        <div class="category-content">
                            <h3>YouTube Search</h3>
                            <p>Advanced video content search with transcript analysis and content insights</p>
                            <div class="category-stats">
                                <span class="stat">1M+ videos indexed</span>
                                <span class="stat">Real-time results</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="search-category-card" onclick="window.open('specialized-search.html#social', '_blank')">
                        <div class="category-icon social">
                            <i data-lucide="users"></i>
                        </div>
                        <div class="category-content">
                            <h3>Social Media Search</h3>
                            <p>Search across Facebook, Instagram, LinkedIn, and TikTok platforms</p>
                            <div class="category-stats">
                                <span class="stat">Multi-platform</span>
                                <span class="stat">Trend analysis</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="search-category-card" onclick="window.open('specialized-search.html#government', '_blank')">
                        <div class="category-icon government">
                            <i data-lucide="landmark"></i>
                        </div>
                        <div class="category-content">
                            <h3>Government & Legal</h3>
                            <p>Jurisdiction-specific search for government clients and legal research</p>
                            <div class="category-stats">
                                <span class="stat">Legal databases</span>
                                <span class="stat">Compliance ready</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderBookmarksInterface(container) {
        container.innerHTML = `
            <div class="feature-interface bookmarks-interface">
                <div class="feature-header">
                    <h2 class="feature-title">
                        <i data-lucide="bookmark"></i>
                        Smart Bookmarks
                    </h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn">
                            <i data-lucide="plus"></i>
                            Add Bookmark
                        </button>
                        <button class="feature-action-btn">
                            <i data-lucide="folder"></i>
                            Collections
                        </button>
                    </div>
                </div>
                
                <div class="coming-soon-interface">
                    <div class="coming-soon-content">
                        <div class="coming-soon-icon">
                            <i data-lucide="bookmark"></i>
                        </div>
                        <h3>Smart Bookmarks Coming Soon</h3>
                        <p>AI-powered bookmark organization with automatic categorization, full-text search, and intelligent collections.</p>
                        <div class="feature-preview-grid">
                            <div class="preview-feature">
                                <i data-lucide="brain"></i>
                                <span>AI Categorization</span>
                            </div>
                            <div class="preview-feature">
                                <i data-lucide="search"></i>
                                <span>Full-text Search</span>
                            </div>
                            <div class="preview-feature">
                                <i data-lucide="tag"></i>
                                <span>Smart Tags</span>
                            </div>
                            <div class="preview-feature">
                                <i data-lucide="folder"></i>
                                <span>Auto Collections</span>
                            </div>
                        </div>
                        <div class="coming-soon-cta">
                            <button class="btn-secondary">
                                <i data-lucide="bell"></i>
                                Notify When Ready
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderAutomationInterface(container) {
        if (!this.hasRequiredTier('max')) {
            this.renderUpgradeRequired(container, 'automation', 'max');
            return;
        }

        container.innerHTML = `
            <div class="feature-interface automation-interface">
                <div class="feature-header">
                    <h2 class="feature-title">
                        <i data-lucide="zap"></i>
                        Web Automation Studio
                        <span class="tier-badge-small max">Max</span>
                    </h2>
                    <div class="feature-actions">
                        <button class="feature-action-btn">
                            <i data-lucide="plus"></i>
                            New Workflow
                        </button>
                        <button class="feature-action-btn">
                            <i data-lucide="play"></i>
                            Run Workflow
                        </button>
                    </div>
                </div>
                
                <div class="automation-dashboard">
                    <div class="automation-stats">
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i data-lucide="workflow"></i>
                            </div>
                            <div class="stat-data">
                                <div class="stat-number">12</div>
                                <div class="stat-label">Active Workflows</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i data-lucide="clock"></i>
                            </div>
                            <div class="stat-data">
                                <div class="stat-number">1,247</div>
                                <div class="stat-label">Tasks Automated</div>
                            </div>
                        </div>
                        <div class="stat-card">
                            <div class="stat-icon">
                                <i data-lucide="trending-up"></i>
                            </div>
                            <div class="stat-data">
                                <div class="stat-number">98.5%</div>
                                <div class="stat-label">Success Rate</div>
                            </div>
                        </div>
                    </div>
                    
                    <div class="coming-soon-interface">
                        <div class="coming-soon-content">
                            <div class="coming-soon-icon premium">
                                <i data-lucide="zap"></i>
                            </div>
                            <h3>Automation Studio (Beta)</h3>
                            <p>Visual workflow builder powered by n8n integration. Create complex automation workflows with drag-and-drop simplicity.</p>
                            <div class="beta-notice">
                                <i data-lucide="flask"></i>
                                <span>Currently in private beta - joining Max plan grants early access</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderWebsiteBuilderInterface(container) {
        if (!this.hasRequiredTier('max')) {
            this.renderUpgradeRequired(container, 'website-builder', 'max');
            return;
        }

        container.innerHTML = `
            <div class="feature-interface builder-interface">
                <div class="feature-header">
                    <h2 class="feature-title">
                        <i data-lucide="layout"></i>
                        Website Builder Studio
                        <span class="tier-badge-small max">Max</span>
                    </h2>
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
                
                <div class="builder-dashboard">
                    <div class="sites-grid">
                        <div class="site-card">
                            <div class="site-preview">
                                <div class="preview-placeholder">
                                    <i data-lucide="layout"></i>
                                </div>
                            </div>
                            <div class="site-info">
                                <h4>My Portfolio</h4>
                                <p>Last edited 2 days ago</p>
                                <div class="site-actions">
                                    <button class="site-action">
                                        <i data-lucide="edit"></i>
                                        Edit
                                    </button>
                                    <button class="site-action">
                                        <i data-lucide="globe"></i>
                                        Publish
                                    </button>
                                </div>
                            </div>
                        </div>
                        
                        <div class="site-card new-site">
                            <div class="new-site-content">
                                <div class="new-site-icon">
                                    <i data-lucide="plus"></i>
                                </div>
                                <h4>Create New Site</h4>
                                <p>Start with a template or build from scratch</p>
                            </div>
                        </div>
                    </div>
                    
                    <div class="coming-soon-interface">
                        <div class="coming-soon-content">
                            <div class="coming-soon-icon premium">
                                <i data-lucide="layout"></i>
                            </div>
                            <h3>Website Builder Studio (Coming Soon)</h3>
                            <p>Professional website builder with AI-powered design assistance using modern shadcn/ui components.</p>
                            <div class="builder-features">
                                <div class="builder-feature">
                                    <i data-lucide="palette"></i>
                                    <span>AI Design Assistant</span>
                                </div>
                                <div class="builder-feature">
                                    <i data-lucide="smartphone"></i>
                                    <span>Responsive Automation</span>
                                </div>
                                <div class="builder-feature">
                                    <i data-lucide="components"></i>
                                    <span>Modern Components</span>
                                </div>
                                <div class="builder-feature">
                                    <i data-lucide="globe"></i>
                                    <span>Custom Domains</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderUpgradeRequired(container, featureName, requiredTier) {
        const tierNames = {
            pro: 'Pro',
            max: 'Max'
        };

        const tierPrices = {
            pro: '$70',
            max: '$120'
        };

        container.innerHTML = `
            <div class="upgrade-required-interface">
                <div class="upgrade-required-content">
                    <div class="upgrade-icon">
                        <i data-lucide="crown"></i>
                    </div>
                    <h3>Upgrade Required</h3>
                    <p>This feature requires the ${tierNames[requiredTier]} plan to access.</p>
                    
                    <div class="upgrade-features-mini">
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>Access to ${this.routes[featureName].title}</span>
                        </div>
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>All lower tier features included</span>
                        </div>
                        <div class="upgrade-feature">
                            <i data-lucide="check"></i>
                            <span>Priority support</span>
                        </div>
                    </div>
                    
                    <div class="upgrade-pricing-mini">
                        <div class="price-display">
                            ${tierPrices[requiredTier]}<span>/month</span>
                        </div>
                    </div>
                    
                    <div class="upgrade-actions">
                        <button class="btn-primary" onclick="window.location.href='pricing.html'">
                            Upgrade to ${tierNames[requiredTier]}
                            <i data-lucide="arrow-right"></i>
                        </button>
                        <button class="btn-secondary" onclick="router.navigateToFeature('search')">
                            Back to Search
                        </button>
                    </div>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    renderNotFound(container) {
        container.innerHTML = `
            <div class="not-found-interface">
                <div class="not-found-content">
                    <div class="not-found-icon">
                        <i data-lucide="search-x"></i>
                    </div>
                    <h3>Feature Not Found</h3>
                    <p>The requested feature could not be loaded.</p>
                    <button class="btn-primary" onclick="router.navigateToFeature('search')">
                        Return to Search
                        <i data-lucide="arrow-right"></i>
                    </button>
                </div>
            </div>
        `;
        
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    isAuthenticated() {
        return localStorage.getItem('atlasweb_token') !== null;
    }

    hasRequiredTier(requiredTier) {
        const tierLevels = {
            basic: 1,
            pro: 2,
            max: 3
        };
        
        return tierLevels[this.userTier] >= tierLevels[requiredTier];
    }

    showUpgradePrompt(featureName, requiredTier) {
        // Use the dashboard's existing upgrade prompt
        if (window.dashboard && window.dashboard.showUpgradePrompt) {
            window.dashboard.showUpgradePrompt(featureName);
        }
    }

    updateUserTier(newTier) {
        this.userTier = newTier.toLowerCase();
    }
}

// Export for use in dashboard
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DashboardRouter;
} else if (typeof window !== 'undefined') {
    window.DashboardRouter = DashboardRouter;
}