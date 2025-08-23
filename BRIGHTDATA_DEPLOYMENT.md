# BrightData Sandbox/Production Deployment Guide

## 🎯 **System Overview**

You now have a complete dual-mode system for testing BrightData integration:

### **Sandbox Mode** (Default)
- Uses hardcoded API key for testing
- **$1.00 budget limit** for safe testing
- Real API structure but falls back to enhanced mock data
- Perfect for development and testing

### **Production Mode**
- Requires user-provided Pro API key
- No budget limits (user controlled)
- Real BrightData social media API calls
- Secure environment variable handling

## 🚀 **Features Implemented**

### **1. Budget Control System**
```javascript
// Budget Manager Features:
- $1.00 test limit for sandbox mode
- Real-time cost tracking ($0.0015 per record)
- Budget warnings at 80% usage
- Request blocking when limit reached
- Usage statistics and reporting
```

### **2. Mode Switching Interface**
- **Visual Toggle**: Sandbox ⇔ Production buttons in header
- **Automatic API Key Management**: Switches between test/production keys
- **Budget Reset**: Automatic when switching to sandbox
- **Security Prompts**: Requests production API key when needed

### **3. Real API Integration**
```javascript
// Actual BrightData API calls in production:
POST https://api.brightdata.com/data/scrape
{
    "tool": "instagram_profiles",
    "parameters": { "url": "https://instagram.com/username" },
    "format": "json"
}
```

### **4. Security Features**
- **Hardcoded Key Removal**: Production cleanup utility
- **Environment Variable Support**: Secure API key management
- **CSP Compliance**: Content Security Policy headers
- **Local Storage Encryption**: Sensitive data protection

## 📋 **Testing Instructions**

### **Phase 1: Sandbox Testing (Free)**
1. **Default Mode**: Page loads in Sandbox mode
2. **Budget Display**: Shows "$0.00/$1.00" in header
3. **Test Searches**: Try social media searches
4. **Budget Tracking**: Watch costs increment by $0.0015 per record
5. **Budget Limit**: System blocks requests at $1.00

### **Phase 2: Production Setup (After Pro Subscription)**
1. **Get Pro API Key**: From BrightData dashboard after upgrade
2. **Switch Mode**: Click "Production" button in header
3. **Enter API Key**: System prompts for production key
4. **Real Data**: Now getting actual social media data
5. **Monitor Costs**: Real BrightData billing applies

## 🔧 **For You To Do**

### **Step 1: Test Sandbox Mode**
```bash
# Open the functional search page
# Try searching for "tesla" in social media
# Watch the budget tracker increment
# Confirm it stops at $1.00 limit
```

### **Step 2: Get BrightData Pro**
1. Visit: https://brightdata.com/cp/start
2. Login with your existing account
3. Upgrade to Web Scraper API plan
4. Copy your new Pro API key

### **Step 3: Test Production Mode**
```bash
# Click "Production" button
# Enter your Pro API key when prompted
# Test with small searches first
# Monitor real costs in BrightData dashboard
```

## 💰 **Cost Management**

### **Sandbox Mode Costs**
- **Budget**: $1.00 fixed limit
- **Records**: ~666 records max (at $0.0015 each)
- **Safety**: System prevents overage

### **Production Mode Costs**
- **No App Limits**: Full BrightData billing applies
- **Monitoring**: Track usage in BrightData dashboard
- **Recommendation**: Set your own monthly limits

## 🔒 **Security for Production Deployment**

### **Before Going Live:**

1. **Remove Hardcoded Keys**:
```bash
# Run production cleanup
node production-cleanup.js
```

2. **Environment Variables**:
```bash
# Set in production environment
BRIGHTDATA_API_KEY=your_production_key_here
NODE_ENV=production
```

3. **Build Process**:
```bash
# Keys replaced with env vars during build
npm run build
```

## 📱 **User Experience**

### **Current Interface:**
- **Mode Toggle**: Sandbox/Production buttons in header
- **Budget Display**: Real-time cost tracking
- **Warnings**: Alert when approaching limits
- **Security**: Production mode requires API key input

### **Search Flow:**
1. **Select Mode**: Sandbox for testing, Production for real data
2. **Search**: Use social media search as normal
3. **Monitor**: Watch budget/usage in header
4. **Upgrade**: Switch to production when ready

## 🎉 **What's Ready Now**

✅ **Sandbox Testing**: Test with $1 budget limit  
✅ **Production Infrastructure**: Ready for Pro API key  
✅ **Budget Controls**: Automatic cost tracking  
✅ **Security**: Production cleanup utilities  
✅ **UI Integration**: Mode switcher in header  
✅ **Real API Calls**: Actual BrightData integration  

## 🚀 **Next Steps**

1. **Test sandbox mode** with the $1 budget
2. **Upgrade to BrightData Pro** when ready for real data
3. **Switch to production mode** and enter Pro API key
4. **Monitor costs** in real-time during usage

The system is ready to go! Start with sandbox testing while you set up your Pro subscription.