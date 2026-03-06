"use client";

import type { ReactNode } from "react";
import { SWRConfig } from "swr";

interface SWRProviderProps {
  children: ReactNode;
}

interface FetchError extends Error {
  info?: unknown;
  status?: number;
  isAuthError?: boolean;
}

export function SWRProvider({ children }: SWRProviderProps) {
  return (
    <SWRConfig
      value={{
        fetcher: async (url: string) => {
          const res = await fetch(url);

          if (!res.ok) {
            const error = new Error(
              "An error occurred while fetching the data.",
            ) as FetchError;
            error.status = res.status;

            // Mark auth errors specifically - don't throw them to error boundary
            // Instead, let them be handled by SWR's error state
            if (res.status === 401 || res.status === 403) {
              error.isAuthError = true;
              error.message = res.status === 401
                ? "Authentication required"
                : "Access denied";
            }

            // Try to parse error info but don't fail if it errors
            try {
              error.info = await res.json();
            } catch {
              error.info = null;
            }

            throw error;
          }
          return res.json();
        },
        revalidateOnFocus: false,
        revalidateOnReconnect: true,
        refreshInterval: 0,
        errorRetryCount: 3,
        errorRetryInterval: 5000,
        // Don't retry 404s or auth errors - they won't resolve with retries
        shouldRetryOnError: (error: FetchError) => {
          if (error.status === 404) return false;
          if (error.status === 401 || error.status === 403) return false;
          return true;
        },
        // Handle errors gracefully without throwing to error boundary
        onError: (error: FetchError, key: string) => {
          // Log auth errors quietly - they're expected when session expires
          if (error.isAuthError) {
            console.warn(`[SWR] Auth error for ${key}:`, error.status);
            return;
          }
          // Log other errors normally
          console.error(`[SWR] Error for ${key}:`, error);
        },
      }}
    >
      {children}
    </SWRConfig>
  );
}
