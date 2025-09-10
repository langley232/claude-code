//
//  GeminiAPIService.swift
//  AtlasWebSearch
//
//  Service for integrating with Google Gemini API
//

import Foundation
import Network

@MainActor
class GeminiAPIService: ObservableObject {
    
    // MARK: - Properties
    private let apiKey: String
    private let endpoint: String
    private let session: URLSession
    private let monitor = NWPathMonitor()
    
    @Published var isNetworkAvailable = true
    
    // MARK: - Initialization
    init(apiKey: String = Constants.API.geminiApiKey,
         endpoint: String = Constants.API.geminiEndpoint) {
        self.apiKey = apiKey
        self.endpoint = endpoint
        
        // Configure URLSession
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = Constants.API.requestTimeout
        config.timeoutIntervalForResource = Constants.API.resourceTimeout
        config.requestCachePolicy = .reloadIgnoringLocalCacheData
        self.session = URLSession(configuration: config)
        
        setupNetworkMonitoring()
    }
    
    // MARK: - Network Monitoring
    private func setupNetworkMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            Task { @MainActor in
                self?.isNetworkAvailable = (path.status == .satisfied)
            }
        }
        
        let queue = DispatchQueue(label: "NetworkMonitor")
        monitor.start(queue: queue)
    }
    
    // MARK: - Public Methods
    
    /// Generate AI summary for search results
    func generateSearchSummary(query: String, searchResults: [SearchResult]) async throws -> AISummary {
        guard isNetworkAvailable else {
            throw SearchError(code: .networkError)
        }
        
        let startTime = Date()
        
        // Prepare the prompt for Gemini
        let prompt = createSummaryPrompt(query: query, searchResults: searchResults)
        
        do {
            let response = try await callGeminiAPI(prompt: prompt)
            let processingTime = Date().timeIntervalSince(startTime)
            
            return AISummary(
                content: response.content,
                keyPoints: extractKeyPoints(from: response.content),
                model: "gemini-1.5-flash",
                confidence: calculateConfidence(for: response.content),
                processingTime: processingTime
            )
            
        } catch {
            throw SearchError(code: .apiError, message: error.localizedDescription)
        }
    }
    
    /// Search and summarize in one call
    func performIntelligentSearch(query: String, options: SearchOptions = SearchOptions()) async throws -> SearchResponse {
        guard isNetworkAvailable else {
            throw SearchError(code: .networkError)
        }
        
        let startTime = Date()
        
        do {
            // Step 1: Get search results (mock for now, can be expanded)
            let searchResults = try await generateMockSearchResults(query: query, options: options)
            
            // Step 2: Generate AI summary
            let aiSummary = try await generateSearchSummary(query: query, searchResults: searchResults)
            
            let searchTime = Date().timeIntervalSince(startTime)
            
            return SearchResponse(
                query: query,
                model: options.toString(),
                searchResults: searchResults,
                aiSummary: aiSummary,
                searchTime: searchTime,
                confidence: aiSummary.confidence,
                sources: extractSources(from: searchResults)
            )
            
        } catch let error as SearchError {
            return SearchResponse(
                query: query,
                model: options.toString(),
                error: error
            )
        } catch {
            return SearchResponse(
                query: query,
                model: options.toString(),
                error: SearchError(code: .unknown, message: error.localizedDescription)
            )
        }
    }
    
    // MARK: - Private Methods
    
    private func callGeminiAPI(prompt: String) async throws -> GeminiResponse {
        let url = URL(string: "\(endpoint)?key=\(apiKey)")!
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        let requestBody = GeminiRequest(
            contents: [
                GeminiContent(
                    role: "user",
                    parts: [GeminiPart(text: prompt)]
                )
            ],
            generationConfig: GeminiGenerationConfig(
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 1000
            ),
            safetySettings: [
                GeminiSafetySetting(category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE"),
                GeminiSafetySetting(category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE"),
                GeminiSafetySetting(category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE"),
                GeminiSafetySetting(category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE")
            ]
        )
        
        request.httpBody = try JSONEncoder().encode(requestBody)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SearchError(code: .apiError, message: "Invalid response format")
        }
        
        guard httpResponse.statusCode == 200 else {
            throw SearchError(code: .apiError, message: "API returned status code: \(httpResponse.statusCode)")
        }
        
        let geminiResponse = try JSONDecoder().decode(GeminiAPIResponse.self, from: data)
        
        guard let candidate = geminiResponse.candidates.first,
              let content = candidate.content.parts.first?.text else {
            throw SearchError(code: .apiError, message: "No content in API response")
        }
        
        return GeminiResponse(content: content)
    }
    
    private func createSummaryPrompt(query: String, searchResults: [SearchResult]) -> String {
        let resultsText = searchResults.prefix(5).map { result in
            "Title: \(result.title)\nSnippet: \(result.snippet)\nURL: \(result.displayUrl)\n"
        }.joined(separator: "\n---\n")
        
        return \"\"\"
        You are an AI assistant providing intelligent search summaries for the AtlasWeb platform. 
        
        Query: \"\(query)\"
        
        Based on the following search results, provide a comprehensive and accurate summary:
        
        \(resultsText)
        
        Please provide:
        1. A concise summary (2-3 paragraphs) that directly answers the query
        2. Key insights and important points
        3. Practical, actionable information when relevant
        
        Focus on accuracy and helpfulness. Be conversational but professional.
        \"\"\"
    }
    
    private func extractKeyPoints(from content: String) -> [String] {
        // Simple key point extraction - can be enhanced with NLP
        let sentences = content.components(separatedBy: ". ")
        return sentences
            .filter { $0.count > 20 }
            .prefix(3)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
    }
    
    private func calculateConfidence(for content: String) -> Double {
        // Basic confidence calculation - can be enhanced
        let wordCount = content.components(separatedBy: .whitespaces).count
        let baseConfidence = min(0.9, Double(wordCount) / 100.0)
        return max(0.5, baseConfidence)
    }
    
    private func extractSources(from searchResults: [SearchResult]) -> [String] {
        return Array(Set(searchResults.map { $0.displayUrl })).prefix(5).map { String($0) }
    }
    
    private func generateMockSearchResults(query: String, options: SearchOptions) async throws -> [SearchResult] {
        // Simulate network delay
        try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
        
        return (1...options.maxResults).map { index in
            SearchResult(
                title: "Search Result \(index) for \"\(query)\"",
                url: "https://example\(index).com/article",
                snippet: "This is a relevant search result snippet for \(query). It contains useful information that would help answer the user's query with detailed insights and practical information.",
                displayUrl: "example\(index).com",
                position: index,
                relevanceScore: Double.random(in: 0.7...0.95),
                type: SearchResult.ResultType.allCases.randomElement() ?? .web
            )
        }
    }
}

// MARK: - Gemini API Models

private struct GeminiRequest: Codable {
    let contents: [GeminiContent]
    let generationConfig: GeminiGenerationConfig
    let safetySettings: [GeminiSafetySetting]
}

private struct GeminiContent: Codable {
    let role: String
    let parts: [GeminiPart]
}

private struct GeminiPart: Codable {
    let text: String
}

private struct GeminiGenerationConfig: Codable {
    let temperature: Double
    let topK: Int
    let topP: Double
    let maxOutputTokens: Int
}

private struct GeminiSafetySetting: Codable {
    let category: String
    let threshold: String
}

private struct GeminiAPIResponse: Codable {
    let candidates: [GeminiCandidate]
    let usageMetadata: GeminiUsageMetadata?
}

private struct GeminiCandidate: Codable {
    let content: GeminiContent
    let finishReason: String?
    let index: Int?
    let safetyRatings: [GeminiSafetyRating]?
}

private struct GeminiUsageMetadata: Codable {
    let promptTokenCount: Int?
    let candidatesTokenCount: Int?
    let totalTokenCount: Int?
}

private struct GeminiSafetyRating: Codable {
    let category: String
    let probability: String
}

private struct GeminiResponse {
    let content: String
}

// MARK: - SearchOptions Extension
extension SearchOptions {
    func toString() -> String {
        return "gemini" // For now, always use Gemini
    }
}
