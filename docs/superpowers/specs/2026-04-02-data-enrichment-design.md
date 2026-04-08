# Data Enrichment — Priority & Due Dates Design Spec
**Date:** 2026-04-02

## Overview

Add `priority` and `dueDate` fields to Task nodes. Priority appears as a colored pill on the node card and in the detail panel. Due date appears on the card (smart relative/absolute format) and in the detail panel (full date). Priority is filterable via a new header dropdown. Data stays hardcoded for now; backend/API added later.

---

## Data Model

Add two fields to each object in the `TASKS` array:

| Field | Type | Values |
|---|---|---|
| `priority` | `string \| null` | `'critical'`, `'high'`, `'medium'`, `'low'`, or `null` |
| `dueDate` | `string \| null` | ISO date string e.g. `'2026-04-05'`, or `null` |

Existing task objects without these fields are treated as `priority: null, dueDate: null`.

**Seed values for existing tasks** (hardcoded):

| Task | Priority | Due Date |
|---|---|---|
| Refactor auth module | `'critical'` | `'2026-04-03'` |
| E2E tests — checkout | `'high'` | `'2026-04-08'` |
| CI/CD pipeline setup | `'medium'` | `'2026-03-28'` (done, overdue intentionally) |
| Onboarding screen redesign | `'high'` | `'2026-04-10'` |
| Fix batch job memory leak | `'critical'` | `'2026-04-04'` |
| PostgreSQL 16 migration | `'medium'` | `'2026-04-18'` |

---

## Helper Functions

Two new functions added to the `<script>` section near the top of the utility block:

### `priorityConfig(level)`

```js
// Returns { label, color, bg } for the given priority level.
// Returns null if level is null/undefined.
function priorityConfig(level) {
  const map = {
    critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,.18)' },
    high:     { label: 'High',     color: '#f59e0b', bg: 'rgba(245,158,11,.18)' },
    medium:   { label: 'Medium',   color: '#708aa8', bg: 'rgba(74,92,114,.18)'  },
    low:      { label: 'Low',      color: '#4a5c72', bg: 'rgba(74,92,114,.10)'  },
  };
  return level ? (map[level] || null) : null;
}
```

### `formatDueDate(dateStr)`

```js
// Returns { text, color } using smart display rule:
//   - Overdue → { text: 'Overdue', color: '#ef4444' }
//   - Due within 7 days → { text: 'in N days' | 'Today', color: '#f59e0b' }
//   - Due in 7+ days → { text: 'Apr 18', color: '#4a5c72' }
// Returns null if dateStr is null/undefined.
function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dateStr); due.setHours(0,0,0,0);
  const diff  = Math.round((due - today) / 86400000); // days
  if (diff < 0)  return { text: 'Overdue', color: '#ef4444' };
  if (diff === 0) return { text: 'Today',  color: '#f59e0b' };
  if (diff < 7)  return { text: `in ${diff} day${diff === 1 ? '' : 's'}`, color: '#f59e0b' };
  return {
    text: due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color: '#4a5c72',
  };
}
```

---

## Node Card Rendering

`makeNode()` is updated for task nodes only. The existing `.node-tags` row gains up to two new pills, rendered after the status badge:

**Priority pill** (shown only if `task.priority` is set):
```html
<span class="tag" style="background:{cfg.bg};color:{cfg.color}">● {cfg.label}</span>
```

**Due date pill** (shown only if `task.dueDate` is set):
```html
<span class="tag" style="background:rgba({urgency-color},.12);color:{urgency-color};border:1px solid rgba({urgency-color},.25)">{text}</span>
```

The sidebar tree rows are unchanged — they show only the task title.

---

## Detail Panel

A new meta row is injected into the panel's overview section (`#panel-overview`), between the description paragraph and the end of the section. It only renders for task nodes and only when at least one of `priority` or `dueDate` is set.

- **Priority** — same colored pill as the card
- **Due date** — full date formatted as `"Apr 5, 2026"`, colored by urgency (same color logic as `formatDueDate`, but always shows the full absolute date)

---

## Header Filter

A new `PRIORITY` filter chip added to the header:

```html
<div class="filter-chip">
  <span>Priority</span>
  <select id="f-priority">
    <option value="">All</option>
    <option value="critical">Critical</option>
    <option value="high">High</option>
    <option value="medium">Medium</option>
    <option value="low">Low</option>
  </select>
</div>
```

`filters` object gains a `priority` key (default `''`). `visibleNodes()` is updated: tasks are excluded when `filters.priority` is set and `task.priority !== filters.priority`. Connected devs/agents/sub-agents follow existing cascade logic — they disappear when no visible tasks reference them.

---

## What Is NOT Changing

- Agent, Developer, and Sub-Agent data structures — no new fields
- `render()` lifecycle — priority filter hooks into the existing `visibleNodes()` filter chain
- Node drag, zoom, pan, sidebar, or detail panel layout
