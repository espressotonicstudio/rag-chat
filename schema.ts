import { Message } from "ai";
import { InferSelectModel, InferInsertModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  real,
  timestamp,
  json,
  uuid,
  boolean,
} from "drizzle-orm/pg-core";

export const SUPPORT_STATUS = [
  "unresolved",
  "resolved",
  "pending",
  "aborted",
] as const;

export const SENTIMENT_STATUS = [
  "positive",
  "negative",
  "neutral",
  "mixed",
] as const;

export const ISSUE_CATEGORY = [
  "technical",
  "billing",
  "product_inquiry",
  "account_management",
  "feature_request",
  "bug_report",
  "general_inquiry",
  "complaint",
] as const;

export const COMPLEXITY_LEVEL = ["simple", "moderate", "complex"] as const;

export const RESOLUTION_QUALITY = [
  "fully_resolved",
  "partially_resolved",
  "unresolved",
  "escalation_needed",
] as const;

export const SATISFACTION_LEVEL = [
  "clearly_satisfied",
  "somewhat_satisfied",
  "neutral",
  "dissatisfied",
  "very_dissatisfied",
] as const;

export const AGENT_PERFORMANCE = [
  "excellent",
  "good",
  "adequate",
  "needs_improvement",
] as const;

export const user = pgTable("User", {
  apiKey: uuid("apiKey").defaultRandom(),
  email: varchar("email", { length: 64 }).primaryKey().notNull(),
  password: varchar("password", { length: 64 }),
  filePaths: text("filePaths").array().default([]),
});

export const chat = pgTable("Chat", {
  id: text("id").primaryKey().notNull(),
  createdAt: timestamp("createdAt").notNull(),
  messages: json("messages").notNull(),
  author: varchar("author", { length: 64 }).notNull(),
  status: text("status", {
    enum: SUPPORT_STATUS,
  })
    .notNull()
    .default("pending"),
  apiKey: uuid("apiKey")
    .notNull()
    .references(() => user.apiKey),
  feedbackQuality: boolean("feedbackQuality"),
  feedbackReason: text("feedbackReason"),
});

export const chatAnalysis = pgTable("ChatAnalysis", {
  id: uuid("id").primaryKey().defaultRandom(),
  chatId: text("chatId")
    .notNull()
    .references(() => chat.id),
  status: text("status", { enum: SUPPORT_STATUS }).notNull(),
  sentiment: text("sentiment", { enum: SENTIMENT_STATUS }).notNull(),
  issueCategory: text("issueCategory", { enum: ISSUE_CATEGORY }).notNull(),
  complexity: text("complexity", { enum: COMPLEXITY_LEVEL }).notNull(),
  resolutionQuality: text("resolutionQuality", {
    enum: RESOLUTION_QUALITY,
  }).notNull(),
  satisfactionIndicators: text("satisfactionIndicators", {
    enum: SATISFACTION_LEVEL,
  }).notNull(),
  firstContactResolution: boolean("firstContactResolution").notNull(),
  agentPerformance: text("agentPerformance", {
    enum: AGENT_PERFORMANCE,
  }).notNull(),
  keyTopics: text("keyTopics").array().notNull().default([]),
  escalationRequested: boolean("escalationRequested").notNull(),
  improvementOpportunities: text("improvementOpportunities")
    .array()
    .notNull()
    .default([]),
  summary: text("summary").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
});

export const chunk = pgTable("Chunk", {
  id: text("id").primaryKey().notNull(),
  filePath: text("filePath").notNull(),
  content: text("content").notNull(),
  embedding: real("embedding").array().notNull(),
});

export const suggestedQuestions = pgTable("SuggestedQuestions", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  apiKey: uuid("apiKey")
    .notNull()
    .references(() => user.apiKey),
});

export const crawls = pgTable("Crawls", {
  id: uuid("id").primaryKey().defaultRandom(),
  jobId: text("jobId"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  apiKey: uuid("apiKey")
    .notNull()
    .references(() => user.apiKey),
});

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export type Chunk = InferSelectModel<typeof chunk>;

export type SuggestedQuestion = InferSelectModel<typeof suggestedQuestions>;

export type ChatAnalysis = InferSelectModel<typeof chatAnalysis>;
export type ChatAnalysisInsert = InferInsertModel<typeof chatAnalysis>;
