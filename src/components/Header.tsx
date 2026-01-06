"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AppBar, Toolbar, Box, IconButton, Badge, Typography, Skeleton, Collapse } from "@mui/material";
import {
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  VideoLibrary as VideoLibraryIcon,
  Search as SearchIcon,
  Close as CloseIcon,
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  return (
    <AppBar position="sticky" elevation={0} className={styles.appBar}>
      <Toolbar className={styles.toolbar}>
        {/* Left Section - Logo */}
        <Box className={styles.logoSection}>
          <Box className={styles.logoWrapper}>
            <VideoLibraryIcon className={styles.logoIcon} />
            <Typography
              variant="h6"
              className={`${styles.logoText} ${mobileSearchOpen ? styles.logoTextHidden : ""}`}
            >
              MyTube
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search (Desktop) */}
        <Box className={styles.searchSection}>
          <SearchBox onSearch={onSearch} />
        </Box>

        {/* Right Section - Actions */}
        <Box className={styles.actionsSection}>
          {/* Mobile Search Toggle */}
          <IconButton
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className={styles.mobileSearchToggle}
          >
            {mobileSearchOpen ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
          
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

      {/* Mobile Search - Collapsible */}
      <Collapse in={mobileSearchOpen} className={styles.mobileSearchCollapse}>
        <Box className={styles.mobileSearchWrapper}>
          <SearchBox onSearch={(query) => {
            onSearch?.(query);
            setMobileSearchOpen(false);
          }} />
        </Box>
      </Collapse>
    </AppBar>
  );
}
