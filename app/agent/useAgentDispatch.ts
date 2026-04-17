// app/agent/useAgentDispatch.ts
import { useCallback } from 'react';
import { useApp } from '../context/AppContext';
import { AGENT_REGISTRY } from './agentRegistry';
import { AgentDispatchState } from '../types';

export function useAgentDispatch() {
  const ctx = useApp();

  const dispatchAgent = useCallback(async (
    agentId: string,
    taskId: string,
    input: Record<string, unknown> = {}
  ): Promise<void> => {
    const capability = AGENT_REGISTRY.get(agentId);
    if (!capability) {
      console.warn(`No capability registered for agent ${agentId}`);
      return;
    }

    const task = ctx.allTasks.find(t => t.id === taskId);
    if (!task) {
      console.warn(`Task ${taskId} not found`);
      return;
    }

    const dispatchId = ctx.dispatch(agentId, taskId, input);

    ctx.updateDispatch(dispatchId, { status: 'running' });

    try {
      const result = await capability.simulate(task, { ...input, __dispatchId: dispatchId });
      ctx.updateDispatch(dispatchId, {
        status: result.status === 'completed' ? 'completed' : 'failed',
        result,
      });

      if (result.status === 'completed') {
        ctx.subAgents
          .filter(sa => sa.parentId === agentId)
          .forEach(sa => ctx.setSubAgentStatus(sa.id, 'active'));
      }
    } catch (err) {
      ctx.updateDispatch(dispatchId, {
        status: 'failed',
        result: {
          dispatchId,
          agentId,
          taskId,
          status: 'failed',
          output: {},
          completedAt: new Date().toISOString(),
          error: err instanceof Error ? err.message : 'Unknown error',
        },
      });
    }
  }, [ctx]);

  const getDispatchStatus = useCallback((taskId: string): AgentDispatchState[] => {
    return ctx.getTaskDispatches(taskId);
  }, [ctx]);

  return { dispatchAgent, getDispatchStatus };
}
