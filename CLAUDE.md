# Symphony PM — CLAUDE.md

Reference for Claude working in this repo. Read this before touching anything.

---

## Stack

| Layer | Tech |
|-------|------|
| Framework | React 19 + TypeScript 5.5 |
| Build | Vite 6 |
| Styling | Tailwind CSS v4 (`@tailwindcss/vite`) |
| Routing | React Router v7 |
| Icons | Lucide React |
| State | React Context (`AppContext`) + localStorage |

react-dnd has been **removed**. Drag-and-drop is implemented with plain mouse events in `BoardView.tsx`.
Framer Motion (`motion`) is installed but no longer used in active components.

---

## Dev server

```bash
npm run dev      # http://localhost:5173
npm run build    # tsc + vite build
npm run preview  # serve dist/
```

On Apple Silicon you may need to reinstall native rollup bindings if the build crashes:
```bash
rm -rf node_modules package-lock.json && npm install
```

---

## Project layout

```
app/
  main.tsx                  # ReactDOM.createRoot entry
  App.tsx                   # RouterProvider wrapper
  routes.tsx                # /board and /tickets routes
  types.ts                  # All shared TypeScript types
  context/
    AppContext.tsx           # Global state (filters, positions, panels, criteria)
  data/
    symphony-data.json      # ← Edit this to add/change nodes (no TS knowledge needed)
    appData.ts              # Imports JSON + computeVisibleNodes / computeDefaultPositions / buildTreeData / getRelatedNodeIds
  components/
    Root.tsx                # AppProvider wrapper + layout shell
    Header.tsx              # Filter dropdowns, node count badge, Reset Layout
    Sidebar.tsx             # Collapsible hierarchical tree
    BoardView.tsx           # Canvas: pan/zoom, drag, focus-dim effect
    NodeCard.tsx            # Individual node card (task / developer / agent / sub-agent)
    ConnectionLines.tsx     # SVG dashed edges between nodes
    DetailPanel.tsx         # Right-side slide-in panel (task or agent detail)
    TicketsView.tsx         # /tickets grid view
    LoadingSplash.tsx       # 1 200 ms intro screen
  hooks/
    useKeyboardShortcuts.ts # Esc closes detail panel
  utils/
    nodeColors.ts           # Color map for node types, statuses, priorities
styles/
  index.css / tailwind.css / fonts.css / theme.css
```

`app/components/ui/` and `app/components/figma/` have been **deleted** (shadcn scaffolding, never used).

---

## Data — how to add nodes

**Only edit `app/data/symphony-data.json`.** `appData.ts` imports it and re-exports typed arrays.
The full field reference is in `DATA-GUIDE.md`.

Key IDs in the sample data:

| ID | Name | Type |
|----|------|------|
| d1 | Alice Chen | Developer |
| d2 | Bob Kim | Developer |
| d3 | Carol Davis | Developer |
| a1 | CodeBot | Agent (Code Review) |
| a2 | QA-7 | Agent (QA) |
| a3 | DeployBot | Agent (DevOps) |
| a4 | DesignAI | Agent (Design) |
| sa1–sa5 | LintBot … StageBot | Sub-Agents |
| t1–t6 | Tasks | — |

---

## Global state (AppContext)

```ts
filters          // FilterState — dev / type / status / priority strings
visible          // VisibleNodes — tasks, devs, agents, subAgents, edges, taskColor
selectedId       // string | null — currently selected node
positions        // Record<id, {x,y}> — canvas positions, persisted to localStorage
panelStack       // PanelEntry[] — [{mode:'task'|'agent', id}]
checkedCriteria  // Record<string, boolean> — persisted to localStorage
panTarget        // string | null — triggers auto-pan to node
```

localStorage keys: `symphony-positions`, `symphony-layout-v` (current: `'5'`), `symphony-checked`, `symphony-sidebar-visible`.

**Bump `symphony-layout-v`** whenever `computeDefaultPositions` changes so users get fresh positions on next load.

---

## Board internals

### Layout constants (`appData.ts`)
```ts
LANE_W = 320   // horizontal distance between lanes
GAP_Y  = 48   // vertical gap between nodes in same lane
H_PAD  = 60   // left padding of first lane
NODE_W = 220  // card width
NODE_H = 68   // card height
BOARD_H = 4000 // total canvas height
```

### Drag (BoardView.tsx)
Pure mouse-event drag — no library. Three refs drive it:
- `draggingId` — which node is being dragged
- `dragOffset` — cursor offset from node top-left at drag start
- `dragMoved` — true once cursor travels > 6 px (threshold that separates click from drag)
- `pendingClick` — stored click callback, fired on mouseup if threshold never crossed

### Focus / dim effect
When a node is selected, `getRelatedNodeIds(selectedId, visible)` returns a `Set<string>` of all IDs in the same chain (task ↔ developer ↔ agent ↔ sub-agents). A dark overlay (z-index 3) dims the canvas; focused nodes render at z-index 10 (above the overlay) with full opacity; unfocused nodes render at z-index 2 (below the overlay) with opacity 0.2. Click the canvas background to deselect.

### Connection lines (ConnectionLines.tsx)
SVG `<path>` elements with cubic bezier curves and a CSS `dash` animation. `relatedIds` prop dims edges whose endpoints are not both in the focused set.

---

## TypeScript notes

- `tsconfig.json` only contains `files:[]` + `references` — all compiler options live in `tsconfig.app.json`
- `app/components/ui/` and `app/components/figma/` are **gone** — do not re-add them to tsconfig excludes
- `resolveJsonModule: true` enables the JSON import in `appData.ts`
- Status type is `'todo' | 'progress' | 'done' | 'blocked'` — note `'progress'`, not `'in-progress'`

---

## Common pitfalls

- **Nodes invisible on load** — likely stale localStorage. Bump `symphony-layout-v` to a new string.
- **Drag feels stuck** — do not re-add react-dnd or native HTML5 drag; the current mouse-event system is intentional.
- **Build fails with `@rollup/rollup-darwin-arm64`** — run `rm -rf node_modules package-lock.json && npm install`.
- **Adding a new node type** — add it to `types.ts` (`NodeType`), `nodeColors.ts`, `computeVisibleNodes`, `computeDefaultPositions`, `buildTreeData`, `getRelatedNodeIds`, and the render loop in `BoardView.tsx`.
