/**
 * RPGSidebar - Drawer for inventory, quests, journal
 */

import React from 'react';
import {
  View,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Dimensions,
} from 'react-native';
import { X, Backpack, Scroll, BookOpen, MapPin } from 'phosphor-react-native';
import { useRPGStore } from '@/stores/rpg-store';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

const { width } = Dimensions.get('window');

export function RPGSidebar() {
  const visible = useRPGStore(s => s.sidebarVisible);
  const tab = useRPGStore(s => s.sidebarTab);
  const player = useRPGStore(s => s.playerCharacter);
  const quests = useRPGStore(s => s.quests);
  const storyLog = useRPGStore(s => s.storyLog);
  const toggleSidebar = useRPGStore(s => s.toggleSidebar);
  const setSidebarTab = useRPGStore(s => s.setSidebarTab);

  if (!visible) return null;

  const tabs = [
    { id: 'inventory' as const, label: 'ITEMS', icon: Backpack },
    { id: 'quests' as const, label: 'QUESTS', icon: Scroll },
    { id: 'journal' as const, label: 'JOURNAL', icon: BookOpen },
  ];

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.backdrop}>
        <View style={styles.panel}>
          {/* Header */}
          <View style={styles.header}>
            <CRTText size="md" color="amber" bold>
              {tabs.find(t => t.id === tab)?.label}
            </CRTText>
            <TouchableOpacity onPress={toggleSidebar}>
              <X size={24} color={colors.amber} />
            </TouchableOpacity>
          </View>

          {/* Tab bar */}
          <View style={styles.tabBar}>
            {tabs.map(t => (
              <TouchableOpacity
                key={t.id}
                style={[styles.tab, tab === t.id && styles.tabActive]}
                onPress={() => setSidebarTab(t.id)}
              >
                <t.icon
                  size={18}
                  color={tab === t.id ? colors.amber : colors.textMuted}
                  weight={tab === t.id ? 'bold' : 'regular'}
                />
              </TouchableOpacity>
            ))}
          </View>

          {/* Content */}
          <ScrollView style={styles.content}>
            {tab === 'inventory' && player && (
              <>
                {player.inventory.length === 0 ? (
                  <CRTText size="sm" color="amber" dim>
                    No items in inventory
                  </CRTText>
                ) : (
                  player.inventory.map(item => (
                    <View key={item.id} style={styles.itemRow}>
                      <View style={styles.itemInfo}>
                        <CRTText size="sm" color="amber" bold>
                          {item.name}
                        </CRTText>
                        <CRTText size="xs" color="amber" dim>
                          {item.type} | {item.rarity} | {item.value}G
                        </CRTText>
                      </View>
                      {item.quantity > 1 && (
                        <CRTText size="xs" color="amber">
                          x{item.quantity}
                        </CRTText>
                      )}
                    </View>
                  ))
                )}
              </>
            )}

            {tab === 'quests' && (
              <>
                {quests.length === 0 ? (
                  <CRTText size="sm" color="amber" dim>
                    No active quests
                  </CRTText>
                ) : (
                  quests.map(quest => (
                    <View key={quest.id} style={styles.questCard}>
                      <CRTText size="sm" color={quest.status === 'completed' ? 'green' : 'amber'} bold>
                        {quest.name}
                      </CRTText>
                      <CRTText size="xs" color="amber" dim>
                        {quest.description}
                      </CRTText>
                      <CRTText size="xs" color="amber" dim>
                        STATUS: {quest.status.toUpperCase()}
                      </CRTText>
                    </View>
                  ))
                )}
              </>
            )}

            {tab === 'journal' && (
              <>
                {storyLog.length === 0 ? (
                  <CRTText size="sm" color="amber" dim>
                    No journal entries
                  </CRTText>
                ) : (
                  [...storyLog].reverse().slice(0, 50).map(event => (
                    <View key={event.id} style={styles.journalEntry}>
                      <CRTText size="xs" color={event.important ? 'green' : 'amber'} dim>
                        [{event.type.toUpperCase()}]
                      </CRTText>
                      <CRTText size="sm" color="amber">
                        {event.summary}
                      </CRTText>
                    </View>
                  ))
                )}
              </>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  panel: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radii.xl,
    borderTopRightRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border,
    height: '75%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    padding: spacing.md,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: colors.amber,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  itemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  itemInfo: {
    flex: 1,
    gap: 2,
  },
  questCard: {
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    marginBottom: spacing.sm,
    gap: 4,
  },
  journalEntry: {
    padding: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    gap: 2,
  },
});
