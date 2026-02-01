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
  PlayArrow as PlayArrowIcon,
  Pause as PauseIcon,
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
            onError?: (event: { data: number }) => void;
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
        BUFFERING: number;
        UNSTARTED: number;
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
  const onAlwaysSkipRef = useRef(onAlwaysSkip);
  const hasNextRef = useRef(hasNext);
  const hasPreviousRef = useRef(hasPrevious);
  const videoRef = useRef(video);
  const wakeLockRef = useRef<WakeLockSentinel | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const playbackTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const bufferingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const hasStartedPlayingRef = useRef(false);
  const isSkippingRef = useRef(false);
  const [isAudioMode, setIsAudioMode] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  // Keep refs updated
  useEffect(() => {
    onNextRef.current = onNext;
    onPreviousRef.current = onPrevious;
    onAlwaysSkipRef.current = onAlwaysSkip;
    hasNextRef.current = hasNext;
    hasPreviousRef.current = hasPrevious;
    videoRef.current = video;
  }, [onNext, onPrevious, onAlwaysSkip, hasNext, hasPrevious, video]);

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

  // Clear all pending timeouts
  const clearAllTimeouts = useCallback(() => {
    if (playbackTimeoutRef.current) {
      clearTimeout(playbackTimeoutRef.current);
      playbackTimeoutRef.current = null;
    }
    if (bufferingTimeoutRef.current) {
      clearTimeout(bufferingTimeoutRef.current);
      bufferingTimeoutRef.current = null;
    }
  }, []);

  // Skip to next video immediately (for error cases)
  const skipToNextVideo = useCallback(() => {
    // Prevent multiple skips for the same video
    if (isSkippingRef.current) {
      return;
    }
    isSkippingRef.current = true;
    
    // Clear any pending timeouts
    clearAllTimeouts();
    
    // Mark this video as "always skip" so it won't appear in future searches
    if (onAlwaysSkipRef.current) {
      onAlwaysSkipRef.current();
    } else if (hasNextRef.current && onNextRef.current) {
      // Fallback: just skip to next if onAlwaysSkip not available
      onNextRef.current();
    }
    
    // Reset skip flag after a short delay to allow next video to load
    setTimeout(() => {
      isSkippingRef.current = false;
    }, 500);
  }, [clearAllTimeouts]);

  const handleStateChange = useCallback((event: { data: number }) => {
    // YouTube PlayerState codes:
    // -1: UNSTARTED, 0: ENDED, 1: PLAYING, 2: PAUSED, 3: BUFFERING, 5: VIDEO CUED
    
    // Update media session playback state
    if ('mediaSession' in navigator) {
      if (event.data === 1) { // PLAYING
        navigator.mediaSession.playbackState = 'playing';
      } else if (event.data === 2) { // PAUSED
        navigator.mediaSession.playbackState = 'paused';
      }
    }

    // Update isPlaying state
    if (event.data === 1) { // PLAYING
      setIsPlaying(true);
    } else if (event.data === 2 || event.data === 0) { // PAUSED or ENDED
      setIsPlaying(false);
    }

    // Video started playing - clear all timeouts and mark as started
    if (event.data === 1) { // PLAYING
      hasStartedPlayingRef.current = true;
      clearAllTimeouts();
    }

    // Handle buffering state - set a timeout to skip if stuck buffering
    if (event.data === 3) { // BUFFERING
      // Clear any existing buffering timeout
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
      }
      // If buffering for too long (15 seconds), skip the video
      bufferingTimeoutRef.current = setTimeout(() => {
        console.warn(`Video stuck buffering: ${videoRef.current?.title}`);
        skipToNextVideo();
      }, 15000);
    } else {
      // Clear buffering timeout if we're no longer buffering
      if (bufferingTimeoutRef.current) {
        clearTimeout(bufferingTimeoutRef.current);
        bufferingTimeoutRef.current = null;
      }
    }

    // Handle UNSTARTED state (-1) - might indicate an unplayable video
    // This fires when video is cued but can't start (e.g., geo-blocked)
    if (event.data === -1) {
      // Don't immediately skip on UNSTARTED - wait for the main timeout
      // But log it for debugging
      console.log(`Video in UNSTARTED state: ${videoRef.current?.title}`);
    }

    // Auto-play next when video ends
    if (event.data === 0 && hasNextRef.current && onNextRef.current) {
      clearAllTimeouts();
      setTimeout(() => {
        onNextRef.current?.();
      }, 1000);
    }
  }, [clearAllTimeouts, skipToNextVideo]);

  // Handle YouTube player errors - mark as always skip and move to next immediately
  const handlePlayerError = useCallback((event: { data: number }) => {
    // YouTube error codes:
    // 2 - Invalid video ID
    // 5 - HTML5 player error
    // 100 - Video not found (removed or private)
    // 101/150 - Video not allowed for embedded playback
    console.warn(`YouTube player error (code ${event.data}) for video: ${videoRef.current?.title}`);
    
    // Skip immediately without showing error
    skipToNextVideo();
  }, [skipToNextVideo]);

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

  // Start silent audio to keep browser active in background
  const startSilentAudio = useCallback(() => {
    if (!silentAudioRef.current) {
      // Create a silent audio element with a tiny silent MP3 (base64 encoded)
      const silentAudio = new Audio(
        "data:audio/mp3;base64,SUQzBAAAAAAAI1RTU0UAAAAPAAADTGF2ZjU4Ljc2LjEwMAAAAAAAAAAAAAAA/+M4wAAAAAAAAAAAAEluZm8AAAAPAAAAAwAAAbAAqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqqq1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV1dXV////////////////////////////////////////////AAAAAExhdmM1OC4xMwAAAAAAAAAAAAAAACQAAAAAAAAAAaD//////////////////////////////////////////////////////////////////"
      );
      silentAudio.loop = true;
      silentAudio.volume = 0.01; // Very low volume
      silentAudioRef.current = silentAudio;
    }
    
    silentAudioRef.current.play().catch(err => {
      console.log('Silent audio play failed:', err);
    });
    console.log('Silent audio started - background playback enabled');
  }, []);

  // Stop silent audio
  const stopSilentAudio = useCallback(() => {
    if (silentAudioRef.current) {
      silentAudioRef.current.pause();
      silentAudioRef.current.currentTime = 0;
      console.log('Silent audio stopped');
    }
  }, []);

  // Toggle Audio-Only Mode (hides video, enables background playback)
  const toggleAudioMode = useCallback(() => {
    setIsAudioMode(prev => {
      if (!prev) {
        // Entering audio mode - request wake lock and start silent audio
        requestWakeLock();
        startSilentAudio();
      } else {
        // Exiting audio mode - release wake lock and stop silent audio
        releaseWakeLock();
        stopSilentAudio();
      }
      return !prev;
    });
  }, [requestWakeLock, releaseWakeLock, startSilentAudio, stopSilentAudio]);

  // Toggle play/pause
  const handlePlayPause = useCallback(() => {
    if (!playerRef.current) return;
    
    if (isPlaying) {
      playerRef.current.pauseVideo?.();
    } else {
      playerRef.current.playVideo?.();
    }
  }, [isPlaying]);

  // Auto-request wake lock and silent audio when in audio mode
  useEffect(() => {
    if (isAudioMode) {
      requestWakeLock();
      startSilentAudio();
      
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
        stopSilentAudio();
      };
    }
  }, [isAudioMode, requestWakeLock, releaseWakeLock, startSilentAudio, stopSilentAudio]);

  useEffect(() => {
    if (!video) return;

    // Reset playback tracking for new video
    hasStartedPlayingRef.current = false;
    isSkippingRef.current = false;
    
    // Clear any existing timeouts
    clearAllTimeouts();

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
      if (!playerElement) {
        console.warn('YouTube player element not found');
        return;
      }

      try {
        playerRef.current = new window.YT.Player("youtube-player", {
          videoId: video.id,
          events: {
            onStateChange: handleStateChange,
            onError: handlePlayerError,
            onReady: () => {
              console.log('YouTube player ready for:', video.title);
            },
          },
          playerVars: {
            autoplay: 1,
            enablejsapi: 1,
            playsinline: 1, // Important for iOS to allow inline playback
          },
        });
        
        // Set a timeout to skip if video doesn't start playing within 12 seconds
        playbackTimeoutRef.current = setTimeout(() => {
          if (!hasStartedPlayingRef.current && !isSkippingRef.current) {
            console.warn(`Video failed to start within 12 seconds: ${videoRef.current?.title}`);
            skipToNextVideo();
          }
        }, 12000);
        
      } catch (err) {
        console.error('Failed to create YouTube player:', err);
        skipToNextVideo();
      }
    };

    if (!window.YT || !window.YT.Player) {
      const existingScript = document.querySelector('script[src="https://www.youtube.com/iframe_api"]');
      
      if (!existingScript) {
        const tag = document.createElement("script");
        tag.src = "https://www.youtube.com/iframe_api";
        const firstScriptTag = document.getElementsByTagName("script")[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
        
        // Set a timeout for API loading - if it takes too long, skip
        playbackTimeoutRef.current = setTimeout(() => {
          if (!window.YT || !window.YT.Player) {
            console.warn('YouTube API failed to load within 15 seconds');
            skipToNextVideo();
          }
        }, 15000);
      }

      window.onYouTubeIframeAPIReady = () => {
        // Clear API loading timeout
        if (playbackTimeoutRef.current) {
          clearTimeout(playbackTimeoutRef.current);
          playbackTimeoutRef.current = null;
        }
        createPlayer();
      };
    } else {
      createPlayer();
    }

    return () => {
      // Clear all timeouts on cleanup
      clearAllTimeouts();
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch (e) {
          // Ignore errors on cleanup
        }
        playerRef.current = null;
      }
    };
  }, [video?.id, handleStateChange, handlePlayerError, skipToNextVideo, clearAllTimeouts]);

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
            <Typography className={styles.audioModeText}>מצב שמע ברקע</Typography>
            <Typography className={styles.audioModeSubtext}>המוזיקה תמשיך לנגן גם ברקע</Typography>
          </Box>
        )}
      </Box>

      {/* Floating Buttons - Mobile Only */}
      <Box className={styles.floatingButtonsContainer}>
        <Button
          variant="contained"
          onClick={handlePlayPause}
          className={styles.floatingPlayButton}
          aria-label={isPlaying ? "השהה" : "נגן"}
        >
          {isPlaying ? (
            <PauseIcon className={styles.floatingPlayIcon} />
          ) : (
            <PlayArrowIcon className={styles.floatingPlayIcon} />
          )}
        </Button>
        {hasNext && (
          <Button
            variant="contained"
            onClick={onNext}
            className={styles.floatingNextButton}
            aria-label="הבא"
          >
            <SkipNextIcon className={styles.floatingNextIcon} />
          </Button>
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
