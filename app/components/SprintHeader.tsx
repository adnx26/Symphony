// app/components/SprintHeader.tsx
import { AppSprint, AppTask } from '../types';

interface SprintHeaderProps {
  sprint: AppSprint;
  tasks: AppTask[];
  onEdit: () => void;
  onComplete: () => void;
  onStart: () => void;
}

export function SprintHeader({ sprint, tasks, onEdit, onComplete, onStart }: SprintHeaderProps) {
  const doneTasks = tasks.filter((t) => t.status === 'done');
  const totalPoints = tasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
  const donePoints = doneTasks.reduce((sum, t) => sum + (t.storyPoints ?? 0), 0);
  const pct = tasks.length > 0 ? Math.round((doneTasks.length / tasks.length) * 100) : 0;

  // Days remaining
  let daysRemaining: number | null = null;
  if (sprint.endDate) {
    const end = new Date(sprint.endDate);
    const now = new Date();
    daysRemaining = Math.ceil((end.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  }

  const formatDate = (d?: string) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  return (
    <div
      className="px-5 py-4 border-b"
      style={{ background: 'rgba(11, 17, 26, 0.86)', borderColor: 'rgba(49, 67, 85, 0.7)', boxShadow: '0 10px 26px rgba(2, 6, 23, 0.22)' }}
    >
      {/* Top row: name + buttons */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold tracking-[0.04em]" style={{ color: 'var(--foreground)' }}>
              {sprint.name}
            </h2>
            <span
              className="px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide"
              style={{
                background:
                  sprint.status === 'active'
                    ? 'rgba(34, 197, 94, 0.16)'
                    : sprint.status === 'planned'
                    ? 'rgba(123, 132, 148, 0.14)'
                    : 'rgba(59, 130, 246, 0.14)',
                color:
                  sprint.status === 'active'
                    ? '#4ade80'
                    : sprint.status === 'planned'
                    ? '#cbd5e1'
                    : '#93c5fd',
                borderRadius: '999px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {sprint.status}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-xs" style={{ color: '#94a3b8' }}>
              {sprint.goal}
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-1.5 shrink-0">
          {sprint.status === 'planned' && (
            <button
              onClick={onStart}
              className="px-2.5 py-1 text-xs font-medium"
              style={{
                background: 'linear-gradient(135deg, rgba(20,184,166,0.22), rgba(59,130,246,0.2))',
                color: '#eff6ff',
                borderRadius: '12px',
                border: '1px solid rgba(45, 212, 191, 0.22)',
              }}
            >
              Start Sprint
            </button>
          )}
          <button
            onClick={onEdit}
            className="px-2.5 py-1 text-xs font-medium border"
            style={{
              background: 'rgba(16, 25, 35, 0.72)',
              borderColor: 'var(--border)',
              color: '#cbd5e1',
              borderRadius: '12px',
            }}
          >
            Edit Sprint
          </button>
          {sprint.status === 'active' && (
            <button
              onClick={onComplete}
              className="px-2.5 py-1 text-xs font-medium border"
              style={{
              background: 'rgba(16, 25, 35, 0.72)',
              borderColor: 'var(--border)',
              color: '#cbd5e1',
              borderRadius: '12px',
            }}
            >
              Complete Sprint
            </button>
          )}
        </div>
      </div>

      {/* Meta row: dates, days remaining, story points */}
      <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: '#94a3b8' }}>
        <span>
          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
        </span>
        {daysRemaining !== null && sprint.status === 'active' && (
          <span style={{ color: daysRemaining < 0 ? '#fb7185' : '#94a3b8' }}>
            {daysRemaining < 0
              ? `${Math.abs(daysRemaining)}d overdue`
              : daysRemaining === 0
              ? 'Due today'
              : `${daysRemaining}d remaining`}
          </span>
        )}
        <span>
          {donePoints}/{totalPoints} pts · {doneTasks.length}/{tasks.length} tasks done
        </span>
        <span>Capacity: {sprint.capacity} pts</span>
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-1.5 overflow-hidden"
        style={{ background: 'rgba(49, 67, 85, 0.6)', borderRadius: '999px' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: pct === 100 ? '#22c55e' : 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            borderRadius: '999px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
