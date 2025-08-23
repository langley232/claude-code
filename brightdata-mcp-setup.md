# BrightData MCP Server Setup Guide

## ✅ **Setup Status: Working**

Your BrightData MCP server is successfully configured and the API connection is working! The server is automatically creating the required zones (mcp_unlocker, mcp_browser).

## 🔧 **Current Configuration**

### **MCP Server Config (Claude Desktop)**
```json
{
    "mcpServers": {
        "Bright Data": {
            "command": "npx",
            "args": ["@brightdata/mcp"],
            "env": {
                "API_TOKEN": "c988af6189e31c5122500a1eda86c84fbd45082f9c6ddc555689ae1328fed2c8"
            }
        }
    }
}
```

### **Environment Variables (.env)**
```bash
# BrightData API Configuration
BRIGHTDATA_API_KEY=c988af6189e31c5122500a1eda86c84fbd45082f9c6ddc555689ae1328fed2c8
BRIGHTDATA_YOUTUBE_DATASET_ID=gd_lk56epmy2i5g7lzu0k
```

## 🚀 **What's Available Now**

### **Free Tier Tools (5,000 requests/month)**
- `search_engine` - Real-time web search (Google, Bing, Yandex)
- `scrape_as_markdown` - Extract webpage content as markdown

### **Zone Setup (Automatic)**
- ✅ `mcp_unlocker` - Web unlocker zone created
- ✅ `mcp_browser` - Browser automation zone created

## 🧪 **Testing Your Setup**

### **Test 1: Basic Web Search**
```javascript
// Available through MCP tools
search_engine({
    query: "latest technology trends 2024",
    engine: "google",
    country: "US"
})
```

### **Test 2: Web Scraping**
```javascript
// Available through MCP tools
scrape_as_markdown({
    url: "https://example.com"
})
```

## 🔄 **Integration with Your Social Media Search**

### **Enhanced Implementation Plan**

Since you now have working BrightData MCP access, here's how to integrate it:

#### **1. Hybrid Search Strategy**
```javascript
class EnhancedSocialMediaSearch {
    constructor() {
        this.brightDataAvailable = true; // MCP server is working
        this.monthlyRequestsUsed = 0;
        this.maxFreeRequests = 5000;
    }

    async searchSocialMedia(query, platform) {
        // Use BrightData for high-value web searches
        if (this.canUseBrightData()) {
            const webResults = await this.searchWithBrightData(query, platform);
            const socialResults = this.generateEnhancedMockData(query, platform, webResults);
            return socialResults;
        } else {
            return this.generateMockSocialPosts(query, platform);
        }
    }

    async searchWithBrightData(query, platform) {
        // Use search_engine tool to get real-time web data about the topic
        const searchQuery = `${query} ${platform} posts trends`;
        
        try {
            // This would use the MCP search_engine tool
            const webData = await this.callMcpTool('search_engine', {
                query: searchQuery,
                engine: 'google',
                country: 'US'
            });
            
            this.monthlyRequestsUsed++;
            return webData;
            
        } catch (error) {
            console.log('BrightData request failed, using mock data');
            return null;
        }
    }

    generateEnhancedMockData(query, platform, webContext) {
        // Generate more realistic mock data based on real web search results
        const mockPosts = this.generateMockSocialPosts(query, platform);
        
        if (webContext) {
            // Enhance mock data with real trends and topics from web search
            return this.enhanceWithWebContext(mockPosts, webContext);
        }
        
        return mockPosts;
    }
}
```

#### **2. Real Web Data Enhancement**
```javascript
// Use BrightData to get real trending topics and enhance mock social media data
async function getRelevantWebData(query) {
    const trendingSearch = await brightDataMcp.search_engine({
        query: `${query} trending social media 2024`,
        engine: 'google'
    });
    
    const newsSearch = await brightDataMcp.search_engine({
        query: `${query} latest news`,
        engine: 'google'
    });
    
    return {
        trending: trendingSearch,
        news: newsSearch
    };
}
```

## 📊 **Usage Monitoring**

### **Track Your Free Tier Usage**
```javascript
class BrightDataUsageTracker {
    constructor() {
        this.monthlyLimit = 5000;
        this.currentUsage = parseInt(localStorage.getItem('brightdata_usage') || '0');
        this.resetDate = localStorage.getItem('brightdata_reset') || this.getNextResetDate();
    }

    canMakeRequest() {
        this.checkReset();
        return this.currentUsage < this.monthlyLimit;
    }

    recordRequest() {
        this.currentUsage++;
        localStorage.setItem('brightdata_usage', this.currentUsage.toString());
        this.updateUI();
    }

    checkReset() {
        const now = new Date();
        const resetDate = new Date(this.resetDate);
        
        if (now >= resetDate) {
            this.currentUsage = 0;
            this.resetDate = this.getNextResetDate();
            localStorage.setItem('brightdata_usage', '0');
            localStorage.setItem('brightdata_reset', this.resetDate);
        }
    }

    getRemainingRequests() {
        return Math.max(0, this.monthlyLimit - this.currentUsage);
    }
}
```

## 🎯 **Next Steps**

### **Immediate Actions**
1. ✅ BrightData MCP server is configured and working
2. ✅ API connection established with your account
3. ✅ Free tier zones created automatically

### **Implementation Priorities**
1. **Test Basic Tools** - Try search_engine and scrape_as_markdown
2. **Enhance Mock Data** - Use web search results to improve mock social media posts
3. **Add Usage Tracking** - Monitor your 5,000 monthly requests
4. **Progressive Enhancement** - Start with web search, add more features gradually

### **For Social Media Data**
- **Current Status**: Free tier doesn't include direct social media extraction
- **Workaround**: Use web search to get trending topics and enhance mock data
- **Future**: Upgrade to Pro Mode ($1.50/1k records) when ready for real social media data

## 🔧 **Troubleshooting**

### **Common Issues**
1. **"Server not found"** - Restart Claude Desktop after config changes
2. **"API_TOKEN missing"** - Verify token in MCP config matches your .env file
3. **"Zone creation failed"** - Check BrightData account permissions

### **Testing Commands**
```bash
# Test MCP server directly
export API_TOKEN=your_token_here
npx @brightdata/mcp

# Check account status
curl -H "Authorization: Bearer your_token_here" https://api.brightdata.com/account/status
```

## 🎉 **Success!**

Your BrightData MCP server is now ready to use! You can start making real web searches and enhance your social media search application with actual trending data while staying within the free tier limits.

The setup is complete and working - you're ready to build amazing features!