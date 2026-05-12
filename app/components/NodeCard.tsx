import { NodeType, StatusType, PriorityType } from '../types';
import { getNodeColor, getStatusColor, getPriorityColor } from '../utils/nodeColors';

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
  onDragStart?: (e: React.MouseEvent) => void;
}

export function NodeCard({
  nodeId: _nodeId,
  nodeType,
  title,
  subtitle,
  status,
  priority,
  dueDate,
  avatar,
  isSelected = false,
  isDragging = false,
  onDragStart,
}: NodeCardProps) {
  const color = getNodeColor(nodeType);
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
        borderTop: `1px solid ${isSelected ? color.accent : 'var(--border)'}`,
        borderRight: `1px solid ${isSelected ? color.accent : 'var(--border)'}`,
        borderBottom: `1px solid ${isSelected ? color.accent : 'var(--border)'}`,
        borderLeft: `3px solid ${color.accent}`,
        borderRadius: '16px',
        boxShadow: isSelected
          ? `0 0 0 1px ${color.glow}, 0 18px 36px rgba(2, 6, 23, 0.34)`
          : isDragging
          ? '0 18px 40px rgba(2, 6, 23, 0.4)'
          : '0 12px 28px rgba(2, 6, 23, 0.28)',
        opacity: isDragging ? 0.9 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.02) rotate(0.5deg)' : isSelected ? 'scale(1.01)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.1s, box-shadow 0.1s, border-color 0.1s',
        padding: '12px 14px 12px 12px',
        zIndex: isDragging ? 1000 : undefined,
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Tags row */}
      <div className="flex items-center gap-1.5 mb-2 flex-wrap">
        {status && (
          <span
            className="px-2 py-1 text-[0.62rem] font-medium"
            style={{
              backgroundColor: statusCol?.bg,
              color: statusCol?.text,
              borderRadius: '999px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.04em',
            }}
          >
            {statusLabel}
          </span>
        )}
        <span
          className="px-2 py-1 text-[0.62rem] font-medium"
          style={{
            backgroundColor: color.bg,
            color: color.accent,
            borderRadius: '999px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            letterSpacing: '0.04em',
          }}
        >
          {nodeType.charAt(0).toUpperCase() + nodeType.slice(1)}
        </span>
        {priority && (
          <span
            className="px-2 py-1 text-[0.62rem] font-medium ml-auto"
            style={{
              backgroundColor: priorityCol?.bg,
              color: priorityCol?.text,
              borderRadius: '999px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              letterSpacing: '0.04em',
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
              background: 'rgba(16, 25, 35, 0.95)',
              border: '1px solid var(--border)',
              borderRadius: '50%',
              color: '#dce3ee',
            }}
          >
            {avatar}
          </div>
        ) : null}
        {dueDate ? (
          <span
            className="text-[0.65rem] tabular-nums ml-auto"
            style={{ color: 'var(--muted-foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
          >
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
