import Groq from 'groq-sdk';
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// ─── Static fallback titles ───────────────────────────────────────────
// Used when the Groq call fails or times out.
const FALLBACK_TITLES = [
  'Terminal Alchemist',
  'Pixel Wrangler',
  'Stack Whisperer',
  'Deploy Wizard',
  'Type Conjurer',
  'Loop Architect',
  'Byte Forger',
  'Cache Philosopher',
  'Runtime Mystic',
  'Edge Sorcerer',
] as const;

function randomFallback(): string {
  return FALLBACK_TITLES[Math.floor(Math.random() * FALLBACK_TITLES.length)];
}

// ─── POST /api/builder-class ──────────────────────────────────────────
export async function POST(req: NextRequest): Promise<NextResponse> {
  // Parse + validate body
  let name: string;
  let stack: string;

  try {
    const body = await req.json();
    name = (body?.name ?? '').toString().trim();
    stack = (body?.stack ?? '').toString().trim();
  } catch {
    return NextResponse.json(
      { builderClass: randomFallback() },
      { status: 200 },
    );
  }

  if (!name || !stack) {
    return NextResponse.json(
      { builderClass: randomFallback() },
      { status: 200 },
    );
  }

  // Groq call with a 2-second hard timeout
  const apiKey = process.env.GROQ_API_KEY;

  if (!apiKey) {
    // No key configured — return fallback silently (safe in preview/staging)
    return NextResponse.json({ builderClass: randomFallback() }, { status: 200 });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 2000);

  try {
    const groq = new Groq({ apiKey });

    const chat = await groq.chat.completions.create(
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content:
              'You are a witty namer. Respond with ONLY a 2-4 word "builder class" title — ' +
              'no punctuation, no explanation, no quotes. Examples: Terminal Alchemist, ' +
              'Pixel Wrangler, Stack Whisperer, Deploy Wizard.',
          },
          {
            role: 'user',
            content: `Name: ${name}\nTech stack: ${stack}\n\nBuilder class title:`,
          },
        ],
        max_tokens: 16,
        temperature: 0.9,
      },
      { signal: controller.signal },
    );

    clearTimeout(timeout);

    const raw = chat.choices[0]?.message?.content ?? '';
    // Sanitise: strip quotes/punctuation, collapse whitespace, max 5 words
    const title = raw
      .replace(/["""'''*_`]/g, '')
      .replace(/[.,!?;:]/g, '')
      .trim()
      .split(/\s+/)
      .slice(0, 5)
      .join(' ');

    return NextResponse.json(
      { builderClass: title || randomFallback() },
      { status: 200 },
    );
  } catch {
    clearTimeout(timeout);
    return NextResponse.json({ builderClass: randomFallback() }, { status: 200 });
  }
}
