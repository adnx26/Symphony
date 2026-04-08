# Black & White Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all chromatic colors in Aura with a monochrome palette — near-black backgrounds, tonal surface layers, warm off-white text, and white accents — while differentiating node types via left-bar brightness, border treatment, and uppercase badges.

**Architecture:** Color values live in three places: `helpers.js` (nodeKind, priorityConfig, formatDueDate, CHAIN_COLORS, LANE_COLORS), `app.css` (theme tokens and global imperative-DOM classes), and inline `style=` attributes spread across Svelte components. This plan updates all three layers in order so each commit leaves the app in a consistent visual state.

**Tech Stack:** SvelteKit, Tailwind v4, vanilla CSS custom properties, imperative DOM (board canvas uses `document.createElement`)

---

### Task 1: Update color constants and helper functions in helpers.js

**Files:**
- Modify: `src/lib/helpers.js:7-53`

- [ ] **Step 1: Replace CHAIN_COLORS and LANE_COLORS**

Replace lines 7–9 in `src/lib/helpers.js`:

```js
export const CHAIN_COLORS = ['#ffffff','#d4d0cb','#8a8680','#545250','#a0a09c','#787674'];
export const LANE_LABELS  = ['Tasks','Developers','Agents','Sub-Agents','Sub-Sub-Agents','Level 5','Level 6','Level 7'];
export const LANE_COLORS  = ['rgba(255,255,255,0.015)','rgba(255,255,255,0.02)','rgba(255,255,255,0.025)','rgba(255,255,255,0.02)'];
```

- [ ] **Step 2: Replace priorityConfig**

Replace the `priorityConfig` function (lines 12–20):

```js
export function priorityConfig(level) {
  const map = {
    critical: { label:'Critical', color:'#ffffff',  bg:'rgba(255,255,255,.18)' },
    high:     { label:'High',     color:'#d4d0cb',  bg:'rgba(255,255,255,.12)' },
    medium:   { label:'Medium',   color:'#8a8680',  bg:'rgba(255,255,255,.07)' },
    low:      { label:'Low',      color:'#545250',  bg:'rgba(255,255,255,.04)' },
  };
  return level ? (map[level] || null) : null;
}
```

- [ ] **Step 3: Replace formatDueDate**

Replace the `formatDueDate` function (lines 22–32):

```js
export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const due  = new Date(dy, dm - 1, dd);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0)   return { text:'Overdue', color:'#ffffff',  bg:'rgba(255,255,255,.14)', border:'rgba(255,255,255,.28)' };
  if (diff === 0) return { text:'Today',   color:'#d4d0cb',  bg:'rgba(255,255,255,.10)', border:'rgba(255,255,255,.20)' };
  if (diff < 7)   return { text:`in ${diff} day${diff===1?'':'s'}`, color:'#d4d0cb', bg:'rgba(255,255,255,.08)', border:'rgba(255,255,255,.16)' };
  return { text: due.toLocaleDateString('en-US',{month:'short',day:'numeric'}), color:'#545250', bg:'rgba(255,255,255,.04)', border:'rgba(255,255,255,.08)' };
}
```

- [ ] **Step 4: Replace nodeKind**

Replace the `nodeKind` function (lines 43–53):

```js
export function nodeKind(id) {
  if (TASKS.find(x => x.id === id))      return { label:'Task',      color:'#ffffff',  bg:'rgba(255,255,255,.08)' };
  if (DEVELOPERS.find(x => x.id === id)) return { label:'Developer', color:'#d4d0cb',  bg:'rgba(255,255,255,.06)' };
  if (AGENTS.find(x => x.id === id))     return { label:'Agent',     color:'#8a8680',  bg:'rgba(255,255,255,.05)' };
  if (SUB_AGENTS.find(x => x.id === id)) {
    const depth = getDepth(id);
    const prefix = depth > 3 ? 'Sub-'.repeat(depth - 2) : '';
    return { label: prefix + 'Agent', color:'#545250', bg:'rgba(255,255,255,.04)' };
  }
  return { label:'Node', color:'rgba(255,255,255,0.35)', bg:'rgba(255,255,255,.04)' };
}
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/helpers.js
git commit -m "refactor: update helpers to monochrome color constants"
```

---

### Task 2: Update hardcoded sub-agent edge color in filters.js

**Files:**
- Modify: `src/lib/stores/filters.js:45`

- [ ] **Step 1: Replace sub-agent edge color**

On line 45 of `src/lib/stores/filters.js`, change:

```js
subAgents.forEach(sa => edges.push({ from:sa.parentId, to:sa.id, color:'rgba(167,139,250,0.5)', taskId:null }));
```

to:

```js
subAgents.forEach(sa => edges.push({ from:sa.parentId, to:sa.id, color:'rgba(255,255,255,0.18)', taskId:null }));
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/stores/filters.js
git commit -m "refactor: update sub-agent edge color to monochrome"
```

---

### Task 3: Rewrite theme tokens and all global CSS in app.css

**Files:**
- Modify: `src/app.css`

- [ ] **Step 1: Replace @theme tokens and body styles**

Replace lines 1–34 of `src/app.css`:

```css
@import "tailwindcss";

@theme {
  --color-aura-bg:       #0c0c0c;
  --color-aura-surface:  #161616;
  --color-aura-surface2: #1e1e1e;
  --color-aura-surface3: #262626;
  --color-aura-text:     #f0ede8;
  --color-aura-muted:    rgba(255,255,255,0.35);
  --color-aura-white:    #ffffff;
  --font-mono: "JetBrains Mono", monospace;
  --font-syne: "Syne", sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "JetBrains Mono", monospace;
  background: #0c0c0c;
  color: #f0ede8;
  height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

body::before {
  content: '';
  position: fixed; inset: 0;
  background-image: radial-gradient(circle, rgba(255,255,255,0.028) 1px, transparent 1px);
  background-size: 28px 28px;
  pointer-events: none; z-index: 0;
}
```

- [ ] **Step 2: Replace node base styles (lines ~36–67)**

Replace from `@keyframes flow` through `.task-node.lit` (approximately lines 36–67):

```css
@keyframes flow { to { stroke-dashoffset: -24; } }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.065); border-radius: 2px; }

/* ── Board nodes (imperative DOM — cannot use scoped component styles) ── */
.node {
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.08);
  background: #161616; padding: 11px 13px 11px 15px;
  cursor: move; position: absolute; width: 220px;
  transition: border-color .18s, box-shadow .18s, opacity .22s; z-index: 2;
}
.node.dragging { box-shadow: 0 8px 32px rgba(0,0,0,0.6); z-index: 50; }
.node::before { content:''; position:absolute; left:0; top:12%; bottom:12%; width:3px; border-radius:0 2px 2px 0; }
.node:hover { border-color: rgba(255,255,255,.16); }
.node.dimmed { opacity: .04; pointer-events: none; }
.node.lit    { border-color: rgba(255,255,255,.28) !important; box-shadow: 0 0 20px rgba(255,255,255,0.12), inset 0 0 24px rgba(255,255,255,0.03); }

.task-node  { border-color: rgba(255,255,255,0.14); }
.dev-node::before   { background: #d4d0cb; }
.agent-node::before { background: #8a8680; }
.sub-node::before   { background: #545250; }
.task-node::before  { background: #ffffff; }
```

- [ ] **Step 3: Replace node text, tag, and avatar styles (lines ~68–80)**

Replace from `.node-title` through `.avatar`:

```css
.node-title { font-family:'Syne',sans-serif; font-size:.75rem; font-weight:700; line-height:1.35; margin-bottom:3px; color:#f0ede8; }
.node-sub   { font-size:.62rem; color:rgba(255,255,255,0.32); font-style:italic; line-height:1.4; }
.node-tags  { display:flex; gap:4px; flex-wrap:wrap; margin-top:5px; }
.node-row   { display:flex; align-items:center; }

.tag { font-size:.55rem; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:.05em; }
.tag-todo     { background:rgba(255,255,255,.06);  color:rgba(255,255,255,.35); }
.tag-progress { background:rgba(255,255,255,.12);  color:#f0ede8; }
.tag-done     { background:rgba(255,255,255,.10);  color:#f0ede8; }
.tag-blocked  { background:rgba(255,255,255,.06);  color:rgba(255,255,255,.25); }

.avatar {
  display:inline-flex; align-items:center; justify-content:center;
  width:22px; height:22px; border-radius:5px;
  font-size:.55rem; font-weight:700; color:#0c0c0c;
  margin-right:6px; vertical-align:middle; flex-shrink:0;
}

.node-type-badge {
  position:absolute; top:8px; right:9px;
  font-size:.46rem; font-weight:700; text-transform:uppercase; letter-spacing:.1em;
  padding:2px 5px; border-radius:3px;
  background:rgba(255,255,255,.06); color:rgba(255,255,255,.35);
  pointer-events:none;
}
```

- [ ] **Step 4: Replace SVG connection styles (lines ~82–89)**

Replace from `/* ── SVG connections ── */` through `.conn.litpath`:

```css
/* ── SVG connections ── */
.conn {
  fill:none; stroke-linecap:round; stroke-dasharray:6 5;
  animation: flow .9s linear infinite;
  transition: opacity .22s, stroke-width .22s;
}
.conn.dimpath { opacity:.025 !important; }
.conn.litpath { opacity:.75 !important; stroke-width:2.4 !important; }
```

- [ ] **Step 5: Replace swimlane and detail panel styles (lines ~91–137)**

Replace from `/* ── Swimlanes ── */` to the end of the file:

```css
/* ── Swimlanes ── */
.swimlane { position:absolute; top:0; height:4000px; border-right:1px solid rgba(255,255,255,0.04); pointer-events:none; z-index:0; }
.lane-label { font-family:'Syne',sans-serif; font-size:.55rem; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:rgba(255,255,255,0.07); padding:18px 14px; display:block; }

/* ── Canvas ── */
#canvas         { cursor: grab; }
#canvas.panning { cursor: grabbing; }

/* ── Detail panel ── */
#detail-panel {
  position:fixed; top:52px; right:0; bottom:0; width:380px;
  background:#0f0f0f; border-left:1px solid rgba(255,255,255,.07);
  transform:translateX(100%); transition:transform .32s cubic-bezier(.16,1,.3,1);
  z-index:30; display:flex; flex-direction:column; overflow:hidden;
}
#detail-panel.open { transform:translateX(0); }

.panel-section {
  padding:14px 18px; border-bottom:1px solid rgba(255,255,255,.05);
  display:flex; flex-direction:column; gap:8px; flex-shrink:0;
}
.panel-section:last-child { border-bottom:none; }
.panel-section h3 {
  font-family:'Syne',sans-serif; font-size:.58rem; font-weight:700;
  text-transform:uppercase; letter-spacing:.14em; color:rgba(255,255,255,.28); margin-bottom:4px;
}

/* ── Chain vis ── */
.chain-chip { font-family:'Syne',sans-serif; font-size:.62rem; font-weight:700; padding:4px 10px; border-radius:5px; border:1px solid rgba(255,255,255,.10); background:#1e1e1e; white-space:nowrap; max-width:110px; overflow:hidden; text-overflow:ellipsis; }
.chain-type { font-size:.52rem; color:rgba(255,255,255,.28); }
.chain-arrow { font-size:.7rem; color:rgba(255,255,255,.28); align-self:center; padding-top:2px; }
.chain-node { display:flex; flex-direction:column; align-items:center; gap:4px; }
.chain-branch { display:flex; flex-direction:column; gap:4px; }

/* ── Criteria ── */
.criterion { display:flex; align-items:flex-start; gap:9px; padding:7px 10px; border-radius:6px; background:rgba(255,255,255,.03); border:1px solid transparent; cursor:pointer; transition:background .12s,border-color .12s; }
.criterion:hover { background:rgba(255,255,255,.05); }
.criterion.checked { background:rgba(255,255,255,.07); border-color:rgba(255,255,255,.14); }
.crit-box { width:14px; height:14px; border-radius:3px; flex-shrink:0; border:1.5px solid rgba(255,255,255,.28); margin-top:1px; display:flex; align-items:center; justify-content:center; transition:background .12s,border-color .12s; font-size:.6rem; color:transparent; }
.criterion.checked .crit-box { background:#ffffff; border-color:#ffffff; color:#0c0c0c; }
.crit-text { font-size:.68rem; line-height:1.5; color:rgba(255,255,255,.45); transition:color .12s; }
.criterion.checked .crit-text { color:rgba(255,255,255,.28); text-decoration:line-through; }

/* ── Team rows (ticket panel) ── */
.team-row { display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:6px; background:rgba(255,255,255,.025); border:1px solid transparent; font-size:.68rem; color:rgba(255,255,255,.45); }
.team-row.clickable { cursor:pointer; transition:background .12s,border-color .12s; }
.team-row.clickable:hover { background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.08); }
```

- [ ] **Step 6: Commit**

```bash
git add src/app.css
git commit -m "refactor: replace all chromatic CSS with monochrome palette"
```

---

### Task 4: Update Header.svelte

**Files:**
- Modify: `src/lib/components/Header.svelte:22-24,73-74`

- [ ] **Step 1: Remove logo gradient**

Replace lines 21–24 in `src/lib/components/Header.svelte`:

```svelte
  <div class="font-syne font-extrabold text-[1rem] tracking-[.06em] flex-shrink-0 mr-2 text-white">
    AURA
  </div>
```

(Remove the `style` attribute entirely.)

- [ ] **Step 2: Update legend dot colors**

Replace line 73 in `src/lib/components/Header.svelte`:

```svelte
      {#each [{color:'#ffffff',label:'Tasks'},{color:'#d4d0cb',label:'Developers'},{color:'#8a8680',label:'Agents'},{color:'#545250',label:'Sub-Agents'}] as item}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/Header.svelte
git commit -m "refactor: update header logo and legend dots to monochrome"
```

---

### Task 5: Update BoardCanvas.svelte

**Files:**
- Modify: `src/lib/components/board/BoardCanvas.svelte:79,99-101`

- [ ] **Step 1: Fix dev node avatar text color**

On line 79 of `src/lib/components/board/BoardCanvas.svelte`, change `color:#1dd4ef` to `color:#0c0c0c`:

```js
    devs.forEach(d => addNode(d, 'dev-node',
      `<div class="node-row"><span class="avatar" style="background:#d4d0cb;color:#0c0c0c">${d.initials}</span><div class="node-title" style="margin:0">${d.name}</div></div><div class="node-sub" style="margin-top:4px">${d.role}</div>`,
      null, pos));
```

(Also replace `background:${d.avatarBg}` with the fixed monochrome color `#d4d0cb`.)

- [ ] **Step 2: Update inline style injection for lit glow and add type badge**

Replace the `addNode` function body (lines 93–116) to use a white glow for the lit state and append a type badge:

```js
  function addNode(item, className, innerHTML, accent, pos) {
    const BADGE = { 'task-node':'TASK', 'dev-node':'DEV', 'agent-node':'AGENT', 'sub-node':'SUB' };
    const el = document.createElement('div');
    el.id = `node-${item.id}`;
    el.className = `node ${className}`;
    el.dataset.nid = item.id;
    el.innerHTML = innerHTML;
    if (accent) {
      el.insertAdjacentHTML('afterbegin',
        `<style>#node-${item.id}::before{background:${accent}}#node-${item.id}.lit{box-shadow:0 0 20px rgba(255,255,255,0.12),inset 0 0 24px rgba(255,255,255,0.03);border-color:rgba(255,255,255,0.28)!important}</style>`);
    }
    if (BADGE[className]) {
      el.insertAdjacentHTML('beforeend', `<span class="node-type-badge">${BADGE[className]}</span>`);
    }
    const p = pos[item.id] || { x:0, y:0 };
    el.style.left = p.x + 'px';
    el.style.top  = p.y + 'px';
    boardEl.appendChild(el);
    initDrag(el, item.id);
    el.addEventListener('click', e => {
      if (lastDragMoved) { lastDragMoved = false; return; }
      e.stopPropagation();
      const $activeId = get(activeId);
      if ($activeId === item.id) { activeId.set(null); closePanel(); }
      else { activeId.set(item.id); openPanel({ mode:'agent', id:item.id }); }
      applyHighlight();
    });
  }
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/board/BoardCanvas.svelte
git commit -m "refactor: update board node avatar colors, lit glow, and add type badges"
```

---

### Task 6: Update DetailPanel.svelte and NodePanel.svelte

**Files:**
- Modify: `src/lib/components/DetailPanel.svelte:41,45,50,60`
- Modify: `src/lib/components/NodePanel.svelte:43,82`

- [ ] **Step 1: Update static color references in DetailPanel.svelte**

In `src/lib/components/DetailPanel.svelte`, make the following replacements:

Line 41 — panel title color:
```svelte
      <div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:#f0ede8;line-height:1.2">
```

Line 45 — subtitle color:
```svelte
        <div style="font-size:.65rem;color:rgba(255,255,255,0.32);margin-top:2px;font-style:italic">{topSub}</div>
```

Line 50 — close button color:
```svelte
      style="margin-left:auto;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.35);font-size:1.1rem;line-height:1;padding:2px 6px;border-radius:4px;flex-shrink:0;transition:color .12s,background .12s"
```

Line 60 — back button styles:
```svelte
        style="display:flex;align-items:center;gap:5px;margin:12px 18px 0;padding:5px 10px;width:fit-content;background:none;border:1px solid rgba(255,255,255,.08);border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:.63rem;color:rgba(255,255,255,0.35);transition:color .12s,border-color .12s"
```

- [ ] **Step 2: Update static color references in NodePanel.svelte**

In `src/lib/components/NodePanel.svelte`:

Line 43 — overview paragraph:
```svelte
    <p style="font-size:.72rem;line-height:1.65;color:rgba(255,255,255,0.45)">{data.overview || data.desc || '—'}</p>
```

Line 82 — output list item:
```svelte
            <div style="display:flex;align-items:center;gap:8px;font-size:.68rem;color:rgba(255,255,255,0.45);line-height:1.4">
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/DetailPanel.svelte src/lib/components/NodePanel.svelte
git commit -m "refactor: update DetailPanel and NodePanel to monochrome inline colors"
```

---

### Task 7: Update TaskPanel.svelte and TicketCard.svelte

**Files:**
- Modify: `src/lib/components/TaskPanel.svelte:47-68`
- Modify: `src/lib/components/tickets/TicketCard.svelte:13,25,31,34,48,52,60,62`

- [ ] **Step 1: Update team row colors in TaskPanel.svelte**

In `src/lib/components/TaskPanel.svelte`, replace the team section inline styles (lines 47–68):

```svelte
      {#if dev}
        <div class="team-row">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);min-width:40px;flex-shrink:0">Dev</span>
          <span class="avatar" style="background:#d4d0cb;color:#0c0c0c;width:18px;height:18px;font-size:.5rem;border-radius:4px;flex-shrink:0;margin-right:0">{dev.initials}</span>
          <span style="flex:1;color:#f0ede8">{dev.name}</span>
          <span style="font-size:.58rem;color:rgba(255,255,255,0.28);font-style:italic">{dev.role}</span>
        </div>
      {/if}
      {#if agent}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="team-row clickable" on:click={() => drillPanel({ mode:'agent', id:agent.id, fromTaskId:taskId })} role="button" tabindex="0">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);min-width:40px;flex-shrink:0">Agent</span>
          <span style="flex:1;color:#8a8680">{agent.name}</span>
          <span style="font-size:.58rem;color:rgba(255,255,255,0.28);font-style:italic">{agent.type}</span>
          <span style="color:rgba(255,255,255,0.28);font-size:.7rem">›</span>
        </div>
      {/if}
      {#each subAgents as sa}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="team-row clickable" on:click={() => drillPanel({ mode:'agent', id:sa.id, fromTaskId:taskId })} role="button" tabindex="0">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);min-width:40px;flex-shrink:0">Sub</span>
          <span style="flex:1;color:#545250">{sa.name}</span>
          <span style="font-size:.58rem;color:rgba(255,255,255,0.28);font-style:italic">{sa.type}</span>
          <span style="color:rgba(255,255,255,0.28);font-size:.7rem">›</span>
        </div>
      {/each}
```

- [ ] **Step 2: Update TicketCard.svelte**

In `src/lib/components/tickets/TicketCard.svelte`, make the following changes:

Line 13 — accent color fallback:
```js
  $: accentColor = pc?.color || '#ffffff';
```

Line 25 — card background and border:
```svelte
  style="background:#161616;border:1px solid {$activeId===task.id?'rgba(255,255,255,.28)':'rgba(255,255,255,.08)'};padding:12px 14px 12px 17px;{$activeId===task.id?'box-shadow:0 0 20px rgba(255,255,255,0.12)':''}"
```

Line 34 — title color:
```svelte
  <div style="font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;color:#f0ede8;line-height:1.3;margin-bottom:5px">
```

Line 52 — dev avatar in TicketCard:
```svelte
      <span class="avatar" style="background:#d4d0cb;color:#0c0c0c;width:18px;height:18px;font-size:.5rem;border-radius:4px;margin-right:0">{dev.initials}</span>
```

Lines 60–63 — agent and sub-agent chips:
```svelte
      <span style="font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(255,255,255,.06);color:#8a8680;border:1px solid rgba(255,255,255,.12)">{agent.name}</span>
      {#each subAgents as sa}
        <span style="font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(255,255,255,.04);color:#545250;border:1px solid rgba(255,255,255,.08)">{sa.name}</span>
      {/each}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/components/TaskPanel.svelte src/lib/components/tickets/TicketCard.svelte
git commit -m "refactor: update TaskPanel and TicketCard to monochrome colors"
```

---

### Task 8: Verify visually in the browser

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open `http://localhost:5173` in a browser.

- [ ] **Step 2: Check board view**

Verify:
- Background is near-black `#0c0c0c`
- Nodes are dark surfaces (`#161616`) with white/gray left bars per type (Task=white, Dev=light gray, Agent=mid gray, Sub=dim gray)
- Each node has a small uppercase type badge (TASK / DEV / AGENT / SUB) in the top-right corner
- Hovering a node brightens its border
- Clicking a node shows white glow on lit nodes and nearly-invisible dimmed nodes
- SVG connection lines are white at low opacity; lit paths are bright white
- Logo is plain white "AURA" text (no gradient)
- Legend dots match the node left-bar colors

- [ ] **Step 3: Check tickets view**

Verify:
- Ticket cards are `#161616` background
- Agent/sub-agent chips are monochrome gray
- Active ticket has white border glow

- [ ] **Step 4: Check detail panel**

Verify:
- Panel background is `#0f0f0f`
- Criteria checkboxes fill white when checked, with near-black checkmark
- Chain chips are dark surfaces with monochrome type colors
- Section headers are dim white uppercase labels
