#!/usr/bin/env node

/**
 * Standalone MCP Server for Microsoft Email Integration
 * This creates a standalone MCP server that can be configured in Claude Code
 */

const EmailMCP = require('./EmailMCP');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/dist/cjs/server/stdio.js');
const { Server } = require('@modelcontextprotocol/sdk/dist/cjs/server/index.js');

async function main() {
    // Create the EmailMCP server instance
    const emailMCP = new EmailMCP(process.env, {
        sessionJWT: process.env.STYTCH_SESSION_JWT,
        userId: process.env.STYTCH_USER_ID,
        sessionId: process.env.STYTCH_SESSION_ID
    });

    // Initialize the EmailMCP
    await emailMCP.init();

    // Get the MCP server instance
    const server = emailMCP.server;

    // Create stdio transport for Claude Code integration
    const transport = new StdioServerTransport();
    
    // Start the server
    console.error('🚀 Microsoft Email MCP Server starting...');
    console.error('📧 Available tools: downloadEmails, vectorizeEmails, downloadAndVectorizeEmails, getAuthStatus, getGraphTokenStatus, searchEmails');
    console.error('🔗 Backend URL:', emailMCP.baseUrl);
    
    await server.connect(transport);
    console.error('✅ Microsoft Email MCP Server running');
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.error('🛑 Shutting down Microsoft Email MCP Server...');
    process.exit(0);
});

process.on('SIGTERM', async () => {
    console.error('🛑 Shutting down Microsoft Email MCP Server...');
    process.exit(0);
});

// Start the server
main().catch((error) => {
    console.error('❌ Failed to start Microsoft Email MCP Server:', error);
    process.exit(1);
});