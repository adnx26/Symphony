import { useState, useCallback } from 'react';
import { AgentAction } from '../types';

export function useActionLog(initialLog: AgentAction[] = []) {
  const [log, setLog] = useState<AgentAction[]>(initialLog);

  const record = useCallback((action: AgentAction, outcome: 'applied' | 'dismissed') => {
    setLog(prev => [{ ...action, outcome }, ...prev]);
  }, []);

  const clearLog = useCallback(() => setLog([]), []);

  return { log, record, clearLog };
}
