'use client';

import {
  useRef,
  useState,
  useCallback,
  useEffect,
  useImperativeHandle,
  forwardRef,
  type PointerEvent as ReactPointerEvent,
  type WheelEvent as ReactWheelEvent,
  type ChangeEvent,
} from 'react';
import EmptyStateHero from './EmptyStateHero';

import {
  frameConfig,
  frameAsset,
  layoutForCount,
  CANVAS_WIDTH,
  CANVAS_HEIGHT,
  type LayoutName,
  type Slot,
  type BuilderMember,
} from '@lib/frame-config';

// ─── Constants ───────────────────────────────────────────────────────
const MAX_PHOTOS = 3;
const MAX_EDGE = 1600; // downscale longest edge before any drawing
const MIN_ZOOM = 0.25;
const MAX_ZOOM = 4;
const ZOOM_STEP = 0.002; // sensitivity for scroll zoom

// ─── Per-photo state ─────────────────────────────────────────────────
interface PhotoState {
  /** The downscaled bitmap ready for drawing */
  img: HTMLImageElement;
  /** User-applied offset (px, in canvas-space) from the slot center */
  offsetX: number;
  offsetY: number;
}

// ─── Public handle exposed via ref ───────────────────────────────────
export interface FrameCanvasHandle {
  /** Render the final composite at full resolution and return a PNG blob. */
  getCompositeBlob: () => Promise<Blob>;
  /** Change the layout programmatically */
  setLayout: (layout: LayoutName) => void;
  /** Adjust zoom level */
  zoomIn: () => void;
  zoomOut: () => void;
  /** Pan all photos by dx, dy */
  pan: (dx: number, dy: number) => void;
}

// ─── Helpers ─────────────────────────────────────────────────────────

function loadAndDownscale(file: File, maxEdge: number): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const { naturalWidth: w, naturalHeight: h } = img;

      if (w <= maxEdge && h <= maxEdge) {
        resolve(img);
        return;
      }

      const scale = maxEdge / Math.max(w, h);
      const nw = Math.round(w * scale);
      const nh = Math.round(h * scale);

      const offscreen = document.createElement('canvas');
      offscreen.width = nw;
      offscreen.height = nh;
      const ctx = offscreen.getContext('2d')!;
      ctx.drawImage(img, 0, 0, nw, nh);

      URL.revokeObjectURL(url);

      offscreen.toBlob((blob) => {
        if (!blob) {
          reject(new Error('Downscale toBlob failed'));
          return;
        }
        const scaledURL = URL.createObjectURL(blob);
        const scaledImg = new Image();
        scaledImg.onload = () => resolve(scaledImg);
        scaledImg.onerror = reject;
        scaledImg.src = scaledURL;
      }, 'image/png');
    };
    img.onerror = () => reject(new Error(`Failed to load ${file.name}`));
    img.src = url;
  });
}

function loadFrameOverlay(layout: LayoutName): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Failed to load frame overlay for "${layout}"`));
    img.src = frameAsset(layout);
  });
}

function drawCornerTick(ctx: CanvasRenderingContext2D, x: number, y: number, size = 20) {
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.8)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - size, y);
  ctx.lineTo(x + size, y);
  ctx.moveTo(x, y - size);
  ctx.lineTo(x, y + size);
  ctx.stroke();
}

function drawPill(ctx: CanvasRenderingContext2D, text: string, centerX: number, centerY: number) {
  if (!text) return;
  ctx.font = '700 20px "JetBrains Mono", monospace';
  const paddingX = 20;
  const textMetrics = ctx.measureText(text.toUpperCase());
  const w = textMetrics.width + paddingX * 2;
  const h = 40;
  const x = centerX - w / 2;
  const y = centerY - h / 2;

  ctx.save();
  ctx.fillStyle = 'rgba(212, 165, 116, 0.18)';
  ctx.strokeStyle = 'rgba(212, 165, 116, 0.4)';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, w, h, 6);
  } else {
    ctx.rect(x, y, w, h);
  }
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#D4A574';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text.toUpperCase(), centerX, centerY + 1);
  ctx.restore();
}

/**
 * Draw all photos + HH Goa Credential Identity + Builder Metadata directly onto canvas.
 */
function drawComposite(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  photos: PhotoState[],
  slots: readonly Slot[],
  overlayImg: HTMLImageElement | null,
  builders: BuilderMember[],
) {
  // 1. Background
  ctx.fillStyle = frameConfig.colors.base;
  ctx.fillRect(0, 0, width, height);

  // Outer subtle grid background
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.03)';
  ctx.lineWidth = 1;
  const gridSize = 60;
  for (let x = 0; x < width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  // 2. Corner Ticks (Geometric Coordinate Details)
  const inset = 40;
  drawCornerTick(ctx, inset, inset);
  drawCornerTick(ctx, width - inset, inset);
  drawCornerTick(ctx, inset, height - inset);
  drawCornerTick(ctx, width - inset, height - inset);

  // 3. Top Event Header Mark
  ctx.save();
  ctx.fillStyle = '#E8E4DF';
  ctx.font = '800 42px "Space Grotesk", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HH GOA 2026', inset + 24, 75);

  ctx.fillStyle = '#D4A574';
  ctx.font = '600 24px "JetBrains Mono", monospace';
  ctx.textAlign = 'right';
  ctx.fillText('#FrameInGoa', width - inset - 24, 75);

  // Top Rule Line
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(inset, 120);
  ctx.lineTo(width - inset, 120);
  ctx.stroke();
  ctx.restore();

  // 4. Photos – cover-fitted into their respective slots
  photos.forEach((photo, i) => {
    const slot = slots[i];
    if (!slot) return;

    const slotPxW = slot.width * width;
    const slotPxH = slot.height * height;
    const slotPxX = slot.x * width - slotPxW / 2;
    const slotPxY = slot.y * height - slotPxH / 2;

    ctx.save();
    // Clip to slot rectangle with rounded corners
    ctx.beginPath();
    const radius = 12;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(slotPxX, slotPxY, slotPxW, slotPxH, radius);
    } else {
      ctx.rect(slotPxX, slotPxY, slotPxW, slotPxH);
    }
    ctx.clip();

    // Cover-fit
    const imgW = photo.img.naturalWidth || photo.img.width;
    const imgH = photo.img.naturalHeight || photo.img.height;
    const scale = Math.max(slotPxW / imgW, slotPxH / imgH);
    const drawW = imgW * scale;
    const drawH = imgH * scale;

    const drawX = slotPxX + (slotPxW - drawW) / 2 + photo.offsetX;
    const drawY = slotPxY + (slotPxH - drawH) / 2 + photo.offsetY;

    ctx.drawImage(photo.img, drawX, drawY, drawW, drawH);
    ctx.restore();

    // Draw slot border outline
    ctx.save();
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(slotPxX, slotPxY, slotPxW, slotPxH, radius);
    } else {
      ctx.rect(slotPxX, slotPxY, slotPxW, slotPxH);
    }
    ctx.stroke();
    ctx.restore();
  });

  // 5. Frame Overlay if provided
  if (overlayImg) {
    ctx.drawImage(overlayImg, 0, 0, width, height);
  }

  // 6. Per-Builder Credential Metadata Blocks (Rendered cleanly under each slot)
  ctx.save();
  slots.forEach((slot, i) => {
    const builder = builders[i] || { name: '', stack: '', builderClass: '' };
    const centerX = slot.x * width;
    const slotPxW = slot.width * width;
    const slotPxH = slot.height * height;
    const slotBottomY = slot.y * height + slotPxH / 2;

    // Divider Rule line right below photo
    ctx.strokeStyle = 'rgba(212, 165, 116, 0.35)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(centerX - slotPxW / 2 + 20, slotBottomY + 25);
    ctx.lineTo(centerX + slotPxW / 2 - 20, slotBottomY + 25);
    ctx.stroke();

    // Name (Prominent Space Grotesk)
    let currentY = slotBottomY + 70;
    ctx.fillStyle = '#E8E4DF';
    ctx.font = '800 34px "Space Grotesk", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(builder.name || (photos[i] ? `Builder ${i + 1}` : ''), centerX, currentY);

    // Builder Class Pill (Secondary Styled Tag)
    if (builder.builderClass) {
      currentY += 55;
      drawPill(ctx, builder.builderClass, centerX, currentY);
    }

    // Stack (Small Monospace Metadata)
    if (builder.stack) {
      currentY += builder.builderClass ? 48 : 42;
      ctx.fillStyle = '#A8A29E';
      ctx.font = '500 18px "JetBrains Mono", monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(builder.stack, centerX, currentY);
    }
  });
  ctx.restore();

  // 7. Footer Credential Mark & Coordinates
  ctx.save();
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(inset, height - 90);
  ctx.lineTo(width - inset, height - 90);
  ctx.stroke();

  ctx.fillStyle = '#A8A29E';
  ctx.font = '500 15px "JetBrains Mono", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText('HACKER HOUSE GOA · RESIDENCY CREDENTIAL', inset + 24, height - 55);

  ctx.fillStyle = 'rgba(212, 165, 116, 0.8)';
  ctx.textAlign = 'right';
  ctx.fillText('15.4989° N, 73.8324° E', width - inset - 24, height - 55);
  ctx.restore();
}

export interface FrameCanvasProps {
  onPhotosChange?: (count: number) => void;
  builders?: BuilderMember[];
}

// ─── Component ───────────────────────────────────────────────────────
const FrameCanvas = forwardRef<FrameCanvasHandle, FrameCanvasProps>(function FrameCanvas({ onPhotosChange, builders = [] }, ref) {
  // ── Refs ──
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  // ── State ──
  const [photos, setPhotos] = useState<PhotoState[]>([]);
  const [layout, setLayout] = useState<LayoutName>('solo');
  const [overlayImg, setOverlayImg] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [statusText, setStatusText] = useState<string>('');

  const dragRef = useRef<{
    active: boolean;
    photoIndex: number;
    startX: number;
    startY: number;
    origOffsetX: number;
    origOffsetY: number;
    pointerId: number;
  } | null>(null);

  const pinchRef = useRef<{
    active: boolean;
    initialDistance: number;
    initialZoom: number;
    pointers: Map<number, { x: number; y: number }>;
  }>({ active: false, initialDistance: 0, initialZoom: 1, pointers: new Map() });

  // ── Derived ──
  const slots = frameConfig.layouts[layout].slots;

  // ── Load frame overlay when layout changes ──
  useEffect(() => {
    let cancelled = false;
    loadFrameOverlay(layout).then((img) => {
      if (!cancelled) setOverlayImg(img);
    }).catch(() => {
      if (!cancelled) setOverlayImg(null);
    });
    return () => { cancelled = true; };
  }, [layout]);

  // ── Redraw preview canvas whenever photos/layout/overlay/builders change ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    drawComposite(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, photos, slots, overlayImg, builders);
  }, [photos, slots, overlayImg, builders]);

  // ── File input handler ──
  const handleFiles = useCallback(async (e: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []).slice(0, MAX_PHOTOS);
    if (files.length === 0) return;

    if (files.some(f => f.name.toLowerCase().endsWith('.heic') || f.name.toLowerCase().endsWith('.heif'))) {
      setStatusText('Converting HEIC…');
    } else {
      setStatusText('Loading photos…');
    }

    try {
      const loaded = await Promise.all(
        files.map((f) => loadAndDownscale(f, MAX_EDGE)),
      );

      const newPhotos: PhotoState[] = loaded.map((img) => ({
        img,
        offsetX: 0,
        offsetY: 0,
      }));

      const newLayout = layoutForCount(files.length);
      setLayout(newLayout);
      setPhotos(newPhotos);
      setZoom(1);
      setStatusText('Ready');
      onPhotosChange?.(newPhotos.length);
      setTimeout(() => setStatusText(''), 2000);
    } catch (err) {
      console.error(err);
      setStatusText('Failed to load photos');
    }
  }, [onPhotosChange]);

  // ── Hit-test ──
  const hitTest = useCallback(
    (clientX: number, clientY: number): number => {
      const canvas = canvasRef.current;
      if (!canvas) return -1;

      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;
      const cx = (clientX - rect.left) * scaleX;
      const cy = (clientY - rect.top) * scaleY;

      for (let i = slots.length - 1; i >= 0; i--) {
        const s = slots[i];
        const sx = s.x * CANVAS_WIDTH - (s.width * CANVAS_WIDTH) / 2;
        const sy = s.y * CANVAS_HEIGHT - (s.height * CANVAS_HEIGHT) / 2;
        const sw = s.width * CANVAS_WIDTH;
        const sh = s.height * CANVAS_HEIGHT;
        if (cx >= sx && cx <= sx + sw && cy >= sy && cy <= sy + sh) {
          return i;
        }
      }
      return -1;
    },
    [slots],
  );

  const onPointerDown = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const pinch = pinchRef.current;
      pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pinch.pointers.size === 2) {
        const pts = Array.from(pinch.pointers.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        pinch.active = true;
        pinch.initialDistance = Math.hypot(dx, dy);
        pinch.initialZoom = zoom;
        dragRef.current = null;
        return;
      }

      if (photos.length === 0) return;

      const idx = hitTest(e.clientX, e.clientY);
      if (idx < 0 || idx >= photos.length) return;

      const canvas = canvasRef.current!;
      canvas.setPointerCapture(e.pointerId);

      dragRef.current = {
        active: true,
        photoIndex: idx,
        startX: e.clientX,
        startY: e.clientY,
        origOffsetX: photos[idx].offsetX,
        origOffsetY: photos[idx].offsetY,
        pointerId: e.pointerId,
      };
    },
    [photos, zoom, hitTest],
  );

  const onPointerMove = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const pinch = pinchRef.current;
      if (pinch.pointers.has(e.pointerId)) {
        pinch.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      }

      if (pinch.active && pinch.pointers.size === 2) {
        const pts = Array.from(pinch.pointers.values());
        const dx = pts[1].x - pts[0].x;
        const dy = pts[1].y - pts[0].y;
        const dist = Math.hypot(dx, dy);
        const newZoom = Math.min(
          MAX_ZOOM,
          Math.max(MIN_ZOOM, pinch.initialZoom * (dist / pinch.initialDistance)),
        );
        setZoom(newZoom);
        return;
      }

      const drag = dragRef.current;
      if (!drag?.active || drag.pointerId !== e.pointerId) return;

      const canvas = canvasRef.current!;
      const rect = canvas.getBoundingClientRect();
      const scaleX = CANVAS_WIDTH / rect.width;
      const scaleY = CANVAS_HEIGHT / rect.height;

      const dx = (e.clientX - drag.startX) * scaleX;
      const dy = (e.clientY - drag.startY) * scaleY;

      setPhotos((prev) =>
        prev.map((p, i) =>
          i === drag.photoIndex
            ? { ...p, offsetX: drag.origOffsetX + dx, offsetY: drag.origOffsetY + dy }
            : p,
        ),
      );
    },
    [],
  );

  const onPointerUp = useCallback(
    (e: ReactPointerEvent<HTMLCanvasElement>) => {
      const pinch = pinchRef.current;
      pinch.pointers.delete(e.pointerId);
      if (pinch.pointers.size < 2) {
        pinch.active = false;
      }

      if (dragRef.current?.pointerId === e.pointerId) {
        dragRef.current = null;
      }
    },
    [],
  );

  const onWheel = useCallback(
    (e: ReactWheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      setZoom((z) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z - e.deltaY * ZOOM_STEP)));
    },
    [],
  );

  const getCompositeBlob = useCallback(async (): Promise<Blob> => {
    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = CANVAS_WIDTH;
    exportCanvas.height = CANVAS_HEIGHT;
    const ctx = exportCanvas.getContext('2d')!;

    let overlay: HTMLImageElement | null = null;
    try {
      overlay = await loadFrameOverlay(layout);
    } catch {
      // ignore
    }

    drawComposite(ctx, CANVAS_WIDTH, CANVAS_HEIGHT, photos, slots, overlay, builders);

    return new Promise<Blob>((resolve, reject) => {
      exportCanvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Canvas toBlob returned null'));
        },
        'image/png',
      );
    });
  }, [photos, slots, layout, builders]);

  useImperativeHandle(ref, () => ({
    getCompositeBlob,
    setLayout: (newLayout: LayoutName) => setLayout(newLayout),
    zoomIn: () => setZoom((z) => Math.min(MAX_ZOOM, z + 0.1)),
    zoomOut: () => setZoom((z) => Math.max(MIN_ZOOM, z - 0.1)),
    pan: (dx: number, dy: number) => {
      setPhotos((prev) => prev.map((p) => ({ ...p, offsetX: p.offsetX + dx, offsetY: p.offsetY + dy })));
    }
  }), [getCompositeBlob]);

  const hasPhotos = photos.length > 0;

  return (
    <div className="frame-canvas-root">
      <div className="glass-panel w-full">
        {!hasPhotos ? (
          <EmptyStateHero />
        ) : (
          <div
            ref={wrapperRef}
            className="frame-canvas-zoom-wrapper"
            style={{ transform: `scale(${zoom})` }}
            onWheel={onWheel}
          >
            <canvas
              ref={canvasRef}
              width={CANVAS_WIDTH}
              height={CANVAS_HEIGHT}
              className="frame-canvas-el"
              onPointerDown={onPointerDown}
              onPointerMove={onPointerMove}
              onPointerUp={onPointerUp}
              onPointerCancel={onPointerUp}
              style={{ touchAction: 'none' }}
            />
          </div>
        )}
      </div>

      <div className="flex justify-between items-center w-full px-2">
        <div className="frame-status">{statusText}</div>
        {hasPhotos && (
          <div className="frame-canvas-hint">
            Drag to reposition &middot; Scroll/pinch to zoom
          </div>
        )}
      </div>

      <input
        id="photo-input"
        type="file"
        accept="image/*,.heic,.heif"
        multiple
        onChange={handleFiles}
        className="sr-only"
        title="Upload photos"
      />
    </div>
  );
});

export default FrameCanvas;
