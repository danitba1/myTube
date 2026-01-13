"use client";

import { useState, useCallback } from "react";
import { Box, Container, Typography, Alert, Snackbar, Chip, Stack, IconButton, Tooltip } from "@mui/material";
import { Shuffle as ShuffleIcon } from "@mui/icons-material";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import VideoList from "@/components/VideoList";
import { Video } from "@/types/youtube";
import { useSkippedVideos } from "@/hooks/useSkippedVideos";
import styles from "./page.module.css";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const MAX_SEARCH_TERMS = 10;

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [warningMessage, setWarningMessage] = useState<string | null>(null);
  
  const { skippedVideoIds, addToSkipList } = useSkippedVideos();

  const handleSearch = useCallback(async (query: string, preferNew?: boolean) => {
    if (!query.trim()) return;

    let terms = query
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    if (terms.length === 0) return;

    // Remove duplicates (case-insensitive)
    const seen = new Set<string>();
    terms = terms.filter((term) => {
      const lowerTerm = term.toLowerCase();
      if (seen.has(lowerTerm)) {
        return false;
      }
      seen.add(lowerTerm);
      return true;
    });

    // Limit to MAX_SEARCH_TERMS and show warning if exceeded
    if (terms.length > MAX_SEARCH_TERMS) {
      setWarningMessage(`הרשימה גדולה מדי! רק ${MAX_SEARCH_TERMS} הערכים הראשונים יחופשו.`);
      terms = terms.slice(0, MAX_SEARCH_TERMS);
    } else {
      setWarningMessage(null);
    }

    setSearchTerms(terms);
    setIsLoading(true);
    setError(null);

    try {
      const maxTotalResults = 50;
      const resultsPerTerm = Math.min(
        Math.floor(maxTotalResults / terms.length),
        20
      );

      const searchPromises = terms.map(async (term) => {
        const preferNewParam = preferNew ? "&preferNew=true" : "";
        const response = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(term)}&maxResults=${resultsPerTerm}${preferNewParam}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch videos for "${term}"`);
        }

        const data = await response.json();
        return data.videos as Video[];
      });

      const allResults = await Promise.all(searchPromises);
      const combinedVideos = allResults.flat();

      const uniqueVideos = combinedVideos.filter(
        (video, index, self) =>
          index === self.findIndex((v) => v.id === video.id)
      );

      const filteredVideos = uniqueVideos.filter(
        (video) => !skippedVideoIds.includes(video.id)
      );

      const shuffledVideos = shuffleArray(filteredVideos);

      setVideos(shuffledVideos);

      if (shuffledVideos.length > 0) {
        setSelectedVideo(shuffledVideos[0]);
      } else {
        setSelectedVideo(null);
      }

      // Save search to history
      try {
        const historyResponse = await fetch("/api/user/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQuery: query,
            searchTerms: terms,
            resultsCount: shuffledVideos.length,
          }),
        });
        
        if (!historyResponse.ok) {
          const errorData = await historyResponse.json().catch(() => ({}));
          console.error("Failed to save search history:", historyResponse.status, errorData);
        }
      } catch (saveError) {
        console.error("Failed to save search history:", saveError);
      }
    } catch (err) {
      console.error("Search error:", err);
      setError(err instanceof Error ? err.message : "שגיאה בחיפוש סרטונים");
      setVideos([]);
      setSelectedVideo(null);
    } finally {
      setIsLoading(false);
    }
  }, [skippedVideoIds]);

  const handleVideoSelect = useCallback((video: Video) => {
    setSelectedVideo(video);
  }, []);

  const currentIndex = selectedVideo 
    ? videos.findIndex((v) => v.id === selectedVideo.id) 
    : -1;

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setSelectedVideo(videos[currentIndex - 1]);
    }
  }, [currentIndex, videos]);

  const handleNext = useCallback(() => {
    if (currentIndex < videos.length - 1) {
      setSelectedVideo(videos[currentIndex + 1]);
    }
  }, [currentIndex, videos]);

  const handleReshuffle = useCallback(() => {
    if (videos.length > 0) {
      const reshuffled = shuffleArray(videos);
      setVideos(reshuffled);
    }
  }, [videos]);

  const handleAlwaysSkip = useCallback(() => {
    if (!selectedVideo) return;
    
    addToSkipList(selectedVideo.id, selectedVideo.title, selectedVideo.channelName);
    
    const updatedVideos = videos.filter((v) => v.id !== selectedVideo.id);
    setVideos(updatedVideos);
    
    if (currentIndex < updatedVideos.length) {
      setSelectedVideo(updatedVideos[currentIndex]);
    } else if (updatedVideos.length > 0) {
      setSelectedVideo(updatedVideos[updatedVideos.length - 1]);
    } else {
      setSelectedVideo(null);
    }
    
    setSuccessMessage(`"${selectedVideo.title}" נוסף לרשימת הדילוג`);
  }, [selectedVideo, videos, currentIndex, addToSkipList]);

  const handleCloseError = () => {
    setError(null);
  };

  const handleCloseSuccess = () => {
    setSuccessMessage(null);
  };

  const handleCloseWarning = () => {
    setWarningMessage(null);
  };

  const handlePlaylistSelect = useCallback(async (playlistId: string) => {
    setIsLoading(true);
    setError(null);
    setWarningMessage(null);
    setSearchTerms([]);

    try {
      const response = await fetch(`/api/user/playlists/videos?playlistId=${playlistId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to load playlist");
      }

      const data = await response.json();
      const playlistVideos: Video[] = (data.videos || []).map((v: {
        videoId: string;
        videoTitle: string;
        channelName?: string;
        channelId?: string;
        thumbnailUrl?: string;
        duration?: string;
      }) => ({
        id: v.videoId,
        title: v.videoTitle,
        channelName: v.channelName || "",
        channelId: v.channelId || "",
        thumbnailUrl: v.thumbnailUrl || "",
        duration: v.duration || "",
      }));

      // Filter out skipped videos
      const filteredVideos = playlistVideos.filter(
        (video) => !skippedVideoIds.includes(video.id)
      );

      setVideos(filteredVideos);

      if (filteredVideos.length > 0) {
        setSelectedVideo(filteredVideos[0]);
      } else {
        setSelectedVideo(null);
      }
    } catch (err) {
      console.error("Playlist load error:", err);
      setError(err instanceof Error ? err.message : "שגיאה בטעינת הפלייליסט");
      setVideos([]);
      setSelectedVideo(null);
    } finally {
      setIsLoading(false);
    }
  }, [skippedVideoIds]);

  return (
    <Box className={styles.pageContainer}>
      <Header onSearch={handleSearch} onPlaylistSelect={handlePlaylistSelect} />

      <Container maxWidth={false} className={styles.mainContainer}>
        <Box className={styles.contentWrapper}>
          {/* Main Video Player */}
          <Box className={styles.playerSection}>
            <VideoPlayer 
              video={selectedVideo} 
              isLoading={isLoading && !selectedVideo}
              onPrevious={handlePrevious}
              onNext={handleNext}
              onAlwaysSkip={handleAlwaysSkip}
              hasPrevious={currentIndex > 0}
              hasNext={currentIndex < videos.length - 1 && currentIndex >= 0}
            />
          </Box>

          {/* Video List Sidebar */}
          <Box className={styles.sidebarSection}>
            <Box className={styles.sidebarHeader}>
              <Box className={styles.sidebarTitleRow}>
                <Typography variant="subtitle1" className={styles.sidebarTitle}>
                  {searchTerms.length > 0
                    ? `תוצאות חיפוש (${videos.length} סרטונים)`
                    : "חפש סרטונים כדי להתחיל"}
                </Typography>
                {videos.length > 1 && (
                  <Tooltip title="ערבב מחדש">
                    <IconButton
                      onClick={handleReshuffle}
                      size="small"
                      className={styles.shuffleButton}
                    >
                      <ShuffleIcon className={styles.shuffleIcon} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {searchTerms.length > 0 && (
                <Stack direction="row" className={styles.searchTermsContainer}>
                  {searchTerms.map((term, index) => (
                    <Chip
                      key={index}
                      label={term}
                      size="small"
                      color="primary"
                      variant="outlined"
                      className={styles.searchTermChip}
                      classes={{
                        label: styles.chipLabel,
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Box className={styles.videoListContainer}>
              <VideoList
                videos={videos}
                onVideoSelect={handleVideoSelect}
                currentVideoId={selectedVideo?.id}
                isLoading={isLoading}
              />
            </Box>
          </Box>
        </Box>
      </Container>

      {/* Error Snackbar */}
      <Snackbar
        open={!!error}
        autoHideDuration={6000}
        onClose={handleCloseError}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseError} severity="error">
          {error}
        </Alert>
      </Snackbar>

      {/* Success Snackbar */}
      <Snackbar
        open={!!successMessage}
        autoHideDuration={3000}
        onClose={handleCloseSuccess}
        anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
      >
        <Alert onClose={handleCloseSuccess} severity="success">
          {successMessage}
        </Alert>
      </Snackbar>

      {/* Warning Snackbar */}
      <Snackbar
        open={!!warningMessage}
        autoHideDuration={6000}
        onClose={handleCloseWarning}
        anchorOrigin={{ vertical: "top", horizontal: "center" }}
      >
        <Alert onClose={handleCloseWarning} severity="warning">
          {warningMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
