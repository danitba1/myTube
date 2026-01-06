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
import styles from "./VideoPlayer.module.css";

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

  useEffect(() => {
    onNextRef.current = onNext;
    hasNextRef.current = hasNext;
  }, [onNext, hasNext]);

  const handleStateChange = useCallback((event: { data: number }) => {
    if (event.data === 0 && hasNextRef.current && onNextRef.current) {
      setTimeout(() => {
        onNextRef.current?.();
      }, 1000);
    }
  }, []);

  useEffect(() => {
    if (!video) return;

    const createPlayer = () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Player might already be destroyed
        }
        playerRef.current = null;
      }

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

    if (!window.YT || !window.YT.Player) {
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
      <Box className={styles.skeletonWrapper}>
        <Skeleton variant="rounded" className={styles.playerSkeleton} />
        <Box className={styles.infoSkeleton}>
          <Skeleton variant="text" width="80%" height={32} />
          <Box className={styles.channelSkeleton}>
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
      <Box className={styles.emptyState}>
        <Typography className={styles.emptyText}>חפש סרטונים כדי להתחיל לצפות</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      {/* YouTube Player */}
      <Box className={styles.playerWrapper}>
        <div id="youtube-player" className={styles.player} />
      </Box>

      {/* Navigation Buttons */}
      <Box className={styles.navigationButtons}>
        <Button
          variant="contained"
          startIcon={<SkipPreviousIcon className={styles.navIcon} />}
          onClick={onPrevious}
          disabled={!hasPrevious}
          className={styles.navButtonPrev}
        >
          הקודם
        </Button>
        
        <Button
          variant="contained"
          startIcon={<BlockIcon className={styles.navIcon} />}
          onClick={onAlwaysSkip}
          className={styles.navButtonSkip}
        >
          דלג תמיד
        </Button>
        
        <Button
          variant="contained"
          endIcon={<SkipNextIcon className={styles.navIcon} />}
          onClick={onNext}
          disabled={!hasNext}
          className={styles.navButtonNext}
        >
          הבא
        </Button>
      </Box>

      {/* Video Info */}
      <Box className={styles.videoInfo}>
        <Typography variant="h6" className={styles.videoTitle}>
          {video.title}
        </Typography>

        {/* Actions Row */}
        <Box className={styles.actionsRow}>
          {/* Channel Info */}
          <Box className={styles.channelInfo}>
            <Avatar className={styles.channelAvatar}>
              {video.channelName.charAt(0)}
            </Avatar>
            <Box>
              <Typography variant="subtitle2" className={styles.channelName}>
                {video.channelName}
              </Typography>
            </Box>
            <Button
              variant="contained"
              href={`https://www.youtube.com/channel/${video.channelId}?sub_confirmation=1`}
              target="_blank"
              size="small"
              className={styles.subscribeButton}
            >
              הרשמה
            </Button>
          </Box>

          {/* Action Buttons */}
          <Stack direction="row" className={styles.actionButtons}>
            <Box className={styles.likeDislikeGroup}>
              <Button
                startIcon={<ThumbUpIcon className={styles.actionIcon} />}
                className={styles.likeButton}
              >
                {formatLikeCount(video.likeCount)}
              </Button>
              <Divider orientation="vertical" flexItem />
              <IconButton className={styles.dislikeButton} size="small">
                <ThumbDownIcon className={styles.actionIcon} />
              </IconButton>
            </Box>

            <Button
              startIcon={<ShareIcon className={styles.actionIcon} />}
              onClick={() => {
                navigator.clipboard.writeText(`https://www.youtube.com/watch?v=${video.id}`);
              }}
              className={styles.shareButton}
            >
              שיתוף
            </Button>

            <IconButton
              href={`https://www.youtube.com/watch?v=${video.id}`}
              target="_blank"
              size="small"
              className={styles.moreButton}
            >
              <MoreHorizIcon className={styles.moreIcon} />
            </IconButton>
          </Stack>
        </Box>

        {/* Description */}
        <Box className={styles.descriptionBox}>
          <Typography variant="body2" className={styles.videoStats}>
            {formatViewCount(video.viewCount)} • {formatRelativeTime(video.publishedAt)}
          </Typography>
          <Typography variant="body2" className={styles.description}>
            {video.description || "אין תיאור זמין"}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}
