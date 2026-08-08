'use client';

import { useState, useEffect, useRef } from 'react';
import type { Action } from '@/hooks/useActions';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  actions: Action[];
  executeAction: (id: string) => void;
}

export default function CommandPalette({ isOpen, onClose, actions, executeAction }: CommandPaletteProps) {
  const [search, setSearch] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  // Filter actions based on search and whether they are enabled
  const filteredActions = actions.filter((a) => {
    if (!a.enabled) return false;
    if (!search) return true;
    return a.label.toLowerCase().includes(search.toLowerCase());
  });

  // Reset state when opened
  useEffect(() => {
    if (isOpen) {
      setSearch('');
      setSelectedIndex(0);
      // Small timeout to allow the element to render before focusing
      setTimeout(() => inputRef.current?.focus(), 10);
    }
  }, [isOpen]);

  // Handle keyboard navigation within the palette
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % (filteredActions.length || 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev - 1 + filteredActions.length) % (filteredActions.length || 1));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const action = filteredActions[selectedIndex];
        if (action) {
          executeAction(action.id);
          onClose();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, filteredActions, selectedIndex, executeAction, onClose]);

  if (!isOpen) return null;

  return (
    <div className="overlay-backdrop" onPointerDown={(e) => {
      if (e.target === e.currentTarget) onClose();
    }}>
      <div className="overlay-panel">
        <div className="overlay-search">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setSelectedIndex(0);
            }}
          />
        </div>
        <div className="overlay-list">
          {filteredActions.length === 0 ? (
            <div className="px-3 py-4 text-center text-sm text-[var(--color-fg-tertiary)] mono-font">
              No commands found
            </div>
          ) : (
            filteredActions.map((action, idx) => (
              <div
                key={action.id}
                className="overlay-item"
                data-selected={idx === selectedIndex}
                onPointerEnter={() => setSelectedIndex(idx)}
                onClick={() => {
                  executeAction(action.id);
                  onClose();
                }}
              >
                <div className="overlay-item-label">{action.label}</div>
                <div className="overlay-item-shortcut">
                  {action.shortcut.map((key, i) => (
                    <kbd key={i}>{key}</kbd>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
