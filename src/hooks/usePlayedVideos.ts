"use client";

import { useState, useEffect, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

const LOCAL_STORAGE_KEY = "mytube_played_videos_today";

interface PlayedVideoData {
  videoId: string;
  playedAt: string;
}

export function usePlayedVideos() {
  const { isSignedIn, isLoaded } = useUser();
  const [playedVideoIds, setPlayedVideoIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to check if a date is today
  const isToday = (dateString: string) => {
    const date = new Date(dateString);
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  // Load played videos for today
  useEffect(() => {
    if (!isLoaded) return;

    const loadPlayed = async () => {
      setIsLoading(true);
      
      if (isSignedIn) {
        // Load from database for signed-in users
        try {
          const response = await fetch("/api/user/played-videos");
          if (response.ok) {
            const data = await response.json();
            setPlayedVideoIds(data.playedVideoIds || []);
          }
        } catch (error) {
          console.error("Failed to load played videos from DB:", error);
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
          const playedData: PlayedVideoData[] = JSON.parse(saved);
          // Filter to only today's videos
          const todayVideos = playedData
            .filter((item) => isToday(item.playedAt))
            .map((item) => item.videoId);
          setPlayedVideoIds(todayVideos);
          
          // Clean up localStorage - only keep today's entries
          if (todayVideos.length !== playedData.length) {
            const todayData = playedData.filter((item) => isToday(item.playedAt));
            localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(todayData));
          }
        }
      } catch (e) {
        console.error("Failed to load played videos from localStorage:", e);
      }
    };

    loadPlayed();
  }, [isSignedIn, isLoaded]);

  // Mark video as played
  const markAsPlayed = useCallback(async (videoId: string, videoTitle?: string, channelName?: string) => {
    // Update local state immediately
    setPlayedVideoIds((prev) => {
      if (prev.includes(videoId)) return prev;
      return [...prev, videoId];
    });

    if (isSignedIn) {
      // Save to database
      try {
        await fetch("/api/user/played-videos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ videoId, videoTitle, channelName }),
        });
      } catch (error) {
        console.error("Failed to save played video to database:", error);
      }
    } else {
      // Save to localStorage with timestamp
      try {
        const saved = localStorage.getItem(LOCAL_STORAGE_KEY);
        const existing: PlayedVideoData[] = saved ? JSON.parse(saved) : [];
        
        // Only add if not already played today
        if (!existing.some((item) => item.videoId === videoId && isToday(item.playedAt))) {
          const updated = [...existing, { videoId, playedAt: new Date().toISOString() }];
          localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
        }
      } catch (e) {
        console.error("Failed to save to localStorage:", e);
      }
    }
  }, [isSignedIn]);

  // Check if video was played today
  const isPlayedToday = useCallback((videoId: string) => {
    return playedVideoIds.includes(videoId);
  }, [playedVideoIds]);

  // Filter out today's played videos from a list
  const filterPlayedVideos = useCallback(<T extends { id: string }>(videos: T[]): T[] => {
    return videos.filter((video) => !playedVideoIds.includes(video.id));
  }, [playedVideoIds]);

  return {
    playedVideoIds,
    isLoading,
    markAsPlayed,
    isPlayedToday,
    filterPlayedVideos,
  };
}
