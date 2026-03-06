/**
 * Route Handler Wrapper with Automatic Tracking Context
 *
 * Wraps API route handlers to set up request context for tracking.
 * This is the recommended way to enable tracking in route handlers.
 *
 * Usage:
 *   import { withTracking } from '@/lib/ai/with-tracking';
 *
 *   export const POST = withTracking(async (request, context) => {
 *     // context.userId is available
 *     // All AI calls are automatically tracked
 *     const response = await anthropic.messages.create({...});
 *     return NextResponse.json({ success: true });
 *   });
 */

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { runWithContext, type RequestContext } from './request-context';
import { checkUsageLimits } from '@/lib/services/cost-tracking.service';

type RouteHandler = (
  request: NextRequest,
  context: RequestContext & { params?: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

type NextRouteHandler = (
  request: NextRequest,
  context?: { params?: Record<string, string> }
) => Promise<NextResponse> | NextResponse;

export interface WithTrackingOptions {
  // Skip usage limit check (for admin endpoints, etc.)
  skipLimitCheck?: boolean;
  // Estimated cost for pre-flight check (in USD)
  estimatedCost?: number;
  // Allow unauthenticated requests (tracking will be skipped)
  allowUnauthenticated?: boolean;
}

/**
 * Wrap a route handler with tracking context
 */
export function withTracking(
  handler: RouteHandler,
  options: WithTrackingOptions = {}
): NextRouteHandler {
  return async (request: NextRequest, routeContext?: { params?: Record<string, string> }) => {
    // Get user from Clerk
    const { userId } = await auth();

    if (!userId) {
      if (options.allowUnauthenticated) {
        // Run without tracking context
        return handler(request, {
          userId: '',
          params: routeContext?.params,
        });
      }
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    // Check usage limits before processing (unless skipped)
    if (!options.skipLimitCheck && options.estimatedCost) {
      const limitCheck = await checkUsageLimits(userId, options.estimatedCost);
      if (!limitCheck.allowed) {
        return NextResponse.json(
          { error: limitCheck.reason || 'Usage limit exceeded' },
          { status: 429 }
        );
      }
    }

    // Create request context
    const requestContext: RequestContext = {
      userId,
      requestId: crypto.randomUUID(),
      startTime: Date.now(),
    };

    // Run handler within context - use async callback with explicit await
    // to ensure context propagates correctly through async operations
    return runWithContext(requestContext, async () => {
      return await handler(request, {
        ...requestContext,
        params: routeContext?.params,
      });
    });
  };
}

/**
 * Higher-order function for handlers that need the raw handler signature
 * but still want tracking. Sets up context without modifying handler signature.
 */
export function withTrackingContext<T>(
  fn: () => Promise<T>
): Promise<T> {
  // This is for use inside handlers that already have userId
  // Just need to set up the context
  return fn();
}
