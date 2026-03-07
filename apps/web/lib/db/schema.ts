/**
 * Speech.fm Database Schema
 *
 * Tables needed for voice31 + elevenlabs features:
 * - users (core identity)
 * - subscriptions (credits system)
 * - credit_transactions (credit ledger)
 * - usage_logs (analytics)
 * - visual_personalities (voice agent dependency)
 * - voice_agents (elevenlabs agent records)
 * - voice_sessions (conversation sessions)
 * - voice31_notes (user notes)
 * - voice31_memories (user memories)
 * - voice31_sessions (session metadata)
 * - voice31_code_generations (generated code)
 * - voice31_artifacts (auto-saved artifacts)
 */

import type { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  integer,
  decimal,
  boolean,
  index,
  real,
} from "drizzle-orm/pg-core";

// =============================================================================
// CORE
// =============================================================================

export const users = pgTable("users", {
  id: uuid("id").primaryKey().notNull().defaultRandom(),
  email: varchar("email", { length: 64 }).notNull(),
  clerk_user_id: varchar("clerk_user_id", { length: 255 }).unique(),
  password: varchar("password", { length: 64 }),
  beta_access_code: varchar("beta_access_code", { length: 64 }),
  created_at: timestamp("created_at").notNull().defaultNow(),
});

export type User = InferSelectModel<typeof users>;

// =============================================================================
// SUBSCRIPTIONS & CREDITS
// =============================================================================

export const subscriptions = pgTable(
  "subscriptions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id)
      .unique(),
    stripe_customer_id: varchar("stripe_customer_id", { length: 255 }),
    stripe_subscription_id: varchar("stripe_subscription_id", { length: 255 }),
    stripe_price_id: varchar("stripe_price_id", { length: 255 }),
    tier: varchar("tier", { length: 20 }).notNull().default("free"),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    billing_cycle: varchar("billing_cycle", { length: 20 }).default("monthly"),
    current_period_start: timestamp("current_period_start"),
    current_period_end: timestamp("current_period_end"),
    cancel_at_period_end: boolean("cancel_at_period_end").default(false),
    credits_balance: integer("credits_balance").notNull().default(0),
    credits_monthly_allocation: integer("credits_monthly_allocation")
      .notNull()
      .default(10),
    credits_rollover_limit: integer("credits_rollover_limit")
      .notNull()
      .default(0),
    image_generations_per_month: integer("image_generations_per_month").default(10),
    video_generations_per_month: integer("video_generations_per_month").default(0),
    audio_generations_per_month: integer("audio_generations_per_month").default(100),
    current_image_generations: integer("current_image_generations").default(0),
    current_video_generations: integer("current_video_generations").default(0),
    current_audio_generations: integer("current_audio_generations").default(0),
    usage_reset_at: timestamp("usage_reset_at"),
    trial_end: timestamp("trial_end"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("subscriptions_user_id_idx").on(table.user_id),
    stripe_customer_idx: index("subscriptions_stripe_customer_id_idx").on(table.stripe_customer_id),
  })
);

export type Subscription = InferSelectModel<typeof subscriptions>;

export const credit_transactions = pgTable(
  "credit_transactions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    subscription_id: uuid("subscription_id").references(() => subscriptions.id),
    amount: integer("amount").notNull(),
    balance_after: integer("balance_after").notNull(),
    type: varchar("type", { length: 30 }).notNull(),
    usage_type: varchar("usage_type", { length: 30 }),
    usage_metadata: text("usage_metadata"),
    actual_cost_usd: decimal("actual_cost_usd", { precision: 10, scale: 6 }),
    reference_id: varchar("reference_id", { length: 255 }),
    description: text("description"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("credit_transactions_user_id_idx").on(table.user_id),
    created_idx: index("credit_transactions_created_at_idx").on(table.created_at),
    type_idx: index("credit_transactions_type_idx").on(table.type),
  })
);

export type CreditTransaction = InferSelectModel<typeof credit_transactions>;

export const usage_logs = pgTable(
  "usage_logs",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    resource_type: varchar("resource_type", { length: 30 }).notNull(),
    resource_id: varchar("resource_id", { length: 255 }),
    model: varchar("model", { length: 100 }),
    provider: varchar("provider", { length: 50 }),
    input_tokens: integer("input_tokens").default(0),
    output_tokens: integer("output_tokens").default(0),
    cached_tokens: integer("cached_tokens").default(0),
    duration_ms: integer("duration_ms"),
    credits_used: integer("credits_used").notNull().default(0),
    actual_cost_usd: decimal("actual_cost_usd", { precision: 10, scale: 6 }),
    metadata: text("metadata"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("usage_logs_user_id_idx").on(table.user_id),
    created_idx: index("usage_logs_created_at_idx").on(table.created_at),
    resource_idx: index("usage_logs_resource_type_idx").on(table.resource_type),
  })
);

export type UsageLog = InferSelectModel<typeof usage_logs>;

// =============================================================================
// VOICE ASSISTANT SYSTEM
// =============================================================================

export const visual_personalities = pgTable(
  "visual_personalities",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id").references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    traits: text("traits").notNull(),
    visual_config: text("visual_config").notNull(),
    behaviors: text("behaviors").notNull(),
    llm_config: text("llm_config"),
    is_public: boolean("is_public").default(false),
    is_default: boolean("is_default").default(false),
    usage_count: integer("usage_count").default(0),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("visual_personalities_user_id_idx").on(table.user_id),
    name_idx: index("visual_personalities_name_idx").on(table.name),
    public_idx: index("visual_personalities_is_public_idx").on(table.is_public),
    default_idx: index("visual_personalities_is_default_idx").on(table.is_default),
  })
);

export type VisualPersonality = InferSelectModel<typeof visual_personalities>;

export const voice_agents = pgTable(
  "voice_agents",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: varchar("name", { length: 255 }).notNull(),
    description: text("description"),
    avatar_url: text("avatar_url"),
    voice_provider: varchar("voice_provider", { length: 50 }).notNull().default("elevenlabs"),
    voice_id: varchar("voice_id", { length: 255 }),
    voice_config: text("voice_config"),
    hume_config_id: varchar("hume_config_id", { length: 255 }),
    hume_api_key_encrypted: text("hume_api_key_encrypted"),
    personality_preset: varchar("personality_preset", { length: 50 }).default("energetic"),
    visual_personality_id: uuid("visual_personality_id").references(() => visual_personalities.id),
    personality_traits: text("personality_traits"),
    display_mode: varchar("display_mode", { length: 20 }).default("semantic"),
    display_config: text("display_config"),
    system_instructions: text("system_instructions"),
    tools_enabled: text("tools_enabled"),
    welcome_message: text("welcome_message"),
    idle_prompts: text("idle_prompts"),
    max_session_duration_ms: integer("max_session_duration_ms").default(1800000),
    max_messages_per_session: integer("max_messages_per_session").default(100),
    is_public: boolean("is_public").default(false),
    is_active: boolean("is_active").default(true),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice_agents_user_id_idx").on(table.user_id),
    provider_idx: index("voice_agents_voice_provider_idx").on(table.voice_provider),
    personality_idx: index("voice_agents_visual_personality_id_idx").on(table.visual_personality_id),
    public_idx: index("voice_agents_is_public_idx").on(table.is_public),
  })
);

export type VoiceAgent = InferSelectModel<typeof voice_agents>;

export const voice_sessions = pgTable(
  "voice_sessions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    agent_id: uuid("agent_id")
      .notNull()
      .references(() => voice_agents.id, { onDelete: "cascade" }),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    session_name: varchar("session_name", { length: 255 }),
    session_context: text("session_context"),
    hume_session_id: varchar("hume_session_id", { length: 255 }),
    message_count: integer("message_count").default(0),
    user_message_count: integer("user_message_count").default(0),
    agent_message_count: integer("agent_message_count").default(0),
    total_duration_ms: integer("total_duration_ms").default(0),
    voice_duration_ms: integer("voice_duration_ms").default(0),
    dominant_user_emotion: varchar("dominant_user_emotion", { length: 50 }),
    dominant_agent_emotion: varchar("dominant_agent_emotion", { length: 50 }),
    emotional_journey: text("emotional_journey"),
    summary: text("summary"),
    key_topics: text("key_topics"),
    action_items: text("action_items"),
    status: varchar("status", { length: 20 }).default("active"),
    end_reason: varchar("end_reason", { length: 50 }),
    started_at: timestamp("started_at").notNull().defaultNow(),
    last_activity_at: timestamp("last_activity_at").notNull().defaultNow(),
    ended_at: timestamp("ended_at"),
  },
  (table) => ({
    agent_idx: index("voice_sessions_agent_id_idx").on(table.agent_id),
    user_idx: index("voice_sessions_user_id_idx").on(table.user_id),
    status_idx: index("voice_sessions_status_idx").on(table.status),
    hume_idx: index("voice_sessions_hume_session_id_idx").on(table.hume_session_id),
    started_idx: index("voice_sessions_started_at_idx").on(table.started_at),
  })
);

export type VoiceSession = InferSelectModel<typeof voice_sessions>;

// =============================================================================
// VOICE31 FEATURES
// =============================================================================

export const voice31_notes = pgTable(
  "voice31_notes",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 500 }).notNull().default("Untitled"),
    content: text("content").notNull().default(""),
    tags: text("tags"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice31_notes_user_id_idx").on(table.user_id),
    updated_idx: index("voice31_notes_updated_at_idx").on(table.updated_at),
  })
);

export type Voice31Note = InferSelectModel<typeof voice31_notes>;

export const voice31_memories = pgTable(
  "voice31_memories",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    content: text("content").notNull(),
    category: varchar("category", { length: 30 }).notNull().default("fact"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice31_memories_user_id_idx").on(table.user_id),
    category_idx: index("voice31_memories_category_idx").on(table.category),
  })
);

export type Voice31Memory = InferSelectModel<typeof voice31_memories>;

export const voice31_sessions = pgTable(
  "voice31_sessions",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    title: varchar("title", { length: 500 }).notNull().default("Untitled Session"),
    metadata: text("metadata"),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice31_sessions_user_id_idx").on(table.user_id),
    created_idx: index("voice31_sessions_created_at_idx").on(table.created_at),
  })
);

export type Voice31Session = InferSelectModel<typeof voice31_sessions>;

export const voice31_code_generations = pgTable(
  "voice31_code_generations",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    session_id: uuid("session_id").references(() => voice31_sessions.id),
    name: varchar("name", { length: 300 }).notNull().default("Untitled"),
    prompt: text("prompt"),
    code: text("code").notNull(),
    language: varchar("language", { length: 10 }).notNull().default("tsx"),
    thumbnail_url: text("thumbnail_url"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice31_code_gen_user_id_idx").on(table.user_id),
    session_idx: index("voice31_code_gen_session_id_idx").on(table.session_id),
    created_idx: index("voice31_code_gen_created_at_idx").on(table.created_at),
  })
);

export type Voice31CodeGeneration = InferSelectModel<typeof voice31_code_generations>;

export const voice31_artifacts = pgTable(
  "voice31_artifacts",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    type: varchar("type", { length: 50 }).notNull(),
    title: varchar("title", { length: 500 }).notNull(),
    preview: text("preview"),
    content: text("content").notNull(),
    tags: text("tags").notNull().default("[]"),
    source: varchar("source", { length: 50 }).notNull().default("voice31"),
    pinned: boolean("pinned").notNull().default(false),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice31_artifacts_user_id_idx").on(table.user_id),
    type_idx: index("voice31_artifacts_type_idx").on(table.type),
    created_idx: index("voice31_artifacts_created_at_idx").on(table.created_at),
    pinned_idx: index("voice31_artifacts_pinned_idx").on(table.pinned),
  })
);

export type Voice31Artifact = InferSelectModel<typeof voice31_artifacts>;

// =============================================================================
// VOICE31 UPLOADS (persistent file uploads)
// =============================================================================

export const voice31_uploads = pgTable(
  "voice31_uploads",
  {
    id: uuid("id").primaryKey().notNull().defaultRandom(),
    user_id: uuid("user_id")
      .notNull()
      .references(() => users.id),
    filename: varchar("filename", { length: 500 }).notNull(),
    blob_url: text("blob_url").notNull(),
    file_type: varchar("file_type", { length: 20 }).notNull(),
    mime_type: varchar("mime_type", { length: 100 }).notNull(),
    analysis: text("analysis"),
    content_type: varchar("content_type", { length: 50 }),
    keywords: text("keywords").notNull().default("[]"),
    processed: text("processed"),
    created_at: timestamp("created_at").notNull().defaultNow(),
  },
  (table) => ({
    user_idx: index("voice31_uploads_user_id_idx").on(table.user_id),
    created_idx: index("voice31_uploads_created_at_idx").on(table.created_at),
  })
);

export type Voice31Upload = InferSelectModel<typeof voice31_uploads>;
