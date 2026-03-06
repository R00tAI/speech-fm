/**
 * Credits API
 */

import { apiClient } from './client';

export interface CreditBalance {
  credits: number;
  tier: string;
  monthlyCredits: number;
  usedCredits: number;
}

export async function getBalance(): Promise<CreditBalance> {
  return apiClient<CreditBalance>('/api/credits/balance');
}
