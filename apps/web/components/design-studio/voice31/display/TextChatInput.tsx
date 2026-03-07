"use client";

import React, { useCallback, useRef, useState } from "react";
import { PaperPlaneRight, SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { useVoice31Store } from "../Voice31Store";

interface TextChatInputProps {
  onSend: (text: string) => void;
  phosphorColor: string;
}

const COLORS: Record<string, string> = {
  green: "#33ff33",
  amber: "#ffaa00",
  red: "#ff4444",
  blue: "#4488ff",
  white: "#ffffff",
};

export const TextChatInput: React.FC<TextChatInputProps> = ({
  onSend,
  phosphorColor,
}) => {
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const isProcessing = useVoice31Store((s) => s.isChatProcessing);
  const ttsEnabled = useVoice31Store((s) => s.ttsEnabled);
  const setTtsEnabled = useVoice31Store((s) => s.setTtsEnabled);

  const hex = COLORS[phosphorColor] || COLORS.amber;

  const handleSubmit = useCallback(() => {
    const trimmed = input.trim();
    if (!trimmed || isProcessing) return;
    onSend(trimmed);
    setInput("");
    inputRef.current?.focus();
  }, [input, isProcessing, onSend]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        handleSubmit();
      }
    },
    [handleSubmit],
  );

  return (
    <div
      className="absolute bottom-0 left-0 right-0 z-30 flex items-center gap-2 px-4 py-2"
      style={{
        background: `linear-gradient(0deg, rgba(0,0,0,0.85) 0%, rgba(0,0,0,0.6) 70%, transparent 100%)`,
      }}
    >
      {/* TTS Toggle */}
      <button
        onClick={() => setTtsEnabled(!ttsEnabled)}
        className="p-1.5 rounded transition-all hover:bg-white/10 flex-shrink-0"
        style={{ color: ttsEnabled ? hex : `${hex}40` }}
        title={ttsEnabled ? "TTS enabled" : "TTS muted"}
      >
        {ttsEnabled ? (
          <SpeakerHigh size={16} weight="bold" />
        ) : (
          <SpeakerSlash size={16} />
        )}
      </button>

      {/* Input */}
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={isProcessing ? "thinking..." : "type a message..."}
        disabled={isProcessing}
        autoFocus
        className="flex-1 bg-transparent border rounded px-3 py-1.5 text-sm font-mono outline-none placeholder:opacity-40 disabled:opacity-30"
        style={{
          borderColor: `${hex}40`,
          color: hex,
          caretColor: hex,
          textShadow: `0 0 8px ${hex}40`,
        }}
      />

      {/* Send */}
      <button
        onClick={handleSubmit}
        disabled={!input.trim() || isProcessing}
        className="p-1.5 rounded transition-all hover:bg-white/10 flex-shrink-0 disabled:opacity-20"
        style={{ color: hex }}
        title="Send"
      >
        {isProcessing ? (
          <span className="text-xs font-mono animate-pulse" style={{ color: `${hex}60` }}>
            ···
          </span>
        ) : (
          <PaperPlaneRight size={16} weight="bold" />
        )}
      </button>
    </div>
  );
};
