import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';

export const NODE_W = 220;
export const NODE_H = 68;
export const BOARD_W = 6000;
export const BOARD_H = 4000;
export const CHAIN_COLORS = ['#f59e0b','#22d3ee','#a78bfa','#fb7185','#4ade80','#fb923c'];
export const LANE_LABELS  = ['Tasks','Developers','Agents','Sub-Agents','Sub-Sub-Agents','Level 5','Level 6','Level 7'];
export const LANE_COLORS  = ['rgba(245,158,11,.025)','rgba(29,212,239,.025)','rgba(167,139,250,.025)','rgba(251,113,133,.025)'];
export const STATUS_LABEL = { todo:'To Do', progress:'In Progress', done:'Done', blocked:'Blocked' };

export function priorityConfig(level) {
  const map = {
    critical: { label:'Critical', color:'#ef4444', bg:'rgba(239,68,68,.18)' },
    high:     { label:'High',     color:'#f59e0b', bg:'rgba(245,158,11,.18)' },
    medium:   { label:'Medium',   color:'#708aa8', bg:'rgba(74,92,114,.18)'  },
    low:      { label:'Low',      color:'#4a5c72', bg:'rgba(74,92,114,.10)'  },
  };
  return level ? (map[level] || null) : null;
}

export function formatDueDate(dateStr) {
  if (!dateStr) return null;
  const today = new Date(); today.setHours(0,0,0,0);
  const [dy, dm, dd] = dateStr.split('-').map(Number);
  const due  = new Date(dy, dm - 1, dd);
  const diff = Math.round((due - today) / 86400000);
  if (diff < 0)   return { text:'Overdue', color:'#ef4444', bg:'rgba(239,68,68,.12)',  border:'rgba(239,68,68,.25)'  };
  if (diff === 0) return { text:'Today',   color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.25)' };
  if (diff < 7)   return { text:`in ${diff} day${diff===1?'':'s'}`, color:'#f59e0b', bg:'rgba(245,158,11,.12)', border:'rgba(245,158,11,.25)' };
  return { text: due.toLocaleDateString('en-US',{month:'short',day:'numeric'}), color:'#4a5c72', bg:'rgba(74,92,114,.10)', border:'rgba(74,92,114,.20)' };
}

export function getDepth(id) {
  if (TASKS.find(t => t.id === id))      return 0;
  if (DEVELOPERS.find(d => d.id === id)) return 1;
  if (AGENTS.find(a => a.id === id))     return 2;
  const sa = SUB_AGENTS.find(s => s.id === id);
  if (!sa) return -1;
  return getDepth(sa.parentId) + 1;
}

export function nodeKind(id) {
  if (TASKS.find(x => x.id === id))      return { label:'Task',      color:'#f59e0b', bg:'rgba(245,158,11,.12)' };
  if (DEVELOPERS.find(x => x.id === id)) return { label:'Developer', color:'#1dd4ef', bg:'rgba(29,212,239,.12)'  };
  if (AGENTS.find(x => x.id === id))     return { label:'Agent',     color:'#a78bfa', bg:'rgba(167,139,250,.12)' };
  if (SUB_AGENTS.find(x => x.id === id)) {
    const depth = getDepth(id);
    const prefix = depth > 3 ? 'Sub-'.repeat(depth - 2) : '';
    return { label: prefix + 'Agent', color:'#fb7185', bg:'rgba(251,113,133,.12)' };
  }
  return { label:'Node', color:'#888', bg:'rgba(255,255,255,.06)' };
}

export function findNode(id) {
  return TASKS.find(x => x.id === id)
      || DEVELOPERS.find(x => x.id === id)
      || AGENTS.find(x => x.id === id)
      || SUB_AGENTS.find(x => x.id === id);
}

export function computeDefaultPositions(tasks, devs, agents, subAgents) {
  const allNodes = [
    ...tasks.map(n => ({ id:n.id, depth:0 })),
    ...devs.map(n => ({ id:n.id, depth:1 })),
    ...agents.map(n => ({ id:n.id, depth:2 })),
    ...subAgents.map(n => ({ id:n.id, depth:getDepth(n.id) })),
  ];
  const LANE_W = NODE_W + 24, GAP_Y = 24, H_PAD = 40;
  const byDepth = {};
  allNodes.forEach(n => { (byDepth[n.depth] ??= []).push(n.id); });
  const result = {};
  Object.entries(byDepth).forEach(([depth, ids]) => {
    const d = parseInt(depth), x = d * LANE_W + H_PAD;
    const totalH = ids.length * (NODE_H + GAP_Y) - GAP_Y;
    const startY = Math.max(80, (BOARD_H - totalH) / 2);
    ids.forEach((id, i) => { result[id] = { x, y: startY + i * (NODE_H + GAP_Y) }; });
  });
  return result;
}

export function buildPortMaps(edges) {
  const R = {}, L = {};
  edges.forEach(e => {
    if (!R[e.from]) R[e.from] = [];
    if (!L[e.to])   L[e.to]   = [];
    if (!R[e.from].includes(e.to))   R[e.from].push(e.to);
    if (!L[e.to].includes(e.from))   L[e.to].push(e.from);
  });
  return { R, L };
}

export function connectedIds(startId, edges) {
  const set = new Set([startId]);
  let changed = true;
  while (changed) {
    changed = false;
    edges.forEach(e => {
      if (set.has(e.from) && !set.has(e.to))   { set.add(e.to);   changed = true; }
      if (set.has(e.to)   && !set.has(e.from)) { set.add(e.from); changed = true; }
    });
  }
  return set;
}

export function downstreamChain(startId, edges) {
  const visited = new Set([startId]);
  const queue = [startId];
  while (queue.length) {
    const cur = queue.shift();
    edges.forEach(e => {
      if (e.from === cur && !visited.has(e.to)) { visited.add(e.to); queue.push(e.to); }
    });
  }
  return visited;
}
