import { sql } from "drizzle-orm";
import {
  index,
  integer,
  jsonb,
  pgTable,
  real,
  text,
  timestamp,
  varchar,
} from "drizzle-orm/pg-core";
import { usersTable } from "./auth";

export const ideasTable = pgTable(
  "ideas",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    rawText: text("raw_text").notNull(),
    problem: text("problem"),
    solution: text("solution"),
    market: text("market"),
    businessModel: text("business_model"),
    competitiveEdge: text("competitive_edge"),
    targetAudience: text("target_audience"),
    status: varchar("status", { length: 32 }).notNull().default("draft"),
    validationScore: real("validation_score"),
    validationStrengths: jsonb("validation_strengths"),
    validationWeaknesses: jsonb("validation_weaknesses"),
    validationSuggestions: jsonb("validation_suggestions"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [index("idx_ideas_user").on(table.userId)],
);

export type Idea = typeof ideasTable.$inferSelect;
export type InsertIdea = typeof ideasTable.$inferInsert;

export const pitchDecksTable = pgTable(
  "pitch_decks",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    ideaId: varchar("idea_id")
      .notNull()
      .references(() => ideasTable.id, { onDelete: "cascade" }),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    title: varchar("title", { length: 200 }).notNull(),
    storyline: text("storyline"),
    slides: jsonb("slides").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_decks_idea").on(table.ideaId)],
);

export type PitchDeck = typeof pitchDecksTable.$inferSelect;
export type InsertPitchDeck = typeof pitchDecksTable.$inferInsert;

export const personasTable = pgTable("personas", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 64 }).notNull().unique(),
  name: varchar("name", { length: 120 }).notNull(),
  description: text("description").notNull(),
  style: text("style").notNull(),
  intensity: varchar("intensity", { length: 16 }).notNull(),
});

export type Persona = typeof personasTable.$inferSelect;
export type InsertPersona = typeof personasTable.$inferInsert;

export const pitchSessionsTable = pgTable(
  "pitch_sessions",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    ideaId: varchar("idea_id")
      .notNull()
      .references(() => ideasTable.id, { onDelete: "cascade" }),
    personaSlug: varchar("persona_slug", { length: 64 }).notNull(),
    status: varchar("status", { length: 16 }).notNull().default("active"),
    overallScore: real("overall_score"),
    confidenceScore: real("confidence_score"),
    clarityScore: real("clarity_score"),
    investorReadiness: real("investor_readiness"),
    summary: text("summary"),
    mistakes: jsonb("mistakes"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (table) => [
    index("idx_sessions_user").on(table.userId),
    index("idx_sessions_idea").on(table.ideaId),
  ],
);

export type PitchSession = typeof pitchSessionsTable.$inferSelect;
export type InsertPitchSession = typeof pitchSessionsTable.$inferInsert;

export const sessionMessagesTable = pgTable(
  "session_messages",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    sessionId: varchar("session_id")
      .notNull()
      .references(() => pitchSessionsTable.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 16 }).notNull(),
    content: text("content").notNull(),
    feedback: text("feedback"),
    confidence: real("confidence"),
    clarity: real("clarity"),
    fillerWords: integer("filler_words"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_msg_session").on(table.sessionId)],
);

export type SessionMessage = typeof sessionMessagesTable.$inferSelect;
export type InsertSessionMessage = typeof sessionMessagesTable.$inferInsert;

export const learningTopicsTable = pgTable("learning_topics", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  title: varchar("title", { length: 200 }).notNull(),
  summary: text("summary").notNull(),
  category: varchar("category", { length: 64 }).notNull(),
  body: text("body").notNull(),
  readMinutes: integer("read_minutes").notNull().default(5),
});

export type LearningTopic = typeof learningTopicsTable.$inferSelect;
export type InsertLearningTopic = typeof learningTopicsTable.$inferInsert;

export const reviewsTable = pgTable(
  "reviews",
  {
    id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
    userId: varchar("user_id")
      .notNull()
      .references(() => usersTable.id, { onDelete: "cascade" }),
    sessionId: varchar("session_id"),
    rating: integer("rating").notNull(),
    description: text("description").notNull(),
    displayName: varchar("display_name", { length: 120 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_reviews_user").on(table.userId)],
);

export type Review = typeof reviewsTable.$inferSelect;
export type InsertReview = typeof reviewsTable.$inferInsert;
