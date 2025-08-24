# AtlasWeb Backend Infrastructure Setup Guide
## Google Cloud + Firebase Authentication + Stripe Payment Integration

This document outlines the complete backend infrastructure setup for AtlasWeb's secure user authentication, registration, and Stripe payment processing system.

## Architecture Overview

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   AtlasWeb      │    │   Firebase       │    │   Cloud SQL     │
│   Electron App  │◄──►│   Authentication │    │   Database      │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                        │                       │
         │              ┌─────────▼─────────┐            │
         └─────────────►│    Cloud Run      │◄───────────┘
                        │   Backend API     │
                        └─────────┬─────────┘
                                  │
                        ┌─────────▼─────────┐
                        │      Stripe       │
                        │   Payment API     │
                        └───────────────────┘
```

## 1. Firebase Authentication Setup

### 1.1 Create Firebase Project
```bash
# Install Firebase CLI
npm install -g firebase-tools

# Login to Firebase
firebase login

# Create new project
firebase projects:create atlasweb-prod
```

### 1.2 Configure Firebase Authentication
1. Go to Firebase Console → Authentication → Sign-in method
2. Enable Email/Password authentication
3. Configure OAuth providers (optional):
   - Google Sign-In
   - GitHub Sign-In
   - Microsoft Sign-In

### 1.3 Firebase Configuration
```javascript
// firebase-config.js
const firebaseConfig = {
  apiKey: "your-api-key",
  authDomain: "atlasweb-prod.firebaseapp.com",
  projectId: "atlasweb-prod",
  storageBucket: "atlasweb-prod.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456789"
};

// Initialize Firebase
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
```

## 2. Cloud SQL Database Setup

### 2.1 Create Cloud SQL Instance
```bash
# Set project ID
gcloud config set project atlasweb-prod

# Create PostgreSQL instance
gcloud sql instances create atlasweb-db \
    --database-version=POSTGRES_14 \
    --tier=db-f1-micro \
    --region=us-central1 \
    --storage-type=SSD \
    --storage-size=10GB \
    --backup-start-time=03:00 \
    --enable-bin-log \
    --maintenance-release-channel=production
```

### 2.2 Database Schema
```sql
-- users table
CREATE TABLE users (
    uid VARCHAR(128) PRIMARY KEY,  -- Firebase Auth UID
    email VARCHAR(255) UNIQUE NOT NULL,
    display_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Stripe Integration
    stripe_customer_id VARCHAR(255) UNIQUE,
    subscription_status VARCHAR(50) DEFAULT 'inactive',
    plan_type VARCHAR(50) DEFAULT 'basic',
    
    -- Profile Information
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    company VARCHAR(255),
    
    -- Preferences
    marketing_consent BOOLEAN DEFAULT false,
    newsletter_subscription BOOLEAN DEFAULT false,
    
    -- Account Status
    email_verified BOOLEAN DEFAULT false,
    account_status VARCHAR(50) DEFAULT 'active',
    last_login TIMESTAMP WITH TIME ZONE,
    
    -- Indexes
    INDEX idx_email (email),
    INDEX idx_stripe_customer (stripe_customer_id),
    INDEX idx_subscription_status (subscription_status),
    INDEX idx_created_at (created_at)
);

-- subscriptions table for detailed subscription management
CREATE TABLE subscriptions (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan_id VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL,
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_uid (user_uid),
    INDEX idx_stripe_subscription (stripe_subscription_id),
    INDEX idx_status (status)
);

-- payment_methods table
CREATE TABLE payment_methods (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(128) REFERENCES users(uid) ON DELETE CASCADE,
    stripe_payment_method_id VARCHAR(255) UNIQUE,
    card_brand VARCHAR(50),
    card_last4 CHAR(4),
    card_exp_month INTEGER,
    card_exp_year INTEGER,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_uid (user_uid),
    INDEX idx_stripe_pm (stripe_payment_method_id)
);

-- audit_logs for security and compliance
CREATE TABLE audit_logs (
    id SERIAL PRIMARY KEY,
    user_uid VARCHAR(128),
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_uid (user_uid),
    INDEX idx_action (action),
    INDEX idx_created_at (created_at)
);
```

### 2.3 Database Connection Configuration
```javascript
// db-config.js
const { Pool } = require('pg');

const dbConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST, // Cloud SQL private IP
  port: 5432,
  ssl: {
    rejectUnauthorized: false
  },
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

const pool = new Pool(dbConfig);
module.exports = pool;
```

## 3. Cloud Run Backend API Setup

### 3.1 Backend Service Structure
```
backend/
├── src/
│   ├── routes/
│   │   ├── auth.js          # Authentication endpoints
│   │   ├── users.js         # User management
│   │   ├── payments.js      # Stripe integration
│   │   └── subscriptions.js # Subscription management
│   ├── middleware/
│   │   ├── auth.js          # Firebase token verification
│   │   ├── validation.js    # Request validation
│   │   └── logging.js       # Audit logging
│   ├── services/
│   │   ├── firebase.js      # Firebase admin SDK
│   │   ├── stripe.js        # Stripe service
│   │   └── database.js      # Database operations
│   └── app.js               # Express application
├── Dockerfile
├── package.json
└── cloudbuild.yaml
```

### 3.2 Core Backend Implementation

#### Authentication Middleware
```javascript
// middleware/auth.js
const admin = require('firebase-admin');

async function verifyToken(req, res, next) {
  try {
    const token = req.headers.authorization?.split('Bearer ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = {
      uid: decodedToken.uid,
      email: decodedToken.email,
      email_verified: decodedToken.email_verified
    };
    
    next();
  } catch (error) {
    console.error('Token verification failed:', error);
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = { verifyToken };
```

#### User Registration Endpoint
```javascript
// routes/auth.js
const express = require('express');
const { body, validationResult } = require('express-validator');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../services/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/register', 
  verifyToken,
  [
    body('email').isEmail(),
    body('firstName').notEmpty(),
    body('lastName').notEmpty(),
    body('plan').isIn(['basic', 'pro', 'max'])
  ],
  async (req, res) => {
    try {
      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { email, firstName, lastName, company, plan } = req.body;
      const uid = req.user.uid;

      // Create Stripe customer
      const stripeCustomer = await stripe.customers.create({
        email,
        name: `${firstName} ${lastName}`,
        metadata: {
          firebase_uid: uid,
          plan_type: plan
        }
      });

      // Insert user into database
      await pool.query(`
        INSERT INTO users (
          uid, email, first_name, last_name, company,
          stripe_customer_id, plan_type, email_verified
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT (uid) DO UPDATE SET
          email = $2, first_name = $3, last_name = $4,
          company = $5, stripe_customer_id = $6, plan_type = $7,
          updated_at = CURRENT_TIMESTAMP
      `, [uid, email, firstName, lastName, company, stripeCustomer.id, plan, req.user.email_verified]);

      // Log the registration
      await pool.query(`
        INSERT INTO audit_logs (user_uid, action, resource_type, ip_address)
        VALUES ($1, 'user_registered', 'user', $2)
      `, [uid, req.ip]);

      res.status(201).json({
        success: true,
        customer_id: stripeCustomer.id,
        message: 'User registered successfully'
      });

    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

module.exports = router;
```

#### Stripe Payment Processing
```javascript
// routes/payments.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../services/database');
const { verifyToken } = require('../middleware/auth');

const router = express.Router();

router.post('/create-payment-intent', verifyToken, async (req, res) => {
  try {
    const { payment_method_id, plan } = req.body;
    const uid = req.user.uid;

    // Get user's Stripe customer ID
    const userResult = await pool.query(
      'SELECT stripe_customer_id FROM users WHERE uid = $1',
      [uid]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const customerId = userResult.rows[0].stripe_customer_id;

    // Plan pricing (in cents)
    const planPricing = {
      basic: 2000,   // $20
      pro: 20000,    // $200
      max: 30000     // $300
    };

    const amount = planPricing[plan];

    if (!amount) {
      return res.status(400).json({ error: 'Invalid plan' });
    }

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: 'usd',
      customer: customerId,
      payment_method: payment_method_id,
      confirmation_method: 'manual',
      confirm: true,
      metadata: {
        firebase_uid: uid,
        plan_type: plan
      }
    });

    // Handle payment confirmation
    if (paymentIntent.status === 'requires_action') {
      res.json({
        requires_action: true,
        payment_intent: {
          id: paymentIntent.id,
          client_secret: paymentIntent.client_secret
        }
      });
    } else if (paymentIntent.status === 'succeeded') {
      // Create subscription
      await createSubscription(uid, customerId, plan, paymentIntent.id);
      
      res.json({ success: true, payment_intent_id: paymentIntent.id });
    } else {
      res.status(400).json({ error: 'Payment failed' });
    }

  } catch (error) {
    console.error('Payment processing error:', error);
    res.status(500).json({ error: 'Payment processing failed' });
  }
});

async function createSubscription(uid, customerId, plan, paymentIntentId) {
  try {
    // Update user subscription status
    await pool.query(`
      UPDATE users 
      SET subscription_status = 'active', plan_type = $2, updated_at = CURRENT_TIMESTAMP
      WHERE uid = $1
    `, [uid, plan]);

    // Log the successful payment
    await pool.query(`
      INSERT INTO audit_logs (user_uid, action, resource_type, resource_id)
      VALUES ($1, 'payment_succeeded', 'payment', $2)
    `, [uid, paymentIntentId]);

  } catch (error) {
    console.error('Subscription creation error:', error);
    throw error;
  }
}

module.exports = router;
```

### 3.3 Dockerfile for Cloud Run
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Copy application code
COPY src/ ./src/

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nextjs -u 1001

USER nodejs

EXPOSE 8080

CMD ["node", "src/app.js"]
```

### 3.4 Cloud Build Configuration
```yaml
# cloudbuild.yaml
steps:
  - name: 'gcr.io/cloud-builders/docker'
    args: ['build', '-t', 'gcr.io/$PROJECT_ID/atlasweb-backend', '.']
    
  - name: 'gcr.io/cloud-builders/docker'
    args: ['push', 'gcr.io/$PROJECT_ID/atlasweb-backend']
    
  - name: 'gcr.io/google.com/cloudsdktool/cloud-sdk'
    entrypoint: 'gcloud'
    args: 
      - 'run'
      - 'deploy'
      - 'atlasweb-backend'
      - '--image=gcr.io/$PROJECT_ID/atlasweb-backend'
      - '--region=us-central1'
      - '--platform=managed'
      - '--allow-unauthenticated'
      - '--set-env-vars=NODE_ENV=production'
      - '--memory=512Mi'
      - '--cpu=1'
      - '--max-instances=10'
```

## 4. Stripe Configuration

### 4.1 Stripe Product and Price Setup
```javascript
// Create products and prices in Stripe
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

async function createProducts() {
  // Basic Plan
  const basicProduct = await stripe.products.create({
    name: 'AtlasWeb Basic',
    description: 'AI Search & Code Assistant with essential productivity tools',
  });

  const basicPrice = await stripe.prices.create({
    product: basicProduct.id,
    unit_amount: 2000, // $20.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });

  // Pro Plan
  const proProduct = await stripe.products.create({
    name: 'AtlasWeb Pro',
    description: 'Complete creative suite with Writer Integration',
  });

  const proPrice = await stripe.prices.create({
    product: proProduct.id,
    unit_amount: 20000, // $200.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });

  // Max Plan
  const maxProduct = await stripe.products.create({
    name: 'AtlasWeb Max',
    description: 'Full platform access with mobile apps and advanced research',
  });

  const maxPrice = await stripe.prices.create({
    product: maxProduct.id,
    unit_amount: 30000, // $300.00
    currency: 'usd',
    recurring: {
      interval: 'month',
    },
  });

  return { basicPrice, proPrice, maxPrice };
}
```

### 4.2 Webhook Configuration
```javascript
// routes/webhooks.js
const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const pool = require('../services/database');

const router = express.Router();

router.post('/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  switch (event.type) {
    case 'payment_intent.succeeded':
      await handlePaymentSuccess(event.data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailure(event.data.object);
      break;
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCancellation(event.data.object);
      break;
    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

async function handlePaymentSuccess(paymentIntent) {
  try {
    const uid = paymentIntent.metadata.firebase_uid;
    
    await pool.query(`
      UPDATE users 
      SET subscription_status = 'active', updated_at = CURRENT_TIMESTAMP
      WHERE uid = $1
    `, [uid]);

    console.log('Payment succeeded for user:', uid);
  } catch (error) {
    console.error('Error handling payment success:', error);
  }
}

module.exports = router;
```

## 5. Environment Variables

### 5.1 Required Environment Variables
```bash
# .env.production
NODE_ENV=production
PORT=8080

# Database
DB_HOST=10.x.x.x  # Cloud SQL private IP
DB_USER=atlasweb
DB_PASSWORD=your-secure-password
DB_NAME=atlasweb_prod

# Firebase
FIREBASE_PROJECT_ID=atlasweb-prod
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@atlasweb-prod.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"

# Stripe
STRIPE_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_PUBLISHABLE_KEY=pk_live_xxxxxxxxxxxxxxxxxxxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxx

# Security
JWT_SECRET=your-super-secure-jwt-secret
CORS_ORIGIN=https://app.atlasweb.ai

# Monitoring
SENTRY_DSN=https://xxxxxxxxxxxxxxxxxxxxx@sentry.io/xxxxxxx
```

## 6. Deployment Steps

### 6.1 Initial Setup
```bash
# 1. Enable required APIs
gcloud services enable run.googleapis.com
gcloud services enable sql-component.googleapis.com
gcloud services enable cloudbuild.googleapis.com
gcloud services enable firebase.googleapis.com

# 2. Create service account for Cloud Run
gcloud iam service-accounts create atlasweb-backend \
    --description="AtlasWeb Backend Service Account" \
    --display-name="AtlasWeb Backend"

# 3. Grant necessary permissions
gcloud projects add-iam-policy-binding atlasweb-prod \
    --member="serviceAccount:atlasweb-backend@atlasweb-prod.iam.gserviceaccount.com" \
    --role="roles/cloudsql.client"
```

### 6.2 Deploy Backend
```bash
# Build and deploy
gcloud builds submit --config cloudbuild.yaml

# Set environment variables
gcloud run services update atlasweb-backend \
    --region=us-central1 \
    --set-env-vars="DB_HOST=10.x.x.x,DB_USER=atlasweb,DB_NAME=atlasweb_prod" \
    --set-secrets="DB_PASSWORD=db-password:latest,STRIPE_SECRET_KEY=stripe-secret:latest"
```

## 7. Security Considerations

### 7.1 Network Security
- Use VPC for private communication between services
- Implement Cloud SQL private IP
- Configure firewall rules to restrict access

### 7.2 Data Protection
- Enable encryption at rest for Cloud SQL
- Use Google Cloud KMS for secret management
- Implement audit logging for compliance

### 7.3 Authentication Security
- Implement rate limiting
- Use CSRF protection
- Validate and sanitize all inputs
- Implement proper session management

## 8. Monitoring and Logging

### 8.1 Cloud Monitoring
```javascript
// monitoring/metrics.js
const { Monitoring } = require('@google-cloud/monitoring');

const client = new Monitoring.MetricServiceClient();

async function recordPaymentAttempt(success) {
  const projectId = process.env.GOOGLE_CLOUD_PROJECT;
  
  await client.createTimeSeries({
    name: client.projectPath(projectId),
    timeSeries: [{
      metric: {
        type: 'custom.googleapis.com/payment/attempts',
        labels: {
          success: success.toString()
        }
      },
      resource: {
        type: 'global'
      },
      points: [{
        interval: {
          endTime: {
            seconds: Date.now() / 1000
          }
        },
        value: {
          int64Value: 1
        }
      }]
    }]
  });
}
```

### 8.2 Error Reporting
```javascript
// Initialize Error Reporting
const { ErrorReporting } = require('@google-cloud/error-reporting');
const errors = new ErrorReporting();

// Use in error handling
app.use((error, req, res, next) => {
  errors.report(error);
  res.status(500).json({ error: 'Internal server error' });
});
```

## 9. Cost Optimization

### 9.1 Estimated Monthly Costs (USD)
- Cloud SQL (db-f1-micro): $15-25
- Cloud Run (with traffic): $10-50
- Firebase Authentication: $0.006/verification
- Stripe fees: 2.9% + 30¢ per transaction

### 9.2 Cost-Saving Strategies
- Use Cloud Run minimum instances: 0
- Implement connection pooling
- Use appropriate machine types
- Monitor and optimize database queries

This infrastructure setup provides a secure, scalable, and production-ready backend for AtlasWeb with proper authentication, payment processing, and data management capabilities.