"use client";

import { AnimatePresence, motion } from "framer-motion";
import { BotIcon } from "./icons";
import { useRouter, useSearchParams } from "next/navigation";

export const ChatLauncher = () => {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isOpen = searchParams.get("chat") === "true";

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed bottom-20 right-8 border border-black/20 dark:border-white/20 rounded-lg overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
            >
              <iframe
                src="/"
                className="w-[400px] h-[600px]"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <button
        className="fixed bottom-4 right-4 p-3 rounded-full bg-zinc-900 text-zinc-50 hover:bg-zinc-800 transition-all focus:outline-none dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200 shadow-lg"
        aria-label="Open chat"
        onClick={() => {
          if (isOpen) {
            router.push(`/?chat=false`);
          } else {
            router.push(`/?chat=true`);
          }
        }}
      >
        <BotIcon />
      </button>
    </>
  );
};
