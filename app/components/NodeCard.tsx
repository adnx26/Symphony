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
      className="relative w-56 p-3 rounded-lg border select-none"
      style={{
        backgroundColor: '#0b1221',
        borderColor: isSelected ? color.accent : 'rgba(255, 255, 255, 0.1)',
        borderLeftWidth: '3px',
        borderLeftColor: color.accent,
        boxShadow: isSelected
          ? `0 0 20px ${color.glow}, 0 4px 12px rgba(0,0,0,0.5)`
          : isDragging
          ? `0 0 16px ${color.glow}, 0 8px 24px rgba(0,0,0,0.6)`
          : '0 4px 12px rgba(0,0,0,0.3)',
        opacity: isDragging ? 0.85 : 1,
        cursor: isDragging ? 'grabbing' : 'grab',
        transform: isDragging ? 'scale(1.04)' : isSelected ? 'scale(1.02)' : 'scale(1)',
        transition: isDragging ? 'none' : 'transform 0.15s, box-shadow 0.15s',
        zIndex: isDragging ? 1000 : undefined,
      }}
    >
      {/* Tags row */}
      <div className="flex items-center gap-2 mb-2">
        {status && (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium"
            style={{ backgroundColor: statusCol?.bg, color: statusCol?.text }}
          >
            {statusLabel}
          </span>
        )}
        <span
          className="px-2 py-0.5 rounded text-xs font-medium"
          style={{
            backgroundColor: `${color.accent}20`,
            color: color.accent,
          }}
        >
          {nodeType === 'sub-agent' ? 'SUB-AGENT' : nodeType.toUpperCase()}
        </span>
        {priority && (
          <span
            className="px-2 py-0.5 rounded text-xs font-medium ml-auto"
            style={{ backgroundColor: priorityCol?.bg, color: priorityCol?.text }}
          >
            {priority.charAt(0).toUpperCase() + priority.slice(1)}
          </span>
        )}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-sm text-slate-100 mb-1 truncate">{title}</h3>

      {/* Subtitle */}
      <p className="text-xs text-slate-400 mb-2 line-clamp-2">{subtitle}</p>

      {/* Avatar or due date */}
      <div className="flex items-center justify-between">
        {avatar ? (
          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-xs font-bold text-slate-900">
            {avatar}
          </div>
        ) : null}
        {dueDate ? (
          <span className="text-xs text-slate-500">
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
