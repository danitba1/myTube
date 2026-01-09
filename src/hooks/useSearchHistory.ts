"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "mytube_search_history";
const MAX_FULL_HISTORY = 5;
const MAX_SINGLE_HISTORY = 10;

export function useSearchHistory() {
  const { isSignedIn, isLoaded } = useUser();
  const [fullHistory, setFullHistory] = useState<string[]>([]);     // Full searches (isSingle=false)
  const [singleHistory, setSingleHistory] = useState<string[]>([]); // Single terms (isSingle=true)
  const [isLoading, setIsLoading] = useState(true);

  // Load search history on login/page load
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
            setFullHistory(data.fullHistory || []);
            setSingleHistory(data.singleHistory || []);
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
          const parsed = JSON.parse(saved);
          setFullHistory(parsed.slice(0, MAX_FULL_HISTORY));
        }
      } catch (e) {
        console.error("Failed to load search history from localStorage:", e);
      }
    };

    loadHistory();
  }, [isSignedIn, isLoaded]);

  // Add to history - always saves to DB for signed-in users
  const addToHistory = useCallback(async (
    query: string, 
    searchTerms?: string[], 
    resultsCount?: number, 
    localOnly: boolean = false
  ) => {
    // Update local state immediately for UI (move to top, remove duplicates)
    setFullHistory((prev) => {
      const filtered = prev.filter(
        (item) => item.toLowerCase() !== query.toLowerCase()
      );
      return [query, ...filtered].slice(0, MAX_FULL_HISTORY);
    });

    // Also update single history for each term
    if (searchTerms && searchTerms.length > 1) {
      setSingleHistory((prev) => {
        let updated = [...prev];
        for (const term of searchTerms) {
          const trimmed = term.trim();
          if (!trimmed) continue;
          updated = updated.filter(
            (item) => item.toLowerCase() !== trimmed.toLowerCase()
          );
          updated = [trimmed, ...updated];
        }
        return updated.slice(0, MAX_SINGLE_HISTORY);
      });
    }

    // If localOnly, skip database/localStorage save (dashboard will handle it)
    if (localOnly) return;

    if (isSignedIn) {
      // Save to database (every search is saved with timestamp)
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
        const filtered = fullHistory.filter(
          (item) => item.toLowerCase() !== query.toLowerCase()
        );
        const updated = [query, ...filtered].slice(0, MAX_FULL_HISTORY);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  }, [isSignedIn, fullHistory]);

  // Remove from history
  const removeFromHistory = useCallback(async (query: string, isSingle: boolean = false) => {
    if (isSingle) {
      setSingleHistory((prev) => prev.filter((item) => item !== query));
    } else {
      setFullHistory((prev) => prev.filter((item) => item !== query));
    }

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
        const updated = fullHistory.filter((item) => item !== query);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }
    }
  }, [isSignedIn, fullHistory]);

  // Clear all history
  const clearHistory = useCallback(async () => {
    setFullHistory([]);
    setSingleHistory([]);

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
    fullHistory,      // Last 5 full searches
    singleHistory,    // Last 10 single terms
    isLoading,
    addToHistory,
    removeFromHistory,
    clearHistory,
  };
}
