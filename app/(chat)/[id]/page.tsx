import { Message } from "ai";
import { Chat } from "@/schema";
import { getChatById } from "@/app/db";
import { notFound } from "next/navigation";
import { Chat as PreviewChat } from "@/components/chat";
import { auth } from "@/app/(auth)/auth";

export default async function Page({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    apiKey: string | null | undefined;
    author: string | null | undefined;
  }>;
}) {
  const { id } = await params;

  const chatFromDb = await getChatById({ id });

  if (!chatFromDb) {
    notFound();
  }

  // type casting
  const chat: Chat = {
    ...chatFromDb,
    messages: chatFromDb.messages as Message[],
  };

  const session = await auth();

  let { apiKey, author } = await searchParams;

  if (session) {
    apiKey = session.user.apiKey;
    author = session.user.email;
  }

  return (
    <>
      <PreviewChat
        id={chat.id}
        initialMessages={chat.messages}
        apiKey={apiKey}
        author={author}
      />
    </>
  );
}
