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

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const query = searchParams.get("q");
  const maxResults = searchParams.get("maxResults") || "20";
  const preferNew = searchParams.get("preferNew") === "true"; // Filter to last 3 years

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
    
    // If preferNew is true, filter to videos from the last 3 years (keeps relevance sorting)
    if (preferNew) {
      const threeYearsAgo = new Date();
      threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);
      searchUrl.searchParams.set("publishedAfter", threeYearsAgo.toISOString());
    }

    const searchResponse = await fetch(searchUrl.toString());
    
    if (!searchResponse.ok) {
      const errorData = await searchResponse.json();
      console.error("YouTube API error:", errorData);
      return NextResponse.json(
        { error: "Failed to fetch from YouTube API" },
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

    const statsResponse = await fetch(statsUrl.toString());
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

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("YouTube search error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

