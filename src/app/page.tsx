'use client';

import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import { PlayArrow as PlayArrowIcon, VideoLibrary as VideoLibraryIcon, Login as LoginIcon } from '@mui/icons-material';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';

export default function Home() {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      }}
    >
      {/* Header with auth buttons */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          alignItems: 'center',
          p: 2,
          gap: 2,
        }}
      >
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="outlined"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                '&:hover': {
                  borderColor: 'white',
                  bgcolor: 'rgba(255,255,255,0.1)',
                },
              }}
            >
              התחברות
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button
              variant="contained"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                '&:hover': {
                  bgcolor: 'rgba(255,255,255,0.9)',
                },
              }}
            >
              הרשמה
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Button
            component={Link}
            href="/dashboard"
            variant="contained"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255,255,255,0.9)',
              },
            }}
          >
            לדשבורד
          </Button>
          <UserButton />
        </SignedIn>
      </Box>

      {/* Main content */}
      <Box
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Container maxWidth="md">
          <Paper
            elevation={8}
            sx={{
              p: 6,
              textAlign: 'center',
              borderRadius: 4,
            }}
          >
            <VideoLibraryIcon
              sx={{
                fontSize: 80,
                color: 'primary.main',
                mb: 2,
              }}
            />
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'primary.main',
              }}
            >
              MyTube
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ mb: 4 }}
            >
              ברוכים הבאים לפלטפורמת הווידאו שלכם
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ mb: 4, maxWidth: 500, mx: 'auto' }}
            >
              כאן תוכלו לצפות, להעלות ולשתף סרטונים בקלות ובנוחות.
              התחילו עכשיו וגלו עולם של תוכן מרתק!
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={2}
              justifyContent="center"
            >
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon />}
                    sx={{
                      px: 4,
                      py: 1.5,
                      fontSize: '1.1rem',
                    }}
                  >
                    התחבר כדי להתחיל
                  </Button>
                </SignInButton>
              </SignedOut>
              <SignedIn>
                <Button
                  component={Link}
                  href="/dashboard"
                  variant="contained"
                  size="large"
                  startIcon={<PlayArrowIcon />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    fontSize: '1.1rem',
                  }}
                >
                  התחל לצפות
                </Button>
              </SignedIn>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: 4,
                  py: 1.5,
                  fontSize: '1.1rem',
                }}
              >
                למידע נוסף
              </Button>
            </Stack>
          </Paper>
        </Container>
      </Box>
    </Box>
  );
}
