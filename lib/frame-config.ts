// ─── Types ───────────────────────────────────────────────────────────
export interface Slot {
  /** 1-based id for each photo position within a layout */
  id: number;
  /** Center-X as a 0-1 fraction of the canvas width */
  x: number;
  /** Center-Y as a 0-1 fraction of the canvas height */
  y: number;
  /** Width as a 0-1 fraction of the canvas width */
  width: number;
  /** Height as a 0-1 fraction of the canvas height */
  height: number;
}

export interface Layout {
  slots: Slot[];
}

export type LayoutName = 'solo' | 'duo' | 'trio';

export interface BuilderMember {
  name: string;
  stack: string;
  builderClass: string;
}

// ─── Canvas dimensions (export-resolution) ───────────────────────────
export const CANVAS_WIDTH = 1080;
export const CANVAS_HEIGHT = 1080;

// ─── Configuration (single source of truth) ──────────────────────────
export const frameConfig = {
  colors: {
    /** Dark base background */
    base: '#0C0C0E',
    surface: '#18181B',
    accent: '#D4A574',
    accentMuted: 'rgba(212, 165, 116, 0.15)',
    fg: '#E8E4DF',
    fgSecondary: '#A8A29E',
    border: 'rgba(255, 255, 255, 0.08)',
  },

  layouts: {
    solo: {
      slots: [
        { id: 1, x: 0.5, y: 0.42, width: 0.82, height: 0.58 },
      ],
    },
    duo: {
      slots: [
        { id: 1, x: 0.27, y: 0.42, width: 0.42, height: 0.58 },
        { id: 2, x: 0.73, y: 0.42, width: 0.42, height: 0.58 },
      ],
    },
    trio: {
      slots: [
        { id: 1, x: 0.2,  y: 0.42, width: 0.27, height: 0.58 },
        { id: 2, x: 0.5,  y: 0.42, width: 0.27, height: 0.58 },
        { id: 3, x: 0.8,  y: 0.42, width: 0.27, height: 0.58 },
      ],
    },
  } satisfies Record<LayoutName, Layout>,

  copy: {
    tweetTemplate: 'Building at HH Goa 2026! Check out my credential frame ✨',
    tooltips: {
      solo: 'Solo builder credential',
      duo: 'Duo team credential',
      trio: 'Trio team credential',
      share: 'Share this frame',
    },
    title: 'HH Goa 2026 Frame',
  },
} as const;

// ─── Helpers ─────────────────────────────────────────────────────────
export function frameAsset(layout: LayoutName): string {
  return `/frame-${layout}.png`;
}

export function layoutForCount(count: number): LayoutName {
  if (count <= 1) return 'solo';
  if (count === 2) return 'duo';
  return 'trio';
}
