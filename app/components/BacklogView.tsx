import { useState } from 'react';
import { Plus, Trash2, MoveRight } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppEpic, AppStory, StatusType } from '../types';
import { BacklogEpicRow } from './BacklogEpicRow';
import { BacklogStoryRow } from './BacklogStoryRow';
import { BacklogTaskRow } from './BacklogTaskRow';
import { EpicModal } from './EpicModal';
import { StoryModal } from './StoryModal';
import { CreateTaskModal } from './CreateTaskModal';

export function BacklogView() {
  const {
    epics,
    stories,
    allTasks,
    developers,
    addEpic,
    addStory,
    updateStory,
    deleteTask,
    updateTaskStatus,
  } = useApp();

  // ── Modal state ─────────────────────────────────────────────────────────────
  const [epicModalOpen, setEpicModalOpen] = useState(false);
  const [storyModal, setStoryModal] = useState<{ epicId?: string } | null>(null);
  const [taskModal, setTaskModal] = useState<{ storyId?: string } | null>(null);

  // ── Bulk select ─────────────────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [sprintPickerOpen, setSprintPickerOpen] = useState(false);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const clearSelection = () => setSelectedIds(new Set());

  const handleDeleteSelected = () => {
    const ids = new Set(selectedIds);
    clearSelection();
    ids.forEach((id) => {
      if (allTasks.some((t) => t.id === id)) deleteTask(id);
    });
  };

  // ── Status change handlers ───────────────────────────────────────────────────
  const handleTaskStatusChange = (taskId: string, status: StatusType) => {
    updateTaskStatus(taskId, status);
  };

  const handleStoryStatusChange = (storyId: string, status: StatusType) => {
    const story = stories.find((s) => s.id === storyId);
    if (story) updateStory({ ...story, status });
  };

  // ── Story modal ──────────────────────────────────────────────────────────────
  const openAddStory = (epicId?: string) => {
    setStoryModal({ epicId });
  };

  const openAddTask = (_storyId?: string) => {
    setTaskModal({ storyId: _storyId });
  };

  // ── Derive sections ──────────────────────────────────────────────────────────
  // Epic stories
  const epicIds = new Set(epics.map((e) => e.id));
  const unepicedStories = stories.filter((s) => !s.epicId || !epicIds.has(s.epicId));
  const orphanTasks = allTasks.filter((t) => !t.storyId);

  const totalTaskCount = allTasks.length;

  return (
    <div className="h-full overflow-y-auto" style={{ background: 'linear-gradient(180deg, rgba(11,17,26,0.55), rgba(7,11,18,0.88))' }}>
      <div className="max-w-5xl mx-auto px-5 py-6">

        {/* ── Header ────────────────────────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <h1 className="text-sm font-semibold tracking-[0.04em]" style={{ color: 'var(--foreground)' }}>Backlog</h1>
            <span
              className="text-[0.65rem] font-medium px-2 py-1 tabular-nums"
              style={{
                background: 'rgba(16, 25, 35, 0.92)',
                color: '#94a3b8',
                borderRadius: '999px',
                border: '1px solid rgba(49, 67, 85, 0.72)',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
              }}
            >
              {totalTaskCount} tasks
            </span>
          </div>
          <button
            onClick={() => setEpicModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-all"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.22))',
              color: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid rgba(96, 165, 250, 0.28)',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.filter = 'brightness(1.08)')}
            onMouseLeave={(e) => (e.currentTarget.style.filter = 'none')}
          >
            <Plus className="w-3 h-3" />
            Create Epic
          </button>
        </div>

        {/* ── Bulk actions bar ────────────────────────────────────────────────── */}
        {selectedIds.size > 0 && (
          <div
            className="flex items-center gap-3 px-4 py-2.5 mb-4 rounded"
            style={{
              background: '#101923',
              border: '1px solid var(--border)',
              borderLeft: '3px solid #8b5cf6',
              borderRadius: '16px',
              boxShadow: '0 12px 28px rgba(2, 6, 23, 0.24)',
            }}
          >
            <span className="text-xs font-medium flex-1" style={{ color: 'var(--foreground)' }}>
              {selectedIds.size} item{selectedIds.size > 1 ? 's' : ''} selected
            </span>
            <button
              onClick={() => setSprintPickerOpen((p) => !p)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors"
              style={{
                background: 'rgba(16, 25, 35, 0.72)',
                color: '#cbd5e1',
                borderColor: 'var(--border)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21, 34, 51, 0.82)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 25, 35, 0.72)')}
            >
              <MoveRight className="w-3 h-3" />
              Move to Sprint
            </button>
            <button
              onClick={handleDeleteSelected}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors"
              style={{
                background: 'rgba(239, 71, 111, 0.08)',
                color: '#fb7185',
                borderColor: 'rgba(239, 71, 111, 0.28)',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239, 71, 111, 0.14)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(239, 71, 111, 0.08)')}
            >
              <Trash2 className="w-3 h-3" />
              Delete selected
            </button>
            <button
              onClick={clearSelection}
              className="text-xs px-2 py-1 rounded transition-colors"
              style={{ color: 'var(--muted-foreground)', background: 'transparent', border: 'none', cursor: 'pointer' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21, 34, 51, 0.82)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              Clear
            </button>
          </div>
        )}

        {/* Sprint picker popover (placeholder) */}
        {sprintPickerOpen && (
          <div
            className="mb-4 px-4 py-3 rounded text-xs"
            style={{
              background: '#101923',
              border: '1px solid var(--border)',
              color: 'var(--muted-foreground)',
              borderRadius: '14px',
            }}
          >
            No sprints yet. Create a sprint to move items.
          </div>
        )}

        {/* ── Epics ────────────────────────────────────────────────────────────── */}
        {epics.length === 0 && unepicedStories.length === 0 && orphanTasks.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 rounded"
            style={{
              background: '#101923',
              border: '1px solid var(--border)',
              borderRadius: '18px',
              boxShadow: '0 12px 28px rgba(2, 6, 23, 0.24)',
            }}
          >
            <p className="text-sm font-medium mb-1" style={{ color: 'var(--foreground)' }}>
              Backlog is empty
            </p>
            <p className="text-xs mb-4" style={{ color: 'var(--muted-foreground)' }}>
              Create an epic to start organizing your work
            </p>
            <button
              onClick={() => setEpicModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded"
              style={{
                background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.22))',
                color: '#f8fafc',
                border: 'none',
                cursor: 'pointer',
                borderRadius: '12px',
                borderColor: 'rgba(96, 165, 250, 0.28)',
              }}
            >
              <Plus className="w-3 h-3" />
              Create Epic
            </button>
          </div>
        )}

        {epics.length > 0 && (
          <div className="mb-6">
            <div className="mb-2">
              {epics.map((epic) => {
                const epicStories = stories.filter((s) => s.epicId === epic.id);
                return (
                  <BacklogEpicRow
                    key={epic.id}
                    epic={epic}
                    stories={epicStories}
                    tasks={allTasks}
                    developers={developers}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onTaskStatusChange={handleTaskStatusChange}
                    onStoryStatusChange={handleStoryStatusChange}
                    onUpdateStory={updateStory}
                    onAddTask={openAddTask}
                    onAddStory={openAddStory}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* ── Unepiced Stories ─────────────────────────────────────────────────── */}
        {unepicedStories.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="Unepiced Stories" count={unepicedStories.length} />
            <div
              className="rounded overflow-hidden"
              style={{ border: '1px solid var(--border)', background: '#101923', borderRadius: '16px' }}
            >
              {unepicedStories.map((story) => {
                const storyTasks = allTasks.filter((t) => t.storyId === story.id);
                return (
                  <BacklogStoryRow
                    key={story.id}
                    story={story}
                    tasks={storyTasks}
                    developers={developers}
                    selectedIds={selectedIds}
                    onToggleSelect={toggleSelect}
                    onTaskStatusChange={handleTaskStatusChange}
                    onStoryStatusChange={handleStoryStatusChange}
                    onUpdateStory={updateStory}
                    onAddTask={openAddTask}
                    indentLevel={0}
                  />
                );
              })}
            </div>
            <button
              onClick={() => openAddStory(undefined)}
              className="flex items-center gap-1 text-[0.7rem] font-medium px-3 py-2 mt-1 transition-colors"
              style={{
                color: 'var(--muted-foreground)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
            >
              <Plus className="w-3 h-3" />
              Add Story
            </button>
          </div>
        )}

        {/* ── Orphan Tasks ─────────────────────────────────────────────────────── */}
        {orphanTasks.length > 0 && (
          <div className="mb-6">
            <SectionHeader title="Orphan Tasks" count={orphanTasks.length} />
            <div
              className="rounded overflow-hidden"
              style={{ border: '1px solid var(--border)', background: '#101923', borderRadius: '16px' }}
            >
              {orphanTasks.map((task) => (
                <BacklogTaskRow
                  key={task.id}
                  task={task}
                  developers={developers}
                  selected={selectedIds.has(task.id)}
                  onToggleSelect={toggleSelect}
                  onStatusChange={handleTaskStatusChange}
                />
              ))}
            </div>
          </div>
        )}

        {/* Bottom shortcuts */}
        <div className="flex items-center gap-3 mt-2">
          <button
            onClick={() => openAddStory(undefined)}
            className="flex items-center gap-1 text-[0.7rem] font-medium transition-colors"
            style={{
              color: 'var(--muted-foreground)',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#7c3aed')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--muted-foreground)')}
          >
            <Plus className="w-3 h-3" />
            Add Story
          </button>
        </div>

      </div>

      {/* ── Modals ─────────────────────────────────────────────────────────────── */}
      {epicModalOpen && (
        <EpicModal
          onSave={(epic: AppEpic) => {
            addEpic(epic);
            setEpicModalOpen(false);
          }}
          onClose={() => setEpicModalOpen(false)}
        />
      )}

      {storyModal !== null && (
        <StoryModal
          onSave={(story: AppStory) => {
            // If opened from an epic row, override epicId with the pre-selected one
            const saved = storyModal.epicId
              ? { ...story, epicId: storyModal.epicId }
              : story;
            addStory(saved);
            setStoryModal(null);
          }}
          onClose={() => setStoryModal(null)}
        />
      )}

      {taskModal !== null && (
        <CreateTaskModal
          storyId={taskModal.storyId}
          onClose={() => setTaskModal(null)}
        />
      )}
    </div>
  );
}

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
        <span className="text-xs font-semibold tracking-[0.04em]" style={{ color: '#cbd5e1' }}>{title}</span>
      <span
        className="text-[0.6rem] font-medium px-2 py-1 tabular-nums"
        style={{ background: 'rgba(16, 25, 35, 0.92)', color: '#94a3b8', borderRadius: '999px', border: '1px solid rgba(49, 67, 85, 0.72)', fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace' }}
      >
        {count}
      </span>
    </div>
  );
}
