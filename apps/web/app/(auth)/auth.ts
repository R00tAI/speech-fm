import { syncClerkUser } from "@/lib/auth/clerk-sync";

export interface AppSession {
  user: {
    id: string;
    email?: string | null;
    name?: string | null;
    image?: string | null;
  };
  clerkUserId: string;
}

export async function auth(): Promise<AppSession | null> {
  const syncResult = await syncClerkUser();
  if (!syncResult) return null;

  return {
    user: {
      id: syncResult.dbUserId,
      email: syncResult.email || null,
      name: syncResult.name || null,
      image: syncResult.image || null,
    },
    clerkUserId: syncResult.clerkUserId,
  };
}

export async function signIn() {
  throw new Error("Clerk handles sign-in. Redirect to /login.");
}

export async function signOut() {
  throw new Error("Clerk handles sign-out. Use Clerk client helpers.");
}
