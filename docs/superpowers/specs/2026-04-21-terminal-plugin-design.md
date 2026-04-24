# Terminal Plugin Design

**Date:** 2026-04-21  
**Project:** Symphony PM  
**Status:** Approved

---

## Overview

A Claude Code plugin that captures live session activity (tool calls, conversation phase, errors) and streams it to the Symphony PM dashboard via Supabase Realtime. The dashboard reflects what Claude Code is doing in real time: which task is being worked on, the current phase, and a full session timeline.

---

## Goals

- Show which ticket Claude Code is actively working on in the Tickets view
- Display a persistent ambient status bar across all dashboard views
- Provide a session log route showing a full timeline of Claude Code events
- Support task linking via explicit declaration ("working on task t3") or inline tag (`#t3`)

---

## Architecture

```
Claude Code session
  └── hooks fire on every tool use / notification / stop
       └── plugin/hooks/*.js  (Node.js, exits after each event)
            ├── parse-context.js  →  detects phase + extracts task ID
            └── supabase-client.js  →  INSERTs event row

Supabase (hosted)
  ├── claude_sessions  (one row per session)
  ├── claude_events    (one row per hook fire)
  └── Realtime channel: "claude-events"

Dashboard (React)
  └── useClaudeSession.ts  subscribes to Realtime
       ├── ClaudeStatusBar.tsx   — ambient "Claude is: Debugging…"
       ├── SessionLog.tsx        — full timeline of events
       └── TicketsView           — active ticket glows with Claude indicator
```

Data flows one direction: hooks → Supabase → dashboard. The dashboard is read-only.

---

## Supabase Schema

```sql
-- One row per Claude Code session
create table claude_sessions (
  id              uuid primary key default gen_random_uuid(),
  started_at      timestamptz default now(),
  project         text,           -- e.g. "PM-Project"
  active_task_id  text            -- last linked task ID
);

-- One row per hook event
create table claude_events (
  id          uuid primary key default gen_random_uuid(),
  session_id  uuid references claude_sessions(id),
  phase       text,               -- see Phase Detection table
  tool_name   text,               -- which Claude Code tool fired
  summary     text,               -- short human-readable description
  task_id     text,               -- extracted task ID or null
  created_at  timestamptz default now()
);
```

Realtime is enabled on `claude_events`. The dashboard subscribes to `INSERT` events on this table.

---

## Plugin Structure

```
plugin/
  package.json          # @supabase/supabase-js dependency
  .env                  # SUPABASE_URL + SUPABASE_ANON_KEY (git-ignored)
  lib/
    supabase-client.js  # shared Supabase client (reads .env)
    parse-context.js    # phase detection + task ID extraction
  hooks/
    post-tool-use.js    # main hook — fires after every tool call
    notification.js     # fires on Claude notifications
    stop.js             # fires when session ends
  install.sh            # registers hooks in .claude/settings.json
```

Hooks are registered in `.claude/settings.json` as shell commands:

```json
{
  "hooks": {
    "PostToolUse": [{ "hooks": [{ "type": "command", "command": "node plugin/hooks/post-tool-use.js" }] }],
    "Notification": [{ "hooks": [{ "type": "command", "command": "node plugin/hooks/notification.js" }] }],
    "Stop":         [{ "hooks": [{ "type": "command", "command": "node plugin/hooks/stop.js" }] }]
  }
}
```

Each hook script reads JSON from stdin (Claude Code passes the event payload), processes it, and exits.

---

## Phase Detection

| Tool fired | Phase label |
|---|---|
| `Read` / `Grep` / `Glob` / `LS` | `exploring` |
| `Edit` / `Write` | `implementing` |
| `Bash` | `running` |
| `AskUserQuestion` | `waiting` |
| Error in tool output | `debugging` |
| `Stop` hook | `ended` |
| Notification / no tool | `communicating` |

---

## Task ID Extraction

`parse-context.js` scans the conversation payload for:

1. Inline tag pattern: `#t\d+` (e.g. `#t3`)
2. Explicit declaration pattern: `working on task (\w+)` (case-insensitive)

The most recently matched task ID is used. If none found, `task_id` is null.

When a task ID is found, `claude_sessions.active_task_id` is also updated so the dashboard always knows the current linked task without scanning all events.

---

## Dashboard Changes

### 1. `app/utils/supabase.ts`
Re-add Supabase client using `@supabase/supabase-js`. Reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from `.env`.

### 2. `app/hooks/useClaudeSession.ts`
Custom hook that:
- Subscribes to Supabase Realtime `claude_events` INSERT events
- Maintains `latestEvent` and `sessionEvents[]` state
- Exposes `activeTaskId` (from latest event with a task_id)
- Cleans up subscription on unmount

### 3. `app/components/ClaudeStatusBar.tsx`
Slim persistent strip rendered at the bottom of `Root.tsx` (all views). Shows:
```
⬡ Claude  •  Implementing  •  task #t3  •  just now
```
Fades to `⬡ Claude — idle` after 5 minutes of no events. Hidden if Supabase is not configured.

### 4. `app/components/SessionLog.tsx`
New route at `/session`. Vertical timeline of all events in the current session:
- Timestamp, phase label, tool used, linked task ID
- Clicking a task ID navigates to `/tickets` and opens that ticket's detail panel

### 5. `app/components/TicketsView.tsx`
When `activeTaskId` matches a ticket's ID, that card:
- Shows a `⬡ Claude` label alongside the developer footer
- Renders a soft purple pulsing border ring

### 6. `app/components/Header.tsx`
Add a "Session" tab/link alongside Board and Tickets.

---

## Environment Variables

```
# plugin/.env  (local only, git-ignored)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...

# .env  (dashboard, git-ignored)
VITE_SUPABASE_URL=https://xxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

---

## Out of Scope

- Bidirectional control (dashboard → Claude Code)
- Authentication / multi-user session isolation
- Activity feed integration (explicitly excluded)
- Historical session browser (only current session shown in log)
