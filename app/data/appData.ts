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
  developers: AppDeveloper[]
): VisibleNodes {
  let filteredTasks = tasks.filter((t) => {
    const dv = developers.find((d) => d.id === t.developerId);
    if (filters.dev && dv?.name !== filters.dev) return false;
    if (filters.status && t.status !== filters.status) return false;
    if (filters.priority && t.priority !== filters.priority) return false;
    return true;
  });

  const devIds = new Set(filteredTasks.map((t) => t.developerId).filter(Boolean));
  const visibleDevs = developers.filter((d) => devIds.has(d.id));

  const edges: Edge[] = [];
  const taskColor: Record<string, string> = {};

  filteredTasks.forEach((task, idx) => {
    const color = CHAIN_COLORS[idx % CHAIN_COLORS.length];
    taskColor[task.id] = color;

    if (task.developerId) {
      edges.push({ from: task.id, to: task.developerId, color, taskId: task.id });
    }
  });

  return {
    tasks: filteredTasks,
    devs: visibleDevs,
    agents: [],
    subAgents: [],
    edges,
    taskColor,
  };
}

export function computeDefaultPositions(
  visible: VisibleNodes
): Record<string, BoardPosition> {
  const positions: Record<string, BoardPosition> = {};

  const groups = [
    { nodes: visible.tasks, depth: 0 },
    { nodes: visible.devs, depth: 1 },
  ];

  groups.forEach(({ nodes, depth }) => {
    const x = depth * LANE_W + H_PAD;
    nodes.forEach((node, i) => {
      positions[node.id] = { x, y: 100 + i * (NODE_H + GAP_Y) };
    });
  });

  return positions;
}

export function getRelatedNodeIds(nodeId: string, visible: VisibleNodes): Set<string> {
  const ids = new Set<string>([nodeId]);

  if (visible.tasks.find((t) => t.id === nodeId)) {
    const task = visible.tasks.find((t) => t.id === nodeId)!;
    ids.add(task.id);
    if (task.developerId) ids.add(task.developerId);
  } else if (visible.devs.find((d) => d.id === nodeId)) {
    visible.tasks
      .filter((t) => t.developerId === nodeId)
      .forEach((t) => {
        ids.add(t.id);
        if (t.developerId) ids.add(t.developerId);
      });
  }

  return ids;
}

export function buildTreeData(visible: VisibleNodes): TreeNode[] {
  const devMap = new Map(visible.devs.map((d) => [d.id, d]));

  return visible.tasks.map((task) => {
    const dev = devMap.get(task.developerId);
    const taskNode: TreeNode = {
      id: task.id,
      label: task.title,
      type: 'task',
      level: 0,
      children: dev
        ? [{ id: dev.id, label: dev.name, type: 'developer', level: 1 }]
        : [],
    };
    return taskNode;
  });
}
