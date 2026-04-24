import { useClaudeSession } from '../context/ClaudeSessionContext';
import { ClaudeEvent } from '../types';
import { timeAgo } from '../utils/timeAgo';

const PHASE_LABELS: Record<ClaudeEvent['phase'], string> = {
  exploring: 'Exploring',
  implementing: 'Implementing',
  running: 'Running',
  debugging: 'Debugging',
  waiting: 'Waiting',
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

interface Props {
  taskId: string;
}

export function ActivityFeed({ taskId }: Props) {
  const { events } = useClaudeSession();
  const taskEvents = events.filter((e) => e.task_id === taskId);

  if (taskEvents.length === 0) {
    return (
      <p className="text-xs py-4 text-center" style={{ color: '#a1a1aa' }}>
        No Claude activity for this task yet.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {taskEvents.map((event) => (
        <div key={event.id} className="flex items-start gap-2.5">
          {/* Phase badge */}
          <span
            className="px-1.5 py-0.5 text-[0.6rem] font-semibold flex-shrink-0 mt-0.5"
            style={{
              background: `${PHASE_COLORS[event.phase] ?? '#d1d5db'}1a`,
              color: PHASE_COLORS[event.phase] ?? '#71717a',
              borderRadius: '3px',
            }}
          >
            {PHASE_LABELS[event.phase] ?? event.phase}
          </span>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              {event.tool_name && (
                <span
                  className="px-1.5 py-0.5 text-[0.6rem] font-medium"
                  style={{ background: '#f4f4f5', color: '#71717a', borderRadius: '3px' }}
                >
                  {event.tool_name}
                </span>
              )}
            </div>
            <p className="text-xs mt-0.5 line-clamp-2" style={{ color: '#71717a' }}>
              {event.summary}
            </p>
            <p className="text-[0.6rem] mt-0.5" style={{ color: '#a1a1aa' }}>
              {timeAgo(event.created_at)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}
