'use client';

import type { Action } from '@/hooks/useActions';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Action[];
}

export default function ShortcutsModal({ isOpen, onClose, actions }: ShortcutsModalProps) {
  if (!isOpen) return null;

  // Filter out any actions we don't want to show or group them
  const displayActions = actions.filter(a => a.id !== 'shortcuts');

  return (
    <div className="overlay-backdrop" onPointerDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="overlay-panel p-4 max-w-sm">
        <h3 className="text-title mb-4">Keyboard Shortcuts</h3>
        <div className="flex flex-col gap-3">
          {displayActions.map((action) => (
            <div key={action.id} className="flex items-center justify-between">
              <span className="text-label text-[var(--color-fg-secondary)]">{action.label}</span>
              <div className="flex gap-1">
                {action.shortcut.map((key, i) => (
                  <kbd key={i}>{key}</kbd>
                ))}
              </div>
            </div>
          ))}
          
          <div className="flex items-center justify-between mt-2 pt-3 border-t border-[var(--color-border)]">
            <span className="text-label text-[var(--color-fg-secondary)]">Close Panel</span>
            <kbd>Esc</kbd>
          </div>
        </div>
      </div>
    </div>
  );
}
