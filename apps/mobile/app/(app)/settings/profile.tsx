/**
 * Profile Screen - User profile info from Clerk
 */

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useUser } from '@clerk/clerk-expo';
import { CaretLeft, User } from 'phosphor-react-native';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

export default function ProfileScreen() {
  const router = useRouter();
  const { user } = useUser();

  const fields = [
    { label: 'NAME', value: `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'Not set' },
    { label: 'EMAIL', value: user?.emailAddresses[0]?.emailAddress || 'N/A' },
    { label: 'USER ID', value: user?.id || 'N/A' },
    { label: 'JOINED', value: user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeft size={24} color={colors.amber} />
        </TouchableOpacity>
        <CRTText size="md" color="amber" bold>
          PROFILE
        </CRTText>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        {/* Avatar */}
        <View style={styles.avatarLarge}>
          <User size={48} color={colors.amber} weight="bold" />
        </View>

        {/* Fields */}
        {fields.map((field, i) => (
          <View key={i} style={styles.field}>
            <CRTText size="xs" color="amber" dim style={{ letterSpacing: 2 }}>
              {field.label}
            </CRTText>
            <CRTText size="sm" color="amber">
              {field.value}
            </CRTText>
          </View>
        ))}
      </View>
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
    padding: spacing.lg,
    alignItems: 'center',
    gap: spacing.lg,
  },
  avatarLarge: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.amber,
    marginBottom: spacing.md,
  },
  field: {
    width: '100%',
    gap: spacing.xs,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
