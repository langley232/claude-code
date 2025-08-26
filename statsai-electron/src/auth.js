// AtlasWeb AI Authentication System with Plaid Integration
// Frontend JavaScript for login/registration functionality

class AtlasWebAuth {
    constructor() {
        this.baseURL = 'https://us-central1-solid-topic-466217-t9.cloudfunctions.net/authHandler';
        this.currentStep = 1;
        this.selectedPlan = null;
        this.userToken = localStorage.getItem('atlasweb_token');
        this.userData = null;
        
        this.init();
    }

    init() {
        // Load Plaid Link
        this.loadPlaidScript();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Check if user is already logged in
        if (this.userToken) {
            this.validateToken();
        }
    }

    loadPlaidScript() {
        return new Promise((resolve) => {
            if (window.Plaid) {
                resolve();
                return;
            }
            
            if (!document.querySelector('script[src*="plaid"]')) {
                const script = document.createElement('script');
                script.src = 'https://cdn.plaid.com/link/v2/stable/link-initialize.js';
                script.async = true;
                script.onload = () => resolve();
                script.onerror = () => {
                    console.warn('Plaid script failed to load');
                    resolve();
                };
                document.head.appendChild(script);
            } else {
                // Script exists, wait for it to load
                const checkPlaid = setInterval(() => {
                    if (window.Plaid) {
                        clearInterval(checkPlaid);
                        resolve();
                    }
                }, 100);
                
                // Timeout after 5 seconds
                setTimeout(() => {
                    clearInterval(checkPlaid);
                    resolve();
                }, 5000);
            }
        });
    }

    setupEventListeners() {
        // Registration form
        const accountForm = document.getElementById('accountForm');
        if (accountForm) {
            accountForm.addEventListener('submit', this.handleRegistration.bind(this));
        }

        // Plan selection
        const planOptions = document.querySelectorAll('.plan-option');
        planOptions.forEach(option => {
            option.addEventListener('click', this.selectPlan.bind(this));
        });

        // Continue to payment button
        const continueBtn = document.getElementById('continueToPayment');
        if (continueBtn) {
            continueBtn.addEventListener('click', this.handleContinueToPayment.bind(this));
        }

        // Login buttons
        const loginButtons = document.querySelectorAll('.btn-secondary');
        loginButtons.forEach(btn => {
            if (btn.textContent.trim() === 'Login') {
                btn.addEventListener('click', this.showLoginModal.bind(this));
            }
        });

        // Password strength checker
        const passwordInput = document.getElementById('password');
        if (passwordInput) {
            passwordInput.addEventListener('input', this.checkPasswordStrength.bind(this));
        }
    }

    async handleRegistration(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const userData = {
            firstName: formData.get('firstName'),
            lastName: formData.get('lastName'),
            email: formData.get('email'),
            password: formData.get('password'),
            company: formData.get('company') || ''
        };

        // Validate passwords match
        const confirmPassword = formData.get('confirmPassword');
        if (userData.password !== confirmPassword) {
            this.showError('Passwords do not match');
            return;
        }

        // Validate terms agreement
        if (!formData.get('terms')) {
            this.showError('Please agree to the Terms of Service and Privacy Policy');
            return;
        }

        try {
            this.showLoading('Creating your account...');
            
            const response = await fetch(`${this.baseURL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(userData)
            });

            const result = await response.json();

            if (result.success) {
                // Store user ID for later use
                sessionStorage.setItem('pending_user_id', result.userId);
                sessionStorage.setItem('user_email', userData.email);
                
                this.showSuccess('Registration successful! Please check your email for verification.');
                this.goToStep(2);
            } else {
                this.showError(result.error || 'Registration failed');
            }
        } catch (error) {
            console.error('Registration error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    selectPlan(event) {
        // Remove previous selection
        document.querySelectorAll('.plan-option').forEach(option => {
            option.classList.remove('selected');
        });

        // Select current plan
        const planElement = event.currentTarget;
        planElement.classList.add('selected');
        this.selectedPlan = planElement.dataset.plan;

        // Update order summary
        this.updateOrderSummary();

        // Enable continue button
        const continueBtn = document.getElementById('continueToPayment');
        if (continueBtn) {
            continueBtn.disabled = false;
        }
    }

    updateOrderSummary() {
        const planPrices = {
            basic: '$20',
            pro: '$200',
            max: '$300'
        };

        const planNames = {
            basic: 'Basic',
            pro: 'Pro',
            max: 'Max'
        };

        if (this.selectedPlan) {
            document.getElementById('selectedPlanName').textContent = planNames[this.selectedPlan];
            document.getElementById('selectedPlanPrice').textContent = `${planPrices[this.selectedPlan]}/month`;
            document.getElementById('orderTotal').textContent = `${planPrices[this.selectedPlan]}/month`;
        }
    }

    async handleContinueToPayment() {
        if (!this.selectedPlan) {
            this.showError('Please select a plan');
            return;
        }

        const userId = sessionStorage.getItem('pending_user_id');
        if (!userId) {
            this.showError('User session expired. Please register again.');
            return;
        }

        try {
            this.showLoading('Setting up payment...');
            
            // Create Plaid Link token
            const response = await fetch(`${this.baseURL}/create-link-token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    userId,
                    subscriptionTier: this.selectedPlan
                })
            });

            const result = await response.json();

            if (result.success) {
                // Initialize Plaid Link
                this.initializePlaidLink(result.linkToken, userId);
                this.goToStep(3);
            } else {
                this.showError(result.error || 'Failed to setup payment');
            }
        } catch (error) {
            console.error('Payment setup error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    initializePlaidLink(linkToken, userId) {
        const handler = Plaid.create({
            token: linkToken,
            onSuccess: async (public_token, metadata) => {
                try {
                    this.showLoading('Processing payment...');
                    
                    // Create payment intent
                    const response = await fetch(`${this.baseURL}/create-payment-intent`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            userId,
                            subscriptionTier: this.selectedPlan,
                            accountId: metadata.account_id,
                            publicToken: public_token
                        })
                    });

                    const result = await response.json();

                    if (result.success) {
                        // Complete payment
                        await this.completePayment(result.intentId, userId);
                    } else {
                        this.showError(result.error || 'Payment setup failed');
                    }
                } catch (error) {
                    console.error('Payment processing error:', error);
                    this.showError('Payment processing failed');
                } finally {
                    this.hideLoading();
                }
            },
            onExit: (err, metadata) => {
                if (err) {
                    console.error('Plaid Link error:', err);
                    this.showError('Payment setup was cancelled or failed');
                }
            }
        });

        // Replace payment form with Plaid Link button
        const paymentStep = document.getElementById('step-payment');
        if (paymentStep) {
            const plaidContainer = document.createElement('div');
            plaidContainer.className = 'plaid-container';
            plaidContainer.innerHTML = `
                <div class="plaid-payment">
                    <h3>Connect Your Bank Account</h3>
                    <p>Secure payment processing with Plaid. Your bank information is encrypted and protected.</p>
                    <button class="plaid-link-button" type="button">
                        <i data-lucide="credit-card"></i>
                        Connect Bank Account & Pay
                    </button>
                    <div class="security-notice">
                        <i data-lucide="shield-check"></i>
                        <span>256-bit SSL encryption • Bank-level security</span>
                    </div>
                </div>
            `;

            const paymentForm = paymentStep.querySelector('.payment-form');
            paymentForm.innerHTML = '';
            paymentForm.appendChild(plaidContainer);

            // Add click handler for Plaid Link
            const plaidButton = plaidContainer.querySelector('.plaid-link-button');
            plaidButton.addEventListener('click', () => {
                handler.open();
            });

            // Re-initialize Lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    async completePayment(intentId, userId) {
        try {
            const response = await fetch(`${this.baseURL}/complete-payment`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    intentId,
                    userId,
                    subscriptionTier: this.selectedPlan
                })
            });

            const result = await response.json();

            if (result.success) {
                this.showSuccess('Payment successful! Your account is now active.');
                
                // Show success screen
                this.showSuccessScreen();
                
                // Clear session data
                sessionStorage.removeItem('pending_user_id');
                sessionStorage.removeItem('user_email');
                
                // Redirect to dashboard after 3 seconds
                setTimeout(() => {
                    window.location.href = '/dashboard.html';
                }, 3000);
            } else {
                this.showError(result.error || 'Payment failed');
            }
        } catch (error) {
            console.error('Payment completion error:', error);
            this.showError('Payment completion failed');
        }
    }

    showSuccessScreen() {
        const container = document.querySelector('.registration-form-container');
        if (container) {
            container.innerHTML = `
                <div class="success-screen">
                    <div class="success-icon">
                        <i data-lucide="check-circle"></i>
                    </div>
                    <h1>Welcome to AtlasWeb AI!</h1>
                    <p>Your account has been created and activated successfully.</p>
                    <p>You'll receive a confirmation email shortly with your account details.</p>
                    <div class="success-actions">
                        <button class="btn-primary" onclick="window.location.href='/dashboard.html'">
                            Go to Dashboard
                            <i data-lucide="arrow-right"></i>
                        </button>
                    </div>
                </div>
            `;

            // Re-initialize Lucide icons
            if (window.lucide) {
                window.lucide.createIcons();
            }
        }
    }

    showLoginModal() {
        // Create login modal
        const modal = document.createElement('div');
        modal.className = 'auth-modal';
        modal.innerHTML = `
            <div class="modal-backdrop" onclick="this.parentElement.remove()"></div>
            <div class="modal-content">
                <div class="modal-header">
                    <h2>Sign In to AtlasWeb</h2>
                    <button class="modal-close" onclick="this.closest('.auth-modal').remove()">
                        <i data-lucide="x"></i>
                    </button>
                </div>
                <form class="login-form" id="loginForm">
                    <div class="form-group">
                        <label for="loginEmail">Email Address</label>
                        <input type="email" id="loginEmail" name="email" required>
                    </div>
                    <div class="form-group">
                        <label for="loginPassword">Password</label>
                        <input type="password" id="loginPassword" name="password" required>
                    </div>
                    <div class="form-group">
                        <label class="checkbox-label">
                            <input type="checkbox" name="remember">
                            <span class="checkmark"></span>
                            Remember me
                        </label>
                    </div>
                    <button type="submit" class="form-submit">Sign In</button>
                    <div class="form-links">
                        <a href="#" onclick="alert('Password reset functionality coming soon!')">Forgot password?</a>
                        <a href="registration.html">Don't have an account? Sign up</a>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modal);

        // Add event listener for login form
        const loginForm = modal.querySelector('#loginForm');
        loginForm.addEventListener('submit', this.handleLogin.bind(this));

        // Re-initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }
    }

    async handleLogin(event) {
        event.preventDefault();
        
        const formData = new FormData(event.target);
        const loginData = {
            email: formData.get('email'),
            password: formData.get('password')
        };

        try {
            this.showLoading('Signing you in...');
            
            const response = await fetch(`${this.baseURL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(loginData)
            });

            const result = await response.json();

            if (result.success) {
                // Store token and user data
                localStorage.setItem('atlasweb_token', result.token);
                localStorage.setItem('atlasweb_user', JSON.stringify(result.user));
                
                this.userToken = result.token;
                this.userData = result.user;
                
                this.showSuccess('Login successful!');
                
                // Close modal and redirect
                document.querySelector('.auth-modal')?.remove();
                
                if (result.user.accountActivated) {
                    window.location.href = '/dashboard.html';
                } else {
                    window.location.href = '/complete-registration.html';
                }
            } else {
                this.showError(result.error || 'Login failed');
            }
        } catch (error) {
            console.error('Login error:', error);
            this.showError('Network error. Please try again.');
        } finally {
            this.hideLoading();
        }
    }

    async validateToken() {
        // Simple token validation - in production, verify with backend
        try {
            const userData = JSON.parse(localStorage.getItem('atlasweb_user'));
            if (userData) {
                this.userData = userData;
                this.updateUIForLoggedInUser();
            }
        } catch (error) {
            // Invalid stored data, clear it
            this.logout();
        }
    }

    updateUIForLoggedInUser() {
        // Update login buttons to show user info
        const loginButtons = document.querySelectorAll('.btn-secondary');
        loginButtons.forEach(btn => {
            if (btn.textContent.trim() === 'Login') {
                btn.textContent = `Hi, ${this.userData.firstName}`;
                btn.onclick = () => this.showUserMenu();
            }
        });
    }

    showUserMenu() {
        // Create user menu dropdown
        const menu = document.createElement('div');
        menu.className = 'user-menu';
        menu.innerHTML = `
            <div class="user-menu-content">
                <div class="user-info">
                    <strong>${this.userData.firstName} ${this.userData.lastName}</strong>
                    <span>${this.userData.email}</span>
                    <span class="user-plan">${this.userData.subscriptionTier || 'Free'} Plan</span>
                </div>
                <hr>
                <a href="/dashboard.html">Dashboard</a>
                <a href="/profile.html">Profile Settings</a>
                <a href="/billing.html">Billing</a>
                <hr>
                <a href="#" onclick="auth.logout()">Sign Out</a>
            </div>
        `;
        
        document.body.appendChild(menu);
        
        // Close on click outside
        setTimeout(() => {
            document.addEventListener('click', function closeMenu(e) {
                if (!menu.contains(e.target)) {
                    menu.remove();
                    document.removeEventListener('click', closeMenu);
                }
            });
        }, 10);
    }

    logout() {
        localStorage.removeItem('atlasweb_token');
        localStorage.removeItem('atlasweb_user');
        this.userToken = null;
        this.userData = null;
        window.location.reload();
    }

    goToStep(step) {
        // Hide all steps
        document.querySelectorAll('.form-step').forEach(stepElement => {
            stepElement.classList.remove('active');
        });

        // Hide all step indicators
        document.querySelectorAll('.step').forEach(stepIndicator => {
            stepIndicator.classList.remove('active');
        });

        // Show target step
        document.getElementById(`step-${step === 1 ? 'account' : step === 2 ? 'plan' : 'payment'}`).classList.add('active');
        
        // Update step indicator
        document.querySelectorAll('.step')[step - 1].classList.add('active');
        
        this.currentStep = step;
    }

    checkPasswordStrength(event) {
        const password = event.target.value;
        const strengthBar = document.querySelector('.strength-fill');
        const strengthText = document.querySelector('.strength-text');
        
        if (!strengthBar || !strengthText) return;

        let strength = 0;
        let feedback = [];

        // Length check
        if (password.length >= 8) strength += 25;
        else feedback.push('At least 8 characters');

        // Uppercase check
        if (/[A-Z]/.test(password)) strength += 25;
        else feedback.push('One uppercase letter');

        // Lowercase check
        if (/[a-z]/.test(password)) strength += 25;
        else feedback.push('One lowercase letter');

        // Number or symbol check
        if (/[0-9]/.test(password) || /[^A-Za-z0-9]/.test(password)) strength += 25;
        else feedback.push('One number or symbol');

        // Update UI
        strengthBar.style.width = `${strength}%`;
        
        if (strength < 50) {
            strengthBar.className = 'strength-fill weak';
            strengthText.textContent = 'Weak password';
        } else if (strength < 100) {
            strengthBar.className = 'strength-fill medium';
            strengthText.textContent = 'Good password';
        } else {
            strengthBar.className = 'strength-fill strong';
            strengthText.textContent = 'Strong password';
        }
    }

    showLoading(message) {
        // Create or update loading overlay
        let overlay = document.querySelector('.loading-overlay');
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.className = 'loading-overlay';
            document.body.appendChild(overlay);
        }
        
        overlay.innerHTML = `
            <div class="loading-content">
                <div class="loading-spinner"></div>
                <div class="loading-message">${message}</div>
            </div>
        `;
        overlay.style.display = 'flex';
    }

    hideLoading() {
        const overlay = document.querySelector('.loading-overlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showSuccess(message) {
        this.showNotification(message, 'success');
    }

    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <div class="notification-content">
                <i data-lucide="${type === 'error' ? 'alert-circle' : 'check-circle'}"></i>
                <span>${message}</span>
                <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                    <i data-lucide="x"></i>
                </button>
            </div>
        `;

        document.body.appendChild(notification);

        // Re-initialize Lucide icons
        if (window.lucide) {
            window.lucide.createIcons();
        }

        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize auth system when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.auth = new AtlasWebAuth();
});

// Password toggle function
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    const button = input.nextElementSibling;
    const icon = button.querySelector('i');
    
    if (input.type === 'password') {
        input.type = 'text';
        icon.setAttribute('data-lucide', 'eye');
    } else {
        input.type = 'password';
        icon.setAttribute('data-lucide', 'eye-off');
    }
    
    // Re-initialize Lucide icons
    if (window.lucide) {
        window.lucide.createIcons();
    }
}

// Step navigation function
function goToStep(step) {
    if (window.auth) {
        window.auth.goToStep(step);
    }
}