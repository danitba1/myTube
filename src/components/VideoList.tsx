"use client";

import { Box, Typography, Skeleton } from "@mui/material";
import { PlayArrow as PlayArrowIcon } from "@mui/icons-material";
import { Video } from "@/types/youtube";

interface VideoListProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  currentVideoId?: string;
  isLoading?: boolean;
}

export default function VideoList({ videos, onVideoSelect, currentVideoId, isLoading }: VideoListProps) {
  if (isLoading) {
    return (
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1, p: 1 }}>
        {Array.from({ length: 15 }).map((_, i) => (
          <Skeleton key={i} variant="rounded" height={36} />
        ))}
      </Box>
    );
  }

  if (videos.length === 0) {
    return (
      <Box 
        sx={{ 
          display: "flex", 
          alignItems: "center", 
          justifyContent: "center",
          height: 200,
          color: "text.secondary",
        }}
      >
        <Typography>חפש סרטונים כדי לראות תוצאות</Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        height: "100%",
        overflowY: "scroll",
        overflowX: "hidden",
        pr: 1,
        // Custom scrollbar styling
        "&::-webkit-scrollbar": {
          width: "10px",
        },
        "&::-webkit-scrollbar-track": {
          bgcolor: "grey.200",
          borderRadius: "5px",
        },
        "&::-webkit-scrollbar-thumb": {
          bgcolor: "grey.500",
          borderRadius: "5px",
          border: "2px solid",
          borderColor: "grey.200",
          "&:hover": {
            bgcolor: "grey.600",
          },
        },
        // Firefox scrollbar
        scrollbarWidth: "thin",
        scrollbarColor: "#9e9e9e #e0e0e0",
      }}
    >
      <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {videos.map((video, index) => {
          const isSelected = currentVideoId === video.id;
          return (
            <Box
              key={`${video.id}-${index}`}
              onClick={() => onVideoSelect(video)}
              sx={{
                display: "flex",
                alignItems: "center",
                gap: 1,
                p: 1.5,
                borderRadius: 1,
                cursor: "pointer",
                bgcolor: isSelected ? "primary.main" : "grey.50",
                color: isSelected ? "primary.contrastText" : "text.primary",
                border: "1px solid",
                borderColor: isSelected ? "primary.dark" : "grey.200",
                transition: "all 0.15s ease",
                "&:hover": {
                  bgcolor: isSelected ? "primary.dark" : "grey.100",
                  borderColor: isSelected ? "primary.dark" : "primary.light",
                },
              }}
            >
              {/* Index number */}
              <Typography
                sx={{
                  minWidth: 28,
                  height: 28,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  bgcolor: isSelected ? "primary.dark" : "grey.200",
                  color: isSelected ? "primary.contrastText" : "text.secondary",
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {isSelected ? <PlayArrowIcon sx={{ fontSize: 16 }} /> : index + 1}
              </Typography>

              {/* Video title */}
              <Typography
                variant="body2"
                sx={{
                  flex: 1,
                  fontWeight: isSelected ? 600 : 400,
                  lineHeight: 1.4,
                  // Allow text to wrap for readability
                  wordBreak: "break-word",
                  overflow: "hidden",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                }}
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
