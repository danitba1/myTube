import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, playedVideos } from "@/db";
import { eq, and, gte, sql } from "drizzle-orm";

// GET - Fetch today's played video IDs
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get start of today (midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const played = await db
      .select()
      .from(playedVideos)
      .where(
        and(
          eq(playedVideos.clerkUserId, userId),
          gte(playedVideos.playedAt, startOfToday)
        )
      );

    // Return just the video IDs for easy filtering
    const videoIds = played.map((p) => p.videoId);

    return NextResponse.json({ 
      playedVideoIds: videoIds, 
      playedVideos: played,
      count: videoIds.length 
    });
  } catch (error) {
    console.error("Error fetching played videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch played videos" },
      { status: 500 }
    );
  }
}

// POST - Add video to played list
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { videoId, videoTitle, channelName } = body;

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    // Get start of today (midnight)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Check if already played today
    const existing = await db
      .select()
      .from(playedVideos)
      .where(
        and(
          eq(playedVideos.clerkUserId, userId),
          eq(playedVideos.videoId, videoId),
          gte(playedVideos.playedAt, startOfToday)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Video already marked as played today",
        alreadyPlayed: true
      });
    }

    // Add to played list
    const newEntry = await db
      .insert(playedVideos)
      .values({
        clerkUserId: userId,
        videoId,
        videoTitle: videoTitle || null,
        channelName: channelName || null,
      })
      .returning();

    return NextResponse.json({ 
      success: true, 
      entry: newEntry[0],
      alreadyPlayed: false 
    });
  } catch (error) {
    console.error("Error adding played video:", error);
    return NextResponse.json(
      { error: "Failed to add played video" },
      { status: 500 }
    );
  }
}

// DELETE - Clean up old played videos (optional maintenance endpoint)
// NOTE: With statistics feature, we keep historical data for analytics.
// Use this endpoint only if you need to manually clean up old data for storage reasons.
export async function DELETE(request: NextRequest) {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const daysToKeep = parseInt(searchParams.get("daysToKeep") || "7");

    // Calculate the cutoff date
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    // Delete old entries
    await db
      .delete(playedVideos)
      .where(
        and(
          eq(playedVideos.clerkUserId, userId),
          sql`${playedVideos.playedAt} < ${cutoffDate}`
        )
      );

    return NextResponse.json({ 
      success: true, 
      message: `Cleaned up played videos older than ${daysToKeep} days` 
    });
  } catch (error) {
    console.error("Error cleaning up played videos:", error);
    return NextResponse.json(
      { error: "Failed to clean up played videos" },
      { status: 500 }
    );
  }
}
