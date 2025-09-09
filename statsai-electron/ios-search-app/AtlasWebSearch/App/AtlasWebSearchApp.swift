//
//  AtlasWebSearchApp.swift
//  AtlasWebSearch
//
//  Main app entry point
//

import SwiftUI

@main
struct AtlasWebSearchApp: App {
    
    // MARK: - App State
    @StateObject private var searchViewModel = SearchViewModel()
    @StateObject private var historyViewModel = HistoryViewModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(searchViewModel)
                .environmentObject(historyViewModel)
                .preferredColorScheme(.light) // Can be changed to support system preference
                .onAppear {
                    setupApp()
                }
        }
    }
    
    // MARK: - App Setup
    private func setupApp() {
        // Configure app-wide settings
        configureNetworking()
        
        // Load user preferences
        loadUserPreferences()
        
        // Setup analytics (if needed)
        // setupAnalytics()
    }
    
    private func configureNetworking() {
        // Configure URLSession global settings if needed
        URLCache.shared.memoryCapacity = 50 * 1024 * 1024 // 50MB
        URLCache.shared.diskCapacity = 100 * 1024 * 1024   // 100MB
    }
    
    private func loadUserPreferences() {
        // Load saved user preferences
        let defaults = UserDefaults.standard
        
        // Load selected AI model
        if let modelString = defaults.string(forKey: Constants.StorageKeys.selectedModel),
           let model = Constants.AIModel(rawValue: modelString) {
            searchViewModel.selectedModel = model
        }
        
        // Load search history
        historyViewModel.loadHistory()
    }
}
