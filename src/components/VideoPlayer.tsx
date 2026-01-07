"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { Box, Typography, Avatar, Button, IconButton, Divider, Stack, Skeleton, Tooltip } from "@mui/material";
import {
  ThumbUp as ThumbUpIcon,
  ThumbDown as ThumbDownIcon,
  Share as ShareIcon,
  MoreHoriz as MoreHorizIcon,
  SkipPrevious as SkipPreviousIcon,
  SkipNext as SkipNextIcon,
  Block as BlockIcon,
  Headphones as HeadphonesIcon,
  Videocam as VideocamIcon,
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
            playsinline?: number;
          };
        }
      ) => any;
      PlayerState: {
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
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
  const onPreviousRef = useRef(onPrevious);
  const hasNextRef = useRef(hasNext);
  const hasPreviousRef = useRef(hasPrevious);
  const videoRef = useRef(video);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const [isAudioMode, setIsAudioMode] = useState(false);

  // Keep refs updated
  useEffect(() => {
    onNextRef.current = onNext;
    onPreviousRef.current = onPrevious;
    hasNextRef.current = hasNext;
    hasPreviousRef.current = hasPrevious;
    videoRef.current = video;
  }, [onNext, onPrevious, hasNext, hasPrevious, video]);

  // Setup Media Session API for lock screen / notification controls
  useEffect(() => {
    if (!video || !('mediaSession' in navigator)) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: video.title,
      artist: video.channelName,
      album: 'MyTube',
      artwork: [
        { src: `https://img.youtube.com/vi/${video.id}/mqdefault.jpg`, sizes: '320x180', type: 'image/jpeg' },
        { src: `https://img.youtube.com/vi/${video.id}/hqdefault.jpg`, sizes: '480x360', type: 'image/jpeg' },
      ]
    });

    navigator.mediaSession.setActionHandler('play', () => {
      playerRef.current?.playVideo?.();
    });

    navigator.mediaSession.setActionHandler('pause', () => {
      playerRef.current?.pauseVideo?.();
    });

    navigator.mediaSession.setActionHandler('previoustrack', () => {
      if (hasPreviousRef.current && onPreviousRef.current) {
        onPreviousRef.current();
      }
    });

    navigator.mediaSession.setActionHandler('nexttrack', () => {
      if (hasNextRef.current && onNextRef.current) {
        onNextRef.current();
      }
    });

    return () => {
      navigator.mediaSession.setActionHandler('play', null);
      navigator.mediaSession.setActionHandler('pause', null);
      navigator.mediaSession.setActionHandler('previoustrack', null);
      navigator.mediaSession.setActionHandler('nexttrack', null);
    };
  }, [video]);

  const handleStateChange = useCallback((event: { data: number }) => {
    // Update media session playback state
    if ('mediaSession' in navigator) {
      if (event.data === 1) { // PLAYING
        navigator.mediaSession.playbackState = 'playing';
      } else if (event.data === 2) { // PAUSED
        navigator.mediaSession.playbackState = 'paused';
      }
    }

    // Auto-play next when video ends
    if (event.data === 0 && hasNextRef.current && onNextRef.current) {
      setTimeout(() => {
        onNextRef.current?.();
      }, 1000);
    }
  }, []);

  // Request Wake Lock to keep device awake during playback
  const requestWakeLock = useCallback(async () => {
    if ('wakeLock' in navigator) {
      try {
        wakeLockRef.current = await navigator.wakeLock.request('screen');
        console.log('Wake Lock activated');
      } catch (err) {
        console.log('Wake Lock failed:', err);
      }
    }
  }, []);

  // Release Wake Lock
  const releaseWakeLock = useCallback(async () => {
    if (wakeLockRef.current) {
      try {
        await wakeLockRef.current.release();
        wakeLockRef.current = null;
        console.log('Wake Lock released');
      } catch (err) {
        console.log('Wake Lock release failed:', err);
      }
    }
  }, []);

  // Toggle Audio-Only Mode (hides video, saves battery)
  const toggleAudioMode = useCallback(() => {
    setIsAudioMode(prev => {
      if (!prev) {
        // Entering audio mode - request wake lock
        requestWakeLock();
      } else {
        // Exiting audio mode - release wake lock
        releaseWakeLock();
      }
      return !prev;
    });
  }, [requestWakeLock, releaseWakeLock]);

  // Auto-request wake lock when playing
  useEffect(() => {
    if (isAudioMode) {
      requestWakeLock();
      
      // Re-request wake lock if it gets released (e.g., when visibility changes)
      const handleVisibilityChange = () => {
        if (document.visibilityState === 'visible' && isAudioMode) {
          requestWakeLock();
        }
      };
      
      document.addEventListener('visibilitychange', handleVisibilityChange);
      return () => {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        releaseWakeLock();
      };
    }
  }, [isAudioMode, requestWakeLock, releaseWakeLock]);

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
          playsinline: 1, // Important for iOS to allow inline playback
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
      <Box className={`${styles.playerWrapper} ${isAudioMode ? styles.audioMode : ''}`}>
        <div id="youtube-player" className={styles.player} />
        
        {/* Audio Mode Overlay */}
        {isAudioMode && (
          <Box className={styles.audioModeOverlay}>
            <HeadphonesIcon className={styles.audioModeIcon} />
            <Typography className={styles.audioModeText}>מצב שמע בלבד</Typography>
            <Typography className={styles.audioModeSubtext}>המסך יישאר דלוק כדי להמשיך לנגן</Typography>
          </Box>
        )}
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
          startIcon={isAudioMode ? <VideocamIcon className={styles.navIcon} /> : <HeadphonesIcon className={styles.navIcon} />}
          onClick={toggleAudioMode}
          className={isAudioMode ? styles.navButtonAudioActive : styles.navButtonAudio}
        >
          {isAudioMode ? "וידאו" : "שמע"}
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
