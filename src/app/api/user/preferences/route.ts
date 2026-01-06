import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, userPreferences } from "@/db";
import { eq } from "drizzle-orm";

// GET - Fetch user preferences
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const preferences = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.clerkUserId, userId))
      .limit(1);

    if (preferences.length === 0) {
      // Return default preferences if none exist
      return NextResponse.json({
        preferences: {
          theme: "light",
          language: "he",
          autoplay: true,
        },
      });
    }

    return NextResponse.json({ preferences: preferences[0] });
  } catch (error) {
    console.error("Error fetching preferences:", error);
    return NextResponse.json(
      { error: "Failed to fetch preferences" },
      { status: 500 }
    );
  }
}

// POST/PUT - Save or update user preferences
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
    const { theme, language, autoplay } = body;

    // Check if preferences exist
    const existing = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.clerkUserId, userId))
      .limit(1);

    let result;

    if (existing.length > 0) {
      // Update existing preferences
      result = await db
        .update(userPreferences)
        .set({
          theme: theme ?? existing[0].theme,
          language: language ?? existing[0].language,
          autoplay: autoplay ?? existing[0].autoplay,
          updatedAt: new Date(),
        })
        .where(eq(userPreferences.clerkUserId, userId))
        .returning();
    } else {
      // Create new preferences
      result = await db
        .insert(userPreferences)
        .values({
          clerkUserId: userId,
          theme: theme || "light",
          language: language || "he",
          autoplay: autoplay ?? true,
        })
        .returning();
    }

    return NextResponse.json({ success: true, preferences: result[0] });
  } catch (error) {
    console.error("Error saving preferences:", error);
    return NextResponse.json(
      { error: "Failed to save preferences" },
      { status: 500 }
    );
  }
}

