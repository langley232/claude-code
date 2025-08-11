# Claude Code Agent Security & Architecture Guide

## Overview
This document provides a comprehensive guide for creating debugger and code review agents in Claude Code with MCP servers. It includes best practices, security considerations, and architectural recommendations based on real-world implementation experience.

## Recommended MCP Servers for Your Setup

### Core MCP Servers You'll Need:

- **filesystem** - For reading/writing code files
- **git** - For version control operations  
- **code-index** - For codebase indexing (mentioned requirement)
- **shell** - For running tests and build commands
- **memory** - For maintaining context across reviews
- **github** (optional) - For PR integration

### Security Note
⚠️ **Important**: As of January 2025, some MCP servers mentioned in original documentation may not exist or have been deprecated. Always verify server availability before configuration.

## Step-by-Step Setup Guide

### Step 1: Install Claude Code and MCP
```bash
# Install Claude Code CLI
npm install -g @anthropic/claude-code

# Create a project directory
mkdir code-review-agent
cd code-review-agent

# Initialize MCP configuration
claude-code init
```

### Step 2: Configure MCP Servers
Create or edit claude_code_config.json:
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "/path/to/your/project"
      ],
      "env": {}
    },
    "git": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-git"
      ],
      "env": {
        "GIT_REPO_PATH": "/path/to/your/project"
      }
    },
    "code-index": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-code-index",
        "--workspace", "/path/to/your/project"
      ],
      "env": {
        "INDEX_UPDATE_INTERVAL": "30000",
        "MAX_FILE_SIZE": "1048576",
        "INCLUDE_PATTERNS": "**/*.{js,ts,jsx,tsx,py,java,cpp,go,rs}",
        "EXCLUDE_PATTERNS": "**/node_modules/**,**/dist/**,**/.git/**"
      }
    },
    "shell": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-shell"
      ],
      "env": {
        "WORKING_DIR": "/path/to/your/project",
        "ALLOWED_COMMANDS": "npm,yarn,pnpm,jest,pytest,go,cargo,make"
      }
    },
    "memory": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-memory"
      ],
      "env": {
        "MEMORY_DIR": "./mcp-memory",
        "MAX_MEMORY_SIZE": "10485760"
      }
    },
    "github": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-github"
      ],
      "env": {
        "GITHUB_TOKEN": "${GITHUB_TOKEN}",
        "GITHUB_OWNER": "your-username",
        "GITHUB_REPO": "your-repo"
      }
    }
  },
  "customInstructions": "You are a thorough code reviewer and debugger. Always check for security vulnerabilities, performance issues, and code quality problems. Use the code-index to understand the full context of the codebase.",
  "alwaysAllow": ["read", "write", "execute"]
}
```

### Step 3: Set Up Environment Variables
Create a .env file:
```bash
# GitHub integration (optional)
GITHUB_TOKEN=your_github_personal_access_token

# Project paths
PROJECT_ROOT=/path/to/your/project
```

### Step 4: Install Additional Analysis Tools
```bash
# Static analysis tools
npm install -g eslint prettier jshint

# Python tools (if needed)
pip install pylint black mypy

# Security scanning
npm install -g snyk
```

### Step 5: Create Custom MCP Server for Advanced Debugging
Create debugger-server.js:
```javascript
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';

const server = new Server({
  name: 'debugger-server',
  version: '1.0.0',
}, {
  capabilities: {
    tools: {}
  }
});

// Add debugging tools
server.setRequestHandler('tools/list', async () => ({
  tools: [
    {
      name: 'analyze_stack_trace',
      description: 'Analyze stack traces and identify issues',
      inputSchema: {
        type: 'object',
        properties: {
          stackTrace: { type: 'string' },
          language: { type: 'string' }
        }
      }
    },
    {
      name: 'check_memory_leaks',
      description: 'Detect potential memory leaks in code',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' }
        }
      }
    },
    {
      name: 'performance_profile',
      description: 'Analyze code performance bottlenecks',
      inputSchema: {
        type: 'object',
        properties: {
          filePath: { type: 'string' },
          functionName: { type: 'string' }
        }
      }
    }
  ]
}));

// Start server
const transport = new StdioServerTransport();
await server.connect(transport);
```

### Step 6: Add Custom Debugger to Config
Update claude_code_config.json:
```json
{
  "mcpServers": {
    // ... previous servers ...
    "debugger": {
      "command": "node",
      "args": ["./debugger-server.js"],
      "env": {}
    }
  }
}
```

### Step 7: Create Workflow Templates
Create review-templates/security-check.md:
```markdown
## Security Review Checklist
- [ ] SQL Injection vulnerabilities
- [ ] XSS vulnerabilities  
- [ ] Authentication/Authorization issues
- [ ] Sensitive data exposure
- [ ] CSRF protection
- [ ] Input validation
- [ ] Dependency vulnerabilities
```

Create review-templates/performance-check.md:
```markdown
## Performance Review Checklist
- [ ] Algorithm complexity (O(n) analysis)
- [ ] Database query optimization
- [ ] Caching opportunities
- [ ] Memory leaks
- [ ] Unnecessary re-renders (React/Vue)
- [ ] Bundle size optimization
```

### Step 8: Initialize and Test
```bash
# Start Claude Code with your configuration
claude-code --config ./claude_code_config.json

# Test the setup with a sample review
claude-code review --file src/example.js --template ./review-templates/security-check.md
```

### Step 9: Create Custom Commands
Add to your .bashrc or .zshrc:
```bash
alias ccreview="claude-code --config ~/code-review-agent/claude_code_config.json"
alias ccdebug="claude-code --config ~/code-review-agent/claude_code_config.json --prompt 'Debug this error:'"
```

## Usage Examples

### Code Review:
```bash
claude-code "Review this file for security issues and performance" --file src/api/auth.js
```

### Debugging:
```bash
claude-code "Debug this error and suggest fixes" --paste-error
```

### Full Codebase Analysis:
```bash
claude-code "Analyze the entire codebase for code smells and technical debt"
```

## Pro Tips

1. **Index Optimization**: Configure code-index to update frequently during active development
2. **Memory Management**: Use the memory server to maintain context across multiple review sessions
3. **Git Integration**: Leverage git server to review changes between commits
4. **Custom Tools**: Extend the debugger server with language-specific analysis tools
5. **Automation**: Set up pre-commit hooks to run reviews automatically

## Security Considerations

### Environment Variables
- Never commit sensitive tokens to version control
- Use .env files and add them to .gitignore
- Rotate tokens regularly
- Use minimal scope permissions for GitHub tokens

### MCP Server Security
- Validate all MCP server packages before installation
- Use ALLOWED_COMMANDS whitelist for shell server
- Limit filesystem access to necessary directories only
- Monitor MCP server connections and logs

### Agent Configuration
- Use principle of least privilege for agent permissions
- Regularly audit agent system prompts
- Validate tool access patterns
- Monitor agent behavior and outputs

## Real-World Implementation Notes

### Verified Working MCP Servers (January 2025)
- ✅ **@modelcontextprotocol/server-filesystem** - File operations
- ✅ **@modelcontextprotocol/server-memory** - Context persistence
- ✅ **@modelcontextprotocol/server-github** - GitHub API operations
- ❌ **@modelcontextprotocol/server-git** - Not available
- ❌ **@modelcontextprotocol/server-shell** - Not available
- ❌ **@modelcontextprotocol/server-code-index** - Not available

### Alternative Solutions
For missing MCP servers, consider:
- Using Claude Code's native Bash tool instead of shell server
- Using Claude Code's native Git operations via Bash
- Using Claude Code's native Grep/Glob tools for code indexing

## Architecture Benefits

This setup provides:
- **Comprehensive Analysis**: Full codebase understanding with context
- **Security Focus**: Built-in vulnerability detection
- **Performance Optimization**: Automated bottleneck identification  
- **Context Persistence**: Memory across review sessions
- **Integration Ready**: GitHub PR and issue integration
- **Extensible Design**: Easy to add custom tools and workflows

## Troubleshooting

### Common Issues
1. **MCP Server Connection Failures**: Verify package availability and configuration
2. **Token Authentication**: Ensure proper .env file setup and permissions
3. **Path Configuration**: Use absolute paths for reliability
4. **Memory Issues**: Monitor memory server disk usage and limits

### Debugging Commands
```bash
# Check MCP server status
claude mcp list

# Verify agent installation
claude /agents

# Test specific MCP server
npx @modelcontextprotocol/server-filesystem --help
```

This architecture provides a robust foundation for code review and debugging workflows while maintaining security and extensibility.