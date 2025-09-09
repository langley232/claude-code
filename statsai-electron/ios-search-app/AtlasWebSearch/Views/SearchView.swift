//
//  SearchView.swift
//  AtlasWebSearch
//
//  Main search interface view
//

import SwiftUI

struct SearchView: View {
    
    // MARK: - Environment Objects
    @EnvironmentObject var searchViewModel: SearchViewModel
    @EnvironmentObject var historyViewModel: HistoryViewModel
    
    // MARK: - State
    @State private var searchText = ""
    @State private var showingHistory = false
    @State private var showingSettings = false
    
    // MARK: - Focus State
    @FocusState private var isSearchFocused: Bool
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header
                headerView
                
                // Search Interface
                searchInterface
                
                // Results or Empty State
                if searchViewModel.isLoading {
                    loadingView
                } else if let searchResponse = searchViewModel.currentSearchResponse {
                    ResultsView(searchResponse: searchResponse)
                } else {
                    emptyStateView
                }
                
                Spacer()
            }
            .navigationBarHidden(true)
            .background(Color(.systemGroupedBackground))
            .sheet(isPresented: $showingHistory) {
                HistoryView()
                    .environmentObject(historyViewModel)
            }
            .sheet(isPresented: $showingSettings) {
                SettingsView()
                    .environmentObject(searchViewModel)
            }
        }
        .navigationViewStyle(StackNavigationViewStyle())
    }
    
    // MARK: - Header View
    private var headerView: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text("AtlasWeb Search")
                    .font(.title.bold())
                    .foregroundColor(.primary)
                
                Text("AI-Powered Intelligent Search")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            HStack(spacing: 16) {
                // History Button
                Button(action: { showingHistory.toggle() }) {
                    Image(systemName: "clock")
                        .foregroundColor(.primary)
                        .font(.title3)
                }
                .accessibility(label: Text("Search History"))
                
                // Settings Button
                Button(action: { showingSettings.toggle() }) {
                    Image(systemName: "gearshape")
                        .foregroundColor(.primary)
                        .font(.title3)
                }
                .accessibility(label: Text("Settings"))
            }
        }
        .padding(.horizontal, 20)
        .padding(.top, 10)
        .padding(.bottom, 16)
        .background(Color(.systemBackground))
    }
    
    // MARK: - Search Interface
    private var searchInterface: some View {
        VStack(spacing: 16) {
            // Model Selector
            modelSelector
            
            // Search Input
            searchInputField
            
            // Quick Suggestions (if no search in progress)
            if !searchViewModel.isLoading && searchViewModel.currentSearchResponse == nil && searchText.isEmpty {
                quickSuggestions
            }
        }
        .padding(.horizontal, 20)
        .padding(.bottom, 20)
        .background(Color(.systemBackground))
        .shadow(color: .black.opacity(0.05), radius: 8, x: 0, y: 2)
    }
    
    // MARK: - Model Selector
    private var modelSelector: some View {
        HStack {
            Text("AI Model:")
                .font(.subheadline.weight(.medium))
                .foregroundColor(.secondary)
            
            Spacer()
            
            Menu {
                ForEach(Constants.AIModel.allCases.filter { $0.isAvailable }, id: \.self) { model in
                    Button(action: {
                        searchViewModel.selectedModel = model
                        // Save to UserDefaults
                        UserDefaults.standard.set(model.rawValue, forKey: Constants.StorageKeys.selectedModel)
                    }) {
                        HStack {
                            Text(model.displayName)
                            if searchViewModel.selectedModel == model {
                                Image(systemName: "checkmark")
                            }
                        }
                    }
                }
            } label: {
                HStack {
                    Text(searchViewModel.selectedModel.displayName)
                        .font(.subheadline.weight(.medium))
                    
                    Image(systemName: "chevron.down")
                        .font(.caption.weight(.medium))
                }
                .foregroundColor(.primary)
            }
            .accessibility(label: Text(Constants.Accessibility.modelSelector))
        }
    }
    
    // MARK: - Search Input Field
    private var searchInputField: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
                .font(.body)
            
            TextField("Ask anything... AI will search for the best answer", text: $searchText)
                .focused($isSearchFocused)
                .font(.body)
                .submitLabel(.search)
                .onSubmit {
                    performSearch()
                }
                .accessibility(label: Text(Constants.Accessibility.searchTextField))
            
            if !searchText.isEmpty {
                Button(action: { 
                    searchText = ""
                    isSearchFocused = true
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                        .font(.body)
                }
            }
            
            Button(action: performSearch) {
                Image(systemName: "arrow.right.circle.fill")
                    .foregroundColor(searchText.isEmpty ? .secondary : .accentColor)
                    .font(.title3)
            }
            .disabled(searchText.isEmpty || searchViewModel.isLoading)
            .accessibility(label: Text(Constants.Accessibility.searchButton))
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 14)
        .background(Color(.systemGray6))
        .cornerRadius(Constants.UI.cornerRadius)
        .overlay(
            RoundedRectangle(cornerRadius: Constants.UI.cornerRadius)
                .stroke(isSearchFocused ? Color.accentColor : Color.clear, lineWidth: 2)
        )
    }
    
    // MARK: - Quick Suggestions
    private var quickSuggestions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Try searching for:")
                .font(.caption.weight(.medium))
                .foregroundColor(.secondary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 8) {
                ForEach(sampleQueries, id: \.self) { query in
                    Button(action: {
                        searchText = query
                        performSearch()
                    }) {
                        Text(query)
                            .font(.caption.weight(.medium))
                            .padding(.horizontal, 12)
                            .padding(.vertical, 8)
                            .background(Color.accentColor.opacity(0.1))
                            .foregroundColor(.accentColor)
                            .cornerRadius(8)
                            .lineLimit(1)
                    }
                }
            }
        }
    }
    
    // MARK: - Loading View
    private var loadingView: some View {
        VStack(spacing: 20) {
            ProgressView()
                .scaleEffect(1.2)
                .progressViewStyle(CircularProgressViewStyle(tint: .accentColor))
            
            VStack(spacing: 8) {
                Text("Searching with \\(searchViewModel.selectedModel.displayName)")
                    .font(.headline.weight(.medium))
                    .foregroundColor(.primary)
                
                Text("Finding results and generating AI summary...")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.top, 60)
        .accessibility(label: Text(Constants.Accessibility.loadingIndicator))
    }
    
    // MARK: - Empty State View
    private var emptyStateView: some View {
        VStack(spacing: 24) {
            VStack(spacing: 16) {
                Image(systemName: "magnifyingglass.circle")
                    .font(.system(size: 60))
                    .foregroundColor(.accentColor)
                
                VStack(spacing: 8) {
                    Text("Ready to Search")
                        .font(.title2.bold())
                        .foregroundColor(.primary)
                    
                    Text("Enter your query above to get AI-powered results with intelligent summaries")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 20)
                }
            }
            
            // Recent searches preview
            if !historyViewModel.recentSearches.isEmpty {
                VStack(alignment: .leading, spacing: 12) {
                    Text("Recent Searches")
                        .font(.headline.weight(.medium))
                        .foregroundColor(.primary)
                    
                    ForEach(historyViewModel.recentSearches.prefix(3)) { item in
                        Button(action: {
                            searchText = item.query
                            searchViewModel.selectedModel = item.model
                            performSearch()
                        }) {
                            HStack {
                                Image(systemName: "clock")
                                    .foregroundColor(.secondary)
                                    .font(.caption)
                                
                                Text(item.query)
                                    .font(.subheadline)
                                    .foregroundColor(.primary)
                                    .lineLimit(1)
                                
                                Spacer()
                                
                                Text(item.timeAgo)
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal, 16)
                            .padding(.vertical, 12)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                        }
                        .buttonStyle(PlainButtonStyle())
                    }
                }
                .padding(.horizontal, 20)
            }
        }
        .padding(.top, 40)
    }
    
    // MARK: - Helper Properties
    private var sampleQueries: [String] {
        [
            "Latest AI developments 2025",
            "Climate change solutions",
            "Swift programming tips",
            "Healthy recipes"
        ]
    }
    
    // MARK: - Actions
    private func performSearch() {
        guard !searchText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        isSearchFocused = false
        
        let query = SearchQuery(
            query: searchText.trimmingCharacters(in: .whitespacesAndNewlines),
            model: searchViewModel.selectedModel
        )
        
        Task {
            await searchViewModel.performSearch(query: query)
            
            // Add to history
            await MainActor.run {
                let historyItem = SearchHistoryItem(
                    from: query,
                    resultCount: searchViewModel.currentSearchResponse?.totalResults ?? 0,
                    wasSuccessful: searchViewModel.currentSearchResponse?.isSuccessful ?? false
                )
                historyViewModel.addToHistory(historyItem)
            }
        }
        
        // Haptic feedback
        let impactFeedback = UIImpactFeedbackGenerator(style: .medium)
        impactFeedback.impactOccurred()
    }
}
