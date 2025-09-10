# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## CRITICAL: Agent Task Assignment Protocol

**ALWAYS use specialized agents for domain-specific tasks to preserve context and maintain quality:**

### Mandatory Agent Usage
- **@github-agent** - ALL GIT AND GITHUB OPERATIONS (commits, pushes, pulls, merges, branches, PRs, repository management, collaboration) - NEVER use direct git commands, ALWAYS delegate to github-agent
- **@browser-testing-agent** - All Playwright browser automation, E2E testing, UI validation
- **@documentation-searcher** - Technical documentation lookup, framework references, API docs
- **@code-review-agent** - Security analysis, performance reviews, code quality assessment
- **@debugger-agent** - Error diagnosis, troubleshooting, root cause analysis
- **@workflow-agent** - n8n automation, business process integration, API orchestration
- **@frontend-ui-agent** - ONLY when explicitly requested for shadcn/ui components
- **@video-content-agent** - YouTube analysis, educational content processing

### ⚠️ CRITICAL GIT OPERATIONS REMINDER
**ALL git commands must be delegated to @github-agent including but not limited to:**
- `git merge`, `git checkout`, `git pull`, `git push`
- `git commit`, `git add`, `git status`, `git log`
- Branch operations, repository management, collaboration tasks
- **NO EXCEPTIONS** - Always use Task tool with subagent_type="github-agent"

### Implementation Requirements
1. **Task Recognition**: Immediately identify if a task matches an agent's domain
2. **Agent Delegation**: Use Task tool with appropriate subagent_type
3. **Context Preservation**: Provide detailed task descriptions with full context
4. **Quality Maintenance**: Leverage each agent's specialized knowledge and tools
5. **TodoWrite Integration**: Track progress across agent handoffs

### Example Usage
```bash
# Git operations → @github-agent
Task(subagent_type="github-agent", description="Commit and push navigation fixes")

# Browser testing → @browser-testing-agent  
Task(subagent_type="browser-testing-agent", description="Test navigation flow with Playwright")

# Documentation lookup → @documentation-searcher
Task(subagent_type="documentation-searcher", description="Find Electron navigation API docs")
```

## Repository Overview

This is the Claude Code Agent Infrastructure repository - a comprehensive collection of specialized AI agents and MCP server configurations designed to enhance software development workflows. The repository provides 9 specialized agents with focused expertise across different domains.

## Quick Setup

### Installation Commands
```bash
# Setup all agents
chmod +x setup-agents.sh
./setup-agents.sh

# Configure environment
cp config/environment-template.env .env
# Edit .env with your tokens: GITHUB_PERSONAL_ACCESS_TOKEN, N8N_API_KEY, REF_API_KEY
```

### Verification
```bash
# Verify agent installation
claude /agents

# Check MCP server status
claude /mcps
```

## Agent Architecture

### Core Specialized Agents
- **@code-review-agent** - Comprehensive security, performance, and code quality analysis
- **@debugger-agent** - Advanced debugging, troubleshooting, and root cause analysis  
- **@workflow-agent** - n8n workflow automation and business process integration
- **@github-agent** - GitHub repository management, PR reviews, and collaboration
- **@frontend-ui-agent** - shadcn/ui component development and design systems
- **@browser-testing-agent** - Playwright browser automation and E2E testing
- **@documentation-searcher** - Technical documentation search and reference
- **@video-content-agent** - YouTube content analysis and educational material processing
- **@internet-search-agent** - Web scraping, content extraction, and research using Firecrawl

### Agent Usage Patterns
```bash
# Security-focused code review
claude @code-review-agent "Review this codebase for security vulnerabilities and performance issues"

# Advanced debugging workflow  
claude @debugger-agent "Debug this error and provide comprehensive root cause analysis"

# Automated workflow creation
claude @workflow-agent "Create a webhook workflow for processing form submissions"

# GitHub integration tasks
claude @github-agent "Review this pull request and add detailed inline comments"

# Web scraping and research
claude @internet-search-agent "Research competitor pricing and extract structured data"
```

## MCP Server Infrastructure

### Active MCP Servers
- **filesystem** - File operations and project management (`@modelcontextprotocol/server-filesystem`)
- **memory** - Context persistence across sessions (`@modelcontextprotocol/server-memory`)
- **github** - GitHub API integration (`@modelcontextprotocol/server-github`)
- **n8n-mcp** - Workflow automation platform (`n8n-mcp`)
- **playwright** - Browser automation and testing (`@playwright/mcp`)
- **shadcn-ui** - Modern UI component library (`@jpisnice/shadcn-ui-mcp-server`)
- **Ref** - Technical documentation search (HTTP API)
- **mcp-youtube** - Video content processing (`@anaisbetts/mcp-youtube`)
- **firecrawl-mcp** - Web scraping and content extraction (`firecrawl-mcp`)
- **supabase** - Database operations and backend services (`@supabase/mcp-server-supabase`)
- **clerk** - User authentication and management (custom implementation)

### Environment Configuration
Required environment variables in `.env`:
```bash
GITHUB_PERSONAL_ACCESS_TOKEN=your_token_here
N8N_API_KEY=your_n8n_key_here  
REF_API_KEY=your_ref_key_here
FIRECRAWL_API_KEY=your_firecrawl_api_key_here
SUPABASE_URL=your_supabase_project_url_here
SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_ACCESS_TOKEN=your_supabase_access_token_here
CLERK_SECRET_KEY=your_clerk_secret_key_here
```

## Development Workflows

### Code Review Process
The code-review-agent provides comprehensive analysis including:
- Security vulnerability scanning (SQL injection, XSS, auth issues)
- Performance analysis (algorithm complexity, memory usage, database queries)
- Code quality assessment (maintainability, readability, best practices)
- Architecture and design pattern reviews

### Debugging Workflow
The debugger-agent specializes in:
- Error analysis and root cause identification
- System diagnostics and troubleshooting
- Performance bottleneck detection
- Integration with GitHub for issue tracking

### Workflow Automation
The workflow-agent handles:
- n8n workflow creation and management
- Business process automation
- Integration between different systems
- API workflow orchestration

## Security Features

### Built-in Security Analysis
- Automated vulnerability detection for common attack vectors
- Dependency scanning for security issues
- OWASP compliance validation
- PII handling and encryption review

### Secure Configuration
- Environment variable management for tokens
- Minimal permission principles
- Secure MCP server configurations
- No hardcoded secrets in repository

## Integration Capabilities

### GitHub Integration
- Pull request reviews with inline comments
- Issue creation and tracking
- Repository management and collaboration
- Branch and commit analysis

### Browser Automation
- End-to-end testing with Playwright
- UI validation and accessibility checks
- Cross-browser compatibility testing
- Performance and security testing

### Documentation Access
- Real-time technical documentation lookup via Ref API
- Community documentation and best practices
- Framework and library reference materials

## Context Persistence

The memory MCP server maintains context across sessions:
- Review patterns and institutional knowledge
- Project-specific configurations and preferences
- Learning from previous analyses and recommendations
- Building cumulative expertise over time

## Agent Directory Structure

```
~/.claude/agents/
├── workflow-agent.md
├── github-agent.md  
├── browser-testing-agent.md
├── frontend-ui-agent.md
├── video-content-agent.md
├── documentation-searcher.md
├── code-review-agent.md
└── debugger-agent.md
```

## Performance Optimization

### Code Analysis Capabilities
- Algorithm complexity analysis with O(n) notation
- Memory leak detection and optimization recommendations
- Database query performance tuning
- Bundle size optimization for frontend applications

### Testing and Quality Assurance
- Automated security scanning integration
- Performance benchmarking and profiling
- Accessibility compliance testing
- Cross-platform compatibility validation

## UI Design Guidelines

### Preferred Design System: Aura-Inspired Approach
When creating websites or user interfaces, **always use the Aura design approach** unless explicitly instructed otherwise:

#### Design Principles
- **Glass-morphism Effects**: Use `backdrop-filter: blur()` with semi-transparent backgrounds
- **Vibrant Gradients**: Implement multi-color gradients (indigo, purple, cyan, emerald)
- **Interactive Elements**: Floating animations, hover transforms, and dynamic backgrounds
- **Modern Typography**: Bold headings with gradient text effects and dramatic scaling
- **Card Components**: Rounded corners (16px+), subtle shadows, and hover lift effects

#### Technical Implementation
- **Color Palette**: Primary (#6366f1), Purple (#8b5cf6), Cyan (#06b6d4), Emerald (#10b981)
- **Animations**: CSS keyframes for floating elements, smooth transitions (300ms ease)
- **Backgrounds**: Radial gradients, animated backgrounds, floating particles
- **Spacing**: Generous whitespace, 24px+ gaps between components
- **Border Radius**: 12px+ for buttons, 16px+ for cards

#### ShadCN Usage Restriction
- **Do NOT use ShadCN/UI components** unless explicitly requested
- The frontend-ui-agent should only be used when specifically asked for ShadCN implementation
- Default to Aura-inspired custom components and styling

### Playwright Cleanup Requirements

#### Automatic Cleanup After Browser Testing
- **PNG Screenshot Deletion**: Always delete all `.png` files generated during Playwright sessions
- **Temporary File Management**: Clean up `/tmp/playwright-mcp-output/` directories
- **Browser Instance Closure**: Ensure all browser instances are properly closed

#### Asset Management
- **Aura Site Assets**: When using images or assets from aura.build:
  1. Download the asset during the session
  2. Use it in the project
  3. Delete it after completion unless it's part of the final deliverable
- **Local Asset Storage**: Avoid persisting external assets unless explicitly required

#### Implementation Commands
```bash
# After Playwright usage, cleanup screenshots
rm -f *.png
rm -rf /tmp/playwright-mcp-output/
find . -name "*.png" -path "*playwright*" -delete

# Close browser instances
browser.close() # in Playwright context
```

#### **IMPORTANT: Mandatory Playwright Cleanup**
**ALWAYS delete all .png files after browser testing sessions:**
- Delete all screenshots generated during testing
- Clean up temporary files to prevent repository bloat
- Use: `find . -name "*.png" -path "*playwright*" -delete`
- This is a critical requirement for all browser testing workflows

## Working with This Repository

When contributing to or modifying this agent infrastructure:

1. **Agent Configuration**: Agent files in `/agents/` define capabilities and tool access
2. **MCP Configuration**: `/config/mcp-servers.json` defines server connections
3. **Environment Setup**: Use `/config/environment-template.env` as template
4. **Installation**: Run `./setup-agents.sh` to deploy agent configurations
5. **Documentation**: Update agent documentation when adding new capabilities
6. **UI Development**: Follow Aura design guidelines for all frontend work

## Troubleshooting

### Common Issues
- **MCP Server Connection**: Verify environment variables in `.env`
- **Agent Not Found**: Run `./setup-agents.sh` to reinstall agents
- **Permission Issues**: Check file permissions on setup script
- **Missing Tools**: Verify MCP server installation and configuration

## Dashboard UI Agent Best Practices

### Core Dashboard Design Principles

#### 1. Information Hierarchy & Layout
- **F-Pattern Layout**: Users scan in an F-pattern - place critical metrics top-left
- **Progressive Disclosure**: Show overview first, drill-down details on demand
- **White Space Usage**: 60/40 rule - 60% content, 40% white space for breathing room
- **Grid Systems**: Use 12-column grid with consistent spacing (8px, 16px, 24px, 32px)

#### 2. Data Visualization Standards
- **Chart Selection**: Line charts for trends, bar charts for comparisons, pie charts for parts-to-whole (max 7 segments)
- **Color Psychology**: Green for positive metrics, red for alerts, blue for neutral information
- **Accessibility**: WCAG AA compliance, minimum 4.5:1 contrast ratio, colorblind-friendly palettes
- **Real-time Updates**: Use subtle animations for data changes, avoid jarring transitions

#### 3. Component Architecture with shadcn/ui
```typescript
// Dashboard Card Component Structure
const DashboardCard = ({ title, value, trend, icon, className }) => {
  return (
    <Card className={cn("p-6", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend && (
          <p className="text-xs text-muted-foreground">
            <span className={trend.positive ? "text-green-600" : "text-red-600"}>
              {trend.value}
            </span>
            {" "}
            {trend.label}
          </p>
        )}
      </CardContent>
    </Card>
  )
}
```

#### 4. Responsive Dashboard Design
- **Mobile First**: Design for 320px minimum width
- **Breakpoints**: sm(640px), md(768px), lg(1024px), xl(1280px), 2xl(1536px)
- **Card Stacking**: Vertical stacking on mobile, grid layouts on desktop
- **Touch Targets**: Minimum 44px touch target size for mobile interactions

#### 5. Performance & Loading States
- **Skeleton Loading**: Use shadcn Skeleton components for progressive loading
- **Virtualization**: Implement virtual scrolling for large datasets (react-window)
- **Caching Strategy**: SWR or React Query for efficient data fetching
- **Lazy Loading**: Code-split dashboard components by feature

#### 6. Dashboard Component Library (shadcn Integration)
```bash
# Essential Dashboard Components
npx shadcn-ui@latest add card
npx shadcn-ui@latest add button
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add progress
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add table
npx shadcn-ui@latest add select
npx shadcn-ui@latest add date-picker
npx shadcn-ui@latest add chart
```

#### 7. UX Patterns for Dashboard Interactions
- **Drill-Down Navigation**: Breadcrumb trails, contextual back buttons
- **Filtering & Search**: Persistent filter states, faceted search
- **Export Functionality**: PDF, CSV, Excel export options
- **Customization**: Drag-and-drop dashboard widgets, personal preferences

## Mobile UX Agent Best Practices

### iOS Design Standards

#### 1. iOS Human Interface Guidelines Compliance
- **Navigation**: Use UINavigationController patterns, swipe gestures for back navigation
- **Typography**: SF Pro system font, dynamic type support for accessibility
- **Color Scheme**: Support both light and dark modes with semantic colors
- **Layout**: Safe area compliance, respect notch and home indicator areas

#### 2. Glass Design Implementation (iOS)
```css
/* Glass Morphism Effects for iOS */
.glass-card {
  background: rgba(255, 255, 255, 0.25);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.18);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.37);
  border-radius: 16px;
}

.glass-dark {
  background: rgba(0, 0, 0, 0.25);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

/* iOS-style blurred background */
.ios-blur {
  backdrop-filter: saturate(180%) blur(20px);
  background: rgba(255, 255, 255, 0.8);
}
```

#### 3. iOS Touch Interactions
- **Haptic Feedback**: Implement UIImpactFeedback for user actions
- **Gesture Recognition**: Swipe, pinch, long press, 3D Touch (where available)
- **Animation**: Use ease-in-out timing, 0.3s duration for transitions
- **Pull-to-Refresh**: Native iOS refresh control implementation

#### 4. iOS Voice Enablement (Siri Integration)
```javascript
// Voice command integration example
const handleVoiceCommand = (command) => {
  switch(command.intent) {
    case 'search_emails':
      return processEmailSearch(command.query);
    case 'compose_email':
      return initiateEmailComposition(command.recipient);
    case 'get_analytics':
      return displayAnalytics(command.timeframe);
  }
};

// Siri Shortcuts integration
const registerSiriShortcuts = () => {
  const shortcuts = [
    {
      phrase: "Check my email analytics",
      action: "openEmailAnalytics",
      category: "productivity"
    },
    {
      phrase: "Search for recent emails",
      action: "openEmailSearch",
      category: "communication"
    }
  ];
  // Register with SiriKit
};
```

### Android Material Design Standards

#### 1. Material Design 3 (Material You)
- **Dynamic Color**: Adapt to user's wallpaper colors
- **Typography**: Roboto font family, scalable text sizes
- **Motion**: Material motion system with emphasis on purposeful animation
- **Components**: Use Material Design Components (MDC) or shadcn alternatives

#### 2. Android Touch & Gesture Patterns
- **Floating Action Button**: Primary action accessibility
- **Bottom Navigation**: Main navigation for 3-5 top-level destinations
- **Swipe Gestures**: Swipe to dismiss, swipe for navigation
- **Edge-to-Edge**: Utilize full screen real estate with proper padding

#### 3. Android Voice Integration (Google Assistant)
```javascript
// Google Assistant Actions integration
const handleAssistantAction = (action) => {
  return {
    'actions.intent.MAIN': () => launchMainActivity(),
    'custom.search.emails': (params) => searchEmails(params.query),
    'custom.compose.email': (params) => composeEmail(params.recipient),
    'custom.get.stats': () => getAnalytics()
  }[action.name]?.(action.parameters);
};

// Voice command processing
const processVoiceInput = async (speechResult) => {
  const intent = await parseIntent(speechResult);
  return handleAssistantAction(intent);
};
```

#### 4. Android Adaptive Design
- **Screen Sizes**: Support from 4" phones to 13" tablets
- **Density Independence**: Use dp (density-independent pixels)
- **Configuration Changes**: Handle rotation, window size changes
- **Fold Support**: Optimize for foldable devices

### Cross-Platform Mobile Considerations

#### 1. Touch Interface Standards
- **Minimum Touch Target**: 44pt (iOS) / 48dp (Android)
- **Gesture Conflicts**: Avoid competing gestures in same area
- **Thumb Zones**: Place primary actions in comfortable thumb reach
- **One-Handed Usage**: Consider reachability on large screens

#### 2. Performance Optimization
- **Image Optimization**: WebP format, responsive images, lazy loading
- **Bundle Size**: Code splitting, tree shaking, dynamic imports
- **Memory Management**: Proper cleanup, avoid memory leaks
- **Battery Efficiency**: Minimize background processing, optimize animations

#### 3. Voice Enablement Architecture
```typescript
// Universal voice interface
interface VoiceCommand {
  intent: string;
  entities: Record<string, any>;
  confidence: number;
  platform: 'ios' | 'android' | 'web';
}

class VoiceController {
  private handlers = new Map<string, Function>();
  
  register(intent: string, handler: Function) {
    this.handlers.set(intent, handler);
  }
  
  async process(command: VoiceCommand) {
    const handler = this.handlers.get(command.intent);
    if (handler && command.confidence > 0.8) {
      return await handler(command.entities);
    }
    return this.handleUnknownCommand(command);
  }
}
```

## Component Library Integration

### shadcn/ui Mobile Optimization

#### 1. Mobile-First Component Configuration
```json
// components.json for mobile projects
{
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": {
    "config": "tailwind.config.js",
    "css": "src/styles/globals.css",
    "baseColor": "slate",
    "cssVariables": true,
    "prefix": ""
  },
  "aliases": {
    "components": "./src/components",
    "utils": "./src/lib/utils",
    "ui": "./src/components/ui",
    "lib": "./src/lib",
    "hooks": "./src/hooks"
  },
  "iconLibrary": "lucide",
  "mobile": {
    "touchTargetSize": "44px",
    "gestureSupport": true,
    "hapticFeedback": true
  }
}
```

#### 2. Essential Mobile Components
```bash
# Core mobile UI components
npx shadcn-ui@latest add button
npx shadcn-ui@latest add card
npx shadcn-ui@latest add sheet  # Mobile-friendly modal
npx shadcn-ui@latest add drawer # Bottom drawer pattern
npx shadcn-ui@latest add tabs   # Mobile navigation
npx shadcn-ui@latest add input
npx shadcn-ui@latest add badge
npx shadcn-ui@latest add avatar
npx shadcn-ui@latest add skeleton
npx shadcn-ui@latest add toast
```

#### 3. Custom Mobile Components
```typescript
// Mobile-optimized Card with touch interactions
const MobileCard = ({ children, onTap, onLongPress }) => {
  return (
    <Card 
      className="touch-manipulation active:scale-95 transition-transform"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {children}
    </Card>
  );
};

// Voice-enabled search component
const VoiceSearch = () => {
  const [isListening, setIsListening] = useState(false);
  
  return (
    <div className="flex items-center space-x-2">
      <Input placeholder="Search or speak..." />
      <Button 
        variant={isListening ? "destructive" : "outline"}
        size="icon"
        onClick={toggleVoiceRecognition}
      >
        <Mic className={isListening ? "animate-pulse" : ""} />
      </Button>
    </div>
  );
};
```

## Exemplary Design References

### Dashboard Design Inspiration

#### 1. World-Class Dashboard Examples
- **Linear**: Clean, minimal interface with excellent typography
- **Notion**: Flexible block-based layout system
- **Stripe Dashboard**: Clear data hierarchy and progressive disclosure
- **Vercel Analytics**: Real-time data visualization
- **Figma**: Collaborative features with intuitive UI
- **Railway**: Developer-focused dashboard with excellent UX

#### 2. Design System References
- **Radix UI**: Unstyled, accessible components (shadcn base)
- **Mantine**: Feature-rich React components
- **Chakra UI**: Modular and accessible component library
- **Ant Design**: Enterprise-class UI design language
- **Tailwind UI**: Premium Tailwind CSS components

### Mobile Design Excellence

#### 1. iOS App Design References
- **Apollo**: Reddit client with excellent navigation
- **Things 3**: Task management with beautiful interactions
- **Reeder**: RSS reader with perfect typography
- **Darkroom**: Photo editing with glass morphism
- **Castro**: Podcast app with innovative UI patterns

#### 2. Android Design Excellence
- **Google Photos**: Material Design mastery
- **Telegram**: Cross-platform consistency
- **Spotify**: Music discovery and playback UX
- **Adobe Lightroom**: Professional tools on mobile
- **WhatsApp**: Messaging UX perfection

#### 3. Cross-Platform Design Systems
- **Shopify Polaris**: E-commerce focused design system
- **Atlassian Design System**: Enterprise collaboration tools
- **IBM Carbon**: AI and data-focused components
- **Microsoft Fluent**: Cross-platform design system
- **Apple Human Interface Guidelines**: iOS design standards
- **Material Design**: Google's design system

### Voice Interface Examples
- **Voice Flow**: Conversational AI design tools
- **Amazon Alexa Skills**: Voice command patterns
- **Google Assistant Actions**: Voice interaction design
- **Apple Shortcuts**: Voice automation workflows
- **Microsoft Cortana**: Enterprise voice assistance

### Prototyping Tools & Resources
- **Figma**: Collaborative design and prototyping
- **Framer**: Advanced prototyping with code components
- **Principle**: Interaction design for mobile
- **ProtoPie**: Sensor-based prototyping
- **Adobe XD**: End-to-end UX design platform
- **InVision**: Design collaboration and handoff

###
MCP SERVER look up or connection please use https://www.pulsemcp.com/servers site using REF
