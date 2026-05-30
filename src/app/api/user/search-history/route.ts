import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { db, searchHistory } from "@/db";
import { eq, desc, and, sql } from "drizzle-orm";

// GET - Fetch user's search history (both full searches and single terms)
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
    const favouritesOnly = searchParams.get("favourites") === "true";
    const favouritesLimit = parseInt(searchParams.get("limit") || "20", 10);
    const getPageToken = searchParams.get("getPageToken"); // Get page token for a specific query today
    const allSingleTerms = searchParams.get("allSingleTerms") === "true"; // Return ALL unique single terms for drawer

    // If favouritesOnly, return only single terms (for the "my recent favourites" feature)
    if (favouritesOnly) {
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
        .limit(favouritesLimit * 3); // Fetch more to account for duplicates

      const seenSingle = new Set<string>();
      const favourites: string[] = [];
      for (const entry of singleTerms) {
        // Normalize: lowercase, trim, collapse whitespace, remove zero-width chars
        const normalized = entry.searchQuery
          .normalize('NFC')
          .toLowerCase()
          .trim()
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // Remove zero-width and non-breaking spaces
          .replace(/\s+/g, ' ');
        if (normalized && !seenSingle.has(normalized)) {
          seenSingle.add(normalized);
          favourites.push(entry.searchQuery.trim());
          if (favourites.length >= favouritesLimit) break;
        }
      }

      return NextResponse.json({ favourites });
    }

    // Return ALL unique single history terms (for the hamburger drawer)
    if (allSingleTerms) {
      const allTerms = await db
        .select()
        .from(searchHistory)
        .where(
          and(
            eq(searchHistory.clerkUserId, userId),
            eq(searchHistory.isSingle, true)
          )
        )
        .orderBy(desc(searchHistory.createdAt));

      const seen = new Set<string>();
      const terms: string[] = [];
      for (const entry of allTerms) {
        const normalized = entry.searchQuery
          .normalize('NFC')
          .toLowerCase()
          .trim()
          .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '')
          .replace(/\s+/g, ' ');
        if (normalized && !seen.has(normalized)) {
          seen.add(normalized);
          terms.push(entry.searchQuery.trim());
        }
      }

      return NextResponse.json({ terms });
    }

    // If getPageToken is provided, return the most recent pageToken for that term today
    if (getPageToken) {
      const startOfToday = new Date();
      startOfToday.setHours(0, 0, 0, 0);

      // Search in full searches where this term was used
      const todaySearches = await db
        .select()
        .from(searchHistory)
        .where(
          and(
            eq(searchHistory.clerkUserId, userId),
            eq(searchHistory.isSingle, false),
            sql`${searchHistory.createdAt} >= ${startOfToday}`
          )
        )
        .orderBy(desc(searchHistory.createdAt))
        .limit(10); // Get recent searches from today

      // Look for the pageToken for this specific term
      for (const search of todaySearches) {
        if (search.pageTokens && typeof search.pageTokens === 'object') {
          const tokens = search.pageTokens as Record<string, string>;
          const termLower = getPageToken.toLowerCase();
          
          // Check if this term exists in the pageTokens map (case-insensitive)
          for (const [savedTerm, token] of Object.entries(tokens)) {
            if (savedTerm.toLowerCase() === termLower && token) {
              return NextResponse.json({ 
                pageToken: token,
                found: true
              });
            }
          }
        }
      }

      return NextResponse.json({ 
        pageToken: null,
        found: false
      });
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

    // Get ALL single terms (isSingle=true) - all unique ever searched
    const singleTerms = await db
      .select()
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.clerkUserId, userId),
          eq(searchHistory.isSingle, true)
        )
      )
      .orderBy(desc(searchHistory.createdAt));

    const seenSingle = new Set<string>();
    const singleHistory: string[] = [];
    for (const entry of singleTerms) {
      // Normalize: lowercase, trim, collapse whitespace, remove zero-width chars
      const normalized = entry.searchQuery
        .normalize('NFC')
        .toLowerCase()
        .trim()
        .replace(/[\u200B-\u200D\uFEFF\u00A0]/g, '') // Remove zero-width and non-breaking spaces
        .replace(/\s+/g, ' ');
      if (normalized && !seenSingle.has(normalized)) {
        seenSingle.add(normalized);
        singleHistory.push(entry.searchQuery.trim());
      }
    }

    return NextResponse.json({ 
      fullHistory,    // Last 5 full searches (isSingle=false)
      singleHistory,  // All unique single terms ever searched (isSingle=true)
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
    const { searchQuery, searchTerms, resultsCount, pageTokens } = body;

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
        pageTokens: pageTokens || null,
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
