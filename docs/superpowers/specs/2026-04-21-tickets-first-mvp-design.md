# Tickets-First MVP — Design Spec

**Date:** 2026-04-21  
**Branch:** Remake  

---

## Overview

Redesign the app around a tickets-first MVP that reflects what is actually being built: a PM tool (similar to Jira) with a Claude Code plugin that tracks developer activity in real-time. The board view is hidden. The tickets view becomes the primary interface. Agent/sub-agent nodes are removed entirely. A live AI indicator on each ticket shows whether Claude is actively working on it, driven by the terminal plugin's Supabase events.

---

## Data Model

### Removed
- `agents` and `subAgents` arrays from `symphony-data.json`
- `Agent`, `SubAgent`, `AgentNode`, `SubAgentNode` types from `types.ts`
- `agentId`, `agentAssigned`, `assigneeType` fields from the `Task` type
- All agent-related state from `AppContext` (agent filters, agent panel stack entries, etc.)
- `NodeType` values `'agent'` and `'sub-agent'`

### Kept
- `tasks` array
- `developers` array

### New
- `aiActive: boolean` — computed at runtime, not stored in JSON. Derived from a Supabase real-time subscription on `claude_events` filtered by `task_id`. True when there is an active Claude session tagged to that task.

---

## Sample Data

### Developer
| ID | Name | Initials | Role |
|----|------|----------|------|
| d1 | Advaith Nair | AN | Full-stack — PM tooling & AI integrations |

### Tasks
| ID | Title | Status | Priority | Assignee |
|----|-------|--------|----------|----------|
| t1 | Build Claude terminal plugin | done | critical | d1 |
| t2 | ClaudeStatusBar component | progress | high | d1 |
| t3 | SessionLog component | todo | high | d1 |
| t4 | Tickets-first MVP — hide board | progress | medium | d1 |
| t5 | Redesign sample data | progress | medium | d1 |
| t6 | Supabase real-time AI indicator | todo | high | d1 |

Tasks represent the actual work currently in progress on the Remake branch.

---

## UI Changes

### Board view
- Remove the `/board` link from `Header.tsx`
- Keep the route in `routes.tsx` (no breakage), but make it unreachable from navigation
- Default route `/` redirects to `/tickets`

### Tickets view
Each ticket card displays:
- Title + description
- Status badge + priority badge
- Assignee avatar (initials) + name
- **AI indicator:** a small pulsing dot labeled "Claude active" when `aiActive` is true; renders nothing when false

### Removed from UI
- Agent panel (`AgentPanel.tsx` — already deleted on Remake branch)
- Agent status bar (`AgentStatusBar.tsx` — already deleted)
- Agent-related filter dropdowns in `Header.tsx`

---

## Real-time AI Indicator

The tickets view subscribes to Supabase `claude_events` on mount. It listens for `INSERT` events where `phase != 'ended'` and maps active `task_id` values to a `Set<string>`. A ticket's `aiActive` is true if its ID is in that set. When a `stop` event fires (phase = 'ended'), the task ID is removed from the set.

This is read-only from the UI's perspective — the plugin writes, the UI reads.

---

## Files to Change

| File | Change |
|------|--------|
| `app/data/symphony-data.json` | Replace with new tasks + single developer, remove agents/subAgents |
| `app/types.ts` | Remove Agent, SubAgent, AgentNode, SubAgentNode; strip agentId/agentAssigned/assigneeType from Task |
| `app/context/AppContext.tsx` | Remove agent-related state and filters |
| `app/data/appData.ts` | Remove agent/subAgent exports, computeVisibleNodes, computeDefaultPositions, getRelatedNodeIds |
| `app/components/Header.tsx` | Remove board nav link, remove agent filter dropdowns |
| `app/components/TicketsView.tsx` | Add assignee display + live AI indicator via Supabase subscription |
| `app/routes.tsx` | Change default `/` to redirect to `/tickets` |
| `CLAUDE.md` | Update to reflect simplified stack and removed node types |
