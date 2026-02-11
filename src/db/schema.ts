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
  isSingle: boolean("is_single").default(false).notNull(), // true = single term from comma-separated list
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

// Playlists table
export const playlists = pgTable("playlists", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Playlist videos table - videos in playlists
export const playlistVideos = pgTable("playlist_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  playlistId: uuid("playlist_id").notNull().references(() => playlists.id, { onDelete: "cascade" }),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title").notNull(),
  channelName: text("channel_name"),
  channelId: text("channel_id"),
  thumbnailUrl: text("thumbnail_url"),
  duration: text("duration"),
  position: integer("position").default(0), // Order in playlist
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Played videos table - track videos played by date to avoid repeats on same day
export const playedVideos = pgTable("played_videos", {
  id: uuid("id").defaultRandom().primaryKey(),
  clerkUserId: text("clerk_user_id").notNull(),
  videoId: text("video_id").notNull(),
  videoTitle: text("video_title"),
  channelName: text("channel_name"),
  playedAt: timestamp("played_at").defaultNow().notNull(),
});

// Types for TypeScript
export type UserPreferences = typeof userPreferences.$inferSelect;
export type NewUserPreferences = typeof userPreferences.$inferInsert;

export type SearchHistory = typeof searchHistory.$inferSelect;
export type NewSearchHistory = typeof searchHistory.$inferInsert;

export type SkippedVideo = typeof skippedVideos.$inferSelect;
export type NewSkippedVideo = typeof skippedVideos.$inferInsert;

export type Playlist = typeof playlists.$inferSelect;
export type NewPlaylist = typeof playlists.$inferInsert;

export type PlaylistVideo = typeof playlistVideos.$inferSelect;
export type NewPlaylistVideo = typeof playlistVideos.$inferInsert;

export type PlayedVideo = typeof playedVideos.$inferSelect;
export type NewPlayedVideo = typeof playedVideos.$inferInsert;
