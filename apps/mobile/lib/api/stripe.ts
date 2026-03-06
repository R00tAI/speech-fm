/**
 * Stripe / Subscription API
 */

import { apiClient } from './client';

export interface CheckoutResponse {
  url: string;
}

export interface SubscriptionStatus {
  tier: string;
  status: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd?: boolean;
}

export async function createCheckout(priceId: string): Promise<CheckoutResponse> {
  return apiClient<CheckoutResponse>('/api/subscription/create-checkout', {
    method: 'POST',
    body: JSON.stringify({ priceId }),
  });
}

export async function getSubscriptionStatus(): Promise<SubscriptionStatus> {
  return apiClient<SubscriptionStatus>('/api/subscription/status');
}

export async function cancelSubscription(): Promise<void> {
  await apiClient('/api/subscription/cancel', { method: 'POST' });
}
