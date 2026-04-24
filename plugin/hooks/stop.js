'use strict';

const fs = require('fs');
const supabase = require('../lib/supabase-client');
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

  const { session_id } = payload;
  if (!session_id) return;

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
