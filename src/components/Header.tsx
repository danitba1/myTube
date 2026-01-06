"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { AppBar, Toolbar, Box, IconButton, Badge, Typography, Skeleton, Collapse } from "@mui/material";
import {
  Menu as MenuIcon,
  VideoCall as VideoCallIcon,
  Notifications as NotificationsIcon,
  VideoLibrary as VideoLibraryIcon,
  Search as SearchIcon,
  Close as CloseIcon,
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
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

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
      <Toolbar 
        sx={{ 
          gap: { xs: 1, sm: 2 }, 
          justifyContent: "space-between",
          minHeight: { xs: 56, sm: 64 },
          px: { xs: 1, sm: 2 },
        }}
      >
        {/* Left Section - Logo */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <VideoLibraryIcon sx={{ color: "error.main", fontSize: { xs: 28, sm: 32 } }} />
            <Typography
              variant="h6"
              sx={{
                fontWeight: 700,
                color: "text.primary",
                letterSpacing: "-0.5px",
                fontSize: { xs: "1rem", sm: "1.25rem" },
                display: { xs: mobileSearchOpen ? "none" : "block", sm: "block" },
              }}
            >
              MyTube
            </Typography>
          </Box>
        </Box>

        {/* Center Section - Search (Desktop) */}
        <Box
          sx={{
            flex: 1,
            display: { xs: "none", sm: "flex" },
            justifyContent: "center",
            maxWidth: 700,
            mx: 2,
          }}
        >
          <SearchBox onSearch={onSearch} />
        </Box>

        {/* Right Section - Actions */}
        <Box sx={{ display: "flex", alignItems: "center", gap: { xs: 0.5, sm: 1 }, flexShrink: 0 }}>
          {/* Mobile Search Toggle */}
          <IconButton
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            sx={{ display: { xs: "flex", sm: "none" } }}
          >
            {mobileSearchOpen ? <CloseIcon /> : <SearchIcon />}
          </IconButton>
          <IconButton
            sx={{
              display: { xs: "none", md: "flex" },
            }}
          >
            <VideoCallIcon />
          </IconButton>
          <IconButton sx={{ display: { xs: "none", sm: "flex" } }}>
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
      <Collapse in={mobileSearchOpen} sx={{ display: { xs: "block", sm: "none" } }}>
        <Box sx={{ px: 2, pb: 2 }}>
          <SearchBox onSearch={(query) => {
            onSearch?.(query);
            setMobileSearchOpen(false);
          }} />
        </Box>
      </Collapse>
    </AppBar>
  );
}

