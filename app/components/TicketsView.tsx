import { useApp } from '../context/AppContext';
import { DEVELOPERS } from '../data/appData';
import { getStatusColor, getPriorityColor, getNodeColor } from '../utils/nodeColors';

export function TicketsView() {
  const { visible, selectedId, openPanel, setSelectedId } = useApp();

  const handleTicketClick = (taskId: string) => {
    setSelectedId(taskId);
    openPanel({ mode: 'task', id: taskId });
  };

  if (visible.tasks.length === 0) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-slate-300 mb-2">No tickets to display</h3>
          <p className="text-sm text-slate-500">Adjust your filters to see more tickets</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {visible.tasks.map((task) => {
          const dev = DEVELOPERS.find((d) => d.id === task.developerId);
          const statusCol = getStatusColor(task.status);
          const priorityCol = getPriorityColor(task.priority);
          const taskColor = getNodeColor('task');

          const statusLabel =
            task.status === 'progress'
              ? 'In Progress'
              : task.status.charAt(0).toUpperCase() + task.status.slice(1);

          return (
            <div
              key={task.id}
              onClick={() => handleTicketClick(task.id)}
              className={`
                p-4 rounded-lg border cursor-pointer transition-all duration-200
                ${selectedId === task.id ? 'ring-2 ring-offset-2 ring-offset-slate-950' : 'hover:border-white/20'}
              `}
              style={{
                backgroundColor: '#0b1221',
                borderColor: selectedId === task.id ? taskColor.accent : 'rgba(255, 255, 255, 0.1)',
                borderLeftWidth: '3px',
                borderLeftColor: taskColor.accent,
                boxShadow: selectedId === task.id
                  ? `0 0 20px ${taskColor.glow}, 0 4px 12px rgba(0, 0, 0, 0.5)`
                  : '0 4px 12px rgba(0, 0, 0, 0.3)',
              }}
            >
              {/* Title */}
              <h3 className="font-semibold text-sm text-slate-100 mb-2 line-clamp-2">
                {task.title}
              </h3>

              {/* Description */}
              <p className="text-xs text-slate-400 mb-3 line-clamp-2">{task.desc}</p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: statusCol?.bg,
                    color: statusCol?.text,
                  }}
                >
                  {statusLabel}
                </span>
                <span
                  className="px-2 py-0.5 rounded text-xs font-medium"
                  style={{
                    backgroundColor: priorityCol?.bg,
                    color: priorityCol?.text,
                  }}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-3 border-t border-white/5">
                {dev ? (
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-500 flex items-center justify-center text-xs font-bold text-slate-900">
                      {dev.initials}
                    </div>
                    <span className="text-xs text-slate-400">{dev.name}</span>
                  </div>
                ) : null}
                {task.dueDate ? (
                  <span className="text-xs text-slate-500 ml-auto">
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
