/**
 * Cost Tracking Service (Lightweight)
 *
 * Tracks API usage per user for billing/budgeting.
 * This is a simplified version for Speech FM — logs to console
 * and can be wired to a DB table later.
 */

export interface UsageUnit {
  userId: string;
  service: string;
  operation: string;
  units: number;
  metadata?: Record<string, unknown>;
}

export async function trackUnitUsage(usage: UsageUnit): Promise<void> {
  if (process.env.NODE_ENV === 'development') {
    console.log(`[cost-tracking] ${usage.service}/${usage.operation}: ${usage.units} units (user: ${usage.userId})`);
  }
}

export async function getUserUsage(userId: string): Promise<number> {
  return 0;
}
