import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, playedVideos } from "@/db";
import { eq, desc, sql } from "drizzle-orm";

// GET - Fetch play statistics
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const statsType = searchParams.get("type") || "all"; // all, top, recent
    const limit = parseInt(searchParams.get("limit") || "50");

    if (statsType === "top") {
      // Get most played videos
      const topPlayed = await db
        .select({
          videoId: playedVideos.videoId,
          videoTitle: playedVideos.videoTitle,
          channelName: playedVideos.channelName,
          playCount: sql<number>`count(*)::int`,
          lastPlayedAt: sql<Date>`max(${playedVideos.playedAt})`,
          firstPlayedAt: sql<Date>`min(${playedVideos.playedAt})`,
        })
        .from(playedVideos)
        .where(eq(playedVideos.clerkUserId, userId))
        .groupBy(playedVideos.videoId, playedVideos.videoTitle, playedVideos.channelName)
        .orderBy(desc(sql`count(*)`))
        .limit(limit);

      return NextResponse.json({ 
        type: "top",
        videos: topPlayed,
        count: topPlayed.length
      });
    }

    if (statsType === "recent") {
      // Get recent play history
      const recentPlays = await db
        .select()
        .from(playedVideos)
        .where(eq(playedVideos.clerkUserId, userId))
        .orderBy(desc(playedVideos.playedAt))
        .limit(limit);

      return NextResponse.json({ 
        type: "recent",
        plays: recentPlays,
        count: recentPlays.length
      });
    }

    // Get overall statistics
    const totalPlays = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(playedVideos)
      .where(eq(playedVideos.clerkUserId, userId));

    const uniqueVideos = await db
      .select({
        count: sql<number>`count(distinct ${playedVideos.videoId})::int`,
      })
      .from(playedVideos)
      .where(eq(playedVideos.clerkUserId, userId));

    const firstPlay = await db
      .select({
        playedAt: playedVideos.playedAt,
      })
      .from(playedVideos)
      .where(eq(playedVideos.clerkUserId, userId))
      .orderBy(playedVideos.playedAt)
      .limit(1);

    const lastPlay = await db
      .select({
        playedAt: playedVideos.playedAt,
      })
      .from(playedVideos)
      .where(eq(playedVideos.clerkUserId, userId))
      .orderBy(desc(playedVideos.playedAt))
      .limit(1);

    // Get today's plays
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const todayPlays = await db
      .select({
        count: sql<number>`count(*)::int`,
      })
      .from(playedVideos)
      .where(eq(playedVideos.clerkUserId, userId))
      .where(sql`${playedVideos.playedAt} >= ${startOfToday}`);

    return NextResponse.json({ 
      type: "all",
      statistics: {
        totalPlays: totalPlays[0]?.count || 0,
        uniqueVideos: uniqueVideos[0]?.count || 0,
        todayPlays: todayPlays[0]?.count || 0,
        firstPlayDate: firstPlay[0]?.playedAt || null,
        lastPlayDate: lastPlay[0]?.playedAt || null,
      }
    });
  } catch (error) {
    console.error("Error fetching play statistics:", error);
    return NextResponse.json(
      { error: "Failed to fetch play statistics" },
      { status: 500 }
    );
  }
}
