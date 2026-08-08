'use client';

import { useEffect, useMemo } from 'react';
import type { FrameCanvasHandle } from '@/components/FrameCanvas';
import { useTheme } from '@/components/ThemeProvider';

export interface Action {
  id: string;
  label: string;
  shortcut: string[];
  handler: () => void;
  enabled: boolean;
}

interface UseActionsProps {
  canvasRef: React.RefObject<FrameCanvasHandle | null>;
  hasPhotos: boolean;
  setCommandPaletteOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setShortcutsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

export function useActions({ canvasRef, hasPhotos, setCommandPaletteOpen, setShortcutsOpen }: UseActionsProps) {
  const { toggleTheme } = useTheme();

  const actions = useMemo<Action[]>(() => {
    // We grab handlers attached to window by ActionBar
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const actionHandles = typeof window !== 'undefined' ? (window as any).__hh_actions : undefined;

    return [
      {
        id: 'upload',
        label: 'Upload photos',
        shortcut: ['U'],
        enabled: true,
        handler: () => document.getElementById('photo-input')?.click(),
      },
      {
        id: 'layout-solo',
        label: 'Layout: Solo',
        shortcut: ['1'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.setLayout('solo'),
      },
      {
        id: 'layout-duo',
        label: 'Layout: Duo',
        shortcut: ['2'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.setLayout('duo'),
      },
      {
        id: 'layout-trio',
        label: 'Layout: Trio',
        shortcut: ['3'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.setLayout('trio'),
      },
      {
        id: 'zoom-in',
        label: 'Zoom In',
        shortcut: ['+'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.zoomIn(),
      },
      {
        id: 'zoom-out',
        label: 'Zoom Out',
        shortcut: ['-'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.zoomOut(),
      },
      {
        id: 'pan-up',
        label: 'Pan Up',
        shortcut: ['ArrowUp'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.pan(0, -20),
      },
      {
        id: 'pan-down',
        label: 'Pan Down',
        shortcut: ['ArrowDown'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.pan(0, 20),
      },
      {
        id: 'pan-left',
        label: 'Pan Left',
        shortcut: ['ArrowLeft'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.pan(-20, 0),
      },
      {
        id: 'pan-right',
        label: 'Pan Right',
        shortcut: ['ArrowRight'],
        enabled: hasPhotos,
        handler: () => canvasRef.current?.pan(20, 0),
      },
      {
        id: 'download',
        label: 'Download Frame',
        shortcut: ['D'],
        enabled: hasPhotos && !!actionHandles?.download,
        handler: () => actionHandles?.download?.(),
      },
      {
        id: 'share',
        label: 'Share Frame',
        shortcut: ['S'],
        enabled: hasPhotos && !!actionHandles?.share,
        handler: () => actionHandles?.share?.(),
      },
      {
        id: 'theme',
        label: 'Toggle Theme',
        shortcut: ['T'],
        enabled: true,
        handler: toggleTheme,
      },
      {
        id: 'command-palette',
        label: 'Command Palette',
        shortcut: ['⌘/Ctrl', 'K'],
        enabled: true,
        handler: () => setCommandPaletteOpen(true),
      },
      {
        id: 'shortcuts',
        label: 'Keyboard Shortcuts',
        shortcut: ['?'],
        enabled: true,
        handler: () => setShortcutsOpen(true),
      },
    ];
  }, [canvasRef, hasPhotos, setCommandPaletteOpen, setShortcutsOpen, toggleTheme]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger shortcuts if user is typing in an input
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.isContentEditable
      ) {
        // Allow Cmd+K everywhere
        if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
          e.preventDefault();
          setCommandPaletteOpen(true);
        }
        // Allow Esc to blur or close
        if (e.key === 'Escape') {
          target.blur();
          setCommandPaletteOpen(false);
          setShortcutsOpen(false);
        }
        return;
      }

      // Close panels with Esc
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
        setShortcutsOpen(false);
        return;
      }

      // Cmd+K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(true);
        return;
      }

      // Match single character shortcuts (case-insensitive) or full key names for arrows
      const key = e.key;
      
      // Special case for '?' (which requires Shift on most keyboards)
      if (key === '?') {
        const action = actions.find((a) => a.id === 'shortcuts');
        if (action?.enabled) {
          e.preventDefault();
          action.handler();
        }
        return;
      }

      // Find by exact key match (ignoring case for letters)
      const action = actions.find((a) => {
        const sc = a.shortcut[0];
        if (sc.length === 1) return sc.toUpperCase() === key.toUpperCase();
        return sc === key; // ArrowUp, etc.
      });
      
      if (action && action.enabled && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        action.handler();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [actions, setCommandPaletteOpen, setShortcutsOpen]);

  const executeAction = (id: string) => {
    const action = actions.find(a => a.id === id);
    if (action?.enabled) {
      action.handler();
    }
  };

  return { actions, executeAction };
}
