// Gemini Chat Service
// Handles real-time AI chat functionality using Google's Gemini API

class GeminiChatService {
    constructor() {
        // Store API key securely - using the same key from ai-search-service
        this.apiKey = 'AIzaSyDYmIREOR9mIXxDU4Au5T0kWzsq8AiYIAs';
        this.apiEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';
        this.model = 'gemini-1.5-flash'; // Using Gemini 1.5 Flash for fast responses
        this.maxTokens = 1000;
        this.temperature = 0.7;
        this.conversationHistory = [];
        
        console.log('🤖 Gemini Chat Service initialized with Gemini 1.5 Flash');
    }

    // Send message to Gemini and get response
    async sendMessage(userMessage, context = null) {
        try {
            // Add user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                parts: [{ text: userMessage }]
            });

            console.log('📤 Sending message to Gemini:', userMessage);

            // Prepare the conversation history for Gemini API
            const contents = [];
            
            // Add system message if context is provided
            if (context || this.conversationHistory.length === 1) {
                contents.push({
                    role: 'user',
                    parts: [{ text: this.getSystemPrompt(context) }]
                });
                contents.push({
                    role: 'model',
                    parts: [{ text: 'I understand. I\'m your AI assistant in AtlasWeb, ready to help with questions, research, coding, and more. How can I assist you today?' }]
                });
            }

            // Add conversation history (last 10 exchanges)
            const recentHistory = this.conversationHistory.slice(-10);
            for (const message of recentHistory) {
                if (message.role === 'user') {
                    contents.push({
                        role: 'user',
                        parts: [{ text: message.parts[0].text }]
                    });
                } else {
                    contents.push({
                        role: 'model',
                        parts: [{ text: message.parts[0].text }]
                    });
                }
            }

            const requestBody = {
                contents: contents,
                generationConfig: {
                    temperature: this.temperature,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: this.maxTokens,
                    stopSequences: []
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };

            const response = await fetch(`${this.apiEndpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => null);
                throw new Error(`Gemini API Error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();
            
            if (!data.candidates || !data.candidates[0] || !data.candidates[0].content) {
                throw new Error('Invalid response format from Gemini API');
            }

            const aiResponse = data.candidates[0].content.parts[0].text;

            // Add AI response to conversation history
            this.conversationHistory.push({
                role: 'model',
                parts: [{ text: aiResponse }]
            });

            console.log('📥 Received response from Gemini');

            return {
                success: true,
                response: aiResponse,
                usage: data.usageMetadata || {},
                model: this.model,
                timestamp: new Date().toISOString()
            };

        } catch (error) {
            console.error('❌ Gemini Chat Service Error:', error);
            
            return {
                success: false,
                error: error.message,
                fallbackResponse: this.getFallbackResponse(userMessage)
            };
        }
    }

    // Generate system prompt with context awareness
    getSystemPrompt(context = null) {
        let prompt = `You are an advanced AI assistant integrated into AtlasWeb, a powerful AI-powered web browser and search platform. You are helpful, knowledgeable, and provide accurate, concise responses.

Key capabilities:
- Answer questions across all topics with accuracy
- Provide coding assistance and debugging help
- Help with research, writing, and analysis
- Explain complex concepts clearly
- Assist with AtlasWeb platform features

Guidelines:
- Be conversational but professional
- Provide practical, actionable advice
- If you're unsure about something, say so
- Keep responses concise but comprehensive
- Use markdown formatting when helpful`;

        if (context) {
            prompt += `\n\nCurrent Context:\n${context}`;
        }

        return prompt;
    }

    // Provide fallback response when API fails
    getFallbackResponse(userMessage) {
        const fallbacks = [
            "I'm experiencing some connectivity issues right now, but I'm still here to help! Could you try rephrasing your question?",
            "There seems to be a temporary issue with my processing. Let me know what you'd like assistance with and I'll do my best to help!",
            "I'm having trouble accessing my full capabilities at the moment. What specific topic would you like to discuss?",
            "My connection to AI services is temporarily interrupted. I'm still here to provide assistance - what can I help you with?"
        ];
        
        return fallbacks[Math.floor(Math.random() * fallbacks.length)];
    }

    // Clear conversation history
    clearConversation() {
        this.conversationHistory = [];
        console.log('🗑️ Conversation history cleared');
    }

    // Get conversation summary
    getConversationSummary() {
        return {
            messageCount: this.conversationHistory.length,
            model: this.model,
            lastMessage: this.conversationHistory[this.conversationHistory.length - 1] || null
        };
    }

    // Update model settings
    updateSettings(settings = {}) {
        if (settings.temperature !== undefined) {
            this.temperature = Math.max(0, Math.min(2, settings.temperature));
        }
        if (settings.maxTokens !== undefined) {
            this.maxTokens = Math.max(1, Math.min(8192, settings.maxTokens));
        }
        
        console.log('⚙️ Gemini settings updated:', { temperature: this.temperature, maxTokens: this.maxTokens });
    }

    // Test API connection
    async testConnection() {
        try {
            const testResponse = await this.sendMessage("Hello! Please respond with 'Connection test successful' to confirm you're working properly.");
            return testResponse.success;
        } catch (error) {
            console.error('❌ Connection test failed:', error);
            return false;
        }
    }

    // Get current model info
    getModelInfo() {
        return {
            model: this.model,
            provider: 'Google Gemini',
            temperature: this.temperature,
            maxTokens: this.maxTokens,
            conversationLength: this.conversationHistory.length
        };
    }
}

// Export for use in dashboard
if (typeof window !== 'undefined') {
    window.GeminiChatService = GeminiChatService;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = GeminiChatService;
}

console.log('🚀 Gemini Chat Service loaded and ready');
