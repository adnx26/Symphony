# Sidebar — Tree View Design Spec
**Date:** 2026-04-01

## Overview

Add a collapsible left sidebar to the Aura flow board that displays the full Task → Developer → Agent → Sub-Agent hierarchy as a nested folder-style tree. The sidebar is independent of the canvas filters, always showing all data, and persists its state across page reloads.

---

## Structure & HTML

A new `#app-body` horizontal flexbox wrapper is inserted between the header and the existing `#canvas`. It contains:

- `#tree-sidebar` — fixed `200px` wide, `flex-shrink: 0`, sits to the left of the canvas
- `#canvas` — takes remaining space (`flex: 1`)

`#tree-sidebar` has a `#tree-toggle` chevron tab (`‹` / `›`) absolutely positioned on its right edge. When collapsed, the sidebar slides off-screen via `transform: translateX(-200px)` with a CSS transition. A `sidebar-hidden` class on `#tree-sidebar` drives this state.

---

## Tree Data & Rendering

`renderSidebar()` is called once on page load. It builds the tree from the raw `TASKS`, `DEVELOPERS`, `AGENTS`, and `SUB_AGENTS` arrays — always the full dataset, ignoring the current filter state.

**Tree hierarchy per root:**
```
Task (amber)
  └─ Developer (--c-dev cyan)
       └─ Agent (--c-agent purple)
            └─ Sub-Agent(s) (--c-sub pink)
```

**Expand/collapse state** is tracked in a `sidebarOpen` Set of open node IDs. Default: all nodes start collapsed. State is persisted to `localStorage` under the key `aura-sidebar-open` (JSON array of open IDs) and restored before `renderSidebar()` runs.

Clicking the expand arrow (`▸` / `▾`) on a row toggles that node's ID in `sidebarOpen`, saves to localStorage, and re-renders the sidebar.

---

## Interaction

Clicking a tree row (not the expand arrow) does two things:

1. **Select** — calls the existing `onNodeClick(id)`, which sets `activeId`, highlights connected edges, dims unconnected nodes, and opens the detail panel. Exactly equivalent to clicking the node on the canvas.
2. **Pan & zoom** — reads the node's stored position from the `positions` object, computes new `zoom.x` / `zoom.y` values to center that position in the viewport (keeping current `zoom.scale`), then calls `applyTransform()`.

The tree row corresponding to `activeId` receives an `.active` CSS class. This class is applied/removed whenever `activeId` changes (i.e., inside `onNodeClick` and when the selection is cleared).

---

## Toggle & Persistence

| Behaviour | Detail |
|---|---|
| Toggle control | `#tree-toggle` chevron tab on the right edge of `#tree-sidebar` |
| Collapsed state | `sidebar-hidden` class → `transform: translateX(-200px)`, transition `0.28s cubic-bezier(.16,1,.3,1)` |
| Chevron direction | `‹` when open, `›` when hidden |
| Visibility persistence | `localStorage` key `aura-sidebar-visible` (boolean string), restored on load |
| Expand state persistence | `localStorage` key `aura-sidebar-open` (JSON array of open IDs), restored before render |

---

## What is NOT changing

- `render()` and the filter system are untouched — sidebar has its own lifecycle
- The existing right-side detail panel (`#detail-panel`) is untouched
- No new dependencies, no build step — all changes are in `index.html`
