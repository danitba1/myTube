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
          p: { xs: 1.5, sm: 2 },
          gap: { xs: 1, sm: 2 },
        }}
      >
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="outlined"
              size="small"
              sx={{
                color: 'white',
                borderColor: 'rgba(255,255,255,0.5)',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
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
              size="small"
              sx={{
                bgcolor: 'white',
                color: 'primary.main',
                fontSize: { xs: '0.8rem', sm: '0.875rem' },
                px: { xs: 1.5, sm: 2 },
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
            size="small"
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              fontSize: { xs: '0.8rem', sm: '0.875rem' },
              px: { xs: 1.5, sm: 2 },
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
          px: { xs: 2, sm: 3 },
          py: { xs: 2, sm: 4 },
        }}
      >
        <Container maxWidth="md" sx={{ px: { xs: 0, sm: 2 } }}>
          <Paper
            elevation={8}
            sx={{
              p: { xs: 3, sm: 4, md: 6 },
              textAlign: 'center',
              borderRadius: { xs: 2, sm: 4 },
            }}
          >
            <VideoLibraryIcon
              sx={{
                fontSize: { xs: 48, sm: 64, md: 80 },
                color: 'primary.main',
                mb: { xs: 1, sm: 2 },
              }}
            />
            <Typography
              variant="h2"
              component="h1"
              gutterBottom
              sx={{
                fontWeight: 700,
                color: 'primary.main',
                fontSize: { xs: '2rem', sm: '2.75rem', md: '3.75rem' },
              }}
            >
              MyTube
            </Typography>
            <Typography
              variant="h5"
              color="text.secondary"
              sx={{ 
                mb: { xs: 2, sm: 4 },
                fontSize: { xs: '1rem', sm: '1.25rem', md: '1.5rem' },
              }}
            >
              ברוכים הבאים לפלטפורמת הווידאו שלכם
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ 
                mb: { xs: 3, sm: 4 }, 
                maxWidth: 500, 
                mx: 'auto',
                fontSize: { xs: '0.875rem', sm: '1rem' },
                px: { xs: 1, sm: 0 },
              }}
            >
              כאן תוכלו לצפות, להעלות ולשתף סרטונים בקלות ובנוחות.
              התחילו עכשיו וגלו עולם של תוכן מרתק!
            </Typography>
            <Stack
              direction={{ xs: 'column', sm: 'row' }}
              spacing={{ xs: 1.5, sm: 2 }}
              justifyContent="center"
            >
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon />}
                    sx={{
                      px: { xs: 3, sm: 4 },
                      py: { xs: 1, sm: 1.5 },
                      fontSize: { xs: '0.9rem', sm: '1.1rem' },
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
                    px: { xs: 3, sm: 4 },
                    py: { xs: 1, sm: 1.5 },
                    fontSize: { xs: '0.9rem', sm: '1.1rem' },
                  }}
                >
                  התחל לצפות
                </Button>
              </SignedIn>
              <Button
                variant="outlined"
                size="large"
                sx={{
                  px: { xs: 3, sm: 4 },
                  py: { xs: 1, sm: 1.5 },
                  fontSize: { xs: '0.9rem', sm: '1.1rem' },
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
