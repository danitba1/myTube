'use client';

import { Box, Container, Typography, Button, Paper, Stack } from '@mui/material';
import { PlayArrow as PlayArrowIcon, VideoLibrary as VideoLibraryIcon, Login as LoginIcon } from '@mui/icons-material';
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import styles from './page.module.css';

export default function Home() {
  return (
    <Box className={styles.pageContainer}>
      {/* Header with auth buttons */}
      <Box className={styles.headerAuth}>
        <SignedOut>
          <SignInButton mode="modal">
            <button className={styles.signInButton}>
              התחברות
            </button>
          </SignInButton>
          <SignUpButton mode="modal">
            <button className={styles.signUpButton}>
              הרשמה
            </button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <Link href="/dashboard">
            <button className={styles.dashboardButton}>
              לדשבורד
            </button>
          </Link>
          <UserButton />
        </SignedIn>
      </Box>

      {/* Main content */}
      <Box className={styles.mainContent}>
        <Container className={styles.contentContainer}>
          <Paper elevation={8} className={styles.heroCard}>
            <VideoLibraryIcon className={styles.heroIcon} />
            <Typography variant="h2" component="h1" className={styles.heroTitle}>
              MyTube
            </Typography>
            <Typography variant="h5" className={styles.heroSubtitle}>
              ברוכים הבאים לפלטפורמת הווידאו שלכם
            </Typography>
            <Typography variant="body1" className={styles.heroDescription}>
              כאן תוכלו לצפות, להעלות ולשתף סרטונים בקלות ובנוחות.
              התחילו עכשיו וגלו עולם של תוכן מרתק!
            </Typography>
            <Stack className={styles.ctaButtons}>
              <SignedOut>
                <SignInButton mode="modal">
                  <Button
                    variant="contained"
                    size="large"
                    startIcon={<LoginIcon />}
                    className={styles.ctaPrimary}
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
                  className={styles.ctaPrimary}
                >
                  התחל לצפות
                </Button>
              </SignedIn>
              <Button
                variant="outlined"
                size="large"
                className={styles.ctaSecondary}
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
