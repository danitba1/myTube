"use client";

import { SignUp } from "@clerk/nextjs";
import { Box } from "@mui/material";

export default function SignUpPage() {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)",
      }}
    >
      <SignUp
        appearance={{
          elements: {
            rootBox: {
              boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
              borderRadius: "16px",
            },
            card: {
              borderRadius: "16px",
            },
          },
        }}
      />
    </Box>
  );
}

