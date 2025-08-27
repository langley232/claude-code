# AtlasWeb AI - Dashboard Product Requirements Document

## 🎯 **Product Vision**
AtlasWeb AI is an intelligent browsing platform that transforms how users interact with the web through AI-powered features, intelligent automation, and context-aware assistance.

## 📋 **Dashboard Architecture Overview**

### **Three-Column Layout System (20/40/40 Split)**
Based on modern dashboard patterns and optimized for AI-powered browsing:

- **Left Panel (20% width)**: Daily Alerts, Popular Agents, Quick Navigation
- **Middle Panel (40% width)**: AI Search Engine with ensemble models (xAI, Google, OpenAI)  
- **Right Panel (40% width)**: Specialized AI Chatbot with OpenAI integration and help search

### **Dashboard Layout Specifications**

**Top Bar (Fixed Header):**
- Feature quick buttons (search, bookmarks, email, automation)
- Global search/help functionality
- Account management dropdown (top-right)
- Subscription tier indicator
- Notification center

**Left Panel (Daily Command Center):**
- Daily alerts and notifications
- Popular AI agents marketplace
- Quick action shortcuts
- Recent activity feed
- Subscription-based feature access

**Middle Panel (AI Search Hub):**
- Ensemble search interface with model selection
- Real-time search suggestions
- Source verification and citation
- Search history with AI summaries
- Advanced filtering options

**Right Panel (AI Chat Assistant):**
- Specialized focused chat with OpenAI
- Context-aware help search integration
- Chat history and session management
- Quick response templates
- Voice input capabilities

---

## 🚀 **Core Features Specification**

### **F01: AI-Powered Web Search (Ensemble Models)**
**Priority:** P0 (MVP)  
**Subscription Tiers:** All (Basic: limited queries, Pro/Max: unlimited)

**Description:**
Advanced ensemble search system combining xAI, Google Gemini, and OpenAI models for comprehensive, accurate results with source verification.

**Ensemble AI Architecture:**
- **xAI (Grok)**: Real-time information and current events
- **Google Gemini**: Web search integration and fact verification  
- **OpenAI (GPT-4)**: Natural language processing and synthesis
- **Smart routing**: Automatically selects best model(s) based on query type
- **Result fusion**: Combines insights from multiple models for comprehensive answers

**Technical Requirements:**
- Multi-model API integration with failover
- Query intent classification for optimal model selection
- Real-time source aggregation and verification
- Citation-based results with confidence scoring
- Search history with AI-generated summaries
- Advanced filtering (date, domain, content type, model preference)

**Search Interface Features:**
- Model selection dropdown (auto, xAI, Gemini, OpenAI, or ensemble)
- Real-time search suggestions from multiple sources
- Confidence indicators for each result
- Source verification badges
- Related search recommendations
- Export search results to various formats

**User Stories:**
- As a researcher, I want multiple AI perspectives on my queries with source verification
- As a student, I want comprehensive answers that synthesize information from different AI models
- As a professional, I want to choose specific AI models based on the type of information I need
- As a fact-checker, I want confidence scores and source verification for all results

**UI Components:**
- Ensemble search input with model selector
- Multi-source results grid with confidence indicators
- AI synthesis panel combining insights from different models  
- Model comparison view showing different AI perspectives
- Advanced filtering and export options

---

### **F02: Email Assistant Integration**
**Priority:** P0 (MVP)  
**Subscription Tiers:** Pro, Max

**Description:**
Full email client with AI-powered features based on email assistant mock.

**Technical Requirements:**
- Microsoft 365/Outlook integration via Graph API
- Gmail integration via Gmail API  
- AI email composition using Gemini
- Smart email categorization and prioritization
- Thread analysis and summarization

**Features from Email Assistant Analysis:**
- Three-panel email interface (list, content, chat)
- AI draft generation with context awareness
- Thread timeline visualization
- Intelligent response suggestions
- Email vectorization for semantic search
- Keyboard shortcuts (j/k navigation, r for reply)

**User Stories:**
- As a business user, I want AI to draft professional responses based on email context
- As an executive, I want email threads summarized with action items highlighted
- As a team member, I want smart email categorization to prioritize important messages

---

### **F10: Website Builder Studio**
**Priority:** P1  
**Subscription Tiers:** Max only

**Description:**
Professional website builder with AI-powered design assistance using shadcn/ui components and modern frameworks.

**Technical Requirements:**
- Frontend-ui-agent integration for component generation
- shadcn/ui component library with custom theming
- Drag-and-drop visual editor
- AI-powered design suggestions
- Responsive design automation
- Custom domain management
- SEO optimization tools

**Website Builder Features:**
- Pre-built templates with Aura design system
- Component library (buttons, forms, cards, layouts)
- AI-generated content and copy
- Real-time collaboration
- Version control and rollback
- Custom CSS/JavaScript support
- E-commerce integration capabilities
- Performance optimization tools

**User Stories:**
- As a small business owner, I want to create a professional website without coding knowledge
- As a designer, I want to use modern components while maintaining creative control
- As a developer, I want to customize and extend the builder with my own components

---

## 💰 **Subscription Tier Features**

### **Basic Tier ($50/month)**
*Pricing varies by region based on local market conditions*

- ✅ AI-Enhanced Web Search (ensemble models: xAI, Google, OpenAI)
- ✅ Basic Bookmark Management (500 bookmarks)
- ✅ AI Writing Assistant (basic features)
- ✅ Privacy & Security Center
- ✅ Mobile App Access
- ✅ Daily Alerts & Popular Agents
- ✅ Specialized AI Chat (OpenAI integration)
- ❌ Email Integration
- ❌ Advanced Analytics
- ❌ Team Collaboration
- ❌ Web Automation

### **Pro Tier ($70/month)**
*Pricing varies by region based on local market conditions*

- ✅ All Basic features
- ✅ Unlimited AI-Enhanced Search (full ensemble models)
- ✅ Email Assistant Integration
- ✅ Advanced Bookmark Management (unlimited)
- ✅ Full AI Writing Assistant
- ✅ Advanced Analytics & Insights
- ✅ Priority Customer Support
- ✅ Advanced Daily Alerts & Agent Marketplace
- ❌ Website Builder Studio
- ❌ Web Automation Studio
- ❌ Team Collaboration
- ❌ API Access

### **Max Tier ($120/month)**
*Pricing varies by region based on local market conditions*

- ✅ All Pro features
- ✅ Website Builder Studio (shadcn/ui components)
- ✅ Web Automation Studio
- ✅ Team Collaboration Hub (up to 15 members)
- ✅ Developer API Access
- ✅ Custom AI Model Integration
- ✅ White-label Options
- ✅ 24/7 Priority Support
- ✅ Advanced Security Features
- ✅ Frontend-ui-agent integration
- ✅ Custom domain management

---

## 🎨 **Design System Requirements**

### **Visual Design Language**
Based on research of modern dashboard patterns and Aura design principles:

**Color Palette:**
- Primary: `#6366f1` (Indigo-600)
- Secondary: `#8b5cf6` (Purple-600)
- Accent: `#06b6d4` (Cyan-600)
- Success: `#10b981` (Emerald-600)
- Background: `#f8fafc` (Slate-50)
- Surface: `#ffffff` (White)
- Text Primary: `#1e293b` (Slate-800)
- Text Secondary: `#64748b` (Slate-500)

**Typography:**
- Primary Font: Inter (system fallback)
- Headings: Bold, gradient text effects for major titles
- Body: Regular weight, high contrast
- Code: JetBrains Mono

**Layout Principles:**
- 12px base unit for spacing
- 16px+ border radius for modern feel
- Generous whitespace (24px+ gaps)
- Glass-morphism effects with `backdrop-filter: blur()`
- Subtle shadows and hover animations

### **Component Architecture**
Following shadcn/ui patterns but with Aura-inspired customization:

**Core Components:**
- `DashboardLayout` - Three-column responsive layout
- `NavigationSidebar` - Collapsible left panel with feature access
- `ChatSidebar` - AI assistant interface (right panel)  
- `FeatureCard` - Quick access tiles with hover effects
- `SearchInterface` - AI-enhanced search with live suggestions
- `BookmarkManager` - Smart bookmark organization
- `AnalyticsDashboard` - Data visualization components

---

## 🔧 **Technical Architecture**

### **Frontend Stack**
- **Framework:** Next.js 15 with App Router
- **Styling:** Tailwind CSS + CSS-in-JS for animations
- **Components:** Custom component library (Aura-inspired)
- **State Management:** Zustand + React Query
- **Authentication:** Next-Auth with Microsoft/Google
- **AI Integration:** Gemini API + custom prompt engineering

### **Backend Stack**
- **Runtime:** Node.js with TypeScript
- **Database:** Supabase (PostgreSQL)
- **AI Services:** Google Gemini 2.5 Flash
- **Email Integration:** Microsoft Graph API, Gmail API
- **Automation:** n8n MCP server integration
- **Search:** Custom search engine with AI enhancement

### **Infrastructure**
- **Hosting:** Vercel (frontend) + Supabase (backend)
- **CDN:** Vercel Edge Functions
- **Analytics:** Custom analytics with privacy focus
- **Monitoring:** Sentry + custom error tracking
- **Security:** OWASP compliance + custom threat detection

---

## 🚀 **Development Roadmap**

### **Phase 1: MVP (Q1 2025)**
- Basic dashboard with three-column layout
- AI-enhanced web search
- User authentication and subscription management
- Basic bookmark management
- Privacy & security center

### **Phase 2: Core Features (Q2 2025)**
- Email assistant integration
- Advanced bookmark management
- AI writing assistant
- Mobile app launch
- Team collaboration features

### **Phase 3: Advanced Features (Q3 2025)**
- Web automation studio
- Advanced analytics
- Developer API access
- Enhanced security features
- International expansion

### **Phase 4: Enterprise & Scale (Q4 2025)**
- Enterprise features
- White-label solutions
- Advanced AI capabilities
- Global CDN optimization
- Advanced team management

---

**Document Status:** ✅ Active  
**Next Review:** February 26, 2025  
**Owner:** Development Team  
**Stakeholders:** Product, Engineering, Design, Business

---

*This is a living document that will be updated as features are developed, user feedback is gathered, and market conditions change.*