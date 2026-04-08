# Data Enrichment — Priority & Due Dates Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add `priority` and `dueDate` fields to Tasks, display them as pills on node cards and in the detail panel, and make priority filterable from the header.

**Architecture:** Single file (`index.html`). Two helper functions (`priorityConfig`, `formatDueDate`) are added to the script section. `TASKS` data is seeded with priority/dueDate values. `makeNode()` and `openPanel()` are updated to render the new fields. A new PRIORITY filter chip is added to the header and wired into `visibleNodes()`.

**Tech Stack:** Vanilla HTML/CSS/JS, no dependencies, no build step.

---

## Files

- Modify: `index.html` — all changes in this one file
  - `<script>`: seed TASKS data, add helpers, update `makeNode()`, update `openPanel()`, update `filters`, `visibleNodes()`, event listeners
  - `<body>`: add PRIORITY filter chip in header, add `#panel-meta` div in detail panel

---

## Task 1: Seed TASKS data and add helper functions

**Files:**
- Modify: `index.html` (script section — TASKS array and utility block)

- [ ] **Step 1: Add `priority` and `dueDate` to each task in the `TASKS` array**

Find the `TASKS` array (starts around `const TASKS = [`). Replace the entire array with:

```js
const TASKS = [
  { id:'t1', title:'Refactor auth module',       desc:'Break monolithic auth into testable repository units', status:'progress', developerId:'d1', agentId:'a1',
    priority:'critical', dueDate:'2026-04-03',
    overview: 'The authentication module is a 2,400-line monolith that mixes concerns and makes isolated testing impossible. This task decomposes it into focused repositories following the repository pattern.',
    criteria:['Auth decomposed into ≤ 5 repository classes','JWT validation enforced server-side only','Rate limiter active on /login (max 5 req/min)','No hardcoded secrets in any config file','All 47 existing auth tests pass','Peer review approved by senior engineer'] },
  { id:'t2', title:'E2E tests — checkout',       desc:'Cover happy-path and promo edge cases with Playwright', status:'todo', developerId:'d2', agentId:'a2',
    priority:'high', dueDate:'2026-04-08',
    overview: 'The checkout flow currently has zero E2E coverage. A recent release broke promo-code stacking silently. This task establishes a comprehensive Playwright suite to catch regressions early.',
    criteria:['12+ test cases covering checkout flow','Happy-path cart → payment → confirmation covered','Invalid, expired, and stacking promo codes tested','All tests passing in CI on every PR','Coverage report attached and reviewed','Flaky tests eliminated before merge'] },
  { id:'t3', title:'CI/CD pipeline setup',       desc:'GitHub Actions: build → test → staging deploy on merge', status:'done', developerId:'d3', agentId:'a3',
    priority:'medium', dueDate:'2026-03-28',
    overview: 'Establish an automated GitHub Actions pipeline so every PR merge triggers a full build, test, and staging deployment without manual intervention.',
    criteria:['YAML config merged to main branch','Build stage completes in < 3 min','Test stage runs all suites green','Staging deploy triggered automatically on merge','Average total pipeline time < 6 min','Rollback procedure documented in runbook'] },
  { id:'t4', title:'Onboarding screen redesign', desc:'High-fidelity Figma mockups for 3-step onboarding', status:'todo', developerId:'d1', agentId:'a4',
    priority:'high', dueDate:'2026-04-10',
    overview: 'User research shows a 62 % drop-off during onboarding. This task produces high-fidelity redesigned screens for the 3-step flow, incorporating UX research findings and new design system tokens.',
    criteria:['All 3 onboarding screens designed in Figma','Mobile-responsive variants at 375 px and 768 px','All design-system tokens applied (no raw hex values)','Progress-bar component included on all steps','Stakeholder review sign-off recorded','Dev handoff annotations on every frame'] },
  { id:'t5', title:'Fix batch job memory leak',  desc:'Profile nightly job — suspect unclosed stream handles', status:'blocked', developerId:'d2', agentId:'a2',
    priority:'critical', dueDate:'2026-04-04',
    overview: 'The nightly ETL batch job crashes with OOM around 03:00 UTC, corrupting partial outputs. Root cause is suspected to be unclosed ReadableStream handles in the CSV ingestion loop.',
    criteria:['Root cause identified and documented','Heap profiler report attached to ticket','Fix deployed and validated on staging','3 consecutive clean nightly runs observed','Memory usage stays below 512 MB throughout run','Post-mortem written and shared with team'] },
  { id:'t6', title:'PostgreSQL 16 migration',    desc:'Upgrade schema, pool config, and validate query perf', status:'progress', developerId:'d3', agentId:'a3',
    priority:'medium', dueDate:'2026-04-18',
    overview: 'Upgrade the production database from PostgreSQL 14 to 16 to gain access to logical replication improvements and security patches. Requires schema validation, pool reconfiguration, and a zero-downtime cutover plan.',
    criteria:['Migration script tested on staging clone','All queries validated against PG16 planner','Connection pool config updated for new defaults','Performance benchmarks match or exceed PG14 baseline','Zero-downtime cutover plan documented','Rollback to PG14 verified possible within 15 min'] },
];
```

- [ ] **Step 2: Add `priorityConfig()` and `formatDueDate()` helpers**

Find this comment in `<script>`:
```js
// ── Constants ─────────────────────────────────────────────────────────────
```

Add the two helper functions immediately before it:

```js
// ── Priority & due date helpers ───────────────────────────────────────────
function priorityConfig(level) {
  const map = {
    critical: { label: 'Critical', color: '#ef4444', bg: 'rgba(239,68,68,.18)' },
    high:     { label: 'High',     color: '#f59e0b', bg: 'rgba(245,158,11,.18)' },
    medium:   { label: 'Medium',   color: '#708aa8', bg: 'rgba(74,92,114,.18)'  },
    low:      { label: 'Low',      color: '#4a5c72', bg: 'rgba(74,92,114,.10)'  },
  };
  return level ? (map[level] || null) : null;
}

function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const due   = new Date(dateStr); due.setHours(0,0,0,0);
  const diff  = Math.round((due - today) / 86400000);
  if (diff < 0)   return { text: 'Overdue', color: '#ef4444', bg: 'rgba(239,68,68,.12)',  border: 'rgba(239,68,68,.25)'  };
  if (diff === 0) return { text: 'Today',   color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.25)' };
  if (diff < 7)   return { text: `in ${diff} day${diff === 1 ? '' : 's'}`, color: '#f59e0b', bg: 'rgba(245,158,11,.12)', border: 'rgba(245,158,11,.25)' };
  return {
    text:   due.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    color:  '#4a5c72',
    bg:     'rgba(74,92,114,.10)',
    border: 'rgba(74,92,114,.20)',
  };
}

```

- [ ] **Step 3: Verify in browser**

Open `index.html`. The canvas should render normally — no visual change yet, but no JS errors in the console either. Open DevTools console and run:
```js
priorityConfig('critical')   // → { label: 'Critical', color: '#ef4444', bg: '...' }
formatDueDate('2026-04-03')  // → { text: 'in 1 day' or similar, color: '#f59e0b', ... }
formatDueDate('2026-03-28')  // → { text: 'Overdue', color: '#ef4444', ... }
formatDueDate('2026-04-18')  // → { text: 'Apr 18', color: '#4a5c72', ... }
```

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: seed priority/dueDate in TASKS, add priorityConfig and formatDueDate helpers"
```

---

## Task 2: Render priority and due date pills on task node cards

**Files:**
- Modify: `index.html` (script section — render block)

- [ ] **Step 1: Update the task node innerHTML in `render()`**

Find this in the `render()` function (inside the `tasks.forEach` block):

```js
    `<div class="node-title">${t.title}</div>
     <div class="node-sub">${t.desc}</div>
     <div class="node-tags"><span class="tag tag-${t.status}">${STATUS_LABEL[t.status]}</span></div>`,
```

Replace with:

```js
    ((() => {
      const pc  = priorityConfig(t.priority);
      const dd  = formatDueDate(t.dueDate);
      const priorityPill = pc
        ? `<span class="tag" style="background:${pc.bg};color:${pc.color}">● ${pc.label}</span>`
        : '';
      const duePill = dd
        ? `<span class="tag" style="background:${dd.bg};color:${dd.color};border:1px solid ${dd.border}">${dd.text}</span>`
        : '';
      return `<div class="node-title">${t.title}</div>
     <div class="node-sub">${t.desc}</div>
     <div class="node-tags"><span class="tag tag-${t.status}">${STATUS_LABEL[t.status]}</span>${priorityPill}${duePill}</div>`;
    })()),
```

- [ ] **Step 2: Verify in browser**

Open `index.html`. Task node cards should now show:
- A colored `● Critical` / `● High` / `● Medium` pill after the status badge
- A due date pill: "Overdue" (red) for CI/CD pipeline (Mar 28), "in N days" (amber) for tasks due within a week, or "Apr 10" / "Apr 18" (muted) for tasks further out

The developer, agent, and sub-agent nodes should be unchanged.

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: show priority and due date pills on task node cards"
```

---

## Task 3: Show priority and due date in the detail panel

**Files:**
- Modify: `index.html` (body section — detail panel HTML, and script section — `openPanel()`)

- [ ] **Step 1: Add `#panel-meta` div to the detail panel HTML**

Find in `<body>`:
```html
    <div class="panel-section" id="panel-overview">
      <h3>Overview</h3>
      <p id="panel-desc"></p>
    </div>
```

Replace with:
```html
    <div class="panel-section" id="panel-overview">
      <h3>Overview</h3>
      <p id="panel-desc"></p>
      <div id="panel-meta" style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px"></div>
    </div>
```

- [ ] **Step 2: Populate `#panel-meta` inside `openPanel()`**

Find the `openPanel()` function. After this line:
```js
  document.getElementById('panel-desc').textContent =
    data.overview || data.desc || '—';
```

Add:
```js
  const metaEl = document.getElementById('panel-meta');
  metaEl.innerHTML = '';
  if (TASKS.find(x => x.id === nid)) {
    const pc = priorityConfig(data.priority);
    if (pc) {
      const pill = document.createElement('span');
      pill.className = 'tag';
      pill.style.cssText = `background:${pc.bg};color:${pc.color}`;
      pill.textContent = `● ${pc.label}`;
      metaEl.appendChild(pill);
    }
    if (data.dueDate) {
      const dd = formatDueDate(data.dueDate);
      const fullDate = new Date(data.dueDate)
        .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
      const pill = document.createElement('span');
      pill.className = 'tag';
      pill.style.cssText = `background:${dd.bg};color:${dd.color};border:1px solid ${dd.border}`;
      pill.textContent = `📅 ${fullDate}`;
      metaEl.appendChild(pill);
    }
  }
```

- [ ] **Step 3: Verify in browser**

Click any task node. The detail panel should show a priority pill and a due date pill (full date like "Apr 3, 2026") below the description. Click a developer or agent node — `#panel-meta` should be empty (no pills).

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: show priority and due date in task detail panel"
```

---

## Task 4: Priority filter chip in header

**Files:**
- Modify: `index.html` (body section — header HTML, and script section — filters, visibleNodes, event listeners)

- [ ] **Step 1: Add the PRIORITY filter chip to the header HTML**

Find in `<body>`:
```html
  <div class="filter-chip">
    <span>Status</span>
    <select id="f-status">
      <option value="">All</option>
      <option value="todo">To Do</option>
      <option value="progress">In Progress</option>
      <option value="done">Done</option>
      <option value="blocked">Blocked</option>
    </select>
  </div>
  <div class="header-right">
```

Replace with:
```html
  <div class="filter-chip">
    <span>Status</span>
    <select id="f-status">
      <option value="">All</option>
      <option value="todo">To Do</option>
      <option value="progress">In Progress</option>
      <option value="done">Done</option>
      <option value="blocked">Blocked</option>
    </select>
  </div>
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
  <div class="header-right">
```

- [ ] **Step 2: Add `priority` key to the `filters` object**

Find:
```js
const filters  = { dev:'', type:'', status:'' };
```

Replace with:
```js
const filters  = { dev:'', type:'', status:'', priority:'' };
```

- [ ] **Step 3: Add priority filtering to `visibleNodes()`**

Find inside `visibleNodes()`:
```js
    if (filters.dev    && dv?.name !== filters.dev)    return false;
    if (filters.type   && ag?.type !== filters.type)   return false;
    if (filters.status && t.status !== filters.status) return false;
    return true;
```

Replace with:
```js
    if (filters.dev      && dv?.name    !== filters.dev)      return false;
    if (filters.type     && ag?.type    !== filters.type)     return false;
    if (filters.status   && t.status    !== filters.status)   return false;
    if (filters.priority && t.priority  !== filters.priority) return false;
    return true;
```

- [ ] **Step 4: Wire the `f-priority` event listener**

Find:
```js
['f-dev','f-type','f-status'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    filters[id === 'f-dev' ? 'dev' : id === 'f-type' ? 'type' : 'status'] = e.target.value;
    activeId = null; closePanel(); render(); updateSidebarActive();
  });
});
```

Replace with:
```js
['f-dev','f-type','f-status','f-priority'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    const key = { 'f-dev':'dev', 'f-type':'type', 'f-status':'status', 'f-priority':'priority' }[id];
    filters[key] = e.target.value;
    activeId = null; closePanel(); render(); updateSidebarActive();
  });
});
```

- [ ] **Step 5: Verify in browser**

Open `index.html`. The header should show a new PRIORITY dropdown. Select "Critical" — only the two critical tasks (Refactor auth, Fix batch job) and their connected nodes should remain on the canvas. Select "All" — all nodes return.

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add priority filter chip to header"
```
