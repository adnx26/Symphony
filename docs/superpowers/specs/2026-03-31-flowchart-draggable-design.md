# Aura — Free-Canvas Flowchart Design

**Date:** 2026-03-31
**Status:** Approved

---

## Overview

Replace the fixed 4-column grid layout with a free-canvas diagramming experience. Nodes are draggable anywhere on an infinite board. The canvas supports pan and zoom. Dynamic swimlanes reflect hierarchy depth. Positions persist to `localStorage` with a reset button to restore the default organized layout.

---

## Architecture

```
#canvas  (overflow:hidden — receives pointer events for pan/zoom)
  └── #board  (position:absolute — CSS transform: translate·scale)
        ├── .swimlane × N  (faint vertical bands, absolutely positioned, computed at render)
        ├── #svg-layer     (same dimensions as board, position:absolute)
        └── .node × N      (position:absolute, {x,y} from state.positions)
```

The `#board` and `#svg-layer` share the same coordinate space, so `drawConnections()` reads from `state.positions` directly — no `getBoundingClientRect` offset math required. This is simpler than the current implementation.

---

## State

Single source of truth:

```js
const state = {
  zoom:      { x: 0, y: 0, scale: 1 },   // not persisted
  positions: {},                           // nodeId → {x, y} — persisted to localStorage
  filters:   { dev: '', type: '', status: '' },
  checked:   {},                           // 'nodeId:index' → true
  activeId:  null,
};
```

**Persistence:**
- On startup: `state.positions` is loaded from `localStorage`.
- On every drag end: `state.positions` is saved to `localStorage`.
- Zoom is session-only — not saved to localStorage.

**Future backend migration:** Replace `loadPositions()` / `savePositions()` with `fetch()` calls. No other code changes needed.

---

## Data Model Change

`SUB_AGENTS` entries replace `parentAgentId` with a unified `parentId` field that can reference either an Agent ID or another Sub-Agent ID, enabling infinite recursive depth:

```js
// Before
{ id: 'sa1', parentAgentId: 'a1', ... }

// After
{ id: 'sa1', parentId: 'a1', ... }     // Sub-Agent of an Agent
{ id: 'ssa1', parentId: 'sa1', ... }   // Sub-Sub-Agent
```

`getDepth(nodeId)` walks the parent chain to compute depth:
- Tasks → 0
- Developers → 1
- Agents → 2
- Sub-Agents → 3
- Sub-Sub-Agents → 4
- …and so on

---

## Dynamic Swimlanes

At render time:
1. Compute `getDepth()` for all visible nodes.
2. `maxDepth = max depth across all visible nodes`.
3. Render `maxDepth + 1` evenly-spaced vertical bands across the board.
4. Label each band by level: "Tasks", "Developers", "Agents", "Sub-Agents", "Sub-Sub-Agents", etc.

Swimlanes are visual guides only — they do not constrain node movement. Controlled by a single `SHOW_SWIMLANES` constant for easy removal.

---

## Default Layout

When no positions are saved (first load or after reset), nodes are positioned algorithmically:

- **X position:** `depth / (maxDepth + 1) * BOARD_WIDTH + COLUMN_PADDING`
- **Y position:** Evenly distributed vertically within each depth column, centered on the board

This produces a clean left-to-right flowchart on first load.

---

## Interactions

### Node Drag
- `pointerdown` on node: capture pointer, record offset between cursor and node origin
- `pointermove`: update `state.positions[nodeId]`, set node style, call `drawConnections()` via `requestAnimationFrame`
- `pointerup`: release pointer, save positions to `localStorage`
- Dragged node gets a temporary z-index boost (brought to front)

### Canvas Pan
- `pointerdown` on `#board` background (not a node): record start point
- `pointermove`: update `state.zoom.{x, y}`, apply CSS transform to `#board`
- `pointerup`: release

### Zoom
- `wheel` on `#canvas`: adjust `state.zoom.scale` (clamped `0.2` – `2.0`), anchored to cursor position
- `+` / `−` / fit-to-screen buttons in a corner overlay for accessible zoom control
- Fit-to-screen: computes the bounding box of all visible nodes, then sets `state.zoom` so that bounding box fills the viewport with padding

### Reset Button (in header)
1. Clear `state.positions`
2. Recompute default layout positions
3. Reset `state.zoom` to `{ x: 0, y: 0, scale: 1 }`
4. Clear `localStorage` positions key
5. Re-render

---

## SVG Connections

- `#svg-layer` is a child of `#board` — same coordinate space as nodes
- `drawConnections()` uses `state.positions[nodeId]` plus `node.offsetWidth` / `node.offsetHeight` to compute port attachment points
- Existing bezier curve style, dash animation, color-per-task-chain, and arrowhead logic is preserved
- Connections redraw on: render, every drag frame, filter changes, window resize

---

## What Is Removed

- `#columns` grid div
- `.column` / `.col-head` / `.nodes-list` DOM structure
- `getBoundingClientRect` canvas-offset math in `drawConnections()`
- `stretchNodes()` / `portY()` (replaced by direct position-based port math)

---

## What Is Preserved

- All existing node styles (`.node`, `.dev-node`, `.agent-node`, `.sub-node`, `.lit`, `.dimmed`, etc.)
- Filter chips in the header
- Detail panel slide-in on node click
- Connection highlighting / dimming on click
- Completion criteria checkboxes
- All existing data (TASKS, DEVELOPERS, AGENTS, SUB_AGENTS)
