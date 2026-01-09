import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, searchHistory } from "@/db";
import { eq, desc, and, sql } from "drizzle-orm";

// GET - Fetch user's search history (both full searches and single terms)
export async function GET() {
  try {
    const { userId } = await auth();

    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get full searches (isSingle=false) - last 5 unique
    const fullSearches = await db
      .select()
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.clerkUserId, userId),
          eq(searchHistory.isSingle, false)
        )
      )
      .orderBy(desc(searchHistory.createdAt))
      .limit(30);

    const seenFull = new Set<string>();
    const fullHistory: string[] = [];
    for (const entry of fullSearches) {
      const query = entry.searchQuery.toLowerCase();
      if (!seenFull.has(query)) {
        seenFull.add(query);
        fullHistory.push(entry.searchQuery);
        if (fullHistory.length >= 5) break;
      }
    }

    // Get single terms (isSingle=true) - last 10 unique
    const singleTerms = await db
      .select()
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.clerkUserId, userId),
          eq(searchHistory.isSingle, true)
        )
      )
      .orderBy(desc(searchHistory.createdAt))
      .limit(50);

    const seenSingle = new Set<string>();
    const singleHistory: string[] = [];
    for (const entry of singleTerms) {
      const query = entry.searchQuery.toLowerCase();
      if (!seenSingle.has(query)) {
        seenSingle.add(query);
        singleHistory.push(entry.searchQuery);
        if (singleHistory.length >= 10) break;
      }
    }

    return NextResponse.json({ 
      fullHistory,    // Last 5 full searches (isSingle=false)
      singleHistory,  // Last 10 single terms (isSingle=true)
      // Keep legacy format for backwards compatibility
      history: fullHistory 
    });
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

    // 1. Save the full search query with isSingle=false
    const newEntry = await db
      .insert(searchHistory)
      .values({
        clerkUserId: userId,
        searchQuery,
        searchTerms: searchTerms || [],
        resultsCount: resultsCount || 0,
        isSingle: false,
      })
      .returning();

    // 2. If there are multiple terms, save each as a single entry (isSingle=true)
    const terms: string[] = searchTerms || [];
    if (terms.length > 1) {
      for (const term of terms) {
        const trimmedTerm = term.trim();
        if (!trimmedTerm) continue;

        // Check if this single term already exists for this user
        const existing = await db
          .select()
          .from(searchHistory)
          .where(
            and(
              eq(searchHistory.clerkUserId, userId),
              sql`LOWER(${searchHistory.searchQuery}) = LOWER(${trimmedTerm})`,
              eq(searchHistory.isSingle, true)
            )
          )
          .limit(1);

        if (existing.length > 0) {
          // Update the date of the existing entry
          await db
            .update(searchHistory)
            .set({ createdAt: new Date() })
            .where(eq(searchHistory.id, existing[0].id));
        } else {
          // Insert new single term entry
          await db
            .insert(searchHistory)
            .values({
              clerkUserId: userId,
              searchQuery: trimmedTerm,
              searchTerms: [trimmedTerm],
              resultsCount: 0,
              isSingle: true,
            });
        }
      }
    }

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
