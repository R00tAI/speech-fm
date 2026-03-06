'use client';

/**
 * Voice31 Controls
 *
 * Control panel for Voice31 - connect, mute, disconnect.
 * Positioned as overlay on CRT display.
 *
 * Auth and configId are passed to VoiceProvider in Voice31Provider.tsx.
 */

import React, { useState, useRef, useCallback } from 'react';
import { useVoice, VoiceReadyState } from '@humeai/voice-react';
import { useVoice31Store } from './Voice31Store';
import { useVoice31Context, VOICE26_CONFIG_ID } from './Voice31Provider';
import {
  Microphone,
  MicrophoneSlash,
  Phone,
  PhoneDisconnect,
  Waveform,
  Warning,
  Spinner,
  Faders,
} from '@phosphor-icons/react';

// =============================================================================
// VOICE26 CONTROLS
// =============================================================================

export const Voice31Controls: React.FC = () => {
  const {
    connect,
    disconnect,
    readyState,
    status,
    isMuted,
    mute,
    unmute,
  } = useVoice();

  const { accessToken } = useVoice31Context();
  const isConnected = useVoice31Store((s) => s.isConnected);
  const isListening = useVoice31Store((s) => s.isListening);
  const isSpeaking = useVoice31Store((s) => s.isSpeaking);
  const audioFXVisible = useVoice31Store((s) => s.audioFXVisible);
  const toggleAudioFXVisible = useVoice31Store((s) => s.toggleAudioFXVisible);

  // Local state for connection in progress and errors
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const connectInFlightRef = useRef(false);

  // Resolve ready state with fallbacks (matches hume-voice.ts pattern)
  const resolvedReadyState = readyState ?? (status as any)?.value ?? VoiceReadyState.CLOSED;
  const isActuallyConnected = resolvedReadyState === VoiceReadyState.OPEN;
  const isCurrentlyConnecting = resolvedReadyState === VoiceReadyState.CONNECTING;

  const handleConnect = useCallback(async () => {
    // Prevent double-click / race condition
    if (connectInFlightRef.current) {
      console.warn('[Voice31] Connection already in flight, ignoring');
      return;
    }

    // Check if already connected or connecting
    if (isActuallyConnected || isCurrentlyConnecting) {
      console.warn('[Voice31] Already connected or connecting, ignoring');
      return;
    }

    // Validate token
    if (!accessToken) {
      console.error('[Voice31] No access token available');
      setConnectionError('No access token - try refreshing the page');
      return;
    }

    connectInFlightRef.current = true;
    setIsConnecting(true);
    setConnectionError(null);

    try {
      console.log('[Voice31] Connecting with auth and configId...', {
        hasToken: !!accessToken,
        tokenLength: accessToken?.length,
        configId: VOICE26_CONFIG_ID,
      });

      // Pass auth and configId to connect
      const connectResult = await connect({
        auth: {
          type: 'accessToken',
          value: accessToken,
        },
        configId: VOICE26_CONFIG_ID,
      });

      console.log('[Voice31] Connect call returned:', connectResult);

      // Wait for state to settle and check if actually connected
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check if we actually connected
      const currentReadyState = readyState ?? (status as any)?.value;
      console.log('[Voice31] Post-connect readyState:', currentReadyState);

      if (currentReadyState === VoiceReadyState.CLOSED || currentReadyState === 'closed') {
        throw new Error('Connection closed immediately - check configId or Hume dashboard');
      }

      console.log('[Voice31] Connected successfully');
    } catch (error) {
      console.error('[Voice31] Connect error:', error);
      const errorMsg = error instanceof Error ? error.message : 'Connection failed';
      setConnectionError(errorMsg);
    } finally {
      connectInFlightRef.current = false;
      setIsConnecting(false);
    }
  }, [accessToken, connect, isActuallyConnected, isCurrentlyConnecting, readyState, status]);

  const handleDisconnect = () => {
    disconnect();
  };

  const handleToggleMute = () => {
    if (isMuted) {
      unmute();
    } else {
      mute();
    }
  };

  // Use both store state and actual SDK state for reliability
  const effectivelyConnected = isConnected || isActuallyConnected;
  const showConnecting = isConnecting || isCurrentlyConnecting;

  // Status indicator color
  const getStatusColor = () => {
    if (connectionError) return '#ef4444'; // red - error
    if (showConnecting) return '#f59e0b'; // orange - connecting
    if (isSpeaking) return '#22c55e'; // green - speaking
    if (isListening) return '#eab308'; // yellow - listening
    if (effectivelyConnected) return '#3b82f6'; // blue - connected idle
    return '#6b7280'; // gray - disconnected
  };

  const getStatusText = () => {
    if (connectionError) return 'ERROR';
    if (showConnecting) return 'CONNECTING';
    if (isSpeaking) return 'SPEAKING';
    if (isListening) return 'LISTENING';
    if (effectivelyConnected) return 'CONNECTED';
    return 'DISCONNECTED';
  };

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 z-50">
      {/* Error Display */}
      {connectionError && (
        <div
          className="flex items-center gap-2 px-3 py-2 rounded-lg border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.2)',
            borderColor: 'rgba(239, 68, 68, 0.5)',
          }}
        >
          <Warning className="w-4 h-4 text-red-500" weight="bold" />
          <span className="text-xs font-mono text-red-400 max-w-[200px] truncate">
            {connectionError}
          </span>
          <button
            onClick={() => setConnectionError(null)}
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
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          <div
            className={`w-2 h-2 rounded-full ${showConnecting ? 'animate-ping' : 'animate-pulse'}`}
            style={{ backgroundColor: getStatusColor() }}
          />
          <span className="text-xs font-mono tracking-wider" style={{ color: getStatusColor() }}>
            {getStatusText()}
          </span>
        </div>

        {/* Control Buttons */}
        <div
          className="flex items-center gap-1 px-2 py-1.5 rounded-lg border backdrop-blur-sm"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
          }}
        >
          {!effectivelyConnected ? (
            // Connect Button
            <button
              onClick={handleConnect}
              disabled={showConnecting}
              className="flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
              style={{
                backgroundColor: showConnecting ? '#6b7280' : '#22c55e',
                color: '#000',
              }}
            >
              {showConnecting ? (
                <Spinner className="w-4 h-4 animate-spin" weight="bold" />
              ) : (
                <Phone className="w-4 h-4" weight="bold" />
              )}
              <span className="text-xs font-medium">
                {showConnecting ? 'Connecting...' : 'Connect'}
              </span>
            </button>
          ) : (
            <>
              {/* Mute/Unmute Button */}
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: isMuted ? '#ef4444' : '#3b82f6',
                  color: '#fff',
                }}
                title={isMuted ? 'Unmute' : 'Mute'}
              >
                {isMuted ? (
                  <MicrophoneSlash className="w-4 h-4" weight="bold" />
                ) : (
                  <Microphone className="w-4 h-4" weight="bold" />
                )}
              </button>

              {/* Disconnect Button */}
              <button
                onClick={handleDisconnect}
                className="p-2 rounded-md transition-colors"
                style={{
                  backgroundColor: '#ef4444',
                  color: '#fff',
                }}
                title="Disconnect"
              >
                <PhoneDisconnect className="w-4 h-4" weight="bold" />
              </button>
            </>
          )}
        </div>

        {/* Visualizer indicator when active */}
        {effectivelyConnected && (
          <div
            className="flex items-center gap-1 px-2 py-2 rounded-lg border backdrop-blur-sm"
            style={{
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              borderColor: 'rgba(255, 255, 255, 0.1)',
            }}
          >
            <Waveform
              className="w-4 h-4"
              weight="bold"
              style={{
                color: isSpeaking ? '#22c55e' : isListening ? '#eab308' : '#6b7280',
              }}
            />
          </div>
        )}

        {/* Audio FX Toggle */}
        <button
          onClick={toggleAudioFXVisible}
          className="flex items-center gap-1 px-2 py-2 rounded-lg border backdrop-blur-sm transition-all"
          style={{
            backgroundColor: audioFXVisible ? 'rgba(255, 170, 0, 0.2)' : 'rgba(0, 0, 0, 0.7)',
            borderColor: audioFXVisible ? 'rgba(255, 170, 0, 0.5)' : 'rgba(255, 255, 255, 0.1)',
          }}
          title="Audio FX"
        >
          <Faders
            className="w-4 h-4"
            weight="bold"
            style={{
              color: audioFXVisible ? '#ffaa00' : '#6b7280',
            }}
          />
        </button>
      </div>
    </div>
  );
};

export default Voice31Controls;
