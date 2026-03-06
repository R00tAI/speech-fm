/**
 * RPGCharacterCreator - Character creation flow
 */

import React, { useState } from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Modal,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useRPGStore, DEFAULT_STATS } from '@/stores/rpg-store';
import type { PlayerRace, PlayerClass, PlayerCharacter } from '@/stores/rpg-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

const RACES: { id: PlayerRace; label: string }[] = [
  { id: 'human', label: 'HUMAN' },
  { id: 'elf', label: 'ELF' },
  { id: 'dwarf', label: 'DWARF' },
  { id: 'halfling', label: 'HALFLING' },
  { id: 'orc', label: 'ORC' },
  { id: 'tiefling', label: 'TIEFLING' },
  { id: 'dragonborn', label: 'DRAGONBORN' },
];

const CLASSES: { id: PlayerClass; label: string }[] = [
  { id: 'warrior', label: 'WARRIOR' },
  { id: 'mage', label: 'MAGE' },
  { id: 'rogue', label: 'ROGUE' },
  { id: 'ranger', label: 'RANGER' },
  { id: 'cleric', label: 'CLERIC' },
  { id: 'paladin', label: 'PALADIN' },
  { id: 'bard', label: 'BARD' },
];

export function RPGCharacterCreator() {
  const showCreator = useRPGStore(s => s.showCharacterCreator);
  const setShowCreator = useRPGStore(s => s.setShowCharacterCreator);
  const setPlayerCharacter = useRPGStore(s => s.setPlayerCharacter);

  const [name, setName] = useState('');
  const [race, setRace] = useState<PlayerRace>('human');
  const [playerClass, setPlayerClass] = useState<PlayerClass>('warrior');
  const [backstory, setBackstory] = useState('');

  if (!showCreator) return null;

  const handleCreate = () => {
    if (!name.trim()) return;

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const character: PlayerCharacter = {
      id: `player_${Date.now()}`,
      name: name.trim(),
      race,
      class: playerClass,
      backstory: backstory.trim() || 'A wandering adventurer seeking fortune.',
      personality: [],
      appearance: '',
      stats: { ...DEFAULT_STATS },
      inventory: [],
      gold: 50,
      createdAt: Date.now(),
    };

    setPlayerCharacter(character);
    setShowCreator(false);
  };

  return (
    <Modal visible={showCreator} animationType="slide">
      <View style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <CRTText size="xl" color="amber" glow bold style={styles.title}>
            CREATE YOUR CHARACTER
          </CRTText>

          {/* Name */}
          <CRTText size="xs" color="amber" dim style={styles.label}>
            CHARACTER NAME
          </CRTText>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Enter name..."
            placeholderTextColor={colors.textMuted}
          />

          {/* Race */}
          <CRTText size="xs" color="amber" dim style={styles.label}>
            RACE
          </CRTText>
          <View style={styles.optionGrid}>
            {RACES.map(r => (
              <TouchableOpacity
                key={r.id}
                style={[styles.optionButton, race === r.id && styles.optionSelected]}
                onPress={() => { setRace(r.id); Haptics.selectionAsync(); }}
              >
                <CRTText
                  size="xs"
                  color={race === r.id ? 'amber' : 'white'}
                  bold={race === r.id}
                >
                  {r.label}
                </CRTText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Class */}
          <CRTText size="xs" color="amber" dim style={styles.label}>
            CLASS
          </CRTText>
          <View style={styles.optionGrid}>
            {CLASSES.map(c => (
              <TouchableOpacity
                key={c.id}
                style={[styles.optionButton, playerClass === c.id && styles.optionSelected]}
                onPress={() => { setPlayerClass(c.id); Haptics.selectionAsync(); }}
              >
                <CRTText
                  size="xs"
                  color={playerClass === c.id ? 'amber' : 'white'}
                  bold={playerClass === c.id}
                >
                  {c.label}
                </CRTText>
              </TouchableOpacity>
            ))}
          </View>

          {/* Backstory */}
          <CRTText size="xs" color="amber" dim style={styles.label}>
            BACKSTORY (OPTIONAL)
          </CRTText>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={backstory}
            onChangeText={setBackstory}
            placeholder="Tell us your story..."
            placeholderTextColor={colors.textMuted}
            multiline
            numberOfLines={4}
          />

          {/* Create button */}
          <TouchableOpacity
            style={[styles.createButton, !name.trim() && styles.disabled]}
            onPress={handleCreate}
            disabled={!name.trim()}
          >
            <CRTText size="md" color="amber" bold>
              {'> BEGIN ADVENTURE'}
            </CRTText>
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingTop: spacing.xxl + spacing.lg,
    gap: spacing.sm,
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    letterSpacing: 2,
  },
  label: {
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    padding: spacing.md,
    color: colors.amber,
    fontFamily: 'SpaceMono-Regular',
    fontSize: 14,
  },
  textArea: {
    height: 100,
    textAlignVertical: 'top',
  },
  optionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  optionButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    backgroundColor: colors.surface,
  },
  optionSelected: {
    borderColor: colors.amber,
    backgroundColor: `${colors.amber}15`,
  },
  createButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: radii.sm,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  disabled: {
    opacity: 0.4,
  },
});
