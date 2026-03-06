/**
 * Settings Hub
 */

import React from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth, useUser } from '@clerk/clerk-expo';
import {
  User,
  CreditCard,
  Microphone,
  SignOut,
  CaretRight,
  Info,
} from 'phosphor-react-native';
import { CRTText } from '@/components/common/CRTText';
import { CRTOverlay } from '@/components/common/CRTOverlay';
import { colors, spacing, radii } from '@/lib/theme';

export default function SettingsScreen() {
  const router = useRouter();
  const { signOut } = useAuth();
  const { user } = useUser();

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Sign Out', style: 'destructive', onPress: () => signOut() },
      ]
    );
  };

  const menuItems = [
    {
      icon: User,
      label: 'PROFILE',
      subtitle: user?.emailAddresses[0]?.emailAddress || 'User',
      onPress: () => router.push('/(app)/settings/profile'),
    },
    {
      icon: CreditCard,
      label: 'BILLING',
      subtitle: 'Manage subscription & credits',
      onPress: () => router.push('/(app)/settings/billing'),
    },
    {
      icon: Microphone,
      label: 'VOICE',
      subtitle: 'Voice preferences & model',
      onPress: () => router.push('/(app)/settings/voice'),
    },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <CRTText size="lg" color="amber" glow bold>
          SETTINGS
        </CRTText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* User info */}
        <View style={styles.userCard}>
          <View style={styles.avatar}>
            <CRTText size="xl" color="amber" bold>
              {(user?.firstName?.charAt(0) || user?.emailAddresses[0]?.emailAddress?.charAt(0) || '?').toUpperCase()}
            </CRTText>
          </View>
          <View>
            <CRTText size="md" color="amber" bold>
              {user?.firstName || 'Operator'}
            </CRTText>
            <CRTText size="xs" color="amber" dim>
              {user?.emailAddresses[0]?.emailAddress}
            </CRTText>
          </View>
        </View>

        {/* Menu items */}
        {menuItems.map((item, i) => (
          <TouchableOpacity
            key={i}
            style={styles.menuItem}
            onPress={item.onPress}
            activeOpacity={0.7}
          >
            <item.icon size={20} color={colors.amber} weight="bold" />
            <View style={styles.menuItemText}>
              <CRTText size="sm" color="amber" bold>
                {item.label}
              </CRTText>
              <CRTText size="xs" color="amber" dim>
                {item.subtitle}
              </CRTText>
            </View>
            <CaretRight size={16} color={colors.textMuted} />
          </TouchableOpacity>
        ))}

        {/* Sign out */}
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <SignOut size={20} color={colors.error} weight="bold" />
          <CRTText size="sm" color="red" bold>
            SIGN OUT
          </CRTText>
        </TouchableOpacity>

        {/* Version */}
        <View style={styles.versionRow}>
          <Info size={14} color={colors.textMuted} />
          <CRTText size="xs" color="white" dim>
            Speech.FM v1.0.0
          </CRTText>
        </View>
      </ScrollView>

      <CRTOverlay intensity={0.02} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.surfaceLight,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.amber,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  menuItemText: {
    flex: 1,
    gap: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    padding: spacing.md,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: `${colors.error}44`,
    marginTop: spacing.lg,
  },
  versionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.lg,
  },
});
