/**
 * RPG Tab - RPG game screen
 */

import React from 'react';
import { View, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRPGStore } from '@/stores/rpg-store';
import { useVoiceStore } from '@/stores/voice-store';
import { VoiceProvider } from '@/components/voice/VoiceProvider';
import { VoiceControls } from '@/components/voice/VoiceControls';
import { WaveformVisualizer } from '@/components/voice/WaveformVisualizer';
import { RPGBackground } from '@/components/rpg/RPGBackground';
import { RPGCharacterPortrait } from '@/components/rpg/RPGCharacterPortrait';
import { RPGDialogueOptions } from '@/components/rpg/RPGDialogueOptions';
import { RPGOverlay } from '@/components/rpg/RPGOverlay';
import { RPGSidebar } from '@/components/rpg/RPGSidebar';
import { RPGCharacterCreator } from '@/components/rpg/RPGCharacterCreator';
import { CRTText } from '@/components/common/CRTText';
import { CRTOverlay } from '@/components/common/CRTOverlay';
import { CreditBalance } from '@/components/billing/CreditBalance';
import { colors, spacing } from '@/lib/theme';

function RPGContent() {
  const rpgActive = useRPGStore(s => s.rpgModeActive);
  const player = useRPGStore(s => s.playerCharacter);
  const activeNPCs = useRPGStore(s => s.activeScene.activeNPCs);
  const narration = useRPGStore(s => s.activeScene.narrationText);
  const phosphorColor = useVoiceStore(s => s.phosphorColor);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background */}
      <RPGBackground />

      {/* Header */}
      <View style={styles.header}>
        <CRTText size="lg" color="amber" glow bold>
          RPG MODE
        </CRTText>
        <CreditBalance />
      </View>

      {rpgActive && player ? (
        <View style={styles.content}>
          {/* RPG Stats Overlay */}
          <RPGOverlay />

          {/* NPC Portraits */}
          {activeNPCs.length > 0 && (
            <ScrollView
              horizontal
              style={styles.npcRow}
              contentContainerStyle={styles.npcRowContent}
              showsHorizontalScrollIndicator={false}
            >
              {activeNPCs.filter(n => n.isVisible).map(npc => (
                <RPGCharacterPortrait key={npc.id} npc={npc} />
              ))}
            </ScrollView>
          )}

          {/* Narration text */}
          {narration && (
            <View style={styles.narrationBox}>
              <CRTText size="sm" color="amber" glow>
                {narration}
              </CRTText>
            </View>
          )}

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Waveform */}
          <View style={styles.waveformArea}>
            <WaveformVisualizer color={phosphorColor} barCount={16} height={60} />
          </View>

          {/* Dialogue options */}
          <RPGDialogueOptions />

          {/* Voice controls */}
          <VoiceControls />
        </View>
      ) : (
        <View style={styles.emptyState}>
          <CRTText size="lg" color="amber" glow bold>
            RPG MODE
          </CRTText>
          <CRTText size="sm" color="amber" dim style={{ textAlign: 'center', marginTop: spacing.md }}>
            Connect to voice and say "start an RPG adventure" to begin your quest.
          </CRTText>
          <View style={{ marginTop: spacing.lg }}>
            <VoiceControls />
          </View>
        </View>
      )}

      {/* Sidebar */}
      <RPGSidebar />

      {/* Character Creator */}
      <RPGCharacterCreator />

      {/* CRT overlay */}
      <CRTOverlay intensity={0.02} />
    </SafeAreaView>
  );
}

export default function RPGTab() {
  return (
    <VoiceProvider>
      <RPGContent />
    </VoiceProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    zIndex: 10,
  },
  content: {
    flex: 1,
  },
  npcRow: {
    maxHeight: 220,
    marginTop: 80,
  },
  npcRowContent: {
    paddingHorizontal: spacing.md,
    gap: spacing.md,
  },
  narrationBox: {
    marginHorizontal: spacing.md,
    marginTop: spacing.md,
    padding: spacing.md,
    backgroundColor: `${colors.background}CC`,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  waveformArea: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
});
