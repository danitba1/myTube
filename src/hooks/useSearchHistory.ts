"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "mytube_search_history";

export function useSearchHistory() {
  const { isSignedIn, isLoaded } = useUser();
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load search history
  useEffect(() => {
    if (!isLoaded) return;

    const loadHistory = async () => {
      setIsLoading(true);
      
      if (isSignedIn) {
        // Load from database for signed-in users
        try {
          const response = await fetch("/api/user/search-history");
          if (response.ok) {
            const data = await response.json();
            setSearchHistory(data.history || []);
          }
        } catch (error) {
          console.error("Failed to load search history from DB:", error);
          // Fallback to localStorage
          loadFromLocalStorage();
        }
      } else {
        // Load from localStorage for guests
        loadFromLocalStorage();
      }
      
      setIsLoading(false);
    };

    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setSearchHistory(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load search history from localStorage:", e);
      }
    };

    loadHistory();
  }, [isSignedIn, isLoaded]);

  // Add to history (localOnly = true means only update UI state, not DB)
  const addToHistory = useCallback(async (query: string, searchTerms?: string[], resultsCount?: number, localOnly: boolean = false) => {
    // Update local state immediately for UI
    setSearchHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );
      return [query, ...filtered].slice(0, 10);
    });

    // If localOnly, skip database/localStorage save (dashboard will handle it)
    if (localOnly) return;

    if (isSignedIn) {
      // Save to database
      try {
        await fetch("/api/user/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ searchQuery: query, searchTerms, resultsCount }),
        });
      } catch (error) {
        console.error("Failed to save to database:", error);
      }
    } else {
      // Save to localStorage for guests
      try {
        const filtered = searchHistory.filter(
          (item) => item.toLowerCase() !== query.toLowerCase()
        );
        const updated = [query, ...filtered].slice(0, 10);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  }, [isSignedIn, searchHistory]);

  // Remove from history
  const removeFromHistory = useCallback(async (query: string) => {
    setSearchHistory((prev) => prev.filter((item) => item !== query));

    if (isSignedIn) {
      try {
        await fetch(`/api/user/search-history?query=${encodeURIComponent(query)}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete from database:", error);
      }
    } else {
      try {
        const updated = searchHistory.filter((item) => item !== query);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }
    }
  }, [isSignedIn, searchHistory]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    setSearchHistory([]);

    if (isSignedIn) {
      try {
        await fetch("/api/user/search-history", {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to clear database history:", error);
      }
    } else {
      try {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
      } catch (e) {
        console.error("Failed to clear localStorage:", e);
      }
    }
  }, [isSignedIn]);

  return {
    searchHistory,
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}

