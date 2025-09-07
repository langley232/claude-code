/**
 * Stytch Authentication Service Wrapper
 * Handles Microsoft OAuth integration via Stytch B2B
 */

require('dotenv').config();
const stytch = require('stytch');

class StytchAuthService {
  constructor() {
    // Initialize Stytch B2B Client
    this.client = new stytch.B2BClient({
      project_id: process.env.STYTCH_PROJECT_ID,
      secret: process.env.STYTCH_SECRET,
      env: process.env.STYTCH_PROJECT_ENV === 'production' ? stytch.envs.live : stytch.envs.test
    });

    console.log('Stytch B2B Client initialized:', {
      project_id: process.env.STYTCH_PROJECT_ID,
      env: process.env.STYTCH_PROJECT_ENV
    });
  }

  /**
   * Generate Microsoft OAuth start URL for discovery flow
   * @param {string} redirectDomain - The domain to redirect after OAuth
   * @returns {string} OAuth start URL
   */
  generateMicrosoftOAuthURL(redirectDomain = 'http://localhost:3000') {
    const redirectURL = `${redirectDomain}/auth/microsoft/callback`;
    const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
    const baseUrl = process.env.STYTCH_PROJECT_ENV === 'production' 
      ? 'https://api.stytch.com' 
      : 'https://test.stytch.com';
    
    // Discovery flow for multi-tenant support
    const oauthUrl = `${baseUrl}/v1/b2b/public/oauth/microsoft/discovery/start?public_token=${publicToken}&discovery_redirect_url=${redirectURL}`;
    
    console.log('Generated Microsoft OAuth URL:', oauthUrl);
    return oauthUrl;
  }

  /**
   * Generate Microsoft OAuth start URL for specific organization
   * @param {string} orgSlug - Organization slug
   * @param {string} redirectDomain - The domain to redirect after OAuth
   * @returns {string} OAuth start URL
   */
  generateOrgSpecificOAuthURL(orgSlug, redirectDomain = 'http://localhost:3000') {
    const redirectURL = `${redirectDomain}/auth/microsoft/callback`;
    const publicToken = process.env.NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN;
    const baseUrl = process.env.STYTCH_PROJECT_ENV === 'production' 
      ? 'https://api.stytch.com' 
      : 'https://test.stytch.com';
    
    const oauthUrl = `${baseUrl}/v1/b2b/public/oauth/microsoft/start?public_token=${publicToken}&slug=${orgSlug}&login_redirect_url=${redirectURL}&signup_redirect_url=${redirectURL}`;
    
    console.log('Generated Organization OAuth URL:', oauthUrl);
    return oauthUrl;
  }

  /**
   * Handle OAuth discovery callback
   * @param {string} discoveryOAuthToken - Token from Stytch OAuth callback
   * @returns {Promise<Object>} Authentication result
   */
  async handleDiscoveryCallback(discoveryOAuthToken) {
    try {
      console.log('Processing discovery OAuth callback...');
      
      const authResult = await this.client.oauth.discovery.authenticate({
        discovery_oauth_token: discoveryOAuthToken,
      });

      console.log('Discovery authentication successful:', {
        intermediate_session_token: authResult.intermediate_session_token ? 'present' : 'missing',
        discovered_organizations: authResult.discovered_organizations?.length || 0
      });

      return {
        success: true,
        type: 'discovery',
        intermediate_session_token: authResult.intermediate_session_token,
        discovered_organizations: authResult.discovered_organizations,
        member_authenticated: authResult.member_authenticated
      };
    } catch (error) {
      console.error('Discovery OAuth callback error:', error);
      return {
        success: false,
        error: error.message,
        type: 'discovery'
      };
    }
  }

  /**
   * Handle organization-specific OAuth callback
   * @param {string} oauthToken - Token from Stytch OAuth callback
   * @param {number} sessionDurationMinutes - Session duration (default: 480 minutes / 8 hours)
   * @returns {Promise<Object>} Authentication result
   */
  async handleOAuthCallback(oauthToken, sessionDurationMinutes = 480) {
    try {
      console.log('Processing OAuth callback...');
      
      const authResult = await this.client.oauth.authenticate({
        oauth_token: oauthToken,
        session_duration_minutes: sessionDurationMinutes,
        session_custom_claims: {
          email_provider: 'microsoft',
          tenant: 'tridentinter.com',
          oauth_provider: 'microsoft'
        }
      });

      console.log('OAuth authentication successful:', {
        session_jwt: authResult.session_jwt ? 'present' : 'missing',
        member_id: authResult.member?.member_id,
        organization_id: authResult.organization?.organization_id
      });

      return {
        success: true,
        type: 'login',
        session_jwt: authResult.session_jwt,
        member: authResult.member,
        organization: authResult.organization,
        session: authResult.session
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      return {
        success: false,
        error: error.message,
        type: 'login'
      };
    }
  }

  /**
   * Create organization from discovery flow
   * @param {string} intermediateSessionToken - Token from discovery flow
   * @param {string} organizationName - Name of the organization to create
   * @param {number} sessionDurationMinutes - Session duration
   * @returns {Promise<Object>} Organization creation result
   */
  async createOrganization(intermediateSessionToken, organizationName, sessionDurationMinutes = 480) {
    try {
      console.log('Creating organization:', organizationName);
      
      const result = await this.client.discovery.organizations.create({
        intermediate_session_token: intermediateSessionToken,
        organization_name: organizationName,
        session_duration_minutes: sessionDurationMinutes,
        session_custom_claims: {
          email_provider: 'microsoft',
          tenant: 'tridentinter.com'
        }
      });

      console.log('Organization created successfully:', {
        organization_id: result.organization?.organization_id,
        session_jwt: result.session_jwt ? 'present' : 'missing'
      });

      return {
        success: true,
        session_jwt: result.session_jwt,
        member: result.member,
        organization: result.organization,
        session: result.session
      };
    } catch (error) {
      console.error('Organization creation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Exchange organization from discovery flow
   * @param {string} intermediateSessionToken - Token from discovery flow
   * @param {string} organizationId - ID of the organization to join
   * @param {number} sessionDurationMinutes - Session duration
   * @returns {Promise<Object>} Organization exchange result
   */
  async exchangeOrganization(intermediateSessionToken, organizationId, sessionDurationMinutes = 480) {
    try {
      console.log('Exchanging for organization:', organizationId);
      
      // Try different API paths based on Stytch SDK structure
      let result;
      try {
        result = await this.client.discovery.intermediateSessions.exchange({
        intermediate_session_token: intermediateSessionToken,
        organization_id: organizationId,
        session_duration_minutes: sessionDurationMinutes,
        session_custom_claims: {
          email_provider: 'microsoft',
          tenant: 'tridentinter.com'
        }
      });
      } catch (apiError) {
        console.log('First API path failed, trying alternative...', apiError.message);
        // Try alternative API path
        result = await this.client.oauth.discovery.intermediateSessions.exchange({
          intermediate_session_token: intermediateSessionToken,
          organization_id: organizationId,
          session_duration_minutes: sessionDurationMinutes
        });
      }

      console.log('Organization exchange successful:', {
        organization_id: result.organization?.organization_id,
        session_jwt: result.session_jwt ? 'present' : 'missing'
      });

      return {
        success: true,
        session_jwt: result.session_jwt,
        member: result.member,
        organization: result.organization,
        session: result.session
      };
    } catch (error) {
      console.error('Organization exchange error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Validate session JWT token
   * @param {string} sessionJWT - JWT token to validate
   * @returns {Promise<Object>} Session validation result
   */
  async validateSession(sessionJWT) {
    try {
      console.log('Validating session JWT...');
      
      const result = await this.client.sessions.authenticate({
        session_jwt: sessionJWT
      });

      console.log('Session validation successful:', {
        member_id: result.member?.member_id,
        organization_id: result.organization?.organization_id,
        session_id: result.session?.session_id
      });

      return {
        success: true,
        member: result.member,
        organization: result.organization,
        session: result.session
      };
    } catch (error) {
      console.error('Session validation error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Get Microsoft Graph access token from session
   * Note: This requires additional Stytch configuration to access OAuth provider tokens
   * @param {string} sessionJWT - Validated session JWT
   * @returns {Promise<Object>} Microsoft access token
   */
  async getMicrosoftAccessToken(sessionJWT) {
    try {
      // First validate the session
      const sessionResult = await this.validateSession(sessionJWT);
      if (!sessionResult.success) {
        throw new Error('Invalid session');
      }

      // Note: Direct access to OAuth provider tokens may require additional Stytch configuration
      // This is a placeholder for the actual implementation
      console.log('Getting Microsoft access token for session...');
      
      // TODO: Implement based on Stytch's OAuth provider token access patterns
      return {
        success: true,
        access_token: null, // Will be populated based on Stytch's API
        note: 'Microsoft Graph token access requires additional Stytch configuration'
      };
    } catch (error) {
      console.error('Microsoft token access error:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = StytchAuthService;