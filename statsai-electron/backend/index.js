const functions = require('@google-cloud/functions-framework');
const { Firestore } = require('@google-cloud/firestore');
const { SecretManagerServiceClient } = require('@google-cloud/secret-manager');
const { Configuration, PlaidApi, PlaidEnvironments } = require('plaid');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { v4: uuidv4 } = require('uuid');
const nodemailer = require('nodemailer');
const FormData = require('form-data');
const axios = require('axios');
const cors = require('cors');
const express = require('express');

// Initialize services
const firestore = new Firestore();
const secretClient = new SecretManagerServiceClient();
const projectId = 'solid-topic-466217-t9';

// Express app for CORS
const app = express();
app.use(cors({ 
  origin: [
    'https://atlasweb.info', 
    'http://localhost:3000',
    'http://localhost:8080',
    'http://localhost:8081',
    'http://localhost:5000',
    'http://127.0.0.1:8080',
    'http://127.0.0.1:8081',
    'http://127.0.0.1:5000'
  ] 
}));
app.use(express.json());

// Plaid configuration
let plaidClient;

// Initialize Plaid client
async function initializePlaid() {
  try {
    const [plaidClientId] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/plaid-client-id/versions/latest`
    });
    const [plaidSecret] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/plaid-secret/versions/latest`
    });

    const configuration = new Configuration({
      basePath: PlaidEnvironments.sandbox,
      baseOptions: {
        headers: {
          'PLAID-CLIENT-ID': plaidClientId.payload.data.toString('utf8'),
          'PLAID-SECRET': plaidSecret.payload.data.toString('utf8'),
          'Plaid-Version': '2020-09-14',
        },
      },
    });

    plaidClient = new PlaidApi(configuration);
    console.log('Plaid client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Plaid client:', error);
    throw error;
  }
}

// Get secret helper function
async function getSecret(secretName) {
  try {
    const [version] = await secretClient.accessSecretVersion({
      name: `projects/${projectId}/secrets/${secretName}/versions/latest`
    });
    return version.payload.data.toString('utf8');
  } catch (error) {
    console.error(`Failed to get secret ${secretName}:`, error);
    throw error;
  }
}

// Send email function using Mailgun API with axios
async function sendEmail(to, subject, html) {
  try {
    console.log('Sending email via Mailgun API...');
    
    // Get Mailgun API credentials from secrets
    const mailgunApiKey = (await getSecret('mailgun-api-key')).trim();
    const mailgunDomain = (await getSecret('mailgun-domain')).trim();
    
    const formData = new FormData();
    formData.append('from', 'AtlasWeb AI <postmaster@sandbox8c7e772e4393430f8ba13b764b0f40f6.mailgun.org>');
    formData.append('to', to);
    formData.append('subject', subject);
    formData.append('html', html);
    
    const response = await axios.post(
      `https://api.mailgun.net/v3/${mailgunDomain}/messages`,
      formData,
      {
        auth: {
          username: 'api',
          password: mailgunApiKey
        },
        headers: formData.getHeaders()
      }
    );
    
    console.log('✅ Email sent successfully via Mailgun API:', response.data);

    console.log('Email sent successfully to:', to);
  } catch (error) {
    console.error('Email sending failed:', error);
    throw error;
  }
}

// Registration endpoint
app.post('/register', async (req, res) => {
  try {
    const { firstName, lastName, email, password, company } = req.body;

    // Validate input
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if user already exists
    const existingUser = await firestore
      .collection('users')
      .where('email', '==', email)
      .get();

    if (!existingUser.empty) {
      return res.status(409).json({ error: 'User already exists with this email' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Generate verification token
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const userId = uuidv4();

    // Create user document
    const userData = {
      userId,
      firstName,
      lastName,
      email,
      company: company || '',
      passwordHash,
      emailVerified: false,
      accountActivated: false,
      subscriptionTier: null,
      paymentStatus: 'pending',
      createdAt: new Date(),
      lastLogin: null
    };

    // Store user
    await firestore.collection('users').doc(userId).set(userData);

    // Store verification token
    await firestore.collection('verificationTokens').add({
      userId,
      token: verificationToken,
      type: 'email_verification',
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
      used: false,
      createdAt: new Date()
    });

    // Send verification email
    const verificationUrl = `https://atlasweb.info/verify-email?token=${verificationToken}`;
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px 20px; text-align: center; }
          .content { padding: 40px 30px; }
          .button { background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; }
          .footer { background: #f9fafb; padding: 20px; text-align: center; color: #666; }
        </style>
      </head>
      <body>
        <div class="email-container">
          <div class="header">
            <h1>AtlasWeb AI</h1>
            <p>Welcome to the Future of Intelligent Browsing</p>
          </div>
          <div class="content">
            <h2>Hi ${firstName},</h2>
            <p>Thank you for registering with AtlasWeb AI! To complete your account setup, please verify your email address.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" class="button">Verify Email Address</a>
            </div>
            <p>This verification link expires in 24 hours. If you didn't create this account, please ignore this email.</p>
          </div>
          <div class="footer">
            <p>© 2025 AtlasWeb AI. All rights reserved.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Temporarily disable email for testing
    try {
      await sendEmail(email, 'Verify Your AtlasWeb AI Account', emailHtml);
      console.log('Email sent successfully to:', email);
    } catch (emailError) {
      console.error('Email sending failed:', emailError.message);
      // Continue registration even if email fails
    }

    res.json({
      success: true,
      message: 'Registration successful. Please check your email for verification.',
      userId
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed', details: error.message });
  }
});

// Login endpoint
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    // Find user
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .get();

    if (userQuery.empty) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const userDoc = userQuery.docs[0];
    const userData = userDoc.data();

    // Verify password
    const isValidPassword = await bcrypt.compare(password, userData.passwordHash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Check if email is verified
    if (!userData.emailVerified) {
      return res.status(403).json({ error: 'Please verify your email address first' });
    }

    // Generate JWT token
    const jwtSecret = await getSecret('jwt-secret');
    const token = jwt.sign(
      {
        userId: userData.userId,
        email: userData.email,
        subscriptionTier: userData.subscriptionTier
      },
      jwtSecret,
      { expiresIn: '7d' }
    );

    // Update last login
    await firestore.collection('users').doc(userData.userId).update({
      lastLogin: new Date()
    });

    res.json({
      success: true,
      token,
      user: {
        userId: userData.userId,
        firstName: userData.firstName,
        lastName: userData.lastName,
        email: userData.email,
        subscriptionTier: userData.subscriptionTier,
        accountActivated: userData.accountActivated
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed', details: error.message });
  }
});

// Email verification endpoint
app.get('/verify-email', async (req, res) => {
  try {
    const { token } = req.query;

    if (!token) {
      return res.status(400).json({ error: 'Verification token required' });
    }

    // Find verification token
    const tokenQuery = await firestore
      .collection('verificationTokens')
      .where('token', '==', token)
      .where('used', '==', false)
      .get();

    if (tokenQuery.empty) {
      return res.status(400).json({ error: 'Invalid or expired verification token' });
    }

    const tokenDoc = tokenQuery.docs[0];
    const tokenData = tokenDoc.data();

    // Check if token is expired
    if (new Date() > tokenData.expiresAt.toDate()) {
      return res.status(400).json({ error: 'Verification token has expired' });
    }

    // Update user as verified
    await firestore.collection('users').doc(tokenData.userId).update({
      emailVerified: true
    });

    // Mark token as used
    await firestore.collection('verificationTokens').doc(tokenDoc.id).update({
      used: true
    });

    res.json({
      success: true,
      message: 'Email verified successfully. You can now complete your subscription.'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(500).json({ error: 'Verification failed', details: error.message });
  }
});

// Create Plaid Link Token for payment
app.post('/create-link-token', async (req, res) => {
  try {
    await initializePlaid();
    
    const { userId, subscriptionTier } = req.body;

    if (!userId || !subscriptionTier) {
      return res.status(400).json({ error: 'User ID and subscription tier required' });
    }

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Create link token for payment
    const request = {
      user: { client_user_id: userId },
      client_name: 'AtlasWeb AI',
      products: ['transfer'],
      country_codes: ['US'],
      language: 'en',
    };

    const response = await plaidClient.linkTokenCreate(request);

    res.json({
      success: true,
      linkToken: response.data.link_token
    });

  } catch (error) {
    console.error('Link token creation error:', error);
    res.status(500).json({ error: 'Failed to create link token', details: error.message });
  }
});

// Create payment intent
app.post('/create-payment-intent', async (req, res) => {
  try {
    await initializePlaid();
    
    const { userId, subscriptionTier, publicToken } = req.body;

    if (!publicToken) {
      return res.status(400).json({ error: 'Public token is required' });
    }

    // Define pricing
    const pricing = {
      basic: 20.00,
      pro: 200.00,
      max: 300.00
    };

    const amount = pricing[subscriptionTier];
    if (!amount) {
      return res.status(400).json({ error: 'Invalid subscription tier' });
    }

    // Get user data
    const userDoc = await firestore.collection('users').doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userData = userDoc.data();

    // Exchange public token for access token
    const tokenResponse = await plaidClient.itemPublicTokenExchange({
      public_token: publicToken
    });
    
    const accessToken = tokenResponse.data.access_token;
    const itemId = tokenResponse.data.item_id;

    // Get account information
    const accountsResponse = await plaidClient.accountsGet({
      access_token: accessToken
    });

    const accounts = accountsResponse.data.accounts;
    if (accounts.length === 0) {
      return res.status(400).json({ error: 'No accounts found' });
    }

    // Use the first account (user's primary checking account)
    const accountId = accounts[0].account_id;

    // Create transfer intent
    const intentRequest = {
      mode: 'PAYMENT',
      amount: amount.toString(),
      description: `AtlasWeb AI ${subscriptionTier} subscription`,
      ach_class: 'WEB',
      user: {
        legal_name: `${userData.firstName} ${userData.lastName}`,
        email_address: userData.email,
      },
      account_id: accountId,
    };

    const intentResponse = await plaidClient.transferIntentCreate(intentRequest);
    const intentId = intentResponse.data.transfer_intent.id;

    // Store the access token and account ID for later use
    await firestore.collection('users').doc(userId).update({
      plaidAccessToken: accessToken,
      plaidItemId: itemId,
      plaidAccountId: accountId,
      lastUpdated: new Date()
    });

    res.json({
      success: true,
      intentId,
      accountId: accountId,
      amount: amount
    });

  } catch (error) {
    console.error('Payment intent creation error:', error);
    res.status(500).json({ error: 'Failed to create payment intent', details: error.message });
  }
});

// Complete payment
app.post('/complete-payment', async (req, res) => {
  try {
    await initializePlaid();
    
    const { intentId, userId, subscriptionTier } = req.body;

    // Get transfer intent status
    const intentResponse = await plaidClient.transferIntentGet({ 
      transfer_intent_id: intentId 
    });

    const intent = intentResponse.data.transfer_intent;

    if (intent.status === 'PENDING' || intent.status === 'SUCCEEDED') {
      // Get user's Plaid data
      const userDoc = await firestore.collection('users').doc(userId).get();
      if (!userDoc.exists) {
        return res.status(404).json({ error: 'User not found' });
      }
      
      const userData = userDoc.data();
      
      if (!userData.plaidAccessToken || !userData.plaidAccountId) {
        return res.status(400).json({ error: 'Plaid account information not found' });
      }

      // Create the actual transfer
      const transferRequest = {
        access_token: userData.plaidAccessToken,
        account_id: userData.plaidAccountId,
        type: 'debit',
        network: 'ach',
        amount: intent.amount,
        description: intent.description,
        ach_class: 'WEB',
        user: intent.user
      };

      const transferResponse = await plaidClient.transferCreate(transferRequest);
      const transfer = transferResponse.data.transfer;

      console.log('Transfer created:', transfer.id, 'Status:', transfer.status);

      // Update user with transfer information
      await firestore.collection('users').doc(userId).update({
        subscriptionTier,
        paymentStatus: 'processing',
        transferId: transfer.id,
        transferIntentId: intentId,
        lastUpdated: new Date()
      });

      res.json({
        success: true,
        message: 'Payment initiated successfully',
        transferId: transfer.id,
        status: transfer.status
      });

    } else if (intent.authorization_decision === 'APPROVED') {
      // Update user subscription
      await firestore.collection('users').doc(userId).update({
        subscriptionTier,
        paymentStatus: 'active',
        accountActivated: true
      });

      // Send activation email
      const userDoc = await firestore.collection('users').doc(userId).get();
      const userData = userDoc.data();

      const activationEmailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
            .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px 20px; text-align: center; }
            .content { padding: 40px 30px; }
            .button { background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; }
            .feature-list { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
          </style>
        </head>
        <body>
          <div class="email-container">
            <div class="header">
              <h1>🎉 Welcome to AtlasWeb AI!</h1>
            </div>
            <div class="content">
              <h2>Hi ${userData.firstName},</h2>
              <p>Congratulations! Your payment has been processed and your <strong>${subscriptionTier}</strong> account is now active.</p>
              
              <div class="feature-list">
                <h3>Your ${subscriptionTier} Plan Includes:</h3>
                <ul>
                  <li>✨ AI-powered intelligent search</li>
                  <li>🤖 Personal AI assistant</li>
                  <li>📧 Email management tools</li>
                  ${subscriptionTier === 'pro' || subscriptionTier === 'max' ? '<li>✍️ Advanced writing tools</li>' : ''}
                  ${subscriptionTier === 'max' ? '<li>📱 Mobile app access</li>' : ''}
                </ul>
              </div>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="https://atlasweb.info/dashboard" class="button">Start Using AtlasWeb AI</a>
              </div>
            </div>
          </div>
        </body>
        </html>
      `;

      await sendEmail(
        userData.email, 
        'Welcome to AtlasWeb AI - Your Account is Active!', 
        activationEmailHtml
      );

      res.json({
        success: true,
        message: 'Payment completed successfully',
        transferId: intent.transfer_id,
        subscriptionTier
      });
    } else {
      res.status(400).json({
        success: false,
        error: 'Payment was not approved',
        reason: intent.authorization_decision_rationale
      });
    }

  } catch (error) {
    console.error('Payment completion error:', error);
    res.status(500).json({ error: 'Failed to complete payment', details: error.message });
  }
});

// Test endpoint to manually verify user (for development only)
app.post('/test-verify-user', async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'Email required' });
    }

    // Find user
    const userQuery = await firestore
      .collection('users')
      .where('email', '==', email)
      .get();

    if (userQuery.empty) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userDoc = userQuery.docs[0];
    
    // Manually verify user
    await firestore.collection('users').doc(userDoc.id).update({
      emailVerified: true
    });

    res.json({
      success: true,
      message: 'User manually verified for testing'
    });

  } catch (error) {
    console.error('Manual verification error:', error);
    res.status(500).json({ error: 'Verification failed' });
  }
});

// Plaid webhook
app.post('/webhook/plaid', express.json(), async (req, res) => {
  try {
    const webhookData = req.body;
    console.log('Plaid webhook received:', JSON.stringify(webhookData, null, 2));

    if (webhookData.webhook_type === 'TRANSFER') {
      console.log('Transfer webhook received:', webhookData.webhook_code);
      
      // Handle transfer completion for account activation
      if (webhookData.webhook_code === 'TRANSFER_EVENTS_UPDATE') {
        const transferId = webhookData.transfer_id;
        const transferEvent = webhookData.new_transfer_status || webhookData.transfer_event;
        
        console.log(`Transfer ${transferId} event: ${transferEvent}`);
        
        if (transferEvent === 'settled' || transferEvent === 'posted') {
          console.log('Transfer completed successfully - activating account');
          
          // Find user by transfer ID and activate account
          const usersQuery = await firestore
            .collection('users')
            .where('transferId', '==', transferId)
            .get();
          
          if (!usersQuery.empty) {
            const userDoc = usersQuery.docs[0];
            const userData = userDoc.data();
            const userId = userDoc.id;
            
            // Activate the user account
            await firestore.collection('users').doc(userId).update({
              paymentStatus: 'active',
              accountActivated: true,
              transferStatus: 'settled',
              lastUpdated: new Date()
            });
            
            console.log(`Account activated for user: ${userData.email}`);
            
            // Send activation email
            try {
              const activationEmailHtml = `
                <!DOCTYPE html>
                <html>
                <head>
                  <style>
                    .email-container { font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; }
                    .header { background: linear-gradient(135deg, #6366f1, #8b5cf6); color: white; padding: 30px 20px; text-align: center; }
                    .content { padding: 40px 30px; }
                    .button { background: #6366f1; color: white; padding: 16px 32px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600; }
                    .feature-list { background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0; }
                  </style>
                </head>
                <body>
                  <div class="email-container">
                    <div class="header">
                      <h1>🎉 Welcome to AtlasWeb AI!</h1>
                    </div>
                    <div class="content">
                      <h2>Hi ${userData.firstName},</h2>
                      <p>Congratulations! Your payment has been processed and your <strong>${userData.subscriptionTier}</strong> account is now active.</p>
                      <p>You now have full access to all AtlasWeb AI features. Get started by logging into your dashboard.</p>
                      <div style="text-align: center; margin: 30px 0;">
                        <a href="https://atlasweb.info/login" class="button">Access Your Dashboard</a>
                      </div>
                    </div>
                  </div>
                </body>
                </html>
              `;
              
              await sendEmail(
                userData.email, 
                '🎉 Your AtlasWeb AI Account is Now Active!', 
                activationEmailHtml
              );
              
              console.log('Activation email sent to:', userData.email);
            } catch (emailError) {
              console.error('Failed to send activation email:', emailError.message);
            }
          } else {
            console.warn('No user found with transfer ID:', transferId);
          }
        } else if (transferEvent === 'failed' || transferEvent === 'cancelled') {
          console.log('Transfer failed or cancelled:', transferEvent);
          
          // Find user and update payment status
          const usersQuery = await firestore
            .collection('users')
            .where('transferId', '==', transferId)
            .get();
          
          if (!usersQuery.empty) {
            const userDoc = usersQuery.docs[0];
            const userId = userDoc.id;
            
            await firestore.collection('users').doc(userId).update({
              paymentStatus: 'failed',
              transferStatus: transferEvent,
              lastUpdated: new Date()
            });
            
            console.log('Payment status updated to failed for transfer:', transferId);
          }
        }
      }
    }

    res.status(200).json({ acknowledged: true });
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// Mount the Express app
functions.http('authHandler', app);

module.exports = { app };