# Tickets View — Design Spec
**Date:** 2026-04-06

## Overview

Add a second view to Aura — a "Tickets" grid — accessible via tabs in the header. The Tickets view shows all main tasks as information-dense cards in a responsive grid, with a drill-down detail panel for inspecting the full task chain (developer, agents, sub-agents).

---

## Tab Bar

- Two tabs — **Board** and **Tickets** — inserted in the header between the logo and the existing separator.
- The header is otherwise identical in both views: filter chips (Dev, Agent, Status, Priority), legend, stat counter, and Reset Layout button all remain visible.
- Active tab is indicated with a bottom-border accent using the existing color system.
- Active tab persists in `localStorage` under the key `aura-active-tab`.
- Board-specific UI (tree sidebar, zoom controls) is hidden in Tickets view.

---

## Tickets Grid

- Replaces the canvas area when the Tickets tab is active.
- Scrollable container with a 3-column responsive grid (narrows to 2 columns on smaller viewports, ~900px breakpoint).
- One card per main task — only `TASKS` entities appear (no developers, agents, or sub-agents shown as standalone cards).
- Filters (Dev, Agent, Status, Priority) apply to the grid in real-time, same filtering logic as `visibleNodes()`.

### Card Layout

Each card contains:
- **Left accent bar** — 3px vertical bar colored by task priority (using existing `priorityConfig()` color)
- **Top row** — task title (Syne font, bold) + status badge + priority pill + due date pill
- **Developer row** — developer avatar (colored initials box) + developer name
- **Agent row** — agent name chip + agent type label
- **Sub-agents row** — one small chip per sub-agent linked to this task's agent (hidden if none)

Cards use the existing surface/border/muted color tokens. Hover state lifts border opacity slightly. Clicking a card selects it (sets `activeId`) and opens the detail panel.

---

## Detail Panel (Tickets View)

The existing slide-in `#detail-panel` is reused. It operates in two modes when in Tickets view:

### Task Mode (default when clicking a card)

Panel shows:
- Task badge, title, subtitle (description)
- Overview section: full description + priority pill + due date pill + completion criteria (interactive checkboxes, same `checked` state as board view)
- **Assigned Developer** section: avatar + name + role
- **Agent Deployed** section: agent name + type — rendered as a clickable row that drills into Agent Mode
- **Sub-Agents** section: each sub-agent as a clickable row that drills into Sub-Agent Mode

### Agent / Sub-Agent Mode (after clicking an agent or sub-agent)

Panel shows:
- A **← Back** button at the top of the panel body that returns to Task Mode for the originating task
- The agent's or sub-agent's standard info: badge, name, type, description, completion criteria, outputs
- Back navigation sets `activeId` back to the originating task ID

### Shared State

- `activeId` is shared between Board and Tickets views — switching tabs preserves the selected node.
- `checked` (completion criteria state) is shared and persists for the session.
- Panel open/close behavior is identical to the board view.

---

## Implementation Scope

### Files Modified
- `index.html` — all changes are in this single file (CSS + HTML + JS), consistent with the existing architecture.

### CSS Additions
- `.tab` and `.tab.active` styles for the header tab bar.
- `#tickets-view` container (flex column, scrollable).
- `.ticket-card` with grid layout, accent bar, hover state.
- `.ticket-card` inner rows for dev, agent, sub-agent sections.
- `.back-btn` style for the panel back button.
- `@media` breakpoint to collapse grid from 3 to 2 columns.

### JS Additions
- `activeTab` state variable (`'board'` | `'tickets'`), loaded from `localStorage`.
- `switchTab(tab)` — toggles visibility of board vs tickets view, saves to `localStorage`.
- `renderTickets()` — builds the card grid from filtered tasks; called on tab switch and filter change.
- Panel drill-down state: `panelStack` array tracking navigation history within the panel (task → agent → back).
- `openTicketPanel(taskId)` — opens the panel in Task Mode.
- `drillToAgent(agentId, fromTaskId)` — pushes agent view onto `panelStack`, renders Agent Mode.
- `panelBack()` — pops `panelStack`, returns to Task Mode.

### JS Modifications
- `render()` — call `renderTickets()` when active tab is Tickets.
- Filter event listeners — also trigger `renderTickets()` when on Tickets tab.
- Sidebar and zoom controls — conditionally hidden based on `activeTab`.

---

## Out of Scope

- Inline editing of task fields
- Creating new tasks from the Tickets view
- Sorting or column reordering
- Pagination (all tasks fit in one scrollable grid)
