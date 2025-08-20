# 🚀 Vercel MCP Setup Guide for AtlasWeb

This guide will help you set up the Vercel MCP server for automated deployment and management of your AtlasWeb project.

## 📋 Prerequisites

1. **Vercel Account**: Create account at [vercel.com](https://vercel.com)
2. **Vercel API Token**: Generate at [vercel.com/account/tokens](https://vercel.com/account/tokens)
3. **Domain**: You have `atlasweb.info` ready for configuration
4. **Claude Code**: Ensure you have Claude Code with MCP support

## 🔧 Step 1: Get Your Vercel API Token

1. Go to [Vercel Account Tokens](https://vercel.com/account/tokens)
2. Click "Create Token"
3. Name it: `Claude Code MCP Token`
4. Set scope: **Full Account** (recommended) or specific teams
5. Set expiration: **No Expiration** or your preferred duration
6. Click "Create Token"
7. **Copy the token** - you'll need it for configuration

## 🔑 Step 2: Configure Environment Variables

Add these variables to your `.env` file:

```bash
# Copy config/environment-template.env to .env if you haven't already
cp config/environment-template.env .env

# Then add your Vercel credentials:
VERCEL_API_KEY=your_vercel_api_token_here
VERCEL_TEAM_ID=your_vercel_team_id_here  # Optional - leave empty if using personal account
```

**Finding Your Team ID** (if using Vercel teams):
1. Go to your Vercel dashboard
2. Select your team from the dropdown
3. Look at the URL: `vercel.com/teams/YOUR_TEAM_ID`
4. Copy the team ID from the URL

## 🚀 Step 3: Test Vercel MCP Connection

Restart Claude Code to load the new MCP server:

```bash
# Stop Claude Code if running
# Restart Claude Code

# Test the connection by asking Claude:
# "Can you list my Vercel projects?"
# "Can you show me the Vercel MCP tools available?"
```

## 📁 Step 4: Project Structure Validation

Your project is already set up with the correct structure:

```
statsai-electron/
├── src/
│   ├── index.html                    # Main page
│   ├── functional-search.html        # Google One AI features
│   ├── specialized-search.html       # Premium features showcase  
│   ├── styles.css                    # All styling
│   ├── script.js                     # Main JavaScript
│   └── functional-search.js          # Search functionality
├── vercel.json                       # Vercel configuration
├── deploy-to-vercel.js              # Deployment automation script
└── VERCEL-SETUP.md                  # This guide
```

## 🌐 Step 5: Deploy to Vercel

### Option A: Using the Deployment Script
```bash
# Preview deployment
node deploy-to-vercel.js

# Production deployment
node deploy-to-vercel.js --production
```

### Option B: Using Claude Code with Vercel MCP
Ask Claude to:
- "Create a new Vercel project for my statsai-electron repository"
- "Deploy my project to Vercel with custom domain atlasweb.info"
- "Set up environment variables for production deployment"

### Option C: Manual Vercel CLI
```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Deploy (preview)
vercel

# Deploy to production
vercel --prod
```

## 🔧 Step 6: Configure Custom Domain

### DNS Configuration for atlasweb.info

**With IONOS (your domain provider):**

1. Go to IONOS Domain Management
2. Select `atlasweb.info`
3. Go to DNS Settings
4. Add these records:

```
Type: A
Name: @
Value: 76.76.19.61   # Vercel IP (check current IP at vercel.com/docs)

Type: CNAME  
Name: www
Value: cname.vercel-dns.com
```

**With Vercel MCP (via Claude):**
Ask Claude to:
- "Add the domain atlasweb.info to my Vercel project"
- "Configure SSL certificate for atlasweb.info"
- "Verify domain configuration and DNS settings"

## 📊 Step 7: Available Vercel MCP Tools

Once configured, you can use Claude Code to manage Vercel with these capabilities:

### **🚀 Deployment Management**
- Create, list, get, delete deployments
- Cancel running deployments  
- Promote deployments to production
- Get deployment files and logs

### **📦 Project Management**
- Create, update, delete projects
- List all projects and get project details
- Manage project members and permissions
- Configure project settings and framework

### **🌐 Domain Management**
- Add, remove, and configure domains
- Verify domain ownership
- Manage SSL certificates
- Check domain configuration status

### **⚙️ Environment Variables**
- Create, update, delete environment variables
- List environment variables by environment
- Manage secrets and sensitive data

### **👥 Team Management** (if using teams)
- Create, delete, update teams
- Manage team members and roles
- Configure team settings

### **🔗 DNS Management**
- Create, update, delete DNS records
- List DNS records for domains
- Configure DNS settings

## 🎯 Step 8: Usage Examples

Ask Claude Code to help with:

```
"Deploy my statsai-electron project to Vercel with the domain atlasweb.info"

"Create environment variables for my Vercel project:
- NODE_ENV: production  
- API_URL: https://api.atlasweb.info"

"List all my Vercel deployments and show me the latest one"

"Add SSL certificate for atlasweb.info domain"

"Get the deployment logs for my latest AtlasWeb deployment"

"Create a new Vercel project from my GitHub repository"
```

## 🔍 Step 9: Monitoring and Management

### **Deployment Status Monitoring**
```
"Check the status of my latest Vercel deployment"
"Show me deployment analytics for atlasweb.info"  
"List all deployment errors from the last 24 hours"
```

### **Performance Monitoring**
```
"Get web vitals data for atlasweb.info"
"Show me the build logs for my latest deployment"
"Check the deployment size and performance metrics"
```

## 🛠️ Troubleshooting

### **Common Issues:**

1. **API Token Invalid**
   - Regenerate token at vercel.com/account/tokens
   - Update VERCEL_API_KEY in .env file
   - Restart Claude Code

2. **Domain Not Verified**
   - Check DNS configuration
   - Allow 24-48 hours for DNS propagation
   - Use Claude: "Verify domain status for atlasweb.info"

3. **Deployment Failed**
   - Check build logs: Ask Claude "Show deployment logs"
   - Verify file structure and vercel.json configuration
   - Ensure all required files are committed to Git

4. **MCP Server Not Loading**
   - Check config/mcp-servers.json syntax
   - Verify environment variables in .env
   - Restart Claude Code application

## 📈 Advanced Features

### **Automated Deployments**
Set up GitHub Actions integration:
```
"Configure automatic deployments from GitHub for my main branch"
"Set up preview deployments for pull requests"
```

### **Multi-Environment Setup**
```
"Create staging environment for testing"
"Configure different environment variables for staging vs production"
```

### **Team Collaboration**
```
"Add team members to my Vercel project"
"Set up role-based permissions for deployment access"
```

## 🎉 Success Verification

Once everything is set up, you should be able to:

1. ✅ Access your site at `https://atlasweb.info`
2. ✅ Navigate between all pages (Home, Functional Search, Specialized Search)
3. ✅ See proper SSL certificate (green lock icon)
4. ✅ All features working (animations, search tabs, etc.)
5. ✅ Fast loading times with Vercel's CDN

## 📞 Support

If you need help:
1. Check the [Vercel Documentation](https://vercel.com/docs)
2. Use Claude Code to debug: "Help me troubleshoot my Vercel deployment"
3. Check Vercel dashboard for error details
4. Contact Vercel support for domain/DNS issues

---

**🎯 Your AtlasWeb project is now ready for professional deployment with full Vercel MCP integration!**