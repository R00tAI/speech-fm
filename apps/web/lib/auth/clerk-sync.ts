/**
 * Clerk User Synchronization Helper
 *
 * This helper ensures that Clerk users are synchronized with the internal database.
 * It provides a bridge between Clerk's authentication and the existing user system.
 */

import { currentUser, auth } from '@clerk/nextjs/server'
import db from '@/lib/db/connection'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

/**
 * Get the current authenticated Clerk user and their corresponding DB user ID
 * Creates a DB user record if it doesn't exist
 */
export async function syncClerkUser() {
  const clerkUser = await currentUser()
  if (!clerkUser) return null

  const email = clerkUser.primaryEmailAddress?.emailAddress
    || clerkUser.emailAddresses[0]?.emailAddress
    || null
  const clerkUserId = clerkUser.id
  const name = [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ') || null
  const image = clerkUser.imageUrl || null

  // Check if user exists by clerk_user_id
  const [existingByClerk] = await db
    .select()
    .from(users)
    .where(eq(users.clerk_user_id, clerkUserId))
    .limit(1)

  if (existingByClerk) {
    if (email && existingByClerk.email !== email) {
      await db
        .update(users)
        .set({ email })
        .where(eq(users.id, existingByClerk.id))
    }

    return {
      clerkUserId,
      dbUserId: existingByClerk.id,
      email: existingByClerk.email || email || '',
      name,
      image,
    }
  }

  // Fallback: match by email if present, then attach Clerk ID
  if (email) {
    const [existingByEmail] = await db
      .select()
      .from(users)
      .where(eq(users.email, email))
      .limit(1)

    if (existingByEmail) {
      await db
        .update(users)
        .set({ clerk_user_id: clerkUserId })
        .where(eq(users.id, existingByEmail.id))

      return {
        clerkUserId,
        dbUserId: existingByEmail.id,
        email,
        name,
        image,
      }
    }
  }

  // Create new user if doesn't exist
  const [newUser] = await db
    .insert(users)
    .values({
      email: email || `user-${clerkUserId}@clerk.local`,
      clerk_user_id: clerkUserId,
    })
    .returning()

  return {
    clerkUserId,
    dbUserId: newUser.id,
    email: email || '',
    name,
    image,
  }
}

/**
 * Get just the Clerk user ID from the current session
 * Lightweight version when you don't need full user sync
 */
export async function getClerkUserId(): Promise<string | null> {
  const { userId } = await auth()
  return userId
}

/**
 * Get both Clerk and DB user IDs
 * Use this in API routes that need to store data with user relationships
 */
export async function getUserIds() {
  const syncResult = await syncClerkUser()
  if (!syncResult) {
    throw new Error('Unauthorized')
  }
  return syncResult
}
