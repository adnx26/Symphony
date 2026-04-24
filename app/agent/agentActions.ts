// app/agent/agentActions.ts
// Pure TypeScript — no React, no hooks, no AppContext imports.
// All functions accept state as arguments and return new state or derived data.

import {
  AppTask,
  AppDeveloper,
  StatusType,
  PriorityType,
} from '../types';

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
    t.id === taskId ? { ...t, developerId } : t
  );
}

export function updateTaskPriority(
  tasks: AppTask[],
  taskId: string,
  priority: PriorityType
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, priority } : t
  );
}

export function updateTaskDueDate(
  tasks: AppTask[],
  taskId: string,
  dueDate: string
): AppTask[] {
  return tasks.map((t) =>
    t.id === taskId ? { ...t, dueDate } : t
  );
}

export function getBlockedTasks(tasks: AppTask[]): AppTask[] {
  return tasks.filter((t) => t.status === 'blocked');
}

export function getOverdueTasks(tasks: AppTask[], today: string): AppTask[] {
  return tasks.filter(
    (t) => t.dueDate && t.dueDate < today && t.status !== 'done'
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
  devTasks.forEach((t) => {
    byStatus[t.status] = (byStatus[t.status] ?? 0) + 1;
  });
  return { total: devTasks.length, byStatus };
}

export function getCriteriaCompletion(
  task: AppTask,
  checkedCriteria: Record<string, boolean>
): { checked: number; total: number; percent: number } {
  const criteria = task.criteria ?? [];
  const total = criteria.length;
  if (total === 0) return { checked: 0, total: 0, percent: 0 };
  const checked = criteria.filter((_, i) => checkedCriteria[`${task.id}-${i}`]).length;
  return { checked, total, percent: Math.round((checked / total) * 100) };
}
