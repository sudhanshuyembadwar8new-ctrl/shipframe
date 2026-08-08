# DESIGN.md — HH Goa Frame

> Terminal meets shoreline. A hacker residency frame builder with the discipline of Linear
> and the layered warmth of a Goa evening — not cold neon, not flat corporate, not generic AI.

---

## Philosophy

One accent, used with intent. Two typefaces with distinct jobs. One hero moment with real depth.
Everything else stays quiet. The frame preview is the product — it floats, it breathes, it's
the only thing that glows. The rest of the UI is infrastructure: legible, fast, invisible.

**Anti-patterns (explicitly banned):**
- No "AI Purple/Blue Neon" — no flat cyan button glow on a navy box
- No single accent slapped on every element
- No `text-shadow` glow on headings
- No gradient on every button
- No stacking glass/blur effects on multiple elements
- No heavy JS animation libraries for visual effects

---

## Color Palette

All colors are named. No placeholders, no `--color-1`.

### Dark Mode (default)

| Token              | Name          | Hex         | Usage                              |
|---------------------|---------------|-------------|------------------------------------|
| `--color-base`      | Obsidian      | `#0C0C0E`   | Page background                    |
| `--color-surface`   | Graphite      | `#18181B`   | Card/panel backgrounds             |
| `--color-elevated`  | Slate         | `#27272A`   | Elevated panels, inputs            |
| `--color-accent`    | Shoreline     | `#D4A574`   | Single accent — buttons, links     |
| `--color-accent-hover` | Driftwood  | `#C4956A`   | Accent hover state                 |
| `--color-accent-muted` | —          | `#D4A57426` | Accent backgrounds, subtle fills   |
| `--color-fg`        | Bone          | `#E8E4DF`   | Primary text                       |
| `--color-fg-secondary` | Ash        | `#A8A29E`   | Secondary text, labels             |
| `--color-fg-tertiary` | Stone       | `#78716C`   | Tertiary text, hints, disabled     |
| `--color-border`    | —             | `rgba(255,255,255,0.06)` | Borders, dividers     |
| `--color-border-hover` | —          | `rgba(255,255,255,0.12)` | Border hover state    |

### Light Mode

| Token              | Name          | Hex         | Usage                              |
|---------------------|---------------|-------------|------------------------------------|
| `--color-base`      | Chalk         | `#FAFAF9`   | Page background                    |
| `--color-surface`   | Linen         | `#F5F5F4`   | Card/panel backgrounds             |
| `--color-elevated`  | Paper         | `#E7E5E4`   | Elevated panels, inputs            |
| `--color-accent`    | Shoreline     | `#B8895A`   | Slightly deeper for contrast on light |
| `--color-accent-hover` | Driftwood  | `#A67B4F`   | Accent hover state                 |
| `--color-accent-muted` | —          | `#D4A57418` | Accent backgrounds                 |
| `--color-fg`        | Ink           | `#1C1917`   | Primary text                       |
| `--color-fg-secondary` | Charcoal   | `#57534E`   | Secondary text                     |
| `--color-fg-tertiary` | Pebble     | `#A8A29E`   | Tertiary text                      |
| `--color-border`    | —             | `rgba(0,0,0,0.06)` | Borders, dividers          |
| `--color-border-hover` | —          | `rgba(0,0,0,0.10)` | Border hover state         |

### Glass Panel (hero only)

| Token                     | Value (dark)                    | Value (light)                   |
|---------------------------|----------------------------------|---------------------------------|
| `--glass-bg`              | `rgba(24,24,27,0.6)`            | `rgba(255,255,255,0.7)`         |
| `--glass-border`          | `rgba(255,255,255,0.08)`        | `rgba(0,0,0,0.06)`             |
| `--glass-shadow`          | `0 8px 32px rgba(0,0,0,0.4)`   | `0 8px 32px rgba(0,0,0,0.08)`  |
| `backdrop-filter`         | `blur(20px) saturate(1.2)`      | `blur(20px) saturate(1.1)`     |

---

## Typography

Two typefaces. No mixing beyond these two. No fallback to browser defaults visible to users.

| Role      | Family           | Weight    | Usage                                    |
|-----------|------------------|-----------|------------------------------------------|
| Display   | Space Grotesk    | 600–700   | Hero title, section headings             |
| Mono      | JetBrains Mono   | 400–500   | Labels, data, kbd badges, hints, inputs  |

### Type Scale

| Name    | Size       | Line-height | Letter-spacing | Family        |
|---------|------------|-------------|----------------|---------------|
| Hero    | `2.5rem`   | `1.1`       | `-0.03em`      | Space Grotesk |
| Title   | `1.25rem`  | `1.3`       | `-0.02em`      | Space Grotesk |
| Body    | `0.9375rem`| `1.6`       | `0`            | JetBrains Mono|
| Label   | `0.8125rem`| `1.5`       | `0.02em`       | JetBrains Mono|
| Caption | `0.6875rem`| `1.4`       | `0.03em`       | JetBrains Mono|

---

## Spacing

4px base grid. Use only these values:

`4 · 8 · 12 · 16 · 24 · 32 · 48 · 64`

---

## Border Radius

| Token     | Value  | Usage                    |
|-----------|--------|--------------------------|
| `--r-sm`  | `6px`  | Buttons, inputs, badges  |
| `--r-md`  | `10px` | Cards, panels            |
| `--r-lg`  | `16px` | Glass panel (hero)       |

---

## Motion

### Spring curve
`cubic-bezier(0.34, 1.56, 0.64, 1)` — approximates spring with stiffness ~100, damping ~20.

### Durations
- Default interaction: `200ms`
- Panel open/close: `250ms`
- Page-load stagger: `400ms` base + `80ms` per element

### Allowed animations
1. **Page-load reveal**: One orchestrated stagger — elements fade-in + slide-up (12px) in sequence
2. **Hover micro-interactions**: Buttons scale to `1.02`, spring curve, 200ms
3. **Button press**: Scale to `0.98`, 100ms ease-out
4. **Panel transitions**: Opacity 0→1 + translateY(8px→0), 250ms spring
5. **Crossfade**: Empty-state hero images, opacity transition, 800ms ease

### Banned animations
- Parallax scrolling
- Continuous pulsing/breathing effects
- Multiple simultaneous transitions on nested elements
- Any animation requiring a JS animation library

---

## Depth Model

### The ONE hero moment: Frame Preview

The live frame preview canvas sits inside a glass panel. This is the signature visual:

```
┌──────────────────────────────────┐
│  backdrop-filter: blur(20px)     │
│  saturate(1.2)                   │
│  background: var(--glass-bg)     │
│  border: 1px solid var(--glass-  │
│    border)                       │
│  box-shadow: var(--glass-shadow) │
│  border-radius: var(--r-lg)     │
│                                  │
│    ┌──────────────────────────┐  │
│    │     <canvas>             │  │
│    │     (the frame)          │  │
│    └──────────────────────────┘  │
│                                  │
└──────────────────────────────────┘
```

Everything else (upload area, inputs, buttons, action bar) uses simple
`background: var(--color-surface)` + `border: 1px solid var(--color-border)`.
No blur. No glow. No shadow beyond `0 1px 2px rgba(0,0,0,0.05)`.

---

## Component Patterns

### Buttons
- **Default**: `bg: surface`, `border: border`, `color: fg`. Hover: `border-hover`, scale 1.02
- **Primary (accent)**: `bg: accent`, `color: base`. Hover: `bg: accent-hover`. Used sparingly — max one per view
- **Ghost**: `bg: transparent`, `color: fg-secondary`. Hover: `bg: accent-muted`

### Inputs
- `bg: elevated`, `border: border`, `color: fg`, mono font
- Focus: `border: accent`, subtle `box-shadow: 0 0 0 2px var(--color-accent-muted)`

### kbd Badges
- `bg: elevated`, `border: border`, mono font, label size
- `padding: 2px 6px`, `border-radius: var(--r-sm)`

### Glass Panel (hero only)
- As specified in depth model above
- Used ONLY for the frame preview container
- Command palette and shortcuts modal use the same glass treatment (they are overlays, justified)
