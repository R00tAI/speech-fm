"use client";

import dynamic from "next/dynamic";
import { ReactNode } from "react";

interface ClerkProviderClientProps {
  children: ReactNode;
}

// Dynamic import of ClerkProvider to prevent SSG issues
// This ensures Clerk is only loaded on the client side
const ClerkProviderDynamic = dynamic(
  () => import("@clerk/nextjs").then((mod) => {
    const { ClerkProvider } = mod;
    return function ClerkProviderWrapper({ children }: { children: ReactNode }) {
      return (
        <ClerkProvider
          appearance={{
            variables: {
              colorPrimary: "#000000",
              colorText: "#000000",
              colorBackground: "#ffffff",
            },
            elements: {
              formButtonPrimary:
                "bg-black hover:bg-gray-800 text-white rounded-xl font-bold",
              card: "shadow-none",
            },
          }}
        >
          {children}
        </ClerkProvider>
      );
    };
  }),
  {
    ssr: false,
  }
);

/**
 * Client-only ClerkProvider wrapper that prevents SSG issues
 * by dynamically importing Clerk only on the client side.
 */
export function ClerkProviderClient({ children }: ClerkProviderClientProps) {
  return <ClerkProviderDynamic>{children}</ClerkProviderDynamic>;
}
