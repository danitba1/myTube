"use client";

import dynamic from "next/dynamic";
import { AppBar, Toolbar, Box, IconButton, Badge, Typography, Skeleton } from "@mui/material";
import {
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  VideoLibrary as VideoLibraryIcon,
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
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  return (
    <AppBar position="sticky" elevation={0} className={styles.appBar}>
      <Toolbar className={styles.toolbar}>
        {/* Left Section - Logo */}
        <Box className={styles.logoSection}>
          <Box className={styles.logoWrapper}>
            <VideoLibraryIcon className={styles.logoIcon} />
            <Typography variant="h6" className={styles.logoText}>
              MyTube
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search (Desktop) */}
        <Box className={styles.searchSectionDesktop}>
          <SearchBox onSearch={onSearch} />
        </Box>

        {/* Right Section - Actions */}
        <Box className={styles.actionsSection}>
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
        <SearchBox onSearch={onSearch} />
      </Box>
    </AppBar>
  );
}
