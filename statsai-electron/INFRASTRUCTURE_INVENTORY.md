# Infrastructure Inventory - EmailVectorization System

## Overview
This document provides a comprehensive inventory of all deployed infrastructure components across Google Cloud Platform (GCP), Microsoft Azure, and Stytch for the EmailVectorization system.

**Last Updated**: 2025-09-04  
**Environment**: Production/Live

---

## 1. Google Cloud Platform (GCP) Resources

**Project ID**: `solid-topic-466217-t9`  
**Project Number**: `609535336419`  
**Project Name**: "My First Project"

### 1.1 Cloud Run Services

| Service Name | Status | URL | Purpose | Last Deployed |
|-------------|--------|-----|---------|---------------|
| **aichatservice** | ✅ Active | `https://aichatservice-609535336419.us-central1.run.app` | AI chat functionality | 2025-08-31 |
| **authhandler** | ✅ Active | `https://authhandler-609535336419.us-central1.run.app` | Generic auth handler | 2025-08-31 |
| **emailfetcher** | ✅ Active | `https://emailfetcher-609535336419.us-central1.run.app` | Email fetching service | 2025-09-01 |
| **emailvectorizer** | ✅ Active | `https://emailvectorizer-609535336419.us-central1.run.app` | Email processing/vectorization | 2025-08-27 |
| **oauthtest** | ✅ Active | `https://oauthtest-609535336419.us-central1.run.app` | Google OAuth testing (ISOLATED) | 2025-09-04 |
| **testemailprocessing** | ✅ Active | `https://testemailprocessing-609535336419.us-central1.run.app` | Email processing testing | 2025-08-27 |

**Region**: us-central1

### 1.2 Cloud Functions (2nd Generation)

| Function Name | Status | Trigger | Purpose | Region |
|--------------|--------|---------|---------|--------|
| **aiChatService** | ✅ Active | HTTP Trigger | AI chat processing | us-central1 |
| **authHandler** | ✅ Active | HTTP Trigger | Authentication handling | us-central1 |
| **emailFetcher** | ✅ Active | HTTP Trigger | Email fetching operations | us-central1 |
| **emailVectorizer** | ✅ Active | Pub/Sub: `emails-to-process` | Email vectorization pipeline | us-central1 |
| **oauthTest** | ✅ Active | HTTP Trigger | OAuth flow testing | us-central1 |
| **testEmailProcessing** | ✅ Active | HTTP Trigger | Email processing tests | us-central1 |

### 1.3 Pub/Sub Topics

| Topic Name | Purpose | Dead Letter Queue |
|-----------|---------|-------------------|
| **emails-to-process** | Main email processing queue | emails-to-process-dlq |
| **frontend-updates** | Frontend notification updates | frontend-update-dlq |
| **gmail-push-notifications** | Gmail webhook notifications | gmail-push-notifications-dlq |
| **auth-completed-user-id** | Authentication completion events | auth-completed-user-id-dlq |

**Total Topics**: 8 (4 main + 4 DLQ)

### 1.4 Additional GCP Services (Planned/In Use)

| Service | Status | Purpose |
|---------|--------|---------|
| **Vertex AI Vector Search** | 🔄 Planned | Vector database for email embeddings |
| **Cloud Storage** | 🔄 Planned | Email attachments and processed content |
| **Cloud SQL** | 🔄 Planned | User sessions and email metadata |
| **Secret Manager** | ✅ Active | API keys and secrets storage |

---

## 2. Microsoft Azure Resources

**Tenant ID**: `9cef4078-3934-49cd-b448-c0d1d2f482fc`  
**Primary Domain**: `tridentinter.com`  
**Email**: `rakib@tridentinter.com`

### 2.1 Azure Active Directory (AAD)

| Resource | Status | Configuration |
|----------|--------|---------------|
| **Azure AD App Registration** | ✅ Active | EmailVectorization |
| **Client ID** | ✅ Active | `313c822a-94d8-4913-b289-9c01ffb63c95` |
| **Client Secret** | ✅ Active | `4DN8Q~2x_1OfUSB6GgzcEMfQ~cSoU.9izwUmla_M` |
| **Client Secret ID** | ✅ Active | `888888be-92ff-4086-b467-1496f4e6b85d` |
| **Publisher Domain** | ✅ Active | `NETORGFT10012942.onmicrosoft.com` |

### 2.2 Microsoft Graph API Permissions

**Required Delegated Permissions:**
| Permission | Type | Status | Purpose |
|-----------|------|--------|---------|
| `Mail.Read` | Delegated | ✅ Required | Read user mail |
| `Mail.ReadWrite` | Delegated | ✅ Required | Read and write user mail |
| `User.Read` | Delegated | ✅ Required | Sign in and read user profile |
| `offline_access` | Delegated | ✅ Required | Maintain access to data |

**Application IDs for permissions:**
| Permission | Application ID |
|-----------|----------------|
| `Mail.Read` | `810dcf14-1858-4bf2-8134-4c369fa3235b` |
| `Mail.ReadWrite` | `024d486e-b451-40bb-833d-3e66d98c5c73` |
| `User.Read` | `e1fe6dd8-ba31-4d61-89e7-88639da4683d` |
| `offline_access` | `7427e0e9-2fba-42fe-b0c0-848c9e6a8182` |

### 2.3 Redirect URIs

| URI | Purpose | Status |
|-----|---------|---------|
| `http://localhost:3000/auth/microsoft/callback` | Local development | ✅ Active |
| `https://api.stytch.com/v1/b2b/oauth/callback/oauth-callback-live-a5ff52b8-992e-48a8-b9f1-9341c02a5c97` | Stytch OAuth callback | ✅ Active |
| `https://atlasweb-sigma.vercel.app/api/callback.html` | Production frontend callback | ❌ **MISSING - CRITICAL** |

**⚠️ CRITICAL ISSUE**: The production frontend callback URI `https://atlasweb-sigma.vercel.app/api/callback.html` must be added to Azure AD app registration redirect URIs for OAuth flow to work.

---

## 3. Stytch Resources

**Environment**: Production (Live)  
**Project Name**: EmailVectorization

### 3.1 Stytch Project Configuration

| Resource | Value | Status |
|----------|-------|---------|
| **Project ID** | `project-live-16bf9c2b-0bc8-4c41-8603-05c3bad12562` | ✅ Active |
| **Secret** | `secret-live-eUpoQ5w7K49cXgwf7rf_XSUSFhXrcF1Diok=` | ✅ Active |
| **Public Token** | `public-token-live-30730eba-4d7e-422c-b17c-7be3efdc27b5` | ✅ Active |
| **Environment** | `production` | ✅ Active |

### 3.2 OAuth Provider Configuration

| Provider | Status | Client ID | Redirect URI |
|----------|--------|-----------|-------------|
| **Microsoft** | ✅ Configured | `ffcf16f4-7665-4e8e-a08a-739f3192a9e1` | Stytch managed |

### 3.3 Stytch Endpoints

| Endpoint | Purpose |
|----------|---------|
| `https://api.stytch.com/v1/b2b/oauth/microsoft/start` | Microsoft OAuth initiation |
| `https://api.stytch.com/v1/b2b/oauth/callback/oauth-callback-live-a5ff52b8-992e-48a8-b9f1-9341c02a5c97` | OAuth callback processing |
| `https://api.stytch.com/v1/b2b/oauth/authenticate` | Token exchange |

---

## 4. System Architecture Flow

### 4.1 Authentication Flow
```
User (rakib@tridentinter.com)
  ↓ 1. OAuth Request
Stytch OAuth (Microsoft Provider)
  ↓ 2. Microsoft Identity Platform
Microsoft Azure AD (tridentinter.com tenant)
  ↓ 3. Authorization Code
Stytch Token Exchange
  ↓ 4. Session Token
Application Backend (GCP Cloud Run)
  ↓ 5. Microsoft Graph API Access
Microsoft 365 Email Access
```

### 4.2 Email Processing Pipeline
```
Microsoft Graph API (Email Data)
  ↓ JSON Payload
GCP Pub/Sub Topic: "emails-to-process"
  ↓ Trigger
Cloud Function: "emailVectorizer"
  ↓ Vector Embeddings
Vertex AI Vector Search (Planned)
  ↓ Metadata
Cloud SQL (Planned)
  ↓ Raw Data
Cloud Storage (Planned)
```

---

## 5. Deployment Status

### 5.1 Current State
| Component | Status | Notes |
|-----------|--------|-------|
| **Azure AD Setup** | ✅ Complete | App registration with Microsoft Graph permissions |
| **Stytch Configuration** | ✅ Complete | Microsoft OAuth provider configured |
| **GCP Infrastructure** | ✅ Active | 6 Cloud Run services, 6 Cloud Functions, 8 Pub/Sub topics |
| **Microsoft Service Integration** | 🔄 In Progress | Need to integrate Stytch with existing services |

### 5.2 Missing Components
| Component | Priority | Reason |
|-----------|----------|--------|
| **Microsoft-Stytch Cloud Run Service** | 🔴 High | Core authentication service |
| **Vector Database** | 🟡 Medium | Email embeddings storage |
| **Cloud SQL Instance** | 🟡 Medium | Metadata persistence |
| **Frontend Integration** | 🔴 High | Complete OAuth flow |

---

## 6. Environment Variables Inventory

### 6.1 Microsoft OAuth (.env)
```bash
AZURE_CLIENT_ID=313c822a-94d8-4913-b289-9c01ffb63c95
AZURE_CLIENT_SECRET=YOUR_AZURE_CLIENT_SECRET
AZURE_CLIENT_SECRET_ID=888888be-92ff-4086-b467-1496f4e6b85d
AZURE_TENANT_ID=9cef4078-3934-49cd-b448-c0d1d2f482fc
```

### 6.2 Stytch Configuration (.env)
```bash
STYTCH_PROJECT_ID=project-live-16bf9c2b-0bc8-4c41-8603-05c3bad12562
STYTCH_SECRET=secret-live-eUpoQ5w7K49cXgwf7rf_XSUSFhXrcF1Diok=
NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-live-30730eba-4d7e-422c-b17c-7be3efdc27b5
STYTCH_PROJECT_ENV=production
```

### 6.3 GCP Configuration (.env)
```bash
GOOGLE_CLOUD_PROJECT=solid-topic-466217-t9
PROJECT_ROOT=/home/rakib232/github/claude-code
WORKING_DIR=/home/rakib232/github/claude-code
```

---

## 7. Security Inventory

### 7.1 Secrets Management
| Secret | Storage Location | Status |
|---------|-----------------|---------|
| **Microsoft Client Secret** | Azure App Registration + .env | ✅ Secured |
| **Stytch Secret** | Stytch Dashboard + .env | ✅ Secured |
| **GCP Service Account Keys** | GCP Secret Manager | ✅ Secured |

### 7.2 Access Control
| Service | Access Method | Status |
|---------|---------------|---------|
| **Azure AD** | Service Principal | ✅ Active |
| **Microsoft Graph** | OAuth 2.0 + PKCE | ✅ Active |
| **Stytch** | API Key Authentication | ✅ Active |
| **GCP Services** | IAM Service Accounts | ✅ Active |

---

## 8. Network Architecture

### 8.1 External Endpoints
| Service | URL | Purpose |
|---------|-----|---------|
| **Stytch OAuth** | `api.stytch.com` | Authentication provider |
| **Microsoft Graph** | `graph.microsoft.com` | Email API access |
| **Azure AD** | `login.microsoftonline.com` | Identity provider |

### 8.2 Internal GCP Endpoints
| Service | Internal URL | Purpose |
|---------|-------------|---------|
| **Pub/Sub** | `pubsub.googleapis.com` | Message queue |
| **Cloud Functions** | `cloudfunctions.googleapis.com` | Serverless compute |
| **Cloud Run** | `run.googleapis.com` | Container services |

---

## 9. Next Steps

### 9.1 Immediate Actions
1. **Deploy Microsoft-Stytch Service** to Cloud Run
2. **Integrate Stytch SDK** in existing email processing pipeline
3. **Update Frontend** to use Stytch OAuth flow
4. **Test End-to-End** authentication and email processing

### 9.2 Infrastructure Expansion
1. **Deploy Vertex AI Vector Search** for email embeddings
2. **Set up Cloud SQL** for metadata persistence
3. **Configure Cloud Storage** for email attachments
4. **Implement monitoring and logging**

### 9.3 Security Enhancements
1. **Move secrets to GCP Secret Manager** from .env
2. **Enable audit logging** for all services
3. **Implement network security policies**
4. **Add DDoS protection** for public endpoints

---

## 10. Cost Analysis

### 10.1 Current Monthly Costs (Estimated)
| Service Category | Monthly Cost | Notes |
|-----------------|-------------|-------|
| **GCP Cloud Run** | ~$20-50 | 6 services with minimal traffic |
| **GCP Cloud Functions** | ~$10-30 | 6 functions with event-driven usage |
| **GCP Pub/Sub** | ~$5-15 | 8 topics with low message volume |
| **Stytch** | $0-99 | Free tier up to 1K MAU, then $0.099/MAU |
| **Microsoft Graph** | $0 | Included with Microsoft 365 subscription |
| **Azure AD** | $0 | Free tier for basic authentication |

**Total Estimated**: $35-194/month depending on usage

### 10.2 Scaling Considerations
- **High Volume**: Need to consider Vertex AI costs for vector operations
- **Storage**: Cloud SQL and Storage costs will increase with email volume
- **Bandwidth**: Egress costs for large email attachments
- **Stytch**: Significant cost increase after 1K monthly active users

---

**End of Infrastructure Inventory**