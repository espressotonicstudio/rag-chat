"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { LoaderIcon } from "./icons";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Markdown } from "./markdown";

interface FilePreviewDialogProps {
  downloadUrl: string;
  fileName: string;
  children: React.ReactNode;
}

export const FilePreviewDialog = ({
  downloadUrl,
  fileName,
  children,
}: FilePreviewDialogProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [content, setContent] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenChange = async (open: boolean) => {
    setIsOpen(open);

    if (open && !content) {
      await fetchFileContent();
    }
  };

  const fetchFileContent = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `/knowledge-base/api/files/preview?url=${encodeURIComponent(
          downloadUrl
        )}`
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch file: ${response.statusText}`);
      }

      const fileContent = await response.text();
      setContent(fileContent);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load file");
    } finally {
      setIsLoading(false);
    }
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-2">
            <div className="animate-spin">
              <LoaderIcon />
            </div>
            <span>Loading file...</span>
          </div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-red-500 mb-2">Error loading file</p>
            <p className="text-sm text-gray-500">{error}</p>
            <Button
              variant="outline"
              size="sm"
              className="mt-2"
              onClick={fetchFileContent}
            >
              Try Again
            </Button>
          </div>
        </div>
      );
    }

    if (!content) {
      return (
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-500">No content available</p>
        </div>
      );
    }

    const fileExtension = downloadUrl.split(".").pop()?.toLowerCase();

    if (fileExtension === "pdf") {
      return (
        <div className="text-center p-8">
          <p className="text-gray-600 mb-4">
            PDF preview is not available in this dialog.
          </p>
          <Button asChild>
            <a
              href={`/knowledge-base/api/files/preview?url=${encodeURIComponent(
                downloadUrl
              )}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              View PDF in new tab
            </a>
          </Button>
        </div>
      );
    }

    // Handle markdown files
    if (fileExtension === "md" || fileExtension === "markdown") {
      return (
        <div className="max-w-none">
          <Markdown>{content}</Markdown>
        </div>
      );
    }

    // Handle other text files
    return (
      <pre className="text-sm whitespace-pre-wrap font-mono bg-gray-50 dark:bg-gray-900 p-4 rounded">
        {content}
      </pre>
    );
  };

  return (
    <Dialog
      open={isOpen}
      onOpenChange={handleOpenChange}
    >
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">{fileName}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 pr-4 overflow-y-auto">{renderContent()}</div>
      </DialogContent>
    </Dialog>
  );
};
