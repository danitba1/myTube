"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import createCache, { EmotionCache } from "@emotion/cache";
import { CacheProvider } from "@emotion/react";
import rtlPlugin from "stylis-plugin-rtl";
import { prefixer } from "stylis";

// Create RTL theme
const theme = createTheme({
  direction: "rtl",
  typography: {
    fontFamily: "Rubik, Arial, sans-serif",
  },
  palette: {
    primary: {
      main: "#1976d2",
    },
    secondary: {
      main: "#dc004e",
    },
  },
});

function createEmotionCache(): EmotionCache {
  return createCache({
    key: "muirtl",
    prepend: true,
    stylisPlugins: [prefixer, rtlPlugin],
  });
}

export default function ThemeRegistry({
  children,
}: {
  children: React.ReactNode;
}) {
  const [cache, setCache] = useState<EmotionCache | null>(null);

  useEffect(() => {
    setCache(createEmotionCache());
  }, []);

  // Show nothing until cache is ready (prevents SSR/hydration issues)
  if (!cache) {
    return (
      <div style={{ visibility: "hidden" }}>
        {children}
      </div>
    );
  }

  return (
    <CacheProvider value={cache}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </CacheProvider>
  );
}

