"use client";

import { Message } from "ai";
import { useChat } from "@ai-sdk/react";
import { motion } from "framer-motion";
import {
  Message as PreviewMessage,
  ThinkingMessage,
} from "@/components/message";
import { useScrollToBottom } from "@/components/use-scroll-to-bottom";
import useSWR from "swr";
import { SuggestedQuestion } from "@/schema";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";
import { ArrowUpIcon } from "lucide-react";
import { useRef } from "react";
import { useSuggestedQuestionTracking } from "@/lib/axiom/tracking";

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
  const { status, messages, handleSubmit, input, setInput, append } = useChat({
    body: { id, apiKey, author },
    api: "/frame/api/chat",
    initialMessages,
    onFinish: () => {
      window.history.replaceState({}, "", `/${id}`);
    },
  });

  const { data: suggestedQuestions } = useSWR<SuggestedQuestion[]>(
    apiKey ? `/knowledge-base/api/suggested-questions` : null,
    {
      fallbackData: [],
    }
  );

  const [messagesContainerRef, messagesEndRef] =
    useScrollToBottom<HTMLDivElement>();

  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const { trackSuggestedQuestionClick } = useSuggestedQuestionTracking();

  return (
    <div className="bg-muted flex flex-row justify-center h-full px-4 py-6">
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
          {status === "submitted" && <ThinkingMessage />}

          <div
            ref={messagesEndRef}
            className="flex-shrink-0 min-w-[24px] min-h-[24px]"
          />
        </div>

        {messages.length === 0 &&
          suggestedQuestions &&
          suggestedQuestions.length > 0 && (
            <div className="flex flex-col gap-1 w-full">
              <motion.small
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="self-start text-sm text-muted-foreground"
              >
                Get started
              </motion.small>
              <div className="grid sm:grid-cols-2 gap-2 w-full mx-auto md:max-w-[500px]">
                {suggestedQuestions?.map((suggestedQuestion, index) => (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * index }}
                    key={index}
                    className={index > 1 ? "hidden sm:block" : "block"}
                  >
                    <Button
                      variant="outline"
                      className="w-full justify-start"
                      onClick={async () => {
                        // Track the click before using the question
                        trackSuggestedQuestionClick(
                          suggestedQuestion.id,
                          suggestedQuestion.question,
                          "chat_interface"
                        );

                        append({
                          role: "user",
                          content: suggestedQuestion.question,
                        });
                      }}
                    >
                      <span className="font-medium">
                        {suggestedQuestion.question}
                      </span>
                    </Button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

        {!readonly && (
          <form
            ref={formRef}
            className="relative flex flex-row gap-2 items-center w-full md:max-w-[500px] max-w-[calc(100dvw-32px)"
            onSubmit={handleSubmit}
          >
            <Textarea
              autoFocus
              ref={inputRef}
              disabled={status === "submitted" || status === "streaming"}
              rows={2}
              className="resize-none bg-background"
              placeholder="Send a message..."
              value={input}
              onChange={(event) => {
                setInput(event.target.value);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  if (input.trim() !== "") {
                    formRef.current?.requestSubmit();
                  }
                }
              }}
            />
            <Button
              disabled={status === "submitted" || status === "streaming"}
              size="icon"
              type="submit"
              variant="outline"
              className="absolute bottom-2 right-2"
            >
              <ArrowUpIcon />
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
