/**
 * Billing Screen - Subscription management with Stripe via WebView
 */

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import * as Linking from 'expo-linking';
import { CaretLeft, CreditCard, ArrowUp, Check } from 'phosphor-react-native';
import { getBalance, type CreditBalance } from '@/lib/api/credits';
import { createCheckout, getSubscriptionStatus, type SubscriptionStatus } from '@/lib/api/stripe';
import { CRTText } from '@/components/common/CRTText';
import { colors, spacing, radii } from '@/lib/theme';

export default function BillingScreen() {
  const router = useRouter();
  const [balance, setBalance] = useState<CreditBalance | null>(null);
  const [subscription, setSubscription] = useState<SubscriptionStatus | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();

    // Listen for deep link return from Stripe
    const sub = Linking.addEventListener('url', handleDeepLink);
    return () => sub.remove();
  }, []);

  async function loadData() {
    try {
      const [bal, sub] = await Promise.all([
        getBalance().catch(() => null),
        getSubscriptionStatus().catch(() => null),
      ]);
      if (bal) setBalance(bal);
      if (sub) setSubscription(sub);
    } catch (e) {
      console.warn('[Billing] Failed to load:', e);
    }
  }

  function handleDeepLink(event: { url: string }) {
    if (event.url.includes('success=true')) {
      Alert.alert('Success', 'Your subscription has been updated!');
      loadData();
    }
  }

  async function handleUpgrade(priceId: string) {
    setLoading(true);
    try {
      const { url } = await createCheckout(priceId);
      await WebBrowser.openBrowserAsync(url);
      // Refresh data after return
      await loadData();
    } catch (e) {
      Alert.alert('Error', 'Failed to start checkout');
    } finally {
      setLoading(false);
    }
  }

  const tiers = [
    { id: 'free', name: 'FREE', credits: '100/mo', price: '$0', current: subscription?.tier === 'free' },
    { id: 'pro', name: 'PRO', credits: '2,000/mo', price: '$19/mo', current: subscription?.tier === 'pro', priceId: 'price_pro_monthly' },
    { id: 'studio', name: 'STUDIO', credits: '10,000/mo', price: '$49/mo', current: subscription?.tier === 'studio', priceId: 'price_studio_monthly' },
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <CaretLeft size={24} color={colors.amber} />
        </TouchableOpacity>
        <CRTText size="md" color="amber" bold>
          BILLING
        </CRTText>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Current balance */}
        <View style={styles.balanceCard}>
          <CRTText size="xs" color="amber" dim style={{ letterSpacing: 2 }}>
            CREDIT BALANCE
          </CRTText>
          <CRTText size="xxl" color="amber" glow bold>
            {balance?.credits?.toLocaleString() || '---'}
          </CRTText>
          <CRTText size="xs" color="amber" dim>
            {balance ? `${balance.usedCredits} used of ${balance.monthlyCredits} monthly` : 'Loading...'}
          </CRTText>
        </View>

        {/* Subscription tiers */}
        <CRTText size="xs" color="amber" dim style={styles.sectionLabel}>
          SUBSCRIPTION PLANS
        </CRTText>

        {tiers.map(tier => (
          <View
            key={tier.id}
            style={[styles.tierCard, tier.current && styles.tierCardActive]}
          >
            <View style={styles.tierHeader}>
              <CRTText size="md" color="amber" bold>
                {tier.name}
              </CRTText>
              {tier.current && (
                <View style={styles.currentBadge}>
                  <Check size={12} color={colors.green} weight="bold" />
                  <CRTText size="xs" color="green" bold>
                    CURRENT
                  </CRTText>
                </View>
              )}
            </View>

            <CRTText size="sm" color="amber" dim>
              {tier.credits} credits
            </CRTText>
            <CRTText size="lg" color="amber" bold>
              {tier.price}
            </CRTText>

            {!tier.current && tier.priceId && (
              <TouchableOpacity
                style={[styles.upgradeButton, loading && { opacity: 0.5 }]}
                onPress={() => handleUpgrade(tier.priceId!)}
                disabled={loading}
              >
                <ArrowUp size={16} color={colors.amber} weight="bold" />
                <CRTText size="sm" color="amber" bold>
                  {loading ? 'LOADING...' : 'UPGRADE'}
                </CRTText>
              </TouchableOpacity>
            )}
          </View>
        ))}
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
  balanceCard: {
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.amber,
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionLabel: {
    letterSpacing: 2,
    marginTop: spacing.md,
  },
  tierCard: {
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: radii.sm,
    borderWidth: 1,
    borderColor: colors.border,
    gap: spacing.sm,
  },
  tierCardActive: {
    borderColor: colors.amber,
  },
  tierHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  currentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: radii.sm,
    backgroundColor: `${colors.green}15`,
    borderWidth: 1,
    borderColor: `${colors.green}44`,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.amber,
    borderRadius: radii.sm,
    marginTop: spacing.sm,
  },
});
