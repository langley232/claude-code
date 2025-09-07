#!/bin/bash

# Deploy Microsoft-Stytch Authentication Service to Google Cloud Run
# Production deployment script

set -e

echo "🚀 Deploying Microsoft-Stytch Authentication Service to Production..."

# Check if we're in the correct directory
if [ ! -f "microsoft-stytch-backend.js" ]; then
    echo "❌ Error: Must run from /login/microsoft/ directory"
    exit 1
fi

# Set GCP project
PROJECT_ID="solid-topic-466217-t9"
SERVICE_NAME="microsoft-authhandler"
REGION="us-central1"

echo "📋 Configuration:"
echo "   Project: $PROJECT_ID"
echo "   Service: $SERVICE_NAME"
echo "   Region: $REGION"

# Create Dockerfile for Cloud Run
cat > Dockerfile << EOF
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy source code
COPY *.js ./

# Expose port
EXPOSE 8080

# Start the service
CMD ["node", "microsoft-stytch-backend.js"]
EOF

# Create .gcloudignore
cat > .gcloudignore << EOF
node_modules/
.env
*.log
.git/
README.md
deploy-*.sh
EOF

# Build and deploy to Cloud Run
echo "🔨 Building and deploying to Cloud Run..."
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --project $PROJECT_ID \
    --allow-unauthenticated \
    --port 8080 \
    --memory 512Mi \
    --cpu 1 \
    --max-instances 10 \
    --set-env-vars "STYTCH_PROJECT_ID=project-live-16bf9c2b-0bc8-4c41-8603-05c3bad12562" \
    --set-env-vars "STYTCH_SECRET=secret-live-eUpoQ5w7K49cXgwf7rf_XSUSFhXrcF1Diok=" \
    --set-env-vars "NEXT_PUBLIC_STYTCH_PUBLIC_TOKEN=public-token-live-30730eba-4d7e-422c-b17c-7be3efdc27b5" \
    --set-env-vars "STYTCH_PROJECT_ENV=production" \
    --set-env-vars "AZURE_CLIENT_ID=313c822a-94d8-4913-b289-9c01ffb63c95" \
    --set-env-vars "AZURE_CLIENT_SECRET=YOUR_AZURE_CLIENT_SECRET" \
    --set-env-vars "AZURE_TENANT_ID=9cef4078-3934-49cd-b448-c0d1d2f482fc"

# Get the service URL
SERVICE_URL=$(gcloud run services describe $SERVICE_NAME --region=$REGION --project=$PROJECT_ID --format="value(status.url)")

echo "✅ Deployment complete!"
echo "🌐 Service URL: $SERVICE_URL"
echo ""
echo "📋 Next steps:"
echo "   1. Update Azure AD redirect URI to include: $SERVICE_URL/auth/microsoft/callback"
echo "   2. Update frontend OAuth URLs to use: $SERVICE_URL"
echo "   3. Test OAuth flow: $SERVICE_URL/auth/microsoft/start"
echo "   4. Update Stytch redirect URLs in dashboard"
echo ""
echo "🧪 Test the deployment:"
echo "   curl $SERVICE_URL/health"
EOF