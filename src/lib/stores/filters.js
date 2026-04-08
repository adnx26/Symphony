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

  const devIds   = new Set(tasks.map(t => t.developerId));
  const agentIds = new Set(tasks.map(t => t.agentId));
  const devs      = DEVELOPERS.filter(d => devIds.has(d.id));
  const agents    = AGENTS.filter(a => agentIds.has(a.id));
  const subAgents = SUB_AGENTS.filter(sa => {
    let id = sa.parentId;
    while (id) {
      if (agentIds.has(id)) return true;
      id = SUB_AGENTS.find(s => s.id === id)?.parentId;
    }
    return false;
  });

  const edges = [];
  tasks.forEach(t => edges.push({ from:t.id, to:t.developerId, color:taskColor[t.id], taskId:t.id }));
  const seenDA = new Map();
  tasks.forEach(t => {
    const k = `${t.developerId}|${t.agentId}`;
    if (!seenDA.has(k)) seenDA.set(k, taskColor[t.id]);
  });
  seenDA.forEach((color, key) => {
    const [dId, aId] = key.split('|');
    edges.push({ from:dId, to:aId, color, taskId:null });
  });
  subAgents.forEach(sa => edges.push({ from:sa.parentId, to:sa.id, color:'rgba(167,139,250,0.5)', taskId:null }));

  return { tasks, devs, agents, subAgents, edges, taskColor };
});
