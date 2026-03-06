/**
 * Voice Settings - Voice preferences and configuration
 */

import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { CaretLeft } from 'phosphor-react-native';
import { useVoiceStore, type PhosphorColor } from '@/stores/voice-store';
import { persistSettings } from '@/stores/voice-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, phosphorColors, spacing, radii } from '@/lib/theme';

const COLOR_OPTIONS: { id: PhosphorColor; label: string }[] = [
  { id: 'amber', label: 'AMBER' },
  { id: 'green', label: 'GREEN' },
  { id: 'blue', label: 'BLUE' },
  { id: 'red', label: 'RED' },
  { id: 'white', label: 'WHITE' },
];

export default function VoiceSettingsScreen() {
  const router = useRouter();
  const currentColor = useVoiceStore(s => s.phosphorColor);
  const setColor = useVoiceStore(s => s.setPhosphorColor);

  const handleColorChange = (color: PhosphorColor) => {
    Haptics.selectionAsync();
    setColor(color);
    persistSettings();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeft size={24} color={colors.amber} />
        </TouchableOpacity>
        <CRTText size="md" color="amber" bold>
          VOICE SETTINGS
        </CRTText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Phosphor color */}
        <CRTText size="xs" color="amber" dim style={styles.sectionLabel}>
          DISPLAY COLOR
        </CRTText>
        <View style={styles.colorGrid}>
          {COLOR_OPTIONS.map(c => {
            const palette = phosphorColors[c.id];
            return (
              <TouchableOpacity
                key={c.id}
                style={[
                  styles.colorOption,
                  {
                    borderColor: currentColor === c.id ? palette.primary : colors.border,
                    backgroundColor: currentColor === c.id ? `${palette.primary}15` : colors.surface,
                  },
                ]}
                onPress={() => handleColorChange(c.id)}
              >
                <View style={[styles.colorDot, { backgroundColor: palette.primary }]} />
                <CRTText
                  size="xs"
                  color={c.id}
                  bold={currentColor === c.id}
                >
                  {c.label}
                </CRTText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Voice backend info */}
        <CRTText size="xs" color="amber" dim style={styles.sectionLabel}>
          VOICE ENGINE
        </CRTText>
        <View style={styles.infoCard}>
          <CRTText size="sm" color="amber" bold>
            ElevenLabs Conversational AI
          </CRTText>
          <CRTText size="xs" color="amber" dim>
            Real-time voice conversations with tool calling support
          </CRTText>
        </View>
      </ScrollView>
    </SafeAreaView>
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
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  sectionLabel: {
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  colorOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderRadius: radii.sm,
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  infoCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.xs,
  },
});
