import { drizzle } from "drizzle-orm/postgres-js";
import { desc, eq, inArray } from "drizzle-orm";
import postgres from "postgres";
import { genSaltSync, hashSync } from "bcrypt-ts";
import { chat, chunk, user, suggestedQuestions, crawls } from "@/schema";
import { cache } from "react";

// Optionally, if not using email/pass login, you can
// use the Drizzle adapter for Auth.js / NextAuth
// https://authjs.dev/reference/adapter/drizzle
let client = postgres(`${process.env.DATABASE_URL!}?sslmode=require`);
let db = drizzle(client);

export async function getUser(email: string) {
  return await db.select().from(user).where(eq(user.email, email));
}

export const getConfigByApiKey = cache(async (apiKey: string) => {
  const res = await db
    .select({
      email: user.email,
      filePaths: user.filePaths,
    })
    .from(user)
    .where(eq(user.apiKey, apiKey));

  if (res.length > 0) {
    return res[0];
  }

  return null;
});

export async function createUser(email: string, password: string) {
  let salt = genSaltSync(10);
  let hash = hashSync(password, salt);

  return await db.insert(user).values({ email, password: hash });
}

export async function createMessage({
  id,
  messages,
  author,
  apiKey,
}: {
  id: string;
  messages: any;
  author: string;
  apiKey: string;
}) {
  const selectedChats = await db.select().from(chat).where(eq(chat.id, id));

  if (selectedChats.length > 0) {
    return await db
      .update(chat)
      .set({
        messages: JSON.stringify(messages),
      })
      .where(eq(chat.id, id));
  }

  return await db.insert(chat).values({
    id,
    createdAt: new Date(),
    messages: JSON.stringify(messages),
    author,
    apiKey,
  });
}

export async function getChatsByAuthor({ author }: { author: string }) {
  return await db
    .select()
    .from(chat)
    .where(eq(chat.author, author))
    .orderBy(desc(chat.createdAt));
}

export async function getChatsByApiKey({ apiKey }: { apiKey: string }) {
  return await db
    .select()
    .from(chat)
    .where(eq(chat.apiKey, apiKey))
    .orderBy(desc(chat.createdAt));
}

export async function getChatById({ id }: { id: string }) {
  const [selectedChat] = await db.select().from(chat).where(eq(chat.id, id));
  return selectedChat;
}

export async function insertChunks({ chunks }: { chunks: any[] }) {
  return await db.insert(chunk).values(chunks);
}

export async function getChunksByFilePaths({
  filePaths,
}: {
  filePaths: Array<string>;
}) {
  return await db
    .select()
    .from(chunk)
    .where(inArray(chunk.filePath, filePaths));
}

export async function deleteChunksByFilePath({
  filePath,
}: {
  filePath: string;
}) {
  return await db.delete(chunk).where(eq(chunk.filePath, filePath));
}

export async function updateUserFilePaths(apiKey: string, filePaths: string[]) {
  const [updatedUser] = await db
    .update(user)
    .set({ filePaths })
    .where(eq(user.apiKey, apiKey))
    .returning({
      filePaths: user.filePaths,
    });

  return updatedUser;
}

// Suggested Questions functions
export async function getSuggestedQuestionsByApiKey({
  apiKey,
}: {
  apiKey: string;
}) {
  return await db
    .select()
    .from(suggestedQuestions)
    .where(eq(suggestedQuestions.apiKey, apiKey))
    .orderBy(desc(suggestedQuestions.createdAt));
}

export async function createSuggestedQuestion({
  question,
  apiKey,
}: {
  question: string;
  apiKey: string;
}) {
  return await db.insert(suggestedQuestions).values({
    question,
    apiKey,
  });
}

export async function updateSuggestedQuestion({
  id,
  question,
}: {
  id: string;
  question: string;
}) {
  return await db
    .update(suggestedQuestions)
    .set({ question })
    .where(eq(suggestedQuestions.id, id));
}

export async function deleteSuggestedQuestion({ id }: { id: string }) {
  return await db
    .delete(suggestedQuestions)
    .where(eq(suggestedQuestions.id, id));
}

// Crawls functions
export async function createCrawl({
  jobId,
  apiKey,
}: {
  jobId: string;
  apiKey: string;
}) {
  return await db.insert(crawls).values({ jobId, apiKey });
}

export async function getCrawls({ apiKey }: { apiKey: string }) {
  return await db.select().from(crawls).where(eq(crawls.apiKey, apiKey));
}

export async function getCrawlById({ id }: { id: string }) {
  return await db.select().from(crawls).where(eq(crawls.id, id));
}

export async function updateCrawl({
  id,
  jobId,
}: {
  id: string;
  jobId: string;
}) {
  return await db.update(crawls).set({ jobId }).where(eq(crawls.id, id));
}

export async function deleteCrawl({ id }: { id: string }) {
  return await db.delete(crawls).where(eq(crawls.id, id));
}
