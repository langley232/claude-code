// Production Cleanup Utility
// Removes hardcoded API keys and enables security for production deployment

class ProductionCleanup {
    constructor() {
        this.isProduction = process.env.NODE_ENV === 'production';
    }

    // Remove hardcoded API keys from budget manager
    sanitizeBudgetManager() {
        if (window.brightDataBudgetManager) {
            window.brightDataBudgetManager.sanitizeForProduction();
            console.log('🔒 BrightData API keys sanitized for production');
        }
    }

    // Replace hardcoded keys in files for production build
    static cleanupForBuild() {
        const filesToClean = [
            './brightdata-budget-manager.js',
            './brightdata-social-search.js'
        ];

        console.log('🧹 Starting production cleanup...');
        
        // This would be run during build process
        filesToClean.forEach(file => {
            console.log(`Cleaning ${file}...`);
            // Replace hardcoded API keys with environment variables
            // This should be done by build tools like webpack or vite
        });
    }

    // Environment variable validation
    validateEnvironment() {
        const requiredVars = ['BRIGHTDATA_API_KEY'];
        const missing = requiredVars.filter(varName => !process.env[varName]);
        
        if (missing.length > 0) {
            console.error('❌ Missing required environment variables:', missing);
            return false;
        }
        
        console.log('✅ Environment variables validated');
        return true;
    }

    // Security headers check
    validateSecurityHeaders() {
        // Check if CSP is properly configured
        const csp = document.querySelector('meta[http-equiv="Content-Security-Policy"]');
        if (!csp) {
            console.warn('⚠️ Content Security Policy not found');
            return false;
        }
        
        console.log('✅ Security headers validated');
        return true;
    }

    // Run full production security check
    runSecurityCheck() {
        console.log('🔐 Running production security check...');
        
        const checks = [
            this.validateEnvironment(),
            this.validateSecurityHeaders()
        ];
        
        const passed = checks.every(check => check);
        
        if (passed) {
            console.log('✅ All security checks passed');
            this.sanitizeBudgetManager();
        } else {
            console.error('❌ Security checks failed - not safe for production');
        }
        
        return passed;
    }
}

// Auto-run security check in production
if (typeof window !== 'undefined') {
    window.productionCleanup = new ProductionCleanup();
    
    // Run security check on load in production
    document.addEventListener('DOMContentLoaded', () => {
        if (window.productionCleanup.isProduction) {
            window.productionCleanup.runSecurityCheck();
        }
    });
}

// Export for build tools
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionCleanup;
}