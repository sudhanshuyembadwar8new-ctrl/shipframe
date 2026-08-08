import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';
import { kv } from '@vercel/kv';

export const runtime = 'edge';

/**
 * POST /api/upload
 *
 * Accepts a raw PNG body (Content-Type: image/png).
 * Stores the image in Vercel Blob, saves {id → blobUrl} in Vercel KV,
 * and returns { url, id }.
 *
 * No image data is ever put into query params.
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const contentType = req.headers.get('content-type') ?? '';
    if (!contentType.includes('image/png')) {
      return NextResponse.json(
        { error: 'Content-Type must be image/png' },
        { status: 400 },
      );
    }

    const body = await req.blob();
    if (!body || body.size === 0) {
      return NextResponse.json(
        { error: 'Empty body' },
        { status: 400 },
      );
    }

    // Cap at ~10 MB to prevent abuse
    if (body.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: 'File too large (max 10 MB)' },
        { status: 413 },
      );
    }

    const id = crypto.randomUUID().slice(0, 12); // short but unique enough
    const filename = `frames/${id}.png`;

    // Upload to Vercel Blob
    const blob = await put(filename, body, {
      access: 'public',
      contentType: 'image/png',
      addRandomSuffix: false,
    });

    // Store id → blob URL in Vercel KV (TTL: 30 days)
    await kv.set(`frame:${id}`, blob.url, { ex: 60 * 60 * 24 * 30 });

    // Safely increment atomic counter in the background (fire-and-forget)
    kv.incr('frames_generated').catch(err => {
      console.error('Failed to increment frames_generated counter:', err);
    });

    return NextResponse.json({ url: blob.url, id }, { status: 200 });
  } catch (err) {
    console.error('Upload failed:', err);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 },
    );
  }
}
