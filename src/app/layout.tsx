import type { Metadata } from "next";
import "./globals.css";
import ThemeRegistry from "./ThemeRegistry";
import ClerkClientProvider from "@/components/ClerkClientProvider";
import ErrorSuppressor from "@/components/ErrorSuppressor";

export const metadata: Metadata = {
  title: "MyTube",
  description: "אפליקציית וידאו",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="he" dir="rtl" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Rubik:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body suppressHydrationWarning>
        <ErrorSuppressor />
        <ClerkClientProvider>
          <ThemeRegistry>{children}</ThemeRegistry>
        </ClerkClientProvider>
      </body>
    </html>
  );
}
