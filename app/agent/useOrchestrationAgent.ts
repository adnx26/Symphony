// app/agent/useOrchestrationAgent.ts
import { useApp } from '../context/AppContext';
import { runEngine } from './orchestrationEngine';
import { useAgentQueue } from './useAgentQueue';
import { useActionLog } from './useActionLog';
import { useEffect, useMemo, useCallback, useState } from 'react';
import { AgentAction } from '../types';
import { runLLMEngine } from './llmEngine';
import { useAgentDispatch } from './useAgentDispatch';
import { insertAgentAction } from '../data/db';

export function useOrchestrationAgent() {
  const ctx = useApp();
  const { queue, propose, approve, dismiss, clearQueue } = useAgentQueue();
  const { log, record, clearLog } = useActionLog(ctx.persistedAgentActions);
  const { dispatchAgent } = useAgentDispatch();

  const [llmEnabled, setLLMEnabled] = useState(false);

  const taskFingerprint = useMemo(
    () => ctx.allTasks.map(t => `${t.id}:${t.status}:${t.priority}:${t.dueDate}`).join('|'),
    [ctx.allTasks]
  );

  // Trigger engine whenever tasks change
  useEffect(() => {
    if (ctx.loading) return;
    const snapshot = {
      tasks: ctx.allTasks,
      developers: ctx.developers,
      agents: ctx.agents,
      subAgents: ctx.subAgents,
      checkedCriteria: ctx.checkedCriteria,
      today: new Date().toISOString().slice(0, 10),
    };
    const ruleActions = runEngine(snapshot);
    const fresh = ruleActions.filter(a => {
      const key = `${a.type}-${(a.payload as Record<string, unknown>).taskId ?? (a.payload as Record<string, unknown>).developerId ?? ''}`;
      return !ctx.dismissedActionKeys.has(key);
    });
    propose(fresh);

    if (llmEnabled) {
      runLLMEngine(snapshot).then(llmActions => {
        const freshLlm = llmActions.filter(a => {
          const key = `${a.type}-${(a.payload as Record<string, unknown>).taskId ?? (a.payload as Record<string, unknown>).developerId ?? ''}`;
          return !ctx.dismissedActionKeys.has(key);
        });
        if (freshLlm.length > 0) propose(freshLlm);
      });
    }
  }, [taskFingerprint, ctx.loading, llmEnabled, ctx.dismissedActionKeys]);

  const runNow = useCallback(() => {
    if (ctx.loading) return;
    const proposed = runEngine({
      tasks: ctx.allTasks,
      developers: ctx.developers,
      agents: ctx.agents,
      subAgents: ctx.subAgents,
      checkedCriteria: ctx.checkedCriteria,
      today: new Date().toISOString().slice(0, 10),
    });
    propose(proposed);
  }, [ctx.allTasks, ctx.developers, ctx.agents, ctx.subAgents, ctx.checkedCriteria, ctx.loading]);

  // Apply an approved action to the actual app state
  const applyAction = (action: AgentAction) => {
    const p = action.payload as any;
    switch (action.type) {
      case 'ESCALATE_PRIORITY':
        ctx.updateTaskPriority(p.taskId, p.to);
        break;
      case 'SUGGEST_COMPLETE':
        ctx.updateTaskStatus(p.taskId, 'done');
        break;
      case 'DISPATCH_AGENT':
        dispatchAgent(p.agentId as string, p.taskId as string);
        break;
      case 'FLAG_BLOCKED_CRITICAL':
      case 'DEVELOPER_OVERLOADED':
      case 'STALE_TODO':
        // Informational only — no mutation, just dismiss
        break;
    }
    const taskId = (action.payload as any).taskId;
    if (taskId) ctx.markAgentTouched(taskId);
    approve(action);
    record(action, 'applied');
    insertAgentAction(ctx.activeProjectId, { ...action, outcome: 'applied' }).catch(console.error);
  };

  return {
    queue,
    applyAction,
    runNow,
    llmEnabled,
    setLLMEnabled,
    dismiss: (action: AgentAction) => {
      dismiss(action);
      record(action, 'dismissed');
      insertAgentAction(ctx.activeProjectId, { ...action, outcome: 'dismissed' }).catch(console.error);
    },
    clearQueue,
    log,
    clearLog,
    getSnapshot: () => ({
      blockedTasks: ctx.getBlockedTasks(),
      overdueTasks: ctx.getOverdueTasks(),
      workloads: ctx.developers.map(d => ({
        developer: d,
        ...ctx.getDeveloperWorkload(d.id),
      })),
    }),
    updateTaskStatus: ctx.updateTaskStatus,
    assignTaskToDeveloper: ctx.assignTaskToDeveloper,
    assignTaskToAgent: ctx.assignTaskToAgent,
    updateTaskPriority: ctx.updateTaskPriority,
    flagBlocker: (taskId: string, reason: string) =>
      ctx.updateTaskStatus(taskId, 'blocked', reason),
    resolveBlocker: (taskId: string) =>
      ctx.updateTaskStatus(taskId, 'progress'),
    setSubAgentStatus: ctx.setSubAgentStatus,
    getTaskChain: ctx.getTaskChain,
    getCriteriaCompletion: ctx.getCriteriaCompletion,
  };
}
