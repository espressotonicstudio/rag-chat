"use client";

import { InfoIcon } from "./icons";
import { Suspense, useEffect, useState } from "react";
import useSWR from "swr";
import cx from "classnames";
import { usePathname } from "next/navigation";
import { Chat } from "@/schema";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "./ui/badge";
import { cn } from "@/lib/utils";
import InquiryChat from "./inquiry-chat";
import { ChartNetwork, EyeIcon } from "lucide-react";
import { Button } from "./ui/button";
import { InquiryAnalysis, InquiryAnalysisCheck } from "./inquiry-analysis";

export const Inquiries = ({
  apiKey,
}: {
  apiKey: string | null | undefined;
}) => {
  const pathname = usePathname();
  const [selectedChatId, setSelectedChatId] = useState<string | null>(null);
  const [view, setView] = useState<"history" | "analysis">("history");

  const {
    data: history,
    error,
    isLoading,
    mutate,
  } = useSWR<Array<Chat>>(`/frame/api/history?apiKey=${apiKey}`, {
    fallbackData: [],
  });

  useEffect(() => {
    mutate();
  }, [pathname, mutate]);

  return (
    <div
      className={cn("size-full p-3 flex flex-col gap-6", {
        "grid grid-cols-1 md:grid-cols-[1.5fr_1fr]": selectedChatId,
      })}
    >
      <div className="flex flex-col overflow-y-scroll max-w-screen-md w-full mx-auto">
        {error && error.status === 401 ? (
          <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
            <InfoIcon />
            <div>Login to save and revisit previous chats!</div>
          </div>
        ) : null}

        {!isLoading && history?.length === 0 && !error ? (
          <div className="text-zinc-500 h-dvh w-full flex flex-row justify-center items-center text-sm gap-2">
            <InfoIcon />
            <div>No chats found</div>
          </div>
        ) : null}

        {isLoading && !error ? (
          <Table>
            <TableBody>
              {[44, 32, 28, 52].map((item) => (
                <TableRow key={item}>
                  <TableCell>
                    <div
                      className={`w-${item} h-[20px] bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {history && history.length > 0 && (
          <Table>
            <TableHeader>
              <TableRow className="border-none">
                <TableHead className="text-center rounded-l-lg">Date</TableHead>
                <TableHead>Inquiry</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center rounded-r-lg">
                  Analysis
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((chat) => (
                <TableRow
                  key={chat.id}
                  className={cx(
                    "cursor-pointer group hover:bg-muted border-none",
                    {
                      "bg-accent": selectedChatId === chat.id,
                    }
                  )}
                  onClick={() => {
                    setSelectedChatId(chat.id);
                    setView("history");
                  }}
                >
                  <TableCell className="text-center rounded-l-lg">
                    {new Date(chat.createdAt).toLocaleString()}
                  </TableCell>
                  <TableCell>
                    <div className="block w-full h-full text-sm dark:text-zinc-400 dark:group-hover:text-zinc-300 group-hover:text-zinc-700">
                      {chat.messages[0].content as string}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge
                      variant={
                        chat.status === "resolved"
                          ? "default"
                          : chat.status === "pending"
                          ? "secondary"
                          : "destructive"
                      }
                      className="text-xs first-letter:capitalize inline-block"
                    >
                      {chat.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center rounded-r-lg">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedChatId(chat.id);
                        setView("analysis");
                      }}
                    >
                      <InquiryAnalysisCheck id={chat.id} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {selectedChatId && view === "history" && (
        <InquiryChat id={selectedChatId} />
      )}

      {selectedChatId && view === "analysis" && (
        <InquiryAnalysis id={selectedChatId} />
      )}
    </div>
  );
};
