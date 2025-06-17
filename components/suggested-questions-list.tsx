"use client";

import useSWR from "swr";
import {
  InfoIcon,
  LoaderIcon,
  TrashIcon,
  XIcon,
  EditIcon,
  PlusIcon,
} from "./icons";
import { useState } from "react";
import { fetcher } from "@/utils/functions";
import cx from "classnames";
import { Session } from "next-auth";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { SuggestedQuestion } from "@/schema";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { CheckIcon } from "lucide-react";

export const SuggestedQuestionsList = ({
  session,
}: {
  session: Session | null;
}) => {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingQuestion, setEditingQuestion] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [deleteQueue, setDeleteQueue] = useState<Array<string>>([]);

  const {
    data: questions,
    mutate,
    isLoading,
  } = useSWR<SuggestedQuestion[]>(
    "/knowledge-base/api/suggested-questions",
    fetcher,
    {
      fallbackData: [],
    }
  );

  const handleAddQuestion = async () => {
    if (!newQuestion.trim()) return;

    try {
      await fetch("/knowledge-base/api/suggested-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: newQuestion }),
      });

      setNewQuestion("");
      setIsAddingNew(false);
      mutate();
    } catch (error) {
      console.error("Failed to add question:", error);
    }
  };

  const handleEditQuestion = async (id: string) => {
    if (!editingQuestion.trim()) return;

    try {
      await fetch(`/knowledge-base/api/suggested-questions/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: editingQuestion }),
      });

      setEditingId(null);
      setEditingQuestion("");
      mutate();
    } catch (error) {
      console.error("Failed to update question:", error);
    }
  };

  const handleDeleteQuestion = async (id: string) => {
    setDeleteQueue((queue) => [...queue, id]);

    try {
      await fetch(`/knowledge-base/api/suggested-questions/${id}`, {
        method: "DELETE",
      });

      mutate();
    } catch (error) {
      console.error("Failed to delete question:", error);
    } finally {
      setDeleteQueue((queue) => queue.filter((queueId) => queueId !== id));
    }
  };

  const startEditing = (question: SuggestedQuestion) => {
    setEditingId(question.id);
    setEditingQuestion(question.question);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditingQuestion("");
  };

  const cancelAddingNew = () => {
    setIsAddingNew(false);
    setNewQuestion("");
  };

  return (
    <div className="bg-white dark:bg-zinc-800 h-full">
      <div className={cx("p-4 flex flex-col gap-4 max-w-screen-md mx-auto")}>
        <div className="flex flex-row justify-between items-center">
          <div className="text-sm flex flex-row gap-3">
            <div className="text-zinc-900 dark:text-zinc-300">
              Manage Suggested Questions
            </div>
          </div>
          <div
            className="bg-zinc-900 text-zinc-50 hover:bg-zinc-800 flex flex-row gap-2 items-center dark:text-zinc-800 text-sm dark:bg-zinc-100 rounded-md p-1 px-2 dark:hover:bg-zinc-200 cursor-pointer"
            onClick={() => setIsAddingNew(true)}
          >
            <PlusIcon />
            <div>Add Question</div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {[44, 32, 52].map((item) => (
              <div
                key={item}
                className="flex flex-row gap-4 p-2 border-b dark:border-zinc-700 items-center"
              >
                <div
                  className={`w-${item} h-4 bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                />
                <div className="h-[24px] w-1" />
              </div>
            ))}
          </div>
        ) : !isLoading &&
          questions?.length === 0 &&
          deleteQueue.length === 0 &&
          !isAddingNew ? (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <div className="flex flex-row gap-2 items-center text-zinc-500 dark:text-zinc-400 text-sm">
              <InfoIcon />
              <div>No suggested questions found</div>
            </div>
          </div>
        ) : (
          <Table>
            <TableCaption>
              {questions?.length || 0} suggested questions
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Question</TableHead>
                <TableHead className="w-[100px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isAddingNew && (
                <TableRow>
                  <TableCell>
                    <Input
                      value={newQuestion}
                      onChange={(e) => setNewQuestion(e.target.value)}
                      placeholder="Enter suggested question..."
                      className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-md px-2 py-1 outline-none text-zinc-800 dark:text-zinc-300"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleAddQuestion();
                        if (e.key === "Escape") cancelAddingNew();
                      }}
                    />
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex gap-1 justify-end">
                      <Button
                        size="icon"
                        onClick={handleAddQuestion}
                      >
                        <CheckIcon />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelAddingNew}
                      >
                        <XIcon />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              )}
              {questions?.map((question) => (
                <TableRow key={question.id}>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    {editingId === question.id ? (
                      <Input
                        value={editingQuestion}
                        onChange={(e) => setEditingQuestion(e.target.value)}
                        className="w-full bg-zinc-100 dark:bg-zinc-700 rounded-md px-2 py-1 outline-none text-zinc-800 dark:text-zinc-300"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter")
                            handleEditQuestion(question.id);
                          if (e.key === "Escape") cancelEditing();
                        }}
                      />
                    ) : (
                      question.question
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    {editingId === question.id ? (
                      <div className="flex gap-1 justify-end">
                        <Button
                          size="icon"
                          variant="default"
                          onClick={() => handleEditQuestion(question.id)}
                        >
                          <CheckIcon />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={cancelEditing}
                        >
                          <XIcon />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex gap-1 justify-end">
                        {deleteQueue.includes(question.id) ? (
                          <div className="animate-spin p-1 px-2">
                            <LoaderIcon />
                          </div>
                        ) : (
                          <>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => startEditing(question)}
                            >
                              <EditIcon />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleDeleteQuestion(question.id)}
                            >
                              <TrashIcon />
                            </Button>
                          </>
                        )}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
