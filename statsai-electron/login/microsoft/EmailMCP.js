/**
 * EmailMCP - Model Context Protocol Server for Microsoft Email Integration
 * Based on Stytch MCP TodoMCP pattern, adapted for email functionality
 * Integrates with existing Microsoft-Stytch backend service
 */

const { McpServer } = require('@modelcontextprotocol/sdk/dist/cjs/server/mcp.js');
const StytchAuthService = require('./stytch-service');

class EmailMCP {
    constructor(env, authContext) {
        this.env = env;
        this.authContext = authContext;
        this.stytchService = new StytchAuthService();
        this.baseUrl = 'http://localhost:8080'; // Microsoft-Stytch backend URL
    }

    async init() {
        console.log('📧 EmailMCP initialized with auth context:', {
            userId: this.authContext?.userId,
            sessionId: this.authContext?.sessionId
        });
    }

    formatResponse(description, data) {
        return {
            content: [{
                type: "text",
                text: `Success! ${description}\n\nResult:\n${JSON.stringify(data, null, 2)}`
            }]
        };
    }

    formatErrorResponse(description, error) {
        return {
            content: [{
                type: "text",
                text: `Error: ${description}\n\nDetails:\n${error.message || error}`
            }]
        };
    }

    async makeAuthenticatedRequest(endpoint, method = 'GET', body = null) {
        const url = `${this.baseUrl}${endpoint}`;
        const options = {
            method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.authContext.sessionJWT}`
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
            console.error(`❌ EmailMCP API request failed:`, error);
            throw error;
        }
    }

    get server() {
        const server = new McpServer({
            name: 'Microsoft Email Service',
            version: '1.0.0',
        });

        // Email Resources - individual emails and email lists
        server.resource("Emails", {
            list: async () => {
                try {
                    const response = await this.makeAuthenticatedRequest('/emails/list', 'GET');
                    return {
                        resources: (response.emails || []).map(email => ({
                            name: email.subject || 'No Subject',
                            uri: `email://microsoft/${email.id}`,
                            description: `From: ${email.from?.emailAddress?.address || 'Unknown'}`
                        }))
                    };
                } catch (error) {
                    console.error('Failed to list emails:', error);
                    return { resources: [] };
                }
            }
        }, async (uri) => {
            const emailId = uri.pathname.split('/').pop();
            try {
                const response = await this.makeAuthenticatedRequest(`/emails/get/${emailId}`, 'GET');
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Subject: ${response.subject}\nFrom: ${response.from?.emailAddress?.address}\nBody: ${response.bodyPreview || response.body}`
                    }]
                };
            } catch (error) {
                return {
                    contents: [{
                        uri: uri.href,
                        text: `Error loading email: ${error.message}`
                    }]
                };
            }
        });

        // Tool: Download Emails
        server.tool('downloadEmails', 'Download emails from Microsoft Graph API', {
            maxResults: { type: 'number', description: 'Maximum number of emails to download (default: 50)', optional: true },
            folder: { type: 'string', description: 'Email folder to download from (default: inbox)', optional: true }
        }, async ({ maxResults = 50, folder = 'inbox' }) => {
            try {
                const response = await this.makeAuthenticatedRequest('/emails/download', 'POST', {
                    session_jwt: this.authContext.sessionJWT,
                    maxResults,
                    folder
                });
                return this.formatResponse(`Downloaded ${response.count || 0} emails from ${folder}`, response);
            } catch (error) {
                return this.formatErrorResponse('Failed to download emails', error);
            }
        });

        // Tool: Vectorize Emails
        server.tool('vectorizeEmails', 'Process and vectorize downloaded emails', {
            vectorProvider: { type: 'string', description: 'Vector provider (gemini, google, tigergraph)', optional: true },
            batchSize: { type: 'number', description: 'Batch size for processing (default: 10)', optional: true }
        }, async ({ vectorProvider = 'gemini', batchSize = 10 }) => {
            try {
                const response = await this.makeAuthenticatedRequest('/emails/vectorize', 'POST', {
                    session_jwt: this.authContext.sessionJWT,
                    vectorProvider,
                    batchSize
                });
                return this.formatResponse(`Vectorized emails using ${vectorProvider}`, response);
            } catch (error) {
                return this.formatErrorResponse('Failed to vectorize emails', error);
            }
        });

        // Tool: Download and Vectorize (Combined)
        server.tool('downloadAndVectorizeEmails', 'Download and vectorize emails in one operation', {
            maxResults: { type: 'number', description: 'Maximum number of emails to process (default: 50)', optional: true },
            vectorProvider: { type: 'string', description: 'Vector provider (gemini, google, tigergraph)', optional: true }
        }, async ({ maxResults = 50, vectorProvider = 'gemini' }) => {
            try {
                const response = await this.makeAuthenticatedRequest('/emails/download-and-vectorize', 'POST', {
                    session_jwt: this.authContext.sessionJWT,
                    maxResults,
                    vectorProvider
                });
                return this.formatResponse(`Processed ${response.processedCount || 0} emails with ${vectorProvider}`, response);
            } catch (error) {
                return this.formatErrorResponse('Failed to download and vectorize emails', error);
            }
        });

        // Tool: Get Authentication Status
        server.tool('getAuthStatus', 'Check Microsoft OAuth authentication status', {}, async () => {
            try {
                const response = await this.makeAuthenticatedRequest('/auth/validate', 'POST', {
                    session_jwt: this.authContext.sessionJWT
                });
                return this.formatResponse('Authentication status retrieved', {
                    authenticated: response.success,
                    user: response.member,
                    organization: response.organization
                });
            } catch (error) {
                return this.formatErrorResponse('Failed to check authentication status', error);
            }
        });

        // Tool: Get Microsoft Graph Token Status
        server.tool('getGraphTokenStatus', 'Check Microsoft Graph API token availability', {}, async () => {
            try {
                const response = await this.makeAuthenticatedRequest('/auth/microsoft/graph-token', 'POST', {
                    session_jwt: this.authContext.sessionJWT
                });
                return this.formatResponse('Microsoft Graph token status retrieved', response);
            } catch (error) {
                return this.formatErrorResponse('Failed to get Graph token status', error);
            }
        });

        // Tool: Search Emails
        server.tool('searchEmails', 'Search emails by keywords', {
            query: { type: 'string', description: 'Search query for emails' },
            maxResults: { type: 'number', description: 'Maximum number of results (default: 20)', optional: true }
        }, async ({ query, maxResults = 20 }) => {
            try {
                const response = await this.makeAuthenticatedRequest('/emails/search', 'POST', {
                    session_jwt: this.authContext.sessionJWT,
                    query,
                    maxResults
                });
                return this.formatResponse(`Found ${response.results?.length || 0} emails matching "${query}"`, response);
            } catch (error) {
                return this.formatErrorResponse('Failed to search emails', error);
            }
        });

        return server;
    }

    // Static method for Claude Code MCP integration
    static createServer(config = {}) {
        const authContext = {
            sessionJWT: process.env.STYTCH_SESSION_JWT || config.sessionJWT,
            userId: process.env.STYTCH_USER_ID || config.userId,
            sessionId: process.env.STYTCH_SESSION_ID || config.sessionId
        };

        const emailMCP = new EmailMCP(process.env, authContext);
        return emailMCP.server;
    }
}

module.exports = EmailMCP;