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
    return;
  }

  let payload;
  try {
    payload = JSON.parse(raw);
  } catch {
    return;
  }

  const { session_id, message } = payload;
  if (!session_id) return;

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
