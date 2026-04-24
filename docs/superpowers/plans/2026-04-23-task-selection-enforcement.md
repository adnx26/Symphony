# Task Selection Enforcement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Block every Claude Code session from proceeding until the developer explicitly selects a task via a CLI command.

**Architecture:** A `UserPromptSubmit` hook intercepts every user message before Claude sees it. If no task is selected for the current session it exits with code 2 (Claude Code's "block this action" signal), saves the session ID to local state, and prints a formatted task picker. A standalone `select-task.js` CLI reads the saved session ID, validates the task ID against `symphony-data.json`, writes it to `.session-state.json`, and updates Supabase — after which the next message passes the hook check.

**Tech Stack:** Node.js (CommonJS), `@supabase/supabase-js` v2, Claude Code `UserPromptSubmit` hook, Node built-in test runner.

---

## File Map

| File | Change | Responsibility |
|------|--------|----------------|
| `plugin/hooks/user-prompt-submit.js` | Create | Blocking hook — checks session state, prints task picker, exits 2 |
| `plugin/select-task.js` | Create | CLI — validates task ID, writes session state, updates Supabase |
| `plugin/test/select-task.test.js` | Create | Unit tests for `findTask` |
| `plugin/install.js` | Modify | Register `UserPromptSubmit` hook |

---

## Task 1: `user-prompt-submit.js` Hook

**Files:**
- Create: `plugin/hooks/user-prompt-submit.js`

- [ ] **Step 1: Create `plugin/hooks/user-prompt-submit.js`**

  ```js
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const supabase = require('../lib/supabase-client');
  const { getState, setState } = require('../lib/session-state');

  const DATA_PATH = path.join(__dirname, '../../app/data/symphony-data.json');
  const PLUGIN_DIR = path.join(__dirname, '..');

  function loadData() {
    try {
      return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    } catch {
      return { tasks: [], developers: [] };
    }
  }

  function formatTaskList(data) {
    const tasks = data.tasks || [];
    const developers = data.developers || [];
    const devMap = {};
    for (const d of developers) devMap[d.id] = d.name;

    const selectCmd = `node ${path.join(PLUGIN_DIR, 'select-task.js')}`;
    const exampleId = tasks[0]?.id || 't1';

    const lines = [
      '╔═══════════════════════════════════════════════════╗',
      '║  Symphony PM — Task Required                      ║',
      '╚═══════════════════════════════════════════════════╝',
      '',
      'No task is selected for this session.',
      '',
      'Available tasks:',
    ];

    for (const task of tasks) {
      const id = (task.id || '').padEnd(5);
      const title = (task.title || '').slice(0, 38).padEnd(38);
      const status = `[${task.status || 'unknown'}]`.padEnd(14);
      const dev = devMap[task.developerId] || '';
      lines.push(`  ${id}  ${title}  ${status}  ${dev}`);
    }

    lines.push('');
    lines.push('Select a task to continue:');
    lines.push(`  ! ${selectCmd} <task-id>`);
    lines.push('');
    lines.push('Example:');
    lines.push(`  ! ${selectCmd} ${exampleId}`);

    return lines.join('\n');
  }

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

    // Task already selected for this session — allow through
    if (state.session_id === session_id && state.active_task_id) {
      process.exit(0);
    }

    // New session or no task — save session ID and block
    if (state.session_id !== session_id) {
      setState({ session_id, active_task_id: null });
      await supabase
        .from('claude_sessions')
        .upsert({ id: session_id, project: 'PM-Project' }, { onConflict: 'id' });
    }

    const data = loadData();
    console.log(formatTaskList(data));
    process.exit(2);
  }

  main().catch((err) => {
    console.error('[symphony-plugin] user-prompt-submit error:', err.message);
    process.exit(2); // still block on error — never let an unselected session through
  });
  ```

- [ ] **Step 2: Smoke-test the hook with no task set**

  First, ensure `.session-state.json` has no task selected:
  ```bash
  echo '{"session_id":null,"active_task_id":null}' > plugin/.session-state.json
  ```

  Then run:
  ```bash
  echo '{"session_id":"test-abc","prompt":"help me refactor this"}' | node plugin/hooks/user-prompt-submit.js; echo "exit: $?"
  ```

  Expected: prints the task picker block, then `exit: 2`.

- [ ] **Step 3: Smoke-test the hook with a task already set**

  ```bash
  echo '{"session_id":"test-abc","active_task_id":"t1"}' > plugin/.session-state.json
  echo '{"session_id":"test-abc","prompt":"help me refactor this"}' | node plugin/hooks/user-prompt-submit.js; echo "exit: $?"
  ```

  Expected: prints nothing, `exit: 0`.

- [ ] **Step 4: Commit**

  ```bash
  git add plugin/hooks/user-prompt-submit.js
  git commit -m "feat: add UserPromptSubmit hook to block sessions without a task"
  ```

---

## Task 2: `select-task.js` CLI

**Files:**
- Create: `plugin/select-task.js`
- Create: `plugin/test/select-task.test.js`

- [ ] **Step 1: Write failing tests**

  Create `plugin/test/select-task.test.js`:

  ```js
  'use strict';

  const { test } = require('node:test');
  const assert = require('node:assert/strict');
  const { findTask } = require('../select-task');

  const TASKS = [
    { id: 't1', title: 'Build Auth API', status: 'progress' },
    { id: 't2', title: 'Design System', status: 'todo' },
    { id: 't3', title: 'DB Migration', status: 'blocked' },
  ];

  test('findTask returns matching task', () => {
    assert.deepEqual(findTask(TASKS, 't2'), TASKS[1]);
  });

  test('findTask returns null for unknown id', () => {
    assert.equal(findTask(TASKS, 't99'), null);
  });

  test('findTask returns null for empty array', () => {
    assert.equal(findTask([], 't1'), null);
  });

  test('findTask is case-sensitive', () => {
    assert.equal(findTask(TASKS, 'T1'), null);
  });
  ```

- [ ] **Step 2: Run tests — expect FAIL (module not found)**

  ```bash
  cd plugin && node --test test/select-task.test.js 2>&1 | head -10
  ```

  Expected: `Error: Cannot find module '../select-task'`

- [ ] **Step 3: Create `plugin/select-task.js`**

  ```js
  'use strict';

  const fs = require('fs');
  const path = require('path');
  const supabase = require('./lib/supabase-client');
  const { getState, setState } = require('./lib/session-state');

  const DATA_PATH = path.join(__dirname, '../app/data/symphony-data.json');

  function loadTasks() {
    const data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
    return data.tasks || [];
  }

  /**
   * Find a task by ID in a tasks array.
   * @param {Array<{id:string}>} tasks
   * @param {string} id
   * @returns {object|null}
   */
  function findTask(tasks, id) {
    return tasks.find((t) => t.id === id) || null;
  }

  async function main() {
    const taskId = process.argv[2];

    if (!taskId) {
      console.error('Usage: node select-task.js <task-id>');
      console.error('Example: node select-task.js t1');
      process.exit(1);
    }

    let tasks;
    try {
      tasks = loadTasks();
    } catch (err) {
      console.error('[symphony-plugin] Could not read task data:', err.message);
      process.exit(1);
    }

    const task = findTask(tasks, taskId);
    if (!task) {
      const validIds = tasks.map((t) => t.id).join(', ');
      console.error(`Task "${taskId}" not found.`);
      console.error(`Valid IDs: ${validIds}`);
      process.exit(1);
    }

    const state = getState();
    if (!state.session_id) {
      console.error('[symphony-plugin] No active session found.');
      console.error('Start Claude Code first — the task picker will appear on your first message.');
      process.exit(1);
    }

    setState({ session_id: state.session_id, active_task_id: taskId });

    const { error } = await supabase
      .from('claude_sessions')
      .update({ active_task_id: taskId })
      .eq('id', state.session_id);

    if (error) {
      console.error('[symphony-plugin] Supabase update error:', error.message);
      // Local state is set — session can proceed even if Supabase update failed
    }

    console.log(`✓ Task selected: ${taskId} — ${task.title}`);
    console.log('  You can now send your first message to Claude.');
  }

  main().catch((err) => {
    console.error('[symphony-plugin] select-task error:', err.message);
    process.exit(1);
  });

  module.exports = { findTask };
  ```

- [ ] **Step 4: Run tests — expect all pass**

  ```bash
  cd plugin && node --test test/select-task.test.js
  ```

  Expected: 4 tests, all `✓`, zero failures.

- [ ] **Step 5: Smoke-test the CLI — invalid task ID**

  ```bash
  echo '{"session_id":"test-abc","active_task_id":null}' > plugin/.session-state.json
  node plugin/select-task.js t99
  ```

  Expected:
  ```
  Task "t99" not found.
  Valid IDs: t1, t2, t3, ...
  ```
  Exit code 1.

- [ ] **Step 6: Smoke-test the CLI — valid task ID**

  ```bash
  echo '{"session_id":"test-abc","active_task_id":null}' > plugin/.session-state.json
  node plugin/select-task.js t1
  ```

  Expected:
  ```
  ✓ Task selected: t1 — Build Claude terminal plugin
    You can now send your first message to Claude.
  ```
  Exit code 0. Verify `.session-state.json` now contains `"active_task_id": "t1"`.

- [ ] **Step 7: Commit**

  ```bash
  git add plugin/select-task.js plugin/test/select-task.test.js
  git commit -m "feat: add select-task CLI and findTask tests"
  ```

---

## Task 3: Register `UserPromptSubmit` in `install.js`

**Files:**
- Modify: `plugin/install.js`

- [ ] **Step 1: Add `UserPromptSubmit` to `hookDefs`**

  In `plugin/install.js`, replace:
  ```js
  const hookDefs = [
    ['PostToolUse', 'post-tool-use.js'],
    ['Notification', 'notification.js'],
    ['Stop', 'stop.js'],
  ];
  ```

  With:
  ```js
  const hookDefs = [
    ['UserPromptSubmit', 'user-prompt-submit.js'],
    ['PostToolUse', 'post-tool-use.js'],
    ['Notification', 'notification.js'],
    ['Stop', 'stop.js'],
  ];
  ```

- [ ] **Step 2: Update the confirmation log lines at the bottom of `install.js`**

  Replace:
  ```js
  console.log('✓ Hooks registered in .claude/settings.json');
  console.log('  PostToolUse →', path.join(pluginDir, 'hooks/post-tool-use.js'));
  console.log('  Notification →', path.join(pluginDir, 'hooks/notification.js'));
  console.log('  Stop →', path.join(pluginDir, 'hooks/stop.js'));
  ```

  With:
  ```js
  console.log('✓ Hooks registered in .claude/settings.json');
  console.log('  UserPromptSubmit →', path.join(pluginDir, 'hooks/user-prompt-submit.js'));
  console.log('  PostToolUse →', path.join(pluginDir, 'hooks/post-tool-use.js'));
  console.log('  Notification →', path.join(pluginDir, 'hooks/notification.js'));
  console.log('  Stop →', path.join(pluginDir, 'hooks/stop.js'));
  ```

- [ ] **Step 3: Run the installer**

  ```bash
  node plugin/install.js
  ```

  Expected output:
  ```
  ✓ Hooks registered in .claude/settings.json
    UserPromptSubmit → /absolute/path/plugin/hooks/user-prompt-submit.js
    PostToolUse → /absolute/path/plugin/hooks/post-tool-use.js
    Notification → /absolute/path/plugin/hooks/notification.js
    Stop → /absolute/path/plugin/hooks/stop.js
  ```

- [ ] **Step 4: Verify `.claude/settings.json`**

  ```bash
  cat .claude/settings.json | grep -A5 '"UserPromptSubmit"'
  ```

  Expected: a `UserPromptSubmit` entry with the absolute path to `user-prompt-submit.js`.

- [ ] **Step 5: Commit**

  ```bash
  git add plugin/install.js .claude/settings.json
  git commit -m "feat: register UserPromptSubmit hook in installer"
  ```

---

## Task 4: End-to-End Verification

- [ ] **Step 1: Reset session state**

  ```bash
  echo '{"session_id":null,"active_task_id":null}' > plugin/.session-state.json
  ```

- [ ] **Step 2: Simulate a blocked first message**

  ```bash
  echo '{"session_id":"e2e-verify","prompt":"let us fix that bug"}' | node plugin/hooks/user-prompt-submit.js; echo "exit code: $?"
  ```

  Expected: task picker prints with all tasks listed, exit code 2.
  Also verify `.session-state.json` now has `"session_id": "e2e-verify"` and `"active_task_id": null`.

- [ ] **Step 3: Select a task**

  ```bash
  node plugin/select-task.js t2
  ```

  Expected: `✓ Task selected: t2 — ClaudeStatusBar component`
  Verify `.session-state.json` has `"active_task_id": "t2"`.

- [ ] **Step 4: Confirm the hook now passes**

  ```bash
  echo '{"session_id":"e2e-verify","prompt":"let us fix that bug"}' | node plugin/hooks/user-prompt-submit.js; echo "exit code: $?"
  ```

  Expected: no output, exit code 0.

- [ ] **Step 5: Confirm invalid task ID is rejected**

  ```bash
  echo '{"session_id":null,"active_task_id":null}' > plugin/.session-state.json
  echo '{"session_id":"e2e-verify","prompt":"hello"}' | node plugin/hooks/user-prompt-submit.js > /dev/null
  node plugin/select-task.js t999; echo "exit code: $?"
  ```

  Expected: error message listing valid IDs, exit code 1. `.session-state.json` still has `"active_task_id": null`.

---

## Self-Review

**Spec coverage:**
- ✓ Block at session start — `UserPromptSubmit` hook, exit 2
- ✓ Session ID persisted when blocking — hook writes to `.session-state.json` before exiting
- ✓ Task list shown with developer names — `formatTaskList` joins `developers` array
- ✓ Absolute path in picker command — `path.join(PLUGIN_DIR, 'select-task.js')` is resolved absolute
- ✓ Validate task ID before accepting — `findTask` returns null for unknown IDs, script exits 1
- ✓ Update Supabase on selection — `select-task.js` calls `claude_sessions.update`
- ✓ No bypass path — error handler in hook also exits 2
- ✓ Mid-session `#t3` switching unaffected — Notification hook unchanged
- ✓ `install.js` updated — `UserPromptSubmit` added to `hookDefs`

**Placeholder scan:** No TBDs, no "implement later", all code blocks are complete.

**Type consistency:** `findTask(tasks, id)` signature consistent between `select-task.js` definition and `select-task.test.js` usage. `getState`/`setState` signatures match existing `session-state.js` API. `supabase.from(...).update(...)` pattern matches existing hooks.
