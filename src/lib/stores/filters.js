import { writable, derived } from 'svelte/store';
import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
import { CHAIN_COLORS } from '$lib/helpers.js';

export const filters = writable({ dev:'', type:'', status:'', priority:'' });

export const visibleNodes = derived(filters, ($f) => {
  const tasks = TASKS.filter(t => {
    const ag = AGENTS.find(a => a.id === t.agentId);
    const dv = DEVELOPERS.find(d => d.id === t.developerId);
    if ($f.dev      && dv?.name   !== $f.dev)      return false;
    if ($f.type     && ag?.type   !== $f.type)     return false;
    if ($f.status   && t.status   !== $f.status)   return false;
    if ($f.priority && t.priority !== $f.priority) return false;
    return true;
  });

  const taskColor = {};
  tasks.forEach((t, i) => { taskColor[t.id] = CHAIN_COLORS[i % CHAIN_COLORS.length]; });

  const devTasks        = tasks.filter(t => t.assigneeType === 'dev'   && t.developerId);
  const agentTasks      = tasks.filter(t => t.assigneeType === 'agent' && t.agentId);
  const devAgentTasks   = devTasks.filter(t => t.agentAssigned && t.agentId);

  const devIds   = new Set(devTasks.map(t => t.developerId));
  const agentIds = new Set([
    ...agentTasks.map(t => t.agentId),
    ...devAgentTasks.map(t => t.agentId),
  ]);

  const devs   = DEVELOPERS.filter(d => devIds.has(d.id));
  const agents = AGENTS.filter(a => agentIds.has(a.id));

  const edges = [];
  devTasks.forEach(t   => edges.push({ from:t.id, to:t.developerId, color:taskColor[t.id], taskId:t.id }));
  agentTasks.forEach(t => edges.push({ from:t.id, to:t.agentId,     color:taskColor[t.id], taskId:t.id }));
  devAgentTasks.forEach(t => edges.push({ from:t.developerId, to:t.agentId, color:taskColor[t.id], taskId:t.id }));

  // Give sub-agents to the first 2 visible agents
  const agentsWithSubs = [...agents].slice(0, 2).map(a => a.id);
  const subAgents = SUB_AGENTS.filter(sa => agentsWithSubs.includes(sa.parentId));
  subAgents.forEach(sa => edges.push({ from:sa.parentId, to:sa.id, color:'rgba(167,139,250,0.5)', taskId:null }));

  return { tasks, devs, agents, subAgents, edges, taskColor };
});
