# Supabase Integration Design

**Date:** 2026-04-14  
**Status:** Approved  
**Scope:** Replace localStorage with Supabase database for all project data. User authentication is out of scope for this phase.

---

## Overview

All app data (seed nodes from `symphony-data.json` and user-created data) moves into Supabase. Each "project" owns its own copy of every entity. localStorage is removed entirely.

---

## Database Schema

All entity tables use a composite primary key of `(project_id, id)` so the same short IDs (`d1`, `t1`, etc.) can coexist independently across projects.

```sql
-- Projects
CREATE TABLE projects (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name       text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Developers
CREATE TABLE developers (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  id         text,
  name       text NOT NULL,
  initials   text NOT NULL,
  role       text NOT NULL,
  desc       text NOT NULL,
  criteria   text[] NOT NULL DEFAULT '{}',
  outputs    text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id)
);

-- Agents
CREATE TABLE agents (
  project_id   uuid REFERENCES projects(id) ON DELETE CASCADE,
  id           text,
  developer_id text NOT NULL,
  name         text NOT NULL,
  type         text NOT NULL,
  desc         text NOT NULL,
  criteria     text[] NOT NULL DEFAULT '{}',
  outputs      text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id, developer_id) REFERENCES developers(project_id, id)
);

-- Sub-agents
CREATE TABLE sub_agents (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  id         text,
  parent_id  text NOT NULL,
  name       text NOT NULL,
  type       text NOT NULL,
  desc       text NOT NULL,
  criteria   text[] NOT NULL DEFAULT '{}',
  outputs    text[] NOT NULL DEFAULT '{}',
  PRIMARY KEY (project_id, id),
  FOREIGN KEY (project_id, parent_id) REFERENCES agents(project_id, id)
);

-- Tasks
-- Note: developer_id and agent_id have no FK constraints — tasks can be
-- agent-only (no developer) or have a null agent_id. Referential integrity
-- is enforced at the app layer.
CREATE TABLE tasks (
  project_id     uuid REFERENCES projects(id) ON DELETE CASCADE,
  id             text,
  title          text NOT NULL,
  desc           text NOT NULL,
  overview       text NOT NULL,
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

-- Board positions (UI state, per node per project)
CREATE TABLE board_positions (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  node_id    text,
  x          float NOT NULL,
  y          float NOT NULL,
  PRIMARY KEY (project_id, node_id)
);

-- Checked criteria (UI state, per key per project)
CREATE TABLE checked_criteria (
  project_id uuid REFERENCES projects(id) ON DELETE CASCADE,
  key        text,
  checked    bool NOT NULL DEFAULT false,
  PRIMARY KEY (project_id, key)
);
```

---

## New Files

### `app/utils/supabase.ts`
Singleton Supabase client. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from the environment.

```ts
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
)
```

### `app/data/db.ts`
All Supabase query functions. `AppContext` calls these — no Supabase imports elsewhere in the app.

Key functions:
- `fetchProjects()` → `Project[]`
- `fetchProjectData(projectId)` → `{ tasks, developers, agents, subAgents, positions, checkedCriteria }` via 6 parallel queries
- `upsertTask(projectId, task)` / `deleteTask(projectId, taskId)`
- `upsertPositions(projectId, positions)` — batch upsert
- `upsertCheckedCriterion(projectId, key, checked)`
- `createProject(name)` → `Project`
- `renameProject(id, name)`

### `scripts/seed.ts`
One-time seed script. Reads `app/data/symphony-data.json`, creates a "default" project in Supabase (if it doesn't exist), and upserts all tasks, developers, agents, and sub-agents into it. All inserts use `ON CONFLICT DO NOTHING` so the script is safe to run multiple times. Run with `npx tsx scripts/seed.ts`.

---

## Modified Files

### `app/data/appData.ts`
- Remove the `import rawData from './symphony-data.json'` and the static `TASKS`, `DEVELOPERS`, `AGENTS`, `SUB_AGENTS` exports.
- Retain all pure functions: `computeVisibleNodes`, `computeDefaultPositions`, `buildTreeData`, `getRelatedNodeIds`. These operate on arrays passed in — no change needed.

### `app/context/AppContext.tsx`
- Add `loading: boolean` to context type and expose it.
- On mount: call `fetchProjects()`. Set projects + activate first project, then call `fetchProjectData()` for that project.
- On `switchProject`: call `fetchProjectData(id)` to hydrate state.
- Write operations (`addTask`, `updateTask`, `deleteTask`, `toggleCriterion`, `createProject`, `renameProject`) optimistically update React state, then fire the corresponding `db.ts` function in the background (no awaiting in UI).
- `setPositions` triggers a debounced (500 ms) `upsertPositions` call to avoid flooding Supabase during drag.
- Remove all `localStorage` reads and writes. Remove `migrateDefaultProject`, `bootstrapProjects`, and the `pk()` helper.

### `app/components/Root.tsx`
- `AppContext` exposes `loading: boolean`. `Root.tsx` renders `<LoadingSplash />` while `loading` is true (the existing splash component is already used for the intro animation — this reuses it for the async data fetch).

---

## Data Flow

```
App mount
  └─ fetchProjects()
       └─ fetchProjectData(activeProjectId)  [6 parallel queries]
            └─ hydrate AppContext state
                 └─ render board

User action (e.g. addTask)
  └─ optimistic state update (instant UI)
  └─ db.upsertTask() [fire-and-forget]

User drags node
  └─ setPositions() → debounce 500ms → db.upsertPositions() [batch]
```

---

## Out of Scope

- User authentication (planned for a future phase — schema is auth-ready via RLS on `project_id`)
- Real-time subscriptions / multi-user sync
- Deleting projects from the UI
