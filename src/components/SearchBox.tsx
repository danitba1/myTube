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
  Person as PersonIcon,
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
    fullHistory,
    singleHistory,
    isLoading: isHistoryLoading,
    addToHistory, 
    removeFromHistory, 
    clearHistory 
  } = useSearchHistory();

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      const trimmedQuery = query.trim();
      const terms = trimmedQuery.split(",").map(t => t.trim()).filter(t => t.length > 0);
      addToHistory(trimmedQuery, terms, undefined, true);
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

  // Handle clicking any history item - append to existing query
  const handleHistoryClick = (item: string) => {
    const currentTerms = query
      .split(",")
      .map((t) => t.trim().toLowerCase())
      .filter((t) => t.length > 0);

    // Check if this item (or its parts) are already in the query
    const itemTerms = item.split(",").map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);
    const allAlreadyIncluded = itemTerms.every((t) => currentTerms.includes(t));
    
    if (allAlreadyIncluded) {
      return; // Already in query
    }

    if (query.trim()) {
      setQuery(query.trim() + ", " + item);
    } else {
      setQuery(item);
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
      ) : (fullHistory.length > 0 || singleHistory.length > 0) && (
        <Box className={styles.historyContainer}>
          <Box className={styles.historyHeader}>
            <Box className={styles.historyTitleWrapper}>
              <HistoryIcon className={styles.historyIcon} />
              <Typography className={styles.historyTitle}>
                היסטוריית חיפושים
              </Typography>
            </Box>
            <button
              className={styles.clearAllButton}
              onClick={clearHistory}
            >
              נקה הכל
            </button>
          </Box>

          {/* Two columns: Full searches (right) and Single terms (left) */}
          <Box className={styles.historyColumns}>
            {/* Right side - Full searches */}
            {fullHistory.length > 0 && (
              <Box className={styles.historyColumn}>
                <Typography className={styles.columnTitle}>חיפושים מלאים</Typography>
                <Box className={styles.historyChips}>
                  {fullHistory.map((item, index) => (
                    <Chip
                      key={`full-${index}`}
                      label={item}
                      size="small"
                      onClick={() => handleHistoryClick(item)}
                      onDelete={() => removeFromHistory(item, false)}
                      deleteIcon={<CloseIcon className={styles.chipDeleteIcon} />}
                      className={styles.fullHistoryChip}
                      classes={{
                        label: styles.chipLabel,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}

            {/* Left side - Single terms */}
            {singleHistory.length > 0 && (
              <Box className={styles.historyColumn}>
                <Typography className={styles.columnTitle}>
                  <PersonIcon className={styles.columnIcon} />
                  זמרים/נושאים
                </Typography>
                <Box className={styles.historyChips}>
                  {singleHistory.map((item, index) => (
                    <Chip
                      key={`single-${index}`}
                      label={item}
                      size="small"
                      onClick={() => handleHistoryClick(item)}
                      onDelete={() => removeFromHistory(item, true)}
                      deleteIcon={<CloseIcon className={styles.chipDeleteIcon} />}
                      className={styles.singleHistoryChip}
                      classes={{
                        label: styles.chipLabel,
                      }}
                    />
                  ))}
                </Box>
              </Box>
            )}
          </Box>
        </Box>
      )}
    </Box>
  );
}
