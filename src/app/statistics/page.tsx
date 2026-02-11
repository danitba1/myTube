"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Box, 
  Container, 
  Typography, 
  Card, 
  CardContent, 
  Grid,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Chip,
  Tabs,
  Tab,
  Paper,
  Button,
} from "@mui/material";
import {
  PlayArrow as PlayIcon,
  MusicNote as MusicIcon,
  Today as TodayIcon,
  History as HistoryIcon,
  ArrowBack as ArrowBackIcon,
  Home as HomeIcon,
} from "@mui/icons-material";
import Header from "@/components/Header";
import styles from "./page.module.css";

interface Statistics {
  totalPlays: number;
  uniqueVideos: number;
  todayPlays: number;
  firstPlayDate: string | null;
  lastPlayDate: string | null;
}

interface TopVideo {
  videoId: string;
  videoTitle: string | null;
  channelName: string | null;
  playCount: number;
  lastPlayedAt: string;
  firstPlayedAt: string;
}

interface RecentPlay {
  id: string;
  videoId: string;
  videoTitle: string | null;
  channelName: string | null;
  playedAt: string;
}

export default function StatisticsPage() {
  const router = useRouter();
  const [stats, setStats] = useState<Statistics | null>(null);
  const [topVideos, setTopVideos] = useState<TopVideo[]>([]);
  const [recentPlays, setRecentPlays] = useState<RecentPlay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);

  useEffect(() => {
    loadStatistics();
  }, []);

  const loadStatistics = async () => {
    setIsLoading(true);
    try {
      // Load overall stats
      const statsResponse = await fetch("/api/user/played-videos/stats?type=all");
      if (statsResponse.ok) {
        const data = await statsResponse.json();
        setStats(data.statistics);
      }

      // Load top videos
      const topResponse = await fetch("/api/user/played-videos/stats?type=top&limit=20");
      if (topResponse.ok) {
        const data = await topResponse.json();
        setTopVideos(data.videos || []);
      }

      // Load recent plays
      const recentResponse = await fetch("/api/user/played-videos/stats?type=recent&limit=50");
      if (recentResponse.ok) {
        const data = await recentResponse.json();
        setRecentPlays(data.plays || []);
      }
    } catch (error) {
      console.error("Failed to load statistics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleDateString("he-IL", { 
      year: "numeric", 
      month: "long", 
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const formatDateShort = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });
    } else if (diffDays === 1) {
      return "אתמול";
    } else if (diffDays < 7) {
      return `לפני ${diffDays} ימים`;
    } else {
      return date.toLocaleDateString("he-IL", { month: "short", day: "numeric" });
    }
  };

  if (isLoading) {
    return (
      <Box className={styles.pageContainer}>
        <Header />
        <Container maxWidth="lg" className={styles.mainContainer}>
          <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
            <CircularProgress />
          </Box>
        </Container>
      </Box>
    );
  }

  return (
    <Box className={styles.pageContainer}>
      <Header />
      
      <Container maxWidth="lg" className={styles.mainContainer}>
        <Box className={styles.headerSection}>
          <Button
            variant="outlined"
            startIcon={<HomeIcon />}
            onClick={() => router.push("/dashboard")}
            className={styles.backButton}
          >
            חזרה לדף הבית
          </Button>
          <Typography variant="h4" className={styles.pageTitle}>
            סטטיסטיקות השמעה
          </Typography>
        </Box>

        {/* Overview Cards */}
        <Grid container spacing={2} className={styles.statsGrid}>
          <Grid item xs={6} sm={3}>
            <Card className={styles.statCard}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <PlayIcon color="primary" />
                  <Typography variant="body2" color="text.secondary">
                    סך הכל השמעות
                  </Typography>
                </Box>
                <Typography variant="h4" className={styles.statNumber}>
                  {stats?.totalPlays || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card className={styles.statCard}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <MusicIcon color="secondary" />
                  <Typography variant="body2" color="text.secondary">
                    סרטונים ייחודיים
                  </Typography>
                </Box>
                <Typography variant="h4" className={styles.statNumber}>
                  {stats?.uniqueVideos || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card className={styles.statCard}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <TodayIcon color="success" />
                  <Typography variant="body2" color="text.secondary">
                    השמעות היום
                  </Typography>
                </Box>
                <Typography variant="h4" className={styles.statNumber}>
                  {stats?.todayPlays || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={6} sm={3}>
            <Card className={styles.statCard}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={1} mb={1}>
                  <HistoryIcon color="info" />
                  <Typography variant="body2" color="text.secondary">
                    ממוצע ליום
                  </Typography>
                </Box>
                <Typography variant="h4" className={styles.statNumber}>
                  {stats?.totalPlays && stats?.firstPlayDate
                    ? Math.round(
                        stats.totalPlays /
                          Math.max(
                            1,
                            Math.ceil(
                              (new Date().getTime() - new Date(stats.firstPlayDate).getTime()) /
                                (1000 * 60 * 60 * 24)
                            )
                          )
                      )
                    : 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Tabs for Top Videos and Recent Plays */}
        <Paper className={styles.tabsPaper}>
          <Tabs 
            value={activeTab} 
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="fullWidth"
          >
            <Tab label={`הכי מושמעים (${topVideos.length})`} />
            <Tab label={`היסטוריה (${recentPlays.length})`} />
          </Tabs>

          {/* Top Videos Tab */}
          {activeTab === 0 && (
            <Box className={styles.tabContent}>
              {topVideos.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" p={4}>
                  אין עדיין נתונים להצגה
                </Typography>
              ) : (
                <List>
                  {topVideos.map((video, index) => (
                    <ListItem 
                      key={video.videoId}
                      className={styles.videoItem}
                      component="a"
                      href={`https://www.youtube.com/watch?v=${video.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Box className={styles.rankBadge}>
                        {index + 1}
                      </Box>
                      <ListItemText
                        primary={video.videoTitle || video.videoId}
                        secondary={video.channelName || "Unknown Channel"}
                        className={styles.videoText}
                      />
                      <Box display="flex" gap={1} alignItems="center">
                        <Chip 
                          label={`${video.playCount} פעמים`}
                          size="small"
                          color="primary"
                          variant="outlined"
                        />
                        <Typography variant="caption" color="text.secondary">
                          {formatDateShort(video.lastPlayedAt)}
                        </Typography>
                      </Box>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}

          {/* Recent Plays Tab */}
          {activeTab === 1 && (
            <Box className={styles.tabContent}>
              {recentPlays.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" p={4}>
                  אין עדיין נתונים להצגה
                </Typography>
              ) : (
                <List>
                  {recentPlays.map((play) => (
                    <ListItem 
                      key={play.id}
                      className={styles.videoItem}
                      component="a"
                      href={`https://www.youtube.com/watch?v=${play.videoId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <PlayIcon className={styles.playIcon} />
                      <ListItemText
                        primary={play.videoTitle || play.videoId}
                        secondary={play.channelName || "Unknown Channel"}
                        className={styles.videoText}
                      />
                      <Typography variant="caption" color="text.secondary">
                        {formatDateShort(play.playedAt)}
                      </Typography>
                    </ListItem>
                  ))}
                </List>
              )}
            </Box>
          )}
        </Paper>
      </Container>
    </Box>
  );
}
