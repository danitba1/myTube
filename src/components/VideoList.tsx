"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Skeleton, IconButton, Menu, MenuItem, ListItemIcon, ListItemText, Divider, TextField, Button } from "@mui/material";
import { PlayArrow as PlayArrowIcon, PlaylistAdd as PlaylistAddIcon, Add as AddIcon } from "@mui/icons-material";
import { Video } from "@/types/youtube";
import styles from "./VideoList.module.css";

interface Playlist {
  id: string;
  name: string;
}

interface VideoListProps {
  videos: Video[];
  onVideoSelect: (video: Video) => void;
  currentVideoId?: string;
  isLoading?: boolean;
}

export default function VideoList({ videos, onVideoSelect, currentVideoId, isLoading }: VideoListProps) {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const [showNewPlaylist, setShowNewPlaylist] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Fetch playlists
  useEffect(() => {
    const fetchPlaylists = async () => {
      try {
        const response = await fetch("/api/user/playlists");
        if (response.ok) {
          const data = await response.json();
          setPlaylists(data.playlists || []);
        }
      } catch (error) {
        console.error("Failed to fetch playlists:", error);
      }
    };
    fetchPlaylists();
  }, []);

  const handlePlaylistButtonClick = (event: React.MouseEvent<HTMLElement>, video: Video) => {
    event.stopPropagation();
    setSelectedVideo(video);
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedVideo(null);
    setShowNewPlaylist(false);
    setNewPlaylistName("");
  };

  const handleAddToPlaylist = async (playlistId: string) => {
    if (!selectedVideo) return;

    try {
      const response = await fetch("/api/user/playlists/videos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          playlistId,
          videoId: selectedVideo.id,
          videoTitle: selectedVideo.title,
          channelName: selectedVideo.channelName,
          channelId: selectedVideo.channelId,
          thumbnailUrl: selectedVideo.thumbnailUrl,
          duration: selectedVideo.duration,
        }),
      });

      if (response.ok) {
        handleClose();
      } else if (response.status === 409) {
        alert("הסרטון כבר קיים בפלייליסט");
      }
    } catch (error) {
      console.error("Failed to add to playlist:", error);
    }
  };

  const handleCreatePlaylist = async () => {
    if (!newPlaylistName.trim()) return;

    setIsCreating(true);
    try {
      const response = await fetch("/api/user/playlists", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newPlaylistName.trim() }),
      });

      if (response.ok) {
        const data = await response.json();
        setPlaylists(prev => [data.playlist, ...prev]);
        // Add video to the new playlist
        if (selectedVideo) {
          await handleAddToPlaylist(data.playlist.id);
        }
        setShowNewPlaylist(false);
        setNewPlaylistName("");
      }
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setIsCreating(false);
    }
  };
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
              className={isSelected ? styles.videoItemSelected : styles.videoItem}
            >
              {/* Clickable area for video selection */}
              <Box 
                onClick={() => onVideoSelect(video)}
                className={styles.videoClickArea}
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

              {/* Add to playlist button */}
              <IconButton
                size="small"
                onClick={(e) => handlePlaylistButtonClick(e, video)}
                className={styles.playlistButton}
              >
                <PlaylistAddIcon className={styles.playlistIcon} />
              </IconButton>
            </Box>
          );
        })}
      </Box>

      {/* Playlist Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "left" }}
        transformOrigin={{ vertical: "top", horizontal: "left" }}
      >
        <MenuItem disabled>
          <Typography variant="subtitle2" fontWeight="bold">
            הוסף לפלייליסט
          </Typography>
        </MenuItem>
        <Divider />
        
        {playlists.map((playlist) => (
          <MenuItem key={playlist.id} onClick={() => handleAddToPlaylist(playlist.id)}>
            <ListItemText primary={playlist.name} />
          </MenuItem>
        ))}

        {playlists.length === 0 && !showNewPlaylist && (
          <MenuItem disabled>
            <Typography variant="body2" color="text.secondary">
              אין פלייליסטים
            </Typography>
          </MenuItem>
        )}

        <Divider />

        {showNewPlaylist ? (
          <Box sx={{ p: 1, display: "flex", gap: 1, alignItems: "center" }}>
            <TextField
              size="small"
              placeholder="שם הפלייליסט"
              value={newPlaylistName}
              onChange={(e) => setNewPlaylistName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleCreatePlaylist()}
              autoFocus
              sx={{ flex: 1 }}
            />
            <Button 
              size="small" 
              variant="contained" 
              onClick={handleCreatePlaylist}
              disabled={isCreating || !newPlaylistName.trim()}
            >
              צור
            </Button>
          </Box>
        ) : (
          <MenuItem onClick={() => setShowNewPlaylist(true)}>
            <ListItemIcon>
              <AddIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary="צור פלייליסט חדש" />
          </MenuItem>
        )}
      </Menu>
    </Box>
  );
}
