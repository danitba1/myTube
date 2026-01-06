"use client";

import { useEffect, useRef, useCallback } from "react";
import { Box, Typography, Avatar, Button, IconButton, Divider, Stack, Skeleton } from "@mui/material";
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  MoreHoriz as MoreHorizIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Block as BlockIcon,
} from "@mui/icons-material";
import { Video, formatViewCount, formatLikeCount, formatRelativeTime } from "@/types/youtube";

// Declare YouTube types
declare global {
  interface Window {
    YT: {
      Player: new (
        elementId: string,
        config: {
          videoId: string;
          events: {
            onReady?: (event: any) => void;
            onStateChange?: (event: { data: number }) => void;
          };
          playerVars?: {
            autoplay?: number;
            enablejsapi?: number;
          };
        }
      ) => any;
      PlayerState: {
        ENDED: number;
      };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

interface VideoPlayerProps {
  video: Video | null;
  isLoading?: boolean;
  onPrevious?: () => void;
  onNext?: () => void;
  onAlwaysSkip?: () => void;
  hasPrevious?: boolean;
  hasNext?: boolean;
}

export default function VideoPlayer({ 
  video, 
  isLoading, 
  onPrevious, 
  onNext, 
  onAlwaysSkip,
  hasPrevious = false, 
  hasNext = false 
}: VideoPlayerProps) {
  const playerRef = useRef<any>(null);
  const onNextRef = useRef(onNext);
  const hasNextRef = useRef(hasNext);

  // Keep refs updated
  useEffect(() => {
    onNextRef.current = onNext;
    hasNextRef.current = hasNext;
  }, [onNext, hasNext]);

  // Handle video end - auto play next
  const handleStateChange = useCallback((event: { data: number }) => {
    // State 0 = ENDED
    if (event.data === 0 && hasNextRef.current && onNextRef.current) {
      // Small delay before playing next
      setTimeout(() => {
        onNextRef.current?.();
      }, 1000);
    }
  }, []);

  // Load YouTube IFrame API and create player
  useEffect(() => {
    if (!video) return;

    const createPlayer = () => {
      // Destroy existing player if any
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Player might already be destroyed
        }
        playerRef.current = null;
      }

      // Make sure the element exists
      const playerElement = document.getElementById("youtube-player");
      if (!playerElement) return;

      playerRef.current = new window.YT.Player("youtube-player", {
        videoId: video.id,
        events: {
          onStateChange: handleStateChange,
        },
        playerVars: {
          autoplay: 1,
          enablejsapi: 1,
        },
      });
    };

    // Load the IFrame Player API code asynchronously if not loaded
    if (!window.YT || !window.YT.Player) {
      // Check if script is already being loaded
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      window.onYouTubeIframeAPIReady = () => {
        createPlayer();
      };
    } else {
      createPlayer();
    }

    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors on cleanup
        }
        playerRef.current = null;
      }
    };
  }, [video?.id, handleStateChange]);

  if (isLoading) {
    return (
      <Box sx={{ width: "100%" }}>
        <Skeleton 
          variant="rounded" 
          sx={{ width: "100%", aspectRatio: "16/9", borderRadius: 2 }} 
        />
        <Box sx={{ mt: 2 }}>
          <Skeleton variant="text" width="80%" height={32} />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mt: 2 }}>
            <Skeleton variant="circular" width={40} height={40} />
            <Box>
              <Skeleton variant="text" width={120} />
              <Skeleton variant="text" width={80} />
            </Box>
          </Box>
        </Box>
      </Box>
    );
  }

  if (!video) {
    return (
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16/9",
          bgcolor: "grey.900",
          borderRadius: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Typography color="grey.500">חפש סרטונים כדי להתחיל לצפות</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ width: "100%" }}>
      {/* YouTube Player */}
      <Box
        sx={{
          width: "100%",
          aspectRatio: "16/9",
          bgcolor: "black",
          borderRadius: 2,
          overflow: "hidden",
          position: "relative",
        }}
      >
        <div 
          id="youtube-player"
          style={{
            width: "100%",
            height: "100%",
          }}
        />
      </Box>

      {/* Navigation Buttons */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          gap: { xs: 1, sm: 2 },
          mt: { xs: 1.5, sm: 2 },
          mb: 1,
          flexWrap: "wrap",
        }}
      >
        <Button
          variant="contained"
          startIcon={<SkipPreviousIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />}
          onClick={onPrevious}
          disabled={!hasPrevious}
          sx={{
            borderRadius: "24px",
            px: { xs: 2, sm: 3 },
            py: { xs: 0.75, sm: 1 },
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            bgcolor: "grey.800",
            minWidth: { xs: "auto", sm: 100 },
            "&:hover": {
              bgcolor: "grey.900",
            },
            "&:disabled": {
              bgcolor: "grey.300",
              color: "grey.500",
            },
          }}
        >
          הקודם
        </Button>
        
        <Button
          variant="contained"
          startIcon={<BlockIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />}
          onClick={onAlwaysSkip}
          sx={{
            borderRadius: "24px",
            px: { xs: 2, sm: 3 },
            py: { xs: 0.75, sm: 1 },
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            bgcolor: "error.main",
            minWidth: { xs: "auto", sm: 100 },
            "&:hover": {
              bgcolor: "error.dark",
            },
          }}
        >
          דלג תמיד
        </Button>
        
        <Button
          variant="contained"
          endIcon={<SkipNextIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />}
          onClick={onNext}
          disabled={!hasNext}
          sx={{
            borderRadius: "24px",
            px: { xs: 2, sm: 3 },
            py: { xs: 0.75, sm: 1 },
            textTransform: "none",
            fontWeight: 600,
            fontSize: { xs: "0.8rem", sm: "0.875rem" },
            bgcolor: "primary.main",
            minWidth: { xs: "auto", sm: 100 },
            "&:hover": {
              bgcolor: "primary.dark",
            },
            "&:disabled": {
              bgcolor: "grey.300",
              color: "grey.500",
            },
          }}
        >
          הבא
        </Button>
      </Box>

      {/* Video Info */}
      <Box sx={{ mt: 1 }}>
        <Typography
          variant="h6"
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            mb: 1,
            fontSize: { xs: "1rem", sm: "1.25rem" },
          }}
        >
          {video.title}
        </Typography>

        {/* Actions Row */}
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            justifyContent: "space-between",
            flexDirection: { xs: "column", md: "row" },
            gap: { xs: 1.5, sm: 2 },
          }}
        >
          {/* Channel Info */}
          <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 1, sm: 1.5 }, flexWrap: "wrap" }}>
            <Avatar
              sx={{ width: { xs: 32, sm: 40 }, height: { xs: 32, sm: 40 }, bgcolor: "primary.main", fontSize: { xs: "0.875rem", sm: "1rem" } }}
            >
              {video.channelName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
                {video.channelName}
              </Typography>
            </Box>
            <Button
              variant="contained"
              href={`https://www.youtube.com/channel/${video.channelId}?sub_confirmation=1`}
              target="_blank"
              size="small"
              sx={{
                borderRadius: "20px",
                px: { xs: 1.5, sm: 2.5 },
                ml: { xs: 0, sm: 1 },
                textTransform: "none",
                fontWeight: 600,
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
              }}
            >
              הרשמה
            </Button>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ gap: { xs: 0.5, sm: 1 } }}>
            <Box
              sx={{
                display: "flex",
                bgcolor: "grey.100",
                borderRadius: "20px",
                overflow: "hidden",
              }}
            >
              <Button
                startIcon={<ThumbUpIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
                sx={{
                  borderRadius: "20px 0 0 20px",
                  px: { xs: 1, sm: 2 },
                  py: { xs: 0.5, sm: 0.75 },
                  textTransform: "none",
                  color: "text.primary",
                  fontSize: { xs: "0.75rem", sm: "0.875rem" },
                  minWidth: "auto",
                  "&:hover": { bgcolor: "grey.200" },
                }}
              >
                {formatLikeCount(video.likeCount)}
              </Button>
              <Divider orientation="vertical" flexItem />
              <IconButton sx={{ px: { xs: 1, sm: 1.5 } }} size="small">
                <ThumbDownIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />
              </IconButton>
            </Box>

            <Button
              startIcon={<ShareIcon sx={{ fontSize: { xs: 16, sm: 20 } }} />}
              onClick={() => {
                navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
              }}
              sx={{
                bgcolor: "grey.100",
                borderRadius: "20px",
                px: { xs: 1.5, sm: 2 },
                py: { xs: 0.5, sm: 0.75 },
                textTransform: "none",
                color: "text.primary",
                fontSize: { xs: "0.75rem", sm: "0.875rem" },
                minWidth: "auto",
                "&:hover": { bgcolor: "grey.200" },
              }}
            >
              שיתוף
            </Button>

            <IconButton
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              size="small"
              sx={{
                bgcolor: "grey.100",
                "&:hover": { bgcolor: "grey.200" },
              }}
            >
              <MoreHorizIcon sx={{ fontSize: { xs: 18, sm: 24 } }} />
            </IconButton>
          </Stack>
        </Box>

        {/* Description */}
        <Box
          sx={{
            mt: { xs: 1.5, sm: 2 },
            p: { xs: 1.5, sm: 2 },
            bgcolor: "grey.100",
            borderRadius: 2,
          }}
        >
          <Typography variant="body2" sx={{ fontWeight: 600, mb: 0.5, fontSize: { xs: "0.8rem", sm: "0.875rem" } }}>
            {formatViewCount(video.viewCount)} • {formatRelativeTime(video.publishedAt)}
          </Typography>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "-webkit-box",
              WebkitLineClamp: { xs: 2, sm: 3 },
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
              whiteSpace: "pre-wrap",
              fontSize: { xs: "0.8rem", sm: "0.875rem" },
            }}
          >
            {video.description || "אין תיאור זמין"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
