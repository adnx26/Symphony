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
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>No tickets to display</p>
          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Adjust your filters to see more tickets</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="h-full overflow-y-auto p-5 md:p-6"
      style={{
        background:
          'linear-gradient(180deg, rgba(11,17,26,0.55), rgba(7,11,18,0.88))',
      }}
    >
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
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
              className={`p-4 md:p-5 cursor-pointer transition-all${isClaudeActive ? ' claude-active-card' : ''}`}
              style={{
                background: '#101923',
                border: `1px solid ${isClaudeActive ? '#8b5cf6' : isSelected ? taskColor.accent : '#1f2b3a'}`,
                borderLeft: `3px solid ${isClaudeActive ? '#7c3aed' : taskColor.accent}`,
                borderRadius: '16px',
                boxShadow: isSelected && !isClaudeActive
                  ? `0 0 0 1px ${taskColor.glow}, 0 16px 34px rgba(2, 6, 23, 0.34)`
                  : '0 12px 28px rgba(2, 6, 23, 0.28)',
                transform: isSelected ? 'translateY(-1px)' : 'translateY(0)',
              }}
              onMouseEnter={(e) => {
                if (!isSelected && !isClaudeActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderTopColor = '#314355';
                  el.style.borderRightColor = '#314355';
                  el.style.borderBottomColor = '#314355';
                  el.style.transform = 'translateY(-2px)';
                  el.style.boxShadow = '0 18px 36px rgba(2, 6, 23, 0.34)';
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected && !isClaudeActive) {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderTopColor = '#1f2b3a';
                  el.style.borderRightColor = '#1f2b3a';
                  el.style.borderBottomColor = '#1f2b3a';
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = '0 12px 28px rgba(2, 6, 23, 0.28)';
                }
              }}
            >
              {/* Title */}
              <h3
                className="text-xs font-semibold mb-1.5 line-clamp-2"
                style={{ color: 'var(--foreground)' }}
              >
                {task.title}
              </h3>

              {/* Description */}
              <p className="text-xs mb-4 line-clamp-2" style={{ color: '#94a3b8', lineHeight: 1.55 }}>
                {task.desc}
              </p>

              {/* Tags */}
              <div className="flex flex-wrap items-center gap-1.5 mb-3">
                <span
                  className="px-2 py-1 text-[0.62rem] font-medium"
                  style={{
                    background: statusCol?.bg,
                    color: statusCol?.text,
                    borderRadius: '999px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    letterSpacing: '0.04em',
                  }}
                >
                  {statusLabel}
                </span>
                <span
                  className="px-2 py-1 text-[0.62rem] font-medium"
                  style={{
                    background: priorityCol?.bg,
                    color: priorityCol?.text,
                    borderRadius: '999px',
                    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                    letterSpacing: '0.04em',
                  }}
                >
                  {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                </span>
              </div>

              {/* Footer */}
              <div
                className="flex items-center justify-between pt-2.5"
                style={{ borderTop: '1px solid rgba(49, 67, 85, 0.55)' }}
              >
                <div className="flex items-center gap-2">
                  {dev ? (
                    <div className="flex items-center gap-1.5">
                      <div
                        className="w-5 h-5 flex items-center justify-center text-[0.6rem] font-semibold"
                        style={{
                          background: '#f4f4f5',
                          border: '1px solid rgba(49, 67, 85, 0.7)',
                          borderRadius: '50%',
                          color: '#dce3ee',
                          backgroundColor: 'rgba(16, 25, 35, 0.95)',
                        }}
                      >
                        {dev.initials}
                      </div>
                      <span className="text-xs" style={{ color: '#94a3b8' }}>{dev.name}</span>
                    </div>
                  ) : <div />}

                  {isClaudeActive && (
                    <div className="flex items-center gap-1 ml-1">
                      <span style={{ color: 'var(--muted-foreground)', fontSize: '0.6rem' }}>•</span>
                      <span style={{ color: '#8b5cf6', fontSize: '0.6rem' }}>⬡</span>
                      <span className="text-[0.6rem] font-medium" style={{ color: '#8b5cf6' }}>Claude</span>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {task.dueDate ? (
                    <span
                      className="text-[0.65rem] tabular-nums"
                      style={{ color: 'var(--muted-foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
                    >
                      {new Date(task.dueDate).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                      })}
                    </span>
                  ) : null}
                  <button
                    onClick={(e) => copyId(e, task.id)}
                    className="px-2 py-1 text-[0.6rem] font-mono transition-colors"
                    style={{
                      background: copiedId === task.id ? 'rgba(139, 92, 246, 0.16)' : 'rgba(16, 25, 35, 0.92)',
                      color: copiedId === task.id ? '#c4b5fd' : 'var(--muted-foreground)',
                      borderRadius: '999px',
                      border: '1px solid rgba(49, 67, 85, 0.7)',
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
