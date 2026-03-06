/**
 * RPGOverlay - Stats HUD overlay
 */

import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Heart, Drop, Sword, Backpack } from 'phosphor-react-native';
import { useRPGStore } from '@/stores/rpg-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

export function RPGOverlay() {
  const player = useRPGStore(s => s.playerCharacter);
  const locationName = useRPGStore(s => s.activeScene.locationName);
  const toggleSidebar = useRPGStore(s => s.toggleSidebar);

  if (!player) return null;

  const healthPercent = (player.stats.health / player.stats.maxHealth) * 100;
  const manaPercent = (player.stats.mana / player.stats.maxMana) * 100;

  return (
    <View style={styles.container}>
      {/* Location name */}
      {locationName && (
        <View style={styles.locationBadge}>
          <CRTText size="xs" color="amber" dim>
            {locationName.toUpperCase()}
          </CRTText>
        </View>
      )}

      {/* Stats HUD */}
      <View style={styles.statsRow}>
        {/* Health bar */}
        <View style={styles.statGroup}>
          <Heart size={14} color={colors.red} weight="fill" />
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${healthPercent}%`, backgroundColor: colors.red }]} />
          </View>
          <CRTText size="xs" color="red">
            {player.stats.health}
          </CRTText>
        </View>

        {/* Mana bar */}
        <View style={styles.statGroup}>
          <Drop size={14} color={colors.blue} weight="fill" />
          <View style={styles.barContainer}>
            <View style={[styles.barFill, { width: `${manaPercent}%`, backgroundColor: colors.blue }]} />
          </View>
          <CRTText size="xs" color="blue">
            {player.stats.mana}
          </CRTText>
        </View>

        {/* Level */}
        <View style={styles.statGroup}>
          <Sword size={14} color={colors.amber} weight="bold" />
          <CRTText size="xs" color="amber">
            LV.{player.stats.level}
          </CRTText>
        </View>

        {/* Gold */}
        <CRTText size="xs" color="amber" bold>
          {player.gold}G
        </CRTText>

        {/* Inventory button */}
        <TouchableOpacity onPress={toggleSidebar} style={styles.inventoryBtn}>
          <Backpack size={18} color={colors.amber} weight="bold" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    padding: spacing.sm,
    gap: spacing.sm,
  },
  locationBadge: {
    alignSelf: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.background}CC`,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    backgroundColor: `${colors.background}CC`,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  statGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  barContainer: {
    width: 50,
    height: 6,
    backgroundColor: colors.surfaceLight,
    borderRadius: 3,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  inventoryBtn: {
    marginLeft: 'auto',
    padding: 4,
  },
});
