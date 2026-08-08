import { NextResponse } from 'next/server';
import { kv } from '@vercel/kv';

export const runtime = 'edge';
export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const count = await kv.get<number>('frames_generated');
    return NextResponse.json({ count: count || 0 }, { status: 200 });
  } catch (err) {
    console.error('Failed to fetch stats:', err);
    // Graceful fallback on error so the client doesn't break
    return NextResponse.json({ count: 0 }, { status: 200 });
  }
}
