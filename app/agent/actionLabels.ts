import { AgentAction } from '../types';

export const LABEL_MAP: Record<string, string> = {
  FLAG_BLOCKED_CRITICAL: '🚨 Blocker',
  ESCALATE_PRIORITY: '⬆️ Escalate',
  DEVELOPER_OVERLOADED: '⚠️ Overload',
  SUGGEST_COMPLETE: '✅ Complete',
  STALE_TODO: '🕐 Stale',
  UNASSIGNED_AGENT_TASK: '⚠️ Unassigned',
  MISSING_BLOCKER_REASON: '❓ No Reason',
  LONG_RUNNING_TASK: '🐢 Long Running',
  LLM_INSIGHT: '🧠 AI Insight',
  DISPATCH_AGENT: '🚀 Dispatch',
};

export function getDescription(action: AgentAction): string {
  const p = action.payload as Record<string, string>;
  switch (action.type) {
    case 'FLAG_BLOCKED_CRITICAL':
      return `${p.title} is blocked — ${p.reason}`;
    case 'ESCALATE_PRIORITY':
      return `${p.title ?? p.taskId}: ${p.from} → ${p.to}`;
    case 'DEVELOPER_OVERLOADED':
      return `${p.name} has ${p.inProgress} tasks in progress`;
    case 'SUGGEST_COMPLETE':
      return `${p.title} has all criteria checked — mark done?`;
    case 'STALE_TODO':
      return `${p.title ?? p.taskId} is overdue and still todo`;
    case 'UNASSIGNED_AGENT_TASK':
      return `${p.title} has no agent assigned`;
    case 'MISSING_BLOCKER_REASON':
      return `${p.title} is blocked but has no reason recorded`;
    case 'LONG_RUNNING_TASK':
      return `${p.title} is overdue and still in progress`;
    case 'LLM_INSIGHT':
      return `${p.insight} → ${p.recommendation}`;
    case 'DISPATCH_AGENT':
      return `${p.title} is ready — dispatch ${p.agentId} now?`;
    default:
      return action.type;
  }
}
