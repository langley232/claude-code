// Stripe Configuration for AtlasWeb
// This file contains environment-specific Stripe keys and settings

const STRIPE_CONFIG = {
    // Environment settings
    environment: 'test', // 'test' or 'live'
    
    // Test environment keys (safe to commit)
    test: {
        publishableKey: 'pk_test_51HdXJKLhHb1234567890abcdefghijklmnopqrstuvwxyz', // Replace with your actual test key
        // Note: Secret key should NEVER be in frontend code
        webhookEndpoint: 'https://your-backend.com/stripe/webhook',
        apiVersion: '2023-10-16'
    },
    
    // Production keys (should be loaded from secure environment variables)
    live: {
        publishableKey: process.env.STRIPE_LIVE_PUBLISHABLE_KEY || '',
        webhookEndpoint: process.env.STRIPE_LIVE_WEBHOOK_ENDPOINT || '',
        apiVersion: '2023-10-16'
    },
    
    // Test card numbers for development (Stripe's official test cards)
    testCards: {
        visa: '4242424242424242',
        visaDebit: '4000056655665556',
        mastercard: '5555555555554444',
        amex: '378282246310005',
        declined: '4000000000000002',
        insufficientFunds: '4000000000009995',
        expired: '4000000000000069'
    },
    
    // Stripe Elements styling
    elementStyles: {
        appearance: {
            theme: 'night',
            variables: {
                colorPrimary: '#6366f1',
                colorBackground: '#0f172a',
                colorText: '#f8fafc',
                colorDanger: '#ef4444',
                colorSuccess: '#10b981',
                fontFamily: 'Inter, system-ui, sans-serif',
                borderRadius: '12px',
                fontSizeBase: '16px',
                spacingUnit: '6px'
            },
            rules: {
                '.Input': {
                    backgroundColor: 'rgba(15, 23, 42, 0.8)',
                    border: '1px solid rgba(255, 255, 255, 0.2)',
                    padding: '12px 16px',
                    borderRadius: '12px',
                    fontSize: '16px',
                    color: '#f8fafc'
                },
                '.Input:focus': {
                    borderColor: '#6366f1',
                    boxShadow: '0 0 0 2px rgba(99, 102, 241, 0.2)'
                },
                '.Input--invalid': {
                    borderColor: '#ef4444'
                },
                '.Label': {
                    color: '#cbd5e1',
                    fontSize: '14px',
                    fontWeight: '500',
                    marginBottom: '8px'
                }
            }
        }
    }
};

// Helper functions
const StripeHelper = {
    // Get the appropriate publishable key based on environment
    getPublishableKey() {
        const config = STRIPE_CONFIG[STRIPE_CONFIG.environment];
        if (!config || !config.publishableKey) {
            console.warn('⚠️ Stripe publishable key not configured for environment:', STRIPE_CONFIG.environment);
            // Return a safe default test key for development
            return 'pk_test_51HdXJKL'; // Truncated placeholder - replace with real test key
        }
        return config.publishableKey;
    },
    
    // Check if we're in test mode
    isTestMode() {
        return STRIPE_CONFIG.environment === 'test';
    },
    
    // Get test card for easy development
    getTestCard(type = 'visa') {
        return STRIPE_CONFIG.testCards[type] || STRIPE_CONFIG.testCards.visa;
    },
    
    // Validate publishable key format
    validateKey(key) {
        const testKeyPattern = /^pk_test_[a-zA-Z0-9]{24,}$/;
        const liveKeyPattern = /^pk_live_[a-zA-Z0-9]{24,}$/;
        
        return testKeyPattern.test(key) || liveKeyPattern.test(key);
    },
    
    // Development helper to auto-fill test card
    fillTestCard(cardElement, type = 'visa') {
        if (!this.isTestMode()) {
            console.warn('🚫 Test card auto-fill only available in test mode');
            return;
        }
        
        console.log('🧪 Auto-filling test card:', type);
        console.log('💡 Test card number:', this.getTestCard(type));
        console.log('💡 Use expiry: 12/34, CVC: 123');
    },
    
    // Log payment attempt for debugging
    logPaymentAttempt(paymentMethod, amount, currency = 'usd') {
        if (this.isTestMode()) {
            console.log('💳 Test Payment Attempt:', {
                paymentMethodId: paymentMethod?.id,
                type: paymentMethod?.type,
                card: paymentMethod?.card?.brand + ' •••• ' + paymentMethod?.card?.last4,
                amount: amount,
                currency: currency.toUpperCase(),
                timestamp: new Date().toISOString()
            });
        }
    }
};

// Export for use in payment page
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { STRIPE_CONFIG, StripeHelper };
} else {
    window.STRIPE_CONFIG = STRIPE_CONFIG;
    window.StripeHelper = StripeHelper;
}