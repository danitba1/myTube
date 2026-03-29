import { NextRequest, NextResponse } from "next/server";

const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";

export interface YouTubeSearchResult {
  id: string;
  title: string;
  description: string;
  thumbnailUrl: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
}

// Helper function to fetch with retry logic
async function fetchWithRetry(
  url: string,
  maxRetries = 3,
  timeoutMs = 10000
): Promise<Response> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(url, {
        signal: controller.signal,
        // Add keepalive header to help with connection stability
        headers: {
          'Connection': 'keep-alive',
        },
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      const isLastAttempt = attempt === maxRetries;
      const isRetryableError = 
        error.code === 'ECONNRESET' || 
        error.code === 'ETIMEDOUT' ||
        error.name === 'AbortError' ||
        error.message?.includes('fetch failed');

      if (isLastAttempt || !isRetryableError) {
        throw error;
      }

      // Exponential backoff: wait 1s, 2s, 4s between retries
      const delayMs = Math.pow(2, attempt) * 1000;
      console.log(`Fetch attempt ${attempt + 1} failed, retrying in ${delayMs}ms...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  throw new Error('Fetch failed after retries');
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const maxResults = searchParams.get("maxResults") || "20";
  const preferNew = searchParams.get("preferNew") === "true"; // Filter to last 3 years
  const pageToken = searchParams.get("pageToken"); // For pagination

  if (!query) {
    return NextResponse.json(
      { error: "Search query is required" },
      { status: 400 }
    );
  }

  if (!YOUTUBE_API_KEY) {
    return NextResponse.json(
      { error: "YouTube API key is not configured" },
      { status: 500 }
    );
  }

  try {
    // Search for videos
    const searchUrl = new URL(`${YOUTUBE_API_BASE}/search`);
    searchUrl.searchParams.set("part", "snippet");
    searchUrl.searchParams.set("q", query);
    searchUrl.searchParams.set("type", "video");
    searchUrl.searchParams.set("maxResults", maxResults);
    searchUrl.searchParams.set("key", YOUTUBE_API_KEY);
    
    // Filter for embeddable videos only (prevents error 101/150: video not embeddable)
    searchUrl.searchParams.set("videoEmbeddable", "true");
    
    // Filter for videos that can be syndicated (helps avoid region restrictions)
    searchUrl.searchParams.set("videoSyndicated", "true");
    
    // Add pageToken if provided (for pagination)
    if (pageToken) {
      searchUrl.searchParams.set("pageToken", pageToken);
    }
    
    // If preferNew is true, filter to videos from the last 3 years (keeps relevance sorting)
    if (preferNew) {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      // Format as RFC 3339 (YouTube API requirement): YYYY-MM-DDTHH:MM:SSZ
      const isoDate = threeYearsAgo.toISOString().split('.')[0] + 'Z';
      searchUrl.searchParams.set("publishedAfter", isoDate);
    }

    console.log("YouTube API URL:", searchUrl.toString().replace(YOUTUBE_API_KEY, "API_KEY_HIDDEN"));
    
    const searchResponse = await fetchWithRetry(searchUrl.toString());
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error("YouTube API error:", JSON.stringify(errorData, null, 2));
      return NextResponse.json(
        { error: errorData?.error?.message || "Failed to fetch from YouTube API" },
        { status: searchResponse.status }
      );
    }

    const searchData = await searchResponse.json();

    // Get video IDs for statistics
    const videoIds = searchData.items
      .map((item: any) => item.id.videoId)
      .join(",");

    // Fetch video statistics
    const statsUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    statsUrl.searchParams.set("part", "statistics,contentDetails");
    statsUrl.searchParams.set("id", videoIds);
    statsUrl.searchParams.set("key", YOUTUBE_API_KEY);

    const statsResponse = await fetchWithRetry(statsUrl.toString());
    const statsData = await statsResponse.json();

    // Create a map of video stats
    const statsMap = new Map();
    statsData.items?.forEach((item: any) => {
      statsMap.set(item.id, {
        viewCount: item.statistics?.viewCount || "0",
        likeCount: item.statistics?.likeCount || "0",
        duration: item.contentDetails?.duration || "",
      });
    });

    // Map results to our format
    const videos: YouTubeSearchResult[] = searchData.items.map((item: any) => {
      const stats = statsMap.get(item.id.videoId) || {};
      return {
        id: item.id.videoId,
        title: item.snippet.title,
        description: item.snippet.description,
        thumbnailUrl:
          item.snippet.thumbnails.high?.url ||
          item.snippet.thumbnails.medium?.url ||
          item.snippet.thumbnails.default?.url,
        channelName: item.snippet.channelTitle,
        channelId: item.snippet.channelId,
        publishedAt: item.snippet.publishedAt,
        viewCount: stats.viewCount,
        likeCount: stats.likeCount,
        duration: stats.duration,
      };
    });

    return NextResponse.json({ 
      videos,
      nextPageToken: searchData.nextPageToken || null 
    });
  } catch (error: any) {
    console.error("YouTube search error:", error);
    
    // Provide more specific error messages
    let errorMessage = "Internal server error";
    if (error.code === 'ECONNRESET') {
      errorMessage = "Connection to YouTube API was reset. Please try again.";
    } else if (error.code === 'ETIMEDOUT' || error.name === 'AbortError') {
      errorMessage = "Request to YouTube API timed out. Please try again.";
    } else if (error.message?.includes('fetch failed')) {
      errorMessage = "Failed to connect to YouTube API. Please check your network connection.";
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}

