import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/app/(auth)/auth';
import { db } from '@/lib/db/connection';
import { voice31_code_generations } from '@/lib/db/schema';
import { eq, desc, and, ilike } from 'drizzle-orm';

export const runtime = 'nodejs';

/**
 * GET /api/voice31/code-generations - List code generations for the authenticated user
 * Query params: ?limit=50&search=query
 */
export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const search = searchParams.get('search');

    const conditions = [eq(voice31_code_generations.user_id, session.user.id)];
    if (search) {
      conditions.push(ilike(voice31_code_generations.name, `%${search}%`));
    }

    const generations = await db
      .select({
        id: voice31_code_generations.id,
        name: voice31_code_generations.name,
        prompt: voice31_code_generations.prompt,
        language: voice31_code_generations.language,
        created_at: voice31_code_generations.created_at,
        code_length: voice31_code_generations.code,
      })
      .from(voice31_code_generations)
      .where(and(...conditions))
      .orderBy(desc(voice31_code_generations.created_at))
      .limit(limit);

    // Return code_length as number instead of full code for list view
    const result = generations.map(g => ({
      ...g,
      code_length: g.code_length?.length || 0,
      code: undefined,
    }));

    return NextResponse.json({ generations: result });
  } catch (error) {
    const isTableMissing = error instanceof Error && error.message?.includes('does not exist');
    if (isTableMissing) {
      return NextResponse.json({ generations: [] });
    }
    console.error('[Voice31 CodeGen GET] Error:', error);
    return NextResponse.json({ error: 'Failed to fetch generations' }, { status: 500 });
  }
}

/**
 * POST /api/voice31/code-generations - Save a code generation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { name, prompt, code, language, session_id } = body;

    if (!code) {
      return NextResponse.json({ error: 'Code is required' }, { status: 400 });
    }

    const [generation] = await db
      .insert(voice31_code_generations)
      .values({
        user_id: session.user.id,
        session_id: session_id || null,
        name: name || 'Untitled',
        prompt: prompt || null,
        code,
        language: language || 'tsx',
      })
      .returning();

    return NextResponse.json({ generation }, { status: 201 });
  } catch (error) {
    const isTableMissing = error instanceof Error && error.message?.includes('does not exist');
    if (isTableMissing) {
      return NextResponse.json({ error: 'Code generations feature not yet available' }, { status: 503 });
    }
    console.error('[Voice31 CodeGen POST] Error:', error);
    return NextResponse.json({ error: 'Failed to save generation' }, { status: 500 });
  }
}
