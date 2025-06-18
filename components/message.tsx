"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BotIcon, UserIcon } from "./icons";
import { ReactNode, useEffect, useState } from "react";
import { Markdown } from "./markdown";
import { cn } from "@/lib/utils";

const thinkingPhrases = [
  "Let me think about that...",
  "Analyzing your question...",
  "Processing that for you...",
  "Let me check the information...",
  "Working on an answer...",
];

export const ThinkingMessage = () => {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((index) => (index + 1) % thinkingPhrases.length);
    }, 2700);

    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      className={`flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-6 md:first-of-type:pt-20`}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1, transition: { delay: 0.75 } }}
    >
      <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
        <BotIcon />
      </div>

      <AnimatePresence>
        <motion.div
          key={index}
          initial={{ y: 5, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="animate-pulse flex flex-col gap-6 w-full"
        >
          <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
            {thinkingPhrases[index]}
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
};

export const Message = ({
  role,
  content,
}: {
  role: string;
  content: string | ReactNode;
}) => {
  return (
    <motion.div
      className={cn(
        `flex flex-row gap-4 px-4 w-full md:w-[500px] md:px-0 first-of-type:pt-6 md:first-of-type:pt-20`
      )}
      initial={{ y: 5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
    >
      <div className="size-[24px] flex flex-col justify-center items-center flex-shrink-0 text-zinc-400">
        {role === "assistant" ? <BotIcon /> : <UserIcon />}
      </div>

      <div
        className={cn(
          "flex flex-col gap-6 w-full px-3 py-2 rounded-lg",
          role !== "assistant" && "bg-muted-foreground/15"
        )}
      >
        <div className="text-zinc-800 dark:text-zinc-300 flex flex-col gap-4">
          <Markdown>{content as string}</Markdown>
        </div>
      </div>
    </motion.div>
  );
};
