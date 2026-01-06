"use client";

import { useState, useCallback, useEffect } from "react";
import { Box, Container, Typography, Alert, Snackbar, Chip, Stack, IconButton, Tooltip } from "@mui/material";
import { Shuffle as ShuffleIcon } from "@mui/icons-material";
import Header from "@/components/Header";
import VideoPlayer from "@/components/VideoPlayer";
import VideoList from "@/components/VideoList";
import { Video } from "@/types/youtube";
import { useSkippedVideos } from "@/hooks/useSkippedVideos";

// Fisher-Yates shuffle algorithm
function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

export default function DashboardPage() {
  const [videos, setVideos] = useState<Video[]>([]);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [searchTerms, setSearchTerms] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const { skippedVideoIds, addToSkipList, filterSkippedVideos } = useSkippedVideos();

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) return;

    // Split by comma and clean up each term
    const terms = query
      .split(",")
      .map((term) => term.trim())
      .filter((term) => term.length > 0);

    if (terms.length === 0) return;

    setSearchTerms(terms);
    setIsLoading(true);
    setError(null);

    try {
      // Calculate results per term (distribute evenly, max 50 total)
      const maxTotalResults = 50;
      const resultsPerTerm = Math.min(
        Math.floor(maxTotalResults / terms.length),
        20
      );

      // Fetch videos for all search terms in parallel
      const searchPromises = terms.map(async (term) => {
        const response = await fetch(
          `/api/youtube/search?q=${encodeURIComponent(term)}&maxResults=${resultsPerTerm}`
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Failed to fetch videos for "${term}"`);
        }

        const data = await response.json();
        return data.videos as Video[];
      });

      // Wait for all searches to complete
      const allResults = await Promise.all(searchPromises);

      // Combine all videos
      const combinedVideos = allResults.flat();

      // Remove duplicates (same video ID)
      const uniqueVideos = combinedVideos.filter(
        (video, index, self) =>
          index === self.findIndex((v) => v.id === video.id)
      );

      // Filter out skipped videos
      const filteredVideos = uniqueVideos.filter(
        (video) => !skippedVideoIds.includes(video.id)
      );

      // Shuffle the combined results
      const shuffledVideos = shuffleArray(filteredVideos);

      setVideos(shuffledVideos);

      // Auto-select first video from shuffled results
      if (shuffledVideos.length > 0) {
        setSelectedVideo(shuffledVideos[0]);
      } else {
        setSelectedVideo(null);
      }

      // Save search to database for logged-in users
      try {
        await fetch("/api/user/search-history", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            searchQuery: query,
            searchTerms: terms,
            resultsCount: shuffledVideos.length,
          }),
        });
      } catch (saveError) {
        // Don't fail the search if saving history fails
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

  // Get current video index
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
      // Keep the current video selected, it will now be at a different position
    }
  }, [videos]);

  const handleAlwaysSkip = useCallback(() => {
    if (!selectedVideo) return;
    
    // Add to skip list
    addToSkipList(selectedVideo.id, selectedVideo.title, selectedVideo.channelName);
    
    // Remove from current video list
    const updatedVideos = videos.filter((v) => v.id !== selectedVideo.id);
    setVideos(updatedVideos);
    
    // Move to next video or previous if at end
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

  return (
    <Box
      sx={{
        minHeight: "100vh",
        bgcolor: "background.default",
      }}
    >
      <Header onSearch={handleSearch} />

      <Container
        maxWidth={false}
        sx={{
          py: { xs: 1.5, sm: 2, md: 3 },
          px: { xs: 1, sm: 2, md: 3, lg: 4 },
        }}
      >
        <Box
          sx={{
            display: "flex",
            gap: { xs: 2, sm: 2, md: 3 },
            flexDirection: { xs: "column", lg: "row" },
          }}
        >
          {/* Main Video Player */}
          <Box
            sx={{
              flex: 1,
              minWidth: 0,
              maxWidth: { lg: "calc(100% - 420px)" },
            }}
          >
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
          <Box
            sx={{
              width: { xs: "100%", lg: 400 },
              flexShrink: 0,
            }}
          >
            <Box sx={{ mb: { xs: 1, sm: 2 }, px: { xs: 0.5, sm: 1 } }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: { xs: 0.5, sm: 1 } }}>
                <Typography
                  variant="subtitle1"
                  sx={{
                    fontWeight: 600,
                    fontSize: { xs: "0.9rem", sm: "1rem" },
                  }}
                >
                  {searchTerms.length > 0
                    ? `תוצאות חיפוש (${videos.length} סרטונים)`
                    : "חפש סרטונים כדי להתחיל"}
                </Typography>
                {videos.length > 1 && (
                  <Tooltip title="ערבב מחדש">
                    <IconButton
                      onClick={handleReshuffle}
                      size="small"
                      sx={{
                        bgcolor: "primary.main",
                        color: "white",
                        width: { xs: 28, sm: 32 },
                        height: { xs: 28, sm: 32 },
                        "&:hover": {
                          bgcolor: "primary.dark",
                        },
                      }}
                    >
                      <ShuffleIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
              {searchTerms.length > 0 && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {searchTerms.map((term, index) => (
                    <Chip
                      key={index}
                      label={term}
                      size="small"
                      color="primary"
                      variant="outlined"
                      sx={{ 
                        mb: 0.5,
                        height: { xs: 24, sm: 28 },
                        "& .MuiChip-label": {
                          fontSize: { xs: "0.7rem", sm: "0.8rem" },
                          px: { xs: 1, sm: 1.5 },
                        },
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Box>
            <Box
              sx={{
                height: { xs: "auto", lg: "calc(100vh - 180px)" },
                maxHeight: { xs: 350, sm: 450, md: 600, lg: "none" },
              }}
            >
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
        <Alert onClose={handleCloseError} severity="error" sx={{ width: "100%" }}>
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
        <Alert onClose={handleCloseSuccess} severity="success" sx={{ width: "100%" }}>
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}
