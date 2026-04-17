# Supabase Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace all localStorage persistence with Supabase, making every project's data (tasks, developers, agents, sub-agents, board positions, checked criteria) live in a cloud database.

**Architecture:** A thin Supabase client singleton feeds a `db.ts` data-access layer. `AppContext` calls `db.ts` for all reads and writes; React state remains the source of truth for the UI. Write operations optimistically update state then fire async Supabase calls — the UI never awaits them.

**Tech Stack:** React 19, TypeScript 5.5, Vite 6, `@supabase/supabase-js` v2, `dotenv` + `tsx` (seed script only)

---

## File Map

| Action | Path | Responsibility |
|--------|------|----------------|
| Create | `app/utils/supabase.ts` | Singleton Supabase client |
| Create | `app/data/db.ts` | All Supabase query functions + row→type mappers |
| Create | `scripts/seed.ts` | One-time seeder for `symphony-data.json` |
| Modify | `app/data/appData.ts` | Remove static data exports; update `computeVisibleNodes` signature |
| Modify | `app/context/AppContext.tsx` | Full refactor: localStorage → db.ts; add `loading` state |
| Modify | `app/components/Root.tsx` | Gate render on `loading` from context |
| SQL (manual) | Run in Supabase dashboard | Create all 7 tables |

---

## Task 1: Create the Supabase schema

**Files:**
- SQL to run in Supabase SQL Editor (no file to create)

- [ ] **Step 1: Open the Supabase SQL Editor**

Go to your project at https://supabase.com → SQL Editor → New Query.

- [ ] **Step 2: Paste and run the following SQL**

```sql
-- Projects
CREATE TABLE projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Developers
CREATE TABLE developers (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  id         text NOT NULL,
  name       text NOT NULL,
  initials   text NOT NULL,
  role       text NOT NULL,
  description text NOT NULL DEFAULT '',
  criteria   text[] NOT NULL DEFAULT '{}',
  outputs    text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id)
);

-- Agents
CREATE TABLE agents (
  project_id   uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  id           text NOT NULL,
  developer_id text NOT NULL,
  name         text NOT NULL,
  type         text NOT NULL,
  description  text NOT NULL DEFAULT '',
  criteria     text[] NOT NULL DEFAULT '{}',
  outputs      text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id, developer_id) REFERENCES developers(project_id, id)
);

-- Sub-agents
CREATE TABLE sub_agents (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  id         text NOT NULL,
  parent_id  text NOT NULL,
  name       text NOT NULL,
  type       text NOT NULL,
  description text NOT NULL DEFAULT '',
  criteria   text[] NOT NULL DEFAULT '{}',
  outputs    text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id, parent_id) REFERENCES agents(project_id, id)
);

-- Tasks (developer_id / agent_id have no FK — tasks can be agent-only)
CREATE TABLE tasks (
  project_id     uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  id             text NOT NULL,
  title          text NOT NULL,
  description    text NOT NULL DEFAULT '',
  overview       text NOT NULL DEFAULT '',
  status         text NOT NULL,
  priority       text NOT NULL,
  due_date       date,
  developer_id   text,
  agent_id       text,
  assignee_type  text NOT NULL,
  agent_assigned bool NOT NULL DEFAULT false,
  is_custom      bool NOT NULL DEFAULT false,
  criteria       text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id)
);

-- Board positions
CREATE TABLE board_positions (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  node_id    text NOT NULL,
  x          float NOT NULL,
  y          float NOT NULL,
  PRIMARY KEY (project_id, node_id)
);

-- Checked criteria
CREATE TABLE checked_criteria (
  project_id uuid NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  key        text NOT NULL,
  checked    bool NOT NULL DEFAULT false,
  PRIMARY KEY (project_id, key)
);
```

- [ ] **Step 3: Verify tables exist**

In Supabase → Table Editor, confirm all 7 tables appear: `projects`, `developers`, `agents`, `sub_agents`, `tasks`, `board_positions`, `checked_criteria`.

- [ ] **Step 4: Commit**

```bash
git add -A
git commit -m "docs: add supabase integration plan"
```

---

## Task 2: Create the Supabase client singleton

**Files:**
- Create: `app/utils/supabase.ts`

- [ ] **Step 1: Create the file**

```typescript
// app/utils/supabase.ts
import { createClient } from '@supabase/supabase-js';

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL as string,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string
);
```

- [ ] **Step 2: Verify the build still passes**

```bash
npm run build
```

Expected: build succeeds with no TypeScript errors.

- [ ] **Step 3: Commit**

```bash
git add app/utils/supabase.ts
git commit -m "feat: add supabase client singleton"
```

---

## Task 3: Update `computeVisibleNodes` to accept data as parameters

The current `computeVisibleNodes` reads `DEVELOPERS`, `AGENTS`, `SUB_AGENTS` from module-level constants. Since those constants are being removed, the function must receive them as parameters instead.

**Files:**
- Modify: `app/data/appData.ts`

- [ ] **Step 1: Update the `computeVisibleNodes` signature and body**

Replace the entire `computeVisibleNodes` function (lines 36–131 in the current file) with:

```typescript
export function computeVisibleNodes(
  filters: FilterState,
  tasks: AppTask[],
  developers: AppDeveloper[],
  agents: AppAgent[],
  subAgents: AppSubAgent[]
): VisibleNodes {
  // Filter tasks
  let filteredTasks = tasks.filter((t) => {
    const ag = agents.find((a) => a.id === t.agentId);
    const dv = developers.find((d) => d.id === t.developerId);
    if (filters.dev && dv?.name !== filters.dev) return false;
    if (filters.type && ag?.type !== filters.type) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  // Derive visible devs/agents/subagents
  const devTasks = filteredTasks.filter(
    (t) => t.assigneeType === 'dev' && t.developerId
  );
  const agentTasks = filteredTasks.filter(
    (t) => t.assigneeType === 'agent' && t.agentId
  );
  const devAgentTasks = devTasks.filter((t) => t.agentAssigned && t.agentId);

  const devIds = new Set(devTasks.map((t) => t.developerId));
  const agentIds = new Set([
    ...agentTasks.map((t) => t.agentId),
    ...devAgentTasks.map((t) => t.agentId),
  ]);

  const visibleDevs = developers.filter((d) => devIds.has(d.id));
  const visibleAgents = agents.filter((a) => agentIds.has(a.id));

  const agentsWithSubs = visibleAgents.slice(0, 2).map((a) => a.id);
  const visibleSubAgents = subAgents.filter((sa) =>
    agentsWithSubs.includes(sa.parentId)
  );

  // Build edges and task colors
  const edges: Edge[] = [];
  const taskColor: Record<string, string> = {};

  filteredTasks.forEach((task, idx) => {
    const color = CHAIN_COLORS[idx % CHAIN_COLORS.length];
    taskColor[task.id] = color;

    if (task.developerId) {
      edges.push({ from: task.id, to: task.developerId, color, taskId: task.id });
    }

    if (task.assigneeType === 'agent' && task.agentId) {
      edges.push({ from: task.id, to: task.agentId, color, taskId: task.id });
    }

    if (task.assigneeType === 'dev' && task.agentId && task.agentAssigned) {
      edges.push({ from: task.developerId, to: task.agentId, color, taskId: task.id });
    }
  });

  visibleAgents.forEach((agent) => {
    const subs = visibleSubAgents.filter((sa) => sa.parentId === agent.id);
    subs.forEach((sa) => {
      edges.push({ from: agent.id, to: sa.id, color: 'rgba(167,139,250,0.5)' });
    });
  });

  return {
    tasks: filteredTasks,
    devs: visibleDevs,
    agents: visibleAgents,
    subAgents: visibleSubAgents,
    edges,
    taskColor,
  };
}
```

- [ ] **Step 2: Remove the static data exports and JSON import**

Remove these lines from the top of `appData.ts`:

```typescript
import rawData from './symphony-data.json';

// All board data is loaded from symphony-data.json — edit that file to add nodes.
export const TASKS: AppTask[] = rawData.tasks as AppTask[];
export const DEVELOPERS: AppDeveloper[] = rawData.developers as AppDeveloper[];
export const AGENTS: AppAgent[] = rawData.agents as AppAgent[];
export const SUB_AGENTS: AppSubAgent[] = rawData.subAgents as AppSubAgent[];
```

Also remove the `CHAIN_COLORS` constant is still needed — keep it. The full top of the file after this step should be:

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

const NODE_W = 220;
const NODE_H = 68;
const LANE_W = 320;
const GAP_Y = 48;
const H_PAD = 60;
const BOARD_H = 4000;
```

- [ ] **Step 3: Verify the build**

```bash
npm run build
```

Expected: TypeScript errors referencing `TASKS`, `DEVELOPERS`, `AGENTS`, `SUB_AGENTS`, or the old `computeVisibleNodes` signature — this is expected. The errors will be fixed in the next tasks.

- [ ] **Step 4: Commit**

```bash
git add app/data/appData.ts
git commit -m "refactor: update computeVisibleNodes to accept data as params"
```

---

## Task 4: Create `app/data/db.ts`

All Supabase queries live here. `AppContext` imports from here — nothing else in the app imports from `@supabase/supabase-js` directly.

**Files:**
- Create: `app/data/db.ts`

- [ ] **Step 1: Create the file with row types, mappers, and all query functions**

```typescript
// app/data/db.ts
import { supabase } from '../utils/supabase';
import {
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  BoardPosition,
} from '../types';
import type { Project } from '../context/AppContext';

// ── Row types (Supabase snake_case columns) ───────────────────────────────────

interface TaskRow {
  id: string;
  title: string;
  description: string;
  overview: string;
  status: string;
  priority: string;
  due_date: string | null;
  developer_id: string | null;
  agent_id: string | null;
  assignee_type: string;
  agent_assigned: boolean;
  is_custom: boolean;
  criteria: string[];
}

interface DeveloperRow {
  id: string;
  name: string;
  initials: string;
  role: string;
  description: string;
  criteria: string[];
  outputs: string[];
}

interface AgentRow {
  id: string;
  name: string;
  type: string;
  developer_id: string;
  description: string;
  criteria: string[];
  outputs: string[];
}

interface SubAgentRow {
  id: string;
  name: string;
  type: string;
  parent_id: string;
  description: string;
  criteria: string[];
  outputs: string[];
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToTask(r: TaskRow): AppTask {
  return {
    id: r.id,
    title: r.title,
    desc: r.description,
    overview: r.overview,
    status: r.status as AppTask['status'],
    priority: r.priority as AppTask['priority'],
    dueDate: r.due_date ?? undefined,
    developerId: r.developer_id ?? '',
    agentId: r.agent_id ?? undefined,
    assigneeType: r.assignee_type as AppTask['assigneeType'],
    agentAssigned: r.agent_assigned,
    criteria: r.criteria,
  };
}

function rowToDeveloper(r: DeveloperRow): AppDeveloper {
  return {
    id: r.id,
    name: r.name,
    initials: r.initials,
    role: r.role,
    desc: r.description,
    criteria: r.criteria,
    outputs: r.outputs,
  };
}

function rowToAgent(r: AgentRow): AppAgent {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    developerId: r.developer_id,
    desc: r.description,
    criteria: r.criteria,
    outputs: r.outputs,
  };
}

function rowToSubAgent(r: SubAgentRow): AppSubAgent {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    parentId: r.parent_id,
    desc: r.description,
    criteria: r.criteria,
    outputs: r.outputs,
  };
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
  }));
}

export async function createProjectInDB(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name: name.trim() || 'New Project' })
    .select('id, name, created_at')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, createdAt: data.created_at };
}

export async function renameProjectInDB(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ name: name.trim() })
    .eq('id', id);
  if (error) throw error;
}

// ── Project data (full fetch) ─────────────────────────────────────────────────

export interface ProjectData {
  tasks: AppTask[];
  developers: AppDeveloper[];
  agents: AppAgent[];
  subAgents: AppSubAgent[];
  positions: Record<string, BoardPosition>;
  checkedCriteria: Record<string, boolean>;
}

export async function fetchProjectData(projectId: string): Promise<ProjectData> {
  const [tasksRes, devsRes, agentsRes, subAgentsRes, positionsRes, criteriaRes] =
    await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', projectId),
      supabase.from('developers').select('*').eq('project_id', projectId),
      supabase.from('agents').select('*').eq('project_id', projectId),
      supabase.from('sub_agents').select('*').eq('project_id', projectId),
      supabase.from('board_positions').select('*').eq('project_id', projectId),
      supabase.from('checked_criteria').select('*').eq('project_id', projectId),
    ]);

  if (tasksRes.error) throw tasksRes.error;
  if (devsRes.error) throw devsRes.error;
  if (agentsRes.error) throw agentsRes.error;
  if (subAgentsRes.error) throw subAgentsRes.error;
  if (positionsRes.error) throw positionsRes.error;
  if (criteriaRes.error) throw criteriaRes.error;

  const positions: Record<string, BoardPosition> = {};
  for (const r of positionsRes.data ?? []) {
    positions[r.node_id] = { x: r.x, y: r.y };
  }

  const checkedCriteria: Record<string, boolean> = {};
  for (const r of criteriaRes.data ?? []) {
    checkedCriteria[r.key] = r.checked;
  }

  return {
    tasks: (tasksRes.data ?? []).map((r) => rowToTask(r as TaskRow)),
    developers: (devsRes.data ?? []).map((r) => rowToDeveloper(r as DeveloperRow)),
    agents: (agentsRes.data ?? []).map((r) => rowToAgent(r as AgentRow)),
    subAgents: (subAgentsRes.data ?? []).map((r) => rowToSubAgent(r as SubAgentRow)),
    positions,
    checkedCriteria,
  };
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function upsertTask(
  projectId: string,
  task: AppTask,
  isCustom = false
): Promise<void> {
  const { error } = await supabase.from('tasks').upsert({
    project_id: projectId,
    id: task.id,
    title: task.title,
    description: task.desc,
    overview: task.overview ?? '',
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate ?? null,
    developer_id: task.developerId || null,
    agent_id: task.agentId ?? null,
    assignee_type: task.assigneeType,
    agent_assigned: task.agentAssigned ?? false,
    is_custom: isCustom,
    criteria: task.criteria ?? [],
  });
  if (error) throw error;
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId)
    .eq('id', taskId);
  if (error) throw error;
}

// ── Board positions ───────────────────────────────────────────────────────────

export async function upsertPositions(
  projectId: string,
  positions: Record<string, BoardPosition>
): Promise<void> {
  const rows = Object.entries(positions).map(([nodeId, pos]) => ({
    project_id: projectId,
    node_id: nodeId,
    x: pos.x,
    y: pos.y,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('board_positions').upsert(rows);
  if (error) throw error;
}

// ── Checked criteria ──────────────────────────────────────────────────────────

export async function upsertCheckedCriterion(
  projectId: string,
  key: string,
  checked: boolean
): Promise<void> {
  const { error } = await supabase.from('checked_criteria').upsert({
    project_id: projectId,
    key,
    checked,
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: `db.ts` compiles cleanly. Errors from `AppContext.tsx` still referencing removed exports are expected — fixed in Task 5.

- [ ] **Step 3: Commit**

```bash
git add app/data/db.ts
git commit -m "feat: add supabase data access layer"
```

---

## Task 5: Rewrite `AppContext.tsx`

This is the largest change. The entire context is rewritten to load from and write to Supabase via `db.ts`. localStorage is completely removed.

**Files:**
- Modify: `app/context/AppContext.tsx`

- [ ] **Step 1: Replace the entire file content**

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
  AppAgent,
  AppSubAgent,
} from '../types';
import { computeVisibleNodes, computeDefaultPositions } from '../data/appData';
import {
  fetchProjects,
  fetchProjectData,
  createProjectInDB,
  renameProjectInDB,
  upsertTask,
  deleteTask as deleteTaskInDB,
  upsertPositions,
  upsertCheckedCriterion,
} from '../data/db';

// ── Project type ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

// ── Context type ──────────────────────────────────────────────────────────────

interface AppContextType {
  loading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  visible: VisibleNodes;
  allTasks: AppTask[];
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
  createProject: (name: string) => void;
  switchProject: (id: string) => void;
  renameProject: (id: string, name: string) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);

  // ── Project state ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const projectIdRef = useRef('');

  // ── Board data ─────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [developers, setDevelopers] = useState<AppDeveloper[]>([]);
  const [agents, setAgents] = useState<AppAgent[]>([]);
  const [subAgents, setSubAgents] = useState<AppSubAgent[]>([]);
  const [positions, setPositionsState] = useState<Record<string, BoardPosition>>({});
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  // ── UI state ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    dev: '',
    type: '',
    status: '',
    priority: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelStack, setPanelStack] = useState<PanelEntry[]>([]);
  const [panTarget, setPanTarget] = useState<string | null>(null);

  // Debounce ref for position saves
  const posDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allTasks = tasks;

  const visible = useMemo(
    () => computeVisibleNodes(filters, allTasks, developers, agents, subAgents),
    [filters, allTasks, developers, agents, subAgents]
  );

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const allProjects = await fetchProjects();
        setProjects(allProjects);

        if (allProjects.length === 0) {
          setLoading(false);
          return;
        }

        const firstId = allProjects[0].id;
        projectIdRef.current = firstId;
        setActiveProjectId(firstId);

        const data = await fetchProjectData(firstId);
        setTasks(data.tasks);
        setDevelopers(data.developers);
        setAgents(data.agents);
        setSubAgents(data.subAgents);
        setCheckedCriteria(data.checkedCriteria);

        // Compute default positions if none saved yet
        if (Object.keys(data.positions).length === 0) {
          const defaultVisible = computeVisibleNodes(
            { dev: '', type: '', status: '', priority: '' },
            data.tasks,
            data.developers,
            data.agents,
            data.subAgents
          );
          setPositionsState(computeDefaultPositions(defaultVisible));
        } else {
          setPositionsState(data.positions);
        }
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, []);

  // ── setPositions with debounced DB write ───────────────────────────────────
  const setPositions = useCallback(
    (
      p:
        | Record<string, BoardPosition>
        | ((prev: Record<string, BoardPosition>) => Record<string, BoardPosition>)
    ) => {
      setPositionsState((prev) => {
        const next = typeof p === 'function' ? p(prev) : p;
        // Debounce writes to DB (500ms)
        if (posDebounceRef.current) clearTimeout(posDebounceRef.current);
        posDebounceRef.current = setTimeout(() => {
          upsertPositions(projectIdRef.current, next).catch(console.error);
        }, 500);
        return next;
      });
    },
    []
  );

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const toggleCriterion = useCallback((key: string) => {
    setCheckedCriteria((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      upsertCheckedCriterion(projectIdRef.current, key, next[key]).catch(console.error);
      return next;
    });
  }, []);

  const openPanel = useCallback((entry: PanelEntry) => {
    setPanelStack([entry]);
  }, []);

  const closePanel = useCallback(() => {
    setPanelStack([]);
  }, []);

  const drillPanel = useCallback((entry: PanelEntry) => {
    setPanelStack((prev) => [...prev, entry]);
  }, []);

  const panelBack = useCallback(() => {
    setPanelStack((prev) => prev.slice(0, -1));
  }, []);

  const resetLayout = useCallback(() => {
    const defaultPos = computeDefaultPositions(visible);
    setPositions(defaultPos);
  }, [visible, setPositions]);

  const addTask = useCallback((task: AppTask) => {
    setTasks((prev) => [...prev, task]);
    setPositions((prev) => {
      const taskYs = Object.entries(prev)
        .filter(([id]) => id.startsWith('t'))
        .map(([, pos]) => pos.y);
      const bottomY = taskYs.length > 0 ? Math.max(...taskYs) + 116 : 100;
      return { ...prev, [task.id]: { x: 60, y: bottomY } };
    });
    upsertTask(projectIdRef.current, task, true).catch(console.error);
  }, [setPositions]);

  const updateTask = useCallback((updated: AppTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    upsertTask(projectIdRef.current, updated, true).catch(console.error);
  }, []);

  const deleteTask = useCallback((id: string) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setPositions((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setPanelStack([]);
    setSelectedId(null);
    deleteTaskInDB(projectIdRef.current, id).catch(console.error);
  }, [setPositions]);

  // ── Project management ─────────────────────────────────────────────────────
  const loadProject = useCallback(async (id: string) => {
    setLoading(true);
    try {
      const data = await fetchProjectData(id);
      setTasks(data.tasks);
      setDevelopers(data.developers);
      setAgents(data.agents);
      setSubAgents(data.subAgents);
      setCheckedCriteria(data.checkedCriteria);

      if (Object.keys(data.positions).length === 0) {
        const defaultVisible = computeVisibleNodes(
          { dev: '', type: '', status: '', priority: '' },
          data.tasks,
          data.developers,
          data.agents,
          data.subAgents
        );
        setPositionsState(computeDefaultPositions(defaultVisible));
      } else {
        setPositionsState(data.positions);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const switchProject = useCallback(
    async (id: string) => {
      if (id === projectIdRef.current) return;
      setSelectedId(null);
      setPanelStack([]);
      setPanTarget(null);
      setFilters({ dev: '', type: '', status: '', priority: '' });
      projectIdRef.current = id;
      setActiveProjectId(id);
      await loadProject(id);
    },
    [loadProject]
  );

  const createProject = useCallback(
    async (name: string) => {
      const newProject = await createProjectInDB(name);
      setProjects((prev) => [...prev, newProject]);
      projectIdRef.current = newProject.id;
      setActiveProjectId(newProject.id);
      // New project starts blank
      setTasks([]);
      setDevelopers([]);
      setAgents([]);
      setSubAgents([]);
      setPositionsState({});
      setCheckedCriteria({});
    },
    []
  );

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
    );
    renameProjectInDB(id, name).catch(console.error);
  }, []);

  // ── Context value ──────────────────────────────────────────────────────────
  const activeProject = projects.find((p) => p.id === activeProjectId);

  const value: AppContextType = {
    loading,
    filters,
    setFilters,
    visible,
    allTasks,
    selectedId,
    setSelectedId,
    panelStack,
    openPanel,
    closePanel,
    drillPanel,
    panelBack,
    checkedCriteria,
    toggleCriterion,
    positions,
    setPositions,
    resetLayout,
    panTarget,
    setPanTarget,
    addTask,
    updateTask,
    deleteTask,
    projects,
    activeProjectId,
    activeProject,
    createProject,
    switchProject,
    renameProject,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: build succeeds. If there are TypeScript errors about `TASKS` still being imported somewhere else, search for remaining references:

```bash
grep -r "from '../data/appData'" app/
```

Fix any remaining callers that still reference `TASKS`, `DEVELOPERS`, `AGENTS`, or `SUB_AGENTS`.

- [ ] **Step 3: Commit**

```bash
git add app/context/AppContext.tsx
git commit -m "feat: replace localStorage with supabase in AppContext"
```

---

## Task 6: Update `Root.tsx` to gate on Supabase loading state

The current `Root.tsx` uses a 1200ms timer for the splash. After this change, the splash shows until both the timer has elapsed AND Supabase data has loaded (whichever is longer).

**Files:**
- Modify: `app/components/Root.tsx`

- [ ] **Step 1: Update `RootContent`**

Replace the `RootContent` function with:

```typescript
function RootContent() {
  const { panelStack, closePanel, loading: dataLoading } = useApp();
  const [timerDone, setTimerDone] = useState(false);

  useKeyboardShortcuts(() => {
    if (panelStack.length > 0) {
      closePanel();
    }
  });

  useEffect(() => {
    const timer = setTimeout(() => setTimerDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const showSplash = !timerDone || dataLoading;

  return (
    <>
      {showSplash && <LoadingSplash />}

      <div className="h-screen w-screen overflow-hidden relative">
        {/* Radial gradient background */}
        <div className="absolute inset-0 bg-[#08111f]">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_#1e3a5f_0%,_transparent_50%)] opacity-20" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_#2d1b4e_0%,_transparent_50%)] opacity-15" />

          {/* CSS grid overlay */}
          <div
            className="absolute inset-0 opacity-[0.015]"
            style={{
              backgroundImage: `
                linear-gradient(rgba(148, 163, 184, 0.5) 1px, transparent 1px),
                linear-gradient(90deg, rgba(148, 163, 184, 0.5) 1px, transparent 1px)
              `,
              backgroundSize: '32px 32px',
            }}
          />
        </div>

        {/* Main content */}
        <div className="relative h-full flex flex-col">
          <Header />

          <div className="flex-1 flex overflow-hidden">
            <Sidebar />

            <main className="flex-1 overflow-hidden">
              <Outlet context={{}} />
            </main>
          </div>
        </div>

        {/* Detail panel */}
        {panelStack.length > 0 && <DetailPanel />}
      </div>
    </>
  );
}
```

- [ ] **Step 2: Verify the build**

```bash
npm run build
```

Expected: clean build.

- [ ] **Step 3: Commit**

```bash
git add app/components/Root.tsx
git commit -m "feat: gate app render on supabase data loading"
```

---

## Task 7: Create and run the seed script

This script reads `symphony-data.json` and inserts it as the "My Project" project in Supabase. It's idempotent — run it as many times as needed.

**Files:**
- Create: `scripts/seed.ts`

- [ ] **Step 1: Install seed dependencies**

```bash
npm install --save-dev dotenv tsx
```

- [ ] **Step 2: Create the `scripts/` directory**

```bash
mkdir -p scripts
```

- [ ] **Step 3: Create `scripts/seed.ts`**

```typescript
// scripts/seed.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rawData = JSON.parse(
  readFileSync(join(__dirname, '../app/data/symphony-data.json'), 'utf-8')
) as {
  tasks: Array<{
    id: string; title: string; description: string; overview: string;
    status: string; priority: string; dueDate?: string;
    developerId: string; agentId?: string; assigneeType: string;
    agentAssigned?: boolean; criteria?: string[];
  }>;
  developers: Array<{
    id: string; name: string; initials: string; role: string;
    desc?: string; criteria?: string[]; outputs?: string[];
  }>;
  agents: Array<{
    id: string; name: string; type: string; developerId: string;
    desc?: string; criteria?: string[]; outputs?: string[];
  }>;
  subAgents: Array<{
    id: string; name: string; type: string; parentId: string;
    desc?: string; criteria?: string[]; outputs?: string[];
  }>;
};

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_PUBLISHABLE_KEY!
);

async function seed() {
  console.log('Seeding Supabase...');

  // 1. Create the project (or find existing one named "My Project")
  let projectId: string;

  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('name', 'My Project')
    .maybeSingle();

  if (existing) {
    projectId = existing.id;
    console.log(`Using existing project: ${projectId}`);
  } else {
    const { data: created, error } = await supabase
      .from('projects')
      .insert({ name: 'My Project' })
      .select('id')
      .single();
    if (error) throw error;
    projectId = created.id;
    console.log(`Created project: ${projectId}`);
  }

  // 2. Seed developers
  const developers = rawData.developers.map((d) => ({
    project_id: projectId,
    id: d.id,
    name: d.name,
    initials: d.initials,
    role: d.role,
    description: d.desc ?? '',
    criteria: d.criteria ?? [],
    outputs: d.outputs ?? [],
  }));
  const { error: devErr } = await supabase
    .from('developers')
    .upsert(developers, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (devErr) throw devErr;
  console.log(`Seeded ${developers.length} developers`);

  // 3. Seed agents
  const agents = rawData.agents.map((a) => ({
    project_id: projectId,
    id: a.id,
    developer_id: a.developerId,
    name: a.name,
    type: a.type,
    description: a.desc ?? '',
    criteria: a.criteria ?? [],
    outputs: a.outputs ?? [],
  }));
  const { error: agentErr } = await supabase
    .from('agents')
    .upsert(agents, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (agentErr) throw agentErr;
  console.log(`Seeded ${agents.length} agents`);

  // 4. Seed sub-agents
  const subAgents = rawData.subAgents.map((sa) => ({
    project_id: projectId,
    id: sa.id,
    parent_id: sa.parentId,
    name: sa.name,
    type: sa.type,
    description: sa.desc ?? '',
    criteria: sa.criteria ?? [],
    outputs: sa.outputs ?? [],
  }));
  const { error: subErr } = await supabase
    .from('sub_agents')
    .upsert(subAgents, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (subErr) throw subErr;
  console.log(`Seeded ${subAgents.length} sub-agents`);

  // 5. Seed tasks
  const tasks = rawData.tasks.map((t) => ({
    project_id: projectId,
    id: t.id,
    title: t.title,
    description: t.desc,
    overview: t.overview,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate ?? null,
    developer_id: t.developerId ?? null,
    agent_id: t.agentId ?? null,
    assignee_type: t.assigneeType,
    agent_assigned: t.agentAssigned ?? false,
    is_custom: false,
    criteria: t.criteria ?? [],
  }));
  const { error: taskErr } = await supabase
    .from('tasks')
    .upsert(tasks, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (taskErr) throw taskErr;
  console.log(`Seeded ${tasks.length} tasks`);

  console.log('Done!');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
```

- [ ] **Step 4: Add the seed script to `package.json`**

In `package.json`, add to the `"scripts"` section:

```json
"seed": "tsx scripts/seed.ts"
```

The scripts section should look like:

```json
"scripts": {
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "seed": "tsx scripts/seed.ts"
},
```

- [ ] **Step 5: Run the seed script**

```bash
npm run seed
```

Expected output:
```
Seeding Supabase...
Created project: <uuid>
Seeded 3 developers
Seeded 4 agents
Seeded 5 sub-agents
Seeded 6 tasks
Done!
```

If you see errors about foreign key violations, ensure the insert order is developers → agents → sub-agents → tasks (the script already does this).

- [ ] **Step 6: Verify in Supabase dashboard**

Go to Table Editor → `tasks`. You should see 6 rows all with the same `project_id`.

- [ ] **Step 7: Commit**

```bash
git add scripts/seed.ts package.json package-lock.json
git commit -m "feat: add seed script for symphony-data.json"
```

---

## Task 8: Smoke test

- [ ] **Step 1: Start the dev server**

```bash
npm run dev
```

Open http://localhost:5173.

- [ ] **Step 2: Verify initial load**

- The loading splash appears for at least ~1200ms while data fetches.
- After the splash fades, the board renders with all 6 tasks, 3 developers, 4 agents, and 5 sub-agents (the seeded data).

- [ ] **Step 3: Verify board interactions still work**

- Drag a node — position should persist on reload (verify by refreshing the page and checking the node is in the same spot).
- Click a node — detail panel opens.
- Check a criterion in the detail panel — survives a page refresh.

- [ ] **Step 4: Verify adding a custom task**

- Use the UI to add a custom task.
- Reload the page — the task should still appear.
- Check in Supabase Table Editor → `tasks` — the new row should be there with `is_custom = true`.

- [ ] **Step 5: Verify project creation**

- Create a new project from the UI.
- Verify it appears in Supabase → `projects` table.
- The new project board should be empty (no seed data).

- [ ] **Step 6: Final commit**

```bash
git add -A
git commit -m "feat: supabase integration complete"
```
