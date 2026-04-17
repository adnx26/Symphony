# Project Setup Wizard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a full-screen conversational AI wizard that auto-opens when a user creates a new project, lets Claude generate tasks and developers through chat, and persists everything to Supabase before the board loads.

**Architecture:** Six files change (five modified, one created). A new `/api/project/setup` endpoint on the Express server handles Claude conversations. The React side adds three context values (`injectSetupData`, `setupComplete`, `setSetupComplete`) and a new `ProjectSetupWizard` component rendered as a fixed overlay from `Root.tsx`.

**Tech Stack:** React 19, TypeScript 5.5, Tailwind CSS v4, Framer Motion, Express + Anthropic SDK (`claude-sonnet-4-6`), Supabase

---

## File Map

| File | Action | Responsibility |
|------|--------|---------------|
| `app/data/db.ts` | Modify | Add `upsertDeveloper` — persist `AppDeveloper` to Supabase |
| `app/types.ts` | Modify | Add `SetupTask`, `SetupDeveloper`, `ProjectSetupData` |
| `app/context/AppContext.tsx` | Modify | Add `injectSetupData`, `setupComplete`, `setSetupComplete`; patch `createProject` |
| `server/index.ts` | Modify | Add `POST /api/project/setup` endpoint |
| `app/components/ProjectSetupWizard.tsx` | Create | Full-screen chat UI component |
| `app/components/Root.tsx` | Modify | Conditionally render wizard via `AnimatePresence` |

---

## Task 1: Add `upsertDeveloper` to db.ts

**Files:**
- Modify: `app/data/db.ts`

- [ ] **Step 1: Open `app/data/db.ts` and add `upsertDeveloper` after the existing `deleteTask` function (around line 239)**

Add this function:

```ts
export async function upsertDeveloper(
  projectId: string,
  developer: AppDeveloper
): Promise<void> {
  const { error } = await supabase.from('developers').upsert({
    project_id: projectId,
    id: developer.id,
    name: developer.name,
    initials: developer.initials,
    role: developer.role,
    description: developer.desc ?? '',
    criteria: developer.criteria ?? [],
    outputs: developer.outputs ?? [],
  });
  if (error) throw error;
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add app/data/db.ts
git commit -m "feat: add upsertDeveloper to db.ts"
```

---

## Task 2: Add setup types to types.ts

**Files:**
- Modify: `app/types.ts`

- [ ] **Step 1: Append the three new interfaces at the end of `app/types.ts`**

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

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add app/types.ts
git commit -m "feat: add SetupTask, SetupDeveloper, ProjectSetupData types"
```

---

## Task 3: Patch AppContext with wizard state and injectSetupData

**Files:**
- Modify: `app/context/AppContext.tsx`

- [ ] **Step 1: Add imports at the top of `app/context/AppContext.tsx`**

In the existing import from `'../types'`, add `SetupTask`, `SetupDeveloper`, `ProjectSetupData` (they are used in `injectSetupData`):

```ts
import {
  FilterState,
  PanelEntry,
  BoardPosition,
  VisibleNodes,
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  StatusType,
  PriorityType,
  AgentDispatchState,
  AgentDispatchRequest,
  AgentAction,
  ProjectSetupData,
} from '../types';
```

Also add `upsertDeveloper` to the import from `'../data/db'`:

```ts
import {
  fetchProjects,
  fetchProjectData,
  createProjectInDB,
  renameProjectInDB,
  upsertTask,
  upsertDeveloper,
  deleteTask as deleteTaskInDB,
  upsertPositions,
  upsertCheckedCriterion,
  fetchAgentTouched,
  fetchAgentActions,
  fetchDismissedActionKeys,
  fetchAgentDispatches,
  insertAgentTouched,
  upsertAgentDispatch,
} from '../data/db';
```

- [ ] **Step 2: Add three new entries to the `AppContextType` interface**

After `dbError: string | null;` (around line 105), add:

```ts
injectSetupData: (data: ProjectSetupData) => Promise<void>;
setupComplete: boolean;
setSetupComplete: (v: boolean) => void;
```

- [ ] **Step 3: Add `setupComplete` state inside `AppProvider`**

After the `const [dispatches, ...]` line (around line 172), add:

```ts
const [setupComplete, setSetupComplete] = useState(true);
```

- [ ] **Step 4: Patch `createProject` to set `setupComplete = false`**

Find the `createProject` callback. After `setCheckedCriteria({});`, add:

```ts
setSetupComplete(false);
```

The full updated callback:

```ts
const createProject = useCallback(async (name: string) => {
  setLoading(true);
  try {
    const newProject = await createProjectInDB(name);
    setProjects((prev) => [...prev, newProject]);
    projectIdRef.current = newProject.id;
    setActiveProjectId(newProject.id);
    setTasks([]);
    setDevelopers([]);
    setAgents([]);
    setSubAgents([]);
    setPositionsState({});
    setCheckedCriteria({});
    setSetupComplete(false);
  } finally {
    setLoading(false);
  }
}, []);
```

- [ ] **Step 5: Add `injectSetupData` callback after `renameProject`**

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

- [ ] **Step 6: Add three new entries to the context `value` object**

In the `const value: AppContextType = { ... }` block, add after `renameProject`:

```ts
injectSetupData,
setupComplete,
setSetupComplete,
```

- [ ] **Step 7: Verify TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 8: Commit**

```bash
git add app/context/AppContext.tsx
git commit -m "feat: add injectSetupData and setupComplete to AppContext"
```

---

## Task 4: Add /api/project/setup endpoint to server/index.ts

**Files:**
- Modify: `server/index.ts`

- [ ] **Step 1: Add the new endpoint after the existing `/api/agent/analyze` handler**

Insert before `const PORT = ...`:

```ts
app.post('/api/project/setup', async (req, res) => {
  try {
    const { messages, projectContext } = req.body as {
      messages: Array<{ role: 'user' | 'assistant'; content: string }>;
      projectContext: {
        projectName: string;
        existingTasks: number;
        existingDevelopers: number;
      };
    };

    const today = new Date().toISOString().slice(0, 10);

    const systemPrompt = `You are a project setup assistant for Symphony PM, a software project management tool. Your job is to help the user set up their new project "${projectContext.projectName}" by having a friendly conversation and generating structured project data.

CONVERSATION STYLE:
- Ask one focused question at a time
- Be concise and friendly
- After gathering enough information, generate the project structure
- Always confirm before finalizing

WHAT YOU CAN GENERATE:
- Tasks: software development tasks with title, description, priority (low/medium/high/critical), status (always start as 'todo'), due dates, and 3-6 acceptance criteria
- Developers: team members with name, role, initials (2 chars), and description

WHEN TO GENERATE:
- After the user has described their project and team, offer to generate the initial task breakdown
- Always show a summary of what you'll create and ask for confirmation
- After confirmation, output a special JSON block at the END of your message

JSON OUTPUT FORMAT (only when confirmed and ready to create):
Output this exact format at the very end of your message, after your conversational text:

<PROJECT_DATA>
{
  "tasks": [
    {
      "title": "string",
      "desc": "string",
      "status": "todo",
      "priority": "low|medium|high|critical",
      "dueDate": "YYYY-MM-DD",
      "assigneeType": "dev",
      "criteria": ["criterion 1", "criterion 2"]
    }
  ],
  "developers": [
    {
      "name": "string",
      "initials": "XX",
      "role": "string",
      "desc": "string"
    }
  ]
}
</PROJECT_DATA>

IMPORTANT RULES:
- Only output PROJECT_DATA when the user has explicitly confirmed
- Generate realistic, specific tasks — not generic placeholders
- Due dates should be 1-4 weeks from today (${today})
- Start the conversation by asking what kind of project this is
- Keep task count between 3-8 for a new project
- Keep developer count between 1-4`;

    const response = await client.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2048,
      system: systemPrompt,
      messages,
    });

    const text = response.content
      .filter(b => b.type === 'text')
      .map(b => (b as { type: 'text'; text: string }).text)
      .join('');

    const dataMatch = text.match(/<PROJECT_DATA>([\s\S]*?)<\/PROJECT_DATA>/);
    let projectData = null;
    if (dataMatch) {
      try {
        projectData = JSON.parse(dataMatch[1].trim());
      } catch {
        console.error('Failed to parse PROJECT_DATA');
      }
    }

    const cleanText = text.replace(/<PROJECT_DATA>[\s\S]*?<\/PROJECT_DATA>/, '').trim();

    res.json({ text: cleanText, projectData });
  } catch (err) {
    console.error('Project setup error:', err);
    res.status(500).json({ error: 'Setup request failed' });
  }
});
```

- [ ] **Step 2: Verify server TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc -p server/tsconfig.json --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add server/index.ts
git commit -m "feat: add /api/project/setup endpoint"
```

---

## Task 5: Create ProjectSetupWizard component

**Files:**
- Create: `app/components/ProjectSetupWizard.tsx`

- [ ] **Step 1: Create the file with the complete component**

```tsx
import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { SendHorizonal } from 'lucide-react';
import { ProjectSetupData } from '../types';

const PROXY_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/project/setup'
  : '/api/project/setup';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface ProjectSetupWizardProps {
  projectName: string;
  onComplete: (data: ProjectSetupData | null) => void;
}

export function ProjectSetupWizard({ projectName, onComplete }: ProjectSetupWizardProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingData, setPendingData] = useState<ProjectSetupData | null>(null);
  const [confirmed, setConfirmed] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll on new messages or loading state change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  // Fetch opening message on mount
  useEffect(() => {
    setLoading(true);
    fetch(PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messages: [],
        projectContext: { projectName, existingTasks: 0, existingDevelopers: 0 },
      }),
    })
      .then(r => r.json())
      .then(({ text, projectData }: { text: string; projectData: ProjectSetupData | null }) => {
        setMessages([{ role: 'assistant', content: text }]);
        if (projectData) setPendingData(projectData);
      })
      .catch(() => {
        setMessages([{
          role: 'assistant',
          content: `Hi! I'm here to help you set up "${projectName}". What kind of project is this?`,
        }]);
      })
      .finally(() => setLoading(false));
  // projectName is intentionally excluded — we only want this to run once on mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || loading) return;

    const newMessages: Message[] = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    setLoading(true);

    try {
      const res = await fetch(PROXY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: newMessages,
          projectContext: { projectName, existingTasks: 0, existingDevelopers: 0 },
        }),
      });
      const { text: replyText, projectData } = await res.json() as {
        text: string;
        projectData: ProjectSetupData | null;
      };
      setMessages(prev => [...prev, { role: 'assistant', content: replyText }]);
      if (projectData) setPendingData(projectData);
    } catch {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Sorry, I had trouble connecting. Please try again.',
      }]);
    } finally {
      setLoading(false);
    }
  }

  function handleConfirm() {
    if (pendingData) {
      setConfirmed(true);
      onComplete(pendingData);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  }

  return (
    <motion.div
      className="fixed inset-0 z-50 flex flex-col"
      style={{ backgroundColor: 'rgba(7, 11, 20, 0.98)', backdropFilter: 'blur(8px)' }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'spring', damping: 25, stiffness: 200 }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/10">
        <div>
          <span className="text-sm font-semibold text-white tracking-wide">Symphony PM</span>
          <span className="text-sm text-slate-500 ml-2">/ Project Setup</span>
        </div>
        <button
          onClick={() => onComplete(null)}
          className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
        >
          Skip Setup
        </button>
      </div>

      {/* Chat area */}
      <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-4 py-3 text-sm text-slate-200 leading-relaxed whitespace-pre-wrap rounded-2xl ${
                msg.role === 'user' ? 'rounded-tr-sm' : 'rounded-tl-sm'
              }`}
              style={
                msg.role === 'user'
                  ? {
                      background: 'rgba(109, 40, 217, 0.25)',
                      border: '1px solid rgba(139, 92, 246, 0.3)',
                    }
                  : {
                      background: 'rgba(20, 30, 48, 0.8)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }
              }
            >
              {msg.content}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div
              className="px-4 py-3 rounded-2xl rounded-tl-sm flex gap-1.5 items-center"
              style={{
                background: 'rgba(20, 30, 48, 0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
            >
              {[0, 1, 2].map(i => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                  style={{ animationDelay: `${i * 0.15}s` }}
                />
              ))}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Preview card */}
      {pendingData && !confirmed && (
        <div
          className="mx-6 mb-3 p-4 rounded-xl border border-emerald-500/30 flex items-center justify-between"
          style={{ background: 'rgba(16, 185, 129, 0.08)' }}
        >
          <div>
            <p className="text-xs text-emerald-400 font-medium mb-0.5">Ready to create:</p>
            <p className="text-sm text-slate-200">
              {pendingData.tasks.length} tasks, {pendingData.developers.length} developers
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPendingData(null)}
              className="px-3 py-1.5 rounded-lg text-xs text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              Keep Chatting
            </button>
            <button
              onClick={handleConfirm}
              className="px-3 py-1.5 rounded-lg text-xs font-medium text-emerald-900 transition-all"
              style={{ backgroundColor: '#10b981' }}
              onMouseEnter={e =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#059669')
              }
              onMouseLeave={e =>
                ((e.currentTarget as HTMLButtonElement).style.backgroundColor = '#10b981')
              }
            >
              Confirm & Create
            </button>
          </div>
        </div>
      )}

      {/* Input area */}
      <div className="px-6 pb-6 pt-3 border-t border-white/10 flex gap-3 items-end">
        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            e.target.style.height = 'auto';
            e.target.style.height = `${Math.min(e.target.scrollHeight, 96)}px`;
          }}
          onKeyDown={handleKeyDown}
          disabled={loading}
          placeholder="Describe your project, team, or ask me anything..."
          className="flex-1 resize-none rounded-xl px-4 py-3 text-sm text-slate-200 outline-none transition-colors disabled:opacity-40"
          style={{
            background: 'rgba(15, 23, 42, 0.6)',
            border: '1px solid rgba(255,255,255,0.1)',
            minHeight: '44px',
            maxHeight: '96px',
          }}
          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(99,102,241,0.6)')}
          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)')}
        />
        <button
          onClick={() => void handleSend()}
          disabled={loading || !input.trim()}
          className="p-3 rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          style={{ backgroundColor: '#1e40af', color: '#bfdbfe' }}
          onMouseEnter={e => {
            if (!loading && input.trim())
              (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1d4ed8';
          }}
          onMouseLeave={e => {
            (e.currentTarget as HTMLButtonElement).style.backgroundColor = '#1e40af';
          }}
        >
          <SendHorizonal className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 3: Commit**

```bash
git add app/components/ProjectSetupWizard.tsx
git commit -m "feat: add ProjectSetupWizard component"
```

---

## Task 6: Wire wizard into Root.tsx

**Files:**
- Modify: `app/components/Root.tsx`

- [ ] **Step 1: Add imports**

At the top of `app/components/Root.tsx`, add the new import:

```ts
import { ProjectSetupWizard } from './ProjectSetupWizard';
```

`AnimatePresence` is already imported. `useApp` is already imported.

- [ ] **Step 2: Destructure new context values in `RootContent`**

Change the existing destructure:

```ts
const { panelStack, closePanel, loading: dataLoading, dbError, allTasks, updateTaskStatus } = useApp();
```

To:

```ts
const {
  panelStack, closePanel, loading: dataLoading, dbError, allTasks, updateTaskStatus,
  setupComplete, setSetupComplete, injectSetupData, activeProject,
} = useApp();
```

- [ ] **Step 3: Add the wizard inside the existing `AnimatePresence` block**

`Root.tsx` already has an `AnimatePresence` block wrapping `BlockerModal`. Add the wizard to the same `AnimatePresence`:

```tsx
<AnimatePresence>
  {!setupComplete && activeProject && (
    <ProjectSetupWizard
      projectName={activeProject.name}
      onComplete={async (data) => {
        if (data) {
          await injectSetupData(data);
        } else {
          setSetupComplete(true);
        }
      }}
    />
  )}
  {blockerTask && (
    <BlockerModal
      task={blockerTask}
      onSave={(taskId, reason) => {
        updateTaskStatus(taskId, 'blocked', reason);
        setBlockerTaskId(null);
      }}
      onResolve={(taskId) => {
        updateTaskStatus(taskId, 'progress');
        setBlockerTaskId(null);
      }}
      onClose={() => setBlockerTaskId(null)}
    />
  )}
</AnimatePresence>
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc --noEmit
```

Expected: zero errors.

- [ ] **Step 5: Verify server TypeScript**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npx tsc -p server/tsconfig.json --noEmit
```

Expected: zero errors.

- [ ] **Step 6: Full build check**

```bash
cd /Users/advaithnair/Documents/Projects/Anvent/PM-Project && npm run build
```

Expected: zero errors, dist/ produced.

- [ ] **Step 7: Commit**

```bash
git add app/components/Root.tsx
git commit -m "feat: wire ProjectSetupWizard into Root"
```

---

## Final verification

- [ ] Run `npm run dev:full`
- [ ] Create a new project — confirm wizard opens full-screen automatically
- [ ] Have a short conversation, confirm project data, click "Confirm & Create"
- [ ] Confirm board loads with generated tasks and developers
- [ ] Reload the page — confirm tasks AND developers are still present (DB persisted)
- [ ] Create a second project, click "Skip Setup" — confirm empty board loads
- [ ] Switch to an existing project — confirm wizard does NOT appear
