import type { InferSelectModel } from "drizzle-orm";
import { pgTable, text, timestamp, uuid, varchar, boolean, index } from "drizzle-orm/pg-core";

// Users table (shared with a2m.ai production DB)
export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  clerk_user_id: varchar("clerk_user_id", { length: 255 }).unique(),
  password: varchar("password", { length: 64 }),
  beta_access_code: varchar("beta_access_code", { length: 64 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof users>;

// Voice31 Notes
export const voice31_notes = pgTable("voice31_notes", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 500 }).notNull().default("Untitled"),
  content: text("content").notNull().default(""),
  tags: text("tags"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  user_idx: index("voice31_notes_user_id_idx").on(table.user_id),
  updated_idx: index("voice31_notes_updated_at_idx").on(table.updated_at),
}));

export type Voice31Note = InferSelectModel<typeof voice31_notes>;

// Voice31 Memories
export const voice31_memories = pgTable("voice31_memories", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  content: text("content").notNull(),
  category: varchar("category", { length: 30 }).notNull().default("fact"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  user_idx: index("voice31_memories_user_id_idx").on(table.user_id),
  category_idx: index("voice31_memories_category_idx").on(table.category),
}));

export type Voice31Memory = InferSelectModel<typeof voice31_memories>;

// Voice31 Sessions
export const voice31_sessions = pgTable("voice31_sessions", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  title: varchar("title", { length: 500 }).notNull().default("Untitled Session"),
  metadata: text("metadata"),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  user_idx: index("voice31_sessions_user_id_idx").on(table.user_id),
  created_idx: index("voice31_sessions_created_at_idx").on(table.created_at),
}));

export type Voice31Session = InferSelectModel<typeof voice31_sessions>;

// Voice31 Code Generations
export const voice31_code_generations = pgTable("voice31_code_generations", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  session_id: uuid("session_id")
    .references(() => voice31_sessions.id),
  name: varchar("name", { length: 300 }).notNull().default("Untitled"),
  prompt: text("prompt"),
  code: text("code").notNull(),
  language: varchar("language", { length: 10 }).notNull().default("tsx"),
  thumbnail_url: text("thumbnail_url"),
  created_at: timestamp("created_at").notNull().defaultNow(),
}, (table) => ({
  user_idx: index("voice31_code_gen_user_id_idx").on(table.user_id),
  session_idx: index("voice31_code_gen_session_id_idx").on(table.session_id),
  created_idx: index("voice31_code_gen_created_at_idx").on(table.created_at),
}));

export type Voice31CodeGeneration = InferSelectModel<typeof voice31_code_generations>;

// Voice31 Artifacts
export const voice31_artifacts = pgTable("voice31_artifacts", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  user_id: uuid("user_id")
    .notNull()
    .references(() => users.id),
  type: varchar("type", { length: 50 }).notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  preview: text("preview"),
  content: text("content").notNull(),
  tags: text("tags").notNull().default('[]'),
  source: varchar("source", { length: 50 }).notNull().default('voice31'),
  pinned: boolean("pinned").notNull().default(false),
  created_at: timestamp("created_at").notNull().defaultNow(),
  updated_at: timestamp("updated_at").notNull().defaultNow(),
}, (table) => ({
  user_idx: index("voice31_artifacts_user_id_idx").on(table.user_id),
  type_idx: index("voice31_artifacts_type_idx").on(table.type),
  created_idx: index("voice31_artifacts_created_at_idx").on(table.created_at),
  pinned_idx: index("voice31_artifacts_pinned_idx").on(table.pinned),
}));

export type Voice31Artifact = InferSelectModel<typeof voice31_artifacts>;
