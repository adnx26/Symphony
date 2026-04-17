// app/components/SprintView.tsx
import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { AppTask } from '../types';
import { SprintHeader } from './SprintHeader';
import { SprintPlanningModal } from './SprintPlanningModal';
import { getPriorityColor, getStatusColor } from '../utils/nodeColors';

// ── Kanban column ─────────────────────────────────────────────────────────────

interface KanbanColumnProps {
  title: string;
  tasks: AppTask[];
  accent: string;
  onTaskClick: (id: string) => void;
  developers: ReturnType<typeof useApp>['developers'];
}

function KanbanColumn({ title, tasks, accent, onTaskClick, developers }: KanbanColumnProps) {
  return (
    <div className="flex flex-col flex-1 min-w-0">
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2 mb-2 border-b"
        style={{ borderColor: '#e4e4e7' }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: accent }}
        />
        <span className="text-xs font-semibold" style={{ color: '#0f0f0f' }}>
          {title}
        </span>
        <span
          className="ml-auto text-[0.6rem] font-semibold px-1.5 py-0.5"
          style={{
            background: '#f4f4f5',
            color: '#71717a',
            borderRadius: '3px',
          }}
        >
          {tasks.length}
        </span>
      </div>

      {/* Task cards */}
      <div className="flex-1 overflow-y-auto space-y-2 px-1">
        {tasks.length === 0 ? (
          <p
            className="text-center text-xs py-8"
            style={{ color: '#a1a1aa' }}
          >
            No tasks
          </p>
        ) : (
          tasks.map((task) => (
            <SprintTaskCard
              key={task.id}
              task={task}
              developers={developers}
              onClick={() => onTaskClick(task.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// ── Task card ─────────────────────────────────────────────────────────────────

interface SprintTaskCardProps {
  task: AppTask;
  developers: ReturnType<typeof useApp>['developers'];
  onClick: () => void;
}

function SprintTaskCard({ task, developers, onClick }: SprintTaskCardProps) {
  const dev = developers.find((d) => d.id === task.developerId);
  const priorityCol = getPriorityColor(task.priority);
  const statusCol = getStatusColor(task.status);

  const statusLabel =
    task.status === 'progress'
      ? 'In Progress'
      : task.status.charAt(0).toUpperCase() + task.status.slice(1);

  return (
    <div
      onClick={onClick}
      className="px-3 py-2.5 cursor-pointer transition-all"
      style={{
        background: '#ffffff',
        border: '1px solid #e4e4e7',
        borderRadius: '4px',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#d1d1d6';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 2px 8px rgba(0,0,0,0.07)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#e4e4e7';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 3px rgba(0,0,0,0.04)';
      }}
    >
      <p className="text-xs font-medium mb-2 line-clamp-2" style={{ color: '#0f0f0f' }}>
        {task.title}
      </p>

      {/* Status pill for blocked */}
      {task.status === 'blocked' && (
        <span
          className="inline-flex px-1.5 py-0.5 text-[0.6rem] font-medium mb-2"
          style={{
            background: statusCol?.bg,
            color: statusCol?.text,
            borderRadius: '3px',
          }}
        >
          {statusLabel}
        </span>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Priority badge */}
          <span
            className="px-1.5 py-0.5 text-[0.6rem] font-medium"
            style={{
              background: priorityCol?.bg,
              color: priorityCol?.text,
              borderRadius: '3px',
            }}
          >
            {task.priority}
          </span>

          {/* Assignee initials */}
          {dev && (
            <div
              className="w-5 h-5 flex items-center justify-center text-[0.55rem] font-semibold"
              style={{
                background: '#f4f4f5',
                border: '1px solid #e4e4e7',
                borderRadius: '50%',
                color: '#3f3f46',
              }}
              title={dev.name}
            >
              {dev.initials}
            </div>
          )}
        </div>

        {/* Story points */}
        {task.storyPoints != null && (
          <span
            className="text-[0.6rem] font-semibold tabular-nums px-1.5 py-0.5"
            style={{
              background: '#f4f4f5',
              color: '#71717a',
              borderRadius: '3px',
            }}
          >
            {task.storyPoints} pts
          </span>
        )}
      </div>
    </div>
  );
}

// ── SprintView ────────────────────────────────────────────────────────────────

export function SprintView() {
  const ctx = useApp();
  const { activeSprint, sprints, getSprintTasks, developers, openPanel, updateSprint } = ctx;
  const [planningOpen, setPlanningOpen] = useState(false);
  const [editSprint, setEditSprint] = useState<typeof activeSprint>(undefined);

  const displaySprint = activeSprint ?? sprints.find((s) => s.status === 'planned');

  const sprintTasks = displaySprint ? getSprintTasks(displaySprint.id) : [];

  const todoTasks = sprintTasks.filter((t) => t.status === 'todo');
  const progressTasks = sprintTasks.filter((t) => t.status === 'progress');
  const doneTasks = sprintTasks.filter((t) => t.status === 'done');
  const blockedTasks = sprintTasks.filter((t) => t.status === 'blocked');

  const handleTaskClick = (id: string) => {
    openPanel({ mode: 'task', id });
  };

  const handleEdit = () => {
    setEditSprint(displaySprint);
    setPlanningOpen(true);
  };

  const handleStart = () => {
    if (!displaySprint) return;
    updateSprint({ ...displaySprint, status: 'active' });
  };

  const handleComplete = () => {
    if (!displaySprint) return;
    updateSprint({ ...displaySprint, status: 'completed' });
  };

  // No active or planned sprint — empty state
  if (!displaySprint) {
    return (
      <div className="flex flex-col h-full items-center justify-center" style={{ background: '#f8f8f9' }}>
        <div className="text-center max-w-xs">
          <div
            className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: '#f4f4f5' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#71717a" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: '#0f0f0f' }}>
            No active sprint
          </p>
          <p className="text-xs mb-4" style={{ color: '#71717a' }}>
            Plan a sprint to start tracking your work
          </p>
          <button
            onClick={() => { setEditSprint(undefined); setPlanningOpen(true); }}
            className="px-4 py-2 text-xs font-medium"
            style={{
              background: '#0f0f0f',
              color: '#ffffff',
              borderRadius: '4px',
            }}
          >
            Plan Sprint
          </button>
        </div>

        {planningOpen && (
          <SprintPlanningModal
            sprint={editSprint}
            onClose={() => setPlanningOpen(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ background: '#f8f8f9' }}>
      {/* Sprint header */}
      <SprintHeader
        sprint={displaySprint}
        tasks={sprintTasks}
        onEdit={handleEdit}
        onComplete={handleComplete}
        onStart={handleStart}
      />

      {/* Kanban board */}
      <div className="flex-1 overflow-hidden flex gap-0 px-5 py-4 min-h-0">
        <div className="flex gap-4 w-full h-full">
          <KanbanColumn
            title="To Do"
            tasks={todoTasks}
            accent="#a1a1aa"
            onTaskClick={handleTaskClick}
            developers={developers}
          />
          <KanbanColumn
            title="In Progress"
            tasks={progressTasks}
            accent="#f59e0b"
            onTaskClick={handleTaskClick}
            developers={developers}
          />
          <KanbanColumn
            title="Done"
            tasks={doneTasks}
            accent="#22c55e"
            onTaskClick={handleTaskClick}
            developers={developers}
          />
          {blockedTasks.length > 0 && (
            <KanbanColumn
              title="Blocked"
              tasks={blockedTasks}
              accent="#ef4444"
              onTaskClick={handleTaskClick}
              developers={developers}
            />
          )}
        </div>
      </div>

      {/* Planning modal */}
      {planningOpen && (
        <SprintPlanningModal
          sprint={editSprint}
          onClose={() => { setPlanningOpen(false); setEditSprint(undefined); }}
        />
      )}
    </div>
  );
}
