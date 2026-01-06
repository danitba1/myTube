"use client";

import { useEffect } from "react";

export default function ErrorSuppressor() {
  useEffect(() => {
    // Suppress specific warnings/errors in development
    const originalError = console.error;
    const originalWarn = console.warn;
    
    const suppressedMessages = [
      "Can't perform a React state update on a component that hasn't mounted yet",
      "Cannot read properties of undefined (reading 'push')",
      "A tree hydrated but some attributes",
      "Hydration failed because",
    ];

    const shouldSuppress = (message: string) => {
      return suppressedMessages.some(msg => message.includes(msg));
    };

    console.error = (...args) => {
      const message = args[0]?.toString() || "";
      if (shouldSuppress(message)) return;
      originalError.apply(console, args);
    };

    console.warn = (...args) => {
      const message = args[0]?.toString() || "";
      if (shouldSuppress(message)) return;
      originalWarn.apply(console, args);
    };

    // Also suppress unhandled errors
    const handleError = (event: ErrorEvent) => {
      if (shouldSuppress(event.message)) {
        event.preventDefault();
        return true;
      }
    };

    window.addEventListener("error", handleError);

    return () => {
      console.error = originalError;
      console.warn = originalWarn;
      window.removeEventListener("error", handleError);
    };
  }, []);

  return null;
}


