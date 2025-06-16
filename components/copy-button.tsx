"use client";

import { toast } from "sonner";
import { Button } from "./ui/button";
import { Slot } from "@radix-ui/react-slot";

export const CopyButton = ({
  children,
  value,
}: {
  children: React.ReactNode;
  value: string;
}) => {
  return (
    <Slot
      onClick={() => {
        navigator.clipboard.writeText(value);
        toast.success("Copied to clipboard");
      }}
    >
      {children}
    </Slot>
  );
};
