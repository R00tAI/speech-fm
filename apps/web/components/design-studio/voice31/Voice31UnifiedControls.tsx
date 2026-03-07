"use client";

/**
 * Voice31 Unified Controls
 *
 * Control panel that works with both Hume and ElevenLabs backends.
 * Uses the backend from Voice31UnifiedProvider to determine which API to call.
 */

import {
  Faders,
  Microphone,
  MicrophoneSlash,
  Phone,
  PhoneDisconnect,
  Spinner,
  Warning,
  Waveform,
} from "@phosphor-icons/react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { useVoice31Store } from "./Voice31Store";
import { useVoice31Backend } from "./Voice31UnifiedProvider";

// =============================================================================
// HUME HOOKS (conditional)
// =============================================================================

// We'll dynamically import these to avoid errors when using ElevenLabs
let useVoice: any = null;
let useVoice31Context: any = null;
let VOICE26_CONFIG_ID = "";

try {
  const humeModule = require("@humeai/voice-react");
  useVoice = humeModule.useVoice;
  const providerModule = require("./Voice31Provider");
  useVoice31Context = providerModule.useVoice31Context;
  VOICE26_CONFIG_ID = providerModule.VOICE26_CONFIG_ID;
} catch {
  // Hume not available
}

// =============================================================================
// ELEVENLABS HOOKS (conditional)
// =============================================================================

let useVoice31ElevenLabs: any = null;

try {
  const elModule = require("./Voice31ElevenLabsProvider");
  useVoice31ElevenLabs = elModule.useVoice31ElevenLabs;
} catch {
  // ElevenLabs not available
}

// =============================================================================
// HUME CONTROLS
// =============================================================================

const HumeControls: React.FC = () => {
  if (!(useVoice && useVoice31Context)) {
    return <div className="text-red-500 text-xs">Hume SDK not available</div>;
  }

  const { connect, disconnect, readyState, status, isMuted, mute, unmute } =
    useVoice();

  const { accessToken } = useVoice31Context();
  const isConnected = useVoice31Store((s) => s.isConnected);
  const isListening = useVoice31Store((s) => s.isListening);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const audioFXVisible = useVoice31Store((s) => s.audioFXVisible);
  const toggleAudioFXVisible = useVoice31Store((s) => s.toggleAudioFXVisible);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectInFlightRef = useRef(false);

  const VoiceReadyState = {
    OPEN: "open",
    CONNECTING: "connecting",
    CLOSED: "closed",
  };
  const resolvedReadyState =
    readyState ?? (status as any)?.value ?? VoiceReadyState.CLOSED;
  const isActuallyConnected =
    resolvedReadyState === VoiceReadyState.OPEN ||
    resolvedReadyState === "open";
  const isCurrentlyConnecting =
    resolvedReadyState === VoiceReadyState.CONNECTING ||
    resolvedReadyState === "connecting";

  const handleConnect = useCallback(async () => {
    if (
      connectInFlightRef.current ||
      isActuallyConnected ||
      isCurrentlyConnecting
    )
      return;
    if (!accessToken) {
      setConnectionError("No access token");
      return;
    }

    connectInFlightRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);

    try {
      await connect({
        auth: { type: "accessToken", value: accessToken },
        configId: VOICE26_CONFIG_ID,
      });
    } catch (error) {
      setConnectionError(
        error instanceof Error ? error.message : "Connection failed",
      );
    } finally {
      connectInFlightRef.current = false;
      setIsConnecting(false);
    }
  }, [accessToken, connect, isActuallyConnected, isCurrentlyConnecting]);

  const effectivelyConnected = isConnected || isActuallyConnected;
  const showConnecting = isConnecting || isCurrentlyConnecting;

  return (
    <ControlsUI
      effectivelyConnected={effectivelyConnected}
      showConnecting={showConnecting}
      isMuted={isMuted}
      isListening={isListening}
      isSpeaking={isSpeaking}
      connectionError={connectionError}
      audioFXVisible={audioFXVisible}
      onConnect={handleConnect}
      onDisconnect={disconnect}
      onToggleMute={() => (isMuted ? unmute() : mute())}
      onToggleAudioFX={toggleAudioFXVisible}
      onClearError={() => setConnectionError(null)}
    />
  );
};

// =============================================================================
// ELEVENLABS CONTROLS
// =============================================================================

const ElevenLabsControls: React.FC = () => {
  if (!useVoice31ElevenLabs) {
    return (
      <div className="text-red-500 text-xs">ElevenLabs SDK not available</div>
    );
  }

  const elCtx = useVoice31ElevenLabs();
  if (!elCtx) {
    return (
      <div className="text-red-500 text-xs">ElevenLabs provider not active</div>
    );
  }
  const { startConversation, endConversation, micMuted, setMicMuted } = elCtx;
  const isConnected = useVoice31Store((s) => s.isConnected);
  const isListening = useVoice31Store((s) => s.isListening);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const audioFXVisible = useVoice31Store((s) => s.audioFXVisible);
  const toggleAudioFXVisible = useVoice31Store((s) => s.toggleAudioFXVisible);

  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  const handleConnect = useCallback(async () => {
    if (isConnected || isConnecting) return;

    setIsConnecting(true);
    setConnectionError(null);

    try {
      await startConversation();
    } catch (error) {
      console.error("[Voice31-EL] Connect error:", error);
      setConnectionError(
        error instanceof Error ? error.message : "Connection failed",
      );
    } finally {
      setIsConnecting(false);
    }
  }, [isConnected, isConnecting, startConversation]);

  const handleDisconnect = useCallback(async () => {
    try {
      await endConversation();
    } catch (error) {
      console.error("[Voice31-EL] Disconnect error:", error);
    }
  }, [endConversation]);

  const handleToggleMute = useCallback(() => {
    setMicMuted(!micMuted);
  }, [micMuted, setMicMuted]);

  return (
    <ControlsUI
      effectivelyConnected={isConnected}
      showConnecting={isConnecting}
      isMuted={micMuted}
      isListening={isListening}
      isSpeaking={isSpeaking}
      connectionError={connectionError}
      audioFXVisible={audioFXVisible}
      onConnect={handleConnect}
      onDisconnect={handleDisconnect}
      onToggleMute={handleToggleMute}
      onToggleAudioFX={toggleAudioFXVisible}
      onClearError={() => setConnectionError(null)}
    />
  );
};

// =============================================================================
// SHARED CONTROLS UI
// =============================================================================

interface ControlsUIProps {
  effectivelyConnected: boolean;
  showConnecting: boolean;
  isMuted: boolean;
  isListening: boolean;
  isSpeaking: boolean;
  connectionError: string | null;
  audioFXVisible: boolean;
  onConnect: () => void;
  onDisconnect: () => void;
  onToggleMute: () => void;
  onToggleAudioFX: () => void;
  onClearError: () => void;
}

const ControlsUI: React.FC<ControlsUIProps> = ({
  effectivelyConnected,
  showConnecting,
  isMuted,
  isListening,
  isSpeaking,
  connectionError,
  audioFXVisible,
  onConnect,
  onDisconnect,
  onToggleMute,
  onToggleAudioFX,
  onClearError,
}) => {
  const getStatusColor = () => {
    if (connectionError) return "#ef4444";
    if (showConnecting) return "#f59e0b";
    if (isSpeaking) return "#22c55e";
    if (isListening) return "#eab308";
    if (effectivelyConnected) return "#3b82f6";
    return "#6b7280";
  };

  const getStatusText = () => {
    if (connectionError) return "ERROR";
    if (showConnecting) return "CONNECTING";
    if (isSpeaking) return "SPEAKING";
    if (isListening) return "LISTENING";
    if (effectivelyConnected) return "CONNECTED";
    return "DISCONNECTED";
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
      {/* Error Display */}
      {connectionError && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(239, 68, 68, 0.2)",
            borderColor: "rgba(239, 68, 68, 0.5)",
          }}
        >
          <Warning className="w-4 h-4 text-red-500" weight="bold" />
          <span className="text-xs font-mono text-red-400 max-w-[200px] truncate">
            {connectionError}
          </span>
          <button
            onClick={onClearError}
            className="text-red-400 hover:text-red-300 text-xs ml-1"
          >
            ✕
          </button>
        </div>
      )}

      <div className="flex items-center gap-3">
        {/* Status Indicator */}
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          <div
            className={`w-2 h-2 rounded-full ${showConnecting ? "animate-ping" : "animate-pulse"}`}
            style={{ backgroundColor: getStatusColor() }}
          />
          <span
            className="text-xs font-mono tracking-wider"
            style={{ color: getStatusColor() }}
          >
            {getStatusText()}
          </span>
        </div>

        {/* Control Buttons */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border backdrop-blur-sm"
          style={{
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            borderColor: "rgba(255, 255, 255, 0.1)",
          }}
        >
          {!effectivelyConnected ? (
            <button
              onClick={onConnect}
              disabled={showConnecting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
              style={{
                backgroundColor: showConnecting ? "#6b7280" : "#22c55e",
                color: "#000",
              }}
            >
              {showConnecting ? (
                <Spinner className="w-4 h-4 animate-spin" weight="bold" />
              ) : (
                <Phone className="w-4 h-4" weight="bold" />
              )}
              <span className="text-xs font-medium">
                {showConnecting ? "Connecting..." : "Connect"}
              </span>
            </button>
          ) : (
            <>
              <button
                onClick={onToggleMute}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: isMuted ? "#ef4444" : "#3b82f6",
                  color: "#fff",
                }}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {isMuted ? (
                  <MicrophoneSlash className="w-4 h-4" weight="bold" />
                ) : (
                  <Microphone className="w-4 h-4" weight="bold" />
                )}
              </button>

              <button
                onClick={onDisconnect}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: "#ef4444",
                  color: "#fff",
                }}
                title="Disconnect"
              >
                <PhoneDisconnect className="w-4 h-4" weight="bold" />
              </button>
            </>
          )}
        </div>

        {/* Visualizer indicator */}
        {effectivelyConnected && (
          <div
            className="flex items-center gap-1 px-2 py-2 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: "rgba(0, 0, 0, 0.7)",
              borderColor: "rgba(255, 255, 255, 0.1)",
            }}
          >
            <Waveform
              className="w-4 h-4"
              weight="bold"
              style={{
                color: isSpeaking
                  ? "#22c55e"
                  : isListening
                    ? "#eab308"
                    : "#6b7280",
              }}
            />
          </div>
        )}

        {/* Audio FX Toggle */}
        <button
          onClick={onToggleAudioFX}
          className="flex items-center gap-1 px-2 py-2 rounded-lg border backdrop-blur-sm transition-all"
          style={{
            backgroundColor: audioFXVisible
              ? "rgba(255, 170, 0, 0.2)"
              : "rgba(0, 0, 0, 0.7)",
            borderColor: audioFXVisible
              ? "rgba(255, 170, 0, 0.5)"
              : "rgba(255, 255, 255, 0.1)",
          }}
          title="Audio FX"
        >
          <Faders
            className="w-4 h-4"
            weight="bold"
            style={{
              color: audioFXVisible ? "#ffaa00" : "#6b7280",
            }}
          />
        </button>
      </div>
    </div>
  );
};

// =============================================================================
// UNIFIED CONTROLS EXPORT
// =============================================================================

export const Voice31UnifiedControls: React.FC = () => {
  const { backend } = useVoice31Backend();

  if (backend === "hume") {
    return <HumeControls />;
  }

  return <ElevenLabsControls />;
};

export default Voice31UnifiedControls;
