// AtlasWeb Pricing Configuration
// Centralized pricing and feature management

const PRICING_CONFIG = {
    plans: {
        basic: {
            id: 'basic',
            name: 'Basic',
            price: 20,
            period: 'month',
            description: 'Perfect for individual users and small teams',
            popular: false,
            features: {
                included: [
                    'ai_search_vanilla',
                    'code_assistant',
                    'email_agent',
                    'specialized_search',
                    'personal_assistant',
                    'booking_agents',
                    'payment_processing',
                    'productivity_agents',
                    'translation_agent'
                ],
                excluded: [
                    'ai_deep_research',
                    'writer_integration',
                    'creative_design_suite',
                    'advanced_research',
                    'mobile_assistant'
                ]
            }
        },
        
        pro: {
            id: 'pro',
            name: 'Pro',
            price: 200,
            period: 'month',
            description: 'For creative professionals and studios',
            popular: true,
            features: {
                included: [
                    'ai_search_vanilla',
                    'code_assistant',
                    'email_agent',
                    'specialized_search',
                    'personal_assistant',
                    'booking_agents',
                    'payment_processing',
                    'productivity_agents',
                    'translation_agent',
                    'writer_integration',
                    'creative_design_suite',
                    'image_generation',
                    'video_production',
                    'animation_tools'
                ],
                excluded: [
                    'ai_deep_research',
                    'advanced_research',
                    'mobile_assistant'
                ]
            }
        },
        
        max: {
            id: 'max',
            name: 'Max',
            price: 300,
            period: 'month',
            description: 'Advanced professionals and power users',
            popular: false,
            features: {
                included: [
                    'ai_search_vanilla',
                    'code_assistant',
                    'email_agent',
                    'specialized_search',
                    'personal_assistant',
                    'booking_agents',
                    'payment_processing',
                    'productivity_agents',
                    'translation_agent',
                    'writer_integration',
                    'creative_design_suite',
                    'image_generation',
                    'video_production',
                    'animation_tools',
                    'ai_deep_research',
                    'advanced_research',
                    'mobile_assistant',
                    'native_mobile_apps',
                    'cross_platform_sync'
                ],
                excluded: []
            }
        },
        
        enterprise: {
            id: 'enterprise',
            name: 'Enterprise',
            price: 'custom',
            period: 'contact',
            description: 'Large organizations with custom needs',
            popular: false,
            features: {
                included: [
                    'everything_in_max',
                    'custom_agent_development',
                    'enterprise_rag',
                    'enterprise_productivity',
                    'customer_support_agent',
                    'managed_services',
                    'custom_integrations',
                    'dedicated_support',
                    'sla_guarantees'
                ],
                excluded: []
            }
        }
    },
    
    features: {
        // Core Features
        ai_search_vanilla: {
            name: 'AI Search Vanilla',
            description: 'Privacy-first intelligent browsing with DuckDuckGo integration',
            category: 'core',
            icon: 'search',
            addOnPrice: 0
        },
        
        code_assistant: {
            name: 'Code Assistant (Jules)',
            description: 'Advanced development assistant for coding and debugging',
            category: 'core',
            icon: 'code',
            addOnPrice: 0
        },
        
        email_agent: {
            name: 'Email Agent',
            description: 'Voice-enabled email management with mobile integration',
            category: 'core',
            icon: 'mail',
            addOnPrice: 0
        },
        
        specialized_search: {
            name: 'Specialized Search',
            description: 'YouTube, Social Media, and jurisdiction-specific search',
            category: 'core',
            icon: 'target',
            addOnPrice: 0
        },
        
        personal_assistant: {
            name: 'Personal Assistant',
            description: 'Mobile-based assistant for Apple, Samsung, and international phones',
            category: 'core',
            icon: 'smartphone',
            addOnPrice: 0
        },
        
        booking_agents: {
            name: 'Booking Agents',
            description: 'Automated booking for dining, accommodation, and flights',
            category: 'core',
            icon: 'calendar',
            addOnPrice: 0
        },
        
        payment_processing: {
            name: 'Payment Processing',
            description: 'Secure payment integration with Stripe and Plaid',
            category: 'core',
            icon: 'credit-card',
            addOnPrice: 0
        },
        
        productivity_agents: {
            name: 'Productivity Agents',
            description: 'Integration with JotForm and productivity tools',
            category: 'core',
            icon: 'zap',
            addOnPrice: 0
        },
        
        translation_agent: {
            name: 'Translation Agent',
            description: 'Mobile translator with Meta glasses support',
            category: 'core',
            icon: 'languages',
            addOnPrice: 0
        },
        
        // Pro Features
        writer_integration: {
            name: 'Writer Integration',
            description: 'Advanced content creation and story writing augmentation',
            category: 'pro',
            icon: 'pen-tool',
            addOnPrice: 50
        },
        
        creative_design_suite: {
            name: 'Creative Design Suite',
            description: 'Image generation, video production, animation tools',
            category: 'pro',
            icon: 'palette',
            addOnPrice: 75
        },
        
        image_generation: {
            name: 'Image Generation & Editing',
            description: 'AI-powered image creation and editing tools',
            category: 'pro',
            icon: 'image',
            addOnPrice: 25
        },
        
        video_production: {
            name: 'Video Production Assistance',
            description: 'AI-assisted video creation and editing',
            category: 'pro',
            icon: 'video',
            addOnPrice: 40
        },
        
        animation_tools: {
            name: 'Animation Tools for Studios',
            description: 'Professional animation and motion graphics tools',
            category: 'pro',
            icon: 'play',
            addOnPrice: 35
        },
        
        // Max Features
        ai_deep_research: {
            name: 'AI Deep Research',
            description: 'OpenAI/Google integration with multi-source verification',
            category: 'max',
            icon: 'brain',
            addOnPrice: 80
        },
        
        advanced_research: {
            name: 'Advanced Research',
            description: 'Deep research with comprehensive analysis reports',
            category: 'max',
            icon: 'microscope',
            addOnPrice: 60
        },
        
        mobile_assistant: {
            name: 'Mobile Personal Assistant',
            description: 'Native iPad, iPhone, and Android apps',
            category: 'max',
            icon: 'tablet-smartphone',
            addOnPrice: 40
        },
        
        native_mobile_apps: {
            name: 'Native Mobile Apps',
            description: 'iOS and Android native applications',
            category: 'max',
            icon: 'mobile',
            addOnPrice: 50
        },
        
        cross_platform_sync: {
            name: 'Cross-platform Synchronization',
            description: 'Seamless sync across all devices and platforms',
            category: 'max',
            icon: 'refresh-cw',
            addOnPrice: 20
        },
        
        // Enterprise Features
        everything_in_max: {
            name: 'Everything in Max',
            description: 'All Max plan features included',
            category: 'enterprise',
            icon: 'star',
            addOnPrice: 0
        },
        
        custom_agent_development: {
            name: 'Custom Agent Development',
            description: 'Tailored AI agents for specific business needs',
            category: 'enterprise',
            icon: 'settings',
            addOnPrice: 500
        },
        
        enterprise_rag: {
            name: 'Enterprise RAG Implementation',
            description: 'Custom Retrieval-Augmented Generation systems',
            category: 'enterprise',
            icon: 'database',
            addOnPrice: 300
        },
        
        dedicated_support: {
            name: 'Dedicated Support & SLA',
            description: 'Priority support with service level agreements',
            category: 'enterprise',
            icon: 'headphones',
            addOnPrice: 200
        }
    },
    
    // Utility functions
    getPlan: function(planId) {
        return this.plans[planId] || null;
    },
    
    getFeature: function(featureId) {
        return this.features[featureId] || null;
    },
    
    calculateCustomPrice: function(basePlan, additionalFeatures = []) {
        const plan = this.getPlan(basePlan);
        if (!plan || plan.price === 'custom') {
            return { price: 'custom', period: 'contact' };
        }
        
        let totalPrice = plan.price;
        const addedFeatures = [];
        
        additionalFeatures.forEach(featureId => {
            const feature = this.getFeature(featureId);
            if (feature && !plan.features.included.includes(featureId)) {
                totalPrice += feature.addOnPrice;
                addedFeatures.push(feature);
            }
        });
        
        return {
            basePrice: plan.price,
            totalPrice: totalPrice,
            period: plan.period,
            addedFeatures: addedFeatures,
            basePlan: plan
        };
    },
    
    getAvailableAddOns: function(planId) {
        const plan = this.getPlan(planId);
        if (!plan) return [];
        
        return Object.keys(this.features)
            .filter(featureId => !plan.features.included.includes(featureId))
            .map(featureId => this.features[featureId])
            .filter(feature => feature.addOnPrice > 0);
    }
};

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PRICING_CONFIG;
}

// Make available globally in browser
if (typeof window !== 'undefined') {
    window.PRICING_CONFIG = PRICING_CONFIG;
}