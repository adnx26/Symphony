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
    active: { bg: '#eff6ff', text: '#1d4ed8' },
    completed: { bg: '#f0fdf4', text: '#15803d' },
    archived: { bg: '#f4f4f5', text: '#71717a' },
  };

  const statusStyle = epicStatusColor[epic.status] ?? epicStatusColor.active;

  return (
    <div
      className="rounded overflow-hidden"
      style={{ border: '1px solid #e4e4e7', marginBottom: '4px' }}
    >
      {/* Epic header row */}
      <div
        className="flex items-center gap-3 px-3 py-2.5 cursor-pointer group transition-colors"
        style={{
          background: expanded ? '#fafafa' : '#ffffff',
          borderBottom: expanded ? '1px solid #f4f4f5' : 'none',
        }}
        onClick={() => setExpanded((p) => !p)}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.background = '#fafafa';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.background = expanded ? '#fafafa' : '#ffffff';
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
            color: '#a1a1aa',
            transform: expanded ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
        />

        {/* Title */}
        <span className="flex-1 text-xs font-semibold truncate" style={{ color: '#0f0f0f' }}>
          {epic.title}
        </span>

        {/* Story count */}
        <span className="flex-shrink-0 text-[0.65rem]" style={{ color: '#a1a1aa' }}>
          {stories.length} {stories.length === 1 ? 'story' : 'stories'}
        </span>

        {/* Status badge */}
        <span
          className="flex-shrink-0 px-1.5 py-0.5 text-[0.65rem] font-medium"
          style={{
            background: statusStyle.bg,
            color: statusStyle.text,
            borderRadius: '3px',
          }}
        >
          {STATUS_LABELS[epic.status] ?? epic.status}
        </span>

        {/* Progress bar */}
        {stories.length > 0 && (
          <div className="flex-shrink-0 flex items-center gap-1.5" style={{ minWidth: '100px' }}>
            <div
              className="h-1 flex-1 rounded-full overflow-hidden"
              style={{ background: '#f4f4f5' }}
            >
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${progress}%`,
                  background: progress === 100 ? '#16a34a' : epic.color,
                }}
              />
            </div>
            <span className="text-[0.6rem] tabular-nums" style={{ color: '#a1a1aa' }}>
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
              style={{ color: '#a1a1aa' }}
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
              color: '#a1a1aa',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              paddingLeft: '52px',
              borderTop: '1px solid #f4f4f5',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
          >
            <Plus className="w-3 h-3" />
            Add Story
          </button>
        </div>
      )}
    </div>
  );
}
