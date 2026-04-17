import { AppTask, AppDeveloper, StatusType } from '../types';
import { getStatusColor, getPriorityColor } from '../utils/nodeColors';

interface BacklogTaskRowProps {
  task: AppTask;
  developers: AppDeveloper[];
  selected: boolean;
  onToggleSelect: (id: string) => void;
  onStatusChange: (taskId: string, newStatus: StatusType) => void;
}

const STATUS_CYCLE: StatusType[] = ['todo', 'progress', 'done', 'blocked'];

const STATUS_LABELS: Record<StatusType, string> = {
  todo: 'To Do',
  progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

export function BacklogTaskRow({
  task,
  developers,
  selected,
  onToggleSelect,
  onStatusChange,
}: BacklogTaskRowProps) {
  const dev = developers.find((d) => d.id === task.developerId);
  const statusCol = getStatusColor(task.status) ?? { bg: '#f4f4f5', text: '#71717a' };
  const priorityCol = getPriorityColor(task.priority) ?? { bg: '#f4f4f5', text: '#71717a' };

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(task.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStatusChange(task.id, next);
  };

  return (
    <div
      className="flex items-center gap-3 px-4 py-2.5 group transition-colors"
      style={{
        background: selected ? 'rgba(124,58,237,0.04)' : 'transparent',
        borderBottom: '1px solid #f4f4f5',
      }}
      onMouseEnter={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = '#fafafa';
      }}
      onMouseLeave={(e) => {
        if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      {/* Checkbox */}
      <input
        type="checkbox"
        checked={selected}
        onChange={() => onToggleSelect(task.id)}
        onClick={(e) => e.stopPropagation()}
        className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer accent-violet-600"
        style={{ marginLeft: '4px' }}
      />

      {/* Indent indicator */}
      <div
        className="flex-shrink-0"
        style={{ width: '12px', height: '1px', background: '#e4e4e7', marginLeft: '4px' }}
      />

      {/* Title */}
      <span
        className="flex-1 text-xs truncate"
        style={{ color: task.status === 'done' ? '#a1a1aa' : '#0f0f0f', textDecoration: task.status === 'done' ? 'line-through' : 'none' }}
      >
        {task.title}
      </span>

      {/* Status badge — clickable to cycle */}
      <button
        onClick={cycleStatus}
        className="flex-shrink-0 px-1.5 py-0.5 text-[0.65rem] font-medium cursor-pointer transition-opacity hover:opacity-80"
        style={{
          background: statusCol.bg,
          color: statusCol.text,
          borderRadius: '3px',
          border: 'none',
          outline: 'none',
        }}
        title="Click to change status"
      >
        {STATUS_LABELS[task.status]}
      </button>

      {/* Priority badge */}
      <span
        className="flex-shrink-0 px-1.5 py-0.5 text-[0.65rem] font-medium"
        style={{
          background: priorityCol.bg,
          color: priorityCol.text,
          borderRadius: '3px',
          minWidth: '52px',
          textAlign: 'center',
        }}
      >
        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
      </span>

      {/* Assignee */}
      <div className="flex-shrink-0 flex items-center gap-1" style={{ minWidth: '80px' }}>
        {dev ? (
          <>
            <div
              className="w-4 h-4 flex items-center justify-center text-[0.55rem] font-semibold flex-shrink-0"
              style={{
                background: '#f4f4f5',
                border: '1px solid #e4e4e7',
                borderRadius: '50%',
                color: '#3f3f46',
              }}
            >
              {dev.initials}
            </div>
            <span className="text-[0.65rem] truncate" style={{ color: '#71717a' }}>{dev.name}</span>
          </>
        ) : (
          <span className="text-[0.65rem]" style={{ color: '#d1d1d6' }}>Unassigned</span>
        )}
      </div>

      {/* Due date */}
      <span
        className="flex-shrink-0 text-[0.65rem] tabular-nums"
        style={{ color: '#a1a1aa', minWidth: '60px', textAlign: 'right' }}
      >
        {task.dueDate
          ? new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
          : ''}
      </span>
    </div>
  );
}
