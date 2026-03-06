/**
 * VoiceScreen - Main voice assistant interface
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { useVoiceStore } from '@/stores/voice-store';
import { CRTText } from '@/components/common/CRTText';
import { CRTOverlay } from '@/components/common/CRTOverlay';
import { WaveformVisualizer } from './WaveformVisualizer';
import { AssistantText } from './AssistantText';
import { VoiceControls } from './VoiceControls';
import { CreditBalance } from '@/components/billing/CreditBalance';
import { colors, spacing, phosphorColors } from '@/lib/theme';

export function VoiceScreen() {
  const phosphorColor = useVoiceStore(s => s.phosphorColor);
  const assistantText = useVoiceStore(s => s.assistantText);
  const isConnected = useVoiceStore(s => s.isConnected);
  const displayContent = useVoiceStore(s => s.displayContent);
  const persistentImage = useVoiceStore(s => s.persistentImage);
  const palette = phosphorColors[phosphorColor];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Background image layer */}
      {(persistentImage || displayContent.imageUrl) && (
        <View style={styles.backgroundImage}>
          <Image
            source={{ uri: displayContent.imageUrl || persistentImage?.url }}
            style={StyleSheet.absoluteFillObject}
            contentFit="cover"
          />
          <View style={styles.imageOverlay} />
        </View>
      )}

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <CRTText size="lg" color={phosphorColor} glow bold>
            SPEECH.FM
          </CRTText>
        </View>
        <CreditBalance />
      </View>

      {/* Main content area */}
      <View style={styles.content}>
        {/* Status label */}
        <CRTText
          size="xs"
          color={phosphorColor}
          dim
          style={styles.statusLabel}
        >
          {assistantText}
        </CRTText>

        {/* Waveform */}
        <View style={styles.waveformContainer}>
          <WaveformVisualizer
            color={phosphorColor}
            barCount={16}
            height={100}
          />
        </View>

        {/* Text display */}
        <View style={styles.textArea}>
          <AssistantText />
        </View>
      </View>

      {/* Controls */}
      <VoiceControls />

      {/* CRT scanline overlay */}
      <CRTOverlay intensity={0.02} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  imageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.7)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
  },
  statusLabel: {
    letterSpacing: 4,
    marginBottom: spacing.lg,
  },
  waveformContainer: {
    marginBottom: spacing.lg,
  },
  textArea: {
    flex: 1,
    width: '100%',
    maxHeight: 300,
  },
});
