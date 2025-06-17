import { auth } from "@/app/(auth)/auth";
import { getChatById } from "@/app/db";
import { Chat } from "@/components/chat";
import { Message } from "ai";
import { notFound, redirect } from "next/navigation";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();

  if (!session?.user?.apiKey) {
    redirect("/login");
  }

  const { id } = await params;

  const chat = await getChatById({ id });

  if (!chat) {
    notFound();
  }

  return (
    <div className="rounded-lg overflow-hidden size-full bg-muted">
      <Chat
        id={chat.id}
        initialMessages={chat.messages as Message[]}
        apiKey={session.user.apiKey}
        author={session.user.email}
        readonly
      />
    </div>
  );
}
