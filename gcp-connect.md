# GCP Cloud Function Deployment Methods

## Overview
This document outlines the deployment and management methods used for the AtlasWeb AI authentication system on Google Cloud Platform, including initial authentication and connection setup.

## 0. Initial GCP Authentication & Connection

### Prerequisites
1. **Google Cloud Account** with billing enabled
2. **Google Cloud SDK** installed locally
3. **Project created** in Google Cloud Console

### Authentication Methods

#### Method 1: User Account Authentication (Development)
```bash
# Install Google Cloud SDK (if not already installed)
curl https://sdk.cloud.google.com | bash
exec -l $SHELL

# Initialize gcloud and authenticate
gcloud init

# Login with your Google account
gcloud auth login

# Set default project
gcloud config set project solid-topic-466217-t9

# Verify authentication
gcloud auth list
gcloud config list
```

#### Method 2: Service Account Authentication (Production)
```bash
# Create service account
gcloud iam service-accounts create claude-deployment \
  --description="Service account for Claude Code deployments" \
  --display-name="Claude Deployment Account"

# Grant necessary roles
gcloud projects add-iam-policy-binding solid-topic-466217-t9 \
  --member="serviceAccount:claude-deployment@solid-topic-466217-t9.iam.gserviceaccount.com" \
  --role="roles/cloudfunctions.admin"

gcloud projects add-iam-policy-binding solid-topic-466217-t9 \
  --member="serviceAccount:claude-deployment@solid-topic-466217-t9.iam.gserviceaccount.com" \
  --role="roles/datastore.owner"

gcloud projects add-iam-policy-binding solid-topic-466217-t9 \
  --member="serviceAccount:claude-deployment@solid-topic-466217-t9.iam.gserviceaccount.com" \
  --role="roles/secretmanager.admin"

# Create and download service account key
gcloud iam service-accounts keys create ~/gcp-service-key.json \
  --iam-account=claude-deployment@solid-topic-466217-t9.iam.gserviceaccount.com

# Authenticate using service account
gcloud auth activate-service-account --key-file=~/gcp-service-key.json

# Set application default credentials
export GOOGLE_APPLICATION_CREDENTIALS=~/gcp-service-key.json
```

### Enable Required APIs
```bash
# Enable necessary Google Cloud APIs
gcloud services enable cloudfunctions.googleapis.com
gcloud services enable firestore.googleapis.com
gcloud services enable secretmanager.googleapis.com
gcloud services enable cloudresourcemanager.googleapis.com
gcloud services enable iamcredentials.googleapis.com

# Verify enabled services
gcloud services list --enabled
```

### Project Configuration
```bash
# Set default configurations
gcloud config set project solid-topic-466217-t9
gcloud config set compute/region us-central1
gcloud config set functions/region us-central1

# Verify configuration
gcloud config list
gcloud projects describe solid-topic-466217-t9
```

### Connection Verification
```bash
# Test connection and permissions
gcloud projects get-iam-policy solid-topic-466217-t9
gcloud functions list --regions=us-central1
gcloud secrets list

# Test basic function deployment (optional)
echo 'exports.hello = (req, res) => res.send("Hello World!");' > test.js
gcloud functions deploy test-function \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --source . \
  --entry-point hello

# Clean up test function
gcloud functions delete test-function --region=us-central1
rm test.js
```

### Authentication Status Check
```bash
# Check current authentication status
gcloud auth list --filter=status:ACTIVE --format="table(account,status)"

# Check project access
gcloud projects list --filter="projectId:solid-topic-466217-t9"

# Verify permissions
gcloud iam service-accounts get-iam-policy \
  solid-topic-466217-t9@appspot.gserviceaccount.com
```

### Troubleshooting Common Connection Issues

#### Permission Denied Errors
```bash
# Re-authenticate if permissions are denied
gcloud auth revoke --all
gcloud auth login
gcloud config set project solid-topic-466217-t9
```

#### API Not Enabled Errors
```bash
# Enable all required APIs at once
gcloud services enable \
  cloudfunctions.googleapis.com \
  firestore.googleapis.com \
  secretmanager.googleapis.com \
  cloudresourcemanager.googleapis.com \
  iamcredentials.googleapis.com
```

#### Quota/Billing Issues
```bash
# Check billing account
gcloud beta billing accounts list
gcloud beta billing projects describe solid-topic-466217-t9

# Check quotas
gcloud compute project-info describe --project=solid-topic-466217-t9
```

## 1. Initial Deployment Process

### Cloud Function Creation
```bash
# Deploy the authentication function
gcloud functions deploy authHandler \
  --runtime nodejs18 \
  --trigger-http \
  --allow-unauthenticated \
  --source ./backend \
  --entry-point app \
  --region us-central1 \
  --project solid-topic-466217-t9
```

### Key Configuration
- **Function URL:** `https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler`
- **Runtime:** Node.js 18
- **HTTP trigger** with public access
- **Source code** from `./backend` directory

## 2. Secrets Management

### Environment Variables Setup
```bash
# Create secrets in Secret Manager
gcloud secrets create plaid-client-id --data-file=- <<< "your_client_id"
gcloud secrets create plaid-secret --data-file=- <<< "your_secret"
gcloud secrets create mailgun-api-key --data-file=- <<< "your_mailgun_key"
gcloud secrets create jwt-secret --data-file=- <<< "your_jwt_secret"

# Grant Cloud Function access to secrets
gcloud projects add-iam-policy-binding solid-topic-466217-t9 \
  --member="serviceAccount:solid-topic-466217-t9@appspot.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```

### Function Environment Configuration
```javascript
// Access secrets in Cloud Function
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const client = new SecretManagerServiceClient();

const [plaidSecret] = await client.accessSecretVersion({
  name: 'projects/solid-topic-466217-t9/secrets/plaid-secret/versions/latest'
});
```

## 3. Monitoring and Logging

### Real-time Log Monitoring
```bash
# Stream function logs
gcloud functions logs read authHandler --limit=50 --follow

# Filter specific log levels
gcloud functions logs read authHandler --filter="severity>=ERROR"

# Check recent executions
gcloud functions logs read authHandler --limit=10 --format="table(timestamp,severity,textPayload)"
```

### Health Checking
```bash
# Test function endpoint
curl -X POST https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler/test \
  -H "Content-Type: application/json"

# Check function status
gcloud functions describe authHandler --region=us-central1
```

## 4. Update and Redeploy Workflow

### Code Updates
```bash
# Update function code
gcloud functions deploy authHandler \
  --source ./backend \
  --region us-central1

# Update environment variables
gcloud functions deploy authHandler \
  --set-env-vars NODE_ENV=production,PLAID_ENV=sandbox
```

## 5. Database Management (Firestore)

### Firestore Operations
```bash
# Enable Firestore
gcloud firestore databases create --region=us-central1

# View collections
gcloud firestore collections list

# Query user data
gcloud firestore documents list users --limit=10
```

### Database Rules
```javascript
// Firestore security rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

## 6. Production Monitoring

### Performance Metrics
```bash
# Function execution metrics
gcloud functions logs read authHandler --filter="execution_time" --limit=20

# Error rate monitoring
gcloud functions logs read authHandler --filter="severity=ERROR" --limit=10
```

### Webhook Testing
```bash
# Test Plaid webhook
curl -X POST https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler/webhook/plaid \
  -H "Content-Type: application/json" \
  -d '{"webhook_type": "TRANSFER", "webhook_code": "TRANSFER_EVENTS_UPDATE"}'
```

## Key Advantages of This Approach

### Cost Efficiency
- **Cloud Functions:** Pay per execution (~$0.40/million requests)
- **Firestore:** Pay per operation (~$0.18/100K operations) 
- **Secret Manager:** $0.06 per 10K secret accesses
- **Total estimated cost:** <$5/month for moderate usage

### Scalability
- Automatic scaling from 0 to 3000+ concurrent executions
- Global CDN distribution
- Built-in load balancing

### Security
- Secret Manager for credential storage
- IAM-based access control
- HTTPS enforcement
- Firestore security rules

## Infrastructure Summary

This deployment method provides a production-ready, scalable authentication system with integrated payment processing, all managed through GCP's serverless infrastructure. The system handles:

- User registration and authentication
- Email verification via Mailgun
- Plaid ACH payment processing
- Webhook handling for payment confirmation
- Secure credential management
- Real-time monitoring and logging

## Project Details
- **Project ID:** solid-topic-466217-t9
- **Region:** us-central1
- **Domain:** atlasweb.info
- **Function Name:** authHandler
- **Database:** Firestore (Native mode)

## 7. Live Connection Test Results (2025-08-27)

### Successful GCP Connection Steps Executed

#### Step 1: Authentication Status
```bash
$ gcloud auth list
      Credentialed Accounts
ACTIVE  ACCOUNT
*       rakib.mahmood232@gmail.com
```

#### Step 2: Project Configuration
```bash
$ gcloud config set project solid-topic-466217-t9
Updated property [core/project].

$ gcloud config list
[core]
account = rakib.mahmood232@gmail.com
disable_usage_reporting = False
project = solid-topic-466217-t9

Your active configuration is: [default]
```

#### Step 3: Project Verification
```bash
$ gcloud projects describe solid-topic-466217-t9
createTime: '2025-07-17T17:09:25.058204Z'
labels:
  firebase: enabled
  firebase-core: disabled
  generative-language: enabled
lifecycleState: ACTIVE
name: My First Project
projectId: solid-topic-466217-t9
projectNumber: '609535336419'
```

#### Step 4: API Service Verification
```bash
$ gcloud services list --enabled --filter="name:secretmanager.googleapis.com"
NAME                          TITLE
secretmanager.googleapis.com  Secret Manager API
```

#### Step 5: Secret Manager - Current Secrets List
```bash
$ gcloud secrets list
NAME                 CREATED              REPLICATION_POLICY  LOCATIONS
jwt-secret           2025-08-25T09:05:39  automatic           -
mailgun-api-key      2025-08-25T23:28:36  automatic           -
mailgun-domain       2025-08-25T23:28:47  automatic           -
mailgun-domain-prod  2025-08-26T04:15:18  automatic           -
plaid-client-id      2025-08-25T07:13:55  automatic           -
plaid-secret         2025-08-25T07:14:18  automatic           -
smtp-pass            2025-08-25T08:42:56  automatic           -
smtp-user            2025-08-25T08:42:42  automatic           -
```

#### Step 6: Secret Versions Status
```bash
# All secrets have active version 1 (enabled state)
# mailgun-domain: version 4 (updated multiple times)
# smtp-pass: version 3 (updated multiple times) 
# smtp-user: version 3 (updated multiple times)
```

### Current Infrastructure Status

**Active Secrets (8 total):**
1. **jwt-secret** - JWT token signing key for authentication
2. **mailgun-api-key** - Mailgun API key for email delivery
3. **mailgun-domain** - Mailgun domain configuration (version 4 - latest)
4. **mailgun-domain-prod** - Production Mailgun domain settings
5. **plaid-client-id** - Plaid API client identifier
6. **plaid-secret** - Plaid API secret key
7. **smtp-pass** - SMTP password (legacy, version 3)
8. **smtp-user** - SMTP username (legacy, version 3)

**Connection Status:** ✅ Successfully connected and authenticated  
**Project Access:** ✅ Full access to solid-topic-466217-t9  
**Secret Manager:** ✅ 8 active secrets available  
**API Services:** ✅ Required services enabled

### Secret Management Commands Reference

```bash
# List all secrets
gcloud secrets list

# Get secret value (requires proper IAM permissions)
gcloud secrets versions access latest --secret="secret-name"

# Create new secret
gcloud secrets create new-secret --data-file=-

# Update secret version
echo "new-value" | gcloud secrets versions add secret-name --data-file=-

# Delete secret
gcloud secrets delete secret-name
```

### Connection Verification Commands
```bash
# Verify authentication
gcloud auth list --filter=status:ACTIVE

# Check project permissions
gcloud projects get-iam-policy solid-topic-466217-t9

# Test secret access
gcloud secrets versions access latest --secret="jwt-secret"
```

## 8. Mailgun Email Service Connection & Monitoring (2025-08-27)

### Mailgun API Connection Setup

#### Step 1: Retrieve Mailgun Credentials from GCP Secrets
```bash
# Get Mailgun API key
MAILGUN_API_KEY=$(gcloud secrets versions access latest --secret="mailgun-api-key")

# Get production domain
MAILGUN_DOMAIN=$(gcloud secrets versions access latest --secret="mailgun-domain-prod")

# Verify credentials
echo "API Key: $MAILGUN_API_KEY"
echo "Domain: $MAILGUN_DOMAIN"
```

#### Step 2: Test Mailgun Domain Configuration
```bash
# Check domain status and DNS configuration
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/domains/$MAILGUN_DOMAIN" | python3 -m json.tool
```

### Live Mailgun Connection Results

#### Domain Status ✅ ACTIVE
```json
{
  "domain": {
    "created_at": "Mon, 25 Aug 2025 23:51:25 GMT",
    "id": "68acf6fdc93ea2ae32b2c5c4",
    "is_disabled": false,
    "name": "atlasweb.info",
    "state": "active",
    "type": "custom"
  }
}
```

#### DNS Records Status ✅ ALL VALID
- **MX Records**: `mxa.mailgun.org` and `mxb.mailgun.org` (active)
- **SPF Record**: `v=spf1 include:mailgun.org ~all` (valid)
- **DKIM**: `pic._domainkey.atlasweb.info` (valid)
- **CNAME**: `email.atlasweb.info` → `mailgun.org` (valid)

### Recent Email Activity Analysis

#### Step 3: Monitor Email Logs
```bash
# Get recent email events
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/events?limit=10" | python3 -m json.tool
```

#### Email Delivery Summary (Last 7 Days)
```
Aug 26, 2025: 3 accepted, 1 delivered, 1 failed (permanent)
Aug 27, 2025: 1 accepted, 1 delivered, 2 failed (temporary)
Total: 4 accepted, 2 delivered, 3 failed
```

#### Recent Email Events Analysis

**✅ SUCCESSFUL DELIVERY:**
- **Email**: `mahmood_rakib@yahoo.com`
- **Subject**: "Verify Your AtlasWeb AI Account"
- **Status**: Delivered after 4 attempts
- **Final Status**: Code 250 (OK)
- **TLS**: Enabled, Certificate Verified
- **DKIM**: Valid (`pic._domainkey.atlasweb.info`)

**⚠️ TEMPORARY FAILURES:**
- **Issue**: Yahoo rate limiting due to IP reputation
- **Error**: "Messages from 159.135.228.59 temporarily deferred due to unexpected volume or user complaints"
- **Resolution**: Email eventually delivered after retry attempts
- **Mailgun IP**: `159.135.228.59` (shared IP)

**❌ PERMANENT FAILURES:**
- **Test Email**: `test@example.com` failed (No MX record)
- **Expected**: Testing with invalid domain

### Email Delivery Statistics

#### Step 4: Get Delivery Analytics
```bash
# Get email statistics
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/stats/total?event=accepted&event=delivered&event=failed"
```

#### Weekly Performance Metrics
```
Total Accepted: 4 emails
Total Delivered: 2 emails (50% delivery rate)
Total Failed: 3 emails
- Temporary Failures: 2 (retry successful)
- Permanent Failures: 1 (invalid domain)
```

### Mailgun Monitoring Commands

#### Real-time Email Monitoring
```bash
# Get latest email events
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/atlasweb.info/events?limit=5"

# Filter by event type
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/events?event=failed&limit=10"

# Get specific email details
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/events?recipient=mahmood_rakib@yahoo.com"
```

#### Delivery Status Checks
```bash
# Check domain reputation
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/domains/$MAILGUN_DOMAIN"

# Get bounce list
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/bounces"

# Check suppression list
curl -s --user "api:$MAILGUN_API_KEY" \
  "https://api.mailgun.net/v3/$MAILGUN_DOMAIN/suppressions"
```

### Current Email Infrastructure Status

**Domain Configuration:** ✅ Fully configured and active  
**DNS Records:** ✅ All records valid and propagated  
**API Connection:** ✅ Successfully authenticated  
**DKIM Signing:** ✅ Active with valid signature  
**TLS Encryption:** ✅ Enabled for all deliveries  

**Recent Issues Identified:**
1. **Yahoo Rate Limiting**: Shared IP `159.135.228.59` experiencing temporary deferrals
2. **Retry Logic**: Mailgun successfully retries failed deliveries (4 attempts for Yahoo)
3. **Delivery Success**: Despite initial failures, emails are reaching recipients

**Recommendations:**
1. Consider dedicated IP for higher volume (requires warm-up)
2. Monitor delivery rates and adjust sending frequency if needed
3. Implement bounce handling in Cloud Function webhook
4. Add email validation to prevent sends to invalid domains

### Integration with AtlasWeb AI System
- **Backend Integration**: `statsai-electron/backend/index.js:145` (Mailgun API calls)
- **Email Templates**: Verification emails with branded styling
- **Cloud Function**: Email sending via `/register` endpoint
- **Webhook Support**: Ready for delivery status callbacks