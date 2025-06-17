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
  // const session = await auth();

  let { apiKey, author } = await searchParams;

  // if (session) {
  //   apiKey = session.user.apiKey;
  //   author = session.user.email;
  // }

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
