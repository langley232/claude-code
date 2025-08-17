// StatsAI Electron App - JavaScript
// Following Aura design principles with interactive elements

document.addEventListener('DOMContentLoaded', function() {
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }

    // Initialize all interactive features
    initializeNavigation();
    initializeDropdownNavigation();
    initializeThemeToggle();
    initializeAnimations();
    initializeMetrics();
    initializeScrollEffects();
    
    console.log('🌟 AtlasWeb Electron App Loaded with Aura Design System');
});

// Navigation functionality
function initializeNavigation() {
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetSection = document.querySelector(targetId);
            
            if (targetSection) {
                // Smooth scroll to section
                targetSection.scrollIntoView({
                    behavior: 'smooth',
                    block: 'start'
                });
                
                // Add active state animation
                this.style.transform = 'translateY(-2px)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 200);
            }
        });
    });
}

// Dropdown navigation functionality
function initializeDropdownNavigation() {
    const dropdown = document.querySelector('.nav-dropdown');
    const dropdownTrigger = document.querySelector('.nav-dropdown-trigger');
    const dropdownMenu = document.querySelector('.dropdown-menu');
    const dropdownArrow = document.querySelector('.dropdown-arrow');
    
    if (!dropdown || !dropdownTrigger || !dropdownMenu) return;
    
    let isOpen = false;
    let hoverTimeout;
    
    // Function to open dropdown
    function openDropdown() {
        if (isOpen) return;
        
        isOpen = true;
        dropdown.classList.add('active');
        dropdownMenu.style.pointerEvents = 'auto';
        
        // Stagger animation for dropdown items
        const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
        dropdownItems.forEach((item, index) => {
            setTimeout(() => {
                item.style.opacity = '1';
                item.style.transform = 'translateY(0)';
            }, index * 50);
        });
        
        // Initialize icons in dropdown if not already done
        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }
    
    // Function to close dropdown
    function closeDropdown() {
        if (!isOpen) return;
        
        isOpen = false;
        dropdown.classList.remove('active');
        dropdownMenu.style.pointerEvents = 'none';
        
        // Reset dropdown items animation
        const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
        dropdownItems.forEach(item => {
            item.style.opacity = '';
            item.style.transform = '';
        });
    }
    
    // Mouse enter/leave handlers
    dropdown.addEventListener('mouseenter', () => {
        clearTimeout(hoverTimeout);
        openDropdown();
    });
    
    dropdown.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(closeDropdown, 150); // Small delay for better UX
    });
    
    // Click handler for trigger
    dropdownTrigger.addEventListener('click', (e) => {
        e.preventDefault();
        if (isOpen) {
            closeDropdown();
        } else {
            openDropdown();
        }
    });
    
    // Handle dropdown item clicks
    const dropdownItems = dropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            // Add click animation
            item.style.transform = 'scale(0.98)';
            setTimeout(() => {
                item.style.transform = '';
            }, 150);
            
            // Close dropdown after short delay
            setTimeout(() => {
                closeDropdown();
            }, 200);
        });
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            closeDropdown();
        }
    });
    
    // Close dropdown on escape key
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && isOpen) {
            closeDropdown();
        }
    });
    
    // Initialize dropdown items with hidden state
    const dropdownItemsInit = dropdownMenu.querySelectorAll('.dropdown-item');
    dropdownItemsInit.forEach(item => {
        item.style.opacity = '0';
        item.style.transform = 'translateY(10px)';
        item.style.transition = 'all 0.3s ease';
    });
}

// Theme toggle functionality (Aura-style)
function initializeThemeToggle() {
    const themeToggles = document.querySelectorAll('.theme-toggle');
    
    // Set initial theme to dark
    document.documentElement.setAttribute('data-theme', 'dark');
    
    themeToggles.forEach(toggle => {
        toggle.addEventListener('click', function() {
            // Remove active from all toggles
            themeToggles.forEach(t => t.classList.remove('active'));
            
            // Add active to clicked toggle
            this.classList.add('active');
            
            const theme = this.dataset.theme;
            
            // Apply theme with smooth transition
            document.body.style.transition = 'all 0.5s ease';
            document.documentElement.style.transition = 'all 0.5s ease';
            
            // Set data-theme attribute for CSS variables
            document.documentElement.setAttribute('data-theme', theme);
            
            if (theme === 'light') {
                console.log('🌞 Light theme activated');
                // Update background for light theme
                const aiBackground = document.querySelector('.ai-background');
                if (aiBackground) {
                    aiBackground.style.background = `
                        radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.2) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.2) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.15) 0%, transparent 50%),
                        linear-gradient(135deg, #ffffff 0%, #f8fafc 50%, #e2e8f0 100%)
                    `;
                }
            } else {
                console.log('🌙 Dark theme activated');
                // Update background for dark theme
                const aiBackground = document.querySelector('.ai-background');
                if (aiBackground) {
                    aiBackground.style.background = `
                        radial-gradient(circle at 20% 80%, rgba(99, 102, 241, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 80% 20%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
                        radial-gradient(circle at 40% 40%, rgba(6, 182, 212, 0.2) 0%, transparent 50%),
                        linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)
                    `;
                }
            }
            
            // Reset transition after theme change
            setTimeout(() => {
                document.body.style.transition = '';
                document.documentElement.style.transition = '';
            }, 500);
        });
    });
}


// Initialize Aura-style animations
function initializeAnimations() {
    // Enhanced floating animation for background elements
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach((element, index) => {
        // Add random movement variations
        const randomDelay = Math.random() * 2;
        const randomDuration = 8 + Math.random() * 4;
        
        element.style.animationDelay = `${randomDelay}s`;
        element.style.animationDuration = `${randomDuration}s`;
        
        // Add interactive hover effects
        element.addEventListener('mouseenter', function() {
            this.style.animationPlayState = 'paused';
            this.style.transform = 'scale(1.2)';
            this.style.opacity = '0.8';
        });
        
        element.addEventListener('mouseleave', function() {
            this.style.animationPlayState = 'running';
            this.style.transform = '';
            this.style.opacity = '';
        });
    });
    
    // Add stagger animation to feature cards
    const featureCards = document.querySelectorAll('.feature-card');
    
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
                }, index * 100);
            }
        });
    }, observerOptions);
    
    featureCards.forEach(card => {
        card.style.opacity = '0';
        card.style.transform = 'translateY(30px)';
        card.style.transition = 'all 0.6s ease';
        cardObserver.observe(card);
    });
}

// Animated metrics counter
function initializeMetrics() {
    const metricValues = document.querySelectorAll('.metric-value');
    const statNumbers = document.querySelectorAll('.stat-number');
    
    function animateNumber(element, targetText) {
        const isPercentage = targetText.includes('%');
        const isCurrency = targetText.includes('$');
        const isTime = targetText.includes('ms');
        const isLarge = targetText.includes('K') || targetText.includes('M');
        
        let targetNumber;
        let suffix = '';
        
        if (isPercentage) {
            targetNumber = parseFloat(targetText.replace('%', ''));
            suffix = '%';
        } else if (isCurrency) {
            targetNumber = parseFloat(targetText.replace('$', '').replace('K', ''));
            suffix = 'K';
        } else if (isTime) {
            targetNumber = parseFloat(targetText.replace('< ', '').replace('ms', ''));
            suffix = 'ms';
        } else if (isLarge) {
            targetNumber = parseFloat(targetText.replace('K', '').replace('M', '').replace('+', ''));
            suffix = targetText.includes('K') ? 'K' : 'M';
            if (targetText.includes('+')) suffix += '+';
        } else {
            targetNumber = parseFloat(targetText);
        }
        
        let currentNumber = 0;
        const increment = targetNumber / 60; // 60 frames animation
        
        function updateNumber() {
            currentNumber += increment;
            
            if (currentNumber >= targetNumber) {
                currentNumber = targetNumber;
            }
            
            let displayValue;
            if (isCurrency) {
                displayValue = `$${currentNumber.toFixed(1)}${suffix}`;
            } else if (isTime) {
                displayValue = `< ${Math.round(currentNumber)}${suffix}`;
            } else if (isPercentage) {
                displayValue = `${currentNumber.toFixed(1)}${suffix}`;
            } else {
                displayValue = `${currentNumber.toFixed(1)}${suffix}`;
            }
            
            element.textContent = displayValue;
            
            if (currentNumber < targetNumber) {
                requestAnimationFrame(updateNumber);
            }
        }
        
        updateNumber();
    }
    
    // Observe metrics for animation trigger
    const metricsObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const originalText = entry.target.textContent;
                animateNumber(entry.target, originalText);
                metricsObserver.unobserve(entry.target);
            }
        });
    }, { threshold: 0.5 });
    
    [...metricValues, ...statNumbers].forEach(metric => {
        metricsObserver.observe(metric);
    });
}

// Scroll-based effects
function initializeScrollEffects() {
    let ticking = false;
    
    function updateScrollEffects() {
        const scrolled = window.pageYOffset;
        const rate = scrolled * -0.5;
        
        // Parallax effect for background
        const background = document.querySelector('.ai-background');
        if (background) {
            background.style.transform = `translateY(${rate}px)`;
        }
        
        // Update navigation opacity based on scroll
        const nav = document.querySelector('.aura-nav');
        if (nav) {
            const opacity = Math.min(0.95, 0.7 + (scrolled / 1000) * 0.25);
            nav.style.background = `rgba(15, 23, 42, ${opacity})`;
        }
        
        ticking = false;
    }
    
    function requestTick() {
        if (!ticking) {
            requestAnimationFrame(updateScrollEffects);
            ticking = true;
        }
    }
    
    window.addEventListener('scroll', requestTick);
}

// Button interaction effects (Aura-style)
document.addEventListener('click', function(e) {
    if (e.target.matches('.btn-primary, .btn-secondary, .feature-cta, .hero-cta')) {
        // Create ripple effect
        const button = e.target;
        const rect = button.getBoundingClientRect();
        const ripple = document.createElement('span');
        
        const size = Math.max(rect.width, rect.height);
        const x = e.clientX - rect.left - size / 2;
        const y = e.clientY - rect.top - size / 2;
        
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255, 255, 255, 0.3)';
        ripple.style.transform = 'scale(0)';
        ripple.style.animation = 'ripple 0.6s linear';
        ripple.style.pointerEvents = 'none';
        
        button.style.position = 'relative';
        button.style.overflow = 'hidden';
        button.appendChild(ripple);
        
        setTimeout(() => {
            ripple.remove();
        }, 600);
    }
});

// Add ripple animation CSS
const rippleCSS = `
@keyframes ripple {
    to {
        transform: scale(4);
        opacity: 0;
    }
}
`;

const style = document.createElement('style');
style.textContent = rippleCSS;
document.head.appendChild(style);

// Performance monitoring
let lastFrameTime = performance.now();
let frameCount = 0;
let fps = 0;

function measureFPS() {
    const currentTime = performance.now();
    frameCount++;
    
    if (currentTime - lastFrameTime >= 1000) {
        fps = Math.round((frameCount * 1000) / (currentTime - lastFrameTime));
        frameCount = 0;
        lastFrameTime = currentTime;
        
        // Log performance in development
        if (process && process.argv && process.argv.includes('--dev')) {
            console.log(`🚀 FPS: ${fps}`);
        }
    }
    
    requestAnimationFrame(measureFPS);
}

// Start performance monitoring
requestAnimationFrame(measureFPS);

// Keyboard navigation support
document.addEventListener('keydown', function(e) {
    // Focus management for accessibility
    if (e.key === 'Tab') {
        document.body.classList.add('keyboard-navigation');
    }
    
    // Escape key to close any modals or reset focus
    if (e.key === 'Escape') {
        document.activeElement.blur();
    }
});

document.addEventListener('mousedown', function() {
    document.body.classList.remove('keyboard-navigation');
});

// Add focus styles for keyboard navigation
const keyboardCSS = `
.keyboard-navigation *:focus {
    outline: 2px solid var(--primary) !important;
    outline-offset: 2px !important;
}
`;

const keyboardStyle = document.createElement('style');
keyboardStyle.textContent = keyboardCSS;
document.head.appendChild(keyboardStyle);

// Window resize handler
window.addEventListener('resize', function() {
    // Recalculate animations on resize
    const floatingElements = document.querySelectorAll('.floating-element');
    
    floatingElements.forEach(element => {
        // Reset animation to recalculate positions
        element.style.animation = 'none';
        
        setTimeout(() => {
            element.style.animation = '';
        }, 10);
    });
});

// Export functions for potential external use
window.StatsAI = {
    initializeNavigation,
    initializeDropdownNavigation,
    initializeThemeToggle,
    initializeAnimations,
    initializeMetrics,
    initializeScrollEffects
};