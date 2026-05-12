import { useNavigate } from 'react-router';
import { useClaudeSession } from '../context/ClaudeSessionContext';
import { timeAgo } from '../utils/timeAgo';
import { ClaudeEvent } from '../types';

const PHASE_LABELS: Record<ClaudeEvent['phase'], string> = {
  exploring: 'Exploring codebase',
  implementing: 'Implementing changes',
  running: 'Running command',
  debugging: 'Debugging',
  waiting: 'Waiting for input',
  communicating: 'Communicating',
  ended: 'Session ended',
};

const PHASE_COLORS: Record<ClaudeEvent['phase'], string> = {
  exploring: '#3b82f6',
  implementing: '#10b981',
  running: '#f59e0b',
  debugging: '#ef4444',
  waiting: '#8b5cf6',
  communicating: '#71717a',
  ended: '#d1d5db',
};

export function SessionLog() {
  const { events } = useClaudeSession();
  const navigate = useNavigate();

  if (!import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-sm" style={{ color: '#a1a1aa' }}>
          Supabase is not configured. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to .env.
        </p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>No session activity yet</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
            Start a Claude Code session — events will appear here in real time.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5 md:p-6" style={{ background: 'linear-gradient(180deg, rgba(11,17,26,0.55), rgba(7,11,18,0.88))' }}>
      <div className="max-w-2xl mx-auto">
        <h2 className="text-sm font-semibold mb-4 tracking-[0.04em]" style={{ color: 'var(--foreground)' }}>
          Session Log
        </h2>

        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-3 p-3"
              style={{
                background: '#101923',
                border: '1px solid #1f2b3a',
                borderRadius: '14px',
                boxShadow: '0 12px 28px rgba(2, 6, 23, 0.28)',
              }}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                  <span
                    className="px-1.5 py-0.5 text-[0.65rem] font-semibold"
                    style={{
                      background: `${PHASE_COLORS[event.phase] ?? '#d1d5db'}1a`,
                      color: PHASE_COLORS[event.phase] ?? '#71717a',
                      borderRadius: '3px',
                    }}
                  >
                    {PHASE_LABELS[event.phase] ?? event.phase}
                  </span>
                  {event.tool_name && (
                    <span
                      className="px-1.5 py-0.5 text-[0.6rem] font-medium"
                    style={{ background: 'rgba(16,25,35,0.92)', color: '#94a3b8', borderRadius: '999px', border: '1px solid rgba(49,67,85,0.72)' }}
                  >
                      {event.tool_name}
                    </span>
                  )}
                  {event.task_id && (
                    <button
                      onClick={() => navigate('/tickets')}
                      className="px-1.5 py-0.5 text-[0.6rem] font-medium transition-colors"
                      style={{ background: 'rgba(139, 92, 246, 0.16)', color: '#c4b5fd', borderRadius: '999px', border: '1px solid rgba(139, 92, 246, 0.24)' }}
                    >
                      #{event.task_id}
                    </button>
                  )}
                </div>
                <p className="text-xs line-clamp-2" style={{ color: '#94a3b8' }}>
                  {event.summary}
                </p>
              </div>
              <span className="text-[0.65rem] tabular-nums flex-shrink-0 mt-0.5" style={{ color: 'var(--muted-foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
                {timeAgo(event.created_at)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
