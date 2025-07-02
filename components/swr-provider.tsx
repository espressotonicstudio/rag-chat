"use client";

import { SWRConfig } from "swr";
import { fetcher } from "@/utils/functions";

export const SWRProvider = ({ children }: { children: React.ReactNode }) => {
  return (
    <SWRConfig
      value={{
        shouldRetryOnError: false,
        fetcher: fetcher,
      }}
    >
      {children}
    </SWRConfig>
  );
};
