# Project Setup Wizard — Design Spec

**Date:** 2026-04-16
**Status:** Approved

---

## Overview

When a user creates a new project in Symphony PM, a full-screen conversational
wizard automatically opens. The wizard uses Claude to ask questions and generate
tasks and developers before the board loads. When the user confirms or skips,
the board loads with the generated content already in place.

---

## User Flow

1. User opens NewProjectModal, enters a name, clicks "Create Project"
2. `createProject()` creates the DB record, clears board state, and sets
   `setupComplete = false`
3. After `loading` returns to `false` (LoadingSplash hides), the wizard
   appears as a full-screen overlay
4. Claude asks one focused question at a time; user answers in a textarea
5. Claude generates a JSON block (`<PROJECT_DATA>`) when the user confirms
6. A preview card shows the task/developer count; user clicks "Confirm & Create"
7. `injectSetupData()` writes devs + tasks to Supabase and updates React state
8. `setupComplete` becomes `true`, wizard animates out, board shows with data
9. Alternatively, "Skip Setup" skips step 6–7 and goes straight to an empty board

---

## Files Changed

| File | Change |
|------|--------|
| `app/data/db.ts` | Add `upsertDeveloper` |
| `app/types.ts` | Add `SetupTask`, `SetupDeveloper`, `ProjectSetupData` |
| `app/context/AppContext.tsx` | Add `injectSetupData`, `setupComplete`, `setSetupComplete`; patch `createProject` |
| `server/index.ts` | Add `POST /api/project/setup` endpoint |
| `app/components/ProjectSetupWizard.tsx` | New component — full-screen chat UI |
| `app/components/Root.tsx` | Conditionally render wizard |

---

## db.ts — upsertDeveloper

```ts
export async function upsertDeveloper(
  projectId: string,
  developer: AppDeveloper
): Promise<void>
```

Maps `AppDeveloper` to the existing `developers` table schema (`name`, `initials`,
`role`, `description`, `criteria`, `outputs`) and upserts. Called by
`injectSetupData` alongside `upsertTask`.

**Why this is required:** Tasks store a `developerId` FK. Without persisting
developers to Supabase, a page reload would produce tasks pointing to
non-existent developer rows, breaking task chains on the board.

---

## types.ts — New Types

```ts
export interface SetupTask {
  title: string;
  desc: string;
  status: StatusType;
  priority: PriorityType;
  dueDate?: string;
  assigneeType: 'dev' | 'agent';
  criteria?: string[];
}

export interface SetupDeveloper {
  name: string;
  initials: string;
  role: string;
  desc?: string;
}

export interface ProjectSetupData {
  tasks: SetupTask[];
  developers: SetupDeveloper[];
}
```

These are the lightweight input shapes the wizard produces. `injectSetupData`
converts them to full `AppTask` / `AppDeveloper` objects with generated IDs.

---

## AppContext additions

### New state
```ts
const [setupComplete, setSetupComplete] = useState(true);
```
Defaults `true` — existing projects load normally without triggering the wizard.

### createProject patch
After `setCheckedCriteria({})`, add:
```ts
setSetupComplete(false);
```

### injectSetupData
```ts
const injectSetupData = useCallback(async (data: ProjectSetupData) => {
  const projectId = projectIdRef.current;
  const ts = Date.now();

  const newDevs: AppDeveloper[] = data.developers.map((d, i) => ({
    id: `d-${ts}-${i}`,
    name: d.name,
    initials: d.initials,
    role: d.role,
    desc: d.desc,
  }));

  const newTasks: AppTask[] = data.tasks.map((t, i) => ({
    id: `t-${ts}-${i}`,
    title: t.title,
    desc: t.desc,
    status: t.status,
    priority: t.priority,
    dueDate: t.dueDate,
    developerId: newDevs[i % newDevs.length]?.id ?? '',
    assigneeType: t.assigneeType,
    agentAssigned: false,
    criteria: t.criteria ?? [],
    isCustom: true,
  }));

  setDevelopers(newDevs);
  setTasks(newTasks);

  const defaultVisible = computeVisibleNodes(
    { dev: '', type: '', status: '', priority: '' },
    newTasks, newDevs, [], []
  );
  setPositionsState(computeDefaultPositions(defaultVisible));

  await Promise.all([
    ...newDevs.map(d => upsertDeveloper(projectId, d)),
    ...newTasks.map(t => upsertTask(projectId, t, true)),
  ]);

  setSetupComplete(true);
}, []);
```

### Context type additions
```ts
injectSetupData: (data: ProjectSetupData) => Promise<void>;
setupComplete: boolean;
setSetupComplete: (v: boolean) => void;
```

---

## server/index.ts — POST /api/project/setup

- Accepts `{ messages, projectContext: { projectName, existingTasks, existingDevelopers } }`
- Builds a system prompt that defines conversation style and the `<PROJECT_DATA>` output contract
- Calls `claude-sonnet-4-6`, max_tokens 2048
- Parses the `<PROJECT_DATA>` XML block from the response if present
- Returns `{ text: string, projectData: ProjectSetupData | null }` — `text` has the XML block stripped

The system prompt instructs Claude to:
- Ask one focused question at a time
- Generate 3–8 tasks and 1–4 developers
- Only output `PROJECT_DATA` after explicit user confirmation
- Use due dates 1–4 weeks from today

---

## ProjectSetupWizard component

**Props:** `{ projectName: string; onComplete: (data: ProjectSetupData | null) => void }`

**State:** `messages`, `input`, `loading`, `pendingData`, `confirmed`

**Mount:** A single `useEffect` sends an empty messages array to the server,
which causes Claude to open with its first question. No duplicate fetches.

**Send:** Appends user message to history, POSTs full history to
`/api/project/setup`, appends assistant reply. If `projectData` is in the
response, stores in `pendingData`.

**Preview card:** Renders above the input when `pendingData !== null` and
`!confirmed`. Shows task + developer counts with "Confirm & Create" (green)
and "Keep Chatting" (muted) buttons.

**Layout:**
- Full-screen fixed overlay, `z-50`, background `rgba(7, 11, 20, 0.98)`
- Header: "Symphony PM / Project Setup" left, "Skip Setup" right
- Chat area: flex-1, scrollable, assistant bubbles left / user bubbles right
- Input area: sticky bottom, 1–3 row auto-resize textarea + SendHorizonal button
- Wrapped in `motion.div` with spring animation (fade + y: 20 → 0)

---

## Root.tsx wiring

```tsx
const { setupComplete, setSetupComplete, injectSetupData, activeProject } = useApp();

<AnimatePresence>
  {!setupComplete && activeProject && (
    <ProjectSetupWizard
      projectName={activeProject.name}
      onComplete={async (data) => {
        if (data) await injectSetupData(data);
        else setSetupComplete(true);
      }}
    />
  )}
</AnimatePresence>
```

No route changes. The wizard is a fixed overlay rendered inside `RootContent`
(which is inside `AppProvider`), so `useApp()` is available.

---

## Error handling

- Network error in wizard: display an inline error bubble, keep chat open
- `injectSetupData` DB failure: errors are thrown; Root's `onComplete` handler
  lets them propagate (the board will be empty but the wizard closes)
- Skip Setup: always works — just calls `setSetupComplete(true)`

---

## Existing-project safety

`setupComplete` defaults to `true`. The wizard is only shown when
`setupComplete === false`, which only happens inside `createProject`. Switching
projects, refreshing, or loading the app never sets `setupComplete = false`.

---

## TypeScript constraints

- `StatusType` is `'todo' | 'progress' | 'done' | 'blocked'` — `SetupTask.status` always `'todo'`
- `resolveJsonModule: true` already set — no tsconfig changes needed
- `framer-motion` is installed — `motion`, `AnimatePresence` available

---

## Verification checklist

- [ ] `npx tsc --noEmit` — zero errors
- [ ] `npx tsc -p server/tsconfig.json --noEmit` — zero errors
- [ ] `npm run build` — zero errors
- [ ] Create new project → wizard opens automatically
- [ ] Complete conversation → board loads with tasks + developers
- [ ] Page reload → tasks and developers both present (DB persisted)
- [ ] "Skip Setup" → empty board loads
- [ ] Switch to existing project → wizard does not appear
