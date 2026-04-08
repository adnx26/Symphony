# Black & White Redesign — Aura

**Date:** 2026-04-07
**Status:** Approved

## Overview

Replace all chromatic colors (cyan, purple, rose, amber) in the Aura board with a monochrome palette: near-black backgrounds, tonal surface layers, warm off-white text, and white accents. Node types are differentiated via a combination of left-bar brightness, border treatment, and uppercase type badges.

---

## Color Palette

| Token | Value | Role |
|---|---|---|
| `--color-aura-bg` | `#0c0c0c` | Page background |
| `--color-aura-surface` | `#161616` | Node/panel base |
| `--color-aura-surface2` | `#1e1e1e` | Nested surfaces, inputs |
| `--color-aura-surface3` | `#262626` | Hover states, chips |
| `--color-aura-border` | `rgba(255,255,255,0.08)` | Default borders |
| `--color-aura-border-lit` | `rgba(255,255,255,0.22)` | Active/hover borders |
| `--color-aura-text` | `#f0ede8` | Primary text (warm off-white) |
| `--color-aura-muted` | `rgba(255,255,255,0.35)` | Secondary/label text |
| `--color-aura-white` | `#ffffff` | Accents, lit glows, logo |

### Node Type Left-Bar & Badge Colors

| Type | Color |
|---|---|
| Task | `#ffffff` (pure white) |
| Developer | `#d4d0cb` (warm light gray) |
| Agent | `#8a8680` (mid gray) |
| Sub-Agent | `#545250` (dim gray) |

---

## Nodes

- Background: `#161616`, border: `1px solid rgba(255,255,255,0.08)`
- Task nodes: slightly brighter border `rgba(255,255,255,0.14)` to stand out
- Left accent bar (3px): brightness per type table above
- Hover: border → `rgba(255,255,255,0.16)`
- **Lit state:** `box-shadow: 0 0 20px rgba(255,255,255,0.12), inset 0 0 24px rgba(255,255,255,0.03)`, border → `rgba(255,255,255,0.28)`
- **Dimmed state:** `opacity: 0.04`
- Node title: `#f0ede8`
- Node subtitle: `rgba(255,255,255,0.32)`
- Uppercase type badge (top-right): `rgba(255,255,255,0.06)` bg, `rgba(255,255,255,0.35)` text

### Status Tags

| Status | Background | Text |
|---|---|---|
| todo | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.35)` |
| progress | `rgba(255,255,255,0.12)` | `#f0ede8` |
| done | `rgba(255,255,255,0.10)` | `#f0ede8` |
| blocked | `rgba(255,255,255,0.06)` | `rgba(255,255,255,0.25)` |

### Avatars

Avatars use the type's left-bar color as background fill, with `#0c0c0c` text:

| Type | Avatar Background |
|---|---|
| Task | `#ffffff` |
| Developer | `#d4d0cb` |
| Agent | `#8a8680` |
| Sub-Agent | `#545250` |

---

## SVG Connections

- Default stroke: `rgba(255,255,255,0.12)`
- Lit path: `rgba(255,255,255,0.75)`, `stroke-width: 2.4`
- Dim path: `rgba(255,255,255,0.025)`

---

## Header

- Background: `rgba(12,12,12,0.94)` + `backdrop-filter: blur(14px)`
- Border-bottom: `rgba(255,255,255,0.07)`
- Logo: plain `#ffffff` wordmark (no gradient)
- Active tab: `#f0ede8` text, `rgba(255,255,255,0.5)` bottom border
- Inactive tab: `rgba(255,255,255,0.35)` text, transparent border
- Filter chips: `#161616` bg, `rgba(255,255,255,0.08)` border; focus → `rgba(255,255,255,0.18)`
- Legend dots: `#ffffff` → `#d4d0cb` → `#8a8680` → `#545250` (matching node bars)
- Reset button: same chip style as filter chips

---

## Detail Panel

- Background: `#0f0f0f`, border-left: `rgba(255,255,255,0.07)`
- Section headers: `rgba(255,255,255,0.28)` uppercase
- Chain chips: `#1e1e1e` bg, `rgba(255,255,255,0.10)` border, type-matched left accent color
- Criteria rows: `rgba(255,255,255,0.03)` bg
  - Checked: `rgba(255,255,255,0.07)` bg, `rgba(255,255,255,0.14)` border
  - Checkbox fill when checked: `#ffffff`, checkmark color: near-black (`#0c0c0c`)
- Team rows: `rgba(255,255,255,0.025)` bg, hover → `rgba(255,255,255,0.05)`

---

## Swimlanes & Canvas

- Swimlane dividers: `rgba(255,255,255,0.04)`
- Lane labels: `rgba(255,255,255,0.07)`
- Dot-grid background: unchanged (white dots at low opacity)

---

## Files to Change

1. `src/app.css` — update all `@theme` tokens and global `.node`, `.conn`, `.tag-*`, `.avatar`, `.chain-*`, `.criterion`, `.team-row`, `.swimlane` classes
2. `src/lib/components/Header.svelte` — remove gradient from logo, update legend dot colors
3. Any inline `style=` color references in other components (BoardCanvas, DetailPanel, NodePanel, TaskPanel, TicketCard)
