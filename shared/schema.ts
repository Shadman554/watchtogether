import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  code: text("code").notNull().unique(),
  hostId: text("host_id").notNull(),
  guestId: text("guest_id"),
  currentVideoId: text("current_video_id"),
  currentTime: integer("current_time").default(0),
  isPlaying: boolean("is_playing").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  roomCode: text("room_code").notNull(),
  userId: text("user_id").notNull(),
  username: text("username").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull().default("text"), // "text", "emoji", "system"
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertMessageSchema = createInsertSchema(messages).omit({
  id: true,
  createdAt: true,
});

export type InsertRoom = z.infer<typeof insertRoomSchema>;
export type Room = typeof rooms.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Message = typeof messages.$inferSelect;

// WebSocket message types
export interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp: number;
}

export interface SyncMessage {
  type: "sync";
  payload: {
    currentTime: number;
    isPlaying: boolean;
    videoId?: string;
  };
  timestamp: number;
}

export interface ChatMessage {
  type: "chat";
  payload: {
    id: number;
    userId: string;
    username: string;
    content: string;
    messageType: "text" | "emoji";
  };
  timestamp: number;
}

export interface UserJoinMessage {
  type: "user_join";
  payload: {
    userId: string;
    username: string;
    isHost: boolean;
  };
  timestamp: number;
}

export interface PlaybackControlMessage {
  type: "playback_control";
  payload: {
    action: "play" | "pause" | "seek" | "video_change";
    currentTime?: number;
    videoId?: string;
  };
  timestamp: number;
}
