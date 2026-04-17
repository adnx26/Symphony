import { NodeType, StatusType, PriorityType, AgentDispatchStatus } from '../types';
import { getNodeColor, getStatusColor, getPriorityColor } from '../utils/nodeColors';
import { useApp } from '../context/AppContext';

interface NodeCardProps {
  nodeId: string;
  nodeType: NodeType;
  title: string;
  subtitle: string;
  status?: StatusType;
  priority?: PriorityType;
  dueDate?: string;
  avatar?: string;
  isSelected?: boolean;
  isDragging?: boolean;
  isAgentTouched?: boolean;
  onDragStart?: (e: React.MouseEvent) => void;
}

function useAgentDispatchStatus(nodeId: string, nodeType: NodeType): AgentDispatchStatus | null {
  const { allTasks, getTaskDispatches } = useApp();
  if (nodeType !== 'agent') return null;
  const relatedTaskIds = allTasks
    .filter(t => t.agentId === nodeId)
    .map(t => t.id);
  const allDispatches = relatedTaskIds.flatMap(tid => getTaskDispatches(tid));
  if (allDispatches.length === 0) return null;
  const latest = allDispatches.sort(
    (a, b) => new Date(b.request.dispatchedAt).getTime() - new Date(a.request.dispatchedAt).getTime()
  )[0];
  return latest.status;
}

function DispatchDot({ status }: { status: AgentDispatchStatus | null }) {
  if (!status || status === 'idle') return null;
  const dotClass =
    status === 'dispatched' ? 'animate-pulse bg-amber-500' :
    status === 'running'    ? 'animate-pulse bg-violet-500' :
    status === 'completed'  ? 'bg-emerald-500' :
    status === 'failed'     ? 'bg-red-500' : '';
  return (
    <div
      className={`absolute bottom-2 left-3 w-1.5 h-1.5 rounded-full ${dotClass}`}
      title={status}
    />
  );
}

export function NodeCard({
  nodeId,
  nodeType,
  title,
  subtitle,
  status,
  priority,
  dueDate,
  avatar,
  isSelected = false,
  isDragging = false,
  isAgentTouched = false,
  onDragStart,
}: NodeCardProps) {
  const color = getNodeColor(nodeType);
  const dispatchStatus = useAgentDispatchStatus(nodeId, nodeType);
  const statusCol = status ? getStatusColor(status) : null;
  const priorityCol = priority ? getPriorityColor(priority) : null;

  const statusLabel =
    status === 'progress'
      ? 'In Progress'
      : status
      ? status.charAt(0).toUpperCase() + status.slice(1)
      : '';

  return (
    <div
      onMouseDown={(e) => {
        e.stopPropagation();
        onDragStart?.(e);
      }}
      className="relative w-56 select-none"
      style={{
        backgroundColor: 'var(--card)',
        border: `1px solid ${isSelected ? color.accent : 'var(--border)'}`,
        borderLeft: `3px solid ${color.accent}`,
        borderRadius: '4px',
        boxShadow: isSelected
          ? '0 0 0 2px rgba(0,0,0,0.06), 0 4px 16px rgba(0,0,0,0.1)'
          : isDragging
          ? '0 8px 24px rgba(0,0,0,0.12)'
          : '0 1px 4px rgba(0,0,0,0.06)',
        opacity: isDragging ? 0.9 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.02) rotate(0.5deg)' : isSelected ? 'scale(1.01)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s, box-shadow 0.1s, border-color 0.1s',
        padding: '10px 12px 10px 10px',
        zIndex: isDragging ? 1000 : undefined,
      }}
    >
      {isAgentTouched && (
        <div style={{
          position: 'absolute', top: 6, right: 6,
          fontSize: '0.6rem', lineHeight: 1,
          opacity: 0.7,
          zIndex: 1,
        }}>🤖</div>
      )}
      <DispatchDot status={dispatchStatus} />

      {/* Tags row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {status && (
          <span
            className="px-1.5 py-0.5 text-[0.65rem] font-medium"
            style={{
              backgroundColor: statusCol?.bg,
              color: statusCol?.text,
              borderRadius: '3px',
            }}
          >
            {statusLabel}
          </span>
        )}
        <span
          className="px-1.5 py-0.5 text-[0.65rem] font-medium"
          style={{
            backgroundColor: color.bg,
            color: color.accent,
            borderRadius: '3px',
          }}
        >
          {nodeType === 'sub-agent' ? 'Sub-Agent' : nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
        </span>
        {priority && (
          <span
            className="px-1.5 py-0.5 text-[0.65rem] font-medium ml-auto"
            style={{
              backgroundColor: priorityCol?.bg,
              color: priorityCol?.text,
              borderRadius: '3px',
            }}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3
        className="text-xs font-semibold mb-1 truncate"
        style={{ color: 'var(--foreground)' }}
      >
        {title}
      </h3>

      {/* Subtitle */}
      <p
        className="text-xs mb-2 line-clamp-2"
        style={{ color: 'var(--muted-foreground)', lineHeight: 1.4 }}
      >
        {subtitle}
      </p>

      {/* Footer row */}
      <div className="flex items-center justify-between">
        {avatar ? (
          <div
            className="w-5 h-5 flex items-center justify-center text-[0.6rem] font-semibold"
            style={{
              background: 'var(--secondary)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              color: 'var(--secondary-foreground)',
            }}
          >
            {avatar}
          </div>
        ) : null}
        {dueDate ? (
          <span className="text-[0.65rem] tabular-nums ml-auto" style={{ color: '#a1a1aa' }}>
            {new Date(dueDate).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}
          </span>
        ) : null}
      </div>
    </div>
  );
}
