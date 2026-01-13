import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, playlists, playlistVideos } from "@/db";
import { eq, and, max } from "drizzle-orm";

// GET - Fetch videos in a playlist
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
    const playlistId = searchParams.get("playlistId");

    if (!playlistId) {
      return NextResponse.json(
        { error: "Playlist ID is required" },
        { status: 400 }
      );
    }

    // Verify user owns the playlist
    const playlist = await db
      .select()
      .from(playlists)
      .where(and(
        eq(playlists.id, playlistId),
        eq(playlists.clerkUserId, userId)
      ))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    const videos = await db
      .select()
      .from(playlistVideos)
      .where(eq(playlistVideos.playlistId, playlistId))
      .orderBy(playlistVideos.position);

    return NextResponse.json({ videos });
  } catch (error) {
    console.error("Error fetching playlist videos:", error);
    return NextResponse.json(
      { error: "Failed to fetch playlist videos" },
      { status: 500 }
    );
  }
}

// POST - Add video to playlist
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
    const { playlistId, videoId, videoTitle, channelName, channelId, thumbnailUrl, duration } = body;

    if (!playlistId || !videoId || !videoTitle) {
      return NextResponse.json(
        { error: "Playlist ID, video ID, and video title are required" },
        { status: 400 }
      );
    }

    // Verify user owns the playlist
    const playlist = await db
      .select()
      .from(playlists)
      .where(and(
        eq(playlists.id, playlistId),
        eq(playlists.clerkUserId, userId)
      ))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Check if video already exists in playlist
    const existingVideo = await db
      .select()
      .from(playlistVideos)
      .where(and(
        eq(playlistVideos.playlistId, playlistId),
        eq(playlistVideos.videoId, videoId)
      ))
      .limit(1);

    if (existingVideo.length > 0) {
      return NextResponse.json(
        { error: "Video already in playlist" },
        { status: 409 }
      );
    }

    // Get the next position
    const maxPosition = await db
      .select({ maxPos: max(playlistVideos.position) })
      .from(playlistVideos)
      .where(eq(playlistVideos.playlistId, playlistId));

    const nextPosition = (maxPosition[0]?.maxPos || 0) + 1;

    // Add video to playlist
    const newVideo = await db
      .insert(playlistVideos)
      .values({
        playlistId,
        videoId,
        videoTitle,
        channelName: channelName || null,
        channelId: channelId || null,
        thumbnailUrl: thumbnailUrl || null,
        duration: duration || null,
        position: nextPosition,
      })
      .returning();

    // Update playlist's updatedAt
    await db
      .update(playlists)
      .set({ updatedAt: new Date() })
      .where(eq(playlists.id, playlistId));

    return NextResponse.json({ success: true, video: newVideo[0] });
  } catch (error) {
    console.error("Error adding video to playlist:", error);
    return NextResponse.json(
      { error: "Failed to add video to playlist" },
      { status: 500 }
    );
  }
}

// DELETE - Remove video from playlist
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
    const playlistId = searchParams.get("playlistId");
    const videoId = searchParams.get("videoId");

    if (!playlistId || !videoId) {
      return NextResponse.json(
        { error: "Playlist ID and video ID are required" },
        { status: 400 }
      );
    }

    // Verify user owns the playlist
    const playlist = await db
      .select()
      .from(playlists)
      .where(and(
        eq(playlists.id, playlistId),
        eq(playlists.clerkUserId, userId)
      ))
      .limit(1);

    if (playlist.length === 0) {
      return NextResponse.json(
        { error: "Playlist not found" },
        { status: 404 }
      );
    }

    // Remove video from playlist
    await db
      .delete(playlistVideos)
      .where(and(
        eq(playlistVideos.playlistId, playlistId),
        eq(playlistVideos.videoId, videoId)
      ));

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing video from playlist:", error);
    return NextResponse.json(
      { error: "Failed to remove video from playlist" },
      { status: 500 }
    );
  }
}

