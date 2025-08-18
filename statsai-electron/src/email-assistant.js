// Email Assistant JavaScript Functionality

let emailData = null;
let selectedEmail = null;
let currentFolder = 'inbox';

// Initialize the email assistant when page loads
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Email Assistant Loading...');
    
    // Initialize Lucide icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
    
    // Load email data and initialize features
    loadEmailData();
    initializeEmailList();
    initializeTabs();
    initializeVoiceFeatures();
    initializeAIChat();
    initializeCalendar();
    initializeResponsive();
    
    console.log('✅ Email Assistant Loaded Successfully');
});

// Load mock email data
async function loadEmailData() {
    try {
        const response = await fetch('./data/mock-emails.json');
        emailData = await response.json();
        console.log('📧 Email data loaded:', emailData.emails.length + ' emails');
        renderEmailList();
        updateStats();
    } catch (error) {
        console.error('Failed to load email data:', error);
        // Fallback to inline data if file not found
        loadFallbackData();
    }
}

// Fallback data if JSON file can't be loaded
function loadFallbackData() {
    emailData = {
        emails: [
            {
                id: 'email-1',
                from: { name: 'Sarah Chen', email: 'sarah.chen@techcorp.com', avatar: 'SC' },
                subject: 'Q1 Product Roadmap Review - Action Required',
                preview: 'Hi John, I need your input on the Q1 roadmap priorities...',
                body: 'Hi John,\n\nI need your input on the Q1 roadmap priorities before our stakeholder meeting.\n\nKey items:\n1. AI integration timeline\n2. Budget approval for mobile app\n3. User research findings\n\nCan we schedule a call tomorrow?\n\nBest,\nSarah',
                timestamp: '2024-03-15T09:30:00Z',
                unread: true,
                important: true,
                badges: ['priority', 'ai'],
                category: 'work'
            },
            {
                id: 'email-2',
                from: { name: 'Alex Rodriguez', email: 'alex.r@designstudio.com', avatar: 'AR' },
                subject: 'Email Assistant UI Mockups Ready',
                preview: 'The latest mockups for the email assistant are ready for review...',
                body: 'Hi John,\n\nThe latest mockups for the email assistant are ready for review. I\'ve incorporated all your feedback about the three-panel layout.\n\nKey updates:\n- Improved panel ratios\n- Better mobile responsiveness\n- Enhanced AI chat interface\n\nLet me know your thoughts!\n\nBest,\nAlex',
                timestamp: '2024-03-15T07:20:00Z',
                unread: true,
                important: false,
                badges: ['ai'],
                category: 'design'
            }
        ],
        aiResponses: [
            {
                trigger: 'summarize inbox',
                response: 'I found 2 emails requiring attention:\n\n1. Sarah Chen - Q1 Roadmap Review (High Priority)\n2. Alex Rodriguez - UI Mockups Ready\n\nShall I help you draft responses?'
            }
        ]
    };
    renderEmailList();
    updateStats();
}

// Render email list in sidebar
function renderEmailList() {
    const emailList = document.getElementById('emailList');
    if (!emailList || !emailData) return;
    
    const folderEmails = emailData.emails.filter(email => {
        if (currentFolder === 'inbox') return true;
        if (currentFolder === 'unread') return email.unread;
        if (currentFolder === 'important') return email.important;
        return true;
    });
    
    emailList.innerHTML = folderEmails.map(email => `
        <div class="email-item ${email.unread ? 'email-unread' : ''}" data-email-id="${email.id}">
            <div class="email-item-header">
                <span class="email-sender">${email.from.name}</span>
                <span class="email-time">${formatTime(email.timestamp)}</span>
            </div>
            <div class="email-subject">${email.subject}</div>
            <div class="email-preview">${email.preview}</div>
            ${email.badges ? `
                <div class="email-badges">
                    ${email.badges.map(badge => `
                        <span class="email-badge badge-${badge}">${badge}</span>
                    `).join('')}
                </div>
            ` : ''}
        </div>
    `).join('');
    
    // Add click handlers for email items
    emailList.querySelectorAll('.email-item').forEach(item => {
        item.addEventListener('click', () => {
            const emailId = item.dataset.emailId;
            selectEmail(emailId);
        });
    });
}

// Select and display email
function selectEmail(emailId) {
    const email = emailData.emails.find(e => e.id === emailId);
    if (!email) return;
    
    selectedEmail = email;
    
    // Update UI selection
    document.querySelectorAll('.email-item').forEach(item => {
        item.classList.remove('email-selected');
    });
    document.querySelector(`[data-email-id="${emailId}"]`).classList.add('email-selected');
    
    // Mark as read
    email.unread = false;
    updateStats();
    
    // Display email content
    displayEmail(email);
    
    console.log('📖 Selected email:', email.subject);
}

// Display email in viewer
function displayEmail(email) {
    const emailContent = document.getElementById('emailContent');
    if (!emailContent) return;
    
    emailContent.innerHTML = `
        <div class="email-full">
            <div class="email-header-full">
                <h2 class="email-subject-full">${email.subject}</h2>
                <div class="email-meta">
                    <div class="email-from">
                        <div class="sender-avatar">${email.from.avatar}</div>
                        <div class="sender-info">
                            <div class="sender-name">${email.from.name}</div>
                            <div class="sender-email">${email.from.email}</div>
                        </div>
                    </div>
                    <div class="email-time">${formatDateTime(email.timestamp)}</div>
                </div>
                ${email.badges ? `
                    <div class="email-badges">
                        ${email.badges.map(badge => `
                            <span class="email-badge badge-${badge}">${badge}</span>
                        `).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="email-body">
                ${email.body.replace(/\n/g, '<br>')}
            </div>
        </div>
    `;
    
    // Add AI context message
    addAIContextMessage(email);
}

// Add AI context message to chat
function addAIContextMessage(email) {
    const contextMessage = `I've analyzed the email from ${email.from.name}. Here's what I found:

📝 **Key Points:**
${email.important ? '• This email is marked as high priority' : '• Standard priority email'}
${email.badges && email.badges.includes('calendar') ? '• Contains calendar/meeting information' : ''}
${email.badges && email.badges.includes('ai') ? '• AI-related content detected' : ''}

💡 **Suggested Actions:**
• Reply with acknowledgment
• Schedule follow-up if needed
${email.badges && email.badges.includes('calendar') ? '• Add meeting to calendar' : ''}

How would you like me to help you respond?`;

    addMessageToChat(contextMessage, 'ai');
}

// Update email statistics
function updateStats() {
    if (!emailData) return;
    
    const unreadCount = emailData.emails.filter(email => email.unread).length;
    const unreadCountEl = document.getElementById('unreadCount');
    if (unreadCountEl) {
        unreadCountEl.textContent = unreadCount;
    }
    
    // Update folder counts
    document.querySelectorAll('.folder-count').forEach((el, index) => {
        const counts = [
            emailData.emails.filter(e => true).length, // Inbox
            emailData.emails.filter(e => e.category === 'sent').length, // Sent
            emailData.emails.filter(e => e.important).length, // Starred
            0, // Archive
            0  // Trash
        ];
        if (counts[index] !== undefined) {
            el.textContent = counts[index];
        }
    });
}

// Format timestamp for display
function formatTime(timestamp) {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 24 * 60 * 60 * 1000) {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else {
        return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
}

function formatDateTime(timestamp) {
    const date = new Date(timestamp);
    return date.toLocaleString([], { 
        year: 'numeric',
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
}

// Initialize tab switching
function initializeTabs() {
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.tab;
            
            // Update tab buttons
            tabBtns.forEach(b => b.classList.remove('tab-active'));
            btn.classList.add('tab-active');
            
            // Update tab content
            tabContents.forEach(content => {
                content.classList.remove('tab-content-active');
                if (content.id === targetTab + 'Tab') {
                    content.classList.add('tab-content-active');
                }
            });
            
            console.log('📑 Switched to tab:', targetTab);
        });
    });
}

// Initialize AI chat functionality
function initializeAIChat() {
    const chatInput = document.getElementById('chatInput');
    const sendBtn = document.getElementById('sendBtn');
    const suggestions = document.querySelectorAll('.suggestion-chip');
    
    // Send message function
    function sendMessage() {
        const message = chatInput.value.trim();
        if (!message) return;
        
        addMessageToChat(message, 'user');
        chatInput.value = '';
        
        // Simulate AI response
        setTimeout(() => {
            const response = generateAIResponse(message);
            addMessageToChat(response, 'ai');
        }, 1500);
    }
    
    // Event listeners
    if (sendBtn) {
        sendBtn.addEventListener('click', sendMessage);
    }
    
    if (chatInput) {
        chatInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
            }
        });
        
        // Auto-resize textarea
        chatInput.addEventListener('input', function() {
            this.style.height = 'auto';
            this.style.height = this.scrollHeight + 'px';
        });
    }
    
    // Suggestion chips
    suggestions.forEach(chip => {
        chip.addEventListener('click', () => {
            const suggestion = chip.textContent;
            addMessageToChat(suggestion, 'user');
            
            setTimeout(() => {
                const response = generateAIResponse(suggestion);
                addMessageToChat(response, 'ai');
            }, 1500);
        });
    });
}

// Add message to chat
function addMessageToChat(message, sender) {
    const chatMessages = document.getElementById('chatMessages');
    if (!chatMessages) return;
    
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${sender}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'message-avatar';
    avatar.innerHTML = sender === 'ai' ? '<i data-lucide="brain"></i>' : '<i data-lucide="user"></i>';
    
    const content = document.createElement('div');
    content.className = 'message-content';
    content.innerHTML = message.replace(/\n/g, '<br>');
    
    messageDiv.appendChild(avatar);
    messageDiv.appendChild(content);
    chatMessages.appendChild(messageDiv);
    
    // Scroll to bottom
    chatMessages.scrollTop = chatMessages.scrollHeight;
    
    // Reinitialize icons
    if (typeof lucide !== 'undefined') {
        lucide.createIcons();
    }
}

// Generate AI response based on message
function generateAIResponse(message) {
    const lowerMessage = message.toLowerCase();
    
    // Check for predefined responses
    if (emailData && emailData.aiResponses) {
        const response = emailData.aiResponses.find(r => 
            lowerMessage.includes(r.trigger.toLowerCase())
        );
        if (response) return response.response;
    }
    
    // Contextual responses based on keywords
    if (lowerMessage.includes('reply') || lowerMessage.includes('respond')) {
        return selectedEmail ? 
            `I'll help you draft a reply to ${selectedEmail.from.name}. Based on their email about "${selectedEmail.subject}", here's a suggested response:\n\nHi ${selectedEmail.from.name},\n\nThank you for your email regarding ${selectedEmail.subject.toLowerCase()}. I've reviewed the details and...\n\nWould you like me to customize this draft further?` :
            "Please select an email first, then I can help you draft a response based on its content.";
    }
    
    if (lowerMessage.includes('schedule') || lowerMessage.includes('meeting')) {
        return "I can help you schedule a meeting. Based on your calendar, I have these available slots:\n\n• Tomorrow 2:00 PM - 3:00 PM\n• Thursday 10:00 AM - 11:00 AM\n• Friday 3:30 PM - 4:30 PM\n\nWhich time works best, and who should I invite?";
    }
    
    if (lowerMessage.includes('form') || lowerMessage.includes('fill')) {
        return "I can help you fill out forms automatically! I've detected these common form types in your recent emails:\n\n• Meeting request forms\n• Contact information forms\n• Survey responses\n\nWhich type of form would you like me to help with?";
    }
    
    if (lowerMessage.includes('voice') || lowerMessage.includes('speak')) {
        return "Voice commands are active! You can try:\n\n🎙️ \"Read my emails\"\n🎙️ \"Compose email to [name]\"\n🎙️ \"Schedule meeting\"\n🎙️ \"Summarize today's emails\"\n\nJust click the microphone button to start voice interaction.";
    }
    
    if (lowerMessage.includes('analyze') || lowerMessage.includes('insight')) {
        return selectedEmail ? 
            `Analysis of email from ${selectedEmail.from.name}:\n\n📊 **Tone**: ${selectedEmail.important ? 'Formal/Urgent' : 'Professional'}\n📈 **Priority**: ${selectedEmail.important ? 'High' : 'Normal'}\n🎯 **Action Required**: ${selectedEmail.badges && selectedEmail.badges.includes('calendar') ? 'Schedule meeting' : 'Response needed'}\n⏱️ **Estimated Response Time**: 5-10 minutes\n\nWould you like me to suggest a response strategy?` :
            "Please select an email first, and I'll provide detailed analysis including tone, priority, and suggested actions.";
    }
    
    // Default responses
    const defaultResponses = [
        "I'm here to help with your email management! I can compose replies, schedule meetings, fill forms, and provide insights about your emails.",
        "As your AI assistant, I can help you with email composition, calendar management, form automation, and voice interactions. What would you like me to help with?",
        "I'm powered by GPT-OSS 20B for complex reasoning on desktop. How can I assist you with your email workflow today?",
        "I can help streamline your email management with AI-powered features. Try asking me to summarize your inbox or draft a response!"
    ];
    
    return defaultResponses[Math.floor(Math.random() * defaultResponses.length)];
}

// Initialize voice features
function initializeVoiceFeatures() {
    const voiceBtn = document.getElementById('voiceBtn');
    const voiceInput = document.getElementById('voiceInput');
    const voiceModal = document.getElementById('voiceModal');
    const voiceCancel = document.getElementById('voiceCancel');
    const voiceDone = document.getElementById('voiceDone');
    
    function showVoiceModal() {
        if (voiceModal) {
            voiceModal.classList.add('active');
            console.log('🎙️ Voice recording started');
            
            // Simulate voice recording
            setTimeout(() => {
                if (voiceModal.classList.contains('active')) {
                    hideVoiceModal();
                    addMessageToChat("Voice command received: 'Summarize my inbox'", 'user');
                    setTimeout(() => {
                        addMessageToChat(generateAIResponse('summarize inbox'), 'ai');
                    }, 1000);
                }
            }, 3000);
        }
    }
    
    function hideVoiceModal() {
        if (voiceModal) {
            voiceModal.classList.remove('active');
            console.log('🎙️ Voice recording stopped');
        }
    }
    
    // Event listeners
    if (voiceBtn) voiceBtn.addEventListener('click', showVoiceModal);
    if (voiceInput) voiceInput.addEventListener('click', showVoiceModal);
    if (voiceCancel) voiceCancel.addEventListener('click', hideVoiceModal);
    if (voiceDone) voiceDone.addEventListener('click', hideVoiceModal);
    
    // Close modal on background click
    if (voiceModal) {
        voiceModal.addEventListener('click', (e) => {
            if (e.target === voiceModal) hideVoiceModal();
        });
    }
}

// Initialize calendar
function initializeCalendar() {
    const calendarGrid = document.getElementById('calendarGrid');
    if (!calendarGrid) return;
    
    const today = new Date();
    const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
    
    // Day headers
    const dayHeaders = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
    dayHeaders.forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day calendar-header';
        dayEl.textContent = day;
        calendarGrid.appendChild(dayEl);
    });
    
    // Empty cells for first week
    for (let i = 0; i < firstDay; i++) {
        const emptyEl = document.createElement('div');
        emptyEl.className = 'calendar-day';
        calendarGrid.appendChild(emptyEl);
    }
    
    // Calendar days
    for (let day = 1; day <= daysInMonth; day++) {
        const dayEl = document.createElement('div');
        dayEl.className = 'calendar-day';
        dayEl.textContent = day;
        
        if (day === today.getDate()) {
            dayEl.classList.add('today');
        }
        
        // Add some random events
        if ([5, 12, 18, 25].includes(day)) {
            dayEl.classList.add('has-event');
        }
        
        calendarGrid.appendChild(dayEl);
    }
}

// Initialize responsive features
function initializeResponsive() {
    // Mobile menu toggle (placeholder)
    const mobileBreakpoint = 968;
    
    function checkResponsive() {
        const isMobile = window.innerWidth <= mobileBreakpoint;
        document.body.classList.toggle('mobile-view', isMobile);
    }
    
    window.addEventListener('resize', checkResponsive);
    checkResponsive();
}

// Initialize email list functionality
function initializeEmailList() {
    // Folder switching
    document.querySelectorAll('.folder-item').forEach(folder => {
        folder.addEventListener('click', () => {
            document.querySelectorAll('.folder-item').forEach(f => f.classList.remove('folder-active'));
            folder.classList.add('folder-active');
            
            const folderName = folder.textContent.trim().toLowerCase();
            currentFolder = folderName;
            renderEmailList();
            
            console.log('📁 Switched to folder:', folderName);
        });
    });
    
    // Search functionality
    const emailSearch = document.getElementById('emailSearch');
    if (emailSearch) {
        emailSearch.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase();
            
            document.querySelectorAll('.email-item').forEach(item => {
                const subject = item.querySelector('.email-subject').textContent.toLowerCase();
                const sender = item.querySelector('.email-sender').textContent.toLowerCase();
                const preview = item.querySelector('.email-preview').textContent.toLowerCase();
                
                const matches = subject.includes(searchTerm) || 
                               sender.includes(searchTerm) || 
                               preview.includes(searchTerm);
                
                item.style.display = matches ? 'block' : 'none';
            });
        });
    }
    
    // Email actions
    const actionBtns = {
        'replyBtn': () => switchToCompose('reply'),
        'forwardBtn': () => switchToCompose('forward'),
        'archiveBtn': () => archiveEmail(),
        'deleteBtn': () => deleteEmail(),
        'aiAnalyzeBtn': () => analyzeEmailWithAI(),
        'autoReplyBtn': () => generateAutoReply()
    };
    
    Object.entries(actionBtns).forEach(([id, handler]) => {
        const btn = document.getElementById(id);
        if (btn) btn.addEventListener('click', handler);
    });
}

// Email action functions
function switchToCompose(type) {
    // Switch to compose tab
    document.querySelector('[data-tab="compose"]').click();
    
    if (!selectedEmail) return;
    
    const composeTo = document.getElementById('composeTo');
    const composeSubject = document.getElementById('composeSubject');
    const composeBody = document.getElementById('composeBody');
    
    if (type === 'reply' && composeTo && composeSubject && composeBody) {
        composeTo.value = selectedEmail.from.email;
        composeSubject.value = 'Re: ' + selectedEmail.subject;
        composeBody.value = `\n\n--- Original Message ---\nFrom: ${selectedEmail.from.name}\nSubject: ${selectedEmail.subject}\n\n${selectedEmail.body}`;
        
        addMessageToChat(`I've prepared a reply draft to ${selectedEmail.from.name}. You can review and edit it in the compose tab.`, 'ai');
    }
}

function archiveEmail() {
    if (selectedEmail) {
        addMessageToChat(`Email from ${selectedEmail.from.name} has been archived.`, 'ai');
        console.log('📦 Archived email:', selectedEmail.subject);
    }
}

function deleteEmail() {
    if (selectedEmail) {
        addMessageToChat(`Email from ${selectedEmail.from.name} has been moved to trash.`, 'ai');
        console.log('🗑️ Deleted email:', selectedEmail.subject);
    }
}

function analyzeEmailWithAI() {
    if (selectedEmail) {
        const analysis = generateAIResponse('analyze this email');
        addMessageToChat(analysis, 'ai');
        
        // Switch to chat tab to show analysis
        document.querySelector('[data-tab="chat"]').click();
    } else {
        addMessageToChat("Please select an email first to analyze.", 'ai');
    }
}

function generateAutoReply() {
    if (selectedEmail) {
        addMessageToChat(`Generating auto-reply for email from ${selectedEmail.from.name}...`, 'ai');
        
        setTimeout(() => {
            const autoReply = `Hi ${selectedEmail.from.name},\n\nThank you for your email regarding "${selectedEmail.subject}". I've received your message and will review the details.\n\nI'll get back to you within 24 hours with a detailed response.\n\nBest regards,\nJohn`;
            
            addMessageToChat(`Auto-reply generated! Here's the suggested response:\n\n"${autoReply}"\n\nWould you like me to send this or would you prefer to edit it first?`, 'ai');
        }, 2000);
    }
}

// Export functions for potential external use
window.EmailAssistant = {
    loadEmailData,
    selectEmail,
    addMessageToChat,
    generateAIResponse
};

console.log('📧 Email Assistant JavaScript loaded successfully');