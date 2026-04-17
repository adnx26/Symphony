// app/agent/agentActions.ts
// Pure TypeScript — no React, no hooks, no AppContext imports.
// All functions accept state as arguments and return new state or derived data.

import {
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  StatusType,
  PriorityType,
} from '../types';

// ── Task mutations ────────────────────────────────────────────────────────────

export function updateTaskStatus(
  tasks: AppTask[],
  taskId: string,
  status: StatusType,
  blockerReason?: string
): AppTask[] {
  return tasks.map((t) => {
    if (t.id !== taskId) return t;
    const updated: AppTask = { ...t, status };
    if (status === 'blocked' && blockerReason !== undefined) {
      updated.blockerReason = blockerReason;
    } else if (status !== 'blocked') {
      delete updated.blockerReason;
    }
    return updated;
  });
}

export function assignTaskToDeveloper(
  tasks: AppTask[],
  taskId: string,
  developerId: string
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, developerId, assigneeType: 'dev' as const } : t
  );
}

export function assignTaskToAgent(
  tasks: AppTask[],
  taskId: string,
  agentId: string
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId
      ? { ...t, agentId, agentAssigned: true, assigneeType: 'agent' as const }
      : t
  );
}

export function updateTaskPriority(
  tasks: AppTask[],
  taskId: string,
  priority: PriorityType
): AppTask[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, priority } : t));
}

export function updateTaskDueDate(
  tasks: AppTask[],
  taskId: string,
  dueDate: string
): AppTask[] {
  return tasks.map((t) => (t.id === taskId ? { ...t, dueDate } : t));
}

export function checkCriterion(
  checkedCriteria: Record<string, boolean>,
  taskId: string,
  criterionIndex: number,
  checked: boolean
): Record<string, boolean> {
  const key = `${taskId}-${criterionIndex}`;
  return { ...checkedCriteria, [key]: checked };
}

// ── Agent mutations ───────────────────────────────────────────────────────────

export function reassignAgent(
  agents: AppAgent[],
  agentId: string,
  newDeveloperId: string
): AppAgent[] {
  return agents.map((a) =>
    a.id === agentId ? { ...a, developerId: newDeveloperId } : a
  );
}

export function setSubAgentStatus(
  subAgents: AppSubAgent[],
  subAgentId: string,
  status: 'active' | 'idle'
): AppSubAgent[] {
  return subAgents.map((sa) =>
    sa.id === subAgentId ? { ...sa, status } : sa
  );
}

// ── Read queries ──────────────────────────────────────────────────────────────

export function getBlockedTasks(tasks: AppTask[]): AppTask[] {
  return tasks.filter((t) => t.status === 'blocked');
}

export function getOverdueTasks(tasks: AppTask[], today: string): AppTask[] {
  return tasks.filter(
    (t) => t.dueDate !== undefined && t.dueDate < today && t.status !== 'done'
  );
}

export function getDeveloperWorkload(
  tasks: AppTask[],
  developerId: string
): { total: number; byStatus: Record<StatusType, number> } {
  const devTasks = tasks.filter((t) => t.developerId === developerId);
  const byStatus: Record<StatusType, number> = {
    todo: 0,
    progress: 0,
    done: 0,
    blocked: 0,
  };
  for (const t of devTasks) {
    byStatus[t.status]++;
  }
  return { total: devTasks.length, byStatus };
}

export function getTaskChain(
  taskId: string,
  tasks: AppTask[],
  developers: AppDeveloper[],
  agents: AppAgent[],
  subAgents: AppSubAgent[]
): {
  task: AppTask | undefined;
  developer: AppDeveloper | undefined;
  agent: AppAgent | undefined;
  subAgents: AppSubAgent[];
} {
  const task = tasks.find((t) => t.id === taskId);
  const developer = task
    ? developers.find((d) => d.id === task.developerId)
    : undefined;
  const agent =
    task?.agentId ? agents.find((a) => a.id === task.agentId) : undefined;
  const chainSubAgents = agent
    ? subAgents.filter((sa) => sa.parentId === agent.id)
    : [];
  return { task, developer, agent, subAgents: chainSubAgents };
}

export function getCriteriaCompletion(
  task: AppTask,
  checkedCriteria: Record<string, boolean>
): { checked: number; total: number; percent: number } {
  const total = task.criteria?.length ?? 0;
  if (total === 0) return { checked: 0, total: 0, percent: 0 };
  let checked = 0;
  for (let i = 0; i < total; i++) {
    if (checkedCriteria[`${task.id}-${i}`]) checked++;
  }
  const percent = Math.round((checked / total) * 100);
  return { checked, total, percent };
}
