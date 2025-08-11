# Claude Code Agent Infrastructure

A comprehensive collection of specialized AI agents and MCP server configurations for Claude Code, designed to enhance software development workflows with focused expertise in different domains.

## 🎯 Specialized Agents

### Core Development Agents
- **workflow-agent** - n8n workflow automation and business process integration
- **github-agent** - GitHub repository management, PR reviews, and collaboration
- **code-review-agent** ⭐ - Comprehensive code review with security and performance analysis
- **debugger-agent** ⭐ - Advanced debugging, troubleshooting, and root cause analysis

### UI/UX & Testing Agents  
- **frontend-ui-agent** - shadcn/ui component development and design systems
- **browser-testing-agent** - Playwright browser automation and E2E testing

### Documentation & Content Agents
- **documentation-searcher** - Technical documentation search and reference
- **video-content-agent** - YouTube content analysis and educational material processing

## 🔧 MCP Server Infrastructure

### Active MCP Servers
- **filesystem** - File operations and project management
- **memory** - Context persistence across sessions
- **github** - GitHub API integration
- **n8n-mcp** - Workflow automation platform
- **playwright** - Browser automation and testing
- **shadcn-ui** - Modern UI component library
- **Ref** - Technical documentation search
- **mcp-youtube** - Video content processing

## 🚀 Quick Start

### 1. Installation
```bash
# Clone this repository
git clone https://github.com/langley232/claude-code.git
cd claude-code

# Run the setup script
chmod +x setup-agents.sh
./setup-agents.sh
```

### 2. Configuration
```bash
# Copy environment template
cp config/environment-template.env .env

# Edit .env with your actual values
nano .env
```

### 3. Usage Examples
```bash
# Comprehensive code review
claude @code-review-agent "Review this codebase for security vulnerabilities and performance issues"

# Advanced debugging
claude @debugger-agent "Debug this error and provide root cause analysis"

# Workflow automation
claude @workflow-agent "Create an automated workflow for processing form submissions"

# UI development
claude @frontend-ui-agent "Build a responsive dashboard using shadcn/ui components"
```

## 📁 Repository Structure

```
claude-code/
├── agents/                     # Agent configuration files
│   ├── workflow-agent.md
│   ├── github-agent.md
│   ├── code-review-agent.md
│   ├── debugger-agent.md
│   ├── frontend-ui-agent.md
│   ├── browser-testing-agent.md
│   ├── documentation-searcher.md
│   └── video-content-agent.md
├── config/                     # Configuration templates
│   ├── mcp-servers.json
│   └── environment-template.env
├── templates/                  # Review templates
│   ├── security-check.md
│   └── performance-check.md
├── infrastructure/             # Architecture documentation
│   ├── agent-security.md
│   └── current-implementation.md
├── setup-agents.sh            # Automated setup script
├── AGENT_INFRASTRUCTURE.md    # Complete documentation
└── README.md                  # This file
```

## 🛡️ Security Features

### Built-in Security Analysis
- **Vulnerability Detection** - SQL injection, XSS, authentication issues
- **Dependency Scanning** - Automated security vulnerability checks
- **Code Quality** - OWASP compliance and security best practices
- **Data Protection** - PII handling and encryption validation

### Secure Configuration
- Environment variable management
- Token security and rotation
- Minimal permission principles
- Audit logging and monitoring

## 🎪 Advanced Features

### Context Persistence
- **Memory Server** - Maintains context across review sessions
- **Pattern Recognition** - Learns from previous analyses
- **Knowledge Base** - Builds institutional knowledge over time

### Integration Capabilities
- **GitHub Integration** - PR reviews, issue tracking, repository management
- **Browser Automation** - E2E testing, UI validation, accessibility checks
- **Workflow Automation** - Business process automation with n8n
- **Documentation Access** - Real-time technical documentation lookup

## 📊 Performance Optimization

### Code Analysis
- Algorithm complexity analysis (O(n) notation)
- Memory leak detection and optimization
- Database query performance tuning
- Bundle size optimization

### Testing & Quality
- Automated security scanning
- Performance benchmarking
- Accessibility compliance testing
- Cross-browser compatibility validation

## 🔄 Workflow Templates

Pre-built templates for common review scenarios:
- **Security Reviews** - Comprehensive security vulnerability analysis
- **Performance Audits** - Performance bottleneck identification
- **Code Quality** - Best practices and maintainability reviews
- **Architecture Reviews** - Design pattern and system architecture evaluation

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add or modify agent configurations
4. Test with your Claude Code setup
5. Submit a pull request

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🆘 Support

For issues, questions, or contributions:
- Create an issue in this repository
- Check the [infrastructure documentation](infrastructure/)
- Review the [architecture guide](infrastructure/agent-security.md)

## 🎉 Acknowledgments

Built for the Claude Code ecosystem with contributions from the community. Special thanks to Anthropic for Claude Code and the Model Context Protocol (MCP) framework.

---

**Ready to supercharge your development workflow with AI-powered specialized agents!** 🚀