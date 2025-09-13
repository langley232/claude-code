// AI Content Enhancer using Gemini API
// Provides more realistic and trending content suggestions

class AIContentEnhancer {
    constructor() {
        this.geminiApiKey = 'AIzaSyCRJ8BT5LaVPvOS6FE0tAKPg5u-kLryfds'; // From .env
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent';
        this.cache = new Map(); // Cache responses to avoid API overuse
        this.cacheTimeout = 10 * 60 * 1000; // 10 minutes
    }

    async enhanceContentForPlatform(query, platform, contentType = 'trending') {
        const cacheKey = `${platform}-${query}-${contentType}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                console.log(`🔄 Using cached AI content for ${platform}: ${query}`);
                return cached.data;
            }
        }

        try {
            const prompt = this.buildPromptForPlatform(query, platform, contentType);
            const response = await this.queryGemini(prompt);
            const enhancedContent = this.parseGeminiResponse(response, platform);
            
            // Cache the response
            this.cache.set(cacheKey, {
                data: enhancedContent,
                timestamp: Date.now()
            });
            
            console.log(`✅ Generated AI-enhanced content for ${platform}: ${query}`);
            return enhancedContent;
            
        } catch (error) {
            console.warn('AI enhancement failed, using fallback:', error);
            return this.getFallbackContent(query, platform);
        }
    }

    buildPromptForPlatform(query, platform, contentType) {
        const basePrompts = {
            tiktok: {
                trending: `Generate 8 realistic TikTok video titles and descriptions for the search term "${query}". 
                         Each should include:
                         - Authentic TikTok language with emojis
                         - Popular hashtags related to ${query}
                         - Creator handles starting with @
                         - Realistic engagement numbers (views, likes, shares, comments)
                         - Short durations (15s-3min)
                         - Current TikTok trends and challenges
                         
                         Format as JSON array with: title, description, creator, hashtags, estimatedViews, estimatedLikes, estimatedShares, estimatedComments, duration`,
                
                viral: `Generate 8 highly viral TikTok content ideas about "${query}" that would get millions of views.
                       Focus on content that typically goes viral: challenges, trends, relatable content, humor.
                       Include realistic viral metrics and trending hashtags.`,
                
                educational: `Generate 8 educational TikTok content ideas about "${query}" that are informative but engaging.
                            Focus on tutorials, life hacks, explanations, and how-to content that's popular on TikTok.`
            },
            
            youtube: {
                trending: `Generate 8 realistic YouTube video titles and descriptions for "${query}".
                          Include typical YouTube elements: compelling titles, detailed descriptions, realistic metrics.
                          Format as JSON array with: title, description, channel, tags, estimatedViews, estimatedLikes, estimatedComments, duration`,
                
                educational: `Generate 8 educational YouTube videos about "${query}" with tutorial-focused content.`,
                
                entertainment: `Generate 8 entertaining YouTube videos about "${query}" with high engagement potential.`
            }
        };

        return basePrompts[platform]?.[contentType] || basePrompts[platform]?.trending || 
               `Generate realistic ${platform} content about "${query}"`;
    }

    async queryGemini(prompt) {
        const requestBody = {
            contents: [{
                parts: [{
                    text: prompt
                }]
            }],
            generationConfig: {
                temperature: 0.8,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 2048,
            }
        };

        const response = await fetch(`${this.apiEndpoint}?key=${this.geminiApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.candidates[0]?.content?.parts[0]?.text || '';
    }

    parseGeminiResponse(response, platform) {
        try {
            // Try to extract JSON from the response
            const jsonMatch = response.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
                const jsonData = JSON.parse(jsonMatch[0]);
                return this.formatContentForPlatform(jsonData, platform);
            } else {
                // Fallback: parse structured text response
                return this.parseTextResponse(response, platform);
            }
        } catch (error) {
            console.warn('Failed to parse Gemini response:', error);
            return null;
        }
    }

    formatContentForPlatform(jsonData, platform) {
        if (!Array.isArray(jsonData)) return null;

        return jsonData.map(item => {
            if (platform === 'tiktok') {
                return {
                    title: item.title || 'AI Generated Content',
                    description: item.description || '',
                    creator: item.creator || '@ai_creator',
                    hashtags: Array.isArray(item.hashtags) ? item.hashtags : ['#ai', '#trending'],
                    viewCount: item.estimatedViews || Math.floor(Math.random() * 5000000) + 100000,
                    likeCount: item.estimatedLikes || Math.floor(Math.random() * 800000) + 50000,
                    shareCount: item.estimatedShares || Math.floor(Math.random() * 100000) + 5000,
                    commentCount: item.estimatedComments || Math.floor(Math.random() * 50000) + 2000,
                    duration: item.duration || this.generateRandomDuration(),
                    isAIGenerated: true
                };
            } else if (platform === 'youtube') {
                return {
                    title: item.title || 'AI Generated Video',
                    description: item.description || '',
                    channel: item.channel || 'AI Content Creator',
                    tags: Array.isArray(item.tags) ? item.tags : ['ai', 'trending'],
                    viewCount: item.estimatedViews || Math.floor(Math.random() * 2000000) + 50000,
                    likeCount: item.estimatedLikes || Math.floor(Math.random() * 100000) + 5000,
                    commentCount: item.estimatedComments || Math.floor(Math.random() * 10000) + 500,
                    duration: item.duration || this.generateYouTubeDuration(),
                    isAIGenerated: true
                };
            }
        }).filter(item => item !== null);
    }

    parseTextResponse(response, platform) {
        // Basic text parsing for when JSON parsing fails
        const lines = response.split('\n').filter(line => line.trim());
        const content = [];
        
        for (let i = 0; i < Math.min(lines.length, 8); i++) {
            const line = lines[i].trim();
            if (line && !line.startsWith('#') && !line.startsWith('//')) {
                content.push({
                    title: line.replace(/^\d+\.?\s*/, ''), // Remove numbering
                    description: `AI-generated content about the topic`,
                    creator: platform === 'tiktok' ? '@ai_creator' : 'AI Content Creator',
                    hashtags: platform === 'tiktok' ? ['#ai', '#trending'] : ['ai', 'trending'],
                    viewCount: Math.floor(Math.random() * 2000000) + 100000,
                    likeCount: Math.floor(Math.random() * 200000) + 10000,
                    isAIGenerated: true
                });
            }
        }
        
        return content.length > 0 ? content : null;
    }

    getFallbackContent(query, platform) {
        // Fallback content when AI fails
        const fallbackTemplates = {
            tiktok: [
                {
                    title: `${query} challenge trending now 🔥`,
                    creator: '@trending_ai',
                    hashtags: [`#${query.replace(/\s+/g, '')}`, '#fyp', '#viral'],
                    isAIGenerated: false
                }
            ],
            youtube: [
                {
                    title: `Everything You Need to Know About ${query}`,
                    channel: 'AI Learning Hub',
                    tags: [query, 'tutorial', 'guide'],
                    isAIGenerated: false
                }
            ]
        };

        return fallbackTemplates[platform] || [];
    }

    generateRandomDuration() {
        const durations = ['0:15', '0:30', '0:45', '1:00', '1:15', '1:30', '2:00', '2:30', '3:00'];
        return durations[Math.floor(Math.random() * durations.length)];
    }

    generateYouTubeDuration() {
        const minutes = Math.floor(Math.random() * 25) + 5; // 5-30 minutes
        const seconds = Math.floor(Math.random() * 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    // Get current trending topics (could be enhanced with real trend APIs)
    async getCurrentTrends(platform) {
        const trendPrompt = `What are the top 10 trending topics on ${platform} right now? 
                           Provide just a simple list of trending keywords/topics.`;
        
        try {
            const response = await this.queryGemini(trendPrompt);
            return this.parseTrendsList(response);
        } catch (error) {
            console.warn('Failed to get trends:', error);
            return this.getDefaultTrends(platform);
        }
    }

    parseTrendsList(response) {
        return response.split('\n')
            .filter(line => line.trim())
            .map(line => line.replace(/^\d+\.?\s*/, '').trim())
            .filter(trend => trend.length > 0)
            .slice(0, 10);
    }

    getDefaultTrends(platform) {
        const defaultTrends = {
            tiktok: ['dance challenge', 'cooking hack', 'outfit of the day', 'productivity tips', 'funny pets'],
            youtube: ['tech review', 'tutorial', 'vlog', 'gaming', 'music cover'],
            instagram: ['photography', 'fashion', 'travel', 'food', 'fitness'],
            linkedin: ['career tips', 'industry news', 'professional development', 'networking', 'leadership']
        };

        return defaultTrends[platform] || ['trending', 'viral', 'popular'];
    }

    // Clear cache manually if needed
    clearCache() {
        this.cache.clear();
        console.log('🗑️ AI content cache cleared');
    }

    // Get cache stats
    getCacheStats() {
        const stats = {
            size: this.cache.size,
            entries: Array.from(this.cache.keys())
        };
        console.log('📊 AI cache stats:', stats);
        return stats;
    }
}

// Global instance
window.aiContentEnhancer = new AIContentEnhancer();

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    console.log('🤖 AI Content Enhancer initialized with Gemini API');
});