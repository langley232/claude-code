// BrightData Budget Manager - Controls spending and switches between sandbox/production
class BrightDataBudgetManager {
    constructor() {
        this.currentMode = 'sandbox'; // 'sandbox' or 'production'
        this.budgetLimit = 1.00; // $1 test limit
        this.currentSpent = 0.00;
        this.recordCost = 0.0015; // $1.50 per 1000 records = $0.0015 per record
        this.requestCount = 0;
        
        // API Keys (temporary for testing - will be removed for production)
        this.sandboxApiKey = 'c988af6189e31c5122500a1eda86c84fbd45082f9c6ddc555689ae1328fed2c8'; // Current free tier
        this.productionApiKey = null; // Will be set when user upgrades
        
        this.initializeMode();
    }

    initializeMode() {
        // Load saved mode and budget from localStorage
        const savedMode = localStorage.getItem('brightdata_mode') || 'sandbox';
        const savedSpent = parseFloat(localStorage.getItem('brightdata_spent') || '0');
        const savedRequestCount = parseInt(localStorage.getItem('brightdata_requests') || '0');
        
        this.currentMode = savedMode;
        this.currentSpent = savedSpent;
        this.requestCount = savedRequestCount;
        
        this.updateUI();
        
        console.log(`🎯 BrightData Budget Manager initialized: ${this.currentMode} mode, $${this.currentSpent.toFixed(3)} spent`);
    }

    switchMode(mode) {
        if (mode === 'production' && !this.productionApiKey) {
            this.showApiKeyPrompt();
            return false;
        }
        
        this.currentMode = mode;
        localStorage.setItem('brightdata_mode', mode);
        this.updateUI();
        
        // Reset budget when switching to sandbox
        if (mode === 'sandbox') {
            this.resetBudget();
        }
        
        console.log(`🔄 Switched to ${mode} mode`);
        return true;
    }

    canMakeRequest(estimatedRecords = 1) {
        const estimatedCost = estimatedRecords * this.recordCost;
        const projectedTotal = this.currentSpent + estimatedCost;
        
        if (this.currentMode === 'sandbox') {
            // Strict budget limit for sandbox testing
            return projectedTotal <= this.budgetLimit;
        } else {
            // Production mode - no budget limit but warn user
            return true;
        }
    }

    recordRequest(recordCount = 1) {
        const cost = recordCount * this.recordCost;
        this.currentSpent += cost;
        this.requestCount++;
        
        // Save to localStorage
        localStorage.setItem('brightdata_spent', this.currentSpent.toString());
        localStorage.setItem('brightdata_requests', this.requestCount.toString());
        
        this.updateUI();
        
        console.log(`💰 Request recorded: ${recordCount} records, $${cost.toFixed(4)} cost, Total: $${this.currentSpent.toFixed(4)}`);
        
        // Check if approaching budget limit
        if (this.currentMode === 'sandbox' && this.currentSpent >= this.budgetLimit * 0.8) {
            this.showBudgetWarning();
        }
    }

    getCurrentApiKey() {
        return this.currentMode === 'sandbox' ? this.sandboxApiKey : this.productionApiKey;
    }

    getRemainingBudget() {
        if (this.currentMode === 'sandbox') {
            return Math.max(0, this.budgetLimit - this.currentSpent);
        }
        return Infinity; // No limit in production
    }

    getEstimatedRequests() {
        const remaining = this.getRemainingBudget();
        if (remaining === Infinity) return Infinity;
        return Math.floor(remaining / this.recordCost);
    }

    resetBudget() {
        this.currentSpent = 0.00;
        this.requestCount = 0;
        localStorage.setItem('brightdata_spent', '0');
        localStorage.setItem('brightdata_requests', '0');
        this.updateUI();
        console.log('🔄 Budget reset');
    }

    updateUI() {
        // Update usage indicator
        const usageIndicator = document.getElementById('usageIndicator');
        if (usageIndicator) {
            const usageText = usageIndicator.querySelector('.usage-text');
            if (this.currentMode === 'sandbox') {
                usageText.textContent = `Test: $${this.currentSpent.toFixed(3)}/$${this.budgetLimit.toFixed(2)}`;
                usageIndicator.style.background = this.currentSpent >= this.budgetLimit * 0.8 ? 
                    'linear-gradient(135deg, #ef4444, #dc2626)' : 
                    'linear-gradient(135deg, #10b981, #059669)';
            } else {
                usageText.textContent = `Prod: $${this.currentSpent.toFixed(3)}`;
                usageIndicator.style.background = 'linear-gradient(135deg, #8b5cf6, #7c3aed)';
            }
        }

        // Update mode buttons
        document.querySelectorAll('.mode-btn').forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === this.currentMode);
        });

        // Update sidebar stats
        const totalCostElement = document.getElementById('totalCost');
        if (totalCostElement) {
            totalCostElement.textContent = `$${this.currentSpent.toFixed(4)}`;
        }

        const searchesTodayElement = document.getElementById('searchesToday');
        if (searchesTodayElement) {
            searchesTodayElement.textContent = this.requestCount.toString();
        }
    }

    showBudgetWarning() {
        const warningHtml = `
            <div class="budget-warning" style="
                position: fixed; top: 80px; right: 20px; z-index: 1000;
                background: linear-gradient(135deg, #fbbf24, #f59e0b);
                color: white; padding: 16px 20px; border-radius: 12px;
                box-shadow: 0 8px 32px rgba(251, 191, 36, 0.3);
                animation: slideIn 0.3s ease-out;
            ">
                <div style="display: flex; align-items: center; gap: 12px;">
                    <i data-lucide="alert-triangle" style="width: 20px; height: 20px;"></i>
                    <div>
                        <strong>Budget Alert</strong><br>
                        <small>$${(this.budgetLimit - this.currentSpent).toFixed(3)} remaining of $${this.budgetLimit} test budget</small>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', warningHtml);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            const warning = document.querySelector('.budget-warning');
            if (warning) warning.remove();
        }, 5000);
    }

    showApiKeyPrompt() {
        const modal = document.getElementById('settingsModal');
        if (modal) {
            // Update modal for production API key
            const modalBody = modal.querySelector('.modal-body');
            modalBody.innerHTML = `
                <div class="config-section">
                    <h4 style="color: #8b5cf6; margin-bottom: 12px;">🚀 Production Mode Setup</h4>
                    <p style="margin-bottom: 16px; color: #64748b;">
                        Enter your BrightData Pro API key to access real social media data.
                    </p>
                    <label for="prodApiKey">Production API Key:</label>
                    <input type="password" id="prodApiKey" class="config-input" placeholder="Enter your Pro API key">
                    <small style="color: #64748b; margin-top: 8px; display: block;">
                        This will replace the hardcoded test key for production use.
                    </small>
                </div>
            `;
            
            const saveBtn = modal.querySelector('#saveConfig');
            saveBtn.onclick = () => {
                const apiKey = document.getElementById('prodApiKey').value.trim();
                if (apiKey) {
                    this.productionApiKey = apiKey;
                    localStorage.setItem('brightdata_prod_key', apiKey);
                    modal.style.display = 'none';
                    this.switchMode('production');
                } else {
                    alert('Please enter a valid API key');
                }
            };
            
            modal.style.display = 'flex';
        }
    }

    // Security: Remove hardcoded keys for production deployment
    sanitizeForProduction() {
        // This method will be called to remove hardcoded API keys
        this.sandboxApiKey = null;
        console.log('🔒 Hardcoded API keys removed for production deployment');
    }

    getDebugInfo() {
        return {
            mode: this.currentMode,
            budget: {
                limit: this.budgetLimit,
                spent: this.currentSpent,
                remaining: this.getRemainingBudget(),
                estimatedRequests: this.getEstimatedRequests()
            },
            requests: this.requestCount,
            apiKeySet: !!this.getCurrentApiKey()
        };
    }
}

// Global budget manager instance
window.brightDataBudgetManager = new BrightDataBudgetManager();

// Initialize mode switching
document.addEventListener('DOMContentLoaded', () => {
    // Mode button event listeners
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const mode = btn.dataset.mode;
            window.brightDataBudgetManager.switchMode(mode);
        });
    });
    
    // Add CSS for mode selector
    const style = document.createElement('style');
    style.textContent = `
        .mode-selector {
            display: flex;
            gap: 2px;
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border-radius: 8px;
            padding: 4px;
            margin-right: 16px;
        }
        
        .mode-btn {
            display: flex;
            align-items: center;
            gap: 6px;
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            background: transparent;
            color: rgba(255, 255, 255, 0.7);
            font-size: 12px;
            font-weight: 500;
            cursor: pointer;
            transition: all 0.2s ease;
        }
        
        .mode-btn:hover {
            background: rgba(255, 255, 255, 0.1);
            color: white;
        }
        
        .mode-btn.active {
            background: linear-gradient(135deg, #8b5cf6, #7c3aed);
            color: white;
            box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
        }
        
        .mode-btn i {
            width: 14px;
            height: 14px;
        }
        
        @keyframes slideIn {
            from { transform: translateX(100%); opacity: 0; }
            to { transform: translateX(0); opacity: 1; }
        }
    `;
    document.head.appendChild(style);
});