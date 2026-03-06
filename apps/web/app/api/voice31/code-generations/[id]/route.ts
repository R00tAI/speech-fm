import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/connection';
import { voice31_code_generations } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/voice31/code-generations/[id] - Get a single generation with full code
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [generation] = await db
      .select()
      .from(voice31_code_generations)
      .where(
        and(
          eq(voice31_code_generations.id, id),
          eq(voice31_code_generations.user_id, session.user.id)
        )
      );

    if (!generation) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ generation });
  } catch (error) {
    console.error('[Voice31 CodeGen GET/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch generation' }, { status: 500 });
  }
}

/**
 * DELETE /api/voice31/code-generations/[id] - Delete a generation
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;

    const [deleted] = await db
      .delete(voice31_code_generations)
      .where(
        and(
          eq(voice31_code_generations.id, id),
          eq(voice31_code_generations.user_id, session.user.id)
        )
      )
      .returning({ id: voice31_code_generations.id });

    if (!deleted) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Voice31 CodeGen DELETE/:id] Error:', error);
    return NextResponse.json({ error: 'Failed to delete generation' }, { status: 500 });
  }
}
