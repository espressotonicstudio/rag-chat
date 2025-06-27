"use client";

import useSWR from "swr";
import {
  CheckedSquare,
  InfoIcon,
  LoaderIcon,
  TrashIcon,
  UncheckedSquare,
  UploadIcon,
} from "./icons";
import { useEffect, useRef, useState } from "react";
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
import { Button } from "./ui/button";
import { FilePreviewDialog } from "./file-preview-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { GlobeIcon, MoreVerticalIcon, PlusIcon } from "lucide-react";
import { AddWebsiteDialog } from "./add-website-dialog";

export const FilesList = ({
  session,
  config,
}: {
  session: Session | null;
  config: {
    filePaths: string[] | null;
  };
}) => {
  const [selectedFilePathnames, setSelectedFilePathnames] = useState<string[]>(
    config.filePaths || []
  );

  const inputFileRef = useRef<HTMLInputElement>(null);
  const [uploadQueue, setUploadQueue] = useState<Array<string>>([]);
  const [deleteQueue, setDeleteQueue] = useState<Array<string>>([]);
  const [isAddWebsiteDialogOpen, setIsAddWebsiteDialogOpen] = useState(false);
  const {
    data: files,
    mutate,
    isLoading,
  } = useSWR<
    Array<{
      pathname: string;
      url?: string;
      downloadUrl?: string;
    }>
  >("/knowledge-base/api/files/list", fetcher, {
    fallbackData: [],
  });

  return (
    <div className="h-full">
      <div className={cx("p-4 flex flex-col gap-4 max-w-screen-md mx-auto")}>
        <div className="flex flex-row justify-between items-center">
          <p className="text-sm flex flex-row gap-3">Manage Knowledge Base</p>
          <input
            name="file"
            ref={inputFileRef}
            type="file"
            required
            className="opacity-0 pointer-events-none w-1"
            accept=".md,.markdown,text/markdown,application/pdf"
            multiple
            onChange={async (event) => {
              const newFiles = event.target.files;

              if (newFiles) {
                for (const file of newFiles) {
                  setUploadQueue((currentQueue) => [
                    ...currentQueue,
                    file.name,
                  ]);
                  fetch(
                    `/knowledge-base/api/files/upload?filename=${file.name}`,
                    {
                      method: "POST",
                      body: file,
                    }
                  );
                  setUploadQueue((currentQueue) =>
                    currentQueue.filter((filename) => filename !== file.name)
                  );
                  mutate([...(files || []), { pathname: file.name }]);
                }
              }
            }}
          />

          <DropdownMenu>
            <DropdownMenuTrigger>
              <PlusIcon size={16} />
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem
                onClick={() => {
                  inputFileRef.current?.click();
                }}
              >
                <UploadIcon size={16} />
                <div>Upload documents</div>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsAddWebsiteDialogOpen(true)}>
                <GlobeIcon size={16} />
                <div>Add website</div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <AddWebsiteDialog
            open={isAddWebsiteDialogOpen}
            setOpen={setIsAddWebsiteDialogOpen}
            onUpload={(url) => {
              setUploadQueue((currentQueue) => [...currentQueue, url]);
            }}
          />
        </div>

        {isLoading ? (
          <div className="flex flex-col">
            {[44, 32, 52].map((item) => (
              <div
                key={item}
                className="flex flex-row gap-4 p-2 border-b dark:border-zinc-700 items-center"
              >
                <div className="size-4 bg-zinc-200 dark:bg-zinc-600 animate-pulse" />
                <div
                  className={`w-${item} h-4 bg-zinc-200 dark:bg-zinc-600 animate-pulse`}
                />
                <div className="h-[24px] w-1" />
              </div>
            ))}
          </div>
        ) : !isLoading &&
          files?.length === 0 &&
          uploadQueue.length === 0 &&
          deleteQueue.length === 0 ? (
          <div className="flex flex-col gap-4 items-center justify-center h-full">
            <div className="flex flex-row gap-2 items-center text-sm">
              <InfoIcon />
              <div>No files found</div>
            </div>
          </div>
        ) : (
          <Table>
            <TableCaption>
              {`${selectedFilePathnames.length}/${files?.length}`} files used
              for answers
            </TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[50px]">
                  <div
                    className="cursor-pointer"
                    onClick={() => {
                      const allSelected = files?.every((file) =>
                        selectedFilePathnames.includes(file.pathname)
                      );

                      if (allSelected) {
                        fetch(`/knowledge-base/api/files/update`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            operation: "remove",
                            filePaths: selectedFilePathnames,
                          }),
                        });

                        setSelectedFilePathnames([]);
                        return;
                      }

                      const onlyDiffs = files?.filter(
                        (file) => !selectedFilePathnames.includes(file.pathname)
                      );

                      setSelectedFilePathnames(
                        files?.map((file) => file.pathname) || []
                      );

                      fetch(`/knowledge-base/api/files/update`, {
                        method: "PATCH",
                        body: JSON.stringify({
                          operation: "add",
                          filePaths:
                            onlyDiffs?.map((file) => file.pathname) || [],
                        }),
                      });
                    }}
                  >
                    {files?.every((file) =>
                      selectedFilePathnames.includes(file.pathname)
                    ) ? (
                      <CheckedSquare />
                    ) : (
                      <UncheckedSquare />
                    )}
                  </div>
                </TableHead>
                <TableHead>Filename</TableHead>
                <TableHead className="w-[100px] text-right" />
              </TableRow>
            </TableHeader>
            <TableBody>
              {files?.map((file: any) => (
                <TableRow
                  key={file.pathname}
                  className={
                    selectedFilePathnames.includes(file.pathname)
                      ? "bg-zinc-100 dark:bg-zinc-700"
                      : ""
                  }
                >
                  <TableCell>
                    <div
                      className="cursor-pointer"
                      onClick={() => {
                        let operation = "";
                        let currentSelections = selectedFilePathnames;

                        if (currentSelections.includes(file.pathname)) {
                          operation = "remove";
                          currentSelections = currentSelections.filter(
                            (path) => path !== file.pathname
                          );
                        } else {
                          operation = "add";
                          currentSelections = [
                            ...currentSelections,
                            file.pathname,
                          ];
                        }

                        setSelectedFilePathnames(currentSelections);

                        fetch(`/knowledge-base/api/files/update`, {
                          method: "PATCH",
                          body: JSON.stringify({
                            operation,
                            filePaths: [file.pathname],
                          }),
                        });
                      }}
                    >
                      {deleteQueue.includes(file.pathname) ? (
                        <div className="animate-spin size-fit">
                          <LoaderIcon />
                        </div>
                      ) : selectedFilePathnames.includes(file.pathname) ? (
                        <CheckedSquare />
                      ) : (
                        <UncheckedSquare />
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="font-medium text-zinc-900 dark:text-zinc-100">
                    <FilePreviewDialog
                      downloadUrl={file.downloadUrl}
                      fileName={file.pathname}
                    >
                      <button
                        className="text-left hover:underline focus:outline-none focus:underline cursor-pointer"
                        type="button"
                      >
                        {file.pathname}
                      </button>
                    </FilePreviewDialog>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      className="p-1.5 size-auto"
                      size="icon"
                      onClick={async () => {
                        setDeleteQueue((currentQueue) => [
                          ...currentQueue,
                          file.pathname,
                        ]);
                        await fetch(
                          `/knowledge-base/api/files/delete?fileurl=${file.url}`,
                          {
                            method: "DELETE",
                          }
                        );
                        setDeleteQueue((currentQueue) =>
                          currentQueue.filter(
                            (filename) => filename !== file.pathname
                          )
                        );
                        setSelectedFilePathnames((currentSelections) =>
                          currentSelections.filter(
                            (path) => path !== file.pathname
                          )
                        );
                        mutate(
                          files.filter((f) => f.pathname !== file.pathname)
                        );
                      }}
                    >
                      <TrashIcon size={14} />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {uploadQueue.map((fileName) => (
                <TableRow key={fileName}>
                  <TableCell>
                    <div className="size-fit animate-spin">
                      <LoaderIcon />
                    </div>
                  </TableCell>
                  <TableCell className="text-zinc-400 dark:text-zinc-400">
                    {fileName}
                  </TableCell>
                  <TableCell />
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};
