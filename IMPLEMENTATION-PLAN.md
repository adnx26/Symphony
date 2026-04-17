# Symphony PM — Full Implementation Plan

This document is the authoritative roadmap for building Symphony PM into a full Jira-equivalent with an AI orchestration agent acting as the project manager.

Last updated: 2026-04-16

---

## Vision

Symphony PM is Jira's functionality + an always-on orchestration agent that does the work of a PM:
- Manages sprints, triages the backlog, rebalances workload
- Creates and assigns worker agents that autonomously write code and open PRs
- Monitors developer activity via a terminal plugin
- Escalates blockers to a human manager via Slack when it can't resolve them itself

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Symphony PM Board                    │
│   (React 19 + TypeScript + Vite + Tailwind + Supabase)  │
└────────────────────┬────────────────────────────────────┘
                     │
          ┌──────────▼──────────┐
          │  Orchestration Agent │  ← Your Anthropic API key
          │  (Express server)    │    Manages sprints, answers
          │                      │    worker agent questions,
          │                      │    monitors everything
          └──────────┬───────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
   ┌────▼────┐  ┌────▼────┐  ┌───▼─────┐
   │ Worker  │  │ Worker  │  │ Worker  │  ← User's own API key
   │ Agent 1 │  │ Agent 2 │  │ Agent N │    Writes code, opens PRs
   └────┬────┘  └────┬────┘  └───┬─────┘    asks orchestrator Qs
        │            │            │
        └────────────┼────────────┘
                     │
          ┌──────────▼──────────┐
          │   Terminal Plugin    │  ← /plugin claude-code
          │  (Claude Code hook)  │    Sends activity back to board
          └─────────────────────┘
                     │
          ┌──────────▼──────────┐    (Future)
          │    Slack MCP         │  ← Manager answers questions
          │                      │    that orchestrator can't
          └─────────────────────┘
```

---

## Current State (what's already built)

- React board with task/developer/agent/sub-agent nodes
- Drag-and-drop canvas with pan/zoom
- Rule-based orchestration engine (9 rules)
- LLM engine via Express proxy (Claude Haiku)
- Agent action queue (propose/approve/dismiss)
- Agent dispatch system (simulated)
- Project setup wizard (Claude Sonnet generates tasks)
- Full Supabase persistence (tasks, agents, positions, action log, dispatches)
- Multi-project support

---

## Phase 1 — Core Jira Foundation

> Everything else depends on this. Build the data model and views first.

### 1.1 Epic → Story → Task Hierarchy

**New DB tables:**
```sql
CREATE TABLE epics (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'active',   -- active | completed | archived
  priority TEXT DEFAULT 'medium',
  color TEXT DEFAULT '#7c3aed',   -- label color
  start_date DATE,
  target_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE stories (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  epic_id TEXT REFERENCES epics(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  description TEXT DEFAULT '',
  status TEXT DEFAULT 'todo',
  priority TEXT DEFAULT 'medium',
  story_points INTEGER DEFAULT 0,
  assignee_id TEXT,               -- developer_id
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Add to tasks table:
ALTER TABLE tasks ADD COLUMN story_id TEXT REFERENCES stories(id) ON DELETE SET NULL;
ALTER TABLE tasks ADD COLUMN story_points INTEGER DEFAULT 0;
ALTER TABLE tasks ADD COLUMN labels TEXT[] DEFAULT '{}';
ALTER TABLE tasks ADD COLUMN estimate_hours NUMERIC DEFAULT 0;
```

**New types in `app/types.ts`:**
```ts
interface AppEpic {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  priority: PriorityType;
  color: string;
  startDate?: string;
  targetDate?: string;
}

interface AppStory {
  id: string;
  epicId?: string;
  title: string;
  description: string;
  status: StatusType;
  priority: PriorityType;
  storyPoints: number;
  assigneeId?: string;
}

// Extend AppTask:
// + storyId?: string
// + storyPoints: number
// + labels: string[]
// + estimateHours: number
```

**Files to create/modify:**
- `app/types.ts` — add AppEpic, AppStory, extend AppTask
- `app/data/db.ts` — add fetchEpics, upsertEpic, deleteEpic, fetchStories, upsertStory, deleteStory
- `app/context/AppContext.tsx` — add epics, stories state + CRUD methods
- `app/components/EpicModal.tsx` — create/edit epic
- `app/components/StoryModal.tsx` — create/edit story, pick epic
- `app/components/EditTaskModal.tsx` — add storyId picker, labels, story points

---

### 1.2 Backlog View

New route: `/backlog`

The backlog is a grouped list: Epics at the top level, Stories nested under epics, Tasks nested under stories. Unepiced stories and orphan tasks at the bottom.

**Features:**
- Drag to reorder within the backlog
- Click epic/story to expand/collapse
- Inline status change
- Bulk select + move to sprint
- "Add story" and "Add task" inline at each level
- Epic progress bar (% of stories done)
- Story progress bar (% of tasks done)

**Files to create:**
- `app/components/BacklogView.tsx`
- `app/components/BacklogEpicRow.tsx`
- `app/components/BacklogStoryRow.tsx`
- `app/components/BacklogTaskRow.tsx`

**Routes to add (`app/routes.tsx`):**
```ts
{ path: '/backlog', element: <BacklogView /> }
```

---

### 1.3 Sprint Management

**New DB tables:**
```sql
CREATE TABLE sprints (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,             -- e.g. "Sprint 1"
  goal TEXT DEFAULT '',
  status TEXT DEFAULT 'planned',  -- planned | active | completed
  start_date DATE,
  end_date DATE,
  capacity INTEGER DEFAULT 0,     -- story points
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE sprint_tasks (
  sprint_id TEXT REFERENCES sprints(id) ON DELETE CASCADE,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  added_by TEXT DEFAULT 'manual', -- 'manual' | 'agent'
  PRIMARY KEY (sprint_id, task_id)
);
```

**New types:**
```ts
interface AppSprint {
  id: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  capacity: number;
}
```

**Sprint view route: `/sprint`**

Shows the active sprint as a Kanban board (todo / in progress / done columns). Very similar to BoardView but filtered to sprint tasks only, with sprint header showing goal, dates, burndown mini-chart.

**Orchestration agent manages sprints:**
- Auto-plans sprint: picks tasks from backlog based on priority, due date, dev capacity
- Flags when sprint is at risk (too many tasks, blocked items)
- Suggests moving tasks out if sprint is overloaded
- Auto-completes sprint and starts next when all tasks done
- Manual override: user can add/remove tasks, change dates, start/complete sprint manually

**Files to create:**
- `app/components/SprintView.tsx`
- `app/components/SprintHeader.tsx`
- `app/components/SprintPlanningModal.tsx` — agent proposes, user confirms
- `app/data/db.ts` — add sprint CRUD functions
- `app/context/AppContext.tsx` — add sprints, activeSprint state
- `app/agent/orchestrationEngine.ts` — add sprint rules:
  - `SPRINT_AT_RISK` — too many blocked/overdue tasks in active sprint
  - `SPRINT_OVERLOADED` — story points exceed capacity
  - `SUGGEST_SPRINT_COMPLETE` — all tasks done, suggest close sprint
  - `PLAN_SPRINT` — no active sprint, suggest creating one from backlog

---

### 1.4 Comments & Activity Log

**New DB tables:**
```sql
CREATE TABLE task_comments (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  author TEXT NOT NULL,           -- 'user' | agent id | 'orchestrator'
  author_type TEXT DEFAULT 'user', -- 'user' | 'agent'
  body TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE task_activity (
  id TEXT PRIMARY KEY,
  task_id TEXT REFERENCES tasks(id) ON DELETE CASCADE,
  project_id TEXT NOT NULL,
  event_type TEXT NOT NULL,       -- 'status_changed' | 'priority_changed' | 'assigned' | 'agent_action' | 'comment_added' | 'criteria_checked' | 'sprint_added' | 'blocker_set' | 'blocker_resolved'
  actor TEXT NOT NULL,            -- 'user' | agent id | 'orchestrator'
  actor_type TEXT DEFAULT 'user',
  payload JSONB DEFAULT '{}',     -- {from, to} for changes
  created_at TIMESTAMPTZ DEFAULT now()
);
```

**Activity is auto-generated** whenever a task mutation happens — status change, priority change, assignment, criteria check, agent action applied, comment posted.

**Files to create/modify:**
- `app/data/db.ts` — add comment/activity CRUD
- `app/components/DetailPanel.tsx` — add Comments + Activity tabs
- `app/components/CommentThread.tsx` — comment list + input box
- `app/components/ActivityFeed.tsx` — chronological event list
- `app/context/AppContext.tsx` — wire activity emission into all mutations

---

### 1.5 Richer Ticket Detail

Upgrade `DetailPanel.tsx` to a full ticket view with tabs:

- **Overview** — title (editable inline), description (rich text), status, priority, assignee, sprint, epic/story, due date, story points, labels
- **Criteria** — existing acceptance criteria checkboxes
- **Comments** — comment thread
- **Activity** — full audit trail
- **Agent** — dispatch section (existing), agent-touched badge, LLM insights for this task

---

## Phase 2 — Worker Agent Infrastructure

### 2.1 User API Key Management

Users provide their own Anthropic API key for worker agents. This key:
- Is stored in Supabase (encrypted) or localStorage (simpler to start)
- Is **never sent to your Express server** — worker agents call Anthropic directly from the client, or via a separate per-user proxy
- Is used only for worker agent tasks, not orchestration

**DB table:**
```sql
CREATE TABLE user_settings (
  project_id TEXT PRIMARY KEY REFERENCES projects(id),
  worker_api_key TEXT,            -- encrypted
  github_token TEXT,              -- for PR creation
  github_repo TEXT,               -- e.g. "org/repo"
  sandbox_config JSONB DEFAULT '{}'
);
```

**UI:**
- Settings modal (gear icon in header)
- Fields: Worker API Key, GitHub Token, GitHub Repo
- "Test connection" button that pings the API

---

### 2.2 Worker Agent Creation & Management

On any task, story, or epic — a "Create Agent" button spins up a worker agent.

**Worker agent lifecycle:**
1. User clicks "Create Agent" on a task
2. Orchestration agent reviews the task and writes a detailed brief (what to build, acceptance criteria, constraints, relevant context from other tasks)
3. Brief is shown to user for confirmation (propose-and-confirm model)
4. User confirms → worker agent is created with:
   - Task brief from orchestration agent
   - User's API key
   - GitHub token + repo
   - Sandbox environment
5. Worker agent runs autonomously: reads codebase, writes code, runs tests, opens PR
6. Worker agent posts questions to a question queue when blocked
7. Orchestration agent monitors queue and answers questions
8. When PR is opened, board updates task status to 'review'
9. When PR is merged, board updates task to 'done'

**New DB tables:**
```sql
CREATE TABLE worker_agents (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  task_id TEXT REFERENCES tasks(id),
  status TEXT DEFAULT 'briefing',  -- briefing | confirmed | running | waiting | completed | failed
  brief TEXT,                       -- orchestrator-written task brief
  pr_url TEXT,
  pr_number INTEGER,
  sandbox_id TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE agent_questions (
  id TEXT PRIMARY KEY,
  worker_agent_id TEXT REFERENCES worker_agents(id),
  project_id TEXT NOT NULL,
  question TEXT NOT NULL,
  context TEXT,                     -- code snippet, error, etc.
  status TEXT DEFAULT 'pending',    -- pending | answered | escalated
  answer TEXT,
  answered_by TEXT,                 -- 'orchestrator' | 'manager' | 'user'
  asked_at TIMESTAMPTZ DEFAULT now(),
  answered_at TIMESTAMPTZ
);
```

**New server endpoint:**
```
POST /api/worker/brief        — orchestrator writes task brief
POST /api/worker/question     — orchestrator answers a worker question
POST /api/worker/run          — start worker agent in sandbox (future: E2B/Modal)
```

**Files to create:**
- `app/components/WorkerAgentPanel.tsx` — shows running agents, their status, questions
- `app/components/AgentBriefModal.tsx` — propose-and-confirm brief before starting
- `app/components/QuestionQueue.tsx` — list of unanswered worker questions
- `server/workerRouter.ts` — worker agent endpoints

---

### 2.3 Question/Answer Flow

```
Worker Agent
    │
    │ posts question + context
    ▼
agent_questions table (status: pending)
    │
    │ orchestration agent polls every 30s
    ▼
/api/worker/question
    │ — searches project context (tasks, PRD, prior answers)
    │ — answers if confident
    │ — marks status: answered
    ▼
Worker Agent resumes
    │
    │ (if orchestrator not confident after 2 tries)
    ▼
Slack MCP escalation (Phase 4)
```

---

### 2.4 GitHub Integration

Worker agents open PRs via GitHub API. The orchestration agent monitors PR status.

**New server endpoint:**
```
POST /api/github/pr           — create PR (called by worker agent)
GET  /api/github/pr/:number   — get PR status
POST /api/github/webhook      — receive PR events (merged, closed, review requested)
```

When a PR is merged → `updateTaskStatus(taskId, 'done')` + emit activity event.

---

## Phase 3 — Plugin System

### 3.1 Plugin Architecture

Plugins are connectors that push events into Symphony PM from external tools. The plugin system has two parts:

**Plugin registry** (server-side):
```sql
CREATE TABLE installed_plugins (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  plugin_name TEXT NOT NULL,       -- 'claude-code' | 'github' | 'slack'
  config JSONB DEFAULT '{}',
  webhook_secret TEXT,
  installed_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE plugin_events (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL,
  plugin_name TEXT NOT NULL,
  event_type TEXT NOT NULL,        -- 'subtask_completed' | 'file_changed' | 'error' | 'commit'
  payload JSONB NOT NULL,
  processed BOOLEAN DEFAULT false,
  received_at TIMESTAMPTZ DEFAULT now()
);
```

**Plugin interface** — every plugin implements:
```ts
interface Plugin {
  name: string;
  description: string;
  configSchema: Record<string, unknown>;
  eventTypes: string[];
  install(projectId: string, config: Record<string, unknown>): Promise<void>;
  uninstall(projectId: string): Promise<void>;
}
```

### 3.2 `/plugin` Slash Command

In the board's command palette or header input, typing `/plugin claude-code` opens a plugin install flow:

1. Shows plugin description + what data it sends to the board
2. Asks for config (e.g. webhook URL to put in Claude Code settings)
3. Installs plugin, generates webhook secret
4. Shows setup instructions (copy this URL into your Claude Code hooks config)

**Files to create:**
- `app/components/PluginInstaller.tsx` — slash command UI + install flow
- `app/components/PluginList.tsx` — manage installed plugins
- `server/pluginRouter.ts` — `/api/plugins/*` endpoints + webhook receiver

### 3.3 Claude Code Plugin

The `claude-code` plugin bridges the developer's terminal session and the board.

**What it sends to the board:**
- Subtask completions (when Claude Code marks something done)
- File changes (which files are being modified)
- Errors and stack traces
- Commit messages
- Current task Claude Code is working on

**How it works:**
- Developer installs a Claude Code hook (a `settings.json` PostToolUse hook)
- Hook calls `POST https://your-server/api/plugins/claude-code/event` with activity data
- Server stores event in `plugin_events`, emits to board via WebSocket
- Board shows live "Claude Code is working on..." indicator on the task card
- Orchestration agent consumes events as signals (e.g. repeated errors → flag as blocked)

**Claude Code hook format** (goes in developer's `~/.claude/settings.json`):
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "*",
      "hooks": [{
        "type": "command",
        "command": "curl -X POST https://your-server/api/plugins/claude-code/event -H 'Content-Type: application/json' -H 'X-Plugin-Secret: YOUR_SECRET' -d '{\"event\": \"tool_use\", \"tool\": \"$TOOL_NAME\", \"result\": \"$RESULT\"}'"
      }]
    }]
  }
}
```

**Files to create:**
- `server/plugins/claudeCode.ts` — event handler + board emission
- `app/components/LiveAgentIndicator.tsx` — shows on NodeCard when plugin is active

### 3.4 WebSocket for Real-Time Updates

Plugin events (and eventually agent updates) need to push to the browser in real time.

**Server addition:**
```ts
import { WebSocketServer } from 'ws';

// Attach to Express server
const wss = new WebSocketServer({ server });

// Per-project rooms
const rooms = new Map<string, Set<WebSocket>>();

// Emit to all clients in a project room
function emitToProject(projectId: string, event: unknown) {
  rooms.get(projectId)?.forEach(ws => ws.send(JSON.stringify(event)));
}
```

**Client:**
```ts
// app/hooks/useProjectSocket.ts
// Connects to ws://localhost:3001
// Listens for plugin_event, agent_update, worker_status events
// Dispatches to AppContext
```

---

## Phase 4 — Slack Escalation

### 4.1 Slack MCP Integration

When the orchestration agent can't answer a worker agent's question with sufficient confidence, it escalates to Slack.

**Escalation flow:**
1. Worker agent asks question
2. Orchestration agent attempts answer, confidence score < threshold
3. Orchestration agent posts to Slack: "@manager [Agent] is blocked on [task]: [question] — context: [relevant code/error]"
4. Manager replies in Slack thread
5. Slack MCP receives reply, posts to `agent_questions` table (status: answered, answered_by: manager)
6. Worker agent resumes

**New server endpoint:**
```
POST /api/slack/event          — Slack event webhook (receives replies)
POST /api/slack/escalate       — post question to Slack (called by orchestrator)
```

**Config:**
- Slack Bot Token stored in `user_settings`
- Channel ID for escalations
- Manager's Slack user ID

### 4.2 Confidence Scoring

Orchestration agent needs to know when to escalate vs. answer itself.

Add a confidence score to each answer:
```ts
interface OrchestratorAnswer {
  answer: string;
  confidence: number;   // 0–1
  sources: string[];    // task IDs, docs referenced
  shouldEscalate: boolean;
}
```

The LLM prompt for answering questions includes a confidence instruction: return a JSON object with `answer`, `confidence` (0–1), and `escalate: true/false`.

---

## Build Order & Dependencies

```
Phase 1.1 (hierarchy types + DB)
    ↓
Phase 1.2 (backlog view)     Phase 1.3 (sprints)     Phase 1.4 (comments/activity)
    ↓                              ↓                        ↓
Phase 1.5 (richer ticket detail — pulls all Phase 1 together)
    ↓
Phase 2.1 (user API key + settings)
    ↓
Phase 2.2 (worker agent creation + briefing)
    ↓
Phase 2.3 (question/answer flow)     Phase 2.4 (GitHub integration)
    ↓                                      ↓
Phase 3.1 (plugin architecture)
    ↓
Phase 3.2 (/plugin slash command)    Phase 3.4 (WebSocket)
    ↓                                      ↓
Phase 3.3 (Claude Code plugin — needs WebSocket)
    ↓
Phase 4.1 (Slack escalation)
    ↓
Phase 4.2 (confidence scoring)
```

---

## File Creation Summary

### New files to create
```
app/types.ts                          — extend with AppEpic, AppStory, AppSprint
app/components/BacklogView.tsx
app/components/BacklogEpicRow.tsx
app/components/BacklogStoryRow.tsx
app/components/BacklogTaskRow.tsx
app/components/SprintView.tsx
app/components/SprintHeader.tsx
app/components/SprintPlanningModal.tsx
app/components/EpicModal.tsx
app/components/StoryModal.tsx
app/components/CommentThread.tsx
app/components/ActivityFeed.tsx
app/components/WorkerAgentPanel.tsx
app/components/AgentBriefModal.tsx
app/components/QuestionQueue.tsx
app/components/PluginInstaller.tsx
app/components/PluginList.tsx
app/components/LiveAgentIndicator.tsx
app/hooks/useProjectSocket.ts
server/workerRouter.ts
server/pluginRouter.ts
server/plugins/claudeCode.ts
```

### Files to modify significantly
```
app/types.ts                          — new types
app/data/db.ts                        — new table functions
app/context/AppContext.tsx            — epics, stories, sprints, activity, worker agents
app/routes.tsx                        — /backlog, /sprint routes
app/components/DetailPanel.tsx        — tabs: overview, criteria, comments, activity, agent
app/components/Header.tsx             — /plugin command, settings gear
app/components/EditTaskModal.tsx      — story picker, labels, story points
app/agent/orchestrationEngine.ts      — sprint rules, worker agent rules
server/index.ts                       — WebSocket, new routers
```

---

## Supabase Migration Order

Run these in order:
1. `epics` table
2. `stories` table
3. ALTER `tasks` (add story_id, story_points, labels, estimate_hours)
4. `sprints` table
5. `sprint_tasks` junction table
6. `task_comments` table
7. `task_activity` table
8. `user_settings` table
9. `worker_agents` table
10. `agent_questions` table
11. `installed_plugins` table
12. `plugin_events` table

---

## Key Design Principles

1. **Propose and confirm** — agent always shows what it's about to do before doing it
2. **Manual override everywhere** — agent manages sprints, but user can always intervene
3. **User's API key stays client-side** — worker agents use user's key, never touches your server
4. **Plugin events drive agent intelligence** — terminal activity is a first-class signal
5. **Escalation is a feature, not a failure** — Slack escalation is the designed path for hard questions
6. **Activity log is the source of truth** — every mutation emits an activity event
