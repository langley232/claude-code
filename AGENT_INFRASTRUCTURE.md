# Claude Code Specialized Agents Infrastructure

## Overview
This infrastructure provides specialized sub-agents for Claude Code, each tailored to specific development tasks using your configured MCP servers.

## Agent Architecture

### 1. **workflow-agent** (n8n Automation)
- **Purpose**: n8n workflow creation, management, and deployment
- **MCP Tools**: All n8n-mcp tools (47 tools)
- **Use Cases**: Automation workflows, API integrations, data processing

### 2. **github-agent** (Repository Management)
- **Purpose**: GitHub operations, code review, project management
- **MCP Tools**: GitHub MCP tools (25 tools)
- **Use Cases**: PR reviews, repository management, issue tracking

### 3. **browser-testing-agent** (E2E Testing)
- **Purpose**: Browser automation and end-to-end testing
- **MCP Tools**: Playwright MCP tools (25 tools)
- **Use Cases**: UI testing, web automation, accessibility testing

### 4. **frontend-ui-agent** (UI Development)
- **Purpose**: Modern frontend development with shadcn/ui
- **MCP Tools**: shadcn/ui MCP tools (7 tools)
- **Use Cases**: React components, design systems, responsive layouts

### 5. **video-content-agent** (Content Analysis)
- **Purpose**: YouTube video analysis and content extraction
- **MCP Tools**: YouTube MCP tools (1 tool)
- **Use Cases**: Educational content, tutorial analysis, research

### 6. **documentation-searcher** (Technical Documentation)
- **Purpose**: Technical documentation search and reference
- **MCP Tools**: Ref and GitHub tools (8 tools)
- **Use Cases**: API documentation, technical references, code examples

## Installation

### Automatic Setup
```bash
# Make setup script executable and run
chmod +x setup-agents.sh
./setup-agents.sh
```

### Manual Setup
```bash
# Create agents directory
mkdir -p ~/.claude/agents

# Copy agent files
cp workflow-agent.md ~/.claude/agents/
cp github-agent.md ~/.claude/agents/
cp browser-testing-agent.md ~/.claude/agents/
cp frontend-ui-agent.md ~/.claude/agents/
cp video-content-agent.md ~/.claude/agents/
cp documentation-searcher.md ~/.claude/agents/
```

### Verification
```bash
# Check agents are loaded
claude /agents
```

## Usage Examples

### Workflow Automation
```bash
claude @workflow-agent "Create a webhook that processes form submissions and saves to database"
claude @workflow-agent "Build an AI-powered email classification workflow"
```

### GitHub Operations
```bash
claude @github-agent "Review this pull request for security issues"
claude @github-agent "Create a new issue for the bug I found"
```

### Browser Testing
```bash
claude @browser-testing-agent "Test the login functionality on the staging site"
claude @browser-testing-agent "Check accessibility compliance for the dashboard"
```

### Frontend Development
```bash
claude @frontend-ui-agent "Create a responsive dashboard with shadcn/ui components"
claude @frontend-ui-agent "Build a form with validation using shadcn/ui"
```

### Content Analysis
```bash
claude @video-content-agent "Analyze this React tutorial and create study notes"
claude @video-content-agent "Summarize this technical conference talk"
```

### Documentation Search
```bash
claude @documentation-searcher "Find Next.js API route documentation"
claude @documentation-searcher "Search for React hooks best practices"
```

## Agent Configuration Format

Each agent follows this `.md` format:
```markdown
---
name: agent-name
description: Agent description
tools: tool1, tool2, tool3
model: sonnet
---

System prompt and instructions...
```

## MCP Server Requirements

Ensure these MCP servers are configured in your Claude Code:
- `n8n-mcp` - n8n workflow automation
- `github` - GitHub repository operations
- `playwright` - Browser automation
- `shadcn-ui` - UI component library
- `mcp-youtube` - YouTube content analysis
- `Ref` - Technical documentation

## Project-Level Usage

For project-specific agents:
1. Copy agent files to project's `.claude/agents/` directory
2. Customize system prompts for project context
3. Add project-specific tools if needed

## Benefits

1. **Specialized Context**: Each agent has focused expertise
2. **Tool Isolation**: Only relevant tools available per agent
3. **Consistent Workflows**: Standardized approaches for each domain
4. **Scalable Architecture**: Easy to add new specialized agents
5. **Project Portability**: Agents can be copied between projects

## Troubleshooting

### Agents Not Showing
- Check `~/.claude/agents/` directory exists
- Verify agent files have correct `.md` extension
- Restart Claude Code after adding agents

### MCP Tools Not Working
- Run `claude /mcp` to check server status
- Verify MCP server configurations in `.claude.json`
- Check server logs for connection issues

### Agent Not Responding
- Verify agent has required tools in frontmatter
- Check agent name matches file name
- Ensure system prompt is properly formatted

## Extending the Infrastructure

### Adding New Agents
1. Create new `.md` file with agent configuration
2. Define specialized system prompt
3. List required MCP tools
4. Add to setup script and documentation

### Custom Project Agents
1. Create project-specific `.claude/agents/` directory
2. Customize existing agents or create new ones
3. Add project context to system prompts
4. Configure project-specific MCP servers if needed

This infrastructure provides a robust foundation for specialized development workflows while maintaining the flexibility to adapt to different project needs.