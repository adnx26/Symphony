import React, { createContext, useContext, useEffect, useMemo, useState, ReactNode } from 'react';
import { supabase } from '../utils/supabase';
import { ClaudeEvent } from '../types';

interface ClaudeSessionState {
  latestEvent: ClaudeEvent | null;
  events: ClaudeEvent[];
  activeTaskId: string | null;
}

const ClaudeSessionContext = createContext<ClaudeSessionState>({
  latestEvent: null,
  events: [],
  activeTaskId: null,
});

export function ClaudeSessionProvider({ children }: { children: ReactNode }) {
  const [events, setEvents] = useState<ClaudeEvent[]>([]);
  const [latestEvent, setLatestEvent] = useState<ClaudeEvent | null>(null);

  useEffect(() => {
    const client = supabase;
    if (!client) return; // Supabase not configured — skip subscription

    const channel = client
      .channel('claude-events')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'claude_events' },
        (payload) => {
          const event = payload.new as ClaudeEvent;
          setLatestEvent(event);
          setEvents((prev) => [...prev, event]);
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, []);

  // activeTaskId: most recent non-null task_id across all events
  const activeTaskId = useMemo(
    () => [...events].reverse().find((e) => e.task_id != null)?.task_id ?? null,
    [events]
  );

  return (
    <ClaudeSessionContext.Provider value={{ latestEvent, events, activeTaskId }}>
      {children}
    </ClaudeSessionContext.Provider>
  );
}

export function useClaudeSession(): ClaudeSessionState {
  return useContext(ClaudeSessionContext);
}
