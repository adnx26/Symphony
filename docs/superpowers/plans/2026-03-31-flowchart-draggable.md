# Aura Free-Canvas Flowchart Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the fixed 4-column grid with a freely draggable, pannable, zoomable flowchart canvas with dynamic depth-based swimlanes and localStorage position persistence.

**Architecture:** A `#board` div (6000×4000px) inside `#canvas` receives a CSS `transform: translate·scale` for pan/zoom. Nodes are `position:absolute` on `#board`. The SVG layer is also a child of `#board` (same coordinate space — no offset math). Swimlanes are faint vertical bands computed from `maxDepth` at render time. Positions are persisted to `localStorage`.

**Tech Stack:** Vanilla HTML/CSS/JS. No dependencies. Single file: `index.html`.

---

### Task 1: Add constants, canvas state, and localStorage helpers

**Files:**
- Modify: `index.html` — replace the `// ── State` block (around line 473)

- [ ] **Step 1: Replace the state block**

Find this exact block in `index.html`:
```js
// ── State ─────────────────────────────────────────────────────────────────
let activeId   = null;
let curEdges   = [];
const filters  = { dev:'', type:'', status:'' };
const checked  = {};   // 'nodeId:index' → true
```

Replace with:
```js
// ── Constants ─────────────────────────────────────────────────────────────
const BOARD_W = 6000;
const BOARD_H = 4000;
const NODE_W  = 220;   // fixed node width on the board

// ── State ─────────────────────────────────────────────────────────────────
let activeId   = null;
let curEdges   = [];
const filters  = { dev:'', type:'', status:'' };
const checked  = {};   // 'nodeId:index' → true
const positions = {};  // nodeId → {x, y}
const zoom      = { x: 0, y: 0, scale: 1 };

function loadPositions() {
  try {
    const raw = localStorage.getItem('aura-positions');
    if (raw) Object.assign(positions, JSON.parse(raw));
  } catch {}
}

function savePositions() {
  localStorage.setItem('aura-positions', JSON.stringify(positions));
}
```

- [ ] **Step 2: Verify**

Open `index.html` in a browser. Open devtools console. Expected: no errors. The page renders the old column layout normally (nothing visual changes yet).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add board constants, positions/zoom state, localStorage helpers"
```

---

### Task 2: Add `getDepth()` and `computeDefaultPositions()`

**Files:**
- Modify: `index.html` — add new functions after the state block (before `// ── Visible set`)

- [ ] **Step 1: Add the two functions**

Insert this block immediately before the `// ── Visible set` comment:

```js
// ── Depth & default layout ────────────────────────────────────────────────
function getDepth(id) {
  if (TASKS.find(t => t.id === id))      return 0;
  if (DEVELOPERS.find(d => d.id === id)) return 1;
  if (AGENTS.find(a => a.id === id))     return 2;
  const sa = SUB_AGENTS.find(s => s.id === id);
  if (!sa) return -1;
  return getDepth(sa.parentId) + 1;  // recursive: works for any depth
}

function computeDefaultPositions(tasks, devs, agents, subAgents) {
  const allNodes = [
    ...tasks.map(n => ({ id: n.id, depth: 0 })),
    ...devs.map(n => ({ id: n.id, depth: 1 })),
    ...agents.map(n => ({ id: n.id, depth: 2 })),
    ...subAgents.map(n => ({ id: n.id, depth: getDepth(n.id) })),
  ];

  const maxDepth = allNodes.reduce((m, n) => Math.max(m, n.depth), 2);
  const laneW    = BOARD_W / (maxDepth + 1);
  const NODE_H   = 90;
  const GAP_Y    = 24;
  const H_PAD    = 40;

  const byDepth = {};
  allNodes.forEach(n => {
    if (!byDepth[n.depth]) byDepth[n.depth] = [];
    byDepth[n.depth].push(n.id);
  });

  const result = {};
  Object.entries(byDepth).forEach(([depth, ids]) => {
    const d      = parseInt(depth);
    const x      = d * laneW + H_PAD;
    const totalH = ids.length * (NODE_H + GAP_Y) - GAP_Y;
    const startY = Math.max(80, (BOARD_H - totalH) / 2);
    ids.forEach((id, i) => {
      result[id] = { x, y: startY + i * (NODE_H + GAP_Y) };
    });
  });
  return result;
}
```

- [ ] **Step 2: Verify**

Open devtools console and run:
```js
console.log(getDepth('t1'))   // Expected: 0
console.log(getDepth('d1'))   // Expected: 1
console.log(getDepth('a1'))   // Expected: 2
console.log(getDepth('sa1'))  // Expected: 3 (sa1.parentId = 'a1', depth 2+1)
```

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add getDepth and computeDefaultPositions"
```

---

### Task 3: Add `applyTransform()` and `renderSwimlanes()`

**Files:**
- Modify: `index.html` — add before the `// ── Render nodes` section

- [ ] **Step 1: Add the two functions**

Insert immediately before `// ── Render nodes`:

```js
// ── Transform & swimlanes ─────────────────────────────────────────────────
function applyTransform() {
  document.getElementById('board').style.transform =
    `translate(${zoom.x}px,${zoom.y}px) scale(${zoom.scale})`;
}

const LANE_LABELS = [
  'Tasks','Developers','Agents','Sub-Agents',
  'Sub-Sub-Agents','Level 5','Level 6','Level 7',
];
const LANE_COLORS = [
  'rgba(245,158,11,0.025)',
  'rgba(29,212,239,0.025)',
  'rgba(167,139,250,0.025)',
  'rgba(251,113,133,0.025)',
];

function renderSwimlanes(maxDepth) {
  const board = document.getElementById('board');
  board.querySelectorAll('.swimlane').forEach(el => el.remove());
  const laneW = BOARD_W / (maxDepth + 1);
  for (let i = 0; i <= maxDepth; i++) {
    const lane = document.createElement('div');
    lane.className = 'swimlane';
    lane.style.cssText =
      `left:${i * laneW}px;width:${laneW}px;` +
      `background:${LANE_COLORS[i % LANE_COLORS.length]}`;
    lane.innerHTML =
      `<span class="lane-label">${LANE_LABELS[i] || 'Level ' + i}</span>`;
    board.appendChild(lane);
  }
}
```

- [ ] **Step 2: Verify**

Open devtools console and run:
```js
renderSwimlanes(3)
```
Expected: no error (will silently fail to find `#board` since it doesn't exist yet — that's fine).

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add applyTransform and renderSwimlanes"
```

---

### Task 4: Update HTML structure

**Files:**
- Modify: `index.html` — the `<body>` section

- [ ] **Step 1: Replace the canvas/columns HTML**

Find this block (around line 337–357):
```html
<div id="canvas">
  <svg id="svg-layer"></svg>
  <div id="columns">
    <div class="column col-tasks">
      <div class="col-head"><div class="col-label">Tasks <span class="col-count" id="cnt-tasks"></span></div></div>
      <div class="nodes-list" id="list-tasks"></div>
    </div>
    <div class="column col-devs">
      <div class="col-head"><div class="col-label">Developers <span class="col-count" id="cnt-devs"></span></div></div>
      <div class="nodes-list" id="list-devs"></div>
    </div>
    <div class="column col-agents">
      <div class="col-head"><div class="col-label">Agents <span class="col-count" id="cnt-agents"></span></div></div>
      <div class="nodes-list" id="list-agents"></div>
    </div>
    <div class="column col-subs">
      <div class="col-head"><div class="col-label">Sub-Agents <span class="col-count" id="cnt-subs"></span></div></div>
      <div class="nodes-list" id="list-subs"></div>
    </div>
  </div>
</div>
```

Replace with:
```html
<div id="canvas">
  <div id="board">
    <svg id="svg-layer" xmlns="http://www.w3.org/2000/svg"></svg>
  </div>
</div>
<div id="zoom-controls">
  <button id="zoom-in" title="Zoom in">+</button>
  <button id="zoom-fit" title="Fit to screen">⊡</button>
  <button id="zoom-out" title="Zoom out">−</button>
</div>
```

The hidden `cnt-*` span elements are referenced by JS. Add them to the header stat area. Find the `.stat` div in the header:
```html
<div class="stat" id="stat">—</div>
```

Replace with:
```html
<div class="stat" id="stat">—</div>
<span style="display:none" id="cnt-tasks"></span>
<span style="display:none" id="cnt-devs"></span>
<span style="display:none" id="cnt-agents"></span>
<span style="display:none" id="cnt-subs"></span>
```

- [ ] **Step 2: Add Reset button to header**

Find `<div class="header-right">` and add the reset button inside it, before the legend:
```html
<div class="header-right">
  <button id="btn-reset" class="reset-btn">↺ Reset Layout</button>
  <div class="legend">
```

- [ ] **Step 3: Verify structure**

Open `index.html`. The page will show only the header (render() will fail since `#list-tasks` etc. no longer exist — that's expected and will be fixed in Task 6). Console may show errors — that's fine for now.

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: replace columns grid with board canvas, add zoom controls and reset button"
```

---

### Task 5: Update CSS

**Files:**
- Modify: `index.html` — the `<style>` block

- [ ] **Step 1: Replace the `#canvas` rule**

Find:
```css
#canvas { flex: 1; position: relative; overflow: auto; z-index: 1; }
```

Replace with:
```css
#canvas {
  flex: 1; position: relative; overflow: hidden; z-index: 1;
  cursor: grab; user-select: none;
}
#canvas.panning { cursor: grabbing; }
```

- [ ] **Step 2: Replace the `#svg-layer` rule**

Find:
```css
#svg-layer { position: absolute; top: 0; left: 0; pointer-events: none; z-index: 1; }
```

Replace with:
```css
#svg-layer {
  position: absolute; top: 0; left: 0;
  width: 6000px; height: 6000px;
  pointer-events: none; z-index: 1;
}
```

- [ ] **Step 3: Replace the `#columns` rule and add board/node/swimlane rules**

Find:
```css
#columns {
  position: relative; z-index: 2;
  display: grid; grid-template-columns: repeat(4,1fr);
  min-height: 100%; min-width: 860px;
}
```

Replace with:
```css
#board {
  position: absolute;
  width: 6000px; height: 4000px;
  transform-origin: 0 0;
}
```

- [ ] **Step 4: Update `.node` rule to add absolute positioning**

Find:
```css
.node {
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 11px 13px 11px 15px;
  cursor: pointer; position: relative;
  transition: border-color .18s, box-shadow .18s, opacity .22s, transform .12s;
}
```

Replace with:
```css
.node {
  border-radius: 8px;
  border: 1px solid var(--border);
  background: var(--surface);
  padding: 11px 13px 11px 15px;
  cursor: move; position: absolute;
  width: 220px;
  transition: border-color .18s, box-shadow .18s, opacity .22s;
  z-index: 2;
}
.node.dragging {
  box-shadow: 0 8px 32px rgba(0,0,0,0.5);
  z-index: 50;
}
```

- [ ] **Step 5: Add swimlane, lane-label, zoom-controls, and reset-btn rules**

Add these rules at the end of the `<style>` block, just before `</style>`:

```css
/* ── Swimlanes ───────────────────────────────────── */
.swimlane {
  position: absolute; top: 0; height: 4000px;
  border-right: 1px solid rgba(255,255,255,0.04);
  pointer-events: none; z-index: 0;
}
.lane-label {
  font-family: 'Syne', sans-serif;
  font-size: .55rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: .18em;
  color: rgba(255,255,255,0.07);
  padding: 18px 14px;
  display: block;
}

/* ── Zoom controls ───────────────────────────────── */
#zoom-controls {
  position: fixed; bottom: 20px; right: 20px; z-index: 25;
  display: flex; flex-direction: column; gap: 4px;
}
#zoom-controls button {
  width: 32px; height: 32px;
  background: var(--surface); border: 1px solid var(--border);
  border-radius: 6px; color: var(--muted); cursor: pointer;
  font-size: 1rem; display: flex; align-items: center; justify-content: center;
  transition: color .12s, border-color .12s;
}
#zoom-controls button:hover { color: var(--text); border-color: rgba(255,255,255,.18); }

/* ── Reset button ────────────────────────────────── */
.reset-btn {
  font-family: 'JetBrains Mono', monospace; font-size: .65rem;
  padding: 4px 10px;
  background: var(--surface); border: 1px solid var(--border); border-radius: 5px;
  color: var(--muted); cursor: pointer;
  transition: color .12s, border-color .12s;
}
.reset-btn:hover { color: var(--text); border-color: rgba(255,255,255,.18); }
```

- [ ] **Step 6: Remove or comment out the `.column`, `.col-head`, `.col-label`, `.col-count`, `.nodes-list` rules**

These selectors match nothing now. Find and delete (or comment) these rules:
```css
/* ── Column ──────────────────────────────────────── */
.column { ... }
.column:last-child { ... }
.col-head { ... }
.col-label { ... }
.col-tasks  .col-label { ... }  .col-tasks  .col-label::before { ... }
.col-devs   .col-label { ... }  .col-devs   .col-label::before { ... }
.col-agents .col-label { ... }  .col-agents .col-label::before { ... }
.col-subs   .col-label { ... }  .col-subs   .col-label::before { ... }
.col-count { ... }
.nodes-list { ... }
```

Also update the `.node:hover` rule — remove `transform: translateX(2px)` (it causes a visual jitter on hover with absolute positioning) but keep `border-color`:

Find:
```css
.node:hover { transform: translateX(2px); border-color: rgba(255,255,255,.13); }
```
Replace with:
```css
.node:hover { border-color: rgba(255,255,255,.13); }
```

- [ ] **Step 7: Verify**

Open `index.html`. Header renders correctly. Console may still have errors from render() — expected. Zoom controls appear bottom-right.

- [ ] **Step 8: Commit**

```bash
git add index.html
git commit -m "feat: update CSS for board canvas, absolute nodes, swimlanes, zoom controls"
```

---

### Task 6: Rewrite `render()` for the board canvas

**Files:**
- Modify: `index.html` — replace the entire `render()` function and add `initDrag()` drag state variable

- [ ] **Step 1: Add the drag state variable above render()**

Add this line immediately before the `function render()` declaration:

```js
let dragState = null;
let lastDragMoved = false;
```

- [ ] **Step 2: Replace the entire `render()` function**

Find and replace the complete `render()` function (it starts with `function render() {` and ends with the closing `}`):

```js
function render() {
  const { tasks, devs, agents, subAgents, edges, taskColor } = visibleNodes();
  curEdges = edges;

  document.getElementById('cnt-tasks').textContent  = tasks.length;
  document.getElementById('cnt-devs').textContent   = devs.length;
  document.getElementById('cnt-agents').textContent = agents.length;
  document.getElementById('cnt-subs').textContent   = subAgents.length;
  document.getElementById('stat').textContent =
    `${tasks.length + devs.length + agents.length + subAgents.length} nodes · click to inspect`;

  // Compute max depth for swimlane count
  const allNodes = [...tasks, ...devs, ...agents, ...subAgents];
  const maxDepth = allNodes.reduce((m, n) => Math.max(m, getDepth(n.id)), 2);

  // Fill in missing positions with computed defaults
  const missing = allNodes.filter(n => !positions[n.id]);
  if (missing.length) {
    const defaults = computeDefaultPositions(tasks, devs, agents, subAgents);
    missing.forEach(n => { if (defaults[n.id]) positions[n.id] = defaults[n.id]; });
  }

  // Clear existing nodes and swimlanes (preserve SVG)
  const board = document.getElementById('board');
  board.querySelectorAll('.node, .swimlane').forEach(el => el.remove());

  // Draw swimlanes behind nodes
  renderSwimlanes(maxDepth);

  // Create and place each node absolutely on the board
  function addNode(item, className, innerHTML, accent) {
    const el  = makeNode(item.id, className, innerHTML, accent);
    const pos = positions[item.id] || { x: 0, y: 0 };
    el.style.left = pos.x + 'px';
    el.style.top  = pos.y + 'px';
    board.appendChild(el);
    initDrag(el, item.id);
    el.addEventListener('click', e => {
      if (lastDragMoved) { lastDragMoved = false; return; }
      e.stopPropagation();
      onNodeClick(item.id);
    });
  }

  tasks.forEach(t => addNode(t, 'task-node',
    `<div class="node-title">${t.title}</div>
     <div class="node-sub">${t.desc}</div>
     <div class="node-tags"><span class="tag tag-${t.status}">${STATUS_LABEL[t.status]}</span></div>`,
    taskColor[t.id]));

  devs.forEach(d => addNode(d, 'dev-node',
    `<div class="node-row">
       <span class="avatar" style="background:${d.avatarBg};color:var(--c-dev)">${d.initials}</span>
       <div class="node-title" style="margin:0">${d.name}</div>
     </div>
     <div class="node-sub" style="margin-top:4px">${d.role}</div>`));

  agents.forEach(a => addNode(a, 'agent-node',
    `<div class="node-title">${a.name}</div><div class="node-sub">${a.type}</div>`));

  subAgents.forEach(sa => addNode(sa, 'sub-node',
    `<div class="node-title">${sa.name}</div><div class="node-sub">${sa.type}</div>`));

  requestAnimationFrame(() => drawConnections(edges));
}
```

- [ ] **Step 3: Add `initDrag()` immediately after the `render()` function**

```js
// ── Drag ──────────────────────────────────────────────────────────────────
function initDrag(el, nodeId) {
  el.addEventListener('pointerdown', e => {
    if (e.button !== 0) return;
    e.stopPropagation();
    el.setPointerCapture(e.pointerId);
    const pos = positions[nodeId] || { x: 0, y: 0 };
    dragState = {
      nodeId,
      startX: e.clientX,
      startY: e.clientY,
      origX:  pos.x,
      origY:  pos.y,
      moved:  false,
    };
    el.classList.add('dragging');
  });

  el.addEventListener('pointermove', e => {
    if (!dragState || dragState.nodeId !== nodeId) return;
    const dx = (e.clientX - dragState.startX) / zoom.scale;
    const dy = (e.clientY - dragState.startY) / zoom.scale;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
    positions[nodeId] = { x: dragState.origX + dx, y: dragState.origY + dy };
    el.style.left = positions[nodeId].x + 'px';
    el.style.top  = positions[nodeId].y + 'px';
    requestAnimationFrame(() => drawConnections(curEdges));
  });

  el.addEventListener('pointerup', e => {
    if (!dragState || dragState.nodeId !== nodeId) return;
    el.releasePointerCapture(e.pointerId);
    el.classList.remove('dragging');
    lastDragMoved = dragState.moved;
    if (dragState.moved) savePositions();
    dragState = null;
  });
}
```

- [ ] **Step 4: Verify**

Open `index.html`. Expected:
- All nodes visible on the canvas, positioned in a left-to-right flowchart layout
- Four swimlane bands visible behind the nodes
- Console: no errors

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: rewrite render() for absolute board positioning, add initDrag"
```

---

### Task 7: Rewrite `drawConnections()` to use `positions` directly

**Files:**
- Modify: `index.html` — replace `drawConnections()` and remove dead helpers

- [ ] **Step 1: Replace the entire `drawConnections()` function**

Find the function starting with `function drawConnections(edges) {` and replace it entirely:

```js
function drawConnections(edges) {
  const svg = document.getElementById('svg-layer');
  svg.innerHTML = '';
  const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
  svg.appendChild(defs);

  const portMaps = buildPortMaps(edges);

  edges.forEach(edge => {
    const fromEl = document.getElementById(`node-${edge.from}`);
    const toEl   = document.getElementById(`node-${edge.to}`);
    if (!fromEl || !toEl) return;

    const fp = positions[edge.from];
    const tp = positions[edge.to];
    if (!fp || !tp) return;

    const fw = fromEl.offsetWidth;
    const fh = fromEl.offsetHeight;
    const th = toEl.offsetHeight;

    // Distribute multiple connections vertically within each node
    const fromList = portMaps.R[edge.from] || [];
    const toList   = portMaps.L[edge.to]   || [];
    const fi = fromList.indexOf(edge.to),  ft = fromList.length;
    const ti = toList.indexOf(edge.from),  tt = toList.length;
    const fFrac = ft === 1 ? 0.5 : (fi + 1) / (ft + 1);
    const tFrac = tt === 1 ? 0.5 : (ti + 1) / (tt + 1);

    const x1 = fp.x + fw;
    const y1 = fp.y + fh * fFrac;
    const x2 = tp.x;
    const y2 = tp.y + th * tFrac;
    const dx = Math.max(36, (x2 - x1) * 0.48);

    const path = document.createElementNS('http://www.w3.org/2000/svg','path');
    path.setAttribute('d', `M ${x1} ${y1} C ${x1+dx} ${y1} ${x2-dx} ${y2} ${x2} ${y2}`);
    path.setAttribute('stroke', edge.color);
    path.setAttribute('stroke-width','1.5');
    path.setAttribute('marker-end', ensureMarker(svg, defs, edge.color));
    path.classList.add('conn');
    path.dataset.from   = edge.from;
    path.dataset.to     = edge.to;
    path.dataset.taskid = edge.taskId || '';
    path.style.opacity  = '0.38';
    svg.appendChild(path);
  });

  applyHighlight();
}
```

- [ ] **Step 2: Remove the dead helper functions**

Delete the `buildPortMaps()`, `stretchNodes()`, and `portY()` functions — they are no longer called.

Wait — `buildPortMaps()` IS still used by the new `drawConnections()`. Keep `buildPortMaps()`. Delete only `stretchNodes()` and `portY()`.

- [ ] **Step 3: Verify**

Open `index.html`. Expected:
- Animated bezier connections visible between nodes
- Clicking a node highlights its connections and dims the rest
- Console: no errors

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: rewrite drawConnections to use positions directly, remove dead helpers"
```

---

### Task 8: Add pan — pointer events on the canvas background

**Files:**
- Modify: `index.html` — the `// ── Events` section

- [ ] **Step 1: Replace the canvas click and scroll event listeners**

Find this block in the `// ── Events` section:
```js
document.getElementById('canvas').addEventListener('click', () => {
  activeId = null; applyHighlight(); closePanel();
});
document.getElementById('panel-close').addEventListener('click', () => {
  activeId = null; applyHighlight(); closePanel();
});
document.getElementById('canvas').addEventListener('scroll', () => drawConnections(curEdges));
window.addEventListener('resize', () => drawConnections(curEdges));
```

Replace with:
```js
document.getElementById('panel-close').addEventListener('click', () => {
  activeId = null; applyHighlight(); closePanel();
});
window.addEventListener('resize', () => drawConnections(curEdges));
```

- [ ] **Step 2: Add pan state and canvas pointer events**

Add this block immediately after the `initDrag` function:

```js
// ── Pan ───────────────────────────────────────────────────────────────────
let panState     = null;
let lastPanMoved = false;
const canvasEl   = document.getElementById('canvas');

canvasEl.addEventListener('pointerdown', e => {
  if (e.button !== 0) return;
  if (e.target.closest('.node')) return;  // let nodes handle their own drag
  canvasEl.setPointerCapture(e.pointerId);
  panState = {
    startX: e.clientX, startY: e.clientY,
    origX: zoom.x,     origY: zoom.y,
    moved: false,
  };
  canvasEl.classList.add('panning');
});

canvasEl.addEventListener('pointermove', e => {
  if (!panState) return;
  const dx = e.clientX - panState.startX;
  const dy = e.clientY - panState.startY;
  if (Math.abs(dx) > 3 || Math.abs(dy) > 3) panState.moved = true;
  zoom.x = panState.origX + dx;
  zoom.y = panState.origY + dy;
  applyTransform();
});

canvasEl.addEventListener('pointerup', () => {
  if (!panState) return;
  lastPanMoved = panState.moved;
  panState = null;
  canvasEl.classList.remove('panning');
});

// Deselect on background click (not after a pan)
canvasEl.addEventListener('click', () => {
  if (lastPanMoved) { lastPanMoved = false; return; }
  activeId = null; applyHighlight(); closePanel();
});
```

- [ ] **Step 3: Verify**

Open `index.html`. Expected:
- Click and drag on empty board area pans the canvas
- Cursor changes to `grabbing` during pan
- Clicking empty area still deselects active node
- Console: no errors

- [ ] **Step 4: Commit**

```bash
git add index.html
git commit -m "feat: add canvas pan with pointer events"
```

---

### Task 9: Add zoom — wheel event and zoom buttons

**Files:**
- Modify: `index.html` — add after the pan block

- [ ] **Step 1: Add `zoomAround()`, wheel listener, button handlers, and `fitToScreen()`**

Add this block immediately after the pan block:

```js
// ── Zoom ──────────────────────────────────────────────────────────────────
function zoomAround(delta, cx, cy) {
  const boardX = (cx - zoom.x) / zoom.scale;
  const boardY = (cy - zoom.y) / zoom.scale;
  zoom.scale = Math.min(2, Math.max(0.2, zoom.scale * delta));
  zoom.x = cx - boardX * zoom.scale;
  zoom.y = cy - boardY * zoom.scale;
  applyTransform();
}

canvasEl.addEventListener('wheel', e => {
  e.preventDefault();
  const rect = canvasEl.getBoundingClientRect();
  zoomAround(
    e.deltaY > 0 ? 0.9 : 1.1,
    e.clientX - rect.left,
    e.clientY - rect.top,
  );
}, { passive: false });

function fitToScreen() {
  const { tasks, devs, agents, subAgents } = visibleNodes();
  const allIds = [...tasks, ...devs, ...agents, ...subAgents].map(n => n.id);
  if (!allIds.length) return;
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  allIds.forEach(id => {
    const pos = positions[id];
    const el  = document.getElementById(`node-${id}`);
    if (!pos || !el) return;
    minX = Math.min(minX, pos.x);
    minY = Math.min(minY, pos.y);
    maxX = Math.max(maxX, pos.x + el.offsetWidth);
    maxY = Math.max(maxY, pos.y + el.offsetHeight);
  });
  const PAD = 60;
  const bw  = maxX - minX + PAD * 2;
  const bh  = maxY - minY + PAD * 2;
  let   s   = Math.min(canvasEl.clientWidth / bw, canvasEl.clientHeight / bh, 2);
  s = Math.max(s, 0.2);
  zoom.scale = s;
  zoom.x = (canvasEl.clientWidth  - bw * s) / 2 - (minX - PAD) * s;
  zoom.y = (canvasEl.clientHeight - bh * s) / 2 - (minY - PAD) * s;
  applyTransform();
}

document.getElementById('zoom-in').addEventListener('click', () =>
  zoomAround(1.25, canvasEl.clientWidth / 2, canvasEl.clientHeight / 2));
document.getElementById('zoom-out').addEventListener('click', () =>
  zoomAround(0.8,  canvasEl.clientWidth / 2, canvasEl.clientHeight / 2));
document.getElementById('zoom-fit').addEventListener('click', fitToScreen);
```

- [ ] **Step 2: Verify**

Open `index.html`. Expected:
- Scroll wheel zooms in/out, anchored to cursor position
- `+` / `−` buttons zoom from canvas center
- `⊡` button fits all nodes into view
- Zoom clamped between 0.2× and 2×
- Console: no errors

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add wheel zoom, zoom buttons, fit-to-screen"
```

---

### Task 10: Add reset button handler

**Files:**
- Modify: `index.html` — add after the zoom block

- [ ] **Step 1: Add the reset handler**

Add this block after the zoom section:

```js
// ── Reset ─────────────────────────────────────────────────────────────────
document.getElementById('btn-reset').addEventListener('click', () => {
  const { tasks, devs, agents, subAgents } = visibleNodes();
  // Clear all saved positions
  Object.keys(positions).forEach(k => delete positions[k]);
  // Compute and apply fresh default layout
  Object.assign(positions, computeDefaultPositions(tasks, devs, agents, subAgents));
  // Reset zoom to 1:1
  zoom.x = 0; zoom.y = 0; zoom.scale = 1;
  localStorage.removeItem('aura-positions');
  applyTransform();
  render();
});
```

- [ ] **Step 2: Verify**

Open `index.html`. Move some nodes around. Click "↺ Reset Layout". Expected:
- All nodes snap back to the default left-to-right flowchart positions
- Zoom resets to 1:1 and pan to 0,0
- localStorage `aura-positions` key is cleared
- Console: no errors

- [ ] **Step 3: Commit**

```bash
git add index.html
git commit -m "feat: add reset layout button handler"
```

---

### Task 11: Update data model — `parentId` and `visibleNodes()`

**Files:**
- Modify: `index.html` — `SUB_AGENTS` array and `visibleNodes()` function

- [ ] **Step 1: Rename `parentAgentId` to `parentId` in all SUB_AGENTS entries**

In the `SUB_AGENTS` array, find and replace all occurrences of `parentAgentId:` with `parentId:`. There are 6 entries (`sa1` through `sa6`):

```js
// Before (repeat for each entry)
{ id:'sa1', name:'LintBot', type:'Syntax Linter', parentAgentId:'a1', ... }

// After
{ id:'sa1', name:'LintBot', type:'Syntax Linter', parentId:'a1', ... }
```

Do this for all sub-agent entries.

- [ ] **Step 2: Update `visibleNodes()` to use `parentId` with recursive ancestry check**

Find in `visibleNodes()`:
```js
const subAgents = SUB_AGENTS.filter(sa => agentIds.has(sa.parentAgentId));
```

Replace with:
```js
const subAgents = SUB_AGENTS.filter(sa => {
  let id = sa.parentId;
  while (id) {
    if (agentIds.has(id)) return true;
    const parent = SUB_AGENTS.find(s => s.id === id);
    id = parent?.parentId;
  }
  return false;
});
```

This recursive walk means sub-sub-agents are included when their ancestor agent is visible.

- [ ] **Step 3: Update `nodeKind()` for deep sub-agents**

Find:
```js
function nodeKind(id) {
  if (TASKS.find(x => x.id === id))       return { label:'Task',      color:'#f59e0b', bg:'rgba(245,158,11,.12)' };
  if (DEVELOPERS.find(x => x.id === id))  return { label:'Developer', color:'#1dd4ef', bg:'rgba(29,212,239,.12)' };
  if (AGENTS.find(x => x.id === id))      return { label:'Agent',     color:'#a78bfa', bg:'rgba(167,139,250,.12)' };
  if (SUB_AGENTS.find(x => x.id === id))  return { label:'Sub-Agent', color:'#fb7185', bg:'rgba(251,113,133,.12)' };
  return { label:'Node', color:'#888', bg:'rgba(255,255,255,.06)' };
}
```

Replace with (depth-aware label for deep sub-agents):
```js
function nodeKind(id) {
  if (TASKS.find(x => x.id === id))       return { label:'Task',      color:'#f59e0b', bg:'rgba(245,158,11,.12)' };
  if (DEVELOPERS.find(x => x.id === id))  return { label:'Developer', color:'#1dd4ef', bg:'rgba(29,212,239,.12)' };
  if (AGENTS.find(x => x.id === id))      return { label:'Agent',     color:'#a78bfa', bg:'rgba(167,139,250,.12)' };
  if (SUB_AGENTS.find(x => x.id === id)) {
    const depth  = getDepth(id);
    const prefix = depth > 3 ? 'Sub-'.repeat(depth - 2) : '';
    return { label: prefix + 'Agent', color:'#fb7185', bg:'rgba(251,113,133,.12)' };
  }
  return { label:'Node', color:'#888', bg:'rgba(255,255,255,.06)' };
}
```

- [ ] **Step 4: Verify**

Open `index.html`. Expected:
- All existing sub-agents still visible (parentId works same as parentAgentId)
- Console: no errors from `getDepth()` (no more `parentAgentId` references)

- [ ] **Step 5: Commit**

```bash
git add index.html
git commit -m "feat: rename parentAgentId→parentId, recursive visibleNodes, depth-aware nodeKind"
```

---

### Task 12: Wire initialization — load positions and apply transform on startup

**Files:**
- Modify: `index.html` — the `// ── Init` block at the bottom of the script

- [ ] **Step 1: Replace the init block**

Find:
```js
// ── Init ──────────────────────────────────────────────────────────────────
render();
```

Replace with:
```js
// ── Init ──────────────────────────────────────────────────────────────────
loadPositions();
render();
applyTransform();
```

- [ ] **Step 2: Verify full end-to-end**

Open `index.html` in a browser with a fresh localStorage (open devtools → Application → Local Storage → clear `aura-positions` if it exists). Expected:

1. Nodes appear in a clean left-to-right flowchart (Tasks → Devs → Agents → Sub-Agents)
2. Faint swimlane bands visible behind nodes
3. Animated bezier connections between nodes
4. Drag any node: it moves freely, connections redraw in real time
5. Reload page: dragged node is in its saved position
6. Scroll wheel zooms in/out toward cursor
7. Drag background: pans the canvas
8. Click `⊡`: fits all nodes into view
9. Click `↺ Reset Layout`: restores default positions, resets zoom
10. Click a node: detail panel slides in, connected nodes highlight, others dim
11. Filter chips still work (filter by dev/type/status)
12. Console: no errors

- [ ] **Step 3: Final commit**

```bash
git add index.html
git commit -m "feat: wire up loadPositions and applyTransform on init — flowchart canvas complete"
```
