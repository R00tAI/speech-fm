"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useVoice31Store } from "../Voice31Store";

const FALLBACK_MESSAGES = [
  "voice server needs coffee money",
  "vocal cords temporarily offline",
  "the voice gerbils are on break",
  "budget mode. still genius though.",
  "whisper mode engaged",
  "typing is the new talking",
  "server needs to go vroom",
  "voice credits: see you next month",
  "text gang rise up",
  "silence is golden. literally.",
];

/**
 * CRT corner alert — red phosphor style, shown when fallback is active.
 * Pulsing glow, rotating funny messages. Click to dismiss.
 */
export const FallbackAlert: React.FC = () => {
  const visible = useVoice31Store((s) => s.fallbackAlertVisible);
  const reason = useVoice31Store((s) => s.fallbackReason);
  const setFallbackAlert = useVoice31Store((s) => s.setFallbackAlert);

  const [messageIndex, setMessageIndex] = useState(0);

  // Rotate messages every 8s
  useEffect(() => {
    if (!visible) return;
    const interval = setInterval(() => {
      setMessageIndex((i) => (i + 1) % FALLBACK_MESSAGES.length);
    }, 8000);
    return () => clearInterval(interval);
  }, [visible]);

  const dismiss = useCallback(() => {
    setFallbackAlert(false);
  }, [setFallbackAlert]);

  // Don't show for user_choice (intentional text mode)
  if (!visible || reason === "user_choice") return null;

  return (
    <div
      onClick={dismiss}
      className="absolute top-3 left-3 z-40 cursor-pointer group"
      title="Click to dismiss"
    >
      <div
        className="relative px-3 py-2 rounded-sm font-mono text-[10px] leading-tight max-w-[200px]"
        style={{
          background: "rgba(68, 17, 17, 0.85)",
          border: "1px solid #ff444480",
          boxShadow:
            "0 0 12px rgba(255, 68, 68, 0.3), inset 0 0 8px rgba(255, 68, 68, 0.1)",
          animation: "fallbackPulse 3s ease-in-out infinite",
        }}
      >
        {/* Corner accents */}
        <div
          className="absolute -top-px -left-px w-2 h-2"
          style={{
            borderTop: "1px solid #ff4444",
            borderLeft: "1px solid #ff4444",
          }}
        />
        <div
          className="absolute -top-px -right-px w-2 h-2"
          style={{
            borderTop: "1px solid #ff4444",
            borderRight: "1px solid #ff4444",
          }}
        />
        <div
          className="absolute -bottom-px -left-px w-2 h-2"
          style={{
            borderBottom: "1px solid #ff4444",
            borderLeft: "1px solid #ff4444",
          }}
        />
        <div
          className="absolute -bottom-px -right-px w-2 h-2"
          style={{
            borderBottom: "1px solid #ff4444",
            borderRight: "1px solid #ff4444",
          }}
        />

        {/* Header */}
        <div
          className="uppercase tracking-wider font-bold mb-0.5"
          style={{
            color: "#ff8888",
            textShadow: "0 0 6px #ff4444",
          }}
        >
          fallback mode
        </div>

        {/* Rotating message */}
        <div
          className="transition-opacity duration-500"
          style={{
            color: "#ff888888",
          }}
        >
          {FALLBACK_MESSAGES[messageIndex]}
        </div>

        {/* Scanline overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-10"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent 0px, transparent 1px, rgba(255,68,68,0.1) 1px, rgba(255,68,68,0.1) 2px)",
          }}
        />
      </div>

      <style jsx>{`
        @keyframes fallbackPulse {
          0%, 100% {
            box-shadow: 0 0 12px rgba(255, 68, 68, 0.3),
              inset 0 0 8px rgba(255, 68, 68, 0.1);
          }
          50% {
            box-shadow: 0 0 20px rgba(255, 68, 68, 0.5),
              inset 0 0 12px rgba(255, 68, 68, 0.2);
          }
        }
      `}</style>
    </div>
  );
};
