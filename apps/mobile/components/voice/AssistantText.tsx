/**
 * AssistantText - Animated text display with CRT phosphor glow
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import { useVoiceStore } from '@/stores/voice-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing } from '@/lib/theme';

export function AssistantText() {
  const displayContent = useVoiceStore(s => s.displayContent);
  const overlayText = useVoiceStore(s => s.overlayText);
  const phosphorColor = useVoiceStore(s => s.phosphorColor);

  const textToShow = overlayText || displayContent.text || '';

  if (displayContent.type === 'list' && displayContent.list) {
    return (
      <ScrollView style={styles.container} contentContainerStyle={styles.listContent}>
        {displayContent.listTitle && (
          <CRTText size="lg" color={phosphorColor} glow bold style={styles.listTitle}>
            {displayContent.listTitle.toUpperCase()}
          </CRTText>
        )}
        {displayContent.list.map((item, i) => (
          <View key={i} style={styles.listItem}>
            <CRTText size="sm" color={phosphorColor} dim>
              [{String(i + 1).padStart(2, '0')}]
            </CRTText>
            <CRTText size="sm" color={phosphorColor} style={{ flex: 1 }}>
              {item}
            </CRTText>
          </View>
        ))}
      </ScrollView>
    );
  }

  if (displayContent.type === 'generating') {
    return (
      <View style={styles.container}>
        <CRTText size="sm" color={phosphorColor} glow>
          GENERATING IMAGE...
        </CRTText>
        <CRTText size="xs" color={phosphorColor} dim style={{ marginTop: spacing.sm }}>
          {displayContent.imagePrompt}
        </CRTText>
      </View>
    );
  }

  if (!textToShow && displayContent.type === null) {
    return null;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.textContent}>
      <CRTText size="sm" color={phosphorColor} glow>
        {textToShow}
      </CRTText>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    maxHeight: 300,
  },
  textContent: {
    padding: spacing.md,
  },
  listContent: {
    padding: spacing.md,
    gap: spacing.sm,
  },
  listTitle: {
    marginBottom: spacing.sm,
    letterSpacing: 2,
  },
  listItem: {
    flexDirection: 'row',
    gap: spacing.sm,
    alignItems: 'flex-start',
  },
});
