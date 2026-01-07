import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, searchHistory } from "@/db";
import { eq, desc, and } from "drizzle-orm";

// GET - Fetch user's last 15 search history entries
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get last 15 unique search queries (most recent first)
    const history = await db
      .select()
      .from(searchHistory)
      .where(eq(searchHistory.clerkUserId, userId))
      .orderBy(desc(searchHistory.createdAt))
      .limit(50); // Fetch more to ensure we get 15 unique ones

    // Extract unique search queries (most recent first), limit to 15
    const seen = new Set<string>();
    const uniqueQueries: string[] = [];
    
    for (const entry of history) {
      const query = entry.searchQuery.toLowerCase();
      if (!seen.has(query)) {
        seen.add(query);
        uniqueQueries.push(entry.searchQuery);
        if (uniqueQueries.length >= 15) break;
      }
    }

    return NextResponse.json({ history: uniqueQueries });
  } catch (error) {
    console.error("Error fetching search history:", error);
    return NextResponse.json(
      { error: "Failed to fetch search history" },
      { status: 500 }
    );
  }
}

// POST - Save every search to history with timestamp
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
    const { searchQuery, searchTerms, resultsCount } = body;

    if (!searchQuery) {
      return NextResponse.json(
        { error: "Search query is required" },
        { status: 400 }
      );
    }

    // Always save every search with timestamp (no deduplication)
    const newEntry = await db
      .insert(searchHistory)
      .values({
        clerkUserId: userId,
        searchQuery,
        searchTerms: searchTerms || [],
        resultsCount: resultsCount || 0,
      })
      .returning();

    return NextResponse.json({ success: true, entry: newEntry[0] });
  } catch (error) {
    console.error("Error saving search history:", error);
    return NextResponse.json(
      { error: "Failed to save search history" },
      { status: 500 }
    );
  }
}

// DELETE - Clear search history or remove specific entry
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
    const queryToDelete = searchParams.get("query");

    if (queryToDelete) {
      // Delete all entries with this query for this user
      await db
        .delete(searchHistory)
        .where(
          and(
            eq(searchHistory.clerkUserId, userId),
            eq(searchHistory.searchQuery, queryToDelete)
          )
        );
    } else {
      // Clear all history for user
      await db
        .delete(searchHistory)
        .where(eq(searchHistory.clerkUserId, userId));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting search history:", error);
    return NextResponse.json(
      { error: "Failed to delete search history" },
      { status: 500 }
    );
  }
}
