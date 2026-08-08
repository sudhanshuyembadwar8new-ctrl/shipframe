'use client';

import { useRef, useState } from 'react';
import FrameCanvas, { type FrameCanvasHandle } from '@/components/FrameCanvas';
import ActionBar from '@/components/ActionBar';
import StatsCounter from '@/components/StatsCounter';
import ThemeToggle from '@/components/ThemeToggle';
import CommandPalette from '@/components/CommandPalette';
import ShortcutsModal from '@/components/ShortcutsModal';
import ShortcutHint from '@/components/ShortcutHint';
import { useActions } from '@/hooks/useActions';
import type { BuilderMember } from '@lib/frame-config';

export default function Home() {
  const canvasRef = useRef<FrameCanvasHandle>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const hasPhotos = photoCount > 0;
  
  // Active Builder Tab (0 = Builder 1, 1 = Builder 2, 2 = Builder 3)
  const [activeBuilderIdx, setActiveBuilderIdx] = useState(0);

  // Form State for up to 3 Builders
  const [builders, setBuilders] = useState<BuilderMember[]>([
    { name: '', stack: '', builderClass: '' },
    { name: '', stack: '', builderClass: '' },
    { name: '', stack: '', builderClass: '' },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);

  // Overlays
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [shortcutsOpen, setShortcutsOpen] = useState(false);

  // Register keyboard shortcuts & command palette
  const { actions, executeAction } = useActions({
    canvasRef,
    hasPhotos,
    setCommandPaletteOpen,
    setShortcutsOpen,
  });

  const activeBuilder = builders[activeBuilderIdx] || { name: '', stack: '', builderClass: '' };

  const updateActiveBuilder = (field: keyof BuilderMember, value: string) => {
    setBuilders((prev) =>
      prev.map((b, idx) => (idx === activeBuilderIdx ? { ...b, [field]: value } : b)),
    );
  };

  const handleGenerateClass = async () => {
    if (!activeBuilder.name || !activeBuilder.stack) return;
    setIsGenerating(true);
    try {
      const res = await fetch('/api/builder-class', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: activeBuilder.name, stack: activeBuilder.stack }),
      });
      if (res.ok) {
        const data = await res.json();
        updateActiveBuilder('builderClass', data.builderClass);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Determine active slot count based on photo count (1, 2, 3)
  const maxSlots = Math.max(1, Math.min(3, photoCount || 1));

  return (
    <>
      {/* Step 3: Header Row */}
      <header className="app-header">
        <div className="flex items-center gap-3">
          <span className="display-font font-bold text-lg text-[var(--color-fg)]">HH GOA 2026</span>
          <span className="text-xs font-mono px-2 py-0.5 rounded bg-[var(--color-accent-muted)] text-[var(--color-accent)]">
            #FrameInGoa
          </span>
        </div>
        <ThemeToggle />
      </header>

      <main className="app-main">
        {/* Step 3: Hero Copy Banner */}
        <div className="w-full text-center mb-2 reveal">
          <h1 className="text-hero display-font">Build your frame.</h1>
          <p className="text-body text-[var(--color-fg-secondary)] mt-2">
            Create your official residency credential frame for HH Goa 2026.
          </p>
        </div>

        {/* Vertical Stack: Massive Preview first, then Controls */}
        <div className="flex flex-col gap-12 w-full items-center">
          {/* Hero Credential Canvas */}
          <section className="app-panel-preview reveal w-full">
            <FrameCanvas
              ref={canvasRef}
              onPhotosChange={(count) => {
                setPhotoCount(count);
                if (count > 0 && activeBuilderIdx >= count) {
                  setActiveBuilderIdx(0);
                }
              }}
              builders={builders.slice(0, maxSlots)}
            />
            <StatsCounter />
          </section>

          {/* Controls underneath */}
          <section className="app-panel-controls w-full">
            <div className="reveal reveal-delay-1 w-full max-w-sm mx-auto">
              <button
                className="frame-canvas-upload"
                onClick={() => document.getElementById('photo-input')?.click()}
              >
                {hasPhotos ? `Change Photos (${photoCount} loaded) (U)` : 'Upload Photos (1-3) (U)'}
              </button>
            </div>

            {/* Team Mode Member Selector Tabs */}
            {hasPhotos && maxSlots > 1 && (
              <div className="flex gap-2 mt-4 w-full reveal max-w-sm mx-auto">
                {Array.from({ length: maxSlots }).map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setActiveBuilderIdx(idx)}
                    className={`flex-1 py-1.5 px-3 text-xs mono-font rounded transition-colors border ${
                      activeBuilderIdx === idx
                        ? 'bg-[var(--color-accent-muted)] border-[var(--color-accent)] text-[var(--color-accent)] font-semibold'
                        : 'bg-[var(--color-surface)] border-[var(--color-border)] text-[var(--color-fg-secondary)]'
                    }`}
                  >
                    Builder {idx + 1}
                  </button>
                ))}
              </div>
            )}

            {/* Builder Input Controls */}
            <div className="reveal reveal-delay-2 w-full mt-4 flex flex-col md:flex-row gap-6">
              <div className="flex-1">
                <label htmlFor="name" className="input-label">
                  {maxSlots > 1 ? `Builder ${activeBuilderIdx + 1} Name` : 'Name'}
                </label>
                <input
                  id="name"
                  type="text"
                  className="input-field"
                  placeholder="Priya Sharma"
                  value={activeBuilder.name}
                  onChange={(e) => updateActiveBuilder('name', e.target.value)}
                  autoComplete="off"
                />
              </div>
              <div className="flex-1">
                <label htmlFor="stack" className="input-label">
                  {maxSlots > 1 ? `Builder ${activeBuilderIdx + 1} Stack` : 'Stack'}
                </label>
                <input
                  id="stack"
                  type="text"
                  className="input-field"
                  placeholder="React, Tailwind, Node"
                  value={activeBuilder.stack}
                  onChange={(e) => updateActiveBuilder('stack', e.target.value)}
                  autoComplete="off"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleGenerateClass();
                  }}
                />
              </div>
              <div className="flex-1 flex flex-col justify-end">
                <button
                  type="button"
                  className="action-btn"
                  onClick={handleGenerateClass}
                  disabled={!activeBuilder.name || !activeBuilder.stack || isGenerating}
                >
                  {isGenerating ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin h-4 w-4 text-[var(--color-fg-secondary)]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Generating...
                    </span>
                  ) : (
                    'Generate Title'
                  )}
                </button>
              </div>
            </div>
            
            {activeBuilder.builderClass && (
              <div className="text-sm font-medium text-center mt-2 px-3 py-2 bg-[var(--color-accent-muted)] text-[var(--color-accent)] rounded-md mono-font border border-[var(--color-accent-muted)] max-w-sm mx-auto">
                {activeBuilder.builderClass}
              </div>
            )}

            <div className="mt-8 w-full border-t border-[var(--color-border)] pt-8 max-w-xl mx-auto">
              <ActionBar canvasRef={canvasRef} hasPhotos={hasPhotos} />
            </div>
          </section>
        </div>
      </main>

      {/* Global Overlays */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        actions={actions}
        executeAction={executeAction}
      />

      <ShortcutsModal
        isOpen={shortcutsOpen}
        onClose={() => setShortcutsOpen(false)}
        actions={actions}
      />

      <ShortcutHint onClick={() => setShortcutsOpen(true)} />
    </>
  );
}
