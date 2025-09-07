/**
 * Microsoft OAuth Backend Service using Stytch B2B
 * Replaces direct Microsoft OAuth with Stytch-mediated authentication
 * 
 * Endpoints:
 * - GET /auth/microsoft/start - Initiate Microsoft OAuth via Stytch
 * - POST /auth/microsoft/callback - Handle OAuth callback from Stytch
 * - GET /auth/microsoft/organizations - Get available organizations (discovery flow)
 * - POST /auth/microsoft/select-org - Select/create organization
 * - GET /auth/validate - Validate session token
 * - GET /auth/microsoft/graph-token - Get Microsoft Graph API token
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const StytchAuthService = require('./stytch-service');

const app = express();
const port = process.env.PORT || 8080;

// Initialize Stytch service
const stytchService = new StytchAuthService();

// Middleware
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:8081',
    'http://localhost:8082',
    'https://your-frontend-domain.com', // Update with actual frontend domain
    /\.run\.app$/ // Allow Google Cloud Run services
  ],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'microsoft-stytch-backend',
    timestamp: new Date().toISOString(),
    stytch_env: process.env.STYTCH_PROJECT_ENV
  });
});

/**
 * Initiate Microsoft OAuth via Stytch Discovery Flow
 * GET /auth/microsoft/start
 * Query params:
 * - redirect_uri: Where to redirect after auth (optional, defaults to localhost:3000)
 * - org_slug: Specific organization slug (optional, uses discovery if not provided)
 */
app.get('/auth/microsoft/start', (req, res) => {
  try {
    const frontendRedirectUri = req.query.redirect_uri || 'http://localhost:8080';
    const orgSlug = req.query.org_slug;
    
    // Always use backend URL for Stytch callback
    const backendCallbackUrl = 'http://localhost:8080';

    console.log('Initiating Microsoft OAuth:', { frontendRedirectUri, backendCallbackUrl, orgSlug });

    let oauthUrl;
    if (orgSlug) {
      // Organization-specific OAuth
      oauthUrl = stytchService.generateOrgSpecificOAuthURL(orgSlug, backendCallbackUrl);
    } else {
      // Discovery flow for multi-tenant support
      oauthUrl = stytchService.generateMicrosoftOAuthURL(backendCallbackUrl);
    }

    // Redirect user to Stytch OAuth flow
    res.redirect(oauthUrl);
  } catch (error) {
    console.error('OAuth initiation error:', error);
    res.status(500).json({
      error: 'Failed to initiate OAuth',
      message: error.message
    });
  }
});

/**
 * Handle OAuth callback from Stytch OR direct Azure AD
 * POST /auth/microsoft/callback
 * Body: { token: string, stytch_token_type: string } OR { code: string, state: string }
 */
app.post('/auth/microsoft/callback', async (req, res) => {
  try {
    const { token, stytch_token_type, code, state } = req.body;
    
    // Handle direct Azure AD authorization code
    if (code && !token) {
      console.log('Processing direct Azure AD authorization code');
      
      // For now, simulate a successful authentication with mock data
      // In production, you would exchange the code for tokens using Microsoft Graph API
      const mockSession = {
        type: 'authenticated',
        session_jwt: `mock_jwt_${Date.now()}`,
        session_token: `mock_token_${Date.now()}`,
        member: {
          member_id: 'mock_member_id',
          email_address: 'rakib@tridentinter.com',
          name: 'Rakib Hasan',
          status: 'active',
          oauth_registrations: [{
            provider: 'microsoft',
            oauth_user_id: 'mock_user_id'
          }]
        },
        organization: {
          organization_id: 'mock_org_id',
          organization_name: 'TridentInter',
          organization_slug: 'tridentinter'
        }
      };
      
      return res.json(mockSession);
    }
    
    // Handle Stytch token (existing logic)
    if (!token) {
      return res.status(400).json({
        error: 'Missing token or code',
        message: 'OAuth token or authorization code is required'
      });
    }

    console.log('Processing Stytch OAuth callback:', { stytch_token_type });

    let result;
    if (stytch_token_type === 'discovery_oauth') {
      // Discovery flow - user may belong to multiple organizations
      result = await stytchService.handleDiscoveryCallback(token);
      
      if (result.success && result.discovered_organizations?.length > 0) {
        // User has multiple organizations - need to select one
        res.json({
          type: 'organization_selection',
          intermediate_session_token: result.intermediate_session_token,
          organizations: result.discovered_organizations,
          member_authenticated: result.member_authenticated
        });
      } else if (result.success && result.member_authenticated) {
        // User is already a member of an organization
        res.json({
          type: 'authenticated',
          session: result
        });
      } else {
        // New user - need to create organization
        res.json({
          type: 'create_organization',
          intermediate_session_token: result.intermediate_session_token
        });
      }
    } else {
      // Direct organization OAuth
      result = await stytchService.handleOAuthCallback(token);
      
      if (result.success) {
        res.json({
          type: 'authenticated',
          session_jwt: result.session_jwt,
          member: result.member,
          organization: result.organization
        });
      } else {
        res.status(400).json({
          error: 'Authentication failed',
          message: result.error
        });
      }
    }
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.status(500).json({
      error: 'OAuth callback failed',
      message: error.message
    });
  }
});

/**
 * Handle OAuth callback from Stytch (GET version)
 * GET /auth/microsoft/callback
 * Query params: token, stytch_token_type
 */
app.get('/auth/microsoft/callback', async (req, res) => {
  try {
    const { token, stytch_token_type } = req.query;
    
    if (!token) {
      return res.status(400).json({
        error: 'Missing token',
        message: 'OAuth token is required'
      });
    }

    console.log('Processing OAuth callback (GET):', { stytch_token_type });

    let result;
    if (stytch_token_type === 'discovery_oauth') {
      result = await stytchService.handleDiscoveryCallback(token);
      
      if (result.success && result.discovered_organizations?.length === 1) {
        // Auto-select single organization and authenticate
        const org = result.discovered_organizations[0];
        console.log('Auto-selecting organization:', org);
        try {
          // Organization ID is in org.organization.organization_id based on the discovery structure
          const orgId = org.organization?.organization_id || org.organization_id;
          console.log('Using organization ID:', orgId);
          
          const authResult = await stytchService.exchangeOrganization(
            result.intermediate_session_token, 
            orgId
          );
          
          const params = new URLSearchParams({
            type: 'authenticated',
            session: JSON.stringify(authResult)
          });
          res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
        } catch (authError) {
          console.error('Auto-authentication failed:', authError);
          // Fallback to organization selection
          const params = new URLSearchParams({
            type: 'organization_selection',
            token: result.intermediate_session_token,
            organizations: JSON.stringify(result.discovered_organizations)
          });
          res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
        }
      } else if (result.success && result.discovered_organizations?.length > 1) {
        // Multiple organizations - redirect to selection page
        const params = new URLSearchParams({
          type: 'organization_selection',
          token: result.intermediate_session_token,
          organizations: JSON.stringify(result.discovered_organizations)
        });
        res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
      } else if (result.success && result.member_authenticated) {
        // Redirect to frontend with session data
        const params = new URLSearchParams({
          type: 'authenticated',
          session: JSON.stringify(result)
        });
        res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
      } else {
        // Redirect to frontend for organization creation
        const params = new URLSearchParams({
          type: 'create_organization',
          token: result.intermediate_session_token
        });
        res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
      }
    } else {
      result = await stytchService.handleOAuthCallback(token);
      
      if (result.success) {
        const params = new URLSearchParams({
          type: 'authenticated',
          session: JSON.stringify(result)
        });
        res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
      } else {
        const params = new URLSearchParams({
          type: 'error',
          error: result.error
        });
        res.redirect(`http://localhost:8080/src/api/callback.html?${params}`);
      }
    }
  } catch (error) {
    console.error('OAuth callback error (GET):', error);
    const params = new URLSearchParams({
      type: 'error',
      error: error.message
    });
    res.redirect(`http://localhost:8081/oauth-callback.html?${params}`);
  }
});

/**
 * Create new organization (discovery flow)
 * POST /auth/microsoft/create-organization
 * Body: { intermediate_session_token: string, organization_name: string }
 */
app.post('/auth/microsoft/create-organization', async (req, res) => {
  try {
    const { intermediate_session_token, organization_name } = req.body;
    
    if (!intermediate_session_token || !organization_name) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'intermediate_session_token and organization_name are required'
      });
    }

    console.log('Creating organization:', organization_name);
    
    const result = await stytchService.createOrganization(
      intermediate_session_token,
      organization_name
    );

    if (result.success) {
      res.json({
        type: 'authenticated',
        session_jwt: result.session_jwt,
        member: result.member,
        organization: result.organization
      });
    } else {
      res.status(400).json({
        error: 'Organization creation failed',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Organization creation error:', error);
    res.status(500).json({
      error: 'Organization creation failed',
      message: error.message
    });
  }
});

/**
 * Select existing organization (discovery flow)
 * POST /auth/microsoft/select-organization
 * Body: { intermediate_session_token: string, organization_id: string }
 */
app.post('/auth/microsoft/select-organization', async (req, res) => {
  try {
    const { intermediate_session_token, organization_id } = req.body;
    
    if (!intermediate_session_token || !organization_id) {
      return res.status(400).json({
        error: 'Missing required fields',
        message: 'intermediate_session_token and organization_id are required'
      });
    }

    console.log('Selecting organization:', organization_id);
    
    const result = await stytchService.exchangeOrganization(
      intermediate_session_token,
      organization_id
    );

    if (result.success) {
      res.json({
        type: 'authenticated',
        session_jwt: result.session_jwt,
        member: result.member,
        organization: result.organization
      });
    } else {
      res.status(400).json({
        error: 'Organization selection failed',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Organization selection error:', error);
    res.status(500).json({
      error: 'Organization selection failed',
      message: error.message
    });
  }
});

/**
 * Validate session token
 * POST /auth/validate
 * Body: { session_jwt: string }
 */
app.post('/auth/validate', async (req, res) => {
  try {
    const { session_jwt } = req.body;
    
    if (!session_jwt) {
      return res.status(400).json({
        error: 'Missing session token',
        message: 'session_jwt is required'
      });
    }

    const result = await stytchService.validateSession(session_jwt);

    if (result.success) {
      res.json({
        valid: true,
        member: result.member,
        organization: result.organization,
        session: result.session
      });
    } else {
      res.status(401).json({
        valid: false,
        error: result.error
      });
    }
  } catch (error) {
    console.error('Session validation error:', error);
    res.status(500).json({
      valid: false,
      error: 'Session validation failed',
      message: error.message
    });
  }
});

/**
 * Get Microsoft Graph API access token
 * POST /auth/microsoft/graph-token
 * Body: { session_jwt: string }
 */
app.post('/auth/microsoft/graph-token', async (req, res) => {
  try {
    const { session_jwt } = req.body;
    
    if (!session_jwt) {
      return res.status(400).json({
        error: 'Missing session token',
        message: 'session_jwt is required'
      });
    }

    const result = await stytchService.getMicrosoftAccessToken(session_jwt);

    if (result.success) {
      res.json({
        access_token: result.access_token,
        note: result.note
      });
    } else {
      res.status(400).json({
        error: 'Failed to get Microsoft access token',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Microsoft token access error:', error);
    res.status(500).json({
      error: 'Microsoft token access failed',
      message: error.message
    });
  }
});

/**
 * Get user profile info
 * POST /auth/profile
 * Body: { session_jwt: string }
 */
app.post('/auth/profile', async (req, res) => {
  try {
    const { session_jwt } = req.body;
    
    if (!session_jwt) {
      return res.status(400).json({
        error: 'Missing session token'
      });
    }

    const result = await stytchService.validateSession(session_jwt);

    if (result.success) {
      res.json({
        member: {
          member_id: result.member.member_id,
          email_address: result.member.email_address,
          name: result.member.name,
          status: result.member.status,
          oauth_registrations: result.member.oauth_registrations
        },
        organization: {
          organization_id: result.organization.organization_id,
          organization_name: result.organization.organization_name,
          organization_slug: result.organization.organization_slug
        }
      });
    } else {
      res.status(401).json({
        error: 'Invalid session',
        message: result.error
      });
    }
  } catch (error) {
    console.error('Profile access error:', error);
    res.status(500).json({
      error: 'Profile access failed',
      message: error.message
    });
  }
});

// Serve static files from the parent statsai-electron directory
app.use(express.static('../../', {
  index: false, // Don't serve index.html by default
  setHeaders: (res, path) => {
    // Set proper MIME types for specific file types
    if (path.endsWith('.js')) {
      res.setHeader('Content-Type', 'application/javascript');
    } else if (path.endsWith('.html')) {
      res.setHeader('Content-Type', 'text/html');
    } else if (path.endsWith('.css')) {
      res.setHeader('Content-Type', 'text/css');
    }
  }
}));

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// Start server
app.listen(port, () => {
  console.log(`🚀 Microsoft-Stytch Backend Service running on port ${port}`);
  console.log(`📝 Environment: ${process.env.STYTCH_PROJECT_ENV}`);
  console.log(`🔑 Stytch Project: ${process.env.STYTCH_PROJECT_ID}`);
  console.log(`\n📋 Available endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /auth/microsoft/start`);
  console.log(`   POST /auth/microsoft/callback`);
  console.log(`   POST /auth/microsoft/create-organization`);
  console.log(`   POST /auth/microsoft/select-organization`);
  console.log(`   POST /auth/validate`);
  console.log(`   POST /auth/microsoft/graph-token`);
  console.log(`   POST /auth/profile`);
});

module.exports = app;