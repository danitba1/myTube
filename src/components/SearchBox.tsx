"use client";

import { useState } from "react";
import {
  Paper,
  IconButton,
  Box,
  Chip,
  Typography,
  CircularProgress,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  History as HistoryIcon,
  Close as CloseIcon,
} from "@mui/icons-material";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import styles from "./SearchBox.module.css";

interface SearchBoxProps {
  onSearch?: (query: string, preferNew?: boolean) => void;
}

export default function SearchBox({ onSearch }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const [preferNew, setPreferNew] = useState(false);
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
      addToHistory(trimmedQuery, undefined, undefined, true);
      onSearch(trimmedQuery, preferNew);
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
    const currentTerms = query
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    if (currentTerms.includes(historyItem.toLowerCase())) {
      return;
    }

    if (query.trim()) {
      setQuery(query.trim() + ", " + historyItem);
    } else {
      setQuery(historyItem);
    }
  };

  return (
    <Box className={styles.container}>
      <Paper elevation={0} className={styles.searchWrapper}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="חפש סרטונים..."
          className={styles.searchInput}
        />
        {query && (
          <IconButton
            size="small"
            onClick={handleClear}
            className={styles.clearButton}
          >
            <ClearIcon className={styles.clearIcon} />
          </IconButton>
        )}
        <IconButton onClick={handleSearch} className={styles.searchButton}>
          <SearchIcon className={styles.searchIcon} />
        </IconButton>
      </Paper>

      {/* Prefer New Checkbox */}
      <FormControlLabel
        control={
          <Checkbox
            checked={preferNew}
            onChange={(e) => setPreferNew(e.target.checked)}
            size="small"
            className={styles.preferNewCheckbox}
          />
        }
        label="העדפה לסרטונים חדשים"
        className={styles.preferNewLabel}
      />

      {/* Search History */}
      {isHistoryLoading ? (
        <Box className={styles.historyLoading}>
          <CircularProgress size={18} />
        </Box>
      ) : searchHistory.length > 0 && (
        <Box className={styles.historyContainer}>
          <Box className={styles.historyHeader}>
            <Box className={styles.historyTitleWrapper}>
              <HistoryIcon className={styles.historyIcon} />
              <Typography className={styles.historyTitle}>
                חיפושים אחרונים
              </Typography>
            </Box>
            <button
              className={styles.clearAllButton}
              onClick={clearHistory}
            >
              נקה הכל
            </button>
          </Box>
          <Box className={styles.historyChips}>
            {searchHistory.map((item, index) => (
              <Chip
                key={index}
                label={item}
                size="small"
                onClick={() => handleHistoryClick(item)}
                onDelete={() => removeFromHistory(item)}
                deleteIcon={<CloseIcon className={styles.chipDeleteIcon} />}
                className={styles.historyChip}
                classes={{
                  label: styles.chipLabel,
                }}
              />
            ))}
          </Box>
        </Box>
      )}
    </Box>
  );
}
