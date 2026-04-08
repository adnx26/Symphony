# SvelteKit Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Migrate Aura from a single `index.html` to a SvelteKit + Tailwind CSS v4 app with two routes (Board `/` and Tickets `/tickets`), preserving all existing features and adding the Tickets view simultaneously.

**Architecture:** Two SvelteKit routes share a `+layout.svelte` that renders the Header and DetailPanel. All state (filters, activeId, panel stack, board positions/zoom, criteria checked state) lives in Svelte stores. The Board canvas uses fully imperative DOM logic inside `onMount` (faithful port of existing JS). The Tickets view uses Svelte's reactive `{#each}` templating over the `visibleNodes` derived store.

**Tech Stack:** SvelteKit, JavaScript (no TypeScript), Tailwind CSS v4 (`@tailwindcss/vite`), `@sveltejs/adapter-static`.

---

## File Map

```
src/
├── app.html                               — HTML shell with Google Fonts
├── app.css                                — Tailwind v4 import + @theme tokens + global CSS (nodes, panel, animations)
├── lib/
│   ├── data.js                            — TASKS, DEVELOPERS, AGENTS, SUB_AGENTS arrays
│   ├── helpers.js                         — pure functions + constants (priorityConfig, formatDueDate, nodeKind, etc.)
│   ├── stores/
│   │   ├── filters.js                     — writable filters + derived visibleNodes
│   │   ├── activeId.js                    — writable(null)
│   │   ├── panel.js                       — writable panel state + openPanel/closePanel/drillPanel/panelBack helpers
│   │   └── board.js                       — writable board state (positions, zoom, checked) + panTarget + resetSignal
│   └── components/
│       ├── Header.svelte                  — logo, tab links, filter chips, legend, stat, reset button
│       ├── DetailPanel.svelte             — slide-in panel shell, renders NodePanel or TaskPanel
│       ├── NodePanel.svelte               — board node / agent drill-down: overview, chain vis, outputs, criteria
│       ├── TaskPanel.svelte               — ticket Task Mode: overview, team rows, criteria
│       ├── board/
│       │   ├── BoardCanvas.svelte         — all imperative board DOM logic in onMount
│       │   └── Sidebar.svelte             — collapsible tree sidebar
│       └── tickets/
│           ├── TicketsGrid.svelte         — 3-col responsive grid
│           └── TicketCard.svelte          — single ticket card
├── routes/
│   ├── +layout.js                         — export const prerender = true
│   ├── +layout.svelte                     — Header + slot + DetailPanel
│   ├── +page.svelte                       — Board route: Sidebar + BoardCanvas + zoom controls
│   └── tickets/
│       └── +page.svelte                   — Tickets route: TicketsGrid
svelte.config.js
vite.config.js
package.json
```

---

### Task 1: Scaffold SvelteKit and configure Tailwind v4 + adapter-static

**Files:**
- Create: `svelte.config.js`, `vite.config.js`, `package.json`, project scaffold

- [ ] **Step 1: Scaffold SvelteKit in the current directory**

```bash
npm create svelte@latest .
```

When prompted, choose:
- **Template**: Skeleton project
- **Type checking**: No (JavaScript)
- **Additional options**: None (no ESLint, no Prettier, no Playwright, no Vitest)

When warned that directory is not empty, confirm to continue.

- [ ] **Step 2: Install base dependencies**

```bash
npm install
```

- [ ] **Step 3: Install Tailwind v4 and adapter-static**

```bash
npm install -D tailwindcss @tailwindcss/vite @sveltejs/adapter-static
```

- [ ] **Step 4: Configure Vite with Tailwind plugin**

Write `vite.config.js`:

```js
import { sveltekit } from '@sveltejs/kit/vite';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig } from 'vite';

export default defineConfig({
  plugins: [tailwindcss(), sveltekit()]
});
```

- [ ] **Step 5: Configure SvelteKit with adapter-static**

Write `svelte.config.js`:

```js
import adapter from '@sveltejs/adapter-static';

export default {
  kit: {
    adapter: adapter({ fallback: 'index.html' })
  }
};
```

- [ ] **Step 6: Verify dev server starts**

```bash
npm run dev
```

Expected: server starts at `http://localhost:5173`, browser shows blank SvelteKit skeleton page with no errors.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "feat: scaffold SvelteKit with Tailwind v4 and adapter-static"
```

---

### Task 2: Data layer — data.js and helpers.js

**Files:**
- Create: `src/lib/data.js`
- Create: `src/lib/helpers.js`

- [ ] **Step 1: Create src/lib/data.js**

```js
export const DEVELOPERS = [
  { id:'d1', name:'Alice Chen',  initials:'AC', avatarBg:'#1a3d4a',
    role: 'Full-stack engineer — auth & onboarding',
    desc: 'Owns the user identity service and drives the UX redesign initiative. Specialises in authentication flows and frontend component architecture.',
    criteria: ['Feature code & unit tests merged','Auth-related PRs peer-reviewed','Agent outputs reviewed and accepted','Staging deployment signed off','Ticket moved to Done in tracker'],
    outputs: ['Merged pull requests','Code review approvals','Deployment authorisation'] },
  { id:'d2', name:'Bob Kim',     initials:'BK', avatarBg:'#1e2d4a',
    role: 'Backend engineer — pipelines & QA',
    desc: 'Primary owner of the batch processing system and E2E test infrastructure. Diagnoses data-pipeline issues and validates all QA agent output before merge.',
    criteria: ['Pipeline issues root-caused and fixed','E2E suites extended and green','QA agent output validated','Nightly batch job stable for 3 runs','Performance benchmarks met'],
    outputs: ['Pipeline fix PRs','Validated test suites','Nightly job health reports'] },
  { id:'d3', name:'Carol Davis', initials:'CD', avatarBg:'#1a2e3d',
    role: 'DevOps & platform engineer',
    desc: 'Owns the CI/CD infrastructure, database operations, and platform reliability. Ensures zero-downtime deployments and reviews all DeployBot staging outputs.',
    criteria: ['CI/CD pipeline green end-to-end','Database migration executed safely','Staging environment healthy','Rollback procedure documented','SLO targets maintained'],
    outputs: ['Pipeline configuration','Migration scripts','Staging health reports'] },
];

export const AGENTS = [
  { id:'a1', name:'CodeBot',   type:'Code Review', developerId:'d1',
    desc: 'Analyses diffs for style violations, security anti-patterns, and test coverage drops before human review begins. Runs after every push to an open PR.',
    criteria: ['All inline comments resolved or dismissed','No critical security findings open','Coverage did not drop below threshold','Refactoring suggestions acknowledged','Final review approved by CodeBot'],
    outputs: ['Inline code review comments','Security vulnerability report','Coverage delta analysis','Refactoring suggestion list'] },
  { id:'a2', name:'QA-7',      type:'QA',          developerId:'d2',
    desc: 'Generates, runs, and reports on Playwright E2E test suites for checkout and pipeline flows. Blocks merge if any critical test path fails.',
    criteria: ['12+ test cases authored','Happy-path checkout fully covered','Promo-code edge cases tested','All tests passing in CI','Coverage report attached to PR'],
    outputs: ['Playwright test suite','CI test run report','Coverage HTML report','Edge case log'] },
  { id:'a3', name:'DeployBot', type:'DevOps',       developerId:'d3',
    desc: 'Orchestrates CI/CD runs, monitors GitHub Actions pipelines, manages staging deployments, and triggers automated rollback on health-check failure.',
    criteria: ['Build stage passes (< 3 min)','Test stage passes (100% green)','Staging deploy confirmed healthy','Deploy metrics within SLO','Rollback tested and documented'],
    outputs: ['Build pass/fail report','Staging deploy confirmation','Pipeline timing metrics','Rollback trigger log'] },
  { id:'a4', name:'DesignAI',  type:'Design',       developerId:'d1',
    desc: 'Generates high-fidelity Figma screen designs following the design system tokens. Annotates frames for developer handoff and exports responsive breakpoint specs.',
    criteria: ['3 onboarding screens completed in Figma','Mobile-responsive variants included','All design tokens applied correctly','Stakeholder review sign-off received','Dev handoff annotations complete'],
    outputs: ['Figma frame exports','Design token mapping','Responsive breakpoint specs','Dev handoff annotation layer'] },
];

export const SUB_AGENTS = [
  { id:'sa1', name:'LintBot',     type:'Syntax Linter',   parentId:'a1',
    desc: 'Runs ESLint and Prettier across all changed files. Flags style violations, unused variables, and formatting inconsistencies.',
    criteria: ['Zero ESLint errors in changed files','Prettier formatting applied','No unused imports remaining','Auto-fix patch reviewed and accepted'],
    outputs: ['Lint report','Auto-fix patch','Violation count by rule'] },
  { id:'sa2', name:'SecScan',     type:'Security Audit',  parentId:'a1',
    desc: 'Scans code for OWASP Top 10 vulnerabilities, exposed secrets, and dependency CVEs using Semgrep and npm audit.',
    criteria: ['No critical OWASP findings','No exposed secrets in diff','All high-severity CVEs patched or accepted','Security report signed off by lead'],
    outputs: ['OWASP findings report','CVE dependency list','Secret exposure alerts'] },
  { id:'sa3', name:'TestRunner',  type:'Playwright E2E',  parentId:'a2',
    desc: 'Executes the full Playwright E2E suite in headless Chromium against the staging environment. Captures screenshots on failure.',
    criteria: ['All test cases executed','Zero failing tests on happy path','Flaky tests retried and resolved','Screenshots archived for failures','Execution time < 8 minutes'],
    outputs: ['Test results (pass/fail per case)','Failure screenshot artefacts','Execution time report'] },
  { id:'sa4', name:'CoverageBot', type:'Coverage Report', parentId:'a2',
    desc: 'Measures code coverage after test runs and reports delta against the main branch threshold.',
    criteria: ['Coverage ≥ 80% on changed files','Delta report attached to PR','No new uncovered critical paths','Coverage gate passed in CI'],
    outputs: ['Coverage percentage','Uncovered file list','Coverage delta vs main'] },
  { id:'sa5', name:'StageBot',    type:'Staging Deploy',  parentId:'a3',
    desc: 'Pushes Docker images to the staging environment, runs health checks on every endpoint, and reports deployment status with rollback command.',
    criteria: ['Docker image pushed and tagged','All health checks green','Staging URL verified accessible','Deployment logged with timestamp','Rollback command confirmed working'],
    outputs: ['Deploy confirmation','Health check results','Staging URL','Rollback command'] },
];

export const TASKS = [
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

- [ ] **Step 2: Create src/lib/helpers.js**

```js
import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';

export const NODE_W = 220;
export const NODE_H = 68;
export const BOARD_W = 6000;
export const BOARD_H = 4000;
export const CHAIN_COLORS = ['#f59e0b','#22d3ee','#a78bfa','#fb7185','#4ade80','#fb923c'];
export const LANE_LABELS  = ['Tasks','Developers','Agents','Sub-Agents','Sub-Sub-Agents','Level 5','Level 6','Level 7'];
export const LANE_COLORS  = ['rgba(245,158,11,0.025)','rgba(29,212,239,0.025)','rgba(167,139,250,0.025)','rgba(251,113,133,0.025)'];
export const STATUS_LABEL = { todo:'To Do', progress:'In Progress', done:'Done', blocked:'Blocked' };

export function priorityConfig(level) {
  const map = {
    critical: { label:'Critical', color:'#ef4444', bg:'rgba(239,68,68,.18)' },
    high:     { label:'High',     color:'#f59e0b', bg:'rgba(245,158,11,.18)' },
    medium:   { label:'Medium',   color:'#708aa8', bg:'rgba(74,92,114,.18)'  },
    low:      { label:'Low',      color:'#4a5c72', bg:'rgba(74,92,114,.10)'  },
  };
  return level ? (map[level] || null) : null;
}

export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const due  = new Date(dy, dm - 1, dd);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0)   return { text:'Overdue', color:'#ef4444', bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.25)'  };
  if (diff === 0) return { text:'Today',   color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.25)' };
  if (diff < 7)   return { text:`in ${diff} day${diff===1?'':'s'}`, color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.25)' };
  return { text: due.toLocaleDateString('en-US',{month:'short',day:'numeric'}), color:'#4a5c72', bg:'rgba(74,92,114,.10)', border:'rgba(74,92,114,.20)' };
}

export function getDepth(id) {
  if (TASKS.find(t => t.id === id))      return 0;
  if (DEVELOPERS.find(d => d.id === id)) return 1;
  if (AGENTS.find(a => a.id === id))     return 2;
  const sa = SUB_AGENTS.find(s => s.id === id);
  if (!sa) return -1;
  return getDepth(sa.parentId) + 1;
}

export function nodeKind(id) {
  if (TASKS.find(x => x.id === id))      return { label:'Task',      color:'#f59e0b', bg:'rgba(245,158,11,.12)' };
  if (DEVELOPERS.find(x => x.id === id)) return { label:'Developer', color:'#1dd4ef', bg:'rgba(29,212,239,.12)' };
  if (AGENTS.find(x => x.id === id))     return { label:'Agent',     color:'#a78bfa', bg:'rgba(167,139,250,.12)' };
  if (SUB_AGENTS.find(x => x.id === id)) {
    const depth = getDepth(id);
    const prefix = depth > 3 ? 'Sub-'.repeat(depth - 2) : '';
    return { label: prefix + 'Agent', color:'#fb7185', bg:'rgba(251,113,133,.12)' };
  }
  return { label:'Node', color:'#888', bg:'rgba(255,255,255,.06)' };
}

export function findNode(id) {
  return TASKS.find(x => x.id === id)
      || DEVELOPERS.find(x => x.id === id)
      || AGENTS.find(x => x.id === id)
      || SUB_AGENTS.find(x => x.id === id);
}

export function computeDefaultPositions(tasks, devs, agents, subAgents) {
  const allNodes = [
    ...tasks.map(n => ({ id:n.id, depth:0 })),
    ...devs.map(n => ({ id:n.id, depth:1 })),
    ...agents.map(n => ({ id:n.id, depth:2 })),
    ...subAgents.map(n => ({ id:n.id, depth:getDepth(n.id) })),
  ];
  const LANE_W = NODE_W + 24, GAP_Y = 24, H_PAD = 40;
  const byDepth = {};
  allNodes.forEach(n => { (byDepth[n.depth] ??= []).push(n.id); });
  const result = {};
  Object.entries(byDepth).forEach(([depth, ids]) => {
    const d = parseInt(depth), x = d * LANE_W + H_PAD;
    const totalH = ids.length * (NODE_H + GAP_Y) - GAP_Y;
    const startY = Math.max(80, (BOARD_H - totalH) / 2);
    ids.forEach((id, i) => { result[id] = { x, y: startY + i * (NODE_H + GAP_Y) }; });
  });
  return result;
}

export function buildPortMaps(edges) {
  const R = {}, L = {};
  edges.forEach(e => {
    (R[e.from] ??= []).includes(e.to)   || R[e.from].push(e.to);
    (L[e.to]   ??= []).includes(e.from) || L[e.to].push(e.from);
  });
  return { R, L };
}

export function connectedIds(startId, edges) {
  const set = new Set([startId]);
  let changed = true;
  while (changed) {
    changed = false;
    edges.forEach(e => {
      if (set.has(e.from) && !set.has(e.to))   { set.add(e.to);   changed = true; }
      if (set.has(e.to)   && !set.has(e.from)) { set.add(e.from); changed = true; }
    });
  }
  return set;
}

export function downstreamChain(startId, edges) {
  const visited = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift();
    edges.forEach(e => {
      if (e.from === cur && !visited.has(e.to)) { visited.add(e.to); queue.push(e.to); }
    });
  }
  return visited;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/data.js src/lib/helpers.js
git commit -m "feat: add data arrays and pure helper functions"
```

---

### Task 3: Stores

**Files:**
- Create: `src/lib/stores/filters.js`
- Create: `src/lib/stores/activeId.js`
- Create: `src/lib/stores/panel.js`
- Create: `src/lib/stores/board.js`

- [ ] **Step 1: Create src/lib/stores/filters.js**

```js
import { writable, derived } from 'svelte/store';
import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
import { CHAIN_COLORS } from '$lib/helpers.js';

export const filters = writable({ dev:'', type:'', status:'', priority:'' });

export const visibleNodes = derived(filters, ($f) => {
  const tasks = TASKS.filter(t => {
    const ag = AGENTS.find(a => a.id === t.agentId);
    const dv = DEVELOPERS.find(d => d.id === t.developerId);
    if ($f.dev      && dv?.name   !== $f.dev)      return false;
    if ($f.type     && ag?.type   !== $f.type)     return false;
    if ($f.status   && t.status   !== $f.status)   return false;
    if ($f.priority && t.priority !== $f.priority) return false;
    return true;
  });

  const taskColor = {};
  tasks.forEach((t, i) => { taskColor[t.id] = CHAIN_COLORS[i % CHAIN_COLORS.length]; });

  const devIds   = new Set(tasks.map(t => t.developerId));
  const agentIds = new Set(tasks.map(t => t.agentId));
  const devs      = DEVELOPERS.filter(d => devIds.has(d.id));
  const agents    = AGENTS.filter(a => agentIds.has(a.id));
  const subAgents = SUB_AGENTS.filter(sa => {
    let id = sa.parentId;
    while (id) {
      if (agentIds.has(id)) return true;
      id = SUB_AGENTS.find(s => s.id === id)?.parentId;
    }
    return false;
  });

  const edges = [];
  tasks.forEach(t => edges.push({ from:t.id, to:t.developerId, color:taskColor[t.id], taskId:t.id }));
  const seenDA = new Map();
  tasks.forEach(t => { const k = `${t.developerId}|${t.agentId}`; if (!seenDA.has(k)) seenDA.set(k, taskColor[t.id]); });
  seenDA.forEach((color, key) => { const [dId,aId] = key.split('|'); edges.push({ from:dId, to:aId, color, taskId:null }); });
  subAgents.forEach(sa => edges.push({ from:sa.parentId, to:sa.id, color:'rgba(167,139,250,0.5)', taskId:null }));

  return { tasks, devs, agents, subAgents, edges, taskColor };
});
```

- [ ] **Step 2: Create src/lib/stores/activeId.js**

```js
import { writable } from 'svelte/store';
export const activeId = writable(null);
```

- [ ] **Step 3: Create src/lib/stores/panel.js**

```js
import { writable } from 'svelte/store';

export const panel = writable({ open: false, stack: [] });

// entry: { mode: 'agent'|'task', id: string, fromTaskId?: string }
export function openPanel(entry) {
  panel.set({ open: true, stack: [entry] });
}

export function closePanel() {
  panel.set({ open: false, stack: [] });
}

export function drillPanel(entry) {
  panel.update(p => ({ open: true, stack: [...p.stack, entry] }));
}

export function panelBack() {
  panel.update(p => {
    const stack = p.stack.slice(0, -1);
    return { open: stack.length > 0, stack };
  });
}
```

- [ ] **Step 4: Create src/lib/stores/board.js**

```js
import { writable } from 'svelte/store';

export const board = writable({
  positions: {},              // nodeId → { x, y }
  zoom:      { x:0, y:0, scale:1 },
  checked:   {},              // 'nodeId:i' → boolean
});

// Set to a nodeId to trigger BoardCanvas to pan to that node; BoardCanvas resets to null after panning.
export const panTarget = writable(null);

// Increment to trigger BoardCanvas to reset layout; BoardCanvas watches this value.
export const resetSignal = writable(0);
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/stores/
git commit -m "feat: add Svelte stores for filters, activeId, panel, and board state"
```

---

### Task 4: Global styles — app.html and app.css

**Files:**
- Modify: `src/app.html`
- Create: `src/app.css`

- [ ] **Step 1: Write src/app.html**

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <link rel="icon" href="%sveltekit.assets%/favicon.png" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="preconnect" href="https://fonts.googleapis.com" />
    <link href="https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=JetBrains+Mono:ital,wght@0,400;0,500;0,700;1,400&display=swap" rel="stylesheet" />
    %sveltekit.head%
  </head>
  <body data-sveltekit-preload-data="hover">
    <div style="display: contents">%sveltekit.body%</div>
  </body>
</html>
```

- [ ] **Step 2: Write src/app.css**

```css
@import "tailwindcss";

@theme {
  --color-aura-bg:       #050810;
  --color-aura-surface:  #0b1221;
  --color-aura-surface2: #101928;
  --color-aura-dev:      #1dd4ef;
  --color-aura-agent:    #a78bfa;
  --color-aura-sub:      #fb7185;
  --color-aura-text:     #c8d6e8;
  --color-aura-muted:    #4a5c72;
  --font-mono: "JetBrains Mono", monospace;
  --font-syne: "Syne", sans-serif;
}

*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: "JetBrains Mono", monospace;
  background: #050810;
  color: #c8d6e8;
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

@keyframes flow { to { stroke-dashoffset: -24; } }

::-webkit-scrollbar { width: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.065); border-radius: 2px; }

/* ── Board nodes (imperative DOM, cannot use component scoped styles) ── */
.node {
  border-radius: 8px; border: 1px solid rgba(255,255,255,0.065);
  background: #0b1221; padding: 11px 13px 11px 15px;
  cursor: move; position: absolute; width: 220px;
  transition: border-color .18s, box-shadow .18s, opacity .22s; z-index: 2;
}
.node.dragging { box-shadow: 0 8px 32px rgba(0,0,0,0.5); z-index: 50; }
.node::before { content:''; position:absolute; left:0; top:12%; bottom:12%; width:3px; border-radius:0 2px 2px 0; }
.node:hover { border-color: rgba(255,255,255,.13); }
.node.dimmed { opacity: .03; pointer-events: none; }
.node.lit    { border-color: rgba(255,255,255,.22); }

.dev-node::before   { background: #1dd4ef; }
.agent-node::before { background: #a78bfa; }
.sub-node::before   { background: #fb7185; }
.task-node::before  { background: #f59e0b; }

.dev-node.lit   { box-shadow: 0 0 24px rgba(29,212,239,.22),  inset 0 0 28px rgba(29,212,239,.04); }
.agent-node.lit { box-shadow: 0 0 24px rgba(167,139,250,.22), inset 0 0 28px rgba(167,139,250,.04); }
.sub-node.lit   { box-shadow: 0 0 24px rgba(251,113,133,.22), inset 0 0 28px rgba(251,113,133,.04); }

.node-title { font-family:'Syne',sans-serif; font-size:.75rem; font-weight:700; line-height:1.35; margin-bottom:3px; color:#dce8f5; }
.node-sub   { font-size:.62rem; color:#4a5c72; font-style:italic; line-height:1.4; }
.node-tags  { display:flex; gap:4px; flex-wrap:wrap; margin-top:5px; }
.node-row   { display:flex; align-items:center; }

.tag { font-size:.55rem; font-weight:700; padding:2px 6px; border-radius:3px; text-transform:uppercase; letter-spacing:.05em; }
.tag-todo     { background:rgba(74,92,114,.25);  color:#708aa8; }
.tag-progress { background:rgba(29,212,239,.14); color:#5dd8ee; }
.tag-done     { background:rgba(52,211,153,.14); color:#4ed8a0; }
.tag-blocked  { background:rgba(255,95,133,.18); color:#ff7a9a; }

.avatar {
  display:inline-flex; align-items:center; justify-content:center;
  width:22px; height:22px; border-radius:5px;
  font-size:.55rem; font-weight:700; color:#050810;
  margin-right:6px; vertical-align:middle; flex-shrink:0;
}

/* ── SVG connections ── */
.conn {
  fill:none; stroke-linecap:round; stroke-dasharray:6 5;
  animation: flow .9s linear infinite;
  transition: opacity .22s, stroke-width .22s;
}
.conn.dimpath { opacity:.03 !important; }
.conn.litpath { opacity:.92 !important; stroke-width:2.4 !important; }

/* ── Swimlanes ── */
.swimlane { position:absolute; top:0; height:4000px; border-right:1px solid rgba(255,255,255,0.04); pointer-events:none; z-index:0; }
.lane-label { font-family:'Syne',sans-serif; font-size:.55rem; font-weight:700; text-transform:uppercase; letter-spacing:.18em; color:rgba(255,255,255,0.07); padding:18px 14px; display:block; }

/* ── Canvas cursor ── */
#canvas         { cursor: grab; }
#canvas.panning { cursor: grabbing; }

/* ── Detail panel ── */
#detail-panel {
  position:fixed; top:52px; right:0; bottom:0; width:380px;
  background:#07101e; border-left:1px solid rgba(255,255,255,.08);
  transform:translateX(100%); transition:transform .32s cubic-bezier(.16,1,.3,1);
  z-index:30; display:flex; flex-direction:column; overflow:hidden;
}
#detail-panel.open { transform:translateX(0); }

.panel-section { padding:14px 18px; border-bottom:1px solid rgba(255,255,255,.05); display:flex; flex-direction:column; gap:8px; flex-shrink:0; }
.panel-section:last-child { border-bottom:none; }
.panel-section h3 { font-family:'Syne',sans-serif; font-size:.58rem; font-weight:700; text-transform:uppercase; letter-spacing:.14em; color:#4a5c72; margin-bottom:4px; }

.chain-chip { font-family:'Syne',sans-serif; font-size:.62rem; font-weight:700; padding:4px 10px; border-radius:5px; border:1px solid rgba(255,255,255,.1); white-space:nowrap; max-width:110px; overflow:hidden; text-overflow:ellipsis; }
.chain-type { font-size:.52rem; color:#4a5c72; }
.chain-arrow { font-size:.7rem; color:#4a5c72; align-self:center; padding-top:2px; }
.chain-node { display:flex; flex-direction:column; align-items:center; gap:4px; }
.chain-branch { display:flex; flex-direction:column; gap:4px; }

.criterion { display:flex; align-items:flex-start; gap:9px; padding:7px 10px; border-radius:6px; background:rgba(255,255,255,.025); border:1px solid transparent; cursor:pointer; transition:background .12s,border-color .12s; }
.criterion:hover { background:rgba(255,255,255,.05); }
.criterion.checked { background:rgba(74,222,128,.06); border-color:rgba(74,222,128,.14); }
.crit-box { width:14px; height:14px; border-radius:3px; flex-shrink:0; border:1.5px solid #4a5c72; margin-top:1px; display:flex; align-items:center; justify-content:center; transition:background .12s,border-color .12s; font-size:.6rem; color:transparent; }
.criterion.checked .crit-box { background:rgba(74,222,128,.7); border-color:rgba(74,222,128,.7); color:#050810; }
.crit-text { font-size:.68rem; line-height:1.5; color:#90a8be; transition:color .12s; }
.criterion.checked .crit-text { color:#4a5c72; text-decoration:line-through; }

.team-row { display:flex; align-items:center; gap:9px; padding:7px 10px; border-radius:6px; background:rgba(255,255,255,.025); border:1px solid transparent; font-size:.68rem; color:#90a8be; }
.team-row.clickable { cursor:pointer; transition:background .12s,border-color .12s; }
.team-row.clickable:hover { background:rgba(255,255,255,.05); border-color:rgba(255,255,255,.08); }
```

- [ ] **Step 3: Verify Tailwind tokens work**

```bash
npm run dev
```

Open browser. No console errors expected.

- [ ] **Step 4: Commit**

```bash
git add src/app.html src/app.css
git commit -m "feat: configure global styles, Tailwind v4 theme tokens, and app shell"
```

---

### Task 5: Header component

**Files:**
- Create: `src/lib/components/Header.svelte`

- [ ] **Step 1: Create src/lib/components/Header.svelte**

```svelte
<script>
  import { page } from '$app/stores';
  import { filters, visibleNodes } from '$lib/stores/filters.js';
  import { resetSignal } from '$lib/stores/board.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { closePanel } from '$lib/stores/panel.js';

  const isBoard = (pathname) => pathname === '/';

  function onFilterChange(key, value) {
    filters.update(f => ({ ...f, [key]: value }));
    activeId.set(null);
    closePanel();
  }
</script>

<header class="relative z-20 h-[52px] flex items-center gap-3 px-5 flex-shrink-0"
        style="background:rgba(5,8,16,0.94);border-bottom:1px solid rgba(255,255,255,0.065);backdrop-filter:blur(14px)">

  <!-- Logo -->
  <div class="font-syne font-extrabold text-[1rem] tracking-[.06em] flex-shrink-0 mr-2"
       style="background:linear-gradient(100deg,#f59e0b,#1dd4ef 60%,#a78bfa);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text">
    AURA
  </div>

  <!-- Tabs -->
  <a href="/"
     class="text-[.65rem] font-bold tracking-[.03em] px-3 h-full flex items-center border-b-2 transition-colors duration-150 no-underline"
     class:text-aura-text={isBoard($page.url.pathname)}
     class:border-white/50={isBoard($page.url.pathname)}
     class:text-aura-muted={!isBoard($page.url.pathname)}
     class:border-transparent={!isBoard($page.url.pathname)}>
    Board
  </a>
  <a href="/tickets"
     class="text-[.65rem] font-bold tracking-[.03em] px-3 h-full flex items-center border-b-2 transition-colors duration-150 no-underline"
     class:text-aura-text={!isBoard($page.url.pathname)}
     class:border-white/50={!isBoard($page.url.pathname)}
     class:text-aura-muted={isBoard($page.url.pathname)}
     class:border-transparent={isBoard($page.url.pathname)}>
    Tickets
  </a>

  <!-- Separator -->
  <div class="w-px h-[18px] bg-white/[0.065]"></div>

  <!-- Filter chips -->
  {#each [
    { label:'Dev',      key:'dev',      id:'f-dev',      options:[{v:'',l:'All'},{v:'Alice Chen',l:'Alice Chen'},{v:'Bob Kim',l:'Bob Kim'},{v:'Carol Davis',l:'Carol Davis'}] },
    { label:'Agent',    key:'type',     id:'f-type',     options:[{v:'',l:'All'},{v:'Code Review',l:'Code Review'},{v:'QA',l:'QA'},{v:'DevOps',l:'DevOps'},{v:'Design',l:'Design'}] },
    { label:'Status',   key:'status',   id:'f-status',   options:[{v:'',l:'All'},{v:'todo',l:'To Do'},{v:'progress',l:'In Progress'},{v:'done',l:'Done'},{v:'blocked',l:'Blocked'}] },
    { label:'Priority', key:'priority', id:'f-priority', options:[{v:'',l:'All'},{v:'critical',l:'Critical'},{v:'high',l:'High'},{v:'medium',l:'Medium'},{v:'low',l:'Low'}] },
  ] as chip}
    <div class="flex items-center gap-[6px] px-[10px] py-[3px] bg-aura-surface border border-white/[0.065] rounded-[5px] focus-within:border-white/[.18] transition-colors">
      <span class="text-[.6rem] font-bold uppercase tracking-[.1em] text-aura-muted">{chip.label}</span>
      <select
        id={chip.id}
        value={$filters[chip.key]}
        on:change={e => onFilterChange(chip.key, e.target.value)}
        class="font-mono text-[.72rem] bg-transparent border-none text-aura-text cursor-pointer outline-none [&>option]:bg-[#0b1221]"
      >
        {#each chip.options as opt}
          <option value={opt.v}>{opt.l}</option>
        {/each}
      </select>
    </div>
  {/each}

  <!-- Header right -->
  <div class="ml-auto flex items-center gap-[10px]">
    {#if isBoard($page.url.pathname)}
      <button
        on:click={() => resetSignal.update(n => n + 1)}
        class="font-mono text-[.65rem] px-[10px] py-1 bg-aura-surface border border-white/[0.065] rounded-[5px] text-aura-muted cursor-pointer hover:text-aura-text hover:border-white/[.18] transition-colors"
      >
        ↺ Reset Layout
      </button>
    {/if}

    <div class="flex gap-[10px] items-center text-[.6rem] text-aura-muted">
      {#each [{color:'#f59e0b',label:'Tasks'},{color:'#1dd4ef',label:'Developers'},{color:'#a78bfa',label:'Agents'},{color:'#fb7185',label:'Sub-Agents'}] as item}
        <span><span class="inline-block w-[6px] h-[6px] rounded-full mr-1" style="background:{item.color}"></span>{item.label}</span>
      {/each}
    </div>

    <div class="text-[.65rem] px-2 py-[2px] bg-aura-surface border border-white/[0.065] rounded-full text-aura-muted">
      {#if isBoard($page.url.pathname)}
        {$visibleNodes.tasks.length + $visibleNodes.devs.length + $visibleNodes.agents.length + $visibleNodes.subAgents.length} nodes · click to inspect
      {:else}
        {$visibleNodes.tasks.length} ticket{$visibleNodes.tasks.length !== 1 ? 's' : ''} · click to inspect
      {/if}
    </div>
  </div>
</header>
```

- [ ] **Step 2: Import Header in +layout.svelte (temporary placeholder layout)**

Write `src/routes/+layout.svelte`:

```svelte
<script>
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
</script>

<div class="flex flex-col h-screen overflow-hidden">
  <Header />
  <slot />
</div>
```

Write `src/routes/+layout.js`:

```js
export const prerender = true;
```

- [ ] **Step 3: Run dev server and verify header renders with logo, tabs, filter chips, legend, stat**

```bash
npm run dev
```

Open `http://localhost:5173`. Header should appear. Clicking Board/Tickets tabs should navigate (Tickets route will 404 for now — that's expected).

- [ ] **Step 4: Commit**

```bash
git add src/lib/components/Header.svelte src/routes/+layout.svelte src/routes/+layout.js
git commit -m "feat: add Header component with tabs, filter chips, legend, and stat counter"
```

---

### Task 6: BoardCanvas component

**Files:**
- Create: `src/lib/components/board/BoardCanvas.svelte`

- [ ] **Step 1: Create src/lib/components/board/BoardCanvas.svelte**

```svelte
<script>
  import { onMount, onDestroy } from 'svelte';
  import { get } from 'svelte/store';
  import { visibleNodes } from '$lib/stores/filters.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { openPanel, closePanel } from '$lib/stores/panel.js';
  import { board, panTarget, resetSignal } from '$lib/stores/board.js';
  import {
    NODE_W, NODE_H, BOARD_H, STATUS_LABEL,
    LANE_LABELS, LANE_COLORS,
    priorityConfig, formatDueDate, getDepth,
    computeDefaultPositions, buildPortMaps,
    connectedIds, nodeKind
  } from '$lib/helpers.js';

  let canvasEl, boardEl, svgEl;
  let curEdges = [];
  let dragState = null;
  let lastDragMoved = false;
  let panState = null;
  let lastPanMoved = false;

  const LAYOUT_VERSION = '3';

  function loadPositions() {
    try {
      if (localStorage.getItem('aura-layout-v') !== LAYOUT_VERSION) return;
      const raw = localStorage.getItem('aura-positions');
      if (raw) board.update(b => ({ ...b, positions: { ...b.positions, ...JSON.parse(raw) } }));
    } catch {}
  }

  function savePositions() {
    localStorage.setItem('aura-positions', JSON.stringify(get(board).positions));
    localStorage.setItem('aura-layout-v', LAYOUT_VERSION);
  }

  function applyTransform() {
    if (!boardEl) return;
    const { zoom } = get(board);
    boardEl.style.transform = `translate(${zoom.x}px,${zoom.y}px) scale(${zoom.scale})`;
  }

  function render(visible) {
    if (!boardEl || !svgEl) return;
    const { tasks, devs, agents, subAgents, edges, taskColor } = visible;
    curEdges = edges;

    const allNodes = [...tasks, ...devs, ...agents, ...subAgents];
    const { positions } = get(board);
    const missing = allNodes.filter(n => !positions[n.id]);
    if (missing.length) {
      const defaults = computeDefaultPositions(tasks, devs, agents, subAgents);
      board.update(b => {
        const p = { ...b.positions };
        missing.forEach(n => { if (defaults[n.id]) p[n.id] = defaults[n.id]; });
        return { ...b, positions: p };
      });
    }

    boardEl.querySelectorAll('.node, .swimlane').forEach(el => el.remove());

    const maxDepth = allNodes.reduce((m, n) => Math.max(m, getDepth(n.id)), 2);
    renderSwimlanes(maxDepth, allNodes);

    const pos = get(board).positions;

    tasks.forEach(t => {
      const pc = priorityConfig(t.priority);
      const dd = formatDueDate(t.dueDate);
      const priorityPill = pc ? `<span class="tag" style="background:${pc.bg};color:${pc.color}">● ${pc.label}</span>` : '';
      const duePill = dd ? `<span class="tag" style="background:${dd.bg};color:${dd.color};border:1px solid ${dd.border}">${dd.text}</span>` : '';
      addNode(t, 'task-node',
        `<div class="node-title">${t.title}</div><div class="node-sub">${t.desc}</div><div class="node-tags"><span class="tag tag-${t.status}">${STATUS_LABEL[t.status]}</span>${priorityPill}${duePill}</div>`,
        taskColor[t.id], pos);
    });

    devs.forEach(d => addNode(d, 'dev-node',
      `<div class="node-row"><span class="avatar" style="background:${d.avatarBg};color:#1dd4ef">${d.initials}</span><div class="node-title" style="margin:0">${d.name}</div></div><div class="node-sub" style="margin-top:4px">${d.role}</div>`,
      null, pos));

    agents.forEach(a => addNode(a, 'agent-node',
      `<div class="node-title">${a.name}</div><div class="node-sub">${a.type}</div>`,
      null, pos));

    subAgents.forEach(sa => addNode(sa, 'sub-node',
      `<div class="node-title">${sa.name}</div><div class="node-sub">${sa.type}</div>`,
      null, pos));

    requestAnimationFrame(() => drawConnections(edges));
  }

  function addNode(item, className, innerHTML, accent, pos) {
    const el = document.createElement('div');
    el.id = `node-${item.id}`;
    el.className = `node ${className}`;
    el.dataset.nid = item.id;
    el.innerHTML = innerHTML;
    if (accent) {
      el.insertAdjacentHTML('afterbegin',
        `<style>#node-${item.id}::before{background:${accent}}#node-${item.id}.lit{box-shadow:0 0 24px ${accent}33,inset 0 0 28px ${accent}08}</style>`);
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

  function renderSwimlanes(maxDepth, allNodes) {
    const PAD = 20;
    const pos = get(board).positions;
    for (let depth = 0; depth <= maxDepth; depth++) {
      const xs = allNodes.filter(n => getDepth(n.id) === depth).map(n => pos[n.id]?.x).filter(x => x != null);
      if (!xs.length) continue;
      const minX = Math.min(...xs) - PAD;
      const laneW = Math.max(...xs) + NODE_W + PAD - minX;
      const lane = document.createElement('div');
      lane.className = 'swimlane';
      lane.style.cssText = `left:${minX}px;width:${laneW}px;background:${LANE_COLORS[depth % LANE_COLORS.length]}`;
      lane.innerHTML = `<span class="lane-label">${LANE_LABELS[depth] || 'Level ' + depth}</span>`;
      boardEl.appendChild(lane);
    }
  }

  function initDrag(el, nodeId) {
    el.addEventListener('pointerdown', e => {
      if (e.button !== 0) return;
      e.stopPropagation();
      el.setPointerCapture(e.pointerId);
      const pos = get(board).positions[nodeId] || { x:0, y:0 };
      const scale = get(board).zoom.scale;
      dragState = { nodeId, startX:e.clientX, startY:e.clientY, origX:pos.x, origY:pos.y, scale, moved:false };
      el.classList.add('dragging');
    });
    el.addEventListener('pointermove', e => {
      if (!dragState || dragState.nodeId !== nodeId) return;
      const dx = (e.clientX - dragState.startX) / dragState.scale;
      const dy = (e.clientY - dragState.startY) / dragState.scale;
      if (Math.abs(dx) > 3 || Math.abs(dy) > 3) dragState.moved = true;
      const newPos = { x: dragState.origX + dx, y: dragState.origY + dy };
      board.update(b => ({ ...b, positions: { ...b.positions, [nodeId]: newPos } }));
      el.style.left = newPos.x + 'px';
      el.style.top  = newPos.y + 'px';
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

  function zoomAround(delta, cx, cy) {
    board.update(b => {
      const bx = (cx - b.zoom.x) / b.zoom.scale;
      const by = (cy - b.zoom.y) / b.zoom.scale;
      const scale = Math.min(2, Math.max(0.2, b.zoom.scale * delta));
      return { ...b, zoom: { scale, x: cx - bx * scale, y: cy - by * scale } };
    });
    applyTransform();
  }

  function fitToScreen() {
    if (!boardEl || !canvasEl) return;
    const allEls = boardEl.querySelectorAll('.node');
    if (!allEls.length) return;
    const pos = get(board).positions;
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    allEls.forEach(el => {
      const p = pos[el.dataset.nid];
      if (!p) return;
      minX = Math.min(minX, p.x); minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x + el.offsetWidth); maxY = Math.max(maxY, p.y + el.offsetHeight);
    });
    const PAD = 60, bw = maxX - minX + PAD * 2, bh = maxY - minY + PAD * 2;
    let s = Math.min(canvasEl.clientWidth / bw, canvasEl.clientHeight / bh, 2);
    s = Math.max(s, 0.2);
    board.update(b => ({ ...b, zoom: { scale:s, x:(canvasEl.clientWidth-bw*s)/2-(minX-PAD)*s, y:(canvasEl.clientHeight-bh*s)/2-(minY-PAD)*s } }));
    applyTransform();
  }

  function ensureMarker(svg, defs, color) {
    const mid = 'mk' + color.replace(/[^a-z0-9]/gi,'');
    if (!defs.querySelector('#'+mid)) {
      const m = document.createElementNS('http://www.w3.org/2000/svg','marker');
      m.setAttribute('id',mid); m.setAttribute('markerWidth','7'); m.setAttribute('markerHeight','7');
      m.setAttribute('refX','6'); m.setAttribute('refY','3.5'); m.setAttribute('orient','auto');
      const p = document.createElementNS('http://www.w3.org/2000/svg','path');
      p.setAttribute('d','M0,0.5 L6,3.5 L0,6.5 Z'); p.setAttribute('fill',color); p.setAttribute('opacity','0.85');
      m.appendChild(p); defs.appendChild(m);
    }
    return 'url(#'+mid+')';
  }

  function drawConnections(edges) {
    if (!svgEl || !boardEl) return;
    svgEl.innerHTML = '';
    const defs = document.createElementNS('http://www.w3.org/2000/svg','defs');
    svgEl.appendChild(defs);
    const portMaps = buildPortMaps(edges);
    const pos = get(board).positions;
    edges.forEach(edge => {
      const fromEl = boardEl.querySelector(`#node-${edge.from}`);
      const toEl   = boardEl.querySelector(`#node-${edge.to}`);
      if (!fromEl || !toEl) return;
      const fp = pos[edge.from], tp = pos[edge.to];
      if (!fp || !tp) return;
      const fw = fromEl.offsetWidth, fh = fromEl.offsetHeight, th = toEl.offsetHeight;
      const fromList = portMaps.R[edge.from]||[], toList = portMaps.L[edge.to]||[];
      const fi = fromList.indexOf(edge.to), ft = fromList.length;
      const ti = toList.indexOf(edge.from), tt = toList.length;
      const fFrac = ft===1?0.5:(fi+1)/(ft+1);
      const tFrac = tt===1?0.5:(ti+1)/(tt+1);
      const x1=fp.x+fw, y1=fp.y+fh*fFrac, x2=tp.x, y2=tp.y+th*tFrac;
      const dx = Math.max(36,(x2-x1)*0.48);
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d',`M ${x1} ${y1} C ${x1+dx} ${y1} ${x2-dx} ${y2} ${x2} ${y2}`);
      path.setAttribute('stroke',edge.color); path.setAttribute('stroke-width','1.5');
      path.setAttribute('marker-end',ensureMarker(svgEl,defs,edge.color));
      path.classList.add('conn');
      path.dataset.from=edge.from; path.dataset.to=edge.to; path.dataset.taskid=edge.taskId||'';
      path.style.opacity='0.38';
      svgEl.appendChild(path);
    });
    applyHighlight();
  }

  function applyHighlight() {
    if (!boardEl) return;
    const $activeId = get(activeId);
    const nodes = boardEl.querySelectorAll('.node');
    const conns = svgEl?.querySelectorAll('.conn') || [];
    if (!$activeId) {
      nodes.forEach(n => n.classList.remove('dimmed','lit'));
      conns.forEach(c => { c.classList.remove('litpath','dimpath'); c.style.opacity='0.38'; });
      return;
    }
    const lit = connectedIds($activeId, curEdges);
    nodes.forEach(n => {
      n.classList.toggle('dimmed', !lit.has(n.dataset.nid));
      n.classList.toggle('lit',     lit.has(n.dataset.nid));
    });
    conns.forEach(c => {
      const inLit = lit.has(c.dataset.from) && lit.has(c.dataset.to);
      c.classList.toggle('litpath', inLit);
      c.classList.toggle('dimpath', !inLit);
      c.style.opacity='';
    });
  }

  let unsubs = [];

  onMount(() => {
    loadPositions();

    // Canvas pan
    canvasEl.addEventListener('pointerdown', e => {
      if (e.button!==0 || e.target.closest('.node')) return;
      canvasEl.setPointerCapture(e.pointerId);
      const z = get(board).zoom;
      panState = { startX:e.clientX, startY:e.clientY, origX:z.x, origY:z.y, moved:false };
      canvasEl.classList.add('panning');
    });
    canvasEl.addEventListener('pointermove', e => {
      if (!panState) return;
      const dx = e.clientX-panState.startX, dy = e.clientY-panState.startY;
      if (Math.abs(dx)>3||Math.abs(dy)>3) panState.moved=true;
      board.update(b => ({ ...b, zoom:{...b.zoom,x:panState.origX+dx,y:panState.origY+dy} }));
      applyTransform();
    });
    canvasEl.addEventListener('pointerup', () => {
      if (!panState) return;
      lastPanMoved = panState.moved;
      panState = null;
      canvasEl.classList.remove('panning');
    });
    canvasEl.addEventListener('click', () => {
      if (lastPanMoved) { lastPanMoved=false; return; }
      activeId.set(null); closePanel(); applyHighlight();
    });
    canvasEl.addEventListener('wheel', e => {
      e.preventDefault();
      const rect = canvasEl.getBoundingClientRect();
      zoomAround(e.deltaY>0?0.9:1.1, e.clientX-rect.left, e.clientY-rect.top);
    }, { passive:false });

    const onResize = () => drawConnections(curEdges);
    window.addEventListener('resize', onResize);

    // Store subscriptions
    unsubs.push(visibleNodes.subscribe(v => render(v)));
    unsubs.push(activeId.subscribe(() => applyHighlight()));
    unsubs.push(panTarget.subscribe(id => {
      if (!id) return;
      const pos = get(board).positions[id];
      if (!pos) { panTarget.set(null); return; }
      const scale = get(board).zoom.scale;
      board.update(b => ({ ...b, zoom:{...b.zoom, x:canvasEl.clientWidth/2-(pos.x+NODE_W/2)*scale, y:canvasEl.clientHeight/2-(pos.y+NODE_H/2)*scale} }));
      applyTransform();
      requestAnimationFrame(() => drawConnections(curEdges));
      panTarget.set(null);
    }));
    unsubs.push(resetSignal.subscribe((n, prev) => {
      if (prev === undefined) return; // skip initial subscription call
      const visible = get(visibleNodes);
      const defaults = computeDefaultPositions(visible.tasks, visible.devs, visible.agents, visible.subAgents);
      board.update(b => ({ ...b, positions:defaults, zoom:{x:0,y:0,scale:1} }));
      localStorage.removeItem('aura-positions');
      applyTransform();
      render(visible);
    }));

    unsubs.push(() => window.removeEventListener('resize', onResize));

    applyTransform();
    requestAnimationFrame(fitToScreen);
  });

  onDestroy(() => unsubs.forEach(u => u()));

  // Exported zoom methods called by +page.svelte buttons
  export function zoomIn()  { zoomAround(1.25, canvasEl.clientWidth/2, canvasEl.clientHeight/2); }
  export function zoomOut() { zoomAround(0.8,  canvasEl.clientWidth/2, canvasEl.clientHeight/2); }
  export function zoomFit() { fitToScreen(); }
</script>

<div bind:this={canvasEl} id="canvas" class="flex-1 relative overflow-hidden min-w-0">
  <div bind:this={boardEl} id="board" class="absolute" style="width:6000px;height:4000px;transform-origin:0 0">
    <svg bind:this={svgEl} xmlns="http://www.w3.org/2000/svg"
         class="absolute top-0 left-0 pointer-events-none"
         style="width:6000px;height:6000px;z-index:1"></svg>
  </div>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/board/BoardCanvas.svelte
git commit -m "feat: add BoardCanvas with imperative board rendering, drag, pan, zoom"
```

---

### Task 7: Sidebar component

**Files:**
- Create: `src/lib/components/board/Sidebar.svelte`

- [ ] **Step 1: Create src/lib/components/board/Sidebar.svelte**

```svelte
<script>
  import { visibleNodes } from '$lib/stores/filters.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { openPanel } from '$lib/stores/panel.js';
  import { panTarget } from '$lib/stores/board.js';
  import { AGENTS, SUB_AGENTS } from '$lib/data.js';
  import { DEVELOPERS } from '$lib/data.js';

  let visible = localStorage.getItem('aura-sidebar-visible') !== 'false';
  $: localStorage.setItem('aura-sidebar-visible', visible);

  // Track open tree nodes: Set of keys like taskId, `taskId|devId`, `taskId|agentId`
  let openKeys = new Set(JSON.parse(localStorage.getItem('aura-sidebar-open') || '[]'));

  function toggleKey(key) {
    if (openKeys.has(key)) openKeys.delete(key);
    else openKeys.add(key);
    openKeys = openKeys; // trigger Svelte reactivity
    localStorage.setItem('aura-sidebar-open', JSON.stringify([...openKeys]));
  }

  function onRowClick(id) {
    activeId.set(id);
    openPanel({ mode:'agent', id });
    panTarget.set(id);
  }

  // Build tree from visible tasks
  $: tree = $visibleNodes.tasks.map(task => {
    const dev   = DEVELOPERS.find(d => d.id === task.developerId);
    const agent = AGENTS.find(a => a.id === task.agentId);
    const subs  = agent ? SUB_AGENTS.filter(sa => sa.parentId === agent.id) : [];
    const taskKey  = task.id;
    const devKey   = dev   ? `${task.id}|${dev.id}`   : null;
    const agentKey = agent ? `${task.id}|${agent.id}` : null;
    return { task, dev, agent, subs, taskKey, devKey, agentKey };
  });
</script>

<div
  class="relative flex-shrink-0 bg-aura-surface border-r border-white/[0.065] flex flex-col transition-[width] duration-[280ms] z-10"
  style="width:{visible?'200px':'0'};overflow:visible"
>
  <!-- Tree content -->
  <div class="flex-1 py-2 overflow-y-auto overflow-x-hidden" style="scrollbar-width:thin">
    {#each tree as { task, dev, agent, subs, taskKey, devKey, agentKey }}
      <!-- Task row -->
      <div
        class="flex items-center gap-1 px-2 py-[3px] mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors"
        class:bg-white/[.08]={$activeId === task.id}
        role="button" tabindex="0"
        on:click={() => onRowClick(task.id)}
        on:keydown={e => e.key==='Enter' && onRowClick(task.id)}
      >
        <span
          class="flex-shrink-0 w-3 text-[.6rem] text-aura-muted cursor-pointer hover:text-aura-text transition-colors"
          class:opacity-0={!dev}
          class:pointer-events-none={!dev}
          on:click|stopPropagation={() => dev && toggleKey(taskKey)}
          role="button" tabindex="-1"
          on:keydown={e => e.key==='Enter' && dev && toggleKey(taskKey)}
        >{dev ? (openKeys.has(taskKey) ? '▾' : '▸') : '▸'}</span>
        <span class="overflow-hidden text-ellipsis flex-1" style="color:#f59e0b">{task.title}</span>
      </div>

      <!-- Dev children -->
      {#if dev && openKeys.has(taskKey)}
        <div>
          <div
            class="flex items-center gap-1 mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors"
            class:bg-white/[.08]={$activeId === dev.id}
            style="padding:3px 8px 3px {8+12}px"
            role="button" tabindex="0"
            on:click={() => onRowClick(dev.id)}
            on:keydown={e => e.key==='Enter' && onRowClick(dev.id)}
          >
            <span
              class="flex-shrink-0 w-3 text-[.6rem] text-aura-muted cursor-pointer hover:text-aura-text transition-colors"
              class:opacity-0={!agent} class:pointer-events-none={!agent}
              on:click|stopPropagation={() => agent && toggleKey(devKey)}
              role="button" tabindex="-1"
              on:keydown={e => e.key==='Enter' && agent && toggleKey(devKey)}
            >{agent ? (openKeys.has(devKey) ? '▾' : '▸') : '▸'}</span>
            <span class="overflow-hidden text-ellipsis flex-1" style="color:#1dd4ef">{dev.name}</span>
          </div>

          <!-- Agent children -->
          {#if agent && openKeys.has(devKey)}
            <div>
              <div
                class="flex items-center gap-1 mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors"
                class:bg-white/[.08]={$activeId === agent.id}
                style="padding:3px 8px 3px {8+24}px"
                role="button" tabindex="0"
                on:click={() => onRowClick(agent.id)}
                on:keydown={e => e.key==='Enter' && onRowClick(agent.id)}
              >
                <span
                  class="flex-shrink-0 w-3 text-[.6rem] text-aura-muted cursor-pointer hover:text-aura-text transition-colors"
                  class:opacity-0={!subs.length} class:pointer-events-none={!subs.length}
                  on:click|stopPropagation={() => subs.length && toggleKey(agentKey)}
                  role="button" tabindex="-1"
                  on:keydown={e => e.key==='Enter' && subs.length && toggleKey(agentKey)}
                >{subs.length ? (openKeys.has(agentKey) ? '▾' : '▸') : '▸'}</span>
                <span class="overflow-hidden text-ellipsis flex-1" style="color:#a78bfa">{agent.name}</span>
              </div>

              <!-- Sub-agent children -->
              {#if subs.length && openKeys.has(agentKey)}
                {#each subs as sa}
                  <div
                    class="flex items-center gap-1 mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors"
                    class:bg-white/[.08]={$activeId === sa.id}
                    style="padding:3px 8px 3px {8+36}px"
                    role="button" tabindex="0"
                    on:click={() => onRowClick(sa.id)}
                    on:keydown={e => e.key==='Enter' && onRowClick(sa.id)}
                  >
                    <span class="flex-shrink-0 w-3 text-[.6rem] opacity-0">▸</span>
                    <span class="overflow-hidden text-ellipsis flex-1" style="color:#fb7185">{sa.name}</span>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- Collapse toggle -->
  <button
    class="absolute -right-[18px] top-1/2 -translate-y-1/2 w-[18px] h-10 bg-aura-surface border border-white/[0.065] border-l-0 rounded-r-[5px] flex items-center justify-center cursor-pointer text-aura-muted text-[.75rem] z-[11] hover:text-aura-text hover:bg-aura-surface2 select-none transition-colors"
    on:click={() => visible = !visible}
  >{visible ? '‹' : '›'}</button>
</div>
```

- [ ] **Step 2: Commit**

```bash
git add src/lib/components/board/Sidebar.svelte
git commit -m "feat: add collapsible Sidebar tree component"
```

---

### Task 8: Board route (+page.svelte)

**Files:**
- Modify: `src/routes/+page.svelte`

- [ ] **Step 1: Write src/routes/+page.svelte**

```svelte
<script>
  import BoardCanvas from '$lib/components/board/BoardCanvas.svelte';
  import Sidebar from '$lib/components/board/Sidebar.svelte';

  let boardCanvas;
</script>

<div class="flex flex-1 overflow-hidden relative z-[1]">
  <Sidebar />
  <BoardCanvas bind:this={boardCanvas} />
</div>

<!-- Zoom controls -->
<div class="fixed bottom-5 right-5 z-[25] flex flex-col gap-1">
  {#each [
    { label:'+',  title:'Zoom in',       action: () => boardCanvas?.zoomIn()  },
    { label:'⊡', title:'Fit to screen', action: () => boardCanvas?.zoomFit() },
    { label:'−',  title:'Zoom out',      action: () => boardCanvas?.zoomOut() },
  ] as btn}
    <button
      title={btn.title}
      on:click={btn.action}
      class="w-8 h-8 bg-aura-surface border border-white/[0.065] rounded-[6px] text-aura-muted cursor-pointer flex items-center justify-center text-base hover:text-aura-text hover:border-white/[.18] transition-colors"
    >{btn.label}</button>
  {/each}
</div>
```

- [ ] **Step 2: Open `http://localhost:5173` — verify full board renders with nodes, SVG connections, sidebar, zoom controls, and filter chips working**

- [ ] **Step 3: Test interactions**
  - Drag a node — it moves, connections redraw
  - Pan the canvas — board scrolls
  - Scroll wheel — zoom in/out
  - Click a node — highlight activates (nodes dim/lit, connections highlight)
  - Click a filter chip — board re-renders with filtered nodes
  - Click ↺ Reset Layout — positions reset
  - Click ‹ sidebar toggle — sidebar collapses

- [ ] **Step 4: Commit**

```bash
git add src/routes/+page.svelte
git commit -m "feat: add Board route with Sidebar and BoardCanvas"
```

---

### Task 9: Detail Panel components

**Files:**
- Create: `src/lib/components/NodePanel.svelte`
- Create: `src/lib/components/TaskPanel.svelte`
- Create: `src/lib/components/DetailPanel.svelte`

- [ ] **Step 1: Create src/lib/components/NodePanel.svelte**

```svelte
<script>
  export let nodeId;

  import { visibleNodes } from '$lib/stores/filters.js';
  import { board } from '$lib/stores/board.js';
  import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
  import { nodeKind, findNode, downstreamChain, priorityConfig, formatDueDate } from '$lib/helpers.js';

  $: data = findNode(nodeId);
  $: kind = data ? nodeKind(nodeId) : null;
  $: edges = $visibleNodes.edges;

  $: chainVisited = (nodeId && edges) ? downstreamChain(nodeId, edges) : new Set();
  $: chainCols = buildCols(nodeId, chainVisited);

  function buildCols(startId, visited) {
    const allIds = [startId, ...Array.from(visited).filter(id => id !== startId)];
    return [
      allIds.filter(id => TASKS.find(x => x.id === id)),
      allIds.filter(id => DEVELOPERS.find(x => x.id === id)),
      allIds.filter(id => AGENTS.find(x => x.id === id)),
      allIds.filter(id => SUB_AGENTS.find(x => x.id === id)),
    ].filter(c => c.length > 0);
  }

  $: isTask = data && TASKS.find(t => t.id === nodeId);
  $: metaPc = isTask ? priorityConfig(data.priority) : null;
  $: metaDd = data?.dueDate ? formatDueDate(data.dueDate) : null;
  $: fullDate = data?.dueDate ? (() => {
    const [y,m,d] = data.dueDate.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  })() : null;

  function toggleCriterion(key) {
    board.update(b => ({ ...b, checked: { ...b.checked, [key]: !b.checked[key] } }));
  }
</script>

{#if data && kind}
  <!-- Overview -->
  <div class="panel-section">
    <h3>Overview</h3>
    <p style="font-size:.72rem;line-height:1.65;color:#a0b4c8">{data.overview || data.desc || '—'}</p>
    {#if metaPc || metaDd}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
        {#if metaPc}
          <span class="tag" style="background:{metaPc.bg};color:{metaPc.color}">● {metaPc.label}</span>
        {/if}
        {#if metaDd && fullDate}
          <span class="tag" style="background:{metaDd.bg};color:{metaDd.color};border:1px solid {metaDd.border}">📅 {fullDate}</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Chain visualization -->
  {#if chainCols.length > 0}
    <div class="panel-section">
      <h3>Chain from here</h3>
      <div style="display:flex;align-items:flex-start;flex-wrap:wrap;gap:6px">
        {#each chainCols as col, ci}
          {#if ci > 0}<div class="chain-arrow">→</div>{/if}
          <div class="chain-branch">
            {#each col as id}
              {@const d = findNode(id)}
              {@const k = nodeKind(id)}
              <div class="chain-node">
                <div class="chain-chip" style="background:{k.bg};color:{k.color};border-color:{k.color}33">
                  {d?.name || d?.title || id}
                </div>
                <span class="chain-type">{k.label}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>

      {#if data.outputs?.length}
        <h3 style="margin-top:10px">Outputs</h3>
        <div style="display:flex;flex-direction:column;gap:5px">
          {#each data.outputs as output}
            <div style="display:flex;align-items:center;gap:8px;font-size:.68rem;color:#90a8be;line-height:1.4">
              <span style="width:5px;height:5px;border-radius:50%;flex-shrink:0;opacity:.7;background:{kind.color}"></span>
              <span>{output}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Criteria -->
  {#if data.criteria?.length}
    <div class="panel-section">
      <h3>Completion criteria</h3>
      <div style="display:flex;flex-direction:column;gap:6px">
        {#each data.criteria as text, i}
          {@const key = `${nodeId}:${i}`}
          {@const isOk = !!$board.checked[key]}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="criterion {isOk ? 'checked' : ''}"
            on:click={() => toggleCriterion(key)}
            role="checkbox"
            aria-checked={isOk}
            tabindex="0"
          >
            <div class="crit-box">{isOk ? '✓' : ''}</div>
            <span class="crit-text">{text}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
```

- [ ] **Step 2: Create src/lib/components/TaskPanel.svelte**

```svelte
<script>
  export let taskId;

  import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
  import { board } from '$lib/stores/board.js';
  import { drillPanel } from '$lib/stores/panel.js';
  import { priorityConfig, formatDueDate } from '$lib/helpers.js';

  $: task     = TASKS.find(t => t.id === taskId);
  $: dev      = task ? DEVELOPERS.find(d => d.id === task.developerId) : null;
  $: agent    = task ? AGENTS.find(a => a.id === task.agentId) : null;
  $: subAgents = agent ? SUB_AGENTS.filter(sa => sa.parentId === agent.id) : [];

  $: metaPc = task ? priorityConfig(task.priority) : null;
  $: metaDd = task?.dueDate ? formatDueDate(task.dueDate) : null;
  $: fullDate = task?.dueDate ? (() => {
    const [y,m,d] = task.dueDate.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  })() : null;

  function toggleCriterion(key) {
    board.update(b => ({ ...b, checked: { ...b.checked, [key]: !b.checked[key] } }));
  }
</script>

{#if task}
  <!-- Overview -->
  <div class="panel-section">
    <h3>Overview</h3>
    <p style="font-size:.72rem;line-height:1.65;color:#a0b4c8">{task.overview || task.desc || '—'}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      {#if metaPc}
        <span class="tag" style="background:{metaPc.bg};color:{metaPc.color}">● {metaPc.label}</span>
      {/if}
      {#if metaDd && fullDate}
        <span class="tag" style="background:{metaDd.bg};color:{metaDd.color};border:1px solid {metaDd.border}">📅 {fullDate}</span>
      {/if}
    </div>
  </div>

  <!-- Team -->
  <div class="panel-section">
    <h3>Team</h3>
    <div style="display:flex;flex-direction:column;gap:4px">
      {#if dev}
        <div class="team-row">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4a5c72;min-width:40px;flex-shrink:0">Dev</span>
          <span class="avatar" style="background:{dev.avatarBg};color:#1dd4ef;width:18px;height:18px;font-size:.5rem;border-radius:4px;flex-shrink:0;margin-right:0">{dev.initials}</span>
          <span style="flex:1;color:#dce8f5">{dev.name}</span>
          <span style="font-size:.58rem;color:#4a5c72;font-style:italic">{dev.role}</span>
        </div>
      {/if}
      {#if agent}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="team-row clickable" on:click={() => drillPanel({ mode:'agent', id:agent.id, fromTaskId:taskId })} role="button" tabindex="0">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4a5c72;min-width:40px;flex-shrink:0">Agent</span>
          <span style="flex:1;color:#a78bfa">{agent.name}</span>
          <span style="font-size:.58rem;color:#4a5c72;font-style:italic">{agent.type}</span>
          <span style="color:#4a5c72;font-size:.7rem">›</span>
        </div>
      {/if}
      {#each subAgents as sa}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="team-row clickable" on:click={() => drillPanel({ mode:'agent', id:sa.id, fromTaskId:taskId })} role="button" tabindex="0">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:#4a5c72;min-width:40px;flex-shrink:0">Sub</span>
          <span style="flex:1;color:#fb7185">{sa.name}</span>
          <span style="font-size:.58rem;color:#4a5c72;font-style:italic">{sa.type}</span>
          <span style="color:#4a5c72;font-size:.7rem">›</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Criteria -->
  {#if task.criteria?.length}
    <div class="panel-section">
      <h3>Completion criteria</h3>
      <div style="display:flex;flex-direction:column;gap:6px">
        {#each task.criteria as text, i}
          {@const key = `${taskId}:${i}`}
          {@const isOk = !!$board.checked[key]}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="criterion {isOk ? 'checked' : ''}"
            on:click={() => toggleCriterion(key)}
            role="checkbox"
            aria-checked={isOk}
            tabindex="0"
          >
            <div class="crit-box">{isOk ? '✓' : ''}</div>
            <span class="crit-text">{text}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
```

- [ ] **Step 3: Create src/lib/components/DetailPanel.svelte**

```svelte
<script>
  import { panel, closePanel, panelBack } from '$lib/stores/panel.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { nodeKind } from '$lib/helpers.js';
  import NodePanel from './NodePanel.svelte';
  import TaskPanel from './TaskPanel.svelte';

  $: top   = $panel.stack[$panel.stack.length - 1];
  $: kind  = top ? nodeKind(top.id) : null;
  $: showBack = $panel.stack.length > 1;

  function handleClose() {
    activeId.set(null);
    closePanel();
  }
</script>

<div id="detail-panel" class:open={$panel.open}>
  <!-- Accent bar -->
  <div style="height:2px;flex-shrink:0;background:{kind?.color || 'transparent'};transition:background .2s"></div>

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;padding:14px 20px 10px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:12px">
    {#if kind}
      <span style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;border-radius:3px;flex-shrink:0;margin-top:3px;background:{kind.bg};color:{kind.color}">
        {kind.label}
      </span>
    {/if}
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:#edf2f8;line-height:1.2">
        {#if top}
          {#if top.mode === 'task'}
            {#await import('$lib/data.js') then { TASKS }}
              {TASKS.find(t => t.id === top.id)?.title || top.id}
            {/await}
          {:else}
            {#await import('$lib/helpers.js') then { findNode }}
              {findNode(top.id)?.name || findNode(top.id)?.title || top.id}
            {/await}
          {/if}
        {/if}
      </div>
      <div style="font-size:.65rem;color:#4a5c72;margin-top:2px;font-style:italic">
        {#if top?.mode === 'agent'}
          {#await import('$lib/helpers.js') then { findNode }}
            {findNode(top.id)?.role || findNode(top.id)?.type || ''}
          {/await}
        {/if}
      </div>
    </div>
    <button
      on:click={handleClose}
      style="margin-left:auto;background:none;border:none;cursor:pointer;color:#4a5c72;font-size:1.1rem;line-height:1;padding:2px 6px;border-radius:4px;flex-shrink:0;transition:color .12s,background .12s"
      class="hover:text-aura-text hover:bg-white/[.07]"
    >✕</button>
  </div>

  <!-- Body -->
  <div style="display:flex;flex-direction:column;flex:1;overflow-y:auto;overflow-x:hidden">
    {#if showBack}
      <button
        on:click={panelBack}
        style="display:flex;align-items:center;gap:5px;margin:12px 18px 0;padding:5px 10px;width:fit-content;background:none;border:1px solid rgba(255,255,255,.065);border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:.63rem;color:#4a5c72;transition:color .12s,border-color .12s"
        class="hover:text-aura-text hover:border-white/[.18]"
      >← Back</button>
    {/if}

    {#if top}
      {#if top.mode === 'task'}
        <TaskPanel taskId={top.id} />
      {:else}
        <NodePanel nodeId={top.id} />
      {/if}
    {/if}
  </div>
</div>
```

- [ ] **Step 4: Add DetailPanel to +layout.svelte**

Write `src/routes/+layout.svelte`:

```svelte
<script>
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import DetailPanel from '$lib/components/DetailPanel.svelte';
</script>

<div class="flex flex-col h-screen overflow-hidden">
  <Header />
  <slot />
  <DetailPanel />
</div>
```

- [ ] **Step 5: Test detail panel on Board route**

Open `http://localhost:5173`. Click any node — panel slides in with chain vis, outputs, and criteria. Click another node. Close panel. Click ✕. Verify criteria checkboxes persist within session.

- [ ] **Step 6: Commit**

```bash
git add src/lib/components/NodePanel.svelte src/lib/components/TaskPanel.svelte src/lib/components/DetailPanel.svelte src/routes/+layout.svelte
git commit -m "feat: add DetailPanel with NodePanel and TaskPanel drill-down"
```

---

### Task 10: Tickets route

**Files:**
- Create: `src/lib/components/tickets/TicketCard.svelte`
- Create: `src/lib/components/tickets/TicketsGrid.svelte`
- Create: `src/routes/tickets/+page.svelte`

- [ ] **Step 1: Create src/lib/components/tickets/TicketCard.svelte**

```svelte
<script>
  export let task;
  export let dev;
  export let agent;
  export let subAgents = [];

  import { activeId } from '$lib/stores/activeId.js';
  import { openPanel } from '$lib/stores/panel.js';
  import { priorityConfig, formatDueDate, STATUS_LABEL } from '$lib/helpers.js';

  $: pc = priorityConfig(task.priority);
  $: dd = formatDueDate(task.dueDate);
  $: accentColor = pc?.color || '#f59e0b';

  function onClick() {
    activeId.set(task.id);
    openPanel({ mode:'task', id:task.id });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="relative cursor-pointer rounded-lg overflow-hidden transition-[border-color,box-shadow] duration-150"
  class:ring-1={$activeId === task.id}
  style="background:#0b1221;border:1px solid {$activeId===task.id?'rgba(255,255,255,.22)':'rgba(255,255,255,.065)'};padding:12px 14px 12px 17px;{$activeId===task.id?'box-shadow:0 0 16px rgba(255,255,255,.04)':''}"
  on:click={onClick}
  role="button"
  tabindex="0"
>
  <!-- Priority accent bar -->
  <div class="absolute left-0 top-[10%] bottom-[10%] w-[3px] rounded-r-[2px]" style="background:{accentColor}"></div>

  <!-- Title -->
  <div style="font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;color:#dce8f5;line-height:1.3;margin-bottom:5px">
    {task.title}
  </div>

  <!-- Badges -->
  <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
    <span class="tag tag-{task.status}">{STATUS_LABEL[task.status]}</span>
    {#if pc}
      <span class="tag" style="background:{pc.bg};color:{pc.color}">● {pc.label}</span>
    {/if}
    {#if dd}
      <span class="tag" style="background:{dd.bg};color:{dd.color};border:1px solid {dd.border}">{dd.text}</span>
    {/if}
  </div>

  <!-- Developer row -->
  {#if dev}
    <div style="display:flex;align-items:center;gap:7px;font-size:.63rem;color:#4a5c72;margin-top:5px;line-height:1.4">
      <span class="avatar" style="background:{dev.avatarBg};color:#1dd4ef;width:18px;height:18px;font-size:.5rem;border-radius:4px;margin-right:0">{dev.initials}</span>
      <span>{dev.name}</span>
    </div>
  {/if}

  <!-- Agent + sub-agent chips -->
  {#if agent}
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">
      <span style="font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(167,139,250,.10);color:#a78bfa;border:1px solid rgba(167,139,250,.22)">{agent.name}</span>
      {#each subAgents as sa}
        <span style="font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(251,113,133,.08);color:#fb7185;border:1px solid rgba(251,113,133,.20)">{sa.name}</span>
      {/each}
    </div>
  {/if}
</div>
```

- [ ] **Step 2: Create src/lib/components/tickets/TicketsGrid.svelte**

```svelte
<script>
  import { visibleNodes } from '$lib/stores/filters.js';
  import { DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
  import TicketCard from './TicketCard.svelte';

  $: ticketRows = $visibleNodes.tasks.map(task => ({
    task,
    dev:       DEVELOPERS.find(d => d.id === task.developerId),
    agent:     AGENTS.find(a => a.id === task.agentId),
    subAgents: (() => { const a = AGENTS.find(x => x.id === task.agentId); return a ? SUB_AGENTS.filter(sa => sa.parentId === a.id) : []; })(),
  }));
</script>

<div class="flex-1 overflow-y-auto p-6">
  {#if ticketRows.length === 0}
    <div style="text-align:center;padding:48px 16px;font-size:.72rem;color:#4a5c72">
      No tickets match the current filters.
    </div>
  {:else}
    <div class="grid gap-[14px]" style="grid-template-columns:repeat(3,1fr)">
      {#each ticketRows as { task, dev, agent, subAgents }}
        <TicketCard {task} {dev} {agent} {subAgents} />
      {/each}
    </div>
  {/if}
</div>

<style>
  @media (max-width: 900px) {
    div.grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
</style>
```

- [ ] **Step 3: Create src/routes/tickets/+page.svelte**

```svelte
<script>
  import TicketsGrid from '$lib/components/tickets/TicketsGrid.svelte';
</script>

<TicketsGrid />
```

- [ ] **Step 4: Open `http://localhost:5173/tickets` — verify ticket cards render with correct data, filters work, clicking a card opens the detail panel in Task Mode**

Test:
- All 6 task cards appear
- Priority accent bar color matches priority (red=critical, amber=high, grey=medium)
- Status badge, priority pill, due date pill all present
- Developer avatar + name row shows correctly
- Agent + sub-agent chips appear
- Click a card → detail panel slides in with Team section (Dev row, Agent row with ›, Sub rows with ›)
- Click agent row in panel → drills into NodePanel showing agent info with ← Back
- Click ← Back → returns to Task Mode panel
- Filter by Status → grid updates in real time

- [ ] **Step 5: Commit**

```bash
git add src/lib/components/tickets/ src/routes/tickets/
git commit -m "feat: add Tickets route with TicketsGrid and TicketCard"
```

---

### Task 11: Cleanup and build verification

**Files:**
- Delete: `index.html` (after verification)

- [ ] **Step 1: Run full build to verify static output**

```bash
npm run build
```

Expected: build completes with no errors. Output in `build/` directory.

- [ ] **Step 2: Preview the static build**

```bash
npm run preview
```

Open `http://localhost:4173`. Verify both Board and Tickets routes work from the static build.

- [ ] **Step 3: Remove old index.html**

```bash
git rm index.html
```

- [ ] **Step 4: Final commit**

```bash
git add -A
git commit -m "feat: complete SvelteKit migration with Board and Tickets views"
```
