"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { AppBar, Toolbar, Box, IconButton, Badge, Typography, Skeleton, Tooltip } from "@mui/material";
import {
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  VideoLibrary as VideoLibraryIcon,
  BarChart as BarChartIcon,
} from "@mui/icons-material";
import { UserButton } from "@clerk/nextjs";
import styles from "./Header.module.css";

// Dynamically import SearchBox with SSR disabled to prevent hydration issues
const SearchBox = dynamic(() => import("./SearchBox"), {
  ssr: false,
  loading: () => (
    <Skeleton 
      variant="rounded" 
      width="100%" 
      height={44} 
      className={styles.searchSkeleton}
    />
  ),
});

interface HeaderProps {
  onSearch?: (query: string, preferNew?: boolean, isFavourites?: boolean, avoidDuplicates?: boolean, isSearchAll?: boolean) => void;
  onPlaylistSelect?: (playlistId: string) => void;
  initialSearchValue?: string;
}

export default function Header({ onSearch, onPlaylistSelect, initialSearchValue }: HeaderProps) {
  const router = useRouter();

  return (
    <AppBar position="sticky" elevation={0} className={styles.appBar}>
      <Toolbar className={styles.toolbar}>
        {/* Left Section - Logo */}
        <Box className={styles.logoSection}>
          <Box 
            className={styles.logoWrapper} 
            onClick={() => router.push("/dashboard")}
            style={{ cursor: "pointer" }}
          >
            <VideoLibraryIcon className={styles.logoIcon} />
            <Typography variant="h6" className={styles.logoText}>
              MyTube
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search (Desktop) */}
        <Box className={styles.searchSectionDesktop}>
          <SearchBox onSearch={onSearch} onPlaylistSelect={onPlaylistSelect} initialValue={initialSearchValue} />
        </Box>

        {/* Right Section - Actions */}
        <Box className={styles.actionsSection}>
          <Tooltip title="סטטיסטיקות">
            <IconButton 
              className={styles.iconButton}
              onClick={() => router.push("/statistics")}
            >
              <BarChartIcon />
            </IconButton>
          </Tooltip>

          <IconButton className={`${styles.iconButton} ${styles.mdDesktopOnly}`}>
            <VideoCallIcon />
          </IconButton>
          
          <IconButton className={`${styles.iconButton} ${styles.desktopOnly}`}>
            <Badge badgeContent={3} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          
          <UserButton
            appearance={{
              elements: {
                avatarBox: {
                  width: 32,
                  height: 32,
                },
              },
            }}
          />
        </Box>
      </Toolbar>

      {/* Mobile Search - Always visible on mobile */}
      <Box className={styles.mobileSearchSection}>
        <SearchBox onSearch={onSearch} onPlaylistSelect={onPlaylistSelect} initialValue={initialSearchValue} />
      </Box>
    </AppBar>
  );
}
