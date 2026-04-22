/**
 * Copyright (c) 2026 e2kd7n
 * All rights reserved.
 */

import { useState, useEffect, useCallback } from 'react';

export interface SearchSuggestion {
  type: 'recent' | 'popular' | 'ingredient' | 'recipe';
  text: string;
  count?: number;
  icon?: string;
}

const RECENT_SEARCHES_KEY = 'recentSearches';
const MAX_RECENT_SEARCHES = 10;

// Popular search suggestions (could be fetched from API in future)
const POPULAR_SEARCHES: SearchSuggestion[] = [
  { type: 'popular', text: 'quick dinner for two', count: 1250 },
  { type: 'popular', text: 'healthy breakfast under 30 minutes', count: 980 },
  { type: 'popular', text: 'vegetarian pasta', count: 850 },
  { type: 'popular', text: 'chicken recipes', count: 2100 },
  { type: 'popular', text: 'easy desserts', count: 720 },
  { type: 'popular', text: 'keto dinner', count: 650 },
  { type: 'popular', text: 'italian recipes', count: 890 },
  { type: 'popular', text: 'slow cooker meals', count: 540 },
];

// Common ingredients for suggestions
const COMMON_INGREDIENTS: SearchSuggestion[] = [
  { type: 'ingredient', text: 'chicken', icon: '🍗' },
  { type: 'ingredient', text: 'pasta', icon: '🍝' },
  { type: 'ingredient', text: 'rice', icon: '🍚' },
  { type: 'ingredient', text: 'beef', icon: '🥩' },
  { type: 'ingredient', text: 'salmon', icon: '🐟' },
  { type: 'ingredient', text: 'tomatoes', icon: '🍅' },
  { type: 'ingredient', text: 'cheese', icon: '🧀' },
  { type: 'ingredient', text: 'eggs', icon: '🥚' },
];

/**
 * Hook for managing search suggestions
 */
export function useSearchSuggestions(query: string) {
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        setRecentSearches(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Failed to load recent searches:', error);
    }
  }, []);

  // Add a search to recent searches
  const addRecentSearch = useCallback((searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setRecentSearches(prev => {
      // Remove duplicates and add to front
      const updated = [
        searchQuery,
        ...prev.filter(s => s.toLowerCase() !== searchQuery.toLowerCase())
      ].slice(0, MAX_RECENT_SEARCHES);

      // Save to localStorage
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (error) {
        console.error('Failed to save recent searches:', error);
      }

      return updated;
    });
  }, []);

  // Clear recent searches
  const clearRecentSearches = useCallback(() => {
    setRecentSearches([]);
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }, []);

  // Generate suggestions based on query
  useEffect(() => {
    if (!query || query.length < 2) {
      // Show recent and popular when no query
      const recent: SearchSuggestion[] = recentSearches.map(text => ({
        type: 'recent' as const,
        text,
      }));
      setSuggestions([...recent.slice(0, 5), ...POPULAR_SEARCHES.slice(0, 5)]);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered: SearchSuggestion[] = [];

    // Filter recent searches
    recentSearches
      .filter(s => s.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(text => {
        filtered.push({ type: 'recent', text });
      });

    // Filter popular searches
    POPULAR_SEARCHES
      .filter(s => s.text.toLowerCase().includes(lowerQuery))
      .slice(0, 4)
      .forEach(s => filtered.push(s));

    // Filter ingredients
    COMMON_INGREDIENTS
      .filter(s => s.text.toLowerCase().includes(lowerQuery))
      .slice(0, 3)
      .forEach(s => filtered.push(s));

    setSuggestions(filtered.slice(0, 10));
  }, [query, recentSearches]);

  return {
    suggestions,
    addRecentSearch,
    clearRecentSearches,
    recentSearches,
  };
}

// Made with Bob
