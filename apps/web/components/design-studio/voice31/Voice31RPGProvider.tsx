'use client';

/**
 * Voice31 RPG Provider
 *
 * Context wrapper that manages RPG mode state and provides
 * RPG-specific functionality to child components.
 */

import React, { createContext, useContext, useEffect, useCallback, useRef } from 'react';
import { useVoice31RPGStore, type RPGSaveFile, type RPGSettings } from './Voice31RPGStore';

// =============================================================================
// CONTEXT
// =============================================================================

interface Voice31RPGContextType {
  // Mode State
  isRPGMode: boolean;
  isInitialized: boolean;

  // Current Game
  currentGame: RPGSaveFile | null;
  savedGames: RPGSaveFile[];

  // Quick Access
  playerName: string | null;
  playerLevel: number;
  playerHealth: number;
  playerMaxHealth: number;
  playerMana: number;
  playerMaxMana: number;
  playerGold: number;
  currentLocationName: string | null;

  // Settings
  settings: RPGSettings | null;

  // Actions
  startNewGame: () => void;
  quickSave: () => void;
  toggleRPGMode: () => void;
}

const Voice31RPGContext = createContext<Voice31RPGContextType | null>(null);

export const useVoice31RPG = () => {
  const context = useContext(Voice31RPGContext);
  if (!context) {
    throw new Error('useVoice31RPG must be used within Voice31RPGProvider');
  }
  return context;
};

// Optional hook that doesn't throw
export const useVoice31RPGOptional = () => {
  return useContext(Voice31RPGContext);
};

// =============================================================================
// PROVIDER
// =============================================================================

interface Voice31RPGProviderProps {
  children: React.ReactNode;
  autoInitialize?: boolean;
}

export const Voice31RPGProvider: React.FC<Voice31RPGProviderProps> = ({
  children,
  autoInitialize = false,
}) => {
  const autoSaveIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Store selectors
  const rpgModeActive = useVoice31RPGStore((s) => s.rpgModeActive);
  const rpgModeInitialized = useVoice31RPGStore((s) => s.rpgModeInitialized);
  const currentSaveFile = useVoice31RPGStore((s) => s.currentSaveFile);
  const savedGames = useVoice31RPGStore((s) => s.savedGames);
  const activeScene = useVoice31RPGStore((s) => s.activeScene);
  const lastAutoSave = useVoice31RPGStore((s) => s.lastAutoSave);

  // Store actions
  const enableRPGMode = useVoice31RPGStore((s) => s.enableRPGMode);
  const disableRPGMode = useVoice31RPGStore((s) => s.disableRPGMode);
  const initializeRPGMode = useVoice31RPGStore((s) => s.initializeRPGMode);
  const toggleCharacterCreator = useVoice31RPGStore((s) => s.toggleCharacterCreator);
  const saveGame = useVoice31RPGStore((s) => s.saveGame);

  // Derived values
  const player = currentSaveFile?.player;
  const settings = currentSaveFile?.settings || null;

  // Auto-initialize if requested
  useEffect(() => {
    if (autoInitialize && !rpgModeInitialized) {
      initializeRPGMode();
    }
  }, [autoInitialize, rpgModeInitialized, initializeRPGMode]);

  // Auto-save functionality
  useEffect(() => {
    if (!rpgModeActive || !currentSaveFile || !settings?.autoSave) {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
        autoSaveIntervalRef.current = null;
      }
      return;
    }

    const intervalMs = (settings.autoSaveInterval || 60) * 1000;

    autoSaveIntervalRef.current = setInterval(() => {
      const now = Date.now();
      const timeSinceLastSave = now - lastAutoSave;

      if (timeSinceLastSave >= intervalMs) {
        console.log('[Voice31-RPG] Auto-saving...');
        saveGame();
      }
    }, 10000); // Check every 10 seconds

    return () => {
      if (autoSaveIntervalRef.current) {
        clearInterval(autoSaveIntervalRef.current);
      }
    };
  }, [rpgModeActive, currentSaveFile, settings, lastAutoSave, saveGame]);

  // Play time tracking
  useEffect(() => {
    if (!rpgModeActive || !currentSaveFile) return;

    const interval = setInterval(() => {
      // Update play time in store
      useVoice31RPGStore.setState((state) => {
        if (!state.currentSaveFile) return state;
        return {
          currentSaveFile: {
            ...state.currentSaveFile,
            playTime: state.currentSaveFile.playTime + 1,
          },
        };
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [rpgModeActive, currentSaveFile]);

  // Actions
  const startNewGame = useCallback(() => {
    toggleCharacterCreator();
  }, [toggleCharacterCreator]);

  const quickSave = useCallback(() => {
    if (currentSaveFile) {
      saveGame();
      console.log('[Voice31-RPG] Quick save completed');
    }
  }, [currentSaveFile, saveGame]);

  const toggleRPGMode = useCallback(() => {
    if (rpgModeActive) {
      // Save before disabling
      if (currentSaveFile) {
        saveGame();
      }
      disableRPGMode();
    } else {
      enableRPGMode();
      if (!currentSaveFile && savedGames.length === 0) {
        // No saves, open character creator
        toggleCharacterCreator();
      }
    }
  }, [rpgModeActive, currentSaveFile, savedGames, enableRPGMode, disableRPGMode, saveGame, toggleCharacterCreator]);

  // Context value
  const contextValue: Voice31RPGContextType = {
    isRPGMode: rpgModeActive,
    isInitialized: rpgModeInitialized,
    currentGame: currentSaveFile,
    savedGames,
    playerName: player?.name || null,
    playerLevel: player?.stats.level || 1,
    playerHealth: player?.stats.health || 0,
    playerMaxHealth: player?.stats.maxHealth || 100,
    playerMana: player?.stats.mana || 0,
    playerMaxMana: player?.stats.maxMana || 50,
    playerGold: player?.gold || 0,
    currentLocationName: activeScene.location?.name || null,
    settings,
    startNewGame,
    quickSave,
    toggleRPGMode,
  };

  return (
    <Voice31RPGContext.Provider value={contextValue}>
      {children}
    </Voice31RPGContext.Provider>
  );
};

export default Voice31RPGProvider;
