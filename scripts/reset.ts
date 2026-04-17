// scripts/reset.ts — wipes all project data from Supabase
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

async function reset() {
  console.log('Resetting all Supabase data...');

  // Tables that have project_id (delete all rows that belong to any project)
  const projectScoped = [
    'agent_dispatches',
    'agent_touched',
    'agent_actions',
    'checked_criteria',
    'board_positions',
    'sub_agents',
    'agents',
    'tasks',
    'developers',
  ];

  for (const table of projectScoped) {
    const { error } = await supabase.from(table).delete().not('project_id', 'is', null);
    if (error) {
      console.warn(`  ${table}: ${error.message}`);
    } else {
      console.log(`  cleared ${table}`);
    }
  }

  // Projects table uses uuid id
  const { error: projErr } = await supabase
    .from('projects')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000');
  if (projErr) {
    console.warn(`  projects: ${projErr.message}`);
  } else {
    console.log('  cleared projects');
  }

  console.log('Done. Refresh the app and clear localStorage (DevTools → Application → Storage → Clear site data).');
}

reset().catch((err) => {
  console.error(err);
  process.exit(1);
});
