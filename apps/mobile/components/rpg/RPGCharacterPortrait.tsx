/**
 * RPGCharacterPortrait - NPC portrait cards
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Image } from 'expo-image';
import Animated, { useAnimatedStyle, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import type { NPCharacter } from '@/stores/rpg-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

interface RPGCharacterPortraitProps {
  npc: NPCharacter;
}

export function RPGCharacterPortrait({ npc }: RPGCharacterPortraitProps) {
  const speakingStyle = useAnimatedStyle(() => {
    if (!npc.isSpeaking) return { borderColor: colors.border };
    return {
      borderColor: withRepeat(
        withSequence(
          withTiming(colors.amber, { duration: 500 }),
          withTiming(colors.border, { duration: 500 }),
        ),
        -1,
        true,
      ),
    };
  });

  const relationshipColor = npc.relationship > 30
    ? colors.green
    : npc.relationship < -30
      ? colors.red
      : colors.amber;

  return (
    <Animated.View style={[styles.container, speakingStyle]}>
      {npc.portraitUrl ? (
        <Image
          source={{ uri: npc.portraitUrl }}
          style={styles.portrait}
          contentFit="cover"
          transition={300}
        />
      ) : (
        <View style={[styles.portrait, styles.placeholder]}>
          <CRTText size="xl" color="amber" bold>
            {npc.name.charAt(0)}
          </CRTText>
        </View>
      )}

      <View style={styles.info}>
        <CRTText size="xs" color="amber" bold numberOfLines={1}>
          {npc.name.toUpperCase()}
        </CRTText>
        {npc.title && (
          <CRTText size="xs" color="amber" dim numberOfLines={1}>
            {npc.title}
          </CRTText>
        )}
        <View style={[styles.relationshipBar, { backgroundColor: `${relationshipColor}33` }]}>
          <View
            style={[
              styles.relationshipFill,
              {
                backgroundColor: relationshipColor,
                width: `${Math.abs(npc.relationship)}%`,
              },
            ]}
          />
        </View>
      </View>

      {npc.isSpeaking && npc.currentDialogue && (
        <View style={styles.dialogue}>
          <CRTText size="xs" color="amber" numberOfLines={3}>
            "{npc.currentDialogue}"
          </CRTText>
        </View>
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.md,
    backgroundColor: `${colors.surface}E6`,
    overflow: 'hidden',
    width: 140,
  },
  portrait: {
    width: '100%',
    height: 140,
  },
  placeholder: {
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  info: {
    padding: spacing.sm,
    gap: 2,
  },
  relationshipBar: {
    height: 3,
    borderRadius: 1.5,
    marginTop: 4,
    overflow: 'hidden',
  },
  relationshipFill: {
    height: '100%',
    borderRadius: 1.5,
  },
  dialogue: {
    padding: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: `${colors.background}CC`,
  },
});
