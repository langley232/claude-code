// Pricing Page JavaScript
// Handle plan selection and navigation to registration

document.addEventListener('DOMContentLoaded', function() {
    // Initialize pricing page functionality
    initializePricingCards();
    initializePlanSelection();
    
    console.log('💰 AtlasWeb Pricing Page Loaded');
});

// Pricing card interactions
function initializePricingCards() {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    pricingCards.forEach(card => {
        card.addEventListener('mouseenter', function() {
            // Add subtle glow effect on hover
            if (!this.classList.contains('popular')) {
                this.style.boxShadow = '0 16px 64px rgba(99, 102, 241, 0.15)';
            }
        });
        
        card.addEventListener('mouseleave', function() {
            // Remove glow effect
            if (!this.classList.contains('popular')) {
                this.style.boxShadow = '';
            }
        });
    });
}

// Plan selection and navigation
function initializePlanSelection() {
    const planButtons = document.querySelectorAll('.plan-cta');
    
    planButtons.forEach(button => {
        button.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Get plan type from button class
            let planType = 'basic';
            if (this.classList.contains('plan-cta-pro')) {
                planType = 'pro';
            } else if (this.classList.contains('plan-cta-max')) {
                planType = 'max';
            } else if (this.classList.contains('plan-cta-enterprise')) {
                planType = 'enterprise';
            }
            
            // Handle enterprise differently
            if (planType === 'enterprise') {
                handleEnterpriseContact();
                return;
            }
            
            // Store selected plan and navigate to registration
            localStorage.setItem('selectedPlan', planType);
            
            // Add loading state
            const originalText = this.innerHTML;
            this.innerHTML = '<i data-lucide="loader-2"></i> Loading...';
            this.disabled = true;
            
            // Simulate loading and navigate
            setTimeout(() => {
                window.location.href = 'registration.html';
            }, 800);
            
            console.log(`🎯 Selected plan: ${planType}`);
        });
    });
}

// Handle enterprise contact
function handleEnterpriseContact() {
    // Create modal for enterprise contact
    const modal = document.createElement('div');
    modal.className = 'enterprise-modal';
    modal.innerHTML = `
        <div class="modal-overlay"></div>
        <div class="modal-content">
            <div class="modal-header">
                <h3>Contact Sales</h3>
                <button class="modal-close">
                    <i data-lucide="x"></i>
                </button>
            </div>
            <div class="modal-body">
                <p>Ready to transform your enterprise with AtlasWeb's intelligent browser solutions?</p>
                <div class="contact-options">
                    <div class="contact-option">
                        <i data-lucide="phone"></i>
                        <div>
                            <strong>Phone</strong>
                            <span>+1 (555) 123-4567</span>
                        </div>
                    </div>
                    <div class="contact-option">
                        <i data-lucide="mail"></i>
                        <div>
                            <strong>Email</strong>
                            <span>enterprise@atlasweb.com</span>
                        </div>
                    </div>
                    <div class="contact-option">
                        <i data-lucide="calendar"></i>
                        <div>
                            <strong>Schedule Demo</strong>
                            <span>Book a personalized demonstration</span>
                        </div>
                    </div>
                </div>
            </div>
            <div class="modal-footer">
                <button class="btn-secondary modal-close">Close</button>
                <button class="btn-primary" onclick="handleScheduleDemo()">
                    Schedule Demo
                    <i data-lucide="calendar"></i>
                </button>
            </div>
        </div>
    `;
    
    document.body.appendChild(modal);
    
    // Add modal styles
    const modalStyles = `
        .enterprise-modal {
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
        
        .modal-overlay {
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.7);
            backdrop-filter: blur(10px);
        }
        
        .modal-content {
            position: relative;
            background: var(--surface);
            border: 1px solid rgba(255, 255, 255, 0.1);
            border-radius: var(--radius-lg);
            padding: var(--spacing-xl);
            max-width: 500px;
            width: 90%;
            box-shadow: var(--shadow-lg);
            animation: modalSlideIn 300ms ease;
        }
        
        .modal-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: var(--spacing-lg);
        }
        
        .modal-header h3 {
            font-size: var(--font-size-xl);
            font-weight: 700;
            color: var(--text-primary);
        }
        
        .modal-close {
            background: none;
            border: none;
            color: var(--text-secondary);
            cursor: pointer;
            padding: var(--spacing-sm);
            border-radius: var(--radius-sm);
            transition: all 200ms ease;
        }
        
        .modal-close:hover {
            background: rgba(255, 255, 255, 0.1);
            color: var(--text-primary);
        }
        
        .modal-body p {
            color: var(--text-secondary);
            margin-bottom: var(--spacing-lg);
            line-height: 1.6;
        }
        
        .contact-options {
            display: flex;
            flex-direction: column;
            gap: var(--spacing-md);
        }
        
        .contact-option {
            display: flex;
            align-items: center;
            gap: var(--spacing-md);
            padding: var(--spacing-md);
            background: rgba(255, 255, 255, 0.05);
            border-radius: var(--radius-md);
            transition: all 200ms ease;
        }
        
        .contact-option:hover {
            background: rgba(255, 255, 255, 0.1);
            transform: translateX(4px);
        }
        
        .contact-option i {
            color: var(--primary);
            width: 20px;
            height: 20px;
        }
        
        .contact-option div {
            display: flex;
            flex-direction: column;
        }
        
        .contact-option strong {
            color: var(--text-primary);
            font-weight: 600;
            margin-bottom: 2px;
        }
        
        .contact-option span {
            color: var(--text-secondary);
            font-size: var(--font-size-sm);
        }
        
        .modal-footer {
            display: flex;
            justify-content: flex-end;
            gap: var(--spacing-md);
            margin-top: var(--spacing-xl);
            padding-top: var(--spacing-lg);
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }
        
        @keyframes modalFadeIn {
            from { opacity: 0; }
            to { opacity: 1; }
        }
        
        @keyframes modalSlideIn {
            from { transform: translateY(-20px) scale(0.95); }
            to { transform: translateY(0) scale(1); }
        }
    `;
    
    const styleSheet = document.createElement('style');
    styleSheet.textContent = modalStyles;
    document.head.appendChild(styleSheet);
    
    // Initialize Lucide icons for modal
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Handle modal close
    const closeButtons = modal.querySelectorAll('.modal-close, .modal-overlay');
    closeButtons.forEach(button => {
        button.addEventListener('click', () => {
            modal.style.animation = 'modalFadeIn 200ms ease reverse';
            setTimeout(() => {
                document.body.removeChild(modal);
                document.head.removeChild(styleSheet);
            }, 200);
        });
    });
    
    console.log('📞 Enterprise contact modal opened');
}

// Handle demo scheduling
function handleScheduleDemo() {
    alert('Demo scheduling feature will be implemented with calendar integration.\\n\\nFor now, please contact us directly at enterprise@atlasweb.com');
    console.log('📅 Demo scheduling requested');
}

// Plan comparison functionality
function initializePlanComparison() {
    // Add plan comparison toggle if needed
    const compareButton = document.createElement('button');
    compareButton.className = 'compare-plans-btn';
    compareButton.innerHTML = `
        <i data-lucide="compare"></i>
        Compare Plans
    `;
    
    // This could be expanded to show a detailed comparison table
    compareButton.addEventListener('click', function() {
        console.log('📊 Plan comparison requested');
        // Implementation for plan comparison modal
    });
}

// Animate pricing cards on scroll
function initializePricingAnimations() {
    const pricingCards = document.querySelectorAll('.pricing-card');
    
    const observerOptions = {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    };
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 150);
            }
        });
    }, observerOptions);
    
    pricingCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        cardObserver.observe(card);
    });
}

// Initialize animations when page loads
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(() => {
        initializePricingAnimations();
    }, 100);
});

// Export for external use
window.PricingPage = {
    initializePricingCards,
    initializePlanSelection,
    handleEnterpriseContact,
    handleScheduleDemo
};