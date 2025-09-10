//
//  Constants.swift
//  AtlasWebSearch
//
//  Created by AtlasWeb Team
//  iOS implementation of AI search functionality
//

import Foundation

struct Constants {
    
    // MARK: - API Configuration
    struct API {
        static let geminiApiKey = "AIzaSyDYmIREOR9mIXxDU4Au5T0kWzsq8AiYIAs"
        static let geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent"
        static let duckDuckGoEndpoint = "https://api.duckduckgo.com/"
        
        // Timeout settings
        static let requestTimeout: TimeInterval = 30.0
        static let resourceTimeout: TimeInterval = 60.0
    }
    
    // MARK: - App Configuration
    struct App {
        static let name = "AtlasWeb Search"
        static let version = "1.0.0"
        static let buildNumber = "1"
        
        // Search settings
        static let maxSearchResults = 8
        static let defaultRegion = "us"
        static let defaultLanguage = "en"
        static let cacheTimeout: TimeInterval = 600 // 10 minutes
        static let maxCacheSize = 100
    }
    
    // MARK: - UI Configuration
    struct UI {
        static let cornerRadius: CGFloat = 12.0
        static let shadowRadius: CGFloat = 4.0
        static let animationDuration: TimeInterval = 0.3
        
        // Colors (using iOS system colors where possible)
        struct Colors {
            static let primaryBlue = "6366f1"
            static let primaryPurple = "8b5cf6"
            static let accentColor = "06b6d4"
            static let successGreen = "10b981"
            static let warningOrange = "f59e0b"
            static let errorRed = "ef4444"
        }
    }
    
    // MARK: - Storage Keys
    struct StorageKeys {
        static let searchHistory = "search_history"
        static let selectedModel = "selected_model"
        static let userPreferences = "user_preferences"
        static let apiKeyStored = "api_key_stored"
    }
    
    // MARK: - Search Models
    enum AIModel: String, CaseIterable {
        case ensemble = "ensemble"
        case gemini = "gemini"
        case xai = "xai"
        case openai = "openai"
        
        var displayName: String {
            switch self {
            case .ensemble:
                return "🤖 Ensemble (Auto)"
            case .gemini:
                return "🧠 Google Gemini"
            case .xai:
                return "⚡ xAI Grok"
            case .openai:
                return "🎯 OpenAI GPT-4"
            }
        }
        
        var isAvailable: Bool {
            // For iOS implementation, initially only support Gemini and Ensemble
            switch self {
            case .ensemble, .gemini:
                return true
            case .xai, .openai:
                return false // Can be enabled later
            }
        }
    }
    
    // MARK: - Error Messages
    struct ErrorMessages {
        static let networkError = "Unable to connect to the internet. Please check your connection and try again."
        static let apiError = "Search service is temporarily unavailable. Please try again later."
        static let invalidQuery = "Please enter a valid search query."
        static let noResults = "No results found for your query. Try different keywords."
        static let quotaExceeded = "Search quota exceeded. Please try again later."
        static let invalidApiKey = "Invalid API configuration. Please contact support."
    }
    
    // MARK: - Accessibility
    struct Accessibility {
        static let searchButton = "Search Button"
        static let searchTextField = "Search Query Input"
        static let modelSelector = "AI Model Selector"
        static let resultCell = "Search Result"
        static let historyCell = "Search History Item"
        static let loadingIndicator = "Loading Search Results"
    }
}
