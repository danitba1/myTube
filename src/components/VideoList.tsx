"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import { PlayArrow as PlayArrowIcon } from "@mui/icons-material";
import { Video } from "@/types/youtube";
import styles from "./VideoList.module.css";

interface VideoListProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  currentVideoId?: string;
  isLoading?: boolean;
}

export default function VideoList({ videos, onVideoSelect, currentVideoId, isLoading }: VideoListProps) {
  if (isLoading) {
    return (
      <Box className={styles.loadingContainer}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={36} />
        ))}
      </Box>
    );
  }

  if (videos.length === 0) {
    return (
      <Box className={styles.emptyState}>
        <Typography>חפש סרטונים כדי לראות תוצאות</Typography>
      </Box>
    );
  }

  return (
    <Box className={styles.container}>
      <Box className={styles.videoList}>
        {videos.map((video, index) => {
          const isSelected = currentVideoId === video.id;
          return (
            <Box
              key={`${video.id}-${index}`}
              onClick={() => onVideoSelect(video)}
              className={isSelected ? styles.videoItemSelected : styles.videoItem}
            >
              {/* Index number */}
              <Typography className={isSelected ? styles.indexBadgeSelected : styles.indexBadge}>
                {isSelected ? <PlayArrowIcon className={styles.playIcon} /> : index + 1}
              </Typography>

              {/* Video title */}
              <Typography
                variant="body2"
                className={isSelected ? styles.videoTitleSelected : styles.videoTitle}
              >
                {video.title}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}
