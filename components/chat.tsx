"use client";

import { Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import { Message as PreviewMessage } from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import useSWR from "swr";
import { fetcher } from "@/utils/functions";
import { SuggestedQuestion } from "@/schema";

export function Chat({
  id,
  initialMessages,
  apiKey,
  author,
  readonly = false,
}: {
  id: string;
  initialMessages: Array<Message>;
  apiKey: string | null | undefined;
  author: string | null | undefined;
  readonly?: boolean;
}) {
  const { messages, handleSubmit, input, setInput, append } = useChat({
    body: { id, apiKey, author },
    api: "/frame/api/chat",
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/${id}`);
    },
  });

  const { data: suggestedQuestions } = useSWR<SuggestedQuestion[]>(
    apiKey ? `/knowledge-base/api/suggested-questions` : null,
    fetcher,
    {
      fallbackData: [],
    }
  );

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  return (
    <div className="flex flex-row justify-center h-full p-3">
      <div className="flex flex-col justify-between items-center gap-4 w-full">
        <div
          ref={messagesContainerRef}
          className="flex flex-col gap-4 h-full w-full items-center overflow-y-scroll"
        >
          {messages.map((message, index) => (
            <PreviewMessage
              key={`${id}-${index}`}
              role={message.role}
              content={message.content}
            />
          ))}
          <div
            ref={messagesEndRef}
            className="flex-shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        {messages.length === 0 &&
          suggestedQuestions &&
          suggestedQuestions.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-2 w-full px-4 md:px-0 mx-auto md:max-w-[500px]">
              {suggestedQuestions?.map((suggestedQuestion, index) => (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.05 * index }}
                  key={index}
                  className={index > 1 ? "hidden sm:block" : "block"}
                >
                  <button
                    onClick={async () => {
                      append({
                        role: "user",
                        content: suggestedQuestion.question,
                      });
                    }}
                    className="w-full text-left border border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-300 rounded-lg p-2 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors flex flex-col"
                  >
                    <span className="font-medium">
                      {suggestedQuestion.question}
                    </span>
                  </button>
                </motion.div>
              ))}
            </div>
          )}

        {!readonly && (
          <form
            className="flex flex-row gap-2 relative items-center w-full md:max-w-[500px] max-w-[calc(100dvw-32px) px-4 md:px-0"
            onSubmit={handleSubmit}
          >
            <input
              className="bg-zinc-100 rounded-md px-2 py-1.5 flex-1 outline-none dark:bg-zinc-700 text-zinc-800 dark:text-zinc-300"
              placeholder="Send a message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
            />
          </form>
        )}
      </div>
    </div>
  );
}
