/**
 * Request Context using AsyncLocalStorage
 *
 * Provides request-scoped context (userId, etc.) accessible anywhere
 * in the request chain without prop drilling.
 *
 * Pattern: https://dev.to/rexessilfie/using-asynclocalstorage-in-nextjs-44c8
 */

import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  userId: string;
  userRole?: string;
  requestId?: string;
  startTime?: number;
}

// Singleton instance - must be the same across all imports
const requestContextStorage = new AsyncLocalStorage<RequestContext>();

/**
 * Run a function within a request context
 * Called from middleware or API route entry points
 */
export function runWithContext<T>(context: RequestContext, fn: () => T): T {
  return requestContextStorage.run(context, fn);
}

/**
 * Get the current request context
 * Returns undefined if called outside of a context
 */
export function getRequestContext(): RequestContext | undefined {
  return requestContextStorage.getStore();
}

/**
 * Get the current user ID from context
 * Throws if called outside of a context (fail-fast)
 */
export function getUserId(): string {
  const context = getRequestContext();
  if (!context?.userId) {
    throw new Error(
      '[RequestContext] getUserId called outside of request context. ' +
      'Ensure runWithContext is called in middleware or route handler.'
    );
  }
  return context.userId;
}

/**
 * Get the current user ID, or null if not in context
 * Use this for optional tracking (don't fail if no user)
 */
export function getUserIdOptional(): string | null {
  return getRequestContext()?.userId ?? null;
}

/**
 * Get the request ID for tracing
 */
export function getRequestId(): string | null {
  return getRequestContext()?.requestId ?? null;
}

export { requestContextStorage };
