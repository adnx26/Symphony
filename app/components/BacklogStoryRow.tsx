import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { AppStory, AppTask, AppDeveloper, AppEpic, StatusType } from '../types';
import { getStatusColor } from '../utils/nodeColors';
import { BacklogTaskRow } from './BacklogTaskRow';

interface BacklogStoryRowProps {
  story: AppStory;
  tasks: AppTask[];
  epic?: AppEpic;
  developers: AppDeveloper[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onTaskStatusChange: (taskId: string, status: StatusType) => void;
  onStoryStatusChange: (storyId: string, status: StatusType) => void;
  onUpdateStory: (story: AppStory) => void;
  onAddTask: (storyId: string) => void;
  indentLevel?: number;
}

const STATUS_CYCLE: StatusType[] = ['todo', 'progress', 'done', 'blocked'];

const STATUS_LABELS: Record<StatusType, string> = {
  todo: 'To Do',
  progress: 'In Progress',
  done: 'Done',
  blocked: 'Blocked',
};

export function BacklogStoryRow({
  story,
  tasks,
  epic,
  developers,
  selectedIds,
  onToggleSelect,
  onTaskStatusChange,
  onStoryStatusChange,
  onAddTask,
  indentLevel = 0,
}: BacklogStoryRowProps) {
  const [expanded, setExpanded] = useState(false);

  const statusCol = getStatusColor(story.status) ?? { bg: 'rgba(123, 132, 148, 0.14)', text: '#9ca3af' };
  const doneTasks = tasks.filter((t) => t.status === 'done').length;
  const progress = tasks.length > 0 ? Math.round((doneTasks / tasks.length) * 100) : 0;

  const isStorySelected = selectedIds.has(story.id);

  const cycleStatus = (e: React.MouseEvent) => {
    e.stopPropagation();
    const idx = STATUS_CYCLE.indexOf(story.status);
    const next = STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length];
    onStoryStatusChange(story.id, next);
  };

  const indentPx = indentLevel * 20 + 16;

  return (
    <div>
      {/* Story row */}
      <div
        className="flex items-center gap-2.5 py-2 group transition-colors cursor-pointer"
        style={{
          paddingLeft: `${indentPx}px`,
          paddingRight: '16px',
          background: isStorySelected ? 'rgba(139,92,246,0.1)' : 'transparent',
          borderBottom: '1px solid rgba(49, 67, 85, 0.42)',
        }}
        onClick={() => setExpanded((p) => !p)}
        onMouseEnter={(e) => {
          if (!isStorySelected) (e.currentTarget as HTMLElement).style.background = 'rgba(21, 34, 51, 0.76)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background =
            isStorySelected ? 'rgba(124,58,237,0.04)' : 'transparent';
        }}
      >
        {/* Checkbox */}
        <input
          type="checkbox"
          checked={isStorySelected}
          onChange={() => onToggleSelect(story.id)}
          onClick={(e) => e.stopPropagation()}
          className="w-3.5 h-3.5 flex-shrink-0 cursor-pointer accent-violet-600"
        />

        {/* Expand chevron */}
        <ChevronRight
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
          style={{
            color: 'var(--muted-foreground)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />

        {/* Epic color dot */}
        {epic && (
          <div
            className="w-2 h-2 rounded-full flex-shrink-0"
            style={{ background: epic.color }}
            title={epic.title}
          />
        )}

        {/* Title */}
        <span className="flex-1 text-xs font-medium truncate" style={{ color: 'var(--foreground)' }}>
          {story.title}
        </span>

        {/* Story points */}
        {story.storyPoints > 0 && (
          <span
            className="flex-shrink-0 text-[0.65rem] tabular-nums px-1.5 py-0.5"
            style={{
              background: 'rgba(16, 25, 35, 0.92)',
              color: '#94a3b8',
              borderRadius: '999px',
              border: '1px solid rgba(49, 67, 85, 0.72)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {story.storyPoints} pts
          </span>
        )}

        {/* Status badge — clickable */}
        <button
          onClick={cycleStatus}
          className="flex-shrink-0 px-1.5 py-0.5 text-[0.65rem] font-medium cursor-pointer transition-opacity hover:opacity-80"
          style={{
            background: statusCol.bg,
            color: statusCol.text,
            borderRadius: '999px',
            border: 'none',
            outline: 'none',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
          title="Click to change status"
        >
          {STATUS_LABELS[story.status]}
        </button>

        {/* Progress bar */}
        {tasks.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1.5" style={{ minWidth: '80px' }}>
            <div
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(49, 67, 85, 0.6)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: progress === 100 ? '#16a34a' : '#7c3aed',
                }}
              />
            </div>
            <span className="text-[0.6rem] tabular-nums" style={{ color: 'var(--muted-foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {doneTasks}/{tasks.length}
            </span>
          </div>
        )}
      </div>

      {/* Expanded: tasks */}
      {expanded && (
        <div>
          {tasks.length === 0 ? (
            <div
              className="text-[0.7rem] px-8 py-2"
              style={{ color: 'var(--muted-foreground)', paddingLeft: `${indentPx + 32}px` }}
            >
              No tasks yet
            </div>
          ) : (
            tasks.map((task) => (
              <BacklogTaskRow
                key={task.id}
                task={task}
                developers={developers}
                selected={selectedIds.has(task.id)}
                onToggleSelect={onToggleSelect}
                onStatusChange={onTaskStatusChange}
              />
            ))
          )}

          {/* + Add Task */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddTask(story.id);
            }}
            className="flex items-center gap-1 text-[0.7rem] font-medium px-3 py-2 transition-colors"
            style={{
              paddingLeft: `${indentPx + 28}px`,
              color: 'var(--muted-foreground)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              width: '100%',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
          >
            <Plus className="w-3 h-3" />
            Add Task
          </button>
        </div>
      )}
    </div>
  );
}
