# Login Infrastructure Documentation

## Overview
Complete infrastructure setup for AtlasWeb AI authentication system using Google Cloud Platform (GCP) services, Mailgun email delivery, and Plaid payment processing.

## Google Cloud Platform (GCP) Setup

### Project Information
- **Project ID**: solid-topic-466217-t9
- **Project Name**: statsai-439413
- **Region**: us-central1

### Cloud Functions
#### Authentication Handler
- **Function Name**: authHandler
- **URL**: https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler
- **Runtime**: Node.js 20
- **Memory**: 512 MB
- **Timeout**: 60 seconds
- **Environment Variables**:
  - PLAID_CLIENT_ID: (from Secret Manager)
  - PLAID_SECRET: (from Secret Manager)  
  - PLAID_ENV: sandbox
  - PLAID_WEBHOOK_URL: https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler/webhook/plaid
  - MAILGUN_API_KEY: (from Secret Manager)
  - MAILGUN_DOMAIN: sandbox8c7e772e4393430f8ba13b764b0f40f6.mailgun.org

#### Endpoints
- `POST /register` - User registration with email verification
- `POST /login` - JWT authentication
- `GET /verify-email` - Email verification handler
- `POST /create-link-token` - Plaid Link token generation
- `POST /create-payment-intent` - Plaid payment processing
- `POST /complete-payment` - Payment completion and account activation
- `POST /test-verify-user` - Manual user verification (testing)
- `POST /webhook/plaid` - Plaid webhook handler

### Firestore Database
- **Database**: (default)
- **Location**: us-central1
- **Collections**:
  - `users`: User account information, verification status, payment records
  - `payments`: Payment transaction logs and status
  - `email_verifications`: Email verification tokens and expiry

### Secret Manager
Stored secrets:
- `plaid-client-id`: Plaid API client identifier
- `plaid-secret`: Plaid API secret key
- `mailgun-api-key`: Mailgun API authentication key

### IAM & Security
- Cloud Functions service account with permissions:
  - Firestore read/write access
  - Secret Manager accessor role
  - Cloud Functions invoker role

## Plaid Payment Integration

### Configuration
- **Environment**: Sandbox (testing)
- **Products**: Transfer, Auth
- **Country Codes**: US
- **Webhook URL**: https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler/webhook/plaid

### Payment Flow
1. User completes registration form
2. Plaid Link opens for bank account connection
3. User authorizes bank account access
4. Frontend sends public_token to backend
5. Backend exchanges for access_token
6. Payment intent created with Plaid Transfer API
7. ACH transfer initiated ($20, $200, or $300 based on plan)
8. Webhook confirmation triggers account activation
9. User receives email confirmation

### Cost Structure
- **ACH Transfer Fee**: $0.25 per transaction (vs Stripe 2.9% + $0.30)
- **Savings Example**: $200 payment = $0.25 (Plaid) vs $6.10 (Stripe)

## Email Infrastructure Evolution

### Attempted Solutions
1. **IONOS SMTP** (Failed)
   - Host: smtp.ionos.com
   - Ports tried: 587, 465, 25
   - Issues: Authentication failures, connection timeouts
   
2. **Gmail SMTP** (Failed)
   - Host: smtp.gmail.com
   - Port: 587
   - Issues: App Password configuration difficulties

3. **Custom SMTP Server** (Testing Only)
   - Local server on port 2525
   - Used for development email capture
   - Not suitable for production

4. **Mailgun API** (Final Solution)
   - Reliable email delivery service
   - Sandbox domain for testing
   - Production-ready infrastructure

### Mailgun Configuration
- **Domain**: sandbox8c7e772e4393430f8ba13b764b0f40f6.mailgun.org
- **API Endpoint**: https://api.mailgun.net/v3/
- **Authorized Recipients**: rakib@atlasweb.info (for sandbox testing)
- **From Address**: noreply@sandbox8c7e772e4393430f8ba13b764b0f40f6.mailgun.org

### Production Email Setup (Pending)
- **Domain**: atlasweb.info (IONOS hosted)
- **DNS Records Required**:
  - TXT record for domain verification
  - MX records for Mailgun routing
  - CNAME records for tracking/click tracking
- **Status**: DNS propagation in progress

## Frontend Integration

### Content Security Policy (CSP)
Updated CSP headers to allow:
- Cloud Functions API calls
- Plaid script loading and API calls
- Mailgun email verification links
- External CDN resources (Lucide icons, fonts)

### Authentication Flow
1. **Registration**: Multi-step form (Account → Plan → Payment)
2. **Email Verification**: Server-generated tokens with expiry
3. **Login**: JWT-based session management
4. **Payment**: Plaid Link integration with error handling
5. **Session Management**: Local storage with automatic cleanup

### Key Files
- `auth.js`: Complete authentication system
- `registration.html`: Multi-step registration form
- `index.html`: Updated with auth integration
- `pricing.html`: Plan selection with auth links

## Security Measures

### Authentication
- **Password Hashing**: bcrypt with salt rounds
- **JWT Tokens**: Secure token generation with expiry
- **Email Verification**: Time-limited verification tokens
- **Session Management**: Automatic logout on token expiry

### Data Protection
- **Environment Variables**: All sensitive data in Secret Manager
- **HTTPS Only**: All API endpoints use TLS encryption
- **CORS Configuration**: Restricted to allowed origins
- **Input Validation**: Server-side validation for all inputs

### Payment Security
- **PCI Compliance**: Plaid handles all bank data
- **No Card Storage**: Bank account tokens only
- **Webhook Verification**: Secure webhook signature validation
- **Transaction Logging**: Complete audit trail in Firestore

## Local Development Setup

### Backend Testing
```bash
cd backend
npm install
npm start  # Runs on localhost:3000
```

### Frontend Testing
```bash
# Simple HTTP server
python -m http.server 8080
# Access at http://localhost:8080
```

### Environment Variables (.env)
```
PLAID_CLIENT_ID=your_plaid_client_id
PLAID_SECRET=your_plaid_secret
PLAID_ENV=sandbox
MAILGUN_API_KEY=your_mailgun_api_key
MAILGUN_DOMAIN=your_mailgun_domain
```

## Deployment Status

### Current State
✅ **Completed**:
- GCP Cloud Functions deployed and operational
- Firestore database configured
- Plaid integration functional (sandbox)
- Mailgun API integration working
- Frontend authentication flows complete
- Local testing environment functional

⏳ **In Progress**:
- DNS propagation for production email domain
- Mailgun sandbox email authorization for testing

📋 **Pending**:
- Production Plaid environment configuration
- Custom domain setup for Cloud Functions
- Legal compliance documents (Privacy Policy, Terms)
- Production deployment and monitoring

### Monitoring & Maintenance
- **Cloud Functions Logs**: Available in GCP Console
- **Firestore Metrics**: Database usage and performance
- **Plaid Dashboard**: Transaction monitoring and webhooks
- **Mailgun Analytics**: Email delivery rates and bounces

## Cost Estimates

### Monthly Operational Costs
- **Cloud Functions**: ~$5-10 (estimated 10,000 invocations)
- **Firestore**: ~$1-5 (estimated 1GB storage, 50,000 reads/writes)
- **Plaid Transfers**: $0.25 per transaction
- **Mailgun**: $0.80/1000 emails (first 10,000 free)
- **Total Estimated**: $10-20/month base + $0.25 per payment

### Cost Savings vs Stripe
- **$20 plan**: Save $5.55 per transaction (96% savings)
- **$200 plan**: Save $5.85 per transaction (96% savings)  
- **$300 plan**: Save $8.45 per transaction (97% savings)

## Troubleshooting Guide

### Common Issues
1. **CSP Errors**: Update Content-Security-Policy headers
2. **CORS Errors**: Verify allowed origins in Cloud Functions
3. **Email Delivery**: Check Mailgun logs and authorized recipients
4. **Plaid Errors**: Verify webhook URLs and environment variables
5. **Authentication**: Check JWT token expiry and Secret Manager access

### Debug Commands
```bash
# Check Cloud Function logs
gcloud functions logs read authHandler --limit=50

# Test local backend
curl -X POST http://localhost:3000/register -H "Content-Type: application/json" -d '{"email":"test@example.com"}'

# Check Firestore data
# Use GCP Console Firestore viewer
```

## Next Steps

### Production Readiness
1. Switch Plaid from sandbox to production environment
2. Configure custom domain for Cloud Functions
3. Complete DNS setup for atlasweb.info email
4. Implement comprehensive error logging and monitoring
5. Add legal compliance pages and terms
6. Setup automated backups for Firestore
7. Configure production-grade security headers
8. Implement rate limiting and DDoS protection

### Feature Enhancements
1. Multi-factor authentication (MFA)
2. Social login integration (Google, GitHub)
3. Password recovery flow
4. Account management dashboard
5. Subscription management and plan changes
6. Payment method updates
7. Usage analytics and reporting
8. Customer support integration