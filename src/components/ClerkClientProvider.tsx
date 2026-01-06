"use client";

import { ClerkProvider } from "@clerk/nextjs";
import { heIL } from "@clerk/localizations";
import { ReactNode } from "react";

export default function ClerkClientProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <ClerkProvider
      localization={heIL}
      signInFallbackRedirectUrl="/dashboard"
      signUpFallbackRedirectUrl="/dashboard"
    >
      {children}
    </ClerkProvider>
  );
}

