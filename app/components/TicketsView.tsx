import { useApp } from '../context/AppContext';
import { getStatusColor, getPriorityColor, getNodeColor } from '../utils/nodeColors';

export function TicketsView() {
  const { visible, selectedId, openPanel, setSelectedId, developers } = useApp();

  const handleTicketClick = (taskId: string) => {
    setSelectedId(taskId);
    openPanel({ mode: 'task', id: taskId });
  };

  if (visible.tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-sm font-medium mb-1" style={{ color: '#0f0f0f' }}>No tickets to display</p>
          <p className="text-xs" style={{ color: '#a1a1aa' }}>Adjust your filters to see more tickets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-5" style={{ background: '#f8f8f9' }}>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
        {visible.tasks.map((task) => {
          const dev = developers.find((d) => d.id === task.developerId);
          const statusCol = getStatusColor(task.status);
          const priorityCol = getPriorityColor(task.priority);
          const taskColor = getNodeColor('task');

          const statusLabel =
            task.status === 'progress'
              ? 'In Progress'
              : task.status.charAt(0).toUpperCase() + task.status.slice(1);

          const isSelected = selectedId === task.id;

          return (
            <div
              key={task.id}
              onClick={() => handleTicketClick(task.id)}
              className="p-4 cursor-pointer transition-all"
              style={{
                background: '#ffffff',
                border: `1px solid ${isSelected ? taskColor.accent : '#e4e4e7'}`,
                borderLeft: `3px solid ${taskColor.accent}`,
                borderRadius: '4px',
                boxShadow: isSelected
                  ? '0 0 0 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)'
                  : '0 1px 3px rgba(0,0,0,0.04)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#d1d1d6';
              }}
              onMouseLeave={(e) => {
                if (!isSelected) (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7';
              }}
            >
              {/* Title */}
              <h3
                className="text-xs font-semibold mb-1.5 line-clamp-2"
                style={{ color: '#0f0f0f' }}
              >
                {task.title}
              </h3>

              {/* Description */}
              <p className="text-xs mb-3 line-clamp-2" style={{ color: '#71717a', lineHeight: 1.4 }}>
                {task.desc}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span
                  className="px-1.5 py-0.5 text-[0.65rem] font-medium"
                  style={{
                    background: statusCol?.bg,
                    color: statusCol?.text,
                    borderRadius: '3px',
                  }}
                >
                  {statusLabel}
                </span>
                <span
                  className="px-1.5 py-0.5 text-[0.65rem] font-medium"
                  style={{
                    background: priorityCol?.bg,
                    color: priorityCol?.text,
                    borderRadius: '3px',
                  }}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-2.5"
                style={{ borderTop: '1px solid #f4f4f5' }}
              >
                {dev ? (
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-5 h-5 flex items-center justify-center text-[0.6rem] font-semibold"
                      style={{
                        background: '#f4f4f5',
                        border: '1px solid #e4e4e7',
                        borderRadius: '50%',
                        color: '#3f3f46',
                      }}
                    >
                      {dev.initials}
                    </div>
                    <span className="text-xs" style={{ color: '#71717a' }}>{dev.name}</span>
                  </div>
                ) : <div />}
                {task.dueDate ? (
                  <span className="text-[0.65rem] tabular-nums" style={{ color: '#a1a1aa' }}>
                    {new Date(task.dueDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </span>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
