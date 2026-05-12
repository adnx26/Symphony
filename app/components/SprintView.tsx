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
    <div
      className="flex flex-col flex-1 min-w-0 rounded-2xl px-2 py-2"
      style={{
        background: 'linear-gradient(180deg, rgba(11,17,26,0.82), rgba(16,25,35,0.72))',
        border: '1px solid rgba(31, 43, 58, 0.9)',
        boxShadow: 'inset 0 1px 0 rgba(96, 165, 250, 0.04)',
      }}
    >
      {/* Column header */}
      <div
        className="flex items-center gap-2 px-3 py-2 mb-2 border-b"
        style={{ borderColor: 'rgba(49, 67, 85, 0.7)' }}
      >
        <div
          className="w-2 h-2 rounded-full shrink-0"
          style={{ background: accent }}
        />
        <span className="text-xs font-semibold tracking-[0.04em]" style={{ color: '#e5e7eb' }}>
          {title}
        </span>
        <span
          className="ml-auto text-[0.6rem] font-semibold px-2 py-1"
          style={{
            background: 'rgba(16, 25, 35, 0.92)',
            color: '#94a3b8',
            borderRadius: '999px',
            border: '1px solid rgba(49, 67, 85, 0.72)',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
            style={{ color: 'var(--muted-foreground)' }}
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
        background: '#101923',
        border: '1px solid #1f2b3a',
        borderRadius: '16px',
        boxShadow: '0 12px 28px rgba(2, 6, 23, 0.28)',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#314355';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 18px 36px rgba(2, 6, 23, 0.34)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.borderColor = '#1f2b3a';
        (e.currentTarget as HTMLElement).style.boxShadow = '0 12px 28px rgba(2, 6, 23, 0.28)';
        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
      }}
    >
      <p className="text-xs font-medium mb-2 line-clamp-2" style={{ color: 'var(--foreground)' }}>
        {task.title}
      </p>

      {/* Status pill for blocked */}
      {task.status === 'blocked' && (
        <span
          className="inline-flex px-1.5 py-0.5 text-[0.6rem] font-medium mb-2"
          style={{
            background: statusCol?.bg,
            color: statusCol?.text,
            borderRadius: '999px',
            fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
              borderRadius: '999px',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
            }}
          >
            {task.priority}
          </span>

          {/* Assignee initials */}
          {dev && (
            <div
              className="w-5 h-5 flex items-center justify-center text-[0.55rem] font-semibold"
              style={{
                background: 'rgba(16, 25, 35, 0.95)',
                border: '1px solid rgba(49, 67, 85, 0.72)',
                borderRadius: '50%',
                color: '#dce3ee',
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
              background: 'rgba(16, 25, 35, 0.92)',
              color: '#94a3b8',
              borderRadius: '999px',
              border: '1px solid rgba(49, 67, 85, 0.72)',
              fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
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
      <div className="flex flex-col h-full items-center justify-center" style={{ background: 'linear-gradient(180deg, rgba(11,17,26,0.55), rgba(7,11,18,0.88))' }}>
        <div className="text-center max-w-xs">
          <div
            className="w-12 h-12 mx-auto mb-4 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(16, 25, 35, 0.92)', border: '1px solid rgba(49, 67, 85, 0.72)' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <p className="text-sm font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
            No active sprint
          </p>
          <p className="text-xs mb-4" style={{ color: '#94a3b8' }}>
            Plan a sprint to start tracking your work
          </p>
          <button
            onClick={() => { setEditSprint(undefined); setPlanningOpen(true); }}
            className="px-4 py-2 text-xs font-medium"
            style={{
              background: 'linear-gradient(135deg, rgba(20,184,166,0.22), rgba(59,130,246,0.2))',
              color: '#eff6ff',
              borderRadius: '12px',
              border: '1px solid rgba(45, 212, 191, 0.22)',
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
    <div className="flex flex-col h-full" style={{ background: 'linear-gradient(180deg, rgba(11,17,26,0.55), rgba(7,11,18,0.88))' }}>
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
