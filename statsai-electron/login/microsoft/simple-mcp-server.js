#!/usr/bin/env node

/**
 * Simple Stytch Email MCP Server
 * Provides email management tools via Model Context Protocol
 */

const { Server } = require("@modelcontextprotocol/sdk/server/index.js");
const { StdioServerTransport } = require("@modelcontextprotocol/sdk/server/stdio.js");

// Backend URL
const BACKEND_URL = 'http://localhost:8080';

// Make authenticated requests to the backend
async function makeBackendRequest(endpoint, method = 'GET', body = null) {
    const url = `${BACKEND_URL}${endpoint}`;
    const options = {
        method,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    if (body && method !== 'GET') {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(url, options);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`Backend request failed: ${endpoint}`, error.message);
        throw error;
    }
}

const server = new Server(
  {
    name: "stytch-email-server",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
      resources: {}
    }
  }
);

// Tool: Download Emails
server.setRequestHandler("tools/call", async (request, extra) => {
  if (request.params.name === "downloadEmails") {
    try {
      const { maxResults = 50, sessionJWT } = request.params.arguments || {};
      
      const response = await makeBackendRequest('/emails/download', 'POST', {
        session_jwt: sessionJWT || process.env.STYTCH_SESSION_JWT,
        maxResults
      });

      return {
        content: [{
          type: "text",
          text: `Successfully downloaded ${response.count || 0} emails.\n\nDetails:\n${JSON.stringify(response, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text", 
          text: `Failed to download emails: ${error.message}`
        }]
      };
    }
  }

  // Tool: Vectorize Emails  
  if (request.params.name === "vectorizeEmails") {
    try {
      const { vectorProvider = 'gemini', sessionJWT } = request.params.arguments || {};
      
      const response = await makeBackendRequest('/emails/vectorize', 'POST', {
        session_jwt: sessionJWT || process.env.STYTCH_SESSION_JWT,
        vectorProvider
      });

      return {
        content: [{
          type: "text",
          text: `Successfully vectorized emails using ${vectorProvider}.\n\nDetails:\n${JSON.stringify(response, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to vectorize emails: ${error.message}`
        }]
      };
    }
  }

  // Tool: Download and Vectorize
  if (request.params.name === "downloadAndVectorizeEmails") {
    try {
      const { maxResults = 50, vectorProvider = 'gemini', sessionJWT } = request.params.arguments || {};
      
      const response = await makeBackendRequest('/emails/download-and-vectorize', 'POST', {
        session_jwt: sessionJWT || process.env.STYTCH_SESSION_JWT,
        maxResults,
        vectorProvider
      });

      return {
        content: [{
          type: "text",
          text: `Successfully processed ${response.processedCount || 0} emails.\n\nDetails:\n${JSON.stringify(response, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to process emails: ${error.message}`
        }]
      };
    }
  }

  // Tool: Check Auth Status
  if (request.params.name === "checkAuthStatus") {
    try {
      const { sessionJWT } = request.params.arguments || {};
      
      const response = await makeBackendRequest('/auth/validate', 'POST', {
        session_jwt: sessionJWT || process.env.STYTCH_SESSION_JWT
      });

      return {
        content: [{
          type: "text",
          text: `Authentication Status:\n${JSON.stringify(response, null, 2)}`
        }]
      };
    } catch (error) {
      return {
        content: [{
          type: "text",
          text: `Failed to check auth status: ${error.message}`
        }]
      };
    }
  }

  throw new Error(`Unknown tool: ${request.params.name}`);
});

// List available tools
server.setRequestHandler("tools/list", async () => {
  return {
    tools: [
      {
        name: "downloadEmails",
        description: "Download emails from Microsoft Graph API",
        inputSchema: {
          type: "object",
          properties: {
            maxResults: { type: "number", description: "Maximum emails to download (default: 50)" },
            sessionJWT: { type: "string", description: "Stytch session JWT token" }
          }
        }
      },
      {
        name: "vectorizeEmails", 
        description: "Process and vectorize downloaded emails",
        inputSchema: {
          type: "object",
          properties: {
            vectorProvider: { type: "string", description: "Vector provider: gemini, google, tigergraph (default: gemini)" },
            sessionJWT: { type: "string", description: "Stytch session JWT token" }
          }
        }
      },
      {
        name: "downloadAndVectorizeEmails",
        description: "Download and vectorize emails in one operation", 
        inputSchema: {
          type: "object",
          properties: {
            maxResults: { type: "number", description: "Maximum emails to process (default: 50)" },
            vectorProvider: { type: "string", description: "Vector provider (default: gemini)" },
            sessionJWT: { type: "string", description: "Stytch session JWT token" }
          }
        }
      },
      {
        name: "checkAuthStatus",
        description: "Check Microsoft OAuth authentication status",
        inputSchema: {
          type: "object", 
          properties: {
            sessionJWT: { type: "string", description: "Stytch session JWT token" }
          }
        }
      }
    ]
  };
});

async function runServer() {
  const transport = new StdioServerTransport();
  console.error("🚀 Stytch Email MCP Server starting...");
  console.error("📧 Backend URL:", BACKEND_URL);
  console.error("✅ Available tools: downloadEmails, vectorizeEmails, downloadAndVectorizeEmails, checkAuthStatus");
  
  await server.connect(transport);
  console.error("📡 Stytch Email MCP Server running");
}

runServer().catch(console.error);