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
