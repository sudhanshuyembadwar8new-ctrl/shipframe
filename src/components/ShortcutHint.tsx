'use client';

interface ShortcutHintProps {
  onClick: () => void;
}

export default function ShortcutHint({ onClick }: ShortcutHintProps) {
  return (
    <button
      type="button"
      className="shortcut-hint"
      onClick={onClick}
      title="View Keyboard Shortcuts (?)"
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="14"
        height="14"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 8h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2"></path>
        <path d="M10 8V6a2 2 0 0 1 2-2h0a2 2 0 0 1 2 2v2"></path>
        <rect x="8" y="12" width="8" height="4" rx="1"></rect>
      </svg>
      <span>?</span>
    </button>
  );
}
