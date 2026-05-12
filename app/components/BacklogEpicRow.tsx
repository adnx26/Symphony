import { useState } from 'react';
import { ChevronRight, Plus } from 'lucide-react';
import { AppEpic, AppStory, AppTask, AppDeveloper, StatusType } from '../types';
import { getStatusColor } from '../utils/nodeColors';
import { BacklogStoryRow } from './BacklogStoryRow';

interface BacklogEpicRowProps {
  epic: AppEpic;
  stories: AppStory[];
  tasks: AppTask[];
  developers: AppDeveloper[];
  selectedIds: Set<string>;
  onToggleSelect: (id: string) => void;
  onTaskStatusChange: (taskId: string, status: StatusType) => void;
  onStoryStatusChange: (storyId: string, status: StatusType) => void;
  onUpdateStory: (story: AppStory) => void;
  onAddTask: (storyId: string) => void;
  onAddStory: (epicId: string) => void;
}

const STATUS_LABELS: Record<string, string> = {
  active: 'Active',
  completed: 'Completed',
  archived: 'Archived',
};

export function BacklogEpicRow({
  epic,
  stories,
  tasks,
  developers,
  selectedIds,
  onToggleSelect,
  onTaskStatusChange,
  onStoryStatusChange,
  onUpdateStory,
  onAddTask,
  onAddStory,
}: BacklogEpicRowProps) {
  const [expanded, setExpanded] = useState(false);

  const doneStories = stories.filter(s => {
    const storyTasks = tasks.filter(t => t.storyId === s.id);
    if (storyTasks.length === 0) return s.status === 'done';
    return storyTasks.every(t => t.status === 'done');
  }).length;
  const progress = stories.length > 0 ? Math.round((doneStories / stories.length) * 100) : 0;

  const epicStatusColor: Record<string, { bg: string; text: string }> = {
    active: { bg: 'rgba(59, 130, 246, 0.14)', text: '#60a5fa' },
    completed: { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' },
    archived: { bg: 'rgba(123, 132, 148, 0.14)', text: '#9ca3af' },
  };

  const statusStyle = epicStatusColor[epic.status] ?? epicStatusColor.active;

  return (
    <div
      className="rounded overflow-hidden"
      style={{
        border: '1px solid var(--border)',
        marginBottom: '8px',
        background: 'rgba(11, 17, 26, 0.68)',
        borderRadius: '16px',
        boxShadow: '0 12px 28px rgba(2, 6, 23, 0.24)',
      }}
    >
      {/* Epic header row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer group transition-colors"
        style={{
          background: expanded ? 'rgba(21, 34, 51, 0.82)' : '#101923',
          borderBottom: expanded ? '1px solid rgba(49, 67, 85, 0.42)' : 'none',
        }}
        onClick={() => setExpanded((p) => !p)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = 'rgba(21, 34, 51, 0.9)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = expanded ? 'rgba(21, 34, 51, 0.82)' : '#101923';
        }}
      >
        {/* Color swatch */}
        <div
          className="w-3 h-3 rounded-sm flex-shrink-0"
          style={{ background: epic.color }}
        />

        {/* Chevron */}
        <ChevronRight
          className="w-3.5 h-3.5 flex-shrink-0 transition-transform"
          style={{
            color: 'var(--muted-foreground)',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />

        {/* Title */}
        <span className="flex-1 text-xs font-semibold truncate" style={{ color: 'var(--foreground)' }}>
          {epic.title}
        </span>

        {/* Story count */}
        <span className="flex-shrink-0 text-[0.65rem]" style={{ color: 'var(--muted-foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </span>

        {/* Status badge */}
        <span
          className="flex-shrink-0 px-2 py-1 text-[0.62rem] font-medium"
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
            borderRadius: '999px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          }}
        >
          {STATUS_LABELS[epic.status] ?? epic.status}
        </span>

        {/* Progress bar */}
        {stories.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1.5" style={{ minWidth: '100px' }}>
            <div
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ background: 'rgba(49, 67, 85, 0.6)' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: progress === 100 ? '#16a34a' : epic.color,
                }}
              />
            </div>
            <span className="text-[0.6rem] tabular-nums" style={{ color: 'var(--muted-foreground)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}>
              {doneStories}/{stories.length}
            </span>
          </div>
        )}
      </div>

      {/* Expanded: stories */}
      {expanded && (
        <div>
          {stories.length === 0 ? (
            <div
              className="text-[0.7rem] px-10 py-2.5"
              style={{ color: 'var(--muted-foreground)' }}
            >
              No stories yet
            </div>
          ) : (
            stories.map((story) => {
              const storyTasks = tasks.filter((t) => t.storyId === story.id);
              return (
                <BacklogStoryRow
                  key={story.id}
                  story={story}
                  tasks={storyTasks}
                  epic={epic}
                  developers={developers}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onTaskStatusChange={onTaskStatusChange}
                  onStoryStatusChange={onStoryStatusChange}
                  onUpdateStory={onUpdateStory}
                  onAddTask={onAddTask}
                  indentLevel={1}
                />
              );
            })
          )}

          {/* + Add Story */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddStory(epic.id);
            }}
            className="flex items-center gap-1 text-[0.7rem] font-medium px-4 py-2.5 w-full transition-colors"
            style={{
              color: 'var(--muted-foreground)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              paddingLeft: '52px',
              borderTop: '1px solid rgba(49, 67, 85, 0.42)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
          >
            <Plus className="w-3 h-3" />
            Add Story
          </button>
        </div>
      )}
    </div>
  );
}
