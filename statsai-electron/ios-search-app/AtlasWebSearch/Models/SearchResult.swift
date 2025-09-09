//
//  SearchResult.swift
//  AtlasWebSearch
//
//  Data models for search functionality
//

import Foundation

// MARK: - Search Query Model
struct SearchQuery: Codable, Hashable {
    let id = UUID()
    let query: String
    let model: Constants.AIModel
    let timestamp: Date
    let options: SearchOptions
    
    init(query: String, model: Constants.AIModel = .ensemble, options: SearchOptions = SearchOptions()) {
        self.query = query
        self.model = model
        self.timestamp = Date()
        self.options = options
    }
}

// MARK: - Search Options
struct SearchOptions: Codable, Hashable {
    let maxResults: Int
    let region: String
    let language: String
    let includeImages: Bool
    
    init(maxResults: Int = Constants.App.maxSearchResults,
         region: String = Constants.App.defaultRegion,
         language: String = Constants.App.defaultLanguage,
         includeImages: Bool = false) {
        self.maxResults = maxResults
        self.region = region
        self.language = language
        self.includeImages = includeImages
    }
}

// MARK: - Individual Search Result
struct SearchResult: Codable, Identifiable, Hashable {
    let id = UUID()
    let title: String
    let url: String
    let snippet: String
    let displayUrl: String
    let position: Int
    let relevanceScore: Double
    let type: ResultType
    
    enum ResultType: String, Codable, CaseIterable {
        case web = "web"
        case news = "news"
        case academic = "academic"
        case video = "video"
        case image = "image"
        
        var displayName: String {
            switch self {
            case .web: return "Web"
            case .news: return "News"
            case .academic: return "Academic"
            case .video: return "Video"
            case .image: return "Image"
            }
        }
        
        var systemIcon: String {
            switch self {
            case .web: return "globe"
            case .news: return "newspaper"
            case .academic: return "graduationcap"
            case .video: return "play.rectangle"
            case .image: return "photo"
            }
        }
    }
}

// MARK: - AI Summary
struct AISummary: Codable, Hashable {
    let content: String
    let keyPoints: [String]
    let model: String
    let confidence: Double
    let processingTime: TimeInterval
    
    init(content: String, 
         keyPoints: [String] = [],
         model: String = "gemini-1.5-flash",
         confidence: Double = 0.85,
         processingTime: TimeInterval = 0) {
        self.content = content
        self.keyPoints = keyPoints
        self.model = model
        self.confidence = confidence
        self.processingTime = processingTime
    }
}

// MARK: - Complete Search Response
struct SearchResponse: Codable, Hashable {
    let id = UUID()
    let query: String
    let model: String
    let timestamp: Date
    let searchResults: [SearchResult]
    let aiSummary: AISummary?
    let totalResults: Int
    let searchTime: TimeInterval
    let confidence: Double
    let sources: [String]
    let error: SearchError?
    
    init(query: String,
         model: String,
         searchResults: [SearchResult] = [],
         aiSummary: AISummary? = nil,
         searchTime: TimeInterval = 0,
         confidence: Double = 0.0,
         sources: [String] = [],
         error: SearchError? = nil) {
        self.query = query
        self.model = model
        self.timestamp = Date()
        self.searchResults = searchResults
        self.aiSummary = aiSummary
        self.totalResults = searchResults.count
        self.searchTime = searchTime
        self.confidence = confidence
        self.sources = sources
        self.error = error
    }
    
    var hasResults: Bool {
        return !searchResults.isEmpty
    }
    
    var isSuccessful: Bool {
        return error == nil && hasResults
    }
}

// MARK: - Search Error
struct SearchError: Codable, Hashable, LocalizedError {
    let code: ErrorCode
    let message: String
    let timestamp: Date
    
    enum ErrorCode: String, Codable {
        case networkError = "network_error"
        case apiError = "api_error"
        case invalidQuery = "invalid_query"
        case noResults = "no_results"
        case quotaExceeded = "quota_exceeded"
        case invalidApiKey = "invalid_api_key"
        case timeout = "timeout"
        case unknown = "unknown"
    }
    
    init(code: ErrorCode, message: String? = nil) {
        self.code = code
        self.message = message ?? code.defaultMessage
        self.timestamp = Date()
    }
    
    var errorDescription: String? {
        return message
    }
}

// MARK: - Error Code Extensions
extension SearchError.ErrorCode {
    var defaultMessage: String {
        switch self {
        case .networkError:
            return Constants.ErrorMessages.networkError
        case .apiError:
            return Constants.ErrorMessages.apiError
        case .invalidQuery:
            return Constants.ErrorMessages.invalidQuery
        case .noResults:
            return Constants.ErrorMessages.noResults
        case .quotaExceeded:
            return Constants.ErrorMessages.quotaExceeded
        case .invalidApiKey:
            return Constants.ErrorMessages.invalidApiKey
        case .timeout:
            return "Request timed out. Please try again."
        case .unknown:
            return "An unexpected error occurred. Please try again."
        }
    }
}

// MARK: - Search History Item
struct SearchHistoryItem: Codable, Identifiable, Hashable {
    let id = UUID()
    let query: String
    let model: Constants.AIModel
    let timestamp: Date
    let resultCount: Int
    let wasSuccessful: Bool
    
    init(from searchQuery: SearchQuery, resultCount: Int = 0, wasSuccessful: Bool = true) {
        self.query = searchQuery.query
        self.model = searchQuery.model
        self.timestamp = searchQuery.timestamp
        self.resultCount = resultCount
        self.wasSuccessful = wasSuccessful
    }
    
    var timeAgo: String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .abbreviated
        return formatter.localizedString(for: timestamp, relativeTo: Date())
    }
}
