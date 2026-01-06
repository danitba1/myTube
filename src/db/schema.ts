import { pgTable, text, timestamp, uuid, jsonb, integer, boolean } from "drizzle-orm/pg-core";

// User preferences table
export const userPreferences = pgTable("user_preferences", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull().unique(),
  theme: text("theme").default("light"),
  language: text("language").default("he"),
  autoplay: boolean("autoplay").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Search history table
export const searchHistory = pgTable("search_history", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  searchQuery: text("search_query").notNull(),
  searchTerms: jsonb("search_terms").$type<string[]>().default([]),
  resultsCount: integer("results_count").default(0),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Skipped videos table - videos user wants to always skip
export const skippedVideos = pgTable("skipped_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title"),
  channelName: text("channel_name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Types for TypeScript
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;

export type SkippedVideo = typeof skippedVideos.$inferSelect;
export type NewSkippedVideo = typeof skippedVideos.$inferInsert;

