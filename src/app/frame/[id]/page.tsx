import { Metadata } from 'next';
import { kv } from '@vercel/kv';
import { redirect } from 'next/navigation';
import { headers } from 'next/headers';
import { frameConfig } from '@lib/frame-config';

interface PageProps {
  params: { id: string };
}

/** Resolve the blob URL for a given frame id from Vercel KV. */
async function resolveFrameUrl(id: string): Promise<string | null> {
  const url = await kv.get<string>(`frame:${id}`);
  return url ?? null;
}

// ─── Metadata (OG + Twitter card) ────────────────────────────────────
export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const imageUrl = await resolveFrameUrl(params.id);

  return {
    title: frameConfig.copy.title,
    description: frameConfig.copy.tweetTemplate,
    openGraph: {
      title: frameConfig.copy.title,
      description: frameConfig.copy.tweetTemplate,
      images: imageUrl ? [{ url: imageUrl, width: 1080, height: 1080 }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: frameConfig.copy.title,
      description: frameConfig.copy.tweetTemplate,
      images: imageUrl ? [imageUrl] : [],
    },
  };
}

// ─── Known social-media / search-engine crawler user-agent fragments ─
const CRAWLER_PATTERNS = [
  'twitterbot',
  'facebookexternalhit',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'whatsapp',
  'telegrambot',
  'googlebot',
  'bingbot',
  'yandexbot',
  'baiduspider',
  'duckduckbot',
  'applebot',
  'pinterestbot',
  'redditbot',
];

function isCrawler(ua: string): boolean {
  const lower = ua.toLowerCase();
  return CRAWLER_PATTERNS.some((p) => lower.includes(p));
}

// ─── Page component ──────────────────────────────────────────────────
// Server component — zero client JS.
// Crawlers see the OG metadata (generated above), human visitors are
// redirected to the home page.
export default async function FramePage({ params }: PageProps) {
  const headersList = headers();
  const ua = headersList.get('user-agent') ?? '';

  // Redirect human visitors to the main app
  if (!isCrawler(ua)) {
    redirect('/');
  }

  // For crawlers: render a minimal HTML page so the metadata is scraped.
  // No client JS is sent.
  const imageUrl = await resolveFrameUrl(params.id);

  return (
    <main
      style={{
        background: frameConfig.colors.base,
        color: '#fff',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1 style={{ color: frameConfig.colors.accent, marginBottom: '1rem' }}>
          {frameConfig.copy.title}
        </h1>
        <p>{frameConfig.copy.tweetTemplate}</p>
        {imageUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt={frameConfig.copy.title}
            width={540}
            height={540}
            style={{ borderRadius: '0.5rem', marginTop: '1rem' }}
          />
        )}
      </div>
    </main>
  );
}
