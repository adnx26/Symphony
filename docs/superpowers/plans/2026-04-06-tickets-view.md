# Tickets View Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a Tickets tab to Aura that shows all tasks as a 3-column card grid with a drill-down side panel for inspecting each task's team and chain details.

**Architecture:** All changes live in `index.html` (single-file architecture). A `switchTab()` function toggles visibility between the existing `#app-body` (board) and a new `#tickets-view` container. The existing `#detail-panel` is reused with two new modes: Task Mode (shows team rows — dev, agent, sub-agents) and Agent Mode (calls the existing `openPanel()` with a ← Back button overlaid). The `panelStack` array tracks drill-down history.

**Tech Stack:** Vanilla HTML/CSS/JS, no dependencies, no build step.

---

### Task 1: Add CSS

**Files:**
- Modify: `index.html` — insert all styles before the closing `</style>` tag (currently line 415)

- [ ] **Step 1: Add tab styles**

Insert before `</style>`:

```css
/* ── Tabs ────────────────────────────────────────── */
.tab {
  font-family: 'JetBrains Mono', monospace;
  font-size: .65rem; font-weight: 700; letter-spacing: .03em;
  padding: 0 12px; height: 100%;
  background: none; border: none; border-bottom: 2px solid transparent;
  color: var(--muted); cursor: pointer;
  transition: color .15s, border-color .15s;
}
.tab:hover { color: var(--text); }
.tab.active { color: var(--text); border-bottom-color: rgba(255,255,255,.5); }
```

- [ ] **Step 2: Add tickets view and card styles**

Append immediately after (still before `</style>`):

```css
/* ── Tickets view ────────────────────────────────── */
#tickets-view {
  flex: 1; overflow-y: auto; padding: 24px; display: none;
}
#tickets-view.active { display: block; }
#tickets-grid {
  display: grid; grid-template-columns: repeat(3, 1fr); gap: 14px;
}
@media (max-width: 900px) {
  #tickets-grid { grid-template-columns: repeat(2, 1fr); }
}

/* ── Ticket card ─────────────────────────────────── */
.ticket-card {
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 8px; padding: 12px 14px 12px 17px;
  position: relative; cursor: pointer; overflow: hidden;
  transition: border-color .15s, box-shadow .15s;
}
.ticket-card::before {
  content: ''; position: absolute;
  left: 0; top: 10%; bottom: 10%; width: 3px;
  border-radius: 0 2px 2px 0;
}
.ticket-card:hover { border-color: rgba(255,255,255,.15); }
.ticket-card.selected {
  border-color: rgba(255,255,255,.22);
  box-shadow: 0 0 16px rgba(255,255,255,.04);
}
.ticket-title {
  font-family: 'Syne', sans-serif; font-size: .8rem; font-weight: 700;
  color: #dce8f5; line-height: 1.3; margin-bottom: 5px;
}
.ticket-badges { display: flex; gap: 4px; flex-wrap: wrap; margin-bottom: 6px; }
.ticket-row {
  display: flex; align-items: center; gap: 7px;
  font-size: .63rem; color: var(--muted); margin-top: 5px; line-height: 1.4;
}
.ticket-chips { display: flex; gap: 4px; flex-wrap: wrap; margin-top: 5px; }
.ticket-chip {
  font-size: .55rem; font-weight: 700; padding: 2px 7px; border-radius: 3px;
  background: rgba(255,255,255,.05); border: 1px solid var(--border); color: var(--muted);
}
.ticket-chip.agent { background: rgba(167,139,250,.10); color: #a78bfa; border-color: rgba(167,139,250,.22); }
.ticket-chip.sub   { background: rgba(251,113,133,.08); color: #fb7185; border-color: rgba(251,113,133,.20); }
```

- [ ] **Step 3: Add panel team section and back button styles**

Append immediately after (still before `</style>`):

```css
/* ── Panel team section ──────────────────────────── */
#panel-team-section { display: flex; flex-direction: column; gap: 4px; }
.team-row {
  display: flex; align-items: center; gap: 9px;
  padding: 7px 10px; border-radius: 6px;
  background: rgba(255,255,255,.025); border: 1px solid transparent;
  font-size: .68rem; color: #90a8be;
}
.team-row.clickable { cursor: pointer; transition: background .12s, border-color .12s; }
.team-row.clickable:hover {
  background: rgba(255,255,255,.05); border-color: rgba(255,255,255,.08);
}
.team-row-label {
  font-size: .52rem; font-weight: 700; text-transform: uppercase;
  letter-spacing: .1em; color: var(--muted); min-width: 40px; flex-shrink: 0;
}
.team-row-name { flex: 1; }
.team-row-type { font-size: .58rem; color: var(--muted); font-style: italic; }
.team-row-arrow { color: var(--muted); font-size: .7rem; flex-shrink: 0; }

/* ── Panel back button ───────────────────────────── */
#panel-back-btn {
  display: none; align-items: center; gap: 5px;
  margin: 12px 18px 0; padding: 5px 10px; width: fit-content;
  background: none; border: 1px solid var(--border); border-radius: 5px;
  cursor: pointer; font-family: 'JetBrains Mono', monospace;
  font-size: .63rem; color: var(--muted); flex-shrink: 0;
  transition: color .12s, border-color .12s;
}
#panel-back-btn:hover { color: var(--text); border-color: rgba(255,255,255,.18); }
#panel-back-btn.visible { display: flex; }
```

- [ ] **Step 4: Open `index.html` in a browser — verify the board looks identical to before (no regressions)**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "style: add CSS for tickets tab, card grid, and panel team section"
```

---

### Task 2: Add HTML structure

**Files:**
- Modify: `index.html` — header, body, and detail panel sections

- [ ] **Step 1: Add tab buttons to the header**

Find:
```html
  <div class="logo">AURA</div>
  <div class="sep"></div>
```

Replace with:
```html
  <div class="logo">AURA</div>
  <button class="tab active" data-tab="board">Board</button>
  <button class="tab" data-tab="tickets">Tickets</button>
  <div class="sep"></div>
```

- [ ] **Step 2: Add tickets view container after app-body**

Find:
```html
</div>
<div id="zoom-controls">
```
(This is the closing `</div>` of `#app-body`)

Replace with:
```html
</div>
<div id="tickets-view">
  <div id="tickets-grid"></div>
</div>
<div id="zoom-controls">
```

- [ ] **Step 3: Add back button and team section to the detail panel**

Find:
```html
  <div id="panel-body">
    <div class="panel-section" id="panel-overview">
```

Replace with:
```html
  <div id="panel-body">
    <button id="panel-back-btn">← Back</button>
    <div class="panel-section" id="panel-overview">
```

Then find:
```html
    <div class="panel-section" id="panel-chain-section">
```

Replace with:
```html
    <div class="panel-section" id="panel-team-section">
      <h3>Team</h3>
      <div id="panel-team"></div>
    </div>
    <div class="panel-section" id="panel-chain-section">
```

- [ ] **Step 4: Open in browser — header shows "Board Tickets" tabs, board still renders correctly**

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add HTML structure for tickets tab, grid, and panel team section"
```

---

### Task 3: Add tab switching JS

**Files:**
- Modify: `index.html` — script section

- [ ] **Step 1: Add activeTab and panelStack state variables**

Find:
```js
const zoom      = { x: 0, y: 0, scale: 1 };
```

Replace with:
```js
const zoom       = { x: 0, y: 0, scale: 1 };
let   activeTab  = localStorage.getItem('aura-active-tab') || 'board';
const panelStack = []; // { mode: 'task'|'agent', id: string, fromTaskId?: string }
```

- [ ] **Step 2: Add switchTab function**

Find:
```js
// ── Sidebar visibility ────────────────────────────────────────────────────
```

Insert immediately before that comment:
```js
// ── Tab switching ─────────────────────────────────────────────────────────
function switchTab(tab) {
  activeTab = tab;
  localStorage.setItem('aura-active-tab', tab);

  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab));

  const appBody      = document.getElementById('app-body');
  const ticketsView  = document.getElementById('tickets-view');
  const zoomControls = document.getElementById('zoom-controls');

  if (tab === 'board') {
    appBody.style.display = '';
    ticketsView.classList.remove('active');
    zoomControls.style.display = '';
  } else {
    appBody.style.display = 'none';
    ticketsView.classList.add('active');
    zoomControls.style.display = 'none';
    renderTickets();
  }

  activeId = null;
  panelStack.length = 0;
  closePanel();
  updateSidebarActive();
}

```

- [ ] **Step 3: Wire tab click listeners**

Find:
```js
document.getElementById('tree-toggle').addEventListener('click', toggleSidebar);
```

Replace with:
```js
document.querySelectorAll('.tab').forEach(t =>
  t.addEventListener('click', () => switchTab(t.dataset.tab)));
document.getElementById('panel-back-btn').addEventListener('click', panelBack);
document.getElementById('tree-toggle').addEventListener('click', toggleSidebar);
```

- [ ] **Step 4: Apply initial tab state on init**

Find:
```js
// ── Init ──────────────────────────────────────────────────────────────────
loadPositions();
applySidebarVisibility();
renderSidebar();
render();
applyTransform();
requestAnimationFrame(fitToScreen);
```

Replace with:
```js
// ── Init ──────────────────────────────────────────────────────────────────
loadPositions();
applySidebarVisibility();
renderSidebar();
render();
applyTransform();
if (activeTab === 'tickets') {
  document.querySelectorAll('.tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === 'tickets'));
  document.getElementById('app-body').style.display      = 'none';
  document.getElementById('tickets-view').classList.add('active');
  document.getElementById('zoom-controls').style.display = 'none';
  renderTickets();
} else {
  requestAnimationFrame(fitToScreen);
}
```

- [ ] **Step 5: Open in browser. Click Tickets tab — board disappears, empty grid appears. Click Board — board returns. Refresh page with Tickets active — Tickets view loads directly.**

- [ ] **Step 6: Commit**

```bash
git add index.html
git commit -m "feat: add tab switching between Board and Tickets views"
```

---

### Task 4: Add renderTickets function

**Files:**
- Modify: `index.html` — script section

- [ ] **Step 1: Add renderTickets function**

Find:
```js
// ── Render nodes ──────────────────────────────────────────────────────────
```

Insert immediately before that comment:
```js
// ── Tickets view render ───────────────────────────────────────────────────
function renderTickets() {
  const { tasks, edges } = visibleNodes();
  curEdges = edges; // keep curEdges in sync so panel chain vis works in tickets view

  const grid = document.getElementById('tickets-grid');
  if (!grid) return;
  grid.innerHTML = '';

  document.getElementById('stat').textContent =
    `${tasks.length} ticket${tasks.length !== 1 ? 's' : ''} · click to inspect`;

  if (!tasks.length) {
    const empty = document.createElement('div');
    empty.className = 'empty';
    empty.style.gridColumn = '1 / -1';
    empty.textContent = 'No tickets match the current filters.';
    grid.appendChild(empty);
    return;
  }

  tasks.forEach(task => {
    const dev       = DEVELOPERS.find(d => d.id === task.developerId);
    const agent     = AGENTS.find(a => a.id === task.agentId);
    const subAgents = agent ? SUB_AGENTS.filter(sa => sa.parentId === agent.id) : [];
    const pc        = priorityConfig(task.priority);
    const dd        = formatDueDate(task.dueDate);

    const card = document.createElement('div');
    card.className = 'ticket-card' + (activeId === task.id ? ' selected' : '');
    card.dataset.id = task.id;

    // Priority accent bar via injected style (same pattern as task nodes on the board)
    const accentColor = pc ? pc.color : '#f59e0b';
    const styleTag = document.createElement('style');
    styleTag.textContent = `.ticket-card[data-id="${task.id}"]::before{background:${accentColor}}`;
    card.appendChild(styleTag);

    // Title
    const titleEl = document.createElement('div');
    titleEl.className = 'ticket-title';
    titleEl.textContent = task.title;
    card.appendChild(titleEl);

    // Status + priority + due date badges
    const badgesEl = document.createElement('div');
    badgesEl.className = 'ticket-badges';
    badgesEl.innerHTML =
      `<span class="tag tag-${task.status}">${STATUS_LABEL[task.status]}</span>` +
      (pc ? `<span class="tag" style="background:${pc.bg};color:${pc.color}">● ${pc.label}</span>` : '') +
      (dd ? `<span class="tag" style="background:${dd.bg};color:${dd.color};border:1px solid ${dd.border}">${dd.text}</span>` : '');
    card.appendChild(badgesEl);

    // Developer row
    if (dev) {
      const devRow = document.createElement('div');
      devRow.className = 'ticket-row';
      devRow.innerHTML =
        `<span class="avatar" style="background:${dev.avatarBg};color:var(--c-dev);width:18px;height:18px;font-size:.5rem;border-radius:4px">${dev.initials}</span>` +
        `<span>${dev.name}</span>`;
      card.appendChild(devRow);
    }

    // Agent + sub-agent chips
    if (agent) {
      const chipsEl = document.createElement('div');
      chipsEl.className = 'ticket-chips';
      chipsEl.innerHTML =
        `<span class="ticket-chip agent">${agent.name}</span>` +
        subAgents.map(sa => `<span class="ticket-chip sub">${sa.name}</span>`).join('');
      card.appendChild(chipsEl);
    }

    card.addEventListener('click', () => openTicketPanel(task.id));
    grid.appendChild(card);
  });
}

```

- [ ] **Step 2: Update filter listeners to call renderTickets when on Tickets tab**

Find:
```js
['f-dev','f-type','f-status','f-priority'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    const key = { 'f-dev':'dev', 'f-type':'type', 'f-status':'status', 'f-priority':'priority' }[id];
    if (!key) return;
    filters[key] = e.target.value;
    activeId = null; closePanel(); render(); updateSidebarActive();
  });
});
```

Replace with:
```js
['f-dev','f-type','f-status','f-priority'].forEach(id => {
  document.getElementById(id).addEventListener('change', e => {
    const key = { 'f-dev':'dev', 'f-type':'type', 'f-status':'status', 'f-priority':'priority' }[id];
    if (!key) return;
    filters[key] = e.target.value;
    activeId = null; closePanel(); updateSidebarActive();
    if (activeTab === 'tickets') {
      renderTickets();
    } else {
      render();
    }
  });
});
```

- [ ] **Step 3: Open in browser on Tickets tab. Verify 6 task cards appear with correct title, status badge, priority pill, due date pill, developer avatar+name, agent chip, sub-agent chips. Filter by Status "Blocked" — only 1 card. Filter by Priority "Critical" — 2 cards. Clear both filters — 6 cards.**

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: render ticket cards with real-time filtering"
```

---

### Task 5: Add panel drill-down (Task Mode → Agent Mode → Back)

**Files:**
- Modify: `index.html` — script section, `openPanel` function

- [ ] **Step 1: Modify openPanel to reset team/back-button state**

This ensures board-view clicks always show the standard chain panel without team section or back button.

Find the first 5 lines of `openPanel`:
```js
function openPanel(nid) {
  const data = findNode(nid);
  if (!data) return;
  const kind = nodeKind(nid);

  document.getElementById('panel-accent').style.background = kind.color;
```

Replace with:
```js
function openPanel(nid) {
  const data = findNode(nid);
  if (!data) return;
  const kind = nodeKind(nid);

  // Reset tickets-view-specific panel state
  document.getElementById('panel-back-btn').classList.remove('visible');
  document.getElementById('panel-team-section').style.display  = 'none';
  document.getElementById('panel-chain-section').style.display = '';

  document.getElementById('panel-accent').style.background = kind.color;
```

- [ ] **Step 2: Add openTicketPanel, drillToAgent, and panelBack functions**

Find:
```js
// ── Node click ────────────────────────────────────────────────────────────
```

Insert immediately before that comment:
```js
// ── Ticket panel ──────────────────────────────────────────────────────────
function openTicketPanel(taskId) {
  const task = TASKS.find(t => t.id === taskId);
  if (!task) return;

  activeId = taskId;
  panelStack.length = 0;
  panelStack.push({ mode: 'task', id: taskId });

  // Highlight selected card
  document.querySelectorAll('.ticket-card').forEach(c =>
    c.classList.toggle('selected', c.dataset.id === taskId));

  // Panel header
  const kind = nodeKind(taskId);
  document.getElementById('panel-accent').style.background = kind.color;
  document.getElementById('panel-badge').textContent       = kind.label;
  document.getElementById('panel-badge').style.cssText     = `background:${kind.bg};color:${kind.color}`;
  document.getElementById('panel-title').textContent       = task.title;
  document.getElementById('panel-subtitle').textContent    = task.desc || '';

  // Overview section
  document.getElementById('panel-desc').textContent = task.overview || task.desc || '—';
  const metaEl = document.getElementById('panel-meta');
  metaEl.innerHTML = '';
  const pc = priorityConfig(task.priority);
  if (pc) {
    const pill = document.createElement('span');
    pill.className = 'tag';
    pill.style.cssText = `background:${pc.bg};color:${pc.color}`;
    pill.textContent = `● ${pc.label}`;
    metaEl.appendChild(pill);
  }
  if (task.dueDate) {
    const dd = formatDueDate(task.dueDate);
    const [fdy, fdm, fdd] = task.dueDate.split('-').map(Number);
    const fullDate = new Date(fdy, fdm - 1, fdd)
      .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const pill = document.createElement('span');
    pill.className = 'tag';
    pill.style.cssText = `background:${dd.bg};color:${dd.color};border:1px solid ${dd.border}`;
    pill.textContent = `📅 ${fullDate}`;
    metaEl.appendChild(pill);
  }

  // Show team section, hide chain section and back button
  document.getElementById('panel-back-btn').classList.remove('visible');
  document.getElementById('panel-chain-section').style.display = 'none';
  document.getElementById('panel-team-section').style.display  = '';

  // Build team rows
  const dev       = DEVELOPERS.find(d => d.id === task.developerId);
  const agent     = AGENTS.find(a => a.id === task.agentId);
  const subAgents = agent ? SUB_AGENTS.filter(sa => sa.parentId === agent.id) : [];
  const teamEl    = document.getElementById('panel-team');
  teamEl.innerHTML = '';

  if (dev) {
    const row = document.createElement('div');
    row.className = 'team-row';
    row.innerHTML =
      `<span class="team-row-label">Dev</span>` +
      `<span class="avatar" style="background:${dev.avatarBg};color:var(--c-dev);width:18px;height:18px;font-size:.5rem;border-radius:4px;flex-shrink:0">${dev.initials}</span>` +
      `<span class="team-row-name">${dev.name}</span>` +
      `<span class="team-row-type">${dev.role}</span>`;
    teamEl.appendChild(row);
  }

  if (agent) {
    const row = document.createElement('div');
    row.className = 'team-row clickable';
    row.innerHTML =
      `<span class="team-row-label">Agent</span>` +
      `<span class="team-row-name" style="color:#a78bfa">${agent.name}</span>` +
      `<span class="team-row-type">${agent.type}</span>` +
      `<span class="team-row-arrow">›</span>`;
    row.addEventListener('click', () => drillToAgent(agent.id, taskId));
    teamEl.appendChild(row);
  }

  subAgents.forEach(sa => {
    const row = document.createElement('div');
    row.className = 'team-row clickable';
    row.innerHTML =
      `<span class="team-row-label">Sub</span>` +
      `<span class="team-row-name" style="color:#fb7185">${sa.name}</span>` +
      `<span class="team-row-type">${sa.type}</span>` +
      `<span class="team-row-arrow">›</span>`;
    row.addEventListener('click', () => drillToAgent(sa.id, taskId));
    teamEl.appendChild(row);
  });

  // Criteria
  renderCriteria(taskId, task.criteria || []);

  document.getElementById('detail-panel').classList.add('open');
  document.body.classList.add('panel-open');
}

function drillToAgent(id, fromTaskId) {
  panelStack.push({ mode: 'agent', id, fromTaskId });
  // openPanel resets team section visibility and chain section; then we show the back button
  openPanel(id);
  document.getElementById('panel-back-btn').classList.add('visible');
}

function panelBack() {
  panelStack.pop();
  const prev = panelStack[panelStack.length - 1];
  if (!prev) return;
  if (prev.mode === 'task') openTicketPanel(prev.id);
}

```

- [ ] **Step 3: Open in browser on the Tickets tab**

  - Click any task card → panel slides in showing Team section with Dev row (not clickable), Agent row with ›, Sub-agent rows with ›, and Completion Criteria below.
  - Click the Agent row → panel updates to show that agent's description, chain vis, outputs, and criteria. "← Back" button appears at top.
  - Click ← Back → panel returns to the task's Team view.
  - Click a sub-agent row → panel updates to sub-agent info. ← Back returns to task panel.

- [ ] **Step 4: Switch to Board tab and verify existing behavior is unchanged**

  - Click any node → panel opens with chain vis, no back button, no team section.
  - Click another node, close panel — all work as before.

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: add ticket panel with team drill-down and back navigation"
```
