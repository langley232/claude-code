// Registration Page JavaScript
// Multi-step registration flow with validation

let currentStep = 1;
let selectedPlan = 'pro'; // Default to Pro plan
let formData = {};

document.addEventListener('DOMContentLoaded', function() {
    // Initialize registration page
    initializeRegistration();
    initializeFormValidation();
    initializePlanSelection();
    initializePaymentForm();
    
    // Check if user came from pricing page with pre-selected plan
    const urlPlan = localStorage.getItem('selectedPlan');
    if (urlPlan) {
        selectedPlan = urlPlan;
        localStorage.removeItem('selectedPlan');
    }
    
    console.log('📝 AtlasWeb Registration Page Loaded');
});

// Initialize registration flow
function initializeRegistration() {
    // Set initial step
    goToStep(1);
    
    // Initialize account form submission
    const accountForm = document.getElementById('accountForm');
    if (accountForm) {
        accountForm.addEventListener('submit', handleAccountFormSubmit);
    }
    
    // Initialize payment form submission
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        paymentForm.addEventListener('submit', handlePaymentFormSubmit);
    }
}

// Form validation
function initializeFormValidation() {
    // Password strength checking
    const passwordInput = document.getElementById('password');
    if (passwordInput) {
        passwordInput.addEventListener('input', updatePasswordStrength);
    }
    
    // Real-time form validation
    const formInputs = document.querySelectorAll('.form-input');
    formInputs.forEach(input => {
        input.addEventListener('blur', validateField);
        input.addEventListener('input', clearFieldError);
    });
    
    // Confirm password validation
    const confirmPasswordInput = document.getElementById('confirmPassword');
    if (confirmPasswordInput) {
        confirmPasswordInput.addEventListener('input', validatePasswordMatch);
    }
}

// Password strength indicator
function updatePasswordStrength() {
    const password = document.getElementById('password').value;
    const strengthFill = document.querySelector('.strength-fill');
    const strengthText = document.querySelector('.strength-text');
    
    if (!strengthFill || !strengthText) return;
    
    const strength = calculatePasswordStrength(password);
    
    // Update progress bar
    strengthFill.style.width = `${strength.percentage}%`;
    strengthFill.style.background = strength.color;
    strengthText.textContent = strength.text;
    strengthText.style.color = strength.color;
}

function calculatePasswordStrength(password) {
    let score = 0;
    const checks = {
        length: password.length >= 8,
        lowercase: /[a-z]/.test(password),
        uppercase: /[A-Z]/.test(password),
        numbers: /[0-9]/.test(password),
        symbols: /[^A-Za-z0-9]/.test(password)
    };
    
    score = Object.values(checks).filter(Boolean).length;
    
    if (password.length === 0) {
        return { percentage: 0, color: 'var(--text-muted)', text: 'Password strength' };
    }
    
    const levels = [
        { percentage: 20, color: '#ef4444', text: 'Very weak' },
        { percentage: 40, color: '#f97316', text: 'Weak' },
        { percentage: 60, color: '#eab308', text: 'Fair' },
        { percentage: 80, color: '#22c55e', text: 'Good' },
        { percentage: 100, color: '#16a34a', text: 'Strong' }
    ];
    
    return levels[Math.min(score - 1, 4)] || levels[0];
}

// Field validation
function validateField(event) {
    const field = event.target;
    const value = field.value.trim();
    let isValid = true;
    let errorMessage = '';
    
    // Required field validation
    if (field.hasAttribute('required') && !value) {
        isValid = false;
        errorMessage = 'This field is required';
    }
    
    // Email validation
    if (field.type === 'email' && value) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
            isValid = false;
            errorMessage = 'Please enter a valid email address';
        }
    }
    
    // Password validation
    if (field.id === 'password' && value) {
        if (value.length < 8) {
            isValid = false;
            errorMessage = 'Password must be at least 8 characters long';
        }
    }
    
    // Show/hide error
    showFieldError(field, isValid ? '' : errorMessage);
    return isValid;
}

function validatePasswordMatch() {
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;
    const field = document.getElementById('confirmPassword');
    
    if (confirmPassword && password !== confirmPassword) {
        showFieldError(field, 'Passwords do not match');
        return false;
    } else {
        showFieldError(field, '');
        return true;
    }
}

function showFieldError(field, message) {
    // Remove existing error
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    
    if (message) {
        // Add error styling
        field.style.borderColor = '#ef4444';
        
        // Add error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'field-error';
        errorDiv.style.cssText = `
            color: #ef4444;
            font-size: var(--font-size-xs);
            margin-top: var(--spacing-xs);
        `;
        errorDiv.textContent = message;
        field.parentNode.appendChild(errorDiv);
    } else {
        // Remove error styling
        field.style.borderColor = '';
    }
}

function clearFieldError(event) {
    const field = event.target;
    if (field.value.trim()) {
        showFieldError(field, '');
    }
}

// Plan selection
function initializePlanSelection() {
    const planOptions = document.querySelectorAll('.plan-option');
    const continueButton = document.getElementById('continueToPayment');
    
    planOptions.forEach(option => {
        option.addEventListener('click', function() {
            // Remove selected from all options
            planOptions.forEach(opt => opt.classList.remove('selected'));
            
            // Add selected to clicked option
            this.classList.add('selected');
            
            // Update selected plan
            selectedPlan = this.dataset.plan;
            
            // Enable continue button
            if (continueButton) {
                continueButton.disabled = false;
            }
            
            console.log(`📋 Selected plan: ${selectedPlan}`);
        });
    });
    
    // Pre-select plan if coming from pricing page
    if (selectedPlan) {
        const planOption = document.querySelector(`[data-plan="${selectedPlan}"]`);
        if (planOption) {
            planOption.click();
        }
    }
    
    // Continue to payment handler
    if (continueButton) {
        continueButton.addEventListener('click', function() {
            if (selectedPlan) {
                updateOrderSummary();
                goToStep(3);
            }
        });
    }
}

function updateOrderSummary() {
    const planPrices = {
        basic: { name: 'Basic', price: '$20' },
        pro: { name: 'Pro', price: '$200' },
        max: { name: 'Max', price: '$300' }
    };
    
    const plan = planPrices[selectedPlan];
    if (plan) {
        const planNameEl = document.getElementById('selectedPlanName');
        const planPriceEl = document.getElementById('selectedPlanPrice');
        const orderTotalEl = document.getElementById('orderTotal');
        
        if (planNameEl) planNameEl.textContent = plan.name;
        if (planPriceEl) planPriceEl.textContent = `${plan.price}/month`;
        if (orderTotalEl) orderTotalEl.textContent = `${plan.price}/month`;
    }
}

// Payment form
function initializePaymentForm() {
    // Format card number input
    const cardNumberInput = document.getElementById('cardNumber');
    if (cardNumberInput) {
        cardNumberInput.addEventListener('input', formatCardNumber);
    }
    
    // Format expiry date input
    const expiryInput = document.getElementById('expiryDate');
    if (expiryInput) {
        expiryInput.addEventListener('input', formatExpiryDate);
    }
    
    // Format CVV input
    const cvvInput = document.getElementById('cvv');
    if (cvvInput) {
        cvvInput.addEventListener('input', formatCVV);
    }
}

function formatCardNumber(event) {
    let value = event.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = value.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    
    for (let i = 0, len = match.length; i < len; i += 4) {
        parts.push(match.substring(i, i + 4));
    }
    
    if (parts.length) {
        event.target.value = parts.join(' ');
    } else {
        event.target.value = value;
    }
}

function formatExpiryDate(event) {
    let value = event.target.value.replace(/\D/g, '');
    if (value.length >= 2) {
        value = value.substring(0, 2) + '/' + value.substring(2, 4);
    }
    event.target.value = value;
}

function formatCVV(event) {
    event.target.value = event.target.value.replace(/\D/g, '').substring(0, 4);
}

// Form submission handlers
function handleAccountFormSubmit(event) {
    event.preventDefault();
    
    // Validate all fields
    const formInputs = event.target.querySelectorAll('.form-input[required]');
    let isValid = true;
    
    formInputs.forEach(input => {
        if (!validateField({ target: input })) {
            isValid = false;
        }
    });
    
    // Check password match
    if (!validatePasswordMatch()) {
        isValid = false;
    }
    
    // Check terms acceptance
    const termsCheckbox = document.getElementById('terms');
    if (!termsCheckbox.checked) {
        alert('Please accept the Terms of Service and Privacy Policy to continue.');
        isValid = false;
    }
    
    if (isValid) {
        // Store form data
        const formData = new FormData(event.target);
        window.registrationData = Object.fromEntries(formData);
        
        // Proceed to plan selection
        goToStep(2);
        console.log('✅ Account form validated, proceeding to plan selection');
    } else {
        console.log('❌ Account form validation failed');
    }
}

function handlePaymentFormSubmit(event) {
    event.preventDefault();
    
    // Show loading state
    const submitButton = event.target.querySelector('.payment-submit');
    const originalText = submitButton.innerHTML;
    submitButton.innerHTML = '<i data-lucide="loader-2"></i> Processing...';
    submitButton.disabled = true;
    
    // Simulate payment processing
    setTimeout(() => {
        // In a real application, you would integrate with Stripe here
        console.log('💳 Payment processing completed (simulated)');
        
        // Show success message
        showPaymentSuccess();
    }, 2000);
}

function showPaymentSuccess() {
    // Create success modal
    const modal = document.createElement('div');
    modal.className = 'success-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="success-icon">
                <i data-lucide="check-circle"></i>
            </div>
            <h2>Welcome to AtlasWeb!</h2>
            <p>Your account has been created successfully. You can now start using your intelligent browser with AI-powered agents.</p>
            <div class="success-actions">
                <button class="btn-primary" onclick="redirectToApp()">
                    Launch AtlasWeb
                    <i data-lucide="arrow-right"></i>
                </button>
            </div>
        </div>
    `;
    
    // Add modal styles
    const modalStyles = `
        .success-modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: modalFadeIn 300ms ease;
        }
        
        .success-modal .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
        }
        
        .success-modal .modal-content {
            position: relative;
            background: var(--surface);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--radius-lg);
            padding: var(--spacing-3xl);
            max-width: 500px;
            width: 90%;
            text-align: center;
            box-shadow: var(--shadow-lg);
            animation: modalSlideIn 300ms ease;
        }
        
        .success-icon {
            width: 80px;
            height: 80px;
            margin: 0 auto var(--spacing-lg);
            display: flex;
            align-items: center;
            justify-content: center;
            background: linear-gradient(135deg, var(--emerald), var(--cyan));
            border-radius: 50%;
        }
        
        .success-icon i {
            width: 40px;
            height: 40px;
            color: white;
        }
        
        .success-modal h2 {
            font-size: var(--font-size-3xl);
            font-weight: 800;
            margin-bottom: var(--spacing-lg);
            background: linear-gradient(135deg, var(--text-primary), var(--primary));
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        
        .success-modal p {
            color: var(--text-secondary);
            margin-bottom: var(--spacing-xl);
            line-height: 1.6;
        }
        
        .success-actions {
            display: flex;
            justify-content: center;
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
    
    document.body.appendChild(modal);
    
    // Initialize Lucide icons for modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

function redirectToApp() {
    // In a real application, this would redirect to the main app
    window.location.href = 'index.html';
}

// Navigation between steps
function goToStep(stepNumber) {
    // Hide all steps
    document.querySelectorAll('.form-step').forEach(step => {
        step.classList.remove('active');
    });
    
    // Show target step
    const targetStep = document.getElementById(`step-${getStepName(stepNumber)}`);
    if (targetStep) {
        targetStep.classList.add('active');
    }
    
    // Update progress indicators
    updateStepIndicators(stepNumber);
    
    currentStep = stepNumber;
    console.log(`📍 Moved to step ${stepNumber}`);
}

function getStepName(stepNumber) {
    const stepNames = {
        1: 'account',
        2: 'plan',
        3: 'payment'
    };
    return stepNames[stepNumber] || 'account';
}

function updateStepIndicators(activeStep) {
    const steps = document.querySelectorAll('.step');
    steps.forEach((step, index) => {
        if (index + 1 <= activeStep) {
            step.classList.add('active');
        } else {
            step.classList.remove('active');
        }
    });
}

// Password toggle functionality
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
    
    // Reinitialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Navigation to external payment page
function proceedToExternalPayment() {
    // Validate payment form first (billing info in the embedded step)
    const paymentForm = document.getElementById('paymentForm');
    if (paymentForm) {
        const formInputs = paymentForm.querySelectorAll('.form-input[required]');
        let isValid = true;
        
        formInputs.forEach(input => {
            if (!validateField({ target: input })) {
                isValid = false;
            }
        });
        
        if (!isValid) {
            console.log('❌ Payment form validation failed');
            return;
        }
    }
    
    // Store all registration data including payment step
    const registrationData = {
        ...window.registrationData,
        selectedPlan: selectedPlan,
        // Store any filled payment info
        billingName: document.getElementById('billingName')?.value || '',
        billingAddress: document.getElementById('billingAddress')?.value || '',
        billingCity: document.getElementById('billingCity')?.value || '',
        billingZip: document.getElementById('billingZip')?.value || ''
    };
    
    // Save to localStorage for the payment page
    localStorage.setItem('atlaswebRegistration', JSON.stringify(registrationData));
    
    console.log('💳 Proceeding to external payment page with data:', registrationData);
    
    // Navigate to payment page
    window.location.href = 'payment.html';
}

// Export functions for global use
window.goToStep = goToStep;
window.togglePassword = togglePassword;
window.redirectToApp = redirectToApp;
window.proceedToExternalPayment = proceedToExternalPayment;