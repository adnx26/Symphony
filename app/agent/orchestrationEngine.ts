// app/agent/orchestrationEngine.ts
// Pure TypeScript — no React, no hooks, no side effects.
// Reads a state snapshot and returns proposed AgentAction objects.

import {
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  AppSprint,
  AgentAction,
  PriorityType,
} from '../types';

import {
  getOverdueTasks,
  getDeveloperWorkload,
  getCriteriaCompletion,
  getBlockedTasks,
} from './agentActions';

function escalatePriority(p: PriorityType): PriorityType {
  const order: PriorityType[] = ['low', 'medium', 'high', 'critical'];
  const idx = order.indexOf(p);
  return idx < order.length - 1 ? order[idx + 1] : p;
}

function action(
  type: string,
  payload: Record<string, unknown>
): AgentAction {
  return { type, payload, timestamp: new Date().toISOString(), agentId: 'orchestrator' };
}

export function runEngine(snapshot: {
  tasks: AppTask[];
  developers: AppDeveloper[];
  agents: AppAgent[];
  subAgents: AppSubAgent[];
  checkedCriteria: Record<string, boolean>;
  today: string; // 'YYYY-MM-DD'
  sprints?: AppSprint[];
  sprintTaskIds?: Record<string, string[]>;
}): AgentAction[] {
  const { tasks, developers, checkedCriteria, today, sprints = [], sprintTaskIds = {} } = snapshot;
  const proposed: AgentAction[] = [];

  // RULE 1 — Blocked critical task
  for (const task of tasks) {
    if (task.status === 'blocked' && task.priority === 'critical') {
      proposed.push(action('FLAG_BLOCKED_CRITICAL', {
        taskId: task.id,
        title: task.title,
        reason: task.blockerReason ?? 'No reason given',
      }));
    }
  }

  // RULE 2 — Overdue task priority escalation
  for (const task of getOverdueTasks(tasks, today)) {
    if (task.status !== 'done' && task.priority !== 'critical') {
      proposed.push(action('ESCALATE_PRIORITY', {
        taskId: task.id,
        from: task.priority,
        to: escalatePriority(task.priority),
      }));
    }
  }

  // RULE 3 — Developer overload
  for (const developer of developers) {
    const workload = getDeveloperWorkload(tasks, developer.id);
    if (workload.byStatus['progress'] >= 2) {
      proposed.push(action('DEVELOPER_OVERLOADED', {
        developerId: developer.id,
        name: developer.name,
        inProgress: workload.byStatus['progress'],
      }));
    }
  }

  // RULE 4 — Task ready to complete
  for (const task of tasks) {
    if (task.status === 'progress') {
      const { percent, total } = getCriteriaCompletion(task, checkedCriteria);
      if (percent === 100 && total > 0) {
        proposed.push(action('SUGGEST_COMPLETE', {
          taskId: task.id,
          title: task.title,
        }));
      }
    }
  }

  // RULE 5 — Stale todo task
  for (const task of tasks) {
    if (task.status === 'todo' && task.dueDate !== undefined && task.dueDate < today) {
      proposed.push(action('STALE_TODO', {
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate,
      }));
    }
  }

  // RULE 6 — Unassigned agent task
  for (const task of tasks) {
    if (task.assigneeType === 'agent' && (!task.agentId || task.agentId === '') && task.status !== 'done') {
      proposed.push(action('UNASSIGNED_AGENT_TASK', {
        taskId: task.id,
        title: task.title,
      }));
    }
  }

  // RULE 7 — Blocked task with no reason
  for (const task of tasks) {
    if (task.status === 'blocked' && (!task.blockerReason || task.blockerReason === '')) {
      proposed.push(action('MISSING_BLOCKER_REASON', {
        taskId: task.id,
        title: task.title,
      }));
    }
  }

  // RULE 8 — Long running in-progress task
  for (const task of tasks) {
    if (task.status === 'progress' && task.dueDate !== undefined && task.dueDate < today && task.priority !== 'critical') {
      proposed.push(action('LONG_RUNNING_TASK', {
        taskId: task.id,
        title: task.title,
        dueDate: task.dueDate,
      }));
    }
  }

  // RULE 9 — Agent ready to dispatch
  for (const task of tasks) {
    if (task.status === 'progress' && task.agentId && task.agentAssigned === true) {
      proposed.push(action('DISPATCH_AGENT', {
        taskId: task.id,
        agentId: task.agentId,
        title: task.title,
      }));
    }
  }

  // ── Sprint rules ─────────────────────────────────────────────────────────────

  const activeSprint = sprints.find((s) => s.status === 'active');

  // RULE 10 — Sprint at risk: active sprint has 3+ blocked tasks
  if (activeSprint) {
    const sprintIds = sprintTaskIds[activeSprint.id] ?? [];
    const sprintTasks = tasks.filter((t) => sprintIds.includes(t.id));
    const blockedCount = sprintTasks.filter((t) => t.status === 'blocked').length;
    if (blockedCount >= 3) {
      proposed.push(action('SPRINT_AT_RISK', {
        sprintId: activeSprint.id,
        sprintName: activeSprint.name,
        blockedCount,
      }));
    }
  }

  // RULE 11 — Sprint overloaded: task story points exceed sprint capacity
  if (activeSprint) {
    const sprintIds = sprintTaskIds[activeSprint.id] ?? [];
    const sprintTasks = tasks.filter((t) => sprintIds.includes(t.id));
    const totalPoints = sprintTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
    if (totalPoints > activeSprint.capacity) {
      proposed.push(action('SPRINT_OVERLOADED', {
        sprintId: activeSprint.id,
        sprintName: activeSprint.name,
        totalPoints,
        capacity: activeSprint.capacity,
      }));
    }
  }

  // RULE 12 — Suggest sprint complete: all tasks in active sprint are 'done'
  if (activeSprint) {
    const sprintIds = sprintTaskIds[activeSprint.id] ?? [];
    const sprintTasks = tasks.filter((t) => sprintIds.includes(t.id));
    if (sprintTasks.length > 0 && sprintTasks.every((t) => t.status === 'done')) {
      proposed.push(action('SUGGEST_SPRINT_COMPLETE', {
        sprintId: activeSprint.id,
        sprintName: activeSprint.name,
        taskCount: sprintTasks.length,
      }));
    }
  }

  // RULE 13 — Plan sprint: no non-completed sprints but there are unassigned tasks
  const hasActivePlannedSprint = sprints.some((s) => s.status !== 'completed');
  if (!hasActivePlannedSprint) {
    // Find tasks not in any sprint
    const assignedTaskIds = new Set(Object.values(sprintTaskIds).flat());
    const unassignedTasks = tasks.filter((t) => !assignedTaskIds.has(t.id) && t.status !== 'done');
    if (unassignedTasks.length > 0) {
      proposed.push(action('PLAN_SPRINT', {
        unassignedCount: unassignedTasks.length,
      }));
    }
  }

  return proposed;
}
