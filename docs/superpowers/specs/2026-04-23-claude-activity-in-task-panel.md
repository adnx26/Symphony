# Claude Activity in Task Activity Tab

**Date:** 2026-04-23
**Project:** Symphony PM
**Status:** Approved

---

## Overview

Surface Claude Code session events inside the task detail panel's Activity tab. When Claude is working on a task, the events (exploring, implementing, running, etc.) filtered by that task's ID appear chronologically in the Activity tab, giving a real-time view of what Claude did on this specific ticket.

---

## Problem

The Activity tab currently always shows "No activity recorded yet." The `emitActivity` hook in AppContext is a no-op and `ActivityFeed` hardcodes an empty array. Claude Code events are the only real activity data available, stored in `ClaudeSessionContext.events`.

---

## Design

### Data source

`ClaudeSessionContext.events` (already available app-wide) filtered where `event.task_id === taskId`. No new data fetching required.

### Component change: `ActivityFeed.tsx`

- Import `useClaudeSession` from `ClaudeSessionContext`
- Filter `events` by `task_id === taskId` (the prop already passed in)
- Render filtered events in chronological order using the same row style as `SessionLog.tsx`: colored phase badge, tool name chip, summary text, relative timestamp
- Empty state: "No Claude activity for this task yet." if no matching events

### No schema or context changes needed

The `ClaudeEvent` data is already in memory via `ClaudeSessionContext`. The existing `taskId` prop on `ActivityFeed` is the filter key.

---

## Acceptance Criteria

- Activity tab shows Claude events for the current task, ordered oldest-first
- Phase shown as a colored badge matching the SessionLog style
- Tool name shown as a gray chip when present
- Summary text and relative timestamp shown per event
- Empty state shown when no events match the task ID
- Events update in real-time as new events arrive (no reload needed)

---

## Out of Scope

- Persisting task activity events (status changes, assignments) — `emitActivity` remains a no-op
- Historical events from past sessions
- Filtering or grouping within the tab
