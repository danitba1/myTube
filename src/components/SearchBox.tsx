"use client";

import { useState, useEffect, useRef } from "react";
import {
  Paper,
  IconButton,
  Box,
  Chip,
  CircularProgress,
  Checkbox,
  FormControlLabel,
  Button,
} from "@mui/material";
import { 
  Search as SearchIcon, 
  Clear as ClearIcon,
  Close as CloseIcon,
  Favorite as FavoriteIcon,
  Add as AddIcon,
} from "@mui/icons-material";
import { useSearchHistory } from "@/hooks/useSearchHistory";
import styles from "./SearchBox.module.css";

interface Playlist {
  id: string;
  name: string;
}

interface SearchBoxProps {
  onSearch?: (query: string, preferNew?: boolean, isFavourites?: boolean, avoidDuplicates?: boolean) => void;
  onPlaylistSelect?: (playlistId: string) => void;
  initialValue?: string;
}

export default function SearchBox({ onSearch, onPlaylistSelect, initialValue }: SearchBoxProps) {
  const [query, setQuery] = useState("");
  const hasSetInitialValue = useRef(false);

  // Set initial value only once on mount
  useEffect(() => {
    if (initialValue && !hasSetInitialValue.current) {
      setQuery(initialValue);
      hasSetInitialValue.current = true;
    }
  }, [initialValue]);
  const [preferNew, setPreferNew] = useState(true);
  const [avoidDuplicates, setAvoidDuplicates] = useState(true);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [isLoadingPlaylists, setIsLoadingPlaylists] = useState(true);
  const [isLoadingFavourites, setIsLoadingFavourites] = useState(false);
  const [showMoreFullHistory, setShowMoreFullHistory] = useState(false);
  const { 
    fullHistory,
    singleHistory,
    isLoading: isHistoryLoading,
    addToHistory, 
    removeFromHistory, 
    clearHistory 
  } = useSearchHistory();

  // Handle "My Recent Favourites" button click
  const handleRecentFavourites = async () => {
    setIsLoadingFavourites(true);
    try {
      const response = await fetch("/api/user/search-history?favourites=true&limit=20");
      if (response.ok) {
        const data = await response.json();
        const favourites: string[] = data.favourites || [];
        if (favourites.length > 0) {
          // Remove duplicates (case-insensitive) before sending to search
          const seen = new Set<string>();
          const uniqueFavourites = favourites.filter((term) => {
            const lowerTerm = term.toLowerCase().trim();
            if (seen.has(lowerTerm)) {
              return false;
            }
            seen.add(lowerTerm);
            return true;
          });
          
          const combinedQuery = uniqueFavourites.join(", ");
          setQuery(combinedQuery);
          // Also trigger the search immediately with isFavourites=true to bypass 10-term limit
          if (onSearch) {
            onSearch(combinedQuery, preferNew, true, avoidDuplicates);
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch recent favourites:", error);
    } finally {
      setIsLoadingFavourites(false);
    }
  };

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
      } finally {
        setIsLoadingPlaylists(false);
      }
    };
    fetchPlaylists();
  }, []);

  const handleSearch = () => {
    if (onSearch && query.trim()) {
      const trimmedQuery = query.trim();
      const terms = trimmedQuery.split(",").map(t => t.trim()).filter(t => t.length > 0);
      addToHistory(trimmedQuery, terms, undefined, true);
      onSearch(trimmedQuery, preferNew, false, avoidDuplicates);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleClear = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
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
            aria-label="נקה חיפוש"
            type="button"
          >
            <ClearIcon className={styles.clearIcon} />
          </IconButton>
        )}
        <IconButton onClick={handleSearch} className={styles.searchButton}>
          <SearchIcon className={styles.searchIcon} />
        </IconButton>
      </Paper>

      {/* Prefer New Checkbox + Avoid Duplicates Checkbox + Favourites Button - same row */}
      <Box className={styles.checkboxRow}>
        <Box className={styles.checkboxesGroup}>
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
          <FormControlLabel
            control={
              <Checkbox
                checked={avoidDuplicates}
                onChange={(e) => setAvoidDuplicates(e.target.checked)}
                size="small"
                className={styles.preferNewCheckbox}
              />
            }
            label="הימנע מכפילויות"
            className={styles.preferNewLabel}
          />
        </Box>
        <Button
          variant="contained"
          startIcon={isLoadingFavourites ? <CircularProgress size={12} color="inherit" /> : <FavoriteIcon className={styles.favouritesIcon} />}
          onClick={handleRecentFavourites}
          disabled={isLoadingFavourites}
          className={styles.favouritesButton}
        >
          המועדפים שלי
        </Button>
      </Box>

      {/* All chips combined - Playlists, Full History, Single Terms */}
      {isHistoryLoading ? (
        <Box className={styles.historyLoading}>
          <CircularProgress size={18} />
        </Box>
      ) : (playlists.length > 0 || fullHistory.length > 0 || singleHistory.length > 0) && (
        <Box className={styles.allChipsContainer}>
          {/* Clear all button */}
          {(fullHistory.length > 0 || singleHistory.length > 0) && (
            <button
              className={styles.clearAllButton}
              onClick={clearHistory}
            >
              נקה הכל
            </button>
          )}
          
          <Box className={styles.allChips}>
            {/* Playlists (green) */}
            {!isLoadingPlaylists && playlists.map((playlist) => (
              <Chip
                key={`playlist-${playlist.id}`}
                label={playlist.name}
                size="small"
                onClick={() => onPlaylistSelect?.(playlist.id)}
                className={styles.playlistChip}
                classes={{
                  label: styles.chipLabel,
                }}
              />
            ))}
            
            {/* Full searches (blue) - show first 2 */}
            {fullHistory.slice(0, 2).map((item, index) => (
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
            
            {/* Expand button for full history */}
            {fullHistory.length > 2 && !showMoreFullHistory && (
              <Chip
                label={<AddIcon className={styles.expandIcon} />}
                size="small"
                onClick={() => setShowMoreFullHistory(true)}
                className={styles.expandChip}
              />
            )}
            
            {/* More full searches when expanded */}
            {showMoreFullHistory && fullHistory.slice(2).map((item, index) => (
              <Chip
                key={`full-more-${index}`}
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
            
            {/* Collapse button */}
            {showMoreFullHistory && fullHistory.length > 2 && (
              <Chip
                label="הסתר"
                size="small"
                onClick={() => setShowMoreFullHistory(false)}
                className={styles.collapseChip}
              />
            )}
            
            {/* Single terms (pink/purple) - deduplicated */}
            {(() => {
              const seen = new Set<string>();
              return singleHistory.filter((item) => {
                // Normalize: lowercase, trim, remove zero-width chars, collapse whitespace
                const normalized = item
                  .normalize('NFC')
                  .toLowerCase()
                  .trim()
                  .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // Remove zero-width and non-breaking spaces
                  .replace(/\s+/g, ' ');
                if (!normalized || seen.has(normalized)) return false;
                seen.add(normalized);
                return true;
              }).map((item, index) => (
                <Chip
                  key={`single-${index}`}
                  label={item.trim()}
                  size="small"
                  onClick={() => handleHistoryClick(item)}
                  onDelete={() => removeFromHistory(item, true)}
                  deleteIcon={<CloseIcon className={styles.chipDeleteIcon} />}
                  className={styles.singleHistoryChip}
                  classes={{
                    label: styles.chipLabel,
                  }}
                />
              ));
            })()}
          </Box>
        </Box>
      )}
    </Box>
  );
}
