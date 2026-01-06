"use client";

import dynamic from "next/dynamic";
import { AppBar, Toolbar, Box, IconButton, Avatar, Badge, Typography, Skeleton } from "@mui/material";
import {
  Menu as MenuIcon,
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  VideoLibrary as VideoLibraryIcon,
} from "@mui/icons-material";
import { UserButton } from "@clerk/nextjs";

// Dynamically import SearchBox with SSR disabled to prevent hydration issues
const SearchBox = dynamic(() => import("./SearchBox"), {
  ssr: false,
  loading: () => (
    <Skeleton 
      variant="rounded" 
      width="100%" 
      height={44} 
      sx={{ maxWidth: 600, borderRadius: "24px" }} 
    />
  ),
});

interface HeaderProps {
  onSearch?: (query: string) => void;
}

export default function Header({ onSearch }: HeaderProps) {
  return (
    <AppBar
      position="sticky"
      elevation={0}
      sx={{
        bgcolor: "background.paper",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ gap: 2, justifyContent: "space-between" }}>
        {/* Left Section - Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton edge="start" sx={{ display: { xs: "flex", md: "none" } }}>
            <MenuIcon />
          </IconButton>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <VideoLibraryIcon sx={{ color: "error.main", fontSize: 32 }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.5px",
              }}
            >
              MyTube
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search */}
        <Box
          sx={{
            flex: 1,
            display: "flex",
            justifyContent: "center",
            maxWidth: 700,
          }}
        >
          <SearchBox onSearch={onSearch} />
        </Box>

        {/* Right Section - Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton
            sx={{
              display: { xs: "none", sm: "flex" },
            }}
          >
            <VideoCallIcon />
          </IconButton>
          <IconButton>
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
    </AppBar>
  );
}

