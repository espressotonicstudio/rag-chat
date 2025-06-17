import { Chat } from "@/components/chat";
import { generateId } from "ai";
import { auth } from "@/app/(auth)/auth";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{
    apiKey: string | null | undefined;
    author: string | null | undefined;
  }>;
}) {
  let { apiKey, author } = await searchParams;

  return (
    <>
      <Chat
        id={generateId()}
        initialMessages={[]}
        author={author}
        apiKey={apiKey}
      />
    </>
  );
}
