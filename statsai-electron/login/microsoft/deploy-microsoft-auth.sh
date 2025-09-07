#!/bin/bash

# Microsoft OAuth AuthHandler Deployment Script
# Deploys the Microsoft OAuth service to Google Cloud Run

set -e  # Exit on any error

echo "🚀 Microsoft OAuth AuthHandler Deployment"
echo "========================================"

# Configuration
PROJECT_ID="solid-topic-466217-t9"
SERVICE_NAME="microsoft-authhandler"
REGION="us-central1"
IMAGE_NAME="gcr.io/${PROJECT_ID}/${SERVICE_NAME}"

# Check if we're in the right directory
if [ ! -f "authhandler-backend.js" ]; then
    echo "❌ Error: authhandler-backend.js not found. Are you in the login/microsoft directory?"
    exit 1
fi

echo "📁 Current directory: $(pwd)"
echo "🔧 Project ID: ${PROJECT_ID}"
echo "🏷️  Service Name: ${SERVICE_NAME}"
echo "🌍 Region: ${REGION}"

# Authenticate with Google Cloud (if needed)
echo "🔐 Checking Google Cloud authentication..."
if ! gcloud auth list --filter=status:ACTIVE --format="value(account)" | grep -q .; then
    echo "❌ No active Google Cloud authentication found"
    echo "Please run: gcloud auth login"
    exit 1
fi

# Set the project
echo "🎯 Setting Google Cloud project..."
gcloud config set project ${PROJECT_ID}

# Enable required APIs
echo "🔌 Enabling required APIs..."
gcloud services enable cloudbuild.googleapis.com
gcloud services enable run.googleapis.com
gcloud services enable secretmanager.googleapis.com

# Build the Docker image
echo "🏗️  Building Docker image..."
gcloud builds submit --tag ${IMAGE_NAME} .

# Deploy to Cloud Run
echo "🚀 Deploying to Cloud Run..."
gcloud run deploy ${SERVICE_NAME} \
    --image ${IMAGE_NAME} \
    --platform managed \
    --region ${REGION} \
    --allow-unauthenticated \
    --port 8080 \
    --memory 256Mi \
    --cpu 1 \
    --max-instances 10 \
    --timeout 300

# Get the service URL
SERVICE_URL=$(gcloud run services describe ${SERVICE_NAME} --platform managed --region ${REGION} --format 'value(status.url)')

echo ""
echo "✅ Microsoft OAuth AuthHandler Deployment Complete!"
echo "========================================"
echo "🌐 Service URL: ${SERVICE_URL}"
echo "🔍 Health Check: ${SERVICE_URL}/health"
echo "🔑 Token Endpoint: ${SERVICE_URL}/auth/microsoft/token"
echo "🔄 Refresh Endpoint: ${SERVICE_URL}/auth/microsoft/refresh"
echo ""
echo "📋 Next Steps:"
echo "  1. Update frontend microsoft-oauth.js tokenProcessorUrl to: ${SERVICE_URL}"
echo "  2. Create Microsoft client secret in Secret Manager:"
echo "     gcloud secrets create microsoft-oauth-client-secret --data-file=-"
echo "  3. Configure Microsoft Azure App Registration redirect URI:"
echo "     ${SERVICE_URL}/auth/microsoft/callback (if using callback flow)"
echo "  4. Test the service: curl ${SERVICE_URL}/health"
echo ""