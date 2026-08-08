'use client';

import { useCallback, useState, type RefObject } from 'react';
import { frameConfig } from '@lib/frame-config';
import type { FrameCanvasHandle } from '@/components/FrameCanvas';

interface ActionBarProps {
  canvasRef: RefObject<FrameCanvasHandle | null>;
  /** Whether photos have been loaded (disables buttons when false) */
  hasPhotos: boolean;
}

type ShareState = 'idle' | 'uploading' | 'done' | 'error';

export interface ActionBarHandles {
  handleDownload: () => Promise<void>;
  handleShare: () => Promise<void>;
}

export default function ActionBar({ canvasRef, hasPhotos }: ActionBarProps) {
  const [shareState, setShareState] = useState<ShareState>('idle');

  // ── Download ─────────────────────────────────────────────────────
  const handleDownload = useCallback(async () => {
    const handle = canvasRef.current;
    if (!handle) return;

    try {
      const blob = await handle.getCompositeBlob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'hh-goa-frame.png';
      document.body.appendChild(a);
      a.click();
      // Cleanup
      setTimeout(() => {
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }, 100);
    } catch (err) {
      console.error('Download failed:', err);
    }
  }, [canvasRef]);

  // ── Share (upload → open tweet intent) ───────────────────────────
  const handleShare = useCallback(async () => {
    const handle = canvasRef.current;
    if (!handle) return;

    setShareState('uploading');

    try {
      const blob = await handle.getCompositeBlob();

      // POST raw PNG to our upload API
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'image/png' },
        body: blob,
      });

      if (!res.ok) {
        throw new Error(`Upload failed: ${res.status}`);
      }

      const { id } = (await res.json()) as { url: string; id: string };

      // Build the share URL — frame page with OG metadata
      const origin = window.location.origin;
      const frameUrl = `${origin}/frame/${id}`;

      // Build tweet text from config
      const tweetText = `${frameConfig.copy.tweetTemplate} #FrameInGoa`;
      const tweetUrl = new URL('https://twitter.com/intent/tweet');
      tweetUrl.searchParams.set('text', tweetText);
      tweetUrl.searchParams.set('url', frameUrl);

      setShareState('done');

      // Open Twitter intent in a new tab
      window.open(tweetUrl.toString(), '_blank', 'noopener,noreferrer');
    } catch (err) {
      console.error('Share failed:', err);
      setShareState('error');
      // Reset after a moment so the user can retry
      setTimeout(() => setShareState('idle'), 3000);
    }
  }, [canvasRef]);

  // Make handles available via a window object so useActions can grab them
  // This is a simple way to wire without complex context
  if (typeof window !== 'undefined') {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).__hh_actions = {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(window as any).__hh_actions,
      download: handleDownload,
      share: handleShare
    };
  }

  const disabled = !hasPhotos;

  return (
    <div className="action-bar reveal reveal-delay-3">
      <button
        id="btn-download"
        type="button"
        className="action-btn action-btn-primary"
        disabled={disabled}
        onClick={handleDownload}
        title="Download your framed photo as PNG (D)"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg>
        Download
      </button>

      <button
        id="btn-share"
        type="button"
        className="action-btn"
        disabled={disabled || shareState === 'uploading'}
        onClick={handleShare}
        title={`${frameConfig.copy.tooltips.share} (S)`}
      >
        {shareState === 'uploading' ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4 text-[var(--color-fg-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            Uploading...
          </span>
        ) : (
          <>
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="18" cy="5" r="3"></circle><circle cx="6" cy="12" r="3"></circle><circle cx="18" cy="19" r="3"></circle><line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line></svg>
            {shareState === 'error' ? 'Failed — retry' : 'Share'}
          </>
        )}
      </button>
    </div>
  );
}
