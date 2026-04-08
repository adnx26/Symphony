# SvelteKit Migration — Design Spec
**Date:** 2026-04-06

## Overview

Migrate Aura from a single `index.html` file to a SvelteKit application with Tailwind CSS. The migration ports all existing features (board canvas, sidebar, filters, detail panel) and implements the Tickets view (designed in `2026-04-06-tickets-view-design.md`) simultaneously. The visual design and data are preserved exactly; the architecture changes to be component-based and reactive.

---

## Tech Stack

- **SvelteKit** — app framework, routing, SSR disabled (static adapter)
- **Vite** — dev server and build tool (bundled with SvelteKit)
- **JavaScript** — no TypeScript
- **Tailwind CSS v4** — utility classes, theme extended with Aura color tokens
- **adapter-static** — output is a static site, same deployment story as `index.html`
- **Google Fonts** — JetBrains Mono + Syne, loaded in `app.html`

The existing `index.html` remains in the repo until the migration is verified complete, then is deleted.

---

## Project Structure

```
src/
├── app.html                        — HTML shell, Google Fonts link tags
├── app.css                         — Tailwind base directives + global CSS (font-face, :root tokens, scrollbar, animations)
├── lib/
│   ├── data.js                     — TASKS, DEVELOPERS, AGENTS, SUB_AGENTS arrays (direct port)
│   ├── helpers.js                  — priorityConfig, formatDueDate, nodeKind, findNode, STATUS_LABEL, getDepth (pure functions, no DOM)
│   ├── stores/
│   │   ├── filters.js              — writable filter state + derived visibleNodes store
│   │   ├── activeId.js             — writable(null), currently selected node id
│   │   ├── panel.js                — writable({ open: false, stack: [] })
│   │   └── board.js                — writable({ positions: {}, zoom: { x:0, y:0, scale:1 }, checked: {} })
│   └── components/
│       ├── Header.svelte           — logo, tab nav links, filter chips, legend, stat counter
│       ├── DetailPanel.svelte      — slide-in panel shell, delegates to TaskPanel or NodePanel
│       ├── TaskPanel.svelte        — Tickets Task Mode: overview + team rows + criteria
│       ├── NodePanel.svelte        — Board mode + agent drill-down: overview + chain vis + outputs + criteria
│       ├── board/
│       │   ├── BoardCanvas.svelte  — canvas container + all imperative DOM logic in onMount
│       │   ├── BoardNode.svelte    — single draggable node element
│       │   └── Sidebar.svelte      — collapsible tree sidebar
│       └── tickets/
│           ├── TicketsGrid.svelte  — 3-column responsive grid
│           └── TicketCard.svelte   — single ticket card
├── routes/
│   ├── +layout.svelte              — Header + DetailPanel, wraps all routes
│   ├── +page.svelte                — Board view (Sidebar + BoardCanvas + zoom controls)
│   └── tickets/
│       └── +page.svelte            — Tickets view (TicketsGrid)
tailwind.config.js
svelte.config.js
vite.config.js
```

---

## Data Layer

### `src/lib/data.js`

Direct port of all four arrays from `index.html`. No shape changes.

```js
export const DEVELOPERS = [ ... ];
export const AGENTS = [ ... ];
export const SUB_AGENTS = [ ... ];
export const TASKS = [ ... ];
```

### `src/lib/helpers.js`

Direct port of all pure utility functions. No DOM references.

Exports: `priorityConfig(level)`, `formatDueDate(dateStr)`, `nodeKind(id)`, `findNode(id)`, `getDepth(id)`, `STATUS_LABEL`.

---

## Stores

### `src/lib/stores/filters.js`

```js
import { writable, derived } from 'svelte/store';
import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';

export const filters = writable({ dev: '', type: '', status: '', priority: '' });

export const visibleNodes = derived(filters, ($filters) => {
  // Same logic as visibleNodes() in index.html
  // Returns { tasks, devs, agents, subAgents, edges, taskColor }
});
```

All components read `visibleNodes`; only `Header.svelte` writes to `filters`.

### `src/lib/stores/activeId.js`

```js
export const activeId = writable(null);
```

Written on node/card click. Cleared on panel close and route change (board canvas background click, filter change).

### `src/lib/stores/panel.js`

```js
export const panel = writable({ open: false, stack: [] });

export function openPanel(entry) { /* push to stack, set open: true */ }
export function closePanel()     { /* reset stack, set open: false */ }
export function drillPanel(entry){ /* push entry onto stack */ }
export function panelBack()      { /* pop stack; if empty, close */ }
```

Stack entry shape: `{ mode: 'task' | 'agent', id: string, fromTaskId?: string }`.

- Board node click → `openPanel({ mode: 'agent', id })` (single entry, no back button shown when `stack.length === 1`)
- Ticket card click → `openPanel({ mode: 'task', id })`
- Ticket agent row click → `drillPanel({ mode: 'agent', id, fromTaskId })`
- ← Back → `panelBack()`

### `src/lib/stores/board.js`

```js
export const board = writable({
  positions: {},   // nodeId → { x, y }, persisted to localStorage
  zoom:      { x: 0, y: 0, scale: 1 },
  checked:   {},   // 'nodeId:index' → boolean, criteria checkbox state
});
```

`positions` and `zoom` are read/written only by `BoardCanvas`. `checked` is read/written by `NodePanel` and `TaskPanel`. On store changes, `BoardCanvas` persists `positions` to localStorage; `checked` is session-only (matches current behavior).

---

## Tailwind Configuration

`tailwind.config.js` extends the theme with Aura's color tokens so component classes are readable:

```js
theme: {
  extend: {
    colors: {
      'aura-bg':      '#050810',
      'aura-surface': '#0b1221',
      'aura-surface2':'#101928',
      'aura-dev':     '#1dd4ef',
      'aura-agent':   '#a78bfa',
      'aura-sub':     '#fb7185',
      'aura-text':    '#c8d6e8',
      'aura-muted':   '#4a5c72',
    },
    fontFamily: {
      mono:  ['"JetBrains Mono"', 'monospace'],
      syne:  ['Syne', 'sans-serif'],
    },
  },
}
```

Global CSS (dot-grid background, `@keyframes flow`, scrollbar styles, `:root` border token) goes in `app.css` alongside the Tailwind directives.

---

## Routing

### `+layout.svelte`

Renders `<Header>` and `<DetailPanel>` around `<slot />`. The detail panel is in the layout so it persists and stays open when navigating between Board and Tickets.

### `+page.svelte` (Board, `/`)

Renders `<Sidebar>` and `<BoardCanvas>`. Also renders zoom control buttons that write to the `board` store. Sidebar and zoom controls are not present in the Tickets route.

### `tickets/+page.svelte` (Tickets, `/tickets`)

Renders `<TicketsGrid>`. No sidebar, no zoom controls.

---

## Component Details

### `Header.svelte`

- Logo, two `<a>` links styled as tabs (`href="/"` and `href="/tickets"`), active state via `$page.url.pathname`
- Four filter `<select>` chips (Dev, Agent, Status, Priority) — `on:change` writes to `filters` store
- Legend (Tasks/Developers/Agents/Sub-Agents color dots)
- Stat counter — shows node count on Board, ticket count on Tickets (derived from `visibleNodes`)
- Reset Layout button — visible only on Board (checked via `$page.url.pathname`)

### `BoardCanvas.svelte`

All imperative DOM logic lives in `onMount`:
- Subscribes to `visibleNodes` and `board` stores; re-renders nodes and redraws SVG on change
- Renders node divs via direct DOM manipulation (not Svelte templating) to preserve existing drag/pan/SVG redraw logic with minimal rewrite
- Pan: `pointerdown`/`pointermove`/`pointerup` on canvas element
- Drag: per-node `pointerdown`/`pointermove`/`pointerup`, updates `board.positions`
- Zoom: `wheel` event + zoom control button handlers
- SVG: `drawConnections()` ported directly, runs after node render
- Node click: writes `activeId` and calls `openPanel`
- `onDestroy`: removes event listeners

### `Sidebar.svelte`

Reactive tree built from `$visibleNodes.tasks`. Expand/collapse state in a local `Set`, persisted to localStorage. Clicking a row writes `activeId`, calls `openPanel`, and pans the canvas (emits a custom event that `BoardCanvas` listens to).

### `DetailPanel.svelte`

Reads `$panel`. Slide-in animation via CSS `transform: translateX`. Renders:
- `<TaskPanel>` when `stack[stack.length-1].mode === 'task'`
- `<NodePanel>` when `stack[stack.length-1].mode === 'agent'`
- ← Back button visible when `stack.length > 1`

### `TaskPanel.svelte`

Reads task data from `findNode($activeId)`. Renders:
- Overview section (description, priority pill, due date pill)
- Team section: Dev row (non-clickable avatar + name + role), Agent row (clickable, calls `drillPanel`), Sub-agent rows (clickable, each calls `drillPanel`)
- Criteria section (checkboxes, reads/writes `board.checked`)

### `NodePanel.svelte`

Reused for both board node inspection and ticket agent drill-down. Renders:
- Overview section
- Chain visualization (reads `$visibleNodes.edges` for downstream traversal)
- Outputs list
- Criteria section (reads/writes `board.checked`)

### `TicketsGrid.svelte`

`{#each $visibleNodes.tasks as task}` → `<TicketCard>`. 3-column Tailwind grid, responsive to 2-column at `md` breakpoint. Empty state message when no tasks match filters.

### `TicketCard.svelte`

Props: `task`, `dev`, `agent`, `subAgents`. Renders accent bar (priority color via inline style), title, status/priority/due badges, dev row, agent+sub-agent chips. `on:click` calls `openPanel({ mode: 'task', id: task.id })` and sets `activeId`.

---

## State Persistence

| State | Storage | Scope |
|-------|---------|-------|
| `positions` | `localStorage` | permanent |
| `zoom` | memory only | session |
| `checked` | memory only | session |
| `filters` | memory only | session |
| `activeId` | memory only | session |
| `panel.stack` | memory only | session |
| sidebar open/collapse | `localStorage` | permanent |
| sidebar visible | `localStorage` | permanent |

---

## Out of Scope

- Server-side rendering (adapter-static, no server routes)
- Authentication or backend
- Any new features beyond those in `2026-04-06-tickets-view-design.md`
- Testing infrastructure (unit or E2E)
- The existing `index.html` tickets-view plan (`2026-04-06-tickets-view.md`) is superseded by this migration
