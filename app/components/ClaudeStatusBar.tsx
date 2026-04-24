import { useEffect, useState } from 'react';
import { useClaudeSession } from '../context/ClaudeSessionContext';
import { timeAgo } from '../utils/timeAgo';

const PHASE_LABELS: Record<string, string> = {
  exploring: 'Exploring',
  implementing: 'Implementing',
  running: 'Running',
  debugging: 'Debugging',
  waiting: 'Waiting for input',
  communicating: 'Communicating',
  ended: 'Session ended',
};

const IDLE_MS = 5 * 60 * 1000;

export function ClaudeStatusBar() {
  const { latestEvent, activeTaskId } = useClaudeSession();
  const [isIdle, setIsIdle] = useState(true);

  useEffect(() => {
    if (!latestEvent) return;
    setIsIdle(false);
    const t = setTimeout(() => setIsIdle(true), IDLE_MS);
    return () => clearTimeout(t);
  }, [latestEvent]);

  // Don't render if Supabase isn't configured
  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) return null;

  return (
    <div
      className="flex items-center gap-2 px-4 h-7 text-xs shrink-0"
      style={{ background: 'var(--background)', borderTop: '1px solid var(--border)' }}
    >
      <span style={{ color: '#7c3aed', fontSize: '0.75rem' }}>⬡</span>
      <span style={{ color: 'var(--foreground)', fontWeight: 500 }}>Claude</span>

      {isIdle || !latestEvent ? (
        <span style={{ color: 'var(--muted-foreground)' }}>— idle</span>
      ) : (
        <>
          <span style={{ color: 'var(--border)' }}>•</span>
          <span style={{ color: 'var(--muted-foreground)' }}>
            {PHASE_LABELS[latestEvent.phase] ?? latestEvent.phase}
          </span>
          {activeTaskId && (
            <>
              <span style={{ color: 'var(--border)' }}>•</span>
              <span style={{ color: '#7c3aed' }}>task #{activeTaskId}</span>
            </>
          )}
          <span style={{ color: 'var(--border)' }}>•</span>
          <span style={{ color: 'var(--muted-foreground)' }}>{timeAgo(latestEvent.created_at)}</span>
        </>
      )}
    </div>
  );
}
