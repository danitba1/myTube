import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, skippedVideos } from "@/db";
import { eq, and } from "drizzle-orm";

// GET - Fetch user's skipped video IDs
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const skipped = await db
      .select()
      .from(skippedVideos)
      .where(eq(skippedVideos.clerkUserId, userId));

    // Return just the video IDs for easy filtering
    const videoIds = skipped.map((s) => s.videoId);

    return NextResponse.json({ skippedVideoIds: videoIds, skippedVideos: skipped });
  } catch (error) {
    console.error("Error fetching skipped videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch skipped videos" },
      { status: 500 }
    );
  }
}

// POST - Add video to skip list
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

    // Check if already skipped
    const existing = await db
      .select()
      .from(skippedVideos)
      .where(
        and(
          eq(skippedVideos.clerkUserId, userId),
          eq(skippedVideos.videoId, videoId)
        )
      )
      .limit(1);

    if (existing.length > 0) {
      return NextResponse.json({ 
        success: true, 
        message: "Video already in skip list" 
      });
    }

    // Add to skip list
    const newEntry = await db
      .insert(skippedVideos)
      .values({
        clerkUserId: userId,
        videoId,
        videoTitle: videoTitle || null,
        channelName: channelName || null,
      })
      .returning();

    return NextResponse.json({ success: true, entry: newEntry[0] });
  } catch (error) {
    console.error("Error adding skipped video:", error);
    return NextResponse.json(
      { error: "Failed to add skipped video" },
      { status: 500 }
    );
  }
}

// DELETE - Remove video from skip list
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
    const videoId = searchParams.get("videoId");

    if (!videoId) {
      return NextResponse.json(
        { error: "Video ID is required" },
        { status: 400 }
      );
    }

    await db
      .delete(skippedVideos)
      .where(
        and(
          eq(skippedVideos.clerkUserId, userId),
          eq(skippedVideos.videoId, videoId)
        )
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing skipped video:", error);
    return NextResponse.json(
      { error: "Failed to remove skipped video" },
      { status: 500 }
    );
  }
}

