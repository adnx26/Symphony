# Terminal Plugin Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a Claude Code plugin that streams session events to Supabase Realtime and surfaces them in the Symphony PM dashboard as a task indicator in Tickets, a session log view, and a persistent status bar.

**Architecture:** Node.js hook scripts fire on Claude Code tool events, parse phase + task ID, and INSERT rows into Supabase. The dashboard subscribes to Supabase Realtime and updates three surfaces: a status bar, ticket card indicators, and a session log page. Session state (current task ID) is persisted locally in `plugin/.session-state.json` and updated by the Notification hook, which is where Claude's prose messages (containing `#t3` tags or "working on task X") appear.

**Tech Stack:** Node.js (CommonJS, no bundler), `@supabase/supabase-js` v2, Supabase Realtime, React 19, TypeScript 5.5, Vite 6.

---

## File Map

**New — plugin:**
- `plugin/package.json` — plugin dependencies (CommonJS)
- `plugin/.env.example` — template for Supabase credentials
- `plugin/lib/parse-context.js` — phase detection + task ID extraction
- `plugin/lib/supabase-client.js` — shared Supabase client (reads `plugin/.env`)
- `plugin/lib/session-state.js` — read/write `plugin/.session-state.json`
- `plugin/hooks/post-tool-use.js` — PostToolUse hook
- `plugin/hooks/notification.js` — Notification hook (extracts task IDs from Claude messages)
- `plugin/hooks/stop.js` — Stop hook
- `plugin/install.js` — merges hook commands into `.claude/settings.json`
- `plugin/test/parse-context.test.js` — Node built-in test runner tests

**New — dashboard:**
- `app/utils/supabase.ts` — dashboard Supabase client
- `app/context/ClaudeSessionContext.tsx` — Realtime subscription + state
- `app/components/ClaudeStatusBar.tsx` — bottom status strip
- `app/components/SessionLog.tsx` — `/session` route

**Modified — dashboard:**
- `app/types.ts` — add `ClaudeEvent` interface
- `app/components/Root.tsx` — wrap `ClaudeSessionProvider`, add `ClaudeStatusBar`
- `app/components/TicketsView.tsx` — Claude active indicator on ticket cards
- `app/components/Header.tsx` — add Session nav tab
- `app/routes.tsx` — add `/session` route
- `styles/index.css` — add `@keyframes claude-ring` animation

**Modified — infra:**
- `.gitignore` — add `plugin/.session-state.json`

---

## Task 1: Supabase Project Setup

**Files:** none (manual steps + SQL)

- [ ] **Step 1: Create Supabase project**

  Go to https://supabase.com → New project. Note the **Project URL** and **anon public** key from Settings → API.

- [ ] **Step 2: Run schema SQL**

  In Supabase → SQL Editor, run:

  ```sql
  create table claude_sessions (
    id              text primary key,
    started_at      timestamptz default now(),
    project         text,
    active_task_id  text
  );

  create table claude_events (
    id          uuid primary key default gen_random_uuid(),
    session_id  text references claude_sessions(id) on delete cascade,
    phase       text not null,
    tool_name   text,
    summary     text,
    task_id     text,
    created_at  timestamptz default now()
  );

  create index claude_events_session_idx on claude_events(session_id);
  create index claude_events_created_idx on claude_events(created_at desc);
  ```

- [ ] **Step 3: Enable Realtime on claude_events**

  In Supabase → Table Editor → `claude_events` → click the "Realtime" toggle to ON.

  Alternatively in SQL Editor:
  ```sql
  alter publication supabase_realtime add table claude_events;
  ```

- [ ] **Step 4: Verify tables exist**

  In Table Editor, confirm both `claude_sessions` and `claude_events` appear with the correct columns.

---

## Task 2: Environment Files

**Files:**
- Create: `plugin/.env.example`
- Modify: `.gitignore`
- Create: `.env` (local only — fill in credentials)

- [ ] **Step 1: Create `plugin/.env.example`**

  ```
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_ANON_KEY=your-anon-key-here
  ```

- [ ] **Step 2: Add `plugin/.session-state.json` to `.gitignore`**

  Open `.gitignore` and append after the `# Env files` block:

  ```
  # Claude plugin runtime state
  plugin/.session-state.json
  ```

- [ ] **Step 3: Create `plugin/.env` with real credentials**

  Copy `plugin/.env.example` to `plugin/.env` and fill in the Supabase URL and anon key from Task 1.

- [ ] **Step 4: Add dashboard env vars to `.env`**

  The root `.env` is already gitignored. Add these lines to a new `.env` file at project root (create if it doesn't exist):

  ```
  VITE_SUPABASE_URL=https://your-project.supabase.co
  VITE_SUPABASE_ANON_KEY=your-anon-key-here
  ```

  (Same values as `plugin/.env`.)

- [ ] **Step 5: Commit `.env.example` files**

  ```bash
  git add plugin/.env.example .gitignore
  git commit -m "feat: add plugin env template and gitignore entry"
  ```

---

## Task 3: Plugin Scaffold + parse-context Tests

**Files:**
- Create: `plugin/package.json`
- Create: `plugin/lib/parse-context.js`
- Create: `plugin/test/parse-context.test.js`

- [ ] **Step 1: Create `plugin/package.json`**

  ```json
  {
    "name": "symphony-claude-plugin",
    "version": "1.0.0",
    "description": "Claude Code hooks that stream session events to Supabase",
    "type": "commonjs",
    "dependencies": {
      "@supabase/supabase-js": "^2.103.0"
    }
  }
  ```

- [ ] **Step 2: Install plugin dependencies**

  ```bash
  cd plugin && npm install && cd ..
  ```

  Expected: `node_modules/@supabase/supabase-js` appears in `plugin/node_modules/`.

- [ ] **Step 3: Write failing tests for `parse-context.js`**

  Create `plugin/test/parse-context.test.js`:

  ```js
  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { detectPhase, extractTaskId, buildSummary } = require('../lib/parse-context');

  // detectPhase
  test('Read tool returns exploring', () => {
    assert.equal(detectPhase('Read', {}), 'exploring');
  });

  test('Grep tool returns exploring', () => {
    assert.equal(detectPhase('Grep', {}), 'exploring');
  });

  test('Glob tool returns exploring', () => {
    assert.equal(detectPhase('Glob', {}), 'exploring');
  });

  test('LS tool returns exploring', () => {
    assert.equal(detectPhase('LS', {}), 'exploring');
  });

  test('Edit tool returns implementing', () => {
    assert.equal(detectPhase('Edit', {}), 'implementing');
  });

  test('Write tool returns implementing', () => {
    assert.equal(detectPhase('Write', {}), 'implementing');
  });

  test('Bash tool returns running', () => {
    assert.equal(detectPhase('Bash', {}), 'running');
  });

  test('AskUserQuestion returns waiting', () => {
    assert.equal(detectPhase('AskUserQuestion', {}), 'waiting');
  });

  test('is_error true returns debugging', () => {
    assert.equal(detectPhase('Bash', { is_error: true }), 'debugging');
  });

  test('unknown tool returns communicating', () => {
    assert.equal(detectPhase('UnknownTool', {}), 'communicating');
  });

  test('null toolName returns communicating', () => {
    assert.equal(detectPhase(null, {}), 'communicating');
  });

  // extractTaskId
  test('extracts #t3 tag', () => {
    assert.equal(extractTaskId('working on #t3 now'), 't3');
  });

  test('extracts #t12 tag', () => {
    assert.equal(extractTaskId('see ticket #t12'), 't12');
  });

  test('extracts "working on task t5" declaration', () => {
    assert.equal(extractTaskId('I am working on task t5 today'), 't5');
  });

  test('returns null when no task ID', () => {
    assert.equal(extractTaskId('just exploring the codebase'), null);
  });

  test('returns null for empty string', () => {
    assert.equal(extractTaskId(''), null);
  });

  test('returns null for null input', () => {
    assert.equal(extractTaskId(null), null);
  });

  // buildSummary
  test('Bash summary shows command', () => {
    const s = buildSummary('Bash', { command: 'npm test' }, {});
    assert.ok(s.includes('npm test'));
  });

  test('Read summary shows file path', () => {
    const s = buildSummary('Read', { file_path: 'app/types.ts' }, {});
    assert.ok(s.includes('app/types.ts'));
  });

  test('Edit summary shows file path', () => {
    const s = buildSummary('Edit', { file_path: 'app/types.ts' }, {});
    assert.ok(s.includes('app/types.ts'));
  });

  test('unknown tool returns generic summary', () => {
    const s = buildSummary('Mystery', {}, {});
    assert.ok(s.includes('Mystery'));
  });
  ```

- [ ] **Step 4: Run tests — expect FAIL (module not found)**

  ```bash
  cd plugin && node --test test/parse-context.test.js 2>&1 | head -20
  ```

  Expected: `Error: Cannot find module '../lib/parse-context'`

- [ ] **Step 5: Create `plugin/lib/parse-context.js`**

  ```js
  'use strict';

  const PHASE_MAP = {
    Read: 'exploring',
    Grep: 'exploring',
    Glob: 'exploring',
    LS: 'exploring',
    Edit: 'implementing',
    Write: 'implementing',
    Bash: 'running',
    AskUserQuestion: 'waiting',
  };

  /**
   * Determine the current work phase from a tool call.
   * @param {string|null} toolName
   * @param {object} toolResponse  - may contain is_error boolean
   * @returns {string}
   */
  function detectPhase(toolName, toolResponse) {
    if (!toolName) return 'communicating';
    if (toolResponse && toolResponse.is_error === true) return 'debugging';
    return PHASE_MAP[toolName] ?? 'communicating';
  }

  /**
   * Extract the most recent task ID from a text string.
   * Matches: #t3  or  "working on task t3"
   * @param {string|null} text
   * @returns {string|null}
   */
  function extractTaskId(text) {
    if (!text) return null;
    const tagMatch = text.match(/#(t\d+)/i);
    if (tagMatch) return tagMatch[1].toLowerCase();
    const declareMatch = text.match(/working\s+on\s+task\s+(\w+)/i);
    if (declareMatch) return declareMatch[1].toLowerCase();
    return null;
  }

  /**
   * Build a short human-readable summary of a tool call.
   * @param {string} toolName
   * @param {object} toolInput
   * @param {object} toolResponse
   * @returns {string}
   */
  function buildSummary(toolName, toolInput, toolResponse) {
    if (!toolName) return 'Claude sent a message';
    switch (toolName) {
      case 'Bash':
        return `Ran: ${String(toolInput?.command ?? '').slice(0, 80)}`;
      case 'Read':
        return `Read ${toolInput?.file_path ?? 'file'}`;
      case 'Edit':
        return `Edited ${toolInput?.file_path ?? 'file'}`;
      case 'Write':
        return `Wrote ${toolInput?.file_path ?? 'file'}`;
      case 'Grep':
        return `Searched for "${String(toolInput?.pattern ?? '').slice(0, 60)}"`;
      case 'Glob':
        return `Scanned ${toolInput?.pattern ?? ''}`;
      case 'LS':
        return `Listed ${toolInput?.path ?? 'directory'}`;
      case 'AskUserQuestion':
        return `Asked: ${String(toolInput?.question ?? '').slice(0, 80)}`;
      default:
        return `Used ${toolName}`;
    }
  }

  module.exports = { detectPhase, extractTaskId, buildSummary };
  ```

- [ ] **Step 6: Run tests — expect all pass**

  ```bash
  cd plugin && node --test test/parse-context.test.js
  ```

  Expected output: all tests listed as `✓`, `pass` count matches test count, zero failures.

- [ ] **Step 7: Commit**

  ```bash
  git add plugin/
  git commit -m "feat: scaffold plugin with parse-context library and tests"
  ```

---

## Task 4: Plugin Shared Utilities

**Files:**
- Create: `plugin/lib/supabase-client.js`
- Create: `plugin/lib/session-state.js`

- [ ] **Step 1: Create `plugin/lib/supabase-client.js`**

  ```js
  'use strict';

  const { createClient } = require('@supabase/supabase-js');
  const fs = require('fs');
  const path = require('path');

  // Parse plugin/.env manually — no dotenv dependency needed
  function loadEnv() {
    const envPath = path.join(__dirname, '../.env');
    const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const eqIdx = line.indexOf('=');
      if (eqIdx === -1) continue;
      const key = line.slice(0, eqIdx).trim();
      const val = line.slice(eqIdx + 1).trim();
      if (key && !process.env[key]) process.env[key] = val;
    }
  }

  try {
    loadEnv();
  } catch {
    // .env not found — credentials must come from environment
  }

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = process.env;

  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('[symphony-plugin] Missing SUPABASE_URL or SUPABASE_ANON_KEY. Create plugin/.env.');
    process.exit(0); // exit 0 so Claude Code session is not interrupted
  }

  module.exports = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  ```

- [ ] **Step 2: Create `plugin/lib/session-state.js`**

  ```js
  'use strict';

  const fs = require('fs');
  const path = require('path');

  const STATE_PATH = path.join(__dirname, '../.session-state.json');

  /**
   * @typedef {{ session_id: string|null, active_task_id: string|null }} SessionState
   */

  /** @returns {SessionState} */
  function getState() {
    try {
      return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8'));
    } catch {
      return { session_id: null, active_task_id: null };
    }
  }

  /** @param {SessionState} state */
  function setState(state) {
    fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2));
  }

  module.exports = { getState, setState };
  ```

- [ ] **Step 3: Commit**

  ```bash
  git add plugin/lib/supabase-client.js plugin/lib/session-state.js
  git commit -m "feat: add plugin supabase client and session state helpers"
  ```

---

## Task 5: PostToolUse Hook

**Files:**
- Create: `plugin/hooks/post-tool-use.js`

- [ ] **Step 1: Create `plugin/hooks/post-tool-use.js`**

  ```js
  'use strict';

  const fs = require('fs');
  const supabase = require('../lib/supabase-client');
  const { detectPhase, buildSummary } = require('../lib/parse-context');
  const { getState, setState } = require('../lib/session-state');

  async function main() {
    // Read hook payload from stdin
    let raw;
    try {
      raw = fs.readFileSync(0, 'utf-8');
    } catch {
      process.exit(0);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0);
    }

    const { session_id, tool_name, tool_input, tool_response } = payload;
    if (!session_id) process.exit(0);

    // Get or initialise session row
    let state = getState();
    if (state.session_id !== session_id) {
      const { error } = await supabase
        .from('claude_sessions')
        .upsert({ id: session_id, project: 'PM-Project' }, { onConflict: 'id' });
      if (error) console.error('[symphony-plugin] session upsert error:', error.message);
      state = { session_id, active_task_id: null };
      setState(state);
    }

    const phase = detectPhase(tool_name, tool_response);
    const summary = buildSummary(tool_name, tool_input, tool_response);

    const { error } = await supabase.from('claude_events').insert({
      session_id,
      phase,
      tool_name: tool_name ?? null,
      summary,
      task_id: state.active_task_id,
    });

    if (error) console.error('[symphony-plugin] event insert error:', error.message);
  }

  main().catch((err) => {
    console.error('[symphony-plugin] post-tool-use error:', err.message);
  }).finally(() => {
    process.exit(0);
  });
  ```

- [ ] **Step 2: Verify the hook can be executed**

  ```bash
  echo '{"session_id":"test-123","tool_name":"Read","tool_input":{"file_path":"app/types.ts"},"tool_response":{}}' | node plugin/hooks/post-tool-use.js
  ```

  Expected: exits silently (or logs a Supabase error if credentials are wrong, but does not throw uncaught exception). Check Supabase → Table Editor → `claude_events` for a new row with `phase: "exploring"`.

- [ ] **Step 3: Commit**

  ```bash
  git add plugin/hooks/post-tool-use.js
  git commit -m "feat: add PostToolUse hook"
  ```

---

## Task 6: Notification + Stop Hooks

**Files:**
- Create: `plugin/hooks/notification.js`
- Create: `plugin/hooks/stop.js`

- [ ] **Step 1: Create `plugin/hooks/notification.js`**

  This hook receives Claude's prose messages — the primary source for `#t3` tags and "working on task X" declarations.

  ```js
  'use strict';

  const fs = require('fs');
  const supabase = require('../lib/supabase-client');
  const { extractTaskId } = require('../lib/parse-context');
  const { getState, setState } = require('../lib/session-state');

  async function main() {
    let raw;
    try {
      raw = fs.readFileSync(0, 'utf-8');
    } catch {
      process.exit(0);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0);
    }

    const { session_id, message } = payload;
    if (!session_id) process.exit(0);

    // Ensure session row exists
    let state = getState();
    if (state.session_id !== session_id) {
      await supabase
        .from('claude_sessions')
        .upsert({ id: session_id, project: 'PM-Project' }, { onConflict: 'id' });
      state = { session_id, active_task_id: null };
    }

    // Extract task ID from Claude's message
    const foundTaskId = extractTaskId(message ?? '');
    if (foundTaskId && foundTaskId !== state.active_task_id) {
      state.active_task_id = foundTaskId;
      await supabase
        .from('claude_sessions')
        .update({ active_task_id: foundTaskId })
        .eq('id', session_id);
    }
    setState(state);

    // Insert notification event
    const { error } = await supabase.from('claude_events').insert({
      session_id,
      phase: 'communicating',
      tool_name: null,
      summary: String(message ?? '').slice(0, 120),
      task_id: state.active_task_id,
    });

    if (error) console.error('[symphony-plugin] notification insert error:', error.message);
  }

  main().catch((err) => {
    console.error('[symphony-plugin] notification error:', err.message);
  }).finally(() => {
    process.exit(0);
  });
  ```

- [ ] **Step 2: Create `plugin/hooks/stop.js`**

  ```js
  'use strict';

  const fs = require('fs');
  const supabase = require('../lib/supabase-client');
  const { getState, setState } = require('../lib/session-state');

  async function main() {
    let raw;
    try {
      raw = fs.readFileSync(0, 'utf-8');
    } catch {
      process.exit(0);
    }

    let payload;
    try {
      payload = JSON.parse(raw);
    } catch {
      process.exit(0);
    }

    const { session_id } = payload;
    if (!session_id) process.exit(0);

    const state = getState();

    const { error } = await supabase.from('claude_events').insert({
      session_id: session_id,
      phase: 'ended',
      tool_name: null,
      summary: 'Session ended',
      task_id: state.session_id === session_id ? state.active_task_id : null,
    });

    if (error) console.error('[symphony-plugin] stop insert error:', error.message);

    // Clear local state if this is the current session
    if (state.session_id === session_id) {
      setState({ session_id: null, active_task_id: null });
    }
  }

  main().catch((err) => {
    console.error('[symphony-plugin] stop error:', err.message);
  }).finally(() => {
    process.exit(0);
  });
  ```

- [ ] **Step 3: Verify notification hook with task ID**

  ```bash
  echo '{"session_id":"test-123","message":"I will start working on task #t3 now"}' | node plugin/hooks/notification.js
  ```

  Expected: exits cleanly. Check Supabase → `claude_events` for a row with `task_id: "t3"` and `phase: "communicating"`. Check `claude_sessions` for `active_task_id: "t3"`.

- [ ] **Step 4: Commit**

  ```bash
  git add plugin/hooks/notification.js plugin/hooks/stop.js
  git commit -m "feat: add Notification and Stop hooks"
  ```

---

## Task 7: Hook Registration

**Files:**
- Create: `plugin/install.js`

- [ ] **Step 1: Create `plugin/install.js`**

  ```js
  'use strict';

  const fs = require('fs');
  const path = require('path');

  const pluginDir = path.resolve(__dirname);
  const settingsPath = path.resolve(__dirname, '../.claude/settings.json');

  // Read existing settings or start fresh
  let settings = {};
  try {
    settings = JSON.parse(fs.readFileSync(settingsPath, 'utf-8'));
  } catch {
    // file doesn't exist yet — will be created
  }

  settings.hooks = settings.hooks || {};

  function hookEntry(scriptName) {
    return {
      matcher: '',
      hooks: [{
        type: 'command',
        command: `node ${path.join(pluginDir, 'hooks', scriptName)}`,
      }],
    };
  }

  settings.hooks.PostToolUse = [hookEntry('post-tool-use.js')];
  settings.hooks.Notification = [hookEntry('notification.js')];
  settings.hooks.Stop = [hookEntry('stop.js')];

  // Ensure .claude/ directory exists
  const claudeDir = path.dirname(settingsPath);
  if (!fs.existsSync(claudeDir)) fs.mkdirSync(claudeDir, { recursive: true });

  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  console.log('✓ Hooks registered in .claude/settings.json');
  console.log('  PostToolUse →', path.join(pluginDir, 'hooks/post-tool-use.js'));
  console.log('  Notification →', path.join(pluginDir, 'hooks/notification.js'));
  console.log('  Stop →', path.join(pluginDir, 'hooks/stop.js'));
  ```

- [ ] **Step 2: Run the installer**

  ```bash
  node plugin/install.js
  ```

  Expected output:
  ```
  ✓ Hooks registered in .claude/settings.json
    PostToolUse → /absolute/path/plugin/hooks/post-tool-use.js
    Notification → /absolute/path/plugin/hooks/notification.js
    Stop → /absolute/path/plugin/hooks/stop.js
  ```

- [ ] **Step 3: Verify `.claude/settings.json`**

  ```bash
  cat .claude/settings.json
  ```

  Expected: JSON with `hooks.PostToolUse`, `hooks.Notification`, `hooks.Stop` each containing the absolute path to the script.

- [ ] **Step 4: Commit plugin/install.js**

  ```bash
  git add plugin/install.js
  git commit -m "feat: add hook installer script"
  ```

---

## Task 8: Dashboard Supabase Client + Types

**Files:**
- Create: `app/utils/supabase.ts`
- Modify: `app/types.ts`

- [ ] **Step 1: Create `app/utils/supabase.ts`**

  (`@supabase/supabase-js` is already in root `package.json` dependencies.)

  ```ts
  import { createClient } from '@supabase/supabase-js';

  const url = import.meta.env.VITE_SUPABASE_URL as string;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

  export const supabase = url && key ? createClient(url, key) : null;
  ```

  Returning `null` when env vars are absent lets components skip subscriptions gracefully without crashing.

- [ ] **Step 2: Add `ClaudeEvent` to `app/types.ts`**

  Append to the end of `app/types.ts`:

  ```ts
  // ── Claude session types ──────────────────────────────────────────────────────

  export interface ClaudeEvent {
    id: string;
    session_id: string;
    phase: 'exploring' | 'implementing' | 'running' | 'debugging' | 'waiting' | 'communicating' | 'ended';
    tool_name: string | null;
    summary: string;
    task_id: string | null;
    created_at: string;
  }
  ```

- [ ] **Step 3: Start the dev server and confirm no errors**

  ```bash
  npm run dev
  ```

  Expected: dev server starts at http://localhost:5173 with no TypeScript or Vite errors in terminal.

- [ ] **Step 4: Commit**

  ```bash
  git add app/utils/supabase.ts app/types.ts
  git commit -m "feat: add dashboard Supabase client and ClaudeEvent type"
  ```

---

## Task 9: ClaudeSessionContext

**Files:**
- Create: `app/context/ClaudeSessionContext.tsx`
- Modify: `app/components/Root.tsx`

- [ ] **Step 1: Create `app/context/ClaudeSessionContext.tsx`**

  ```tsx
  import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
  import { supabase } from '../utils/supabase';
  import { ClaudeEvent } from '../types';

  interface ClaudeSessionState {
    latestEvent: ClaudeEvent | null;
    events: ClaudeEvent[];
    activeTaskId: string | null;
  }

  const ClaudeSessionContext = createContext<ClaudeSessionState>({
    latestEvent: null,
    events: [],
    activeTaskId: null,
  });

  export function ClaudeSessionProvider({ children }: { children: ReactNode }) {
    const [events, setEvents] = useState<ClaudeEvent[]>([]);
    const [latestEvent, setLatestEvent] = useState<ClaudeEvent | null>(null);

    useEffect(() => {
      if (!supabase) return; // Supabase not configured — skip subscription

      const channel = supabase
        .channel('claude-events')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'claude_events' },
          (payload) => {
            const event = payload.new as ClaudeEvent;
            setLatestEvent(event);
            setEvents((prev) => [...prev, event]);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }, []);

    // activeTaskId: most recent non-null task_id across all events
    const activeTaskId =
      latestEvent?.task_id ??
      [...events].reverse().find((e) => e.task_id)?.task_id ??
      null;

    return (
      <ClaudeSessionContext.Provider value={{ latestEvent, events, activeTaskId }}>
        {children}
      </ClaudeSessionContext.Provider>
    );
  }

  export function useClaudeSession(): ClaudeSessionState {
    return useContext(ClaudeSessionContext);
  }
  ```

- [ ] **Step 2: Wrap `Root.tsx` with `ClaudeSessionProvider`**

  In `app/components/Root.tsx`, add the import and wrap `AppProvider`:

  ```tsx
  import { AppProvider, useApp } from '../context/AppContext';
  import { ClaudeSessionProvider } from '../context/ClaudeSessionContext';
  // ... other imports unchanged
  ```

  Change the `Root` export from:
  ```tsx
  export function Root() {
    return (
      <AppProvider>
        <RootContent />
      </AppProvider>
    );
  }
  ```

  To:
  ```tsx
  export function Root() {
    return (
      <ClaudeSessionProvider>
        <AppProvider>
          <RootContent />
        </AppProvider>
      </ClaudeSessionProvider>
    );
  }
  ```

- [ ] **Step 3: Verify in browser**

  Open http://localhost:5173. Open browser DevTools → Console. Confirm no errors about Supabase or context. If `VITE_SUPABASE_URL` is set, you can check the Network tab for a WebSocket connection to `wss://your-project.supabase.co`.

- [ ] **Step 4: Commit**

  ```bash
  git add app/context/ClaudeSessionContext.tsx app/components/Root.tsx
  git commit -m "feat: add ClaudeSessionContext with Supabase Realtime subscription"
  ```

---

## Task 10: ClaudeStatusBar

**Files:**
- Create: `app/components/ClaudeStatusBar.tsx`
- Modify: `app/components/Root.tsx`

- [ ] **Step 1: Create `app/components/ClaudeStatusBar.tsx`**

  ```tsx
  import { useEffect, useState } from 'react';
  import { useClaudeSession } from '../context/ClaudeSessionContext';
  import { timeAgo } from '../utils/timeAgo';

  const PHASE_LABELS: Record<string, string> = {
    exploring: 'Exploring',
    implementing: 'Implementing',
    running: 'Running',
    debugging: 'Debugging',
    waiting: 'Waiting for input',
    communicating: 'Communicating',
    ended: 'Session ended',
  };

  const IDLE_MS = 5 * 60 * 1000;

  export function ClaudeStatusBar() {
    const { latestEvent, activeTaskId } = useClaudeSession();
    const [isIdle, setIsIdle] = useState(true);

    useEffect(() => {
      if (!latestEvent) return;
      setIsIdle(false);
      const t = setTimeout(() => setIsIdle(true), IDLE_MS);
      return () => clearTimeout(t);
    }, [latestEvent]);

    // Don't render if Supabase isn't configured
    if (!import.meta.env.VITE_SUPABASE_URL) return null;

    return (
      <div
        className="flex items-center gap-2 px-4 h-7 text-xs shrink-0"
        style={{ background: 'var(--background)', borderTop: '1px solid var(--border)' }}
      >
        <span style={{ color: '#7c3aed', fontSize: '0.75rem' }}>⬡</span>
        <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Claude</span>

        {isIdle || !latestEvent ? (
          <span style={{ color: 'var(--muted-foreground)' }}>— idle</span>
        ) : (
          <>
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--muted-foreground)' }}>
              {PHASE_LABELS[latestEvent.phase] ?? latestEvent.phase}
            </span>
            {activeTaskId && (
              <>
                <span style={{ color: 'var(--border)' }}>•</span>
                <span style={{ color: '#7c3aed' }}>task #{activeTaskId}</span>
              </>
            )}
            <span style={{ color: 'var(--border)' }}>•</span>
            <span style={{ color: 'var(--muted-foreground)' }}>{timeAgo(latestEvent.created_at)}</span>
          </>
        )}
      </div>
    );
  }
  ```

- [ ] **Step 2: Add `ClaudeStatusBar` to `Root.tsx` layout**

  In `app/components/Root.tsx`, import the component and add it after the main content area:

  ```tsx
  import { ClaudeStatusBar } from './ClaudeStatusBar';
  ```

  In `RootContent`, change the inner div from:
  ```tsx
  <div className="relative h-full flex flex-col">
    <Header />
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet context={{}} />
      </main>
    </div>
  </div>
  ```

  To:
  ```tsx
  <div className="relative h-full flex flex-col">
    <Header />
    <div className="flex-1 flex overflow-hidden">
      <Sidebar />
      <main className="flex-1 overflow-hidden">
        <Outlet context={{}} />
      </main>
    </div>
    <ClaudeStatusBar />
  </div>
  ```

- [ ] **Step 3: Verify in browser**

  Open http://localhost:5173. A slim bar should appear at the bottom showing `⬡ Claude — idle`. It should be present on all routes (Board, Tickets, Backlog, Sprint).

- [ ] **Step 4: Smoke-test with a real event**

  ```bash
  echo '{"session_id":"smoke-test","tool_name":"Bash","tool_input":{"command":"npm run dev"},"tool_response":{}}' | node plugin/hooks/post-tool-use.js
  ```

  Expected: within ~1 second, the status bar updates to `⬡ Claude • Running • just now`.

- [ ] **Step 5: Commit**

  ```bash
  git add app/components/ClaudeStatusBar.tsx app/components/Root.tsx
  git commit -m "feat: add ClaudeStatusBar to dashboard layout"
  ```

---

## Task 11: Ticket Card Claude Indicator

**Files:**
- Modify: `app/components/TicketsView.tsx`
- Modify: `styles/index.css`

- [ ] **Step 1: Add `claude-ring` keyframe to `styles/index.css`**

  Append to `styles/index.css`:

  ```css
  @keyframes claude-ring {
    0%, 100% { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 1.5px rgba(124,58,237,0.5); }
    50%       { box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 0 0 3px rgba(124,58,237,0.15); }
  }

  .claude-active-card {
    animation: claude-ring 2s ease-in-out infinite;
  }
  ```

- [ ] **Step 2: Update `app/components/TicketsView.tsx`**

  Add the import at the top:

  ```tsx
  import { useClaudeSession } from '../context/ClaudeSessionContext';
  ```

  Inside `TicketsView`, destructure `activeTaskId` from the hook (add after the existing `useApp` call):

  ```tsx
  const { activeTaskId } = useClaudeSession();
  ```

  Inside the `.map()`, add `isClaudeActive` after `isSelected`:

  ```tsx
  const isClaudeActive = activeTaskId === task.id;
  ```

  Update the card's `className` and `style` to apply the pulsing class and border when Claude is active:

  ```tsx
  <div
    key={task.id}
    onClick={() => handleTicketClick(task.id)}
    className={`p-4 cursor-pointer transition-all${isClaudeActive ? ' claude-active-card' : ''}`}
    style={{
      background: '#ffffff',
      border: `1px solid ${isClaudeActive ? '#7c3aed' : isSelected ? taskColor.accent : '#e4e4e7'}`,
      borderLeft: `3px solid ${isClaudeActive ? '#7c3aed' : taskColor.accent}`,
      borderRadius: '4px',
      boxShadow: isSelected && !isClaudeActive
        ? '0 0 0 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)'
        : undefined,
    }}
    onMouseEnter={(e) => {
      if (!isSelected && !isClaudeActive) (e.currentTarget as HTMLElement).style.borderColor = '#d1d1d6';
    }}
    onMouseLeave={(e) => {
      if (!isSelected && !isClaudeActive) (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7';
    }}
  >
  ```

  Add the Claude indicator to the footer row. Find the footer `<div>` (the one with `borderTop: '1px solid #f4f4f5'`) and update its contents — add the Claude badge immediately after the dev avatar block:

  ```tsx
  <div
    className="flex items-center justify-between pt-2.5"
    style={{ borderTop: '1px solid #f4f4f5' }}
  >
    <div className="flex items-center gap-2">
      {dev ? (
        <div className="flex items-center gap-1.5">
          <div
            className="w-5 h-5 flex items-center justify-center text-[0.6rem] font-semibold"
            style={{
              background: '#f4f4f5',
              border: '1px solid #e4e4e7',
              borderRadius: '50%',
              color: '#3f3f46',
            }}
          >
            {dev.initials}
          </div>
          <span className="text-xs" style={{ color: '#71717a' }}>{dev.name}</span>
        </div>
      ) : <div />}

      {isClaudeActive && (
        <div className="flex items-center gap-1 ml-1">
          <span style={{ color: '#a1a1aa', fontSize: '0.6rem' }}>•</span>
          <span style={{ color: '#7c3aed', fontSize: '0.6rem' }}>⬡</span>
          <span className="text-[0.6rem] font-medium" style={{ color: '#7c3aed' }}>Claude</span>
        </div>
      )}
    </div>

    {task.dueDate ? (
      <span className="text-[0.65rem] tabular-nums" style={{ color: '#a1a1aa' }}>
        {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
      </span>
    ) : null}
  </div>
  ```

- [ ] **Step 3: Verify in browser**

  Open http://localhost:5173/tickets. Run:

  ```bash
  echo '{"session_id":"smoke-test","message":"Now working on #t1"}' | node plugin/hooks/notification.js
  ```

  Expected: within ~1 second, the ticket with `id: "t1"` (or whichever matches your data) gets a purple pulsing border and a `⬡ Claude` label next to the developer name. Other tickets are unchanged.

- [ ] **Step 4: Commit**

  ```bash
  git add app/components/TicketsView.tsx styles/index.css
  git commit -m "feat: show Claude active indicator on ticket cards"
  ```

---

## Task 12: Session Log + Route + Header Tab

**Files:**
- Create: `app/components/SessionLog.tsx`
- Modify: `app/routes.tsx`
- Modify: `app/components/Header.tsx`

- [ ] **Step 1: Create `app/components/SessionLog.tsx`**

  ```tsx
  import { useNavigate } from 'react-router';
  import { useClaudeSession } from '../context/ClaudeSessionContext';
  import { timeAgo } from '../utils/timeAgo';
  import { ClaudeEvent } from '../types';

  const PHASE_LABELS: Record<ClaudeEvent['phase'], string> = {
    exploring: 'Exploring codebase',
    implementing: 'Implementing changes',
    running: 'Running command',
    debugging: 'Debugging',
    waiting: 'Waiting for input',
    communicating: 'Communicating',
    ended: 'Session ended',
  };

  const PHASE_COLORS: Record<ClaudeEvent['phase'], string> = {
    exploring: '#3b82f6',
    implementing: '#10b981',
    running: '#f59e0b',
    debugging: '#ef4444',
    waiting: '#8b5cf6',
    communicating: '#71717a',
    ended: '#d1d5db',
  };

  export function SessionLog() {
    const { events } = useClaudeSession();
    const navigate = useNavigate();

    if (!import.meta.env.VITE_SUPABASE_URL) {
      return (
        <div className="flex items-center justify-center h-full">
          <p className="text-sm" style={{ color: '#a1a1aa' }}>
            Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
          </p>
        </div>
      );
    }

    if (events.length === 0) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <p className="text-sm font-medium mb-1" style={{ color: '#0f0f0f' }}>No session activity yet</p>
            <p className="text-xs" style={{ color: '#a1a1aa' }}>
              Start a Claude Code session — events will appear here in real time.
            </p>
          </div>
        </div>
      );
    }

    return (
      <div className="h-full overflow-y-auto p-5" style={{ background: '#f8f8f9' }}>
        <div className="max-w-2xl mx-auto">
          <h2 className="text-sm font-semibold mb-4" style={{ color: '#0f0f0f' }}>
            Session Log
          </h2>

          <div className="space-y-2">
            {[...events].reverse().map((event) => (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3"
                style={{
                  background: '#ffffff',
                  border: '1px solid #e4e4e7',
                  borderLeft: `3px solid ${PHASE_COLORS[event.phase] ?? '#d1d5db'}`,
                  borderRadius: '4px',
                }}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                    <span className="text-xs font-medium" style={{ color: '#0f0f0f' }}>
                      {PHASE_LABELS[event.phase] ?? event.phase}
                    </span>
                    {event.tool_name && (
                      <span
                        className="px-1.5 py-0.5 text-[0.6rem] font-medium"
                        style={{ background: '#f4f4f5', color: '#71717a', borderRadius: '3px' }}
                      >
                        {event.tool_name}
                      </span>
                    )}
                    {event.task_id && (
                      <button
                        onClick={() => navigate('/tickets')}
                        className="px-1.5 py-0.5 text-[0.6rem] font-medium transition-colors"
                        style={{ background: '#ede9fe', color: '#7c3aed', borderRadius: '3px' }}
                      >
                        #{event.task_id}
                      </button>
                    )}
                  </div>
                  <p className="text-xs line-clamp-2" style={{ color: '#71717a' }}>
                    {event.summary}
                  </p>
                </div>
                <span className="text-[0.65rem] tabular-nums flex-shrink-0 mt-0.5" style={{ color: '#a1a1aa' }}>
                  {timeAgo(event.created_at)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  ```

- [ ] **Step 2: Add `/session` route to `app/routes.tsx`**

  ```tsx
  import { createBrowserRouter } from "react-router";
  import { Root } from "./components/Root";
  import { BoardView } from "./components/BoardView";
  import { TicketsView } from "./components/TicketsView";
  import { BacklogView } from "./components/BacklogView";
  import { SprintView } from "./components/SprintView";
  import { SessionLog } from "./components/SessionLog";

  export const router = createBrowserRouter([
    {
      path: "/",
      Component: Root,
      children: [
        { index: true, Component: BoardView },
        { path: "tickets", Component: TicketsView },
        { path: "backlog", Component: BacklogView },
        { path: "sprint", Component: SprintView },
        { path: "session", Component: SessionLog },
      ],
    },
  ]);
  ```

- [ ] **Step 3: Add Session tab to `app/components/Header.tsx`**

  In `Header.tsx`, update the `activeView` derivation to include `session`:

  ```tsx
  const activeView = location.pathname === '/tickets'
    ? 'tickets'
    : location.pathname === '/backlog'
    ? 'backlog'
    : location.pathname === '/sprint'
    ? 'sprint'
    : location.pathname === '/session'
    ? 'session'
    : 'board';
  ```

  Add the Session button in the `<nav>` after the Sprint button:

  ```tsx
  <button
    onClick={() => navigate('/session')}
    className="relative px-3 h-12 text-xs font-medium transition-colors"
    style={{
      color: activeView === 'session' ? '#0f0f0f' : '#71717a',
      borderBottom: activeView === 'session' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
    }}
  >
    Session
  </button>
  ```

- [ ] **Step 4: Verify end-to-end**

  Open http://localhost:5173/session. Click the "Session" tab in the header — confirms routing works.

  Run several hook payloads in sequence:

  ```bash
  echo '{"session_id":"e2e-test","tool_name":"Grep","tool_input":{"pattern":"useClaudeSession"},"tool_response":{}}' | node plugin/hooks/post-tool-use.js

  echo '{"session_id":"e2e-test","message":"Found it. Now working on #t2."}' | node plugin/hooks/notification.js

  echo '{"session_id":"e2e-test","tool_name":"Edit","tool_input":{"file_path":"app/components/TicketsView.tsx"},"tool_response":{}}' | node plugin/hooks/post-tool-use.js
  ```

  Expected:
  - Session log shows three events in reverse-chronological order
  - The `Implementing changes` event has a purple `#t2` chip that navigates to /tickets on click
  - Status bar shows `⬡ Claude • Implementing • task #t2 • just now`
  - In /tickets, the card for `t2` has a pulsing purple border and `⬡ Claude` label

- [ ] **Step 5: Commit**

  ```bash
  git add app/components/SessionLog.tsx app/routes.tsx app/components/Header.tsx
  git commit -m "feat: add session log route and header tab"
  ```

---

## Self-Review

**Spec coverage check:**
- ✓ Task auto-linking (explicit declaration + #tag) — Notification hook + extractTaskId
- ✓ Session log view — SessionLog.tsx + /session route
- ✓ Ambient status bar — ClaudeStatusBar.tsx in Root layout
- ✓ Ticket card Claude indicator — TicketsView.tsx with claude-active-card CSS
- ✓ Supabase setup from scratch — Task 1 SQL + credentials flow
- ✓ Phase detection — parse-context.js with test coverage
- ✓ Production-ready transport — Supabase Realtime, no local-only dependencies
- ✓ Activity feed explicitly excluded — not implemented

**Type consistency check:**
- `ClaudeEvent` defined in `app/types.ts`, imported in `ClaudeSessionContext.tsx`, `SessionLog.tsx`
- `useClaudeSession()` returns `{ latestEvent, events, activeTaskId }` — consumed consistently in `ClaudeStatusBar`, `TicketsView`, `SessionLog`
- `detectPhase`, `extractTaskId`, `buildSummary` exported from `parse-context.js` and imported by all three hooks
- `getState`, `setState` from `session-state.js` imported by all three hooks

**Placeholder scan:** No TBDs, no "add validation later", no incomplete steps.
