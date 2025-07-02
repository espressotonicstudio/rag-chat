"use client";

import { Chat } from "@/components/chat";
import { Message } from "ai";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Skeleton } from "./ui/skeleton";

export default function InquiryChat({ id }: { id: string }) {
  const { data: session } = useSession();

  const { data: chat, isLoading } = useSWR(
    `/frame/api/chat-log?apiKey=${session?.user?.apiKey}&id=${id}`
  );

  if (isLoading) {
    return (
      <div className="size-full bg-muted flex flex-row justify-center md:pt-20 pt-10">
        <div className="flex flex-col gap-4 w-full max-w-[500px] p-4">
          <div className="flex flex-row gap-4">
            <Skeleton className="size-[24px] rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="flex flex-row gap-4">
            <Skeleton className="size-[24px] rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-4/5" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
          <div className="flex flex-row gap-4">
            <Skeleton className="size-[24px] rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
          <div className="flex flex-row gap-4">
            <Skeleton className="size-[24px] rounded-full" />
            <div className="flex flex-col gap-2 flex-1">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-1/2" />
              <Skeleton className="h-4 w-3/5" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!chat) {
    return <div>Chat not found</div>;
  }

  return (
    <div className="rounded-lg overflow-hidden size-full bg-muted">
      <Chat
        id={chat.id}
        initialMessages={chat.messages as Message[]}
        apiKey={session?.user?.apiKey}
        author={session?.user?.email}
        readonly
      />
    </div>
  );
}
