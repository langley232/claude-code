#!/bin/bash

# Setup script for Claude Code specialized agents
echo "🚀 Setting up Claude Code specialized agents..."

# Create agents directory if it doesn't exist
AGENTS_DIR="$HOME/.claude/agents"
mkdir -p "$AGENTS_DIR"

# List of agent files to copy
AGENT_FILES=(
    "workflow-agent.md"
    "github-agent.md"
    "browser-testing-agent.md"
    "frontend-ui-agent.md"
    "video-content-agent.md"
    "code-review-agent.md"
    "debugger-agent.md"
    "internet-search-agent.md"
)

# Copy agent files to Claude agents directory
echo "📁 Copying agent configurations..."
for agent in "${AGENT_FILES[@]}"; do
    if [ -f "$agent" ]; then
        cp "$agent" "$AGENTS_DIR/"
        echo "✅ Copied $agent to $AGENTS_DIR"
    else
        echo "❌ Warning: $agent not found in current directory"
    fi
done

# Copy existing documentation-searcher if it exists
if [ -f "$AGENTS_DIR/documentation-searcher.md" ]; then
    echo "✅ documentation-searcher.md already exists"
else
    echo "⚠️  Note: documentation-searcher.md not found - create it manually if needed"
fi

echo ""
echo "🎉 Agent setup complete!"
echo ""
echo "Available agents:"
echo "  • workflow-agent - n8n workflow automation"
echo "  • github-agent - GitHub repository management"
echo "  • browser-testing-agent - Playwright browser automation"
echo "  • frontend-ui-agent - shadcn/ui frontend development"
echo "  • video-content-agent - YouTube content analysis"
echo "  • documentation-searcher - Technical documentation search"
echo "  • code-review-agent - Comprehensive code review and security analysis"
echo "  • debugger-agent - Advanced debugging and troubleshooting"
echo "  • internet-search-agent - Web scraping and research with Firecrawl"
echo ""
echo "Usage:"
echo "  claude @workflow-agent 'Create a webhook workflow'"
echo "  claude @github-agent 'Review this pull request'"
echo "  claude @browser-testing-agent 'Test the login form'"
echo "  claude @frontend-ui-agent 'Create a dashboard with shadcn/ui'"
echo "  claude @video-content-agent 'Analyze this tutorial video'"
echo "  claude @documentation-searcher 'Find React documentation'"
echo "  claude @code-review-agent 'Review this codebase for security issues'"
echo "  claude @debugger-agent 'Debug this error and find the root cause'"
echo "  claude @internet-search-agent 'Research competitor pricing and extract data'"
echo ""
echo "Verify setup: claude /agents"