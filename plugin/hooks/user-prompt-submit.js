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

function buildAdditionalContext(data) {
  const tasks = data.tasks || [];
  const developers = data.developers || [];
  const devMap = {};
  for (const d of developers) devMap[d.id] = d.name;

  const selectCmd = `node ${path.join(PLUGIN_DIR, 'select-task.js')}`;

  const taskLines = tasks.map((task) => {
    const id = task.id || '';
    const title = task.title || '';
    const status = task.status || 'unknown';
    const dev = devMap[task.developerId] || '';
    return `  ${id} — ${title} [${status}]${dev ? ` (${dev})` : ''}`;
  });

  return [
    'SYSTEM: No task is selected for this session.',
    'You MUST use the AskUserQuestion tool to ask the user which task they want to work on before responding to their message.',
    'Show them this list and ask them to choose a task ID:',
    '',
    ...taskLines,
    '',
    `Once the user provides a task ID, use the Bash tool to run: ${selectCmd} <task-id>`,
    'Then proceed with their original request.',
  ].join('\n');
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
  const data = loadData();

  // Task already selected for this session — validate it still exists in data
  if (state.session_id === session_id && state.active_task_id) {
    const taskValid = (data.tasks || []).some((t) => t.id === state.active_task_id);
    if (taskValid) {
      process.exit(0);
    }
    // Task ID in state is invalid/stale — clear it and fall through to block
    setState({ session_id, active_task_id: null });
  }

  // New session or no task — save session ID and prompt for task
  if (state.session_id !== session_id) {
    setState({ session_id, active_task_id: null });
    const { error: upsertError } = await supabase
      .from('claude_sessions')
      .upsert({ id: session_id, project: 'PM-Project' }, { onConflict: 'id' });
    if (upsertError) console.error('[symphony-plugin] session upsert error:', upsertError.message);
  }

  console.log(JSON.stringify({ additionalContext: buildAdditionalContext(data) }));
  process.exit(0);
}

main().catch((err) => {
  console.error('[symphony-plugin] user-prompt-submit error:', err.message);
  process.exit(0); // fail open on infrastructure errors — don't permanently block the user
});
