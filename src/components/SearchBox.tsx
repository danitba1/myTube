"use client";

import { useState } from "react";
import {
  Paper,
  IconButton,
  Box,
  Chip,
  Stack,
  Typography,
  CircularProgress,
} from "@mui/material";
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useSearchHistory } from "@/hooks/useSearchHistory";

interface SearchBoxProps {
  onSearch?: (query: string) => void;
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const { 
    searchHistory, 
    isLoading: isHistoryLoading,
    addToHistory, 
    removeFromHistory, 
    clearHistory 
  } = useSearchHistory();

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      const trimmedQuery = query.trim();
      // Update local UI state only - dashboard will save to DB with results count
      addToHistory(trimmedQuery, undefined, undefined, true);
      onSearch(trimmedQuery);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = () => {
    setQuery("");
  };

  const handleHistoryClick = (historyItem: string) => {
    // Get current terms in the search box
    const currentTerms = query
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    // Check if this item is already in the query (case-insensitive)
    if (currentTerms.includes(historyItem.toLowerCase())) {
      return; // Don't add duplicates
    }

    // Concatenate to existing query with comma separator
    if (query.trim()) {
      setQuery(query.trim() + ", " + historyItem);
    } else {
      setQuery(historyItem);
    }
    // Don't auto-search - let user click multiple items then search
  };

  return (
    <Box sx={{ width: "100%", maxWidth: { xs: "100%", sm: 600 } }}>
      <Paper
        elevation={0}
        sx={{
          display: "flex",
          alignItems: "center",
          borderRadius: { xs: "20px", sm: "24px" },
          border: "1px solid",
          borderColor: "divider",
          bgcolor: "background.paper",
          overflow: "hidden",
          transition: "all 0.2s ease",
          "&:focus-within": {
            borderColor: "primary.main",
            boxShadow: "0 0 0 1px rgba(25, 118, 210, 0.2)",
          },
        }}
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="חפש סרטונים..."
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            background: "transparent",
            padding: "10px 12px",
            fontSize: "0.9rem",
            fontFamily: "inherit",
            direction: "rtl",
            minWidth: 0,
          }}
        />
        {query && (
          <IconButton
            size="small"
            onClick={handleClear}
            sx={{ mr: 0.5, p: { xs: 0.5, sm: 1 } }}
          >
            <ClearIcon sx={{ fontSize: { xs: 18, sm: 20 } }} />
          </IconButton>
        )}
        <IconButton
          onClick={handleSearch}
          sx={{
            bgcolor: "grey.100",
            borderRadius: 0,
            px: { xs: 1.5, sm: 2 },
            py: { xs: 1, sm: 1.25 },
            borderRight: "1px solid",
            borderColor: "divider",
            "&:hover": {
              bgcolor: "grey.200",
            },
          }}
        >
          <SearchIcon sx={{ fontSize: { xs: 20, sm: 24 } }} />
        </IconButton>
      </Paper>

      {/* Search History */}
      {isHistoryLoading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 1.5 }}>
          <CircularProgress size={18} />
        </Box>
      ) : searchHistory.length > 0 && (
        <Box sx={{ mt: 1, px: { xs: 0.5, sm: 1 } }}>
          <Box 
            sx={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              mb: 0.75,
            }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
              <HistoryIcon sx={{ fontSize: { xs: 14, sm: 16 }, color: "text.secondary" }} />
              <Typography variant="caption" color="text.secondary" sx={{ fontSize: { xs: "0.7rem", sm: "0.75rem" } }}>
                חיפושים אחרונים
              </Typography>
            </Box>
            <Typography
              variant="caption"
              color="primary"
              sx={{ 
                cursor: "pointer",
                fontSize: { xs: "0.7rem", sm: "0.75rem" },
                "&:hover": { textDecoration: "underline" },
              }}
              onClick={clearHistory}
            >
              נקה הכל
            </Typography>
          </Box>
          <Stack 
            direction="row" 
            spacing={0.5} 
            flexWrap="wrap" 
            useFlexGap
            sx={{ gap: { xs: 0.5, sm: 0.75 } }}
          >
            {searchHistory.map((item, index) => (
              <Chip
                key={index}
                label={item}
                size="small"
                onClick={() => handleHistoryClick(item)}
                onDelete={() => removeFromHistory(item)}
                deleteIcon={<CloseIcon sx={{ fontSize: { xs: "12px !important", sm: "14px !important" } }} />}
                sx={{
                  bgcolor: "grey.100",
                  border: "1px solid",
                  borderColor: "grey.200",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                  height: { xs: 24, sm: 28 },
                  "&:hover": {
                    bgcolor: "grey.200",
                    borderColor: "primary.main",
                  },
                  "& .MuiChip-label": {
                    px: { xs: 0.75, sm: 1 },
                    fontSize: { xs: "0.7rem", sm: "0.8rem" },
                  },
                  "& .MuiChip-deleteIcon": {
                    color: "grey.500",
                    "&:hover": {
                      color: "error.main",
                    },
                  },
                }}
              />
            ))}
          </Stack>
        </Box>
      )}
    </Box>
  );
}
