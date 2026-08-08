'use client';

import { useEffect, useState } from 'react';
import type { LayoutName } from '@lib/frame-config';

interface ExampleFrame {
  id: string;
  name: string;
  stack: string;
  builderClass: string;
  layout: LayoutName;
  colors: string[];
}

const EXAMPLES: ExampleFrame[] = [
  {
    id: '1',
    name: 'Priya Sharma',
    stack: 'React, Node, Tailwind',
    builderClass: 'Pixel Wrangler',
    layout: 'solo',
    colors: ['#2A2A35', '#4A4A5A'],
  },
  {
    id: '2',
    name: 'Arjun Mehta',
    stack: 'Rust, WASM, WebGPU',
    builderClass: 'Terminal Alchemist',
    layout: 'solo',
    colors: ['#1A2F2C', '#2A4A45'],
  },
  {
    id: '3',
    name: 'Zara Khan',
    stack: 'Python, FastAPI, Postgres',
    builderClass: 'Deploy Wizard',
    layout: 'duo',
    colors: ['#2F1A2A', '#4A2A42'],
  },
  {
    id: '4',
    name: 'Dev Patel',
    stack: 'Go, Docker, K8s',
    builderClass: 'Cache Philosopher',
    layout: 'solo',
    colors: ['#1A2A35', '#2A425A'],
  },
];

export default function EmptyStateHero() {
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((current) => (current + 1) % EXAMPLES.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="empty-state-container">
      {EXAMPLES.map((example, index) => {
        const isActive = index === activeIndex;
        return (
          <div
            key={example.id}
            className="empty-state-slide"
            data-active={isActive}
            aria-hidden={!isActive}
            style={{
              background: `linear-gradient(135deg, ${example.colors[0]} 0%, ${example.colors[1]} 100%)`,
            }}
          >
            {/* Overlay the frame PNG for the layout */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`/frame-${example.layout}.png`}
              alt=""
              className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              aria-hidden="true"
            />
            
            <div className="empty-state-info">
              <div className="empty-state-name">{example.name}</div>
              <div className="empty-state-class mt-1">
                {example.builderClass} &middot; {example.stack}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
