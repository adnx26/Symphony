// app/agent/useAgentQueue.ts
import { useState, useCallback } from 'react';
import { AgentAction } from '../types';

export function useAgentQueue() {
  const [queue, setQueue] = useState<AgentAction[]>([]);

  const propose = useCallback((actions: AgentAction[]) => {
    setQueue(prev => {
      const existingKeys = new Set(
        prev.map(a => `${a.type}-${(a.payload as any).taskId ?? (a.payload as any).developerId}`)
      );
      const fresh = actions.filter(a => {
        const key = `${a.type}-${(a.payload as any).taskId ?? (a.payload as any).developerId}`;
        return !existingKeys.has(key);
      });
      return [...prev, ...fresh];
    });
  }, []);

  const approve = useCallback((action: AgentAction) => {
    setQueue(prev => prev.filter(a => a !== action));
  }, []);

  const dismiss = useCallback((action: AgentAction) => {
    setQueue(prev => prev.filter(a => a !== action));
  }, []);

  const clearQueue = useCallback(() => setQueue([]), []);

  return { queue, propose, approve, dismiss, clearQueue };
}
