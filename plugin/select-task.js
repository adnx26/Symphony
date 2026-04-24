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
  process.exit(0);
}

if (require.main === module) {
  main().catch((err) => {
    console.error('[symphony-plugin] select-task error:', err.message);
    process.exit(1);
  });
}

module.exports = { findTask };
