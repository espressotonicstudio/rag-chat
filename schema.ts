import { Message } from "ai";
import { randomUUID } from "crypto";
import { InferSelectModel } from "drizzle-orm";
import {
  pgTable,
  varchar,
  text,
  real,
  timestamp,
  json,
  uuid,
} from "drizzle-orm/pg-core";

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
    enum: ["unresolved", "resolved", "pending", "aborted"],
  })
    .notNull()
    .default("pending"),
  apiKey: uuid("apiKey")
    .notNull()
    .references(() => user.apiKey),
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

export type Chat = Omit<InferSelectModel<typeof chat>, "messages"> & {
  messages: Array<Message>;
};

export type Chunk = InferSelectModel<typeof chunk>;

export type SuggestedQuestion = InferSelectModel<typeof suggestedQuestions>;
