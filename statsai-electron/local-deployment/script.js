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
    initializeCTAButtons();
    initializeHeadlineAnimation();
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
            const href = this.getAttribute('href');
            
            // Only prevent default for hash links (internal sections)
            if (href.startsWith('#')) {
                e.preventDefault();
                
                const targetSection = document.querySelector(href);
                
                if (targetSection) {
                    // Smooth scroll to section
                    targetSection.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            }
            
            // Add active state animation for all links
            this.style.transform = 'translateY(-2px)';
            setTimeout(() => {
                this.style.transform = '';
            }, 200);
        });
    });
}

// CTA Button functionality
function initializeCTAButtons() {
    console.log('🔘 Initializing CTA buttons...');
    
    // Hero CTA button
    const heroCTA = document.querySelector('.hero-cta');
    if (heroCTA) {
        console.log('✅ Found hero CTA button');
        
        heroCTA.addEventListener('click', function(e) {
            e.preventDefault();
            console.log('🚀 Hero CTA clicked - navigating to pricing page');
            
            // Add visual feedback
            this.style.transform = 'scale(0.95)';
            setTimeout(() => {
                this.style.transform = '';
            }, 150);
            
            // Navigate to pricing page - use file:// protocol for Electron
            setTimeout(() => {
                console.log('🔄 Attempting navigation to pricing.html...');
                
                // Get current path and build the target URL
                const currentPath = window.location.pathname;
                const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));
                const targetUrl = `file://${currentDir}/pricing.html`;
                
                console.log('📍 Current path:', currentPath);
                console.log('📂 Current dir:', currentDir);
                console.log('🎯 Target URL:', targetUrl);
                
                // Add navigation success detection
                const startTime = Date.now();
                const currentUrl = window.location.href;
                
                // Method 1: Try window.location.href with full file path
                try {
                    console.log('🔄 Before navigation - Current URL:', currentUrl);
                    window.location.href = targetUrl;
                    console.log('✅ Navigation attempted with location.href');
                    
                    // Check if navigation actually worked after a delay
                    setTimeout(() => {
                        const newUrl = window.location.href;
                        const elapsed = Date.now() - startTime;
                        console.log(`⏱️ After ${elapsed}ms - Current URL:`, newUrl);
                        
                        if (newUrl === currentUrl) {
                            console.log('❌ Navigation failed - URL unchanged, trying alternative methods...');
                            
                            // Try document.location as backup
                            try {
                                console.log('🔄 Trying document.location as backup...');
                                document.location = targetUrl;
                                console.log('✅ Backup navigation attempted with document.location');
                            } catch (backupError) {
                                console.log('❌ Backup navigation failed:', backupError);
                                
                                // Final attempt with simple relative path
                                try {
                                    console.log('🔄 Final attempt with relative path...');
                                    window.location = 'pricing.html';
                                    console.log('✅ Final navigation attempted with relative path');
                                } catch (finalError) {
                                    console.log('❌ All navigation methods failed:', finalError);
                                }
                            }
                        } else {
                            console.log('✅ Navigation successful!');
                        }
                    }, 500);
                    
                } catch (error) {
                    console.log('❌ location.href failed immediately:', error);
                }
            }, 200);
        });
    } else {
        console.log('❌ Hero CTA button not found');
    }
    
    // Other CTA buttons (Join up, etc.)
    const ctaButtons = document.querySelectorAll('.btn-primary, .btn-secondary');
    ctaButtons.forEach(button => {
        if (!button.classList.contains('hero-cta')) {
            button.addEventListener('click', function(e) {
                console.log(`🔘 CTA button clicked: ${this.textContent.trim()}`);
                
                // Add visual feedback
                this.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    this.style.transform = '';
                }, 150);
            });
        }
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
            }, index * 20); // Reduced from 50ms to 20ms
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
        item.style.transition = 'all 0.2s ease'; // Reduced from 0.3s to 0.2s
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
    
    // Make feature cards appear instantly like pricing cards
    const featureCards = document.querySelectorAll('.feature-card');
    
    // For better performance, use a simple immediate reveal approach
    const observerOptions = {
        threshold: 0.01, // Trigger earlier
        rootMargin: '50px 0px -10px 0px' // More generous margins
    };
    
    const cardObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                // Immediate animation - no delay
                entry.target.style.opacity = '1';
                entry.target.style.transform = 'translateY(0)';
                cardObserver.unobserve(entry.target); // Stop observing once animated
            }
        });
    }, observerOptions);
    
    featureCards.forEach(card => {
        // Set initial state
        card.style.opacity = '0';
        card.style.transform = 'translateY(20px)'; // Reduced from 30px
        card.style.transition = 'all 0.2s ease'; // Faster transition
        cardObserver.observe(card);
    });
}

// GSAP Headline Character Animation
function initializeHeadlineAnimation() {
    console.log('🔄 Starting headline animation initialization...');
    
    // Wait for GSAP to load
    if (typeof gsap === 'undefined') {
        console.warn('❌ GSAP not loaded, skipping headline animation');
        return;
    }
    console.log('✅ GSAP loaded successfully');

    const wordContainers = document.querySelectorAll('.word-container');
    console.log(`📦 Found ${wordContainers.length} word containers`);
    
    let totalChars = 0;
    wordContainers.forEach((container, index) => {
        const word = container.getAttribute('data-word');
        if (!word) {
            console.warn(`⚠️ No data-word attribute found for container ${index}`);
            return;
        }
        
        console.log(`📝 Processing word ${index + 1}: "${word}"`);
        
        // Split word into individual characters
        const chars = word.split('').map(char => {
            const span = document.createElement('span');
            span.textContent = char === ' ' ? '\u00A0' : char; // Use non-breaking space
            span.className = 'char';
            totalChars++;
            return span;
        });
        
        // Clear container and add character spans
        container.innerHTML = '';
        chars.forEach(char => container.appendChild(char));
    });
    
    console.log(`🔤 Created ${totalChars} character elements`);
    
    // Set initial state more explicitly
    console.log('🎭 Setting initial character states (hidden)...');
    gsap.set('.char', {
        y: '100%',
        opacity: 0
    });
    
    // Create timeline for staggered animation with delay
    console.log('⏰ Creating animation timeline with 0.1s delay...');
    const tl = gsap.timeline({ 
        delay: 0.1, // Reduced from 0.5s to 0.1s
        onStart: () => {
            console.log('🚀 Animation starting now!');
        },
        onUpdate: () => {
            // Log every 25% progress
            const progress = Math.round(tl.progress() * 100);
            if (progress % 25 === 0 && progress > 0) {
                console.log(`📈 Animation progress: ${progress}%`);
            }
        },
        onComplete: () => {
            console.log('🎉 Animation completed! All characters should now be visible.');
            
            // Force refresh character styles to ensure visibility
            const chars = document.querySelectorAll('.char');
            chars.forEach((char, index) => {
                // Check if parent has headline-accent class
                const parentContainer = char.closest('.word-container');
                if (parentContainer && parentContainer.classList.contains('headline-accent')) {
                    char.style.color = 'rgb(99, 102, 241)'; // Purple color for accent
                } else {
                    char.style.color = 'rgb(248, 250, 252)'; // White color for normal text
                }
                char.style.opacity = '1';
                char.style.transform = 'translateY(0px)';
                char.style.display = 'inline-block';
            });
            
            console.log(`🔧 Force-applied styles to ${chars.length} characters`);
            console.log('👀 If you still cannot see the headline, there may be a CSS positioning issue.');
        }
    });
    
    // Animate all characters with stagger
    tl.to('.char', {
        y: 0,
        opacity: 1,
        duration: 0.5, // Reduced from 0.8s to 0.5s
        ease: 'back.out(1.7)',
        stagger: {
            amount: 1, // Reduced from 2s to 1s total stagger time
            from: 'start'
        }
    });
    
    console.log('🎬 Headline character animation initialized with detailed logging');
    
    // Debug: Check initial element visibility
    setTimeout(() => {
        const headline = document.getElementById('heroHeadline');
        if (headline) {
            const rect = headline.getBoundingClientRect();
            const computedStyle = window.getComputedStyle(headline);
            console.log('🔍 Headline element position:', {
                top: rect.top,
                left: rect.left,
                width: rect.width,
                height: rect.height,
                bottom: rect.bottom,
                right: rect.right,
                windowHeight: window.innerHeight,
                windowWidth: window.innerWidth,
                visible: rect.top >= 0 && rect.left >= 0 && rect.bottom <= window.innerHeight && rect.right <= window.innerWidth,
                display: computedStyle.display,
                visibility: computedStyle.visibility,
                opacity: computedStyle.opacity,
                transform: computedStyle.transform,
                zIndex: computedStyle.zIndex
            });
            
            // Check if headline is in viewport
            if (rect.top > window.innerHeight || rect.bottom < 0) {
                console.warn('⚠️ HEADLINE IS OUTSIDE VIEWPORT! It may be positioned incorrectly.');
            }
            
            if (rect.left > window.innerWidth || rect.right < 0) {
                console.warn('⚠️ HEADLINE IS OUTSIDE HORIZONTAL VIEWPORT!');
            }
            
            // Force scroll to headline for testing
            console.log('📍 Attempting to scroll headline into view...');
            headline.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            console.error('❌ Headline element not found!');
        }
    }, 100);
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
        if (typeof process !== 'undefined' && process.argv && process.argv.includes('--dev')) {
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
    initializeCTAButtons,
    initializeHeadlineAnimation,
    initializeAnimations,
    initializeMetrics,
    initializeScrollEffects
};