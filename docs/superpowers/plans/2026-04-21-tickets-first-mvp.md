# Tickets-First MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the generic sample data with real project tasks, remove the agent/sub-agent type system, hide the board view, and make the tickets view the default — with a live Claude AI indicator driven by the terminal plugin.

**Architecture:** The data model simplifies to tasks + developers only. Agent dispatch machinery is removed from `AppContext`. `computeVisibleNodes` is simplified to not require agent args. The board route stays but is unreachable from the nav; `/` redirects to `/tickets`. The AI active indicator already exists in `TicketsView` via `useClaudeSession` — no changes needed there.

**Tech Stack:** React 19, TypeScript 5.5, Vite 6, Supabase (real-time, already wired in `ClaudeSessionContext`)

---

## File Map

| File | Change |
|------|--------|
| `app/data/symphony-data.json` | Replace entirely — new tasks + Advaith Nair dev, no agents/subAgents |
| `app/types.ts` | Remove agent dispatch types; strip `agentId`, `agentAssigned`, `assigneeType` from `AppTask`; remove `type` from `FilterState`; remove `'agent'` from `PanelEntry.mode` |
| `app/agent/agentActions.ts` | Remove `assignTaskToAgent`, `reassignAgent`, `setSubAgentStatus`, `getTaskChain`; fix `assignTaskToDeveloper` to drop `assigneeType` |
| `app/data/appData.ts` | Drop agent/subAgent params from `computeVisibleNodes`; simplify `getRelatedNodeIds` and `buildTreeData` to task+dev only |
| `app/context/AppContext.tsx` | Remove agent state (`agents`, `subAgents`, dispatch machinery); update `AppContextType`; fix `loadProjectData`, `createProject`, `deleteProject` |
| `app/components/Header.tsx` | Remove Board nav tab; remove Type filter; fix `totalNodes` |
| `app/routes.tsx` | Redirect `/` to `/tickets` |

---

### Task 1: Replace sample data

**Files:**
- Modify: `app/data/symphony-data.json`

- [ ] **Step 1: Replace the JSON file contents**

Replace the entire file with:

```json
{
  "tasks": [
    {
      "id": "t1",
      "title": "Build Claude terminal plugin",
      "desc": "Claude Code hooks that write session events (phase, tool, task_id) to Supabase claude_events",
      "overview": "A Claude Code plugin installed via hooks that fires on PostToolUse and Stop events. Parses context to detect task ID from message tags, writes structured events to Supabase, and maintains local session state between hook invocations.",
      "status": "done",
      "priority": "critical",
      "dueDate": "2026-04-21",
      "developerId": "d1",
      "criteria": [
        "PostToolUse hook writes phase + summary to claude_events",
        "Stop hook writes ended event and clears local state",
        "Task ID parsed from #t1 or 'working on task t1' in messages",
        "Session state persisted between hook invocations via JSON file",
        "install.js registers hooks in Claude Code settings"
      ]
    },
    {
      "id": "t2",
      "title": "ClaudeStatusBar component",
      "desc": "Header bar showing live Claude session status — current phase, active task, and session duration",
      "overview": "Reads from ClaudeSessionContext (Supabase real-time) and renders a minimal status indicator in the app header. Shows the current phase (exploring, implementing, running, etc.) and which task Claude is working on.",
      "status": "progress",
      "priority": "high",
      "dueDate": "2026-04-22",
      "developerId": "d1",
      "criteria": [
        "Phase label updates in real-time from Supabase subscription",
        "Active task ID displayed when present",
        "Renders nothing when no active Claude session",
        "No layout shift when session starts or ends"
      ]
    },
    {
      "id": "t3",
      "title": "SessionLog view",
      "desc": "Dedicated /session route showing a chronological feed of all Claude events for the current session",
      "overview": "A scrollable timeline of claude_events rows — each entry shows the phase, tool used, summary, and timestamp. Grouped by session. Useful for reviewing what Claude did during a work session.",
      "status": "progress",
      "priority": "high",
      "dueDate": "2026-04-22",
      "developerId": "d1",
      "criteria": [
        "Events displayed in chronological order",
        "Phase shown as a colored badge",
        "Tool name and summary shown per event",
        "New events append in real-time without full reload"
      ]
    },
    {
      "id": "t4",
      "title": "Tickets-first MVP — hide board",
      "desc": "Make /tickets the default route, remove Board from nav, simplify data model to tasks + devs only",
      "overview": "The board view was useful for exploring the graph model but the MVP should focus on the tickets list. Remove agent/sub-agent nodes from the type system and data. Redirect / to /tickets. Keep the board route but remove it from navigation.",
      "status": "progress",
      "priority": "medium",
      "dueDate": "2026-04-21",
      "developerId": "d1",
      "criteria": [
        "/ redirects to /tickets",
        "Board tab removed from header nav",
        "Agent and sub-agent types removed from types.ts",
        "Sample data reflects actual project work",
        "App builds without TypeScript errors"
      ]
    },
    {
      "id": "t5",
      "title": "Redesign sample data",
      "desc": "Replace generic e-commerce tasks with tasks that reflect this actual project",
      "overview": "The sample data shipped with the app was a placeholder (auth refactor, checkout tests, CI/CD). Replace it with data that demonstrates the real product — a PM tool with Claude integration — so stakeholders immediately understand what they are looking at.",
      "status": "progress",
      "priority": "medium",
      "dueDate": "2026-04-21",
      "developerId": "d1",
      "criteria": [
        "All tasks reference real work on this project",
        "Single developer: Advaith Nair",
        "No agent or sub-agent nodes",
        "Statuses reflect actual current state"
      ]
    },
    {
      "id": "t6",
      "title": "Supabase real-time AI indicator",
      "desc": "Ticket cards show a live 'Claude active' badge when the plugin detects an active Claude session on that task",
      "overview": "ClaudeSessionContext subscribes to claude_events in Supabase and exposes activeTaskId. TicketsView already reads this and renders the badge — this task covers verifying the end-to-end flow works: tag a task in a Claude message, confirm the badge appears on that ticket card.",
      "status": "todo",
      "priority": "high",
      "dueDate": "2026-04-23",
      "developerId": "d1",
      "criteria": [
        "Tagging #t2 in Claude message activates badge on t2 ticket card",
        "Badge disappears when Claude session ends",
        "Works across browser tabs (real-time subscription)",
        "No badge shown when no active session"
      ]
    }
  ],

  "developers": [
    {
      "id": "d1",
      "name": "Advaith Nair",
      "initials": "AN",
      "role": "Full-stack — PM tooling & AI integrations",
      "desc": "Building Symphony PM — a Jira-style project tracker with a Claude Code plugin that watches developer activity in real-time and surfaces it in the UI.",
      "criteria": [
        "Feature code merged to Remake branch",
        "App builds without TypeScript errors",
        "Supabase schema matches plugin expectations",
        "Ticket moved to Done"
      ],
      "outputs": [
        "Merged pull requests",
        "Working Supabase integration",
        "Plugin hooks registered in Claude Code"
      ]
    }
  ]
}
```

- [ ] **Step 2: Clear stale localStorage so the app re-seeds**

Open the app in the browser, open DevTools → Application → Local Storage → `http://localhost:5173`, delete the key `symphony-project-default` (or clear all). This forces the app to reseed from the new JSON on next load.

- [ ] **Step 3: Verify the JSON is valid**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
node -e "JSON.parse(require('fs').readFileSync('app/data/symphony-data.json','utf8')); console.log('valid')"
```
Expected output: `valid`

- [ ] **Step 4: Commit**

```bash
git add app/data/symphony-data.json
git commit -m "data: replace sample data with real project tasks (Advaith Nair, t1-t6)"
```

---

### Task 2: Simplify types.ts

**Files:**
- Modify: `app/types.ts`

- [ ] **Step 1: Remove agent dispatch types and fix AppTask**

Replace the entire file with:

```typescript
export type NodeType = 'task' | 'developer';
export type StatusType = 'todo' | 'progress' | 'done' | 'blocked';
export type PriorityType = 'low' | 'medium' | 'high' | 'critical';

export interface AppTask {
  id: string;
  title: string;
  desc: string;
  status: StatusType;
  developerId: string;
  priority: PriorityType;
  dueDate?: string;
  overview?: string;
  criteria?: string[];
  isCustom?: boolean;
  blockerReason?: string;
  storyId?: string;
  storyPoints?: number;
  labels?: string[];
  estimateHours?: number;
}

export interface AppEpic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  priority: PriorityType;
  color: string;
  startDate?: string;
  targetDate?: string;
  createdAt?: string;
}

export interface AppStory {
  id: string;
  projectId: string;
  epicId?: string;
  title: string;
  description: string;
  status: StatusType;
  priority: PriorityType;
  storyPoints: number;
  assigneeId?: string;
  createdAt?: string;
}

export interface AppDeveloper {
  id: string;
  name: string;
  initials: string;
  role: string;
  desc?: string;
  criteria?: string[];
  outputs?: string[];
}

export interface AppAgent {
  id: string;
  name: string;
  type: string;
  developerId: string;
  desc?: string;
  criteria?: string[];
  outputs?: string[];
}

export interface AppSubAgent {
  id: string;
  name: string;
  type: string;
  parentId: string;
  desc?: string;
  criteria?: string[];
  outputs?: string[];
  status?: 'active' | 'idle';
}

export interface FilterState {
  dev: string;
  status: string;
  priority: string;
}

export interface PanelEntry {
  mode: 'task';
  id: string;
}

export interface BoardPosition {
  x: number;
  y: number;
}

export interface Edge {
  from: string;
  to: string;
  color: string;
  taskId?: string;
}

export interface VisibleNodes {
  tasks: AppTask[];
  devs: AppDeveloper[];
  agents: AppAgent[];
  subAgents: AppSubAgent[];
  edges: Edge[];
  taskColor: Record<string, string>;
}

export interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  level: number;
  children?: TreeNode[];
}

export interface AppSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  capacity: number;
  createdAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  projectId: string;
  author: string;
  authorType: 'user' | 'agent';
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  projectId: string;
  eventType: 'status_changed' | 'priority_changed' | 'assigned' | 'agent_action' | 'comment_added' | 'criteria_checked' | 'sprint_added' | 'blocker_set' | 'blocker_resolved';
  actor: string;
  actorType: 'user' | 'agent';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ClaudeEvent {
  id: string;
  session_id: string;
  phase: 'exploring' | 'implementing' | 'running' | 'debugging' | 'waiting' | 'communicating' | 'ended';
  tool_name: string | null;
  summary: string;
  task_id: string | null;
  created_at: string;
}
```

Note: `AppAgent` and `AppSubAgent` are kept as minimal stubs so `BoardView.tsx` (which still exists but is hidden) does not need changes.

- [ ] **Step 2: Check for TypeScript errors from type changes**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors referencing `agentId`, `assigneeType`, `filters.type` — these will be fixed in subsequent tasks.

- [ ] **Step 3: Commit**

```bash
git add app/types.ts
git commit -m "types: remove agent dispatch types, strip agentId/assigneeType from AppTask"
```

---

### Task 3: Simplify agentActions.ts

**Files:**
- Modify: `app/agent/agentActions.ts`

- [ ] **Step 1: Remove agent-specific functions and fix assignTaskToDeveloper**

Replace the entire file with:

```typescript
// app/agent/agentActions.ts
// Pure TypeScript — no React, no hooks, no AppContext imports.
// All functions accept state as arguments and return new state or derived data.

import {
  AppTask,
  AppDeveloper,
  StatusType,
  PriorityType,
} from '../types';

export function updateTaskStatus(
  tasks: AppTask[],
  taskId: string,
  status: StatusType,
  blockerReason?: string
): AppTask[] {
  return tasks.map((t) => {
    if (t.id !== taskId) return t;
    const updated: AppTask = { ...t, status };
    if (status === 'blocked' && blockerReason !== undefined) {
      updated.blockerReason = blockerReason;
    } else if (status !== 'blocked') {
      delete updated.blockerReason;
    }
    return updated;
  });
}

export function assignTaskToDeveloper(
  tasks: AppTask[],
  taskId: string,
  developerId: string
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, developerId } : t
  );
}

export function updateTaskPriority(
  tasks: AppTask[],
  taskId: string,
  priority: PriorityType
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, priority } : t
  );
}

export function updateTaskDueDate(
  tasks: AppTask[],
  taskId: string,
  dueDate: string
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, dueDate } : t
  );
}

export function getBlockedTasks(tasks: AppTask[]): AppTask[] {
  return tasks.filter((t) => t.status === 'blocked');
}

export function getOverdueTasks(tasks: AppTask[], today: string): AppTask[] {
  return tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
  );
}

export function getDeveloperWorkload(
  tasks: AppTask[],
  developerId: string
): { total: number; byStatus: Record<StatusType, number> } {
  const devTasks = tasks.filter((t) => t.developerId === developerId);
  const byStatus: Record<StatusType, number> = {
    todo: 0,
    progress: 0,
    done: 0,
    blocked: 0,
  };
  devTasks.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  });
  return { total: devTasks.length, byStatus };
}

export function getCriteriaCompletion(
  task: AppTask,
  checkedCriteria: Record<string, boolean>
): { checked: number; total: number; percent: number } {
  const criteria = task.criteria ?? [];
  const total = criteria.length;
  if (total === 0) return { checked: 0, total: 0, percent: 0 };
  const checked = criteria.filter((_, i) => checkedCriteria[`${task.id}-${i}`]).length;
  return { checked, total, percent: Math.round((checked / total) * 100) };
}
```

- [ ] **Step 2: Check TypeScript errors**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
npx tsc --noEmit 2>&1 | head -40
```

Expected: fewer errors now. Remaining errors will be in `AppContext.tsx` (still imports removed functions).

- [ ] **Step 3: Commit**

```bash
git add app/agent/agentActions.ts
git commit -m "agentActions: remove agent-specific functions, fix assignTaskToDeveloper"
```

---

### Task 4: Simplify appData.ts

**Files:**
- Modify: `app/data/appData.ts`

- [ ] **Step 1: Replace appData.ts**

Replace the entire file with:

```typescript
import {
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  FilterState,
  BoardPosition,
  VisibleNodes,
  Edge,
  TreeNode,
} from '../types';

const CHAIN_COLORS = [
  '#f59e0b',
  '#22d3ee',
  '#a78bfa',
  '#fb7185',
  '#4ade80',
  '#fb923c',
];

const NODE_H = 68;
const LANE_W = 320;
const GAP_Y = 48;
const H_PAD = 60;

export function computeVisibleNodes(
  filters: FilterState,
  tasks: AppTask[],
  developers: AppDeveloper[]
): VisibleNodes {
  let filteredTasks = tasks.filter((t) => {
    const dv = developers.find((d) => d.id === t.developerId);
    if (filters.dev && dv?.name !== filters.dev) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const devIds = new Set(filteredTasks.map((t) => t.developerId).filter(Boolean));
  const visibleDevs = developers.filter((d) => devIds.has(d.id));

  const edges: Edge[] = [];
  const taskColor: Record<string, string> = {};

  filteredTasks.forEach((task, idx) => {
    const color = CHAIN_COLORS[idx % CHAIN_COLORS.length];
    taskColor[task.id] = color;

    if (task.developerId) {
      edges.push({ from: task.id, to: task.developerId, color, taskId: task.id });
    }
  });

  return {
    tasks: filteredTasks,
    devs: visibleDevs,
    agents: [],
    subAgents: [],
    edges,
    taskColor,
  };
}

export function computeDefaultPositions(
  visible: VisibleNodes
): Record<string, BoardPosition> {
  const positions: Record<string, BoardPosition> = {};

  const groups = [
    { nodes: visible.tasks, depth: 0 },
    { nodes: visible.devs, depth: 1 },
  ];

  groups.forEach(({ nodes, depth }) => {
    const x = depth * LANE_W + H_PAD;
    nodes.forEach((node, i) => {
      positions[node.id] = { x, y: 100 + i * (NODE_H + GAP_Y) };
    });
  });

  return positions;
}

export function getRelatedNodeIds(nodeId: string, visible: VisibleNodes): Set<string> {
  const ids = new Set<string>([nodeId]);

  if (visible.tasks.find((t) => t.id === nodeId)) {
    const task = visible.tasks.find((t) => t.id === nodeId)!;
    ids.add(task.id);
    if (task.developerId) ids.add(task.developerId);
  } else if (visible.devs.find((d) => d.id === nodeId)) {
    visible.tasks
      .filter((t) => t.developerId === nodeId)
      .forEach((t) => {
        ids.add(t.id);
        if (t.developerId) ids.add(t.developerId);
      });
  }

  return ids;
}

export function buildTreeData(visible: VisibleNodes): TreeNode[] {
  const devMap = new Map(visible.devs.map((d) => [d.id, d]));

  return visible.tasks.map((task) => {
    const dev = devMap.get(task.developerId);
    const taskNode: TreeNode = {
      id: task.id,
      label: task.title,
      type: 'task',
      level: 0,
      children: dev
        ? [{ id: dev.id, label: dev.name, type: 'developer', level: 1 }]
        : [],
    };
    return taskNode;
  });
}
```

- [ ] **Step 2: Check TypeScript errors**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
npx tsc --noEmit 2>&1 | head -40
```

Expected: errors now concentrated in `AppContext.tsx` (still calls old `computeVisibleNodes` signature and references removed agent functions).

- [ ] **Step 3: Commit**

```bash
git add app/data/appData.ts
git commit -m "appData: simplify computeVisibleNodes/getRelatedNodeIds/buildTreeData to task+dev only"
```

---

### Task 5: Clean up AppContext.tsx

**Files:**
- Modify: `app/context/AppContext.tsx`

This is the largest change. The goal is to remove all agent dispatch state and fix the broken calls.

- [ ] **Step 1: Fix the imports at the top of AppContext.tsx**

Replace lines 1–46 (the import block) with:

```typescript
// app/context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import {
  FilterState,
  PanelEntry,
  BoardPosition,
  VisibleNodes,
  AppTask,
  AppDeveloper,
  AppEpic,
  AppStory,
  AppSprint,
  StatusType,
  PriorityType,
  TaskActivity,
} from '../types';
import { computeVisibleNodes, computeDefaultPositions } from '../data/appData';
import sampleData from '../data/symphony-data.json';
import {
  updateTaskStatus as _updateTaskStatus,
  assignTaskToDeveloper as _assignTaskToDeveloper,
  updateTaskPriority as _updateTaskPriority,
  updateTaskDueDate as _updateTaskDueDate,
  getBlockedTasks as _getBlockedTasks,
  getOverdueTasks as _getOverdueTasks,
  getDeveloperWorkload as _getDeveloperWorkload,
  getCriteriaCompletion as _getCriteriaCompletion,
} from '../agent/agentActions';
```

- [ ] **Step 2: Replace the AppContextType interface**

Replace the `interface AppContextType` block (lines 77–167) with:

```typescript
interface AppContextType {
  loading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  visible: VisibleNodes;
  allTasks: AppTask[];
  developers: AppDeveloper[];
  epics: AppEpic[];
  stories: AppStory[];
  addEpic: (epic: AppEpic) => void;
  updateEpic: (epic: AppEpic) => void;
  deleteEpic: (id: string) => void;
  addStory: (story: AppStory) => void;
  updateStory: (story: AppStory) => void;
  deleteStory: (id: string) => void;
  sprints: AppSprint[];
  activeSprint: AppSprint | undefined;
  sprintTaskIds: Record<string, string[]>;
  addSprint: (sprint: AppSprint) => void;
  updateSprint: (sprint: AppSprint) => void;
  deleteSprint: (id: string) => void;
  addTaskToSprint: (sprintId: string, taskId: string) => void;
  removeTaskFromSprint: (sprintId: string, taskId: string) => void;
  getSprintTasks: (sprintId: string) => AppTask[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  panelStack: PanelEntry[];
  openPanel: (e: PanelEntry) => void;
  closePanel: () => void;
  drillPanel: (e: PanelEntry) => void;
  panelBack: () => void;
  checkedCriteria: Record<string, boolean>;
  toggleCriterion: (key: string) => void;
  positions: Record<string, BoardPosition>;
  setPositions: (
    p:
      | Record<string, BoardPosition>
      | ((prev: Record<string, BoardPosition>) => Record<string, BoardPosition>)
  ) => void;
  resetLayout: () => void;
  panTarget: string | null;
  setPanTarget: (id: string | null) => void;
  addTask: (task: AppTask) => void;
  updateTask: (task: AppTask) => void;
  deleteTask: (id: string) => void;
  projects: Project[];
  activeProjectId: string;
  activeProject: Project | undefined;
  createProject: (name: string) => Promise<void>;
  switchProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => Promise<void>;
  dbError: string | null;
  updateTaskStatus: (taskId: string, status: StatusType, blockerReason?: string) => void;
  assignTaskToDeveloper: (taskId: string, developerId: string) => void;
  updateTaskPriority: (taskId: string, priority: PriorityType) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => void;
  getBlockedTasks: () => AppTask[];
  getOverdueTasks: () => AppTask[];
  getDeveloperWorkload: (developerId: string) => { total: number; byStatus: Record<StatusType, number> };
  getCriteriaCompletion: (taskId: string) => { checked: number; total: number; percent: number };
  emitActivity: (activity: Omit<TaskActivity, 'id' | 'createdAt'>) => void;
}
```

- [ ] **Step 3: Fix the state declarations in AppProvider**

Find and remove these state declarations (around lines 199–221):
```typescript
const [agents, setAgents] = useState<AppAgent[]>([]);
const [subAgents, setSubAgents] = useState<AppSubAgent[]>([]);
```
and:
```typescript
const [agentTouchedIds, setAgentTouchedIds] = useState<Set<string>>(new Set());
const [dispatches, setDispatches] = useState<Record<string, AgentDispatchState>>({});
const [persistedAgentActions] = useState<AgentAction[]>([]);
const [dismissedActionKeys] = useState<Set<string>>(new Set());
```

Also fix the `filters` initial state — remove the `type` field:
```typescript
const [filters, setFilters] = useState<FilterState>({
  dev: '',
  status: '',
  priority: '',
});
```

- [ ] **Step 4: Fix the `visible` useMemo**

Replace:
```typescript
const visible = useMemo(
  () => computeVisibleNodes(filters, allTasks, developers, agents, subAgents),
  [filters, allTasks, developers, agents, subAgents]
);
```
With:
```typescript
const visible = useMemo(
  () => computeVisibleNodes(filters, allTasks, developers),
  [filters, allTasks, developers]
);
```

- [ ] **Step 5: Fix `loadProjectData`**

Replace the `loadProjectData` function with:

```typescript
const loadProjectData = useCallback((projectId: string) => {
  const data = lsGet<{
    tasks: AppTask[];
    developers: AppDeveloper[];
    epics: AppEpic[];
    stories: AppStory[];
    sprints: AppSprint[];
    sprintTaskIds: Record<string, string[]>;
    checkedCriteria: Record<string, boolean>;
    positions: Record<string, BoardPosition>;
  }>(`symphony-project-${projectId}`, {
    tasks: [],
    developers: [],
    epics: [],
    stories: [],
    sprints: [],
    sprintTaskIds: {},
    checkedCriteria: {},
    positions: {},
  });

  const safeTasks = Array.isArray(data.tasks) ? data.tasks : [];
  const safeDevs = Array.isArray(data.developers) ? data.developers : [];
  const safeEpics = Array.isArray(data.epics) ? data.epics : [];
  const safeStories = Array.isArray(data.stories) ? data.stories : [];
  const safeSprints = Array.isArray(data.sprints) ? data.sprints : [];
  const safeSprintTaskIds = data.sprintTaskIds && typeof data.sprintTaskIds === 'object' ? data.sprintTaskIds : {};
  const safeChecked = data.checkedCriteria && typeof data.checkedCriteria === 'object' ? data.checkedCriteria : {};
  const safePositions = data.positions && typeof data.positions === 'object' ? data.positions : {};

  const isEmpty = safeTasks.length === 0 && safeDevs.length === 0;
  const tasks = isEmpty ? (sampleData.tasks as AppTask[]) : safeTasks;
  const developers = isEmpty ? (sampleData.developers as AppDeveloper[]) : safeDevs;

  setTasks(tasks);
  setDevelopers(developers);
  setEpics(safeEpics);
  setStories(safeStories);
  setSprints(safeSprints);
  setSprintTaskIds(safeSprintTaskIds);
  setCheckedCriteria(safeChecked);

  if (Object.keys(safePositions).length === 0) {
    const defaultVisible = computeVisibleNodes(
      { dev: '', status: '', priority: '' },
      tasks, developers
    );
    setPositionsState(computeDefaultPositions(defaultVisible));
  } else {
    setPositionsState(safePositions);
  }
}, []);
```

- [ ] **Step 6: Fix `createProject` and `deleteProject`**

In `createProject`, remove:
```typescript
setAgents([]);
setSubAgents([]);
```

In `deleteProject`, remove:
```typescript
setAgents([]);
setSubAgents([]);
```

- [ ] **Step 7: Remove agent-specific callbacks**

Remove these callback functions entirely:
- `reassignAgent`
- `setSubAgentStatus`
- `getTaskChain`
- `markAgentTouched`
- `dispatch`
- `updateDispatch`
- `clearDispatch`
- `getTaskDispatches`

- [ ] **Step 8: Fix the context value object**

In the `value: AppContextType = { ... }` object, remove these keys:
- `agents`
- `subAgents`
- `assignTaskToAgent`
- `reassignAgent`
- `setSubAgentStatus`
- `getTaskChain`
- `agentTouchedIds`
- `markAgentTouched`
- `dispatches`
- `dispatch`
- `updateDispatch`
- `clearDispatch`
- `getTaskDispatches`
- `persistedAgentActions`
- `dismissedActionKeys`

- [ ] **Step 9: Verify build passes**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
npx tsc --noEmit 2>&1 | head -60
```

Expected: errors now limited to `Header.tsx` (references `agents`, `filters.type`, board nav) and any other files that reference removed context fields. Fix any unexpected errors before committing.

- [ ] **Step 10: Commit**

```bash
git add app/context/AppContext.tsx
git commit -m "AppContext: remove agent dispatch state and methods, simplify to task+dev model"
```

---

### Task 6: Update Header.tsx

**Files:**
- Modify: `app/components/Header.tsx`

- [ ] **Step 1: Remove Board nav tab, Type filter, and fix totalNodes**

Make these targeted changes to `Header.tsx`:

**Remove** the Board nav button (the `<button onClick={() => navigate('/')}>Board</button>` block).

**Remove** the Type filter `<FilterSelect label="Type" .../>` block.

**Fix** the `agents` reference — remove `agents` from the `useApp()` destructure:
```typescript
const { filters, setFilters, visible, resetLayout, developers } = useApp();
```

**Remove** `agentTypes` variable:
```typescript
// Delete this line:
const agentTypes = ['', ...new Set(agents.map((a) => a.type))];
```

**Fix** `totalNodes` to not reference agents/subAgents:
```typescript
const totalNodes = visible.tasks.length + visible.devs.length;
```

**Fix** `handleFilterChange` calls — remove any reference to `'type'` key. The remaining filters are `dev`, `status`, `priority`.

- [ ] **Step 2: Verify build**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
npx tsc --noEmit 2>&1 | head -40
```

Expected: zero TypeScript errors (or only errors from unrelated files not touched in this plan).

- [ ] **Step 3: Commit**

```bash
git add app/components/Header.tsx
git commit -m "Header: remove Board nav tab and Type filter"
```

---

### Task 7: Redirect / to /tickets

**Files:**
- Modify: `app/routes.tsx`

- [ ] **Step 1: Change the index route**

Replace `app/routes.tsx` with:

```typescript
import { createBrowserRouter, Navigate } from "react-router";
import { Root } from "./components/Root";
import { BoardView } from "./components/BoardView";
import { TicketsView } from "./components/TicketsView";
import { BacklogView } from "./components/BacklogView";
import { SprintView } from "./components/SprintView";
import { SessionLog } from "./components/SessionLog";

export const router = createBrowserRouter([
  {
    path: "/",
    Component: Root,
    children: [
      { index: true, element: <Navigate to="/tickets" replace /> },
      { path: "board", Component: BoardView },
      { path: "tickets", Component: TicketsView },
      { path: "backlog", Component: BacklogView },
      { path: "sprint", Component: SprintView },
      { path: "session", Component: SessionLog },
    ],
  },
]);
```

- [ ] **Step 2: Final build check**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project
npx tsc --noEmit && echo "TypeScript OK"
```

Expected: `TypeScript OK`

- [ ] **Step 3: Run the dev server and verify**

```bash
npm run dev
```

- Open `http://localhost:5173` — should redirect to `/tickets`
- Tickets view should show 6 tasks assigned to Advaith Nair
- No Board tab in the header nav
- No Type filter dropdown
- Claude active badge appears when plugin tags a task (test by sending a message with `#t2`)

- [ ] **Step 4: Commit**

```bash
git add app/routes.tsx
git commit -m "routes: redirect / to /tickets, add explicit /board path"
```
