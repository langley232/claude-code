# Microsoft OAuth AuthHandler Service

This service handles Microsoft Entra ID (Azure AD) OAuth authentication for the AtlasWeb Email Assistant, providing secure token exchange for Outlook/Exchange email access.

## Architecture

**Clean Separation**: This service is completely isolated from the Google OAuth system, following the recommended architecture:
- **Frontend**: `microsoft-oauth.js` - Handles OAuth flow initiation and callback processing
- **Backend**: `authhandler-backend.js` - Token exchange and refresh endpoint service
- **Deployment**: Independent Cloud Run service with its own container and secrets

## Configuration

### Azure AD Application Registration
- **Client ID**: `1701d37c-ee90-45e5-8476-1d235cab71a0`
- **Tenant ID**: `9cef4078-3934-49cd-b448-c0d1d2f482fc`
- **Scopes**: Mail.Read, User.Read, Mail.ReadBasic, offline_access
- **Authority**: `https://login.microsoftonline.com/organizations`

### Required Secrets (Google Cloud Secret Manager)
- `microsoft-oauth-client-secret` - Azure AD application client secret
- `microsoft-user-refresh-token-{userEmail}` - Per-user refresh tokens (auto-created)

## Deployment

### Prerequisites
```bash
# Ensure Google Cloud CLI is authenticated
gcloud auth login
gcloud config set project solid-topic-466217-t9
```

### Deploy Service
```bash
cd login/microsoft
./deploy-microsoft-auth.sh
```

### Create Client Secret
```bash
# Create the Microsoft client secret in Secret Manager
echo "YOUR_MICROSOFT_CLIENT_SECRET" | gcloud secrets create microsoft-oauth-client-secret --data-file=-
```

## API Endpoints

### POST /auth/microsoft/token
Exchange Microsoft authorization code for access tokens.

**Request**:
```json
{
  "code": "microsoft_authorization_code"
}
```

**Response**:
```json
{
  "access_token": "access_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "token_type": "Bearer",
  "scope": "https://graph.microsoft.com/Mail.Read..."
}
```

### POST /auth/microsoft/refresh
Refresh expired Microsoft access tokens.

**Request**:
```json
{
  "refresh_token": "refresh_token"
}
```

**Response**:
```json
{
  "access_token": "new_access_token",
  "refresh_token": "refresh_token",
  "expires_in": 3600,
  "token_type": "Bearer"
}
```

### GET /health
Health check endpoint.

## Integration

### Frontend Usage
```javascript
// Initialize Microsoft OAuth
const microsoftOAuth = new MicrosoftOAuthHandler();

// Connect to Microsoft
microsoftOAuth.connectMicrosoft();

// Check authentication status
const status = microsoftOAuth.getAuthStatus();
```

### Email Assistant Integration
The service automatically integrates with the email assistant through custom events:
- `microsoft_auth_success` - Authentication completed successfully
- `microsoft_auth_error` - Authentication failed
- `microsoft_auth_disconnected` - User logged out

## Security Features

- **State Parameter**: CSRF protection with secure random state tokens
- **Token Storage**: Refresh tokens securely stored in Google Cloud Secret Manager
- **Automatic Cleanup**: Local token cleanup on expiration
- **Error Handling**: Comprehensive error handling and logging

## Development

### Local Testing
```bash
# Install dependencies
npm install

# Run locally
npm run dev
```

### Docker Build
```bash
docker build -t microsoft-authhandler .
docker run -p 8080:8080 microsoft-authhandler
```

## Production URLs

After deployment, the service will be available at:
- Production: `https://microsoft-authhandler-[hash]-uc.a.run.app`
- Health Check: `https://microsoft-authhandler-[hash]-uc.a.run.app/health`

## Next Steps

1. ✅ Backend service created and ready for deployment  
2. ✅ Frontend integration completed  
3. ✅ Security measures implemented  
4. 🔄 **Deploy service to Cloud Run**  
5. 🔄 **Create Microsoft client secret**  
6. 🔄 **Update frontend with production URL**  
7. 🔄 **Test end-to-end OAuth flow**