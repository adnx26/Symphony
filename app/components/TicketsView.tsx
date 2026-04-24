import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useClaudeSession } from '../context/ClaudeSessionContext';
import { getStatusColor, getPriorityColor, getNodeColor } from '../utils/nodeColors';

export function TicketsView() {
  const { visible, selectedId, openPanel, setSelectedId, developers } = useApp();
  const { activeTaskId } = useClaudeSession();
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const copyId = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    navigator.clipboard.writeText(id);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

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
          const isClaudeActive = activeTaskId === task.id;

          return (
            <div
              key={task.id}
              onClick={() => handleTicketClick(task.id)}
              className={`p-4 cursor-pointer transition-all${isClaudeActive ? ' claude-active-card' : ''}`}
              style={{
                background: '#ffffff',
                border: `1px solid ${isClaudeActive ? '#7c3aed' : isSelected ? taskColor.accent : '#e4e4e7'}`,
                borderLeft: `3px solid ${isClaudeActive ? '#7c3aed' : taskColor.accent}`,
                borderRadius: '4px',
                boxShadow: isSelected && !isClaudeActive
                  ? '0 0 0 2px rgba(0,0,0,0.06), 0 4px 12px rgba(0,0,0,0.08)'
                  : undefined,
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isClaudeActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderTopColor = '#d1d1d6';
                  el.style.borderRightColor = '#d1d1d6';
                  el.style.borderBottomColor = '#d1d1d6';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isClaudeActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderTopColor = '#e4e4e7';
                  el.style.borderRightColor = '#e4e4e7';
                  el.style.borderBottomColor = '#e4e4e7';
                }
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
                <div className="flex items-center gap-2">
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

                  {isClaudeActive && (
                    <div className="flex items-center gap-1 ml-1">
                      <span style={{ color: '#a1a1aa', fontSize: '0.6rem' }}>•</span>
                      <span style={{ color: '#7c3aed', fontSize: '0.6rem' }}>⬡</span>
                      <span className="text-[0.6rem] font-medium" style={{ color: '#7c3aed' }}>Claude</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {task.dueDate ? (
                    <span className="text-[0.65rem] tabular-nums" style={{ color: '#a1a1aa' }}>
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ) : null}
                  <button
                    onClick={(e) => copyId(e, task.id)}
                    className="px-1.5 py-0.5 text-[0.6rem] font-mono transition-colors"
                    style={{
                      background: copiedId === task.id ? '#ede9fe' : '#f4f4f5',
                      color: copiedId === task.id ? '#7c3aed' : '#a1a1aa',
                      borderRadius: '3px',
                      border: 'none',
                      cursor: 'pointer',
                    }}
                    title="Copy task ID"
                  >
                    {copiedId === task.id ? 'copied!' : task.id}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
