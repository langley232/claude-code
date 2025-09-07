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

###
MCP SERVER look up or connection please use https://www.pulsemcp.com/servers site using REF
