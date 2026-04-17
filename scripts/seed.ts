// scripts/seed.ts
import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rawData = JSON.parse(
  readFileSync(join(__dirname, '../app/data/symphony-data.json'), 'utf-8')
) as {
  tasks: Array<{
    id: string; title: string; desc: string; overview: string;
    status: string; priority: string; dueDate?: string;
    developerId: string; agentId?: string; assigneeType: string;
    agentAssigned?: boolean; criteria?: string[];
  }>;
  developers: Array<{
    id: string; name: string; initials: string; role: string;
    desc?: string; criteria?: string[]; outputs?: string[];
  }>;
  agents: Array<{
    id: string; name: string; type: string; developerId: string;
    desc?: string; criteria?: string[]; outputs?: string[];
  }>;
  subAgents: Array<{
    id: string; name: string; type: string; parentId: string;
    desc?: string; criteria?: string[]; outputs?: string[];
  }>;
};

// Try to use service role key if available, otherwise fall back to public key
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_PUBLISHABLE_KEY!;

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  supabaseKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

async function seed() {
  console.log('Seeding Supabase...');

  // 1. Create the project (or find existing one named "My Project")
  let projectId: string;

  const { data: existing } = await supabase
    .from('projects')
    .select('id')
    .eq('name', 'My Project')
    .maybeSingle();

  if (existing) {
    projectId = existing.id;
    console.log(`Using existing project: ${projectId}`);
  } else {
    const { data: created, error } = await supabase
      .from('projects')
      .insert({ name: 'My Project' })
      .select('id')
      .single();
    if (error) throw error;
    projectId = created.id;
    console.log(`Created project: ${projectId}`);
  }

  // 2. Seed developers
  const developers = rawData.developers.map((d) => ({
    project_id: projectId,
    id: d.id,
    name: d.name,
    initials: d.initials,
    role: d.role,
    description: d.desc ?? '',
    criteria: d.criteria ?? [],
    outputs: d.outputs ?? [],
  }));
  const { error: devErr } = await supabase
    .from('developers')
    .upsert(developers, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (devErr) throw devErr;
  console.log(`Seeded ${developers.length} developers`);

  // 3. Seed agents
  const agents = rawData.agents.map((a) => ({
    project_id: projectId,
    id: a.id,
    developer_id: a.developerId,
    name: a.name,
    type: a.type,
    description: a.desc ?? '',
    criteria: a.criteria ?? [],
    outputs: a.outputs ?? [],
  }));
  const { error: agentErr } = await supabase
    .from('agents')
    .upsert(agents, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (agentErr) throw agentErr;
  console.log(`Seeded ${agents.length} agents`);

  // 4. Seed sub-agents
  const subAgents = rawData.subAgents.map((sa) => ({
    project_id: projectId,
    id: sa.id,
    parent_id: sa.parentId,
    name: sa.name,
    type: sa.type,
    description: sa.desc ?? '',
    criteria: sa.criteria ?? [],
    outputs: sa.outputs ?? [],
  }));
  const { error: subErr } = await supabase
    .from('sub_agents')
    .upsert(subAgents, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (subErr) throw subErr;
  console.log(`Seeded ${subAgents.length} sub-agents`);

  // 5. Seed tasks
  const tasks = rawData.tasks.map((t) => ({
    project_id: projectId,
    id: t.id,
    title: t.title,
    description: t.desc,
    overview: t.overview,
    status: t.status,
    priority: t.priority,
    due_date: t.dueDate ?? null,
    developer_id: t.developerId ?? null,
    agent_id: t.agentId ?? null,
    assignee_type: t.assigneeType,
    agent_assigned: t.agentAssigned ?? false,
    is_custom: false,
    criteria: t.criteria ?? [],
  }));
  const { error: taskErr } = await supabase
    .from('tasks')
    .upsert(tasks, { onConflict: 'project_id,id', ignoreDuplicates: true });
  if (taskErr) throw taskErr;
  console.log(`Seeded ${tasks.length} tasks`);

  console.log('Done!');
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
