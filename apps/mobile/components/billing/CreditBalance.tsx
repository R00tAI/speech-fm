/**
 * CreditBalance - Shows credit balance in the header
 */

import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { CoinVertical } from 'phosphor-react-native';
import { getBalance, type CreditBalance as CreditBalanceType } from '@/lib/api/credits';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing } from '@/lib/theme';

export function CreditBalance() {
  const [balance, setBalance] = useState<CreditBalanceType | null>(null);

  useEffect(() => {
    loadBalance();
  }, []);

  async function loadBalance() {
    try {
      const data = await getBalance();
      setBalance(data);
    } catch (e) {
      console.warn('[Credits] Failed to load balance:', e);
    }
  }

  if (!balance) return null;

  return (
    <View style={styles.container}>
      <CoinVertical size={14} color={colors.amber} weight="bold" />
      <CRTText size="xs" color="amber" bold>
        {balance.credits.toLocaleString()}
      </CRTText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
});
