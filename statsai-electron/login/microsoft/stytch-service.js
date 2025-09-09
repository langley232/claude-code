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

    // Debug client structure
    console.log('Client structure available:', {
      discovery: !!this.client.discovery,
      oauth: !!this.client.oauth,
      sessions: !!this.client.sessions,
      organizations: !!this.client.organizations
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
      console.log('Client structure:', {
        discovery: !!this.client.discovery,
        intermediateSessions: !!this.client.discovery?.intermediateSessions,
        exchange: !!this.client.discovery?.intermediateSessions?.exchange,
        organizations: !!this.client.organizations,
        sessions: !!this.client.sessions
      });
      
      // Try different API paths based on Stytch SDK structure
      let result;
      
      // Method 1: Try discovery.intermediateSessions.exchange (original)
      if (this.client.discovery?.intermediateSessions?.exchange) {
        console.log('🔄 Trying discovery.intermediateSessions.exchange...');
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
          console.log('✅ Method 1 succeeded');
        } catch (apiError) {
          console.log('❌ Method 1 failed:', apiError.message);
          throw apiError;
        }
      }
      
      // Method 2: Try organizations API if discovery failed
      else if (this.client.organizations?.members?.exchange) {
        console.log('🔄 Trying organizations.members.exchange...');
        try {
          result = await this.client.organizations.members.exchange({
            intermediate_session_token: intermediateSessionToken,
            organization_id: organizationId,
            session_duration_minutes: sessionDurationMinutes
          });
          console.log('✅ Method 2 succeeded');
        } catch (apiError) {
          console.log('❌ Method 2 failed:', apiError.message);
          throw apiError;
        }
      }
      
      // Method 3: Try sessions API
      else if (this.client.sessions?.exchange) {
        console.log('🔄 Trying sessions.exchange...');
        try {
          result = await this.client.sessions.exchange({
            intermediate_session_token: intermediateSessionToken,
            organization_id: organizationId,
            session_duration_minutes: sessionDurationMinutes
          });
          console.log('✅ Method 3 succeeded');
        } catch (apiError) {
          console.log('❌ Method 3 failed:', apiError.message);
          throw apiError;
        }
      }
      
      // Method 4: Direct API call if all SDK methods fail
      else {
        console.log('🔄 All SDK methods unavailable, trying direct API call...');
        const baseUrl = process.env.STYTCH_PROJECT_ENV === 'production' 
          ? 'https://api.stytch.com' 
          : 'https://test.stytch.com';
        
        const response = await fetch(`${baseUrl}/v1/b2b/discovery/intermediate_sessions/exchange`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.STYTCH_SECRET}`
          },
          body: JSON.stringify({
            intermediate_session_token: intermediateSessionToken,
            organization_id: organizationId,
            session_duration_minutes: sessionDurationMinutes
          })
        });
        
        if (!response.ok) {
          throw new Error(`Direct API call failed: ${response.status} ${response.statusText}`);
        }
        
        result = await response.json();
        console.log('✅ Direct API call succeeded');
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

      console.log('Getting Microsoft access token for session...');
      
      // Try to get OAuth connection info from Stytch session
      const member = sessionResult.member;
      console.log('🔍 Available OAuth registrations:', member.oauth_registrations?.map(reg => ({
        provider_type: reg.provider_type,
        id: reg.member_oauth_registration_id,
        provider_subject: reg.provider_subject
      })));
      
      const oauthRegistration = member.oauth_registrations?.find(
        reg => reg.provider_type?.toLowerCase() === 'microsoft'
      );

      if (!oauthRegistration) {
        console.error('❌ No Microsoft OAuth registration found');
        console.error('Available providers:', member.oauth_registrations?.map(r => r.provider_type));
        throw new Error('No Microsoft OAuth registration found');
      }

      console.log('✅ Found Microsoft OAuth registration:', {
        id: oauthRegistration.member_oauth_registration_id,
        provider_subject: oauthRegistration.provider_subject,
        provider_type: oauthRegistration.provider_type
      });

      // Method 1: Try correct Stytch B2B organizations API method
      try {
        console.log('🔄 Trying Method 1: Stytch B2B organizations.members.oauthProviders.microsoft...');
        const providerTokenResult = await this.client.organizations.members.oauthProviders.microsoft({
          organization_id: sessionResult.organization.organization_id,
          member_id: sessionResult.member.member_id,
          include_refresh_token: true
        });
        
        if (providerTokenResult.access_token) {
          console.log('✅ Method 1 SUCCESS: Retrieved Microsoft access token from Stytch B2B API');
          return {
            success: true,
            access_token: providerTokenResult.access_token,
            refresh_token: providerTokenResult.refresh_token,
            expires_in: providerTokenResult.access_token_expires_in,
            scope: providerTokenResult.scopes,
            id_token: providerTokenResult.id_token,
            provider_subject: providerTokenResult.provider_subject,
            source: 'stytch_b2b_organizations_api'
          };
        }
      } catch (stytchError) {
        console.log('❌ Method 1 failed:', stytchError.message);
        console.log('🔍 Available methods on client.organizations.members:', Object.keys(this.client.organizations?.members || {}));
        console.log('🔍 Available methods on oauthProviders:', Object.keys(this.client.organizations?.members?.oauthProviders || {}));
      }

      // Method 2: Direct API call to Stytch B2B Microsoft OAuth endpoint  
      try {
        console.log('🔄 Trying Method 2: Direct Stytch B2B API call...');
        const baseUrl = process.env.STYTCH_PROJECT_ENV === 'production' 
          ? 'https://api.stytch.com' 
          : 'https://test.stytch.com';
        
        const apiUrl = `${baseUrl}/v1/b2b/organizations/${sessionResult.organization.organization_id}/members/${sessionResult.member.member_id}/oauth_providers/microsoft?include_refresh_token=true`;
        
        console.log('📡 API URL:', apiUrl);
        
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${process.env.STYTCH_SECRET}`,
            'Content-Type': 'application/json'
          }
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`API call failed: ${response.status} ${response.statusText} - ${errorText}`);
        }
        
        const directApiResult = await response.json();
        console.log('✅ Method 2 SUCCESS: Retrieved Microsoft access token via direct API');
        console.log('📋 Token details:', {
          access_token: directApiResult.access_token ? 'present' : 'missing',
          expires_in: directApiResult.access_token_expires_in,
          scopes: directApiResult.scopes?.length || 0,
          provider_subject: directApiResult.provider_subject
        });
        
        if (directApiResult.access_token) {
          return {
            success: true,
            access_token: directApiResult.access_token,
            refresh_token: directApiResult.refresh_token,
            expires_in: directApiResult.access_token_expires_in,
            scope: directApiResult.scopes,
            id_token: directApiResult.id_token,
            provider_subject: directApiResult.provider_subject,
            source: 'stytch_direct_api'
          };
        }
      } catch (directApiError) {
        console.log('❌ Method 2 failed:', directApiError.message);
      }

      // Method 3: Alternative SDK path exploration
      try {
        console.log('🔄 Trying Method 3: Alternative SDK paths...');
        
        // Try different possible SDK structures
        const possiblePaths = [
          'this.client.organizations.members.microsoft',
          'this.client.organizations.oauthProviders.microsoft', 
          'this.client.oauthProviders.microsoft',
          'this.client.oauth.microsoft'
        ];
        
        for (const path of possiblePaths) {
          try {
            console.log(`🔍 Checking path: ${path}`);
            const pathParts = path.split('.').slice(1); // Remove 'this.client'
            let current = this.client;
            
            for (const part of pathParts) {
              if (current && current[part]) {
                current = current[part];
              } else {
                current = null;
                break;
              }
            }
            
            if (current && typeof current === 'function') {
              console.log(`✨ Found working path: ${path}`);
              const result = await current({
                organization_id: sessionResult.organization.organization_id,
                member_id: sessionResult.member.member_id,
                include_refresh_token: true
              });
              
              if (result.access_token) {
                console.log('✅ Method 3 SUCCESS: Retrieved tokens via alternative path');
                return {
                  success: true,
                  access_token: result.access_token,
                  refresh_token: result.refresh_token,
                  expires_in: result.access_token_expires_in,
                  scope: result.scopes,
                  source: 'alternative_sdk_path'
                };
              }
            }
          } catch (pathError) {
            console.log(`❌ Path ${path} failed:`, pathError.message);
          }
        }
        
      } catch (explorationError) {
        console.log('❌ Method 3 failed:', explorationError.message);
      }

      // Method 2: Alternative - Use stored tokens or redirect to Microsoft
      // For now, return structured response indicating what's needed
      return {
        success: false,
        error: 'Microsoft Graph token access requires configuration',
        needs_setup: true,
        instructions: [
          '1. Configure Microsoft Graph API permissions in Azure AD',
          '2. Add Mail.Read, Mail.ReadWrite, Mail.Send permissions',
          '3. Grant admin consent for your tenant',
          '4. Configure Stytch OAuth provider token access'
        ],
        azure_app_id: process.env.AZURE_CLIENT_ID || '313c822a-94d8-4913-b289-9c01ffb63c95',
        required_permissions: [
          'Mail.Read',
          'Mail.ReadWrite', 
          'Mail.Send',
          'User.Read',
          'offline_access'
        ]
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