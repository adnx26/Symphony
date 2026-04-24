# Task Selection Enforcement — Design Spec

**Date:** 2026-04-23
**Status:** Approved

## Problem

Developers can start a Claude Code session without selecting a task, leaving `active_task_id` null in Supabase. The PM has no visibility into what is being worked on. There is currently no enforcement — task association is passive (Claude mentions `#t3` in a message and the Notification hook picks it up), meaning sessions can run entirely untagged.

## Goal

Force task selection at the start of every session. No message reaches Claude until a task is chosen. There is no bypass path — no env var, no flag, no fallback.

## Architecture

### Hook: `UserPromptSubmit`

Claude Code fires `UserPromptSubmit` before every user message is sent to Claude. If the hook exits with code 2, the message is blocked and the hook's stdout is shown to the user.

**Behaviour:**

1. Read `session_id` from payload.
2. Read `.session-state.json`.
3. **If task already selected** (`state.session_id === session_id && state.active_task_id`): exit 0 — allow message through.
4. **Otherwise** (new session or no task set):
   - Write `{ session_id, active_task_id: null }` to `.session-state.json` (records the session ID so `select-task.js` can use it).
   - Upsert the session row in Supabase `claude_sessions`.
   - Read `app/data/symphony-data.json` and format the available task list.
   - Exit 2, printing the task picker to stdout.

The hook runs on every message until a task is set — there is no one-time flag or skip mechanism.

### Script: `plugin/select-task.js`

A standalone Node.js CLI the developer runs inline via `! node plugin/select-task.js <task-id>`.

**Behaviour:**

1. Read task ID from `process.argv[2]`. If missing, print usage and exit 1.
2. Read `app/data/symphony-data.json`. Find the task with matching ID.
3. If not found, print an error listing valid IDs and exit 1.
4. Read `.session-state.json` to get `session_id` (written by the hook in step 4 above).
5. If `session_id` is null (edge case: script run outside a session), print a warning and exit 1.
6. Write `{ session_id, active_task_id: taskId }` to `.session-state.json`.
7. Update `claude_sessions` in Supabase: `active_task_id = taskId`.
8. Print a confirmation and exit 0.

### Block Screen Format

```
╔═══════════════════════════════════════════════════╗
║  Symphony PM — Task Required                      ║
╚═══════════════════════════════════════════════════╝

No task is selected for this session.

Available tasks:
  t1   Build Authentication API         [in-progress]  Alice Chen
  t2   Design System Components         [todo]          Bob Kim
  t3   Database Migration               [blocked]       Carol Davis

Select a task to continue:
  ! node /absolute/path/to/plugin/select-task.js <task-id>

Example:
  ! node /absolute/path/to/plugin/select-task.js t1
```

The absolute path is included so the command is copy-pasteable without navigating directories.

### `install.js` Update

The installer currently registers `PostToolUse`, `Notification`, and `Stop`. Add `UserPromptSubmit` pointing at `hooks/user-prompt-submit.js`. The merge logic (remove existing entry for this command, then append) already handles idempotency.

## Data Flow

```
User types message
       │
UserPromptSubmit hook fires
       │
  task set? ──yes──▶ exit 0 ──▶ Claude receives message
       │
      no
       │
Write session_id to .session-state.json
Upsert Supabase claude_sessions
Print task picker
Exit 2 (message blocked)
       │
User runs: ! node plugin/select-task.js t3
       │
Validate task in symphony-data.json
Write active_task_id to .session-state.json
Update Supabase claude_sessions.active_task_id
Print confirmation
       │
User types next message ──▶ hook exits 0 ──▶ Claude receives message
```

## Files Changed

| File | Change |
|------|--------|
| `plugin/hooks/user-prompt-submit.js` | New — blocking hook |
| `plugin/select-task.js` | New — task selection CLI |
| `plugin/install.js` | Modified — register `UserPromptSubmit` hook |

## What Is Not Changed

- Mid-session task switching via `#t3` tags in messages (Notification hook) continues to work unchanged.
- `PostToolUse`, `Notification`, and `Stop` hooks are unaffected.
- Dashboard (React app) is unaffected — it already consumes `active_task_id` from Supabase Realtime.

## Constraints

- No bypass: no env var, no `--skip` flag, no fallback default task. The only path forward is `select-task.js`.
- The hook reads `symphony-data.json` at runtime (not cached), so newly added tasks appear immediately without reinstalling.
- The script validates the task ID — typos are caught before writing state.
