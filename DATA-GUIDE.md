# Symphony PM — Data Guide

All board data lives in one file:

```
app/data/symphony-data.json
```

Open it in any text editor, save, and the app will reload with your changes automatically (hot-reload is active while `npm run dev` is running).

---

## File structure

```json
{
  "tasks":     [ ...task objects ],
  "developers": [ ...developer objects ],
  "agents":    [ ...agent objects ],
  "subAgents": [ ...sub-agent objects ]
}
```

---

## Tasks

```json
{
  "id":           "t7",
  "title":        "Short display name",
  "desc":         "One-line description shown on the card",
  "overview":     "Longer explanation shown in the detail panel",
  "status":       "todo",
  "priority":     "high",
  "dueDate":      "2026-05-01",
  "developerId":  "d1",
  "agentId":      "a2",
  "assigneeType": "dev",
  "agentAssigned": true,
  "criteria": [
    "First acceptance criterion",
    "Second acceptance criterion"
  ]
}
```

| Field | Required | Valid values |
|-------|----------|-------------|
| `id` | ✅ | Any unique string, e.g. `"t7"` |
| `title` | ✅ | Any string |
| `desc` | ✅ | Any string |
| `overview` | ✅ | Any string |
| `status` | ✅ | `"todo"` · `"progress"` · `"done"` · `"blocked"` |
| `priority` | ✅ | `"critical"` · `"high"` · `"medium"` · `"low"` |
| `dueDate` | ✅ | `"YYYY-MM-DD"` format |
| `developerId` | ✅ | Must match an `id` in `developers` |
| `agentId` | ✅ | Must match an `id` in `agents` |
| `assigneeType` | ✅ | `"dev"` — task is human-owned · `"agent"` — task is agent-owned |
| `agentAssigned` | ✅ | `true` if this task has an AI agent helping the dev; `false` otherwise |
| `criteria` | ✅ | Array of strings (acceptance criteria checklist) |

**Rule of thumb for `assigneeType` / `agentAssigned`:**
- Dev does the work, agent assists → `"assigneeType": "dev"`, `"agentAssigned": true`
- Agent does the work autonomously → `"assigneeType": "agent"`, `"agentAssigned": false`
- Pure dev work, no agent → `"assigneeType": "dev"`, `"agentAssigned": false`

---

## Developers

```json
{
  "id":       "d4",
  "name":     "Dana Lee",
  "initials": "DL",
  "role":     "Mobile engineer",
  "desc":     "Owns the iOS and Android clients.",
  "criteria": [ "PR merged", "Tests green" ],
  "outputs":  [ "Merged pull requests" ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | ✅ | Unique string, referenced by tasks |
| `name` | ✅ | Full display name |
| `initials` | ✅ | 2–3 characters shown in the avatar circle |
| `role` | ✅ | Short role title |
| `desc` | ✅ | Longer description shown in the detail panel |
| `criteria` | ✅ | Done-checklist for this developer |
| `outputs` | ✅ | List of deliverable types |

---

## Agents

```json
{
  "id":          "a5",
  "name":        "DocBot",
  "type":        "Documentation",
  "developerId": "d4",
  "desc":        "Auto-generates API docs from JSDoc comments.",
  "criteria":    [ "Docs published", "No broken links" ],
  "outputs":     [ "Generated docs site" ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | ✅ | Unique string |
| `name` | ✅ | Display name |
| `type` | ✅ | Category label (free text, e.g. `"QA"`, `"Design"`, `"DevOps"`) — used by the Type filter |
| `developerId` | ✅ | Must match an `id` in `developers` (the human who oversees this agent) |
| `desc` | ✅ | Description shown in the detail panel |
| `criteria` | ✅ | Done-checklist |
| `outputs` | ✅ | List of deliverable types |

---

## Sub-Agents

```json
{
  "id":       "sa6",
  "name":     "APIDocGen",
  "type":     "Doc Generator",
  "parentId": "a5",
  "desc":     "Extracts JSDoc comments and publishes them to the docs site.",
  "criteria": [ "Docs built without errors", "All endpoints documented" ],
  "outputs":  [ "HTML docs bundle" ]
}
```

| Field | Required | Notes |
|-------|----------|-------|
| `id` | ✅ | Unique string |
| `name` | ✅ | Display name |
| `type` | ✅ | Sub-type label |
| `parentId` | ✅ | Must match an `id` in `agents` |
| `desc` | ✅ | Description |
| `criteria` | ✅ | Done-checklist |
| `outputs` | ✅ | Deliverables |

---

## Adding a complete new workflow (step-by-step)

1. **Add a developer** (if they don't already exist) — pick a new `id` like `"d4"`.
2. **Add an agent** supervised by that developer — pick `"a5"`, set `"developerId": "d4"`.
3. **Add sub-agents** under that agent — pick `"sa6"`, `"sa7"`, set `"parentId": "a5"`.
4. **Add a task** linking everything together — set `"developerId": "d4"`, `"agentId": "a5"`, choose `assigneeType` and `agentAssigned` as needed.

> IDs must be **globally unique** across all four arrays. If two items share an ID the board will behave unexpectedly.

---

## Resetting the board layout

If you move nodes around on the canvas and want to go back to the default grid layout, click the **Reset Layout** button in the top toolbar.

Node positions are saved to your browser's local storage, so they persist between page refreshes. The JSON file only controls *what* nodes exist, not *where* they are on the canvas.
