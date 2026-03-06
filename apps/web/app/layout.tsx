import { GeistMono } from "geist/font/mono";
import { GeistSans } from "geist/font/sans";
import type { Metadata } from "next";
import "./globals.css";
import { SWRProvider } from "@/components/providers/swr-provider";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { ClerkProviderClient } from "@/components/providers/clerk-provider-client";

export const metadata: Metadata = {
  metadataBase: new URL("https://speech.fm"),
  title: {
    default: "Speech FM — Voice AI Assistant",
    template: "%s | Speech FM",
  },
  description:
    "Speech FM is an AI voice assistant with cinematic storytelling, RPG mode, research, and real-time visual intelligence.",
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://speech.fm",
    siteName: "Speech FM",
    title: "Speech FM — Voice AI Assistant",
    description:
      "AI voice assistant with cinematic storytelling, RPG mode, and visual intelligence.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${GeistSans.variable} ${GeistMono.variable}`}
    >
      <body className="antialiased">
        <ClerkProviderClient>
          <ThemeProvider>
            <SWRProvider>
              {children}
            </SWRProvider>
          </ThemeProvider>
        </ClerkProviderClient>
      </body>
    </html>
  );
}
