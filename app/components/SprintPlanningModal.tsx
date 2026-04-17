// app/components/SprintPlanningModal.tsx
import { useState, useMemo, useEffect } from 'react';
import { X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppSprint } from '../types';
import { getPriorityColor } from '../utils/nodeColors';

interface SprintPlanningModalProps {
  sprint?: AppSprint;
  onClose: () => void;
}

export function SprintPlanningModal({ sprint, onClose }: SprintPlanningModalProps) {
  const ctx = useApp();

  const [name, setName] = useState(sprint?.name ?? '');
  const [goal, setGoal] = useState(sprint?.goal ?? '');
  const [startDate, setStartDate] = useState(sprint?.startDate ?? '');
  const [endDate, setEndDate] = useState(sprint?.endDate ?? '');
  const [capacity, setCapacity] = useState(sprint?.capacity ?? 40);

  // Task IDs currently in this sprint (for edit mode)
  const existingTaskIds = useMemo<Set<string>>(() => {
    if (!sprint) return new Set();
    return new Set(ctx.sprintTaskIds[sprint.id] ?? []);
  }, [sprint, ctx.sprintTaskIds]);

  const [selectedTaskIds, setSelectedTaskIds] = useState<Set<string>>(existingTaskIds);

  useEffect(() => {
    setSelectedTaskIds(existingTaskIds);
  }, [existingTaskIds]);

  // Tasks NOT in any other sprint (or already in this one)
  const assignedToOther = useMemo(() => {
    const assigned = new Set<string>();
    for (const [sid, ids] of Object.entries(ctx.sprintTaskIds)) {
      if (sprint && sid === sprint.id) continue; // skip current sprint
      for (const id of ids) assigned.add(id);
    }
    return assigned;
  }, [ctx.sprintTaskIds, sprint]);

  const availableTasks = useMemo(
    () => ctx.allTasks.filter((t) => !assignedToOther.has(t.id) && t.status !== 'done'),
    [ctx.allTasks, assignedToOther]
  );

  const selectedPoints = useMemo(
    () =>
      availableTasks
        .filter((t) => selectedTaskIds.has(t.id))
        .reduce((sum, t) => sum + (t.storyPoints ?? 0), 0),
    [availableTasks, selectedTaskIds]
  );

  const overCapacity = selectedPoints > capacity;

  const toggleTask = (taskId: string) => {
    setSelectedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(taskId)) next.delete(taskId);
      else next.add(taskId);
      return next;
    });
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const id = sprint?.id ?? `sprint-${Date.now()}`;
    const projectId = ctx.activeProjectId;

    const newSprint: AppSprint = {
      id,
      projectId,
      name: name.trim(),
      goal: goal.trim(),
      status: sprint?.status ?? 'planned',
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      capacity,
    };

    if (sprint) {
      ctx.updateSprint(newSprint);

      // Add newly selected tasks
      for (const taskId of selectedTaskIds) {
        if (!existingTaskIds.has(taskId)) {
          ctx.addTaskToSprint(id, taskId);
        }
      }
      // Remove deselected tasks
      for (const taskId of existingTaskIds) {
        if (!selectedTaskIds.has(taskId)) {
          ctx.removeTaskFromSprint(id, taskId);
        }
      }
    } else {
      ctx.addSprint(newSprint);
      for (const taskId of selectedTaskIds) {
        ctx.addTaskToSprint(id, taskId);
      }
    }

    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative flex flex-col w-full max-w-xl max-h-[90vh] overflow-hidden"
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: '6px',
          boxShadow: '0 20px 60px rgba(0,0,0,0.18)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 border-b"
          style={{ borderColor: '#e4e4e7' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>
            {sprint ? 'Edit Sprint' : 'Plan Sprint'}
          </h2>
          <button onClick={onClose} className="p-1 rounded" style={{ color: '#71717a' }}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
          {/* Name */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3f3f46' }}>
              Sprint Name <span style={{ color: '#ef4444' }}>*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sprint 1"
              className="w-full text-xs px-3 py-2 outline-none"
              style={{
                background: '#f8f8f9',
                border: '1px solid #e4e4e7',
                borderRadius: '4px',
                color: '#0f0f0f',
              }}
            />
          </div>

          {/* Goal */}
          <div>
            <label className="block text-xs font-medium mb-1" style={{ color: '#3f3f46' }}>
              Sprint Goal
            </label>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              placeholder="What does the team want to achieve?"
              rows={2}
              className="w-full text-xs px-3 py-2 outline-none resize-none"
              style={{
                background: '#f8f8f9',
                border: '1px solid #e4e4e7',
                borderRadius: '4px',
                color: '#0f0f0f',
              }}
            />
          </div>

          {/* Dates + Capacity */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#3f3f46' }}>
                Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full text-xs px-3 py-2 outline-none"
                style={{
                  background: '#f8f8f9',
                  border: '1px solid #e4e4e7',
                  borderRadius: '4px',
                  color: '#0f0f0f',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#3f3f46' }}>
                End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full text-xs px-3 py-2 outline-none"
                style={{
                  background: '#f8f8f9',
                  border: '1px solid #e4e4e7',
                  borderRadius: '4px',
                  color: '#0f0f0f',
                }}
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1" style={{ color: '#3f3f46' }}>
                Capacity (pts)
              </label>
              <input
                type="number"
                min={0}
                value={capacity}
                onChange={(e) => setCapacity(Number(e.target.value))}
                className="w-full text-xs px-3 py-2 outline-none"
                style={{
                  background: '#f8f8f9',
                  border: '1px solid #e4e4e7',
                  borderRadius: '4px',
                  color: '#0f0f0f',
                }}
              />
            </div>
          </div>

          {/* Task selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-medium" style={{ color: '#3f3f46' }}>
                Tasks
              </label>
              <span
                className="text-xs font-medium"
                style={{ color: overCapacity ? '#ef4444' : '#71717a' }}
              >
                {selectedPoints} / {capacity} pts
                {overCapacity && ' — over capacity!'}
              </span>
            </div>

            {availableTasks.length === 0 ? (
              <p className="text-xs py-3 text-center" style={{ color: '#a1a1aa' }}>
                No tasks available to add
              </p>
            ) : (
              <div
                className="space-y-1 max-h-52 overflow-y-auto pr-1"
                style={{ border: '1px solid #e4e4e7', borderRadius: '4px', padding: '8px' }}
              >
                {availableTasks.map((task) => {
                  const priorityCol = getPriorityColor(task.priority);
                  const checked = selectedTaskIds.has(task.id);
                  return (
                    <label
                      key={task.id}
                      className="flex items-center gap-2.5 px-2 py-1.5 rounded cursor-pointer"
                      style={{
                        background: checked ? '#f8f8f9' : 'transparent',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleTask(task.id)}
                        className="shrink-0"
                      />
                      <span className="flex-1 text-xs truncate" style={{ color: '#0f0f0f' }}>
                        {task.title}
                      </span>
                      <span
                        className="px-1.5 py-0.5 text-[0.6rem] font-medium shrink-0"
                        style={{
                          background: priorityCol?.bg,
                          color: priorityCol?.text,
                          borderRadius: '3px',
                        }}
                      >
                        {task.priority}
                      </span>
                      {task.storyPoints != null && (
                        <span
                          className="text-[0.6rem] font-semibold tabular-nums shrink-0 w-5 text-right"
                          style={{ color: '#71717a' }}
                        >
                          {task.storyPoints}
                        </span>
                      )}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-3 border-t"
          style={{ borderColor: '#e4e4e7' }}
        >
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium border"
            style={{
              background: 'transparent',
              borderColor: '#e4e4e7',
              color: '#3f3f46',
              borderRadius: '4px',
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            className="px-3 py-1.5 text-xs font-medium"
            style={{
              background: name.trim() ? '#0f0f0f' : '#d1d1d6',
              color: '#ffffff',
              borderRadius: '4px',
              cursor: name.trim() ? 'pointer' : 'not-allowed',
            }}
          >
            Save Sprint
          </button>
        </div>
      </div>
    </div>
  );
}
