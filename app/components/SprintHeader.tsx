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
      style={{ background: '#ffffff', borderColor: '#e4e4e7' }}
    >
      {/* Top row: name + buttons */}
      <div className="flex items-start justify-between gap-4 mb-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>
              {sprint.name}
            </h2>
            <span
              className="px-1.5 py-0.5 text-[0.6rem] font-semibold uppercase tracking-wide"
              style={{
                background:
                  sprint.status === 'active'
                    ? '#dcfce7'
                    : sprint.status === 'planned'
                    ? '#f4f4f5'
                    : '#e0e7ff',
                color:
                  sprint.status === 'active'
                    ? '#166534'
                    : sprint.status === 'planned'
                    ? '#3f3f46'
                    : '#3730a3',
                borderRadius: '3px',
              }}
            >
              {sprint.status}
            </span>
          </div>
          {sprint.goal && (
            <p className="text-xs" style={{ color: '#71717a' }}>
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
                background: '#0f0f0f',
                color: '#fff',
                borderRadius: '4px',
              }}
            >
              Start Sprint
            </button>
          )}
          <button
            onClick={onEdit}
            className="px-2.5 py-1 text-xs font-medium border"
            style={{
              background: 'transparent',
              borderColor: '#e4e4e7',
              color: '#3f3f46',
              borderRadius: '4px',
            }}
          >
            Edit Sprint
          </button>
          {sprint.status === 'active' && (
            <button
              onClick={onComplete}
              className="px-2.5 py-1 text-xs font-medium border"
              style={{
                background: 'transparent',
                borderColor: '#e4e4e7',
                color: '#3f3f46',
                borderRadius: '4px',
              }}
            >
              Complete Sprint
            </button>
          )}
        </div>
      </div>

      {/* Meta row: dates, days remaining, story points */}
      <div className="flex items-center gap-4 mb-3 text-xs" style={{ color: '#71717a' }}>
        <span>
          {formatDate(sprint.startDate)} – {formatDate(sprint.endDate)}
        </span>
        {daysRemaining !== null && sprint.status === 'active' && (
          <span style={{ color: daysRemaining < 0 ? '#ef4444' : '#71717a' }}>
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
        style={{ background: '#f4f4f5', borderRadius: '2px' }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            background: pct === 100 ? '#22c55e' : '#0f0f0f',
            borderRadius: '2px',
            transition: 'width 0.3s ease',
          }}
        />
      </div>
    </div>
  );
}
