"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "mytube_skipped_videos";

export function useSkippedVideos() {
  const { isSignedIn, isLoaded } = useUser();
  const [skippedVideoIds, setSkippedVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Load skipped videos
  useEffect(() => {
    if (!isLoaded) return;

    const loadSkipped = async () => {
      setIsLoading(true);
      
      if (isSignedIn) {
        // Load from database for signed-in users
        try {
          const response = await fetch("/api/user/skipped-videos");
          if (response.ok) {
            const data = await response.json();
            setSkippedVideoIds(data.skippedVideoIds || []);
          }
        } catch (error) {
          console.error("Failed to load skipped videos from DB:", error);
          loadFromLocalStorage();
        }
      } else {
        loadFromLocalStorage();
      }
      
      setIsLoading(false);
    };

    const loadFromLocalStorage = () => {
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        if (saved) {
          setSkippedVideoIds(JSON.parse(saved));
        }
      } catch (e) {
        console.error("Failed to load skipped videos from localStorage:", e);
      }
    };

    loadSkipped();
  }, [isSignedIn, isLoaded]);

  // Add video to skip list
  const addToSkipList = useCallback(async (videoId: string, videoTitle?: string, channelName?: string) => {
    // Update local state immediately
    setSkippedVideoIds((prev) => {
      if (prev.includes(videoId)) return prev;
      return [...prev, videoId];
    });

    if (isSignedIn) {
      // Save to database
      try {
        await fetch("/api/user/skipped-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, videoTitle, channelName }),
        });
      } catch (error) {
        console.error("Failed to save to database:", error);
      }
    } else {
      // Save to localStorage
      try {
        const updated = [...skippedVideoIds, videoId];
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  }, [isSignedIn, skippedVideoIds]);

  // Remove video from skip list
  const removeFromSkipList = useCallback(async (videoId: string) => {
    setSkippedVideoIds((prev) => prev.filter((id) => id !== videoId));

    if (isSignedIn) {
      try {
        await fetch(`/api/user/skipped-videos?videoId=${encodeURIComponent(videoId)}`, {
          method: "DELETE",
        });
      } catch (error) {
        console.error("Failed to delete from database:", error);
      }
    } else {
      try {
        const updated = skippedVideoIds.filter((id) => id !== videoId);
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
      } catch (e) {
        console.error("Failed to update localStorage:", e);
      }
    }
  }, [isSignedIn, skippedVideoIds]);

  // Check if video is skipped
  const isSkipped = useCallback((videoId: string) => {
    return skippedVideoIds.includes(videoId);
  }, [skippedVideoIds]);

  // Filter out skipped videos from a list
  const filterSkippedVideos = useCallback(<T extends { id: string }>(videos: T[]): T[] => {
    return videos.filter((video) => !skippedVideoIds.includes(video.id));
  }, [skippedVideoIds]);

  return {
    skippedVideoIds,
    isLoading,
    addToSkipList,
    removeFromSkipList,
    isSkipped,
    filterSkippedVideos,
  };
}

