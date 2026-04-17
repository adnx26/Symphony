import {
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  FilterState,
  BoardPosition,
  VisibleNodes,
  Edge,
  TreeNode,
} from '../types';

const CHAIN_COLORS = [
  '#f59e0b',
  '#22d3ee',
  '#a78bfa',
  '#fb7185',
  '#4ade80',
  '#fb923c',
];

const NODE_H = 68;
const LANE_W = 320;
const GAP_Y = 48;
const H_PAD = 60;

export function computeVisibleNodes(
  filters: FilterState,
  tasks: AppTask[],
  developers: AppDeveloper[],
  agents: AppAgent[],
  subAgents: AppSubAgent[]
): VisibleNodes {
  // Filter tasks
  let filteredTasks = tasks.filter((t) => {
    const ag = agents.find((a) => a.id === t.agentId);
    const dv = developers.find((d) => d.id === t.developerId);
    if (filters.dev && dv?.name !== filters.dev) return false;
    if (filters.type && ag?.type !== filters.type) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  // Derive visible devs/agents/subagents
  const devTasks = filteredTasks.filter(
    (t) => t.assigneeType === 'dev' && t.developerId
  );
  const agentTasks = filteredTasks.filter(
    (t) => t.assigneeType === 'agent' && t.agentId
  );
  const devAgentTasks = devTasks.filter((t) => t.agentAssigned && t.agentId);

  const devIds = new Set(devTasks.map((t) => t.developerId));
  const agentIds = new Set([
    ...agentTasks.map((t) => t.agentId).filter((id): id is string => !!id),
    ...devAgentTasks.map((t) => t.agentId).filter((id): id is string => !!id),
  ]);

  const visibleDevs = developers.filter((d) => devIds.has(d.id));
  const visibleAgents = agents.filter((a) => agentIds.has(a.id));

  const agentsWithSubs = visibleAgents.slice(0, 2).map((a) => a.id);
  const visibleSubAgents = subAgents.filter((sa) =>
    agentsWithSubs.includes(sa.parentId)
  );

  // Build edges and task colors
  const edges: Edge[] = [];
  const taskColor: Record<string, string> = {};

  filteredTasks.forEach((task, idx) => {
    const color = CHAIN_COLORS[idx % CHAIN_COLORS.length];
    taskColor[task.id] = color;

    // Task -> Dev edge
    if (task.developerId) {
      edges.push({
        from: task.id,
        to: task.developerId,
        color,
        taskId: task.id,
      });
    }

    // Task -> Agent edge (for agent-assigned tasks)
    if (task.assigneeType === 'agent' && task.agentId) {
      edges.push({
        from: task.id,
        to: task.agentId,
        color,
        taskId: task.id,
      });
    }

    // Dev -> Agent edge (for dev-assigned tasks with agent)
    if (task.assigneeType === 'dev' && task.agentId && task.agentAssigned) {
      edges.push({
        from: task.developerId,
        to: task.agentId,
        color,
        taskId: task.id,
      });
    }
  });

  // Agent -> Sub-agent edges
  visibleAgents.forEach((agent) => {
    const agentSubs = visibleSubAgents.filter((sa) => sa.parentId === agent.id);
    agentSubs.forEach((sa) => {
      edges.push({
        from: agent.id,
        to: sa.id,
        color: 'rgba(167,139,250,0.5)',
      });
    });
  });

  return {
    tasks: filteredTasks,
    devs: visibleDevs,
    agents: visibleAgents,
    subAgents: visibleSubAgents,
    edges,
    taskColor,
  };
}

export function computeDefaultPositions(
  visible: VisibleNodes
): Record<string, BoardPosition> {
  const positions: Record<string, BoardPosition> = {};

  const groups = [
    {
      nodes: visible.tasks,
      depth: 0,
    },
    {
      nodes: visible.devs,
      depth: 1,
    },
    {
      nodes: visible.agents,
      depth: 2,
    },
    {
      nodes: visible.subAgents,
      depth: 3,
    },
  ];

  groups.forEach(({ nodes, depth }) => {
    const x = depth * LANE_W + H_PAD;
    const totalH = nodes.length * (NODE_H + GAP_Y) - GAP_Y;
    const startY = 100;

    nodes.forEach((node, i) => {
      positions[node.id] = {
        x,
        y: startY + i * (NODE_H + GAP_Y),
      };
    });
  });

  return positions;
}

// Returns the set of node IDs that belong to the same chain as the given node.
export function getRelatedNodeIds(nodeId: string, visible: VisibleNodes): Set<string> {
  const ids = new Set<string>([nodeId]);

  const addChain = (task: typeof visible.tasks[0]) => {
    ids.add(task.id);
    if (task.developerId) ids.add(task.developerId);
    if (task.agentId) {
      ids.add(task.agentId);
      visible.subAgents.filter((sa) => sa.parentId === task.agentId).forEach((sa) => ids.add(sa.id));
    }
  };

  if (visible.tasks.find((t) => t.id === nodeId)) {
    // Clicked a task → whole chain from this task
    const task = visible.tasks.find((t) => t.id === nodeId)!;
    addChain(task);
  } else if (visible.devs.find((d) => d.id === nodeId)) {
    // Clicked a developer → all tasks belonging to this dev + their chains
    visible.tasks.filter((t) => t.developerId === nodeId).forEach(addChain);
  } else if (visible.agents.find((a) => a.id === nodeId)) {
    // Clicked an agent → tasks that reference it + sub-agents
    visible.tasks.filter((t) => t.agentId === nodeId).forEach(addChain);
    visible.subAgents.filter((sa) => sa.parentId === nodeId).forEach((sa) => ids.add(sa.id));
  } else if (visible.subAgents.find((sa) => sa.id === nodeId)) {
    // Clicked a sub-agent → parent agent + its tasks + sibling sub-agents
    const sa = visible.subAgents.find((s) => s.id === nodeId)!;
    ids.add(sa.parentId);
    visible.tasks.filter((t) => t.agentId === sa.parentId).forEach(addChain);
    visible.subAgents.filter((s) => s.parentId === sa.parentId).forEach((s) => ids.add(s.id));
  }

  return ids;
}

export function buildTreeData(visible: VisibleNodes): TreeNode[] {
  const taskMap = new Map(visible.tasks.map((t) => [t.id, t]));
  const devMap = new Map(visible.devs.map((d) => [d.id, d]));
  const agentMap = new Map(visible.agents.map((a) => [a.id, a]));
  const subAgentMap = new Map(visible.subAgents.map((sa) => [sa.id, sa]));

  const root: TreeNode[] = [];

  visible.tasks.forEach((task) => {
    const taskNode: TreeNode = {
      id: task.id,
      label: task.title,
      type: 'task',
      level: 0,
      children: [],
    };

    const dev = devMap.get(task.developerId);
    if (dev) {
      const devNode: TreeNode = {
        id: dev.id,
        label: dev.name,
        type: 'developer',
        level: 1,
        children: [],
      };

      if (task.assigneeType === 'dev' && task.agentId) {
        const agent = agentMap.get(task.agentId);
        if (agent) {
          const agentNode: TreeNode = {
            id: agent.id,
            label: agent.name,
            type: 'agent',
            level: 2,
            children: [],
          };

          const subs = visible.subAgents.filter((sa) => sa.parentId === agent.id);
          if (subs.length > 0) {
            agentNode.children = subs.map((sa) => ({
              id: sa.id,
              label: sa.name,
              type: 'sub-agent' as const,
              level: 3,
            }));
          }

          devNode.children = [agentNode];
        }
      }

      taskNode.children = [devNode];
    } else if (task.assigneeType === 'agent' && task.agentId) {
      const agent = agentMap.get(task.agentId);
      if (agent) {
        const agentNode: TreeNode = {
          id: agent.id,
          label: agent.name,
          type: 'agent',
          level: 1,
          children: [],
        };

        const subs = visible.subAgents.filter((sa) => sa.parentId === agent.id);
        if (subs.length > 0) {
          agentNode.children = subs.map((sa) => ({
            id: sa.id,
            label: sa.name,
            type: 'sub-agent' as const,
            level: 2,
          }));
        }

        taskNode.children = [agentNode];
      }
    }

    root.push(taskNode);
  });

  return root;
}
