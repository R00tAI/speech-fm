/**
 * RPGDialogueOptions - Choice buttons rendered as a bottom sheet
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRPGStore } from '@/stores/rpg-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

export function RPGDialogueOptions() {
  const dialogueOptions = useRPGStore(s => s.activeScene.dialogueOptions);
  const showingOptions = useRPGStore(s => s.activeScene.showingDialogueOptions);
  const selectOption = useRPGStore(s => s.selectDialogueOption);
  const narration = useRPGStore(s => s.activeScene.narrationText);

  if (!showingOptions || dialogueOptions.length === 0) return null;

  const handleSelect = (optionId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    selectOption(optionId);
  };

  return (
    <View style={styles.container}>
      {narration && (
        <CRTText size="sm" color="amber" style={styles.narration}>
          {narration}
        </CRTText>
      )}
      {dialogueOptions.map((option, i) => (
        <TouchableOpacity
          key={option.id}
          style={[styles.option, option.disabled && styles.disabled]}
          onPress={() => handleSelect(option.id)}
          disabled={option.disabled}
          activeOpacity={0.7}
        >
          <CRTText size="xs" color="amber" dim bold>
            [{i + 1}]
          </CRTText>
          <CRTText size="sm" color="amber" style={{ flex: 1 }}>
            {option.text}
          </CRTText>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: spacing.md,
    backgroundColor: `${colors.surface}F2`,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: spacing.sm,
  },
  narration: {
    marginBottom: spacing.sm,
    fontStyle: 'italic',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.background,
  },
  disabled: {
    opacity: 0.4,
  },
});
