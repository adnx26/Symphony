import { useState, useRef, useEffect } from 'react';
import { X, ChevronLeft, Trash2, Play, Loader2, Bot, Sparkles, ChevronDown, ChevronUp, Plus } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { getNodeColor, getStatusColor, getPriorityColor } from '../utils/nodeColors';
import { useAgentDispatch } from '../agent/useAgentDispatch';
import { AgentDispatchState, StatusType, PriorityType } from '../types';
import { CommentThread } from './CommentThread';
import { ActivityFeed } from './ActivityFeed';
import { timeAgo } from '../utils/timeAgo';

type TaskTab = 'overview' | 'criteria' | 'comments' | 'activity' | 'agent';

const TABS: { id: TaskTab; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'criteria', label: 'Criteria' },
  { id: 'comments', label: 'Comments' },
  { id: 'activity', label: 'Activity' },
  { id: 'agent', label: 'Agent' },
];

const PROXY_URL = import.meta.env.DEV
  ? 'http://localhost:3001/api/agent/analyze'
  : '/api/agent/analyze';

// ── Helpers ───────────────────────────────────────────────────────────────────

function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="text-[0.65rem] font-semibold uppercase tracking-wide mb-1"
      style={{ color: '#a1a1aa' }}
    >
      {children}
    </p>
  );
}

function fieldSelect(
  value: string,
  options: { value: string; label: string }[],
  onChange: (v: string) => void
) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full text-xs px-2 py-1 rounded outline-none focus:ring-1"
      style={{
        background: '#f4f4f5',
        border: '1px solid #e4e4e7',
        color: '#3f3f46',
        appearance: 'auto',
      }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

// ── Dispatch result ───────────────────────────────────────────────────────────

function DispatchResultView({ d }: { d: AgentDispatchState }) {
  const { result } = d;
  if (!result) return null;
  const isOk = result.status === 'completed';
  const entries = Object.entries(result.output).slice(0, 5);
  return (
    <div
      className="mt-3 p-3 space-y-2"
      style={{
        background: '#fafafa',
        border: '1px solid #e4e4e7',
        borderRadius: '4px',
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[0.65rem] font-semibold px-1.5 py-0.5"
          style={{
            background: isOk ? '#f0fdf4' : '#fff1f2',
            color: isOk ? '#15803d' : '#be123c',
            borderRadius: '3px',
          }}
        >
          {isOk ? 'Completed' : 'Failed'}
        </span>
        <span className="text-[0.6rem]" style={{ color: '#a1a1aa' }}>{timeAgo(result.completedAt)}</span>
      </div>
      {result.error && (
        <p className="text-xs" style={{ color: '#be123c' }}>{result.error}</p>
      )}
      {entries.length > 0 && (
        <dl className="space-y-1">
          {entries.map(([key, val]) => (
            <div key={key} className="flex gap-1">
              <dt className="text-[0.65rem] shrink-0" style={{ color: '#a1a1aa' }}>{key}:</dt>
              <dd className="text-[0.65rem] truncate" style={{ color: '#3f3f46' }}>{String(val)}</dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export function DetailPanel() {
  const ctx = useApp();
  const {
    panelStack,
    closePanel,
    panelBack,
    checkedCriteria,
    toggleCriterion,
    drillPanel,
    allTasks,
    deleteTask,
    developers,
    agents,
    subAgents,
    epics,
    stories,
    sprints,
    sprintTaskIds,
    addTaskToSprint,
    removeTaskFromSprint,
    updateTask,
    getTaskDispatches,
    agentTouchedIds,
  } = ctx;
  const { dispatchAgent } = useAgentDispatch();

  const [confirmingDeleteId, setConfirmingDeleteId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TaskTab>('overview');

  // Inline title editing
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleDraft, setTitleDraft] = useState('');
  const titleInputRef = useRef<HTMLInputElement>(null);

  // Label adding
  const [addingLabel, setAddingLabel] = useState(false);
  const [labelDraft, setLabelDraft] = useState('');

  // AI insight
  const [insightLoading, setInsightLoading] = useState(false);
  const [insightText, setInsightText] = useState<string | null>(null);
  const [insightOpen, setInsightOpen] = useState(false);

  // Reset tab when panel entry changes
  const lastEntryId = useRef<string | null>(null);
  useEffect(() => {
    const entry = panelStack[panelStack.length - 1];
    if (entry && entry.id !== lastEntryId.current) {
      lastEntryId.current = entry.id;
      setActiveTab('overview');
      setInsightText(null);
      setInsightOpen(false);
      setEditingTitle(false);
    }
  }, [panelStack]);

  // Focus title input when editing starts
  useEffect(() => {
    if (editingTitle && titleInputRef.current) {
      titleInputRef.current.focus();
      titleInputRef.current.select();
    }
  }, [editingTitle]);

  if (panelStack.length === 0) return null;
  const entry = panelStack[panelStack.length - 1];

  // ── Task mode ─────────────────────────────────────────────────────────────

  if (entry.mode === 'task') {
    const task = allTasks.find((t) => t.id === entry.id);
    if (!task) return null;

    const color = getNodeColor('task');
    const statusCol = getStatusColor(task.status);
    const priorityCol = getPriorityColor(task.priority);

    // Sprint for this task
    const taskSprintId =
      Object.entries(sprintTaskIds).find(([, ids]) => ids.includes(task.id))?.[0] ?? '';

    // Epic from story
    const taskStory = stories.find((s) => s.id === task.storyId);
    const taskEpicId = taskStory?.epicId ?? '';

    const statusLabel = (s: string) =>
      s === 'progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1);

    // ── Save helpers ──────────────────────────────────────────────────────

    const save = (patch: Partial<typeof task>) => updateTask({ ...task, ...patch });

    const saveTitle = () => {
      const v = titleDraft.trim();
      if (v && v !== task.title) save({ title: v });
      setEditingTitle(false);
    };

    const handleSprintChange = (newSprintId: string) => {
      if (taskSprintId) removeTaskFromSprint(taskSprintId, task.id);
      if (newSprintId) addTaskToSprint(newSprintId, task.id);
    };

    const handleEpicChange = (epicId: string) => {
      // Clear story when epic changes
      save({ storyId: undefined });
    };

    const handleStoryChange = (storyId: string) => {
      save({ storyId: storyId || undefined });
    };

    const filteredStories = taskEpicId
      ? stories.filter((s) => s.epicId === taskEpicId)
      : stories;

    const removeLabel = (lbl: string) => {
      save({ labels: (task.labels ?? []).filter((l) => l !== lbl) });
    };

    const addLabel = () => {
      const v = labelDraft.trim();
      if (v && !(task.labels ?? []).includes(v)) {
        save({ labels: [...(task.labels ?? []), v] });
      }
      setLabelDraft('');
      setAddingLabel(false);
    };

    // AI insight
    const getInsight = async () => {
      setInsightLoading(true);
      setInsightText(null);
      setInsightOpen(true);
      try {
        const prompt = `You are an AI project assistant. Analyze this task and provide a brief insight (2-3 sentences) and one concrete recommendation.

Task: ${task.title}
Description: ${task.desc ?? ''}
Status: ${task.status}
Priority: ${task.priority}
Due Date: ${task.dueDate ?? 'None'}
Story Points: ${task.storyPoints ?? 'None'}
Assignee: ${developers.find((d) => d.id === task.developerId)?.name ?? 'Unassigned'}
Criteria: ${(task.criteria ?? []).join('; ') || 'None'}

Return a JSON object with exactly this shape:
{"insight": "<2-3 sentence analysis>", "recommendation": "<one concrete action>"}
Return ONLY the JSON object. No markdown, no code fences.`;

        const res = await fetch(PROXY_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt }),
        });
        if (!res.ok) throw new Error('API error');
        const { text } = (await res.json()) as { text: string };
        const parsed = JSON.parse(text) as { insight?: string; recommendation?: string };
        const insight = parsed.insight ?? '';
        const recommendation = parsed.recommendation ?? '';
        if (!insight && !recommendation) throw new Error('Empty insight response');
        setInsightText([insight, recommendation ? `Recommendation: ${recommendation}` : ''].filter(Boolean).join('\n\n'));
      } catch {
        setInsightText('Could not load AI insight. Please try again.');
      } finally {
        setInsightLoading(false);
      }
    };

    // Agent dispatch for this task
    const taskDispatches = getTaskDispatches(task.id);
    const latestDispatch = [...taskDispatches].sort(
      (a, b) =>
        new Date(b.request.dispatchedAt).getTime() -
        new Date(a.request.dispatchedAt).getTime()
    )[0];
    const isRunning =
      latestDispatch?.status === 'dispatched' || latestDispatch?.status === 'running';
    const assignedAgent = task.agentId ? agents.find((a) => a.id === task.agentId) : null;

    return (
      <>
        <motion.div
          initial={{ x: 380 }}
          animate={{ x: 0 }}
          exit={{ x: 380 }}
          transition={{ type: 'spring', damping: 28, stiffness: 220 }}
          className="fixed right-0 top-0 bottom-0 w-[380px] z-50 overflow-y-auto"
          style={{
            background: '#ffffff',
            borderLeft: '1px solid #e4e4e7',
            boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
          }}
        >
          {/* Accent bar */}
          <div style={{ height: 2, background: color.accent }} />

          {/* Header */}
          <div className="px-5 pt-4 pb-3" style={{ borderBottom: '1px solid #e4e4e7' }}>
            <div className="flex items-center justify-between mb-2">
              <span
                className="text-[0.65rem] font-semibold px-2 py-0.5 uppercase tracking-wide"
                style={{ background: color.bg, color: color.accent, borderRadius: '3px' }}
              >
                Task
              </span>
              <button
                onClick={closePanel}
                className="p-1.5 rounded transition-colors"
                style={{ color: '#71717a' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Inline title */}
            {editingTitle ? (
              <input
                ref={titleInputRef}
                value={titleDraft}
                onChange={(e) => setTitleDraft(e.target.value)}
                onBlur={saveTitle}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') saveTitle();
                  if (e.key === 'Escape') setEditingTitle(false);
                }}
                className="w-full text-base font-semibold outline-none px-1 -mx-1 rounded"
                style={{
                  color: '#0f0f0f',
                  border: '1px solid #d97706',
                  borderRadius: '4px',
                  padding: '2px 6px',
                }}
              />
            ) : (
              <h2
                className="text-base font-semibold cursor-pointer hover:underline decoration-dotted"
                style={{ color: '#0f0f0f' }}
                onClick={() => {
                  setTitleDraft(task.title);
                  setEditingTitle(true);
                }}
                title="Click to edit title"
              >
                {task.title}
              </h2>
            )}
          </div>

          {/* Tab switcher */}
          <div className="flex" style={{ borderBottom: '1px solid #e4e4e7' }}>
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className="flex-1 py-2.5 text-[0.65rem] font-medium transition-colors"
                style={{
                  color: activeTab === tab.id ? '#0f0f0f' : '#a1a1aa',
                  borderBottom:
                    activeTab === tab.id ? '2px solid #d97706' : '2px solid transparent',
                  background: 'transparent',
                  marginBottom: '-1px',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content */}
          <div key={task.id} className="px-5 py-4 space-y-5">

            {/* ── OVERVIEW TAB ── */}
            {activeTab === 'overview' && (
              <>
                {/* Description */}
                <div>
                  <FieldLabel>Description</FieldLabel>
                  <textarea
                    defaultValue={task.desc ?? ''}
                    onBlur={(e) => {
                      const v = e.target.value.trim();
                      if (v !== (task.desc ?? '')) save({ desc: v });
                    }}
                    rows={3}
                    className="w-full text-xs px-2 py-1.5 rounded outline-none focus:ring-1 resize-none"
                    style={{
                      background: '#f4f4f5',
                      border: '1px solid #e4e4e7',
                      color: '#3f3f46',
                    }}
                    placeholder="Add a description…"
                  />
                </div>

                {/* Two-column grid for metadata */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                  {/* Status */}
                  <div>
                    <FieldLabel>Status</FieldLabel>
                    {fieldSelect(
                      task.status,
                      [
                        { value: 'todo', label: 'Todo' },
                        { value: 'progress', label: 'In Progress' },
                        { value: 'done', label: 'Done' },
                        { value: 'blocked', label: 'Blocked' },
                      ],
                      (v) => save({ status: v as StatusType })
                    )}
                    {statusCol && (
                      <span
                        className="inline-block mt-1 px-2 py-0.5 text-[0.6rem] font-medium"
                        style={{
                          background: statusCol.bg,
                          color: statusCol.text,
                          borderRadius: '3px',
                        }}
                      >
                        {statusLabel(task.status)}
                      </span>
                    )}
                  </div>

                  {/* Priority */}
                  <div>
                    <FieldLabel>Priority</FieldLabel>
                    {fieldSelect(
                      task.priority,
                      [
                        { value: 'low', label: 'Low' },
                        { value: 'medium', label: 'Medium' },
                        { value: 'high', label: 'High' },
                        { value: 'critical', label: 'Critical' },
                      ],
                      (v) => save({ priority: v as PriorityType })
                    )}
                    {priorityCol && (
                      <span
                        className="inline-block mt-1 px-2 py-0.5 text-[0.6rem] font-medium"
                        style={{
                          background: priorityCol.bg,
                          color: priorityCol.text,
                          borderRadius: '3px',
                        }}
                      >
                        {task.priority.charAt(0).toUpperCase() + task.priority.slice(1)}
                      </span>
                    )}
                  </div>

                  {/* Assignee */}
                  <div>
                    <FieldLabel>Assignee</FieldLabel>
                    {fieldSelect(
                      task.developerId ?? '',
                      [
                        { value: '', label: '— None —' },
                        ...developers.map((d) => ({ value: d.id, label: d.name })),
                      ],
                      (v) => save({ developerId: v })
                    )}
                  </div>

                  {/* Sprint */}
                  <div>
                    <FieldLabel>Sprint</FieldLabel>
                    {fieldSelect(
                      taskSprintId,
                      [
                        { value: '', label: '— None —' },
                        ...sprints.map((s) => ({ value: s.id, label: s.name })),
                      ],
                      handleSprintChange
                    )}
                  </div>

                  {/* Due Date */}
                  <div>
                    <FieldLabel>Due Date</FieldLabel>
                    <input
                      type="date"
                      defaultValue={task.dueDate ?? ''}
                      onBlur={(e) => save({ dueDate: e.target.value || undefined })}
                      className="w-full text-xs px-2 py-1 rounded outline-none"
                      style={{
                        background: '#f4f4f5',
                        border: '1px solid #e4e4e7',
                        color: '#3f3f46',
                      }}
                    />
                  </div>

                  {/* Story Points */}
                  <div>
                    <FieldLabel>Story Points</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      defaultValue={task.storyPoints ?? ''}
                      onBlur={(e) => {
                        const v = e.target.value;
                        save({ storyPoints: v ? parseInt(v, 10) : undefined });
                      }}
                      className="w-full text-xs px-2 py-1 rounded outline-none"
                      style={{
                        background: '#f4f4f5',
                        border: '1px solid #e4e4e7',
                        color: '#3f3f46',
                      }}
                      placeholder="0"
                    />
                  </div>

                  {/* Estimate Hours */}
                  <div>
                    <FieldLabel>Estimate (hrs)</FieldLabel>
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      defaultValue={task.estimateHours ?? ''}
                      onBlur={(e) => {
                        const v = e.target.value;
                        save({ estimateHours: v ? parseFloat(v) : undefined });
                      }}
                      className="w-full text-xs px-2 py-1 rounded outline-none"
                      style={{
                        background: '#f4f4f5',
                        border: '1px solid #e4e4e7',
                        color: '#3f3f46',
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Epic / Story */}
                {(epics.length > 0 || stories.length > 0) && (
                  <div className="grid grid-cols-2 gap-x-4">
                    <div>
                      <FieldLabel>Epic</FieldLabel>
                      {fieldSelect(
                        taskEpicId,
                        [
                          { value: '', label: '— None —' },
                          ...epics.map((e) => ({ value: e.id, label: e.title })),
                        ],
                        handleEpicChange
                      )}
                    </div>
                    <div>
                      <FieldLabel>Story</FieldLabel>
                      {fieldSelect(
                        task.storyId ?? '',
                        [
                          { value: '', label: '— None —' },
                          ...filteredStories.map((s) => ({ value: s.id, label: s.title })),
                        ],
                        handleStoryChange
                      )}
                    </div>
                  </div>
                )}

                {/* Labels */}
                <div>
                  <FieldLabel>Labels</FieldLabel>
                  <div className="flex flex-wrap gap-1.5 items-center">
                    {(task.labels ?? []).map((lbl) => (
                      <span
                        key={lbl}
                        className="inline-flex items-center gap-1 px-2 py-0.5 text-[0.65rem] font-medium"
                        style={{
                          background: '#eff6ff',
                          color: '#1d4ed8',
                          borderRadius: '999px',
                          border: '1px solid #bfdbfe',
                        }}
                      >
                        {lbl}
                        <button
                          onClick={() => removeLabel(lbl)}
                          className="opacity-60 hover:opacity-100 leading-none"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                    {addingLabel ? (
                      <input
                        autoFocus
                        value={labelDraft}
                        onChange={(e) => setLabelDraft(e.target.value)}
                        onBlur={addLabel}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') addLabel();
                          if (e.key === 'Escape') {
                            setLabelDraft('');
                            setAddingLabel(false);
                          }
                        }}
                        className="text-xs px-2 py-0.5 rounded outline-none w-24"
                        style={{
                          background: '#f4f4f5',
                          border: '1px solid #d97706',
                          color: '#3f3f46',
                        }}
                        placeholder="label…"
                      />
                    ) : (
                      <button
                        onClick={() => setAddingLabel(true)}
                        className="inline-flex items-center gap-0.5 text-[0.65rem] px-1.5 py-0.5 rounded-full transition-colors"
                        style={{ color: '#a1a1aa', border: '1px dashed #d4d4d8' }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = '#d97706')}
                        onMouseLeave={(e) => (e.currentTarget.style.color = '#a1a1aa')}
                      >
                        <Plus className="w-3 h-3" /> Add
                      </button>
                    )}
                  </div>
                </div>

                {/* Overview text (read-only narrative) */}
                {task.overview && (
                  <div>
                    <FieldLabel>Notes</FieldLabel>
                    <p className="text-xs leading-relaxed" style={{ color: '#3f3f46' }}>
                      {task.overview}
                    </p>
                  </div>
                )}

                {/* Delete */}
                <div className="pt-2" style={{ borderTop: '1px solid #e4e4e7' }}>
                  {confirmingDeleteId === task.id ? (
                    <div
                      className="p-3"
                      style={{
                        background: '#fff1f2',
                        border: '1px solid #fecdd3',
                        borderRadius: '4px',
                      }}
                    >
                      <p className="text-xs mb-3" style={{ color: '#be123c' }}>
                        Delete <span className="font-semibold">"{task.title}"</span>? This cannot be undone.
                      </p>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => deleteTask(task.id)}
                          className="flex-1 py-1.5 text-xs font-medium"
                          style={{
                            background: '#be123c',
                            color: '#ffffff',
                            borderRadius: '4px',
                            border: 'none',
                          }}
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => setConfirmingDeleteId(null)}
                          className="flex-1 py-1.5 text-xs font-medium"
                          style={{
                            background: '#ffffff',
                            color: '#3f3f46',
                            borderRadius: '4px',
                            border: '1px solid #e4e4e7',
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setConfirmingDeleteId(task.id)}
                      className="flex items-center gap-2 w-full px-2 py-1.5 text-xs transition-colors"
                      style={{ color: '#a1a1aa', borderRadius: '4px' }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#be123c';
                        e.currentTarget.style.background = '#fff1f2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#a1a1aa';
                        e.currentTarget.style.background = 'transparent';
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      Delete task
                    </button>
                  )}
                </div>
              </>
            )}

            {/* ── CRITERIA TAB ── */}
            {activeTab === 'criteria' && (
              <div>
                {task.criteria && task.criteria.length > 0 ? (
                  <>
                    <p
                      className="text-[0.65rem] font-semibold uppercase tracking-wide mb-3"
                      style={{ color: '#a1a1aa' }}
                    >
                      Acceptance Criteria
                    </p>
                    <div className="space-y-2">
                      {task.criteria.map((criterion, i) => {
                        const key = `${task.id}:${i}`;
                        const checked = checkedCriteria[key] || false;
                        return (
                          <label key={i} className="flex items-start gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={() => toggleCriterion(key)}
                              className="mt-0.5 w-3.5 h-3.5 rounded"
                              style={{ accentColor: color.accent }}
                            />
                            <span
                              className="text-xs leading-relaxed"
                              style={{
                                color: checked ? '#a1a1aa' : '#3f3f46',
                                textDecoration: checked ? 'line-through' : 'none',
                              }}
                            >
                              {criterion}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                    {/* Completion summary */}
                    {(() => {
                      const total = task.criteria.length;
                      const done = task.criteria.filter(
                        (_, i) => checkedCriteria[`${task.id}:${i}`]
                      ).length;
                      const pct = total > 0 ? Math.round((done / total) * 100) : 0;
                      return (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[0.65rem]" style={{ color: '#a1a1aa' }}>
                              {done}/{total} complete
                            </span>
                            <span className="text-[0.65rem] font-semibold" style={{ color: '#15803d' }}>
                              {pct}%
                            </span>
                          </div>
                          <div
                            className="h-1.5 rounded-full overflow-hidden"
                            style={{ background: '#f4f4f5' }}
                          >
                            <div
                              className="h-full rounded-full transition-all"
                              style={{
                                width: `${pct}%`,
                                background: pct === 100 ? '#15803d' : '#d97706',
                              }}
                            />
                          </div>
                        </div>
                      );
                    })()}
                  </>
                ) : (
                  <p className="text-xs" style={{ color: '#a1a1aa' }}>
                    No acceptance criteria defined for this task.
                  </p>
                )}
              </div>
            )}

            {/* ── COMMENTS TAB ── */}
            {activeTab === 'comments' && (
              <CommentThread taskId={task.id} />
            )}

            {/* ── ACTIVITY TAB ── */}
            {activeTab === 'activity' && (
              <ActivityFeed taskId={task.id} />
            )}

            {/* ── AGENT TAB ── */}
            {activeTab === 'agent' && (
              <div className="space-y-5">
                {/* Agent-touched badge */}
                {agentTouchedIds.has(task.id) && (
                  <div
                    className="flex items-center gap-2 px-3 py-2 rounded"
                    style={{
                      background: 'rgba(124, 58, 237, 0.07)',
                      border: '1px solid rgba(124, 58, 237, 0.2)',
                    }}
                  >
                    <Bot className="w-3.5 h-3.5" style={{ color: '#7c3aed' }} />
                    <span className="text-xs font-medium" style={{ color: '#7c3aed' }}>
                      Agent has touched this task
                    </span>
                  </div>
                )}

                {/* Dispatch section */}
                <div>
                  <p
                    className="text-[0.65rem] font-semibold uppercase tracking-wide mb-3"
                    style={{ color: '#a1a1aa' }}
                  >
                    Agent Dispatch
                  </p>
                  {assignedAgent ? (
                    <>
                      <div
                        className="p-3 mb-3"
                        style={{
                          background: '#fafafa',
                          border: '1px solid #e4e4e7',
                          borderRadius: '4px',
                        }}
                      >
                        <p
                          className="text-[0.65rem] font-semibold uppercase tracking-wide mb-1"
                          style={{ color: '#a1a1aa' }}
                        >
                          Assigned Agent
                        </p>
                        <button
                          onClick={() => drillPanel({ mode: 'agent', id: assignedAgent.id })}
                          className="text-xs font-medium hover:underline text-left"
                          style={{ color: '#7c3aed' }}
                        >
                          {assignedAgent.name}
                        </button>
                        <p className="text-xs mt-0.5" style={{ color: '#71717a' }}>
                          {assignedAgent.type}
                        </p>
                      </div>
                      <button
                        onClick={() => dispatchAgent(assignedAgent.id, task.id)}
                        disabled={isRunning}
                        className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        style={{
                          background: 'rgba(124, 58, 237, 0.07)',
                          border: '1px solid rgba(124, 58, 237, 0.3)',
                          color: '#7c3aed',
                          borderRadius: '4px',
                        }}
                      >
                        {isRunning ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                            Running…
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" />
                            Run Agent
                          </>
                        )}
                      </button>
                      {latestDispatch && <DispatchResultView d={latestDispatch} />}
                    </>
                  ) : (
                    <p className="text-xs" style={{ color: '#a1a1aa' }}>
                      No agent assigned to this task. Assign one in the Overview tab.
                    </p>
                  )}
                </div>

                {/* AI Insight */}
                <div style={{ borderTop: '1px solid #e4e4e7', paddingTop: '16px' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p
                      className="text-[0.65rem] font-semibold uppercase tracking-wide"
                      style={{ color: '#a1a1aa' }}
                    >
                      AI Insight
                    </p>
                    {insightText && (
                      <button
                        onClick={() => setInsightOpen((v) => !v)}
                        className="p-1 rounded transition-colors"
                        style={{ color: '#a1a1aa' }}
                      >
                        {insightOpen ? (
                          <ChevronUp className="w-3.5 h-3.5" />
                        ) : (
                          <ChevronDown className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                  <button
                    onClick={getInsight}
                    disabled={insightLoading}
                    className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background: insightLoading ? '#f4f4f5' : 'rgba(217, 119, 6, 0.07)',
                      border: '1px solid rgba(217, 119, 6, 0.3)',
                      color: '#d97706',
                      borderRadius: '4px',
                    }}
                  >
                    {insightLoading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        Analyzing…
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-3.5 h-3.5" />
                        Get AI Insight
                      </>
                    )}
                  </button>

                  {insightText && insightOpen && (
                    <div
                      className="mt-3 p-3 space-y-2"
                      style={{
                        background: '#fffbeb',
                        border: '1px solid #fde68a',
                        borderRadius: '4px',
                      }}
                    >
                      {insightText.split('\n\n').map((para, i) => (
                        <p
                          key={i}
                          className="text-xs leading-relaxed"
                          style={{ color: '#78350f' }}
                        >
                          {para}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </>
    );
  }

  // ── Agent mode (unchanged) ────────────────────────────────────────────────

  if (entry.mode === 'agent') {
    const dev = developers.find((d) => d.id === entry.id);
    const agent = agents.find((a) => a.id === entry.id);
    const subAgent = subAgents.find((sa) => sa.id === entry.id);

    const node = dev || agent || subAgent;
    if (!node) return null;

    let nodeType: 'developer' | 'agent' | 'sub-agent' = 'agent';
    let nodeTypeLabel = 'Agent';
    if (dev) {
      nodeType = 'developer';
      nodeTypeLabel = 'Developer';
    } else if (subAgent) {
      nodeType = 'sub-agent';
      nodeTypeLabel = 'Sub-Agent';
    }

    const color = getNodeColor(nodeType);
    const isAgentNode = agent || subAgent;
    const { checkedCriteria: cc, toggleCriterion: tc, getTaskDispatches: gtd } = ctx;

    return (
      <motion.div
        initial={{ x: 380 }}
        animate={{ x: 0 }}
        exit={{ x: 380 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="fixed right-0 top-0 bottom-0 w-[360px] z-50 overflow-y-auto"
        style={{
          background: '#ffffff',
          borderLeft: '1px solid #e4e4e7',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
        }}
      >
        {/* Accent bar */}
        <div style={{ height: 2, background: color.accent }} />

        {/* Header */}
        <div className="px-5 py-4" style={{ borderBottom: '1px solid #e4e4e7' }}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {panelStack.length > 1 && (
                <button
                  onClick={panelBack}
                  className="p-1 rounded transition-colors"
                  style={{ color: '#71717a' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span
                className="text-[0.65rem] font-semibold px-2 py-0.5 uppercase tracking-wide"
                style={{ background: color.bg, color: color.accent, borderRadius: '3px' }}
              >
                {nodeTypeLabel}
              </span>
            </div>
            <button
              onClick={closePanel}
              className="p-1.5 rounded transition-colors"
              style={{ color: '#71717a' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <h2 className="text-base font-semibold mb-1" style={{ color: '#0f0f0f' }}>{node.name}</h2>
          {isAgentNode && (
            <p className="text-xs" style={{ color: '#71717a' }}>
              {agent ? agent.type : subAgent?.type}
            </p>
          )}
          {dev && <p className="text-xs" style={{ color: '#71717a' }}>{dev.role}</p>}
        </div>

        {/* Content */}
        <div className="px-5 py-4 space-y-5">
          {node.desc && (
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide mb-1.5" style={{ color: '#a1a1aa' }}>
                About
              </p>
              <p className="text-xs leading-relaxed" style={{ color: '#3f3f46' }}>{node.desc}</p>
            </div>
          )}

          {node.outputs && node.outputs.length > 0 && (
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide mb-2" style={{ color: '#a1a1aa' }}>
                Outputs
              </p>
              <ul className="space-y-1.5">
                {node.outputs.map((output, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs" style={{ color: '#3f3f46' }}>
                    <div
                      className="w-1 h-1 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.accent }}
                    />
                    {output}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {node.criteria && node.criteria.length > 0 && (
            <div>
              <p className="text-[0.65rem] font-semibold uppercase tracking-wide mb-2" style={{ color: '#a1a1aa' }}>
                {dev ? 'Responsibilities' : 'Success Criteria'}
              </p>
              <div className="space-y-2">
                {node.criteria.map((criterion, i) => {
                  const key = `${node.id}:${i}`;
                  const checked = cc[key] || false;
                  return (
                    <label key={i} className="flex items-start gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => tc(key)}
                        className="mt-0.5 w-3.5 h-3.5"
                        style={{ accentColor: color.accent }}
                      />
                      <span
                        className="text-xs leading-relaxed"
                        style={{
                          color: checked ? '#a1a1aa' : '#3f3f46',
                          textDecoration: checked ? 'line-through' : 'none',
                        }}
                      >
                        {criterion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}

          {/* Agent Dispatch */}
          {agent && (() => {
            const agentTask = allTasks.find(t => t.agentId === agent.id && t.status === 'progress')
              ?? allTasks.find(t => t.agentId === agent.id);
            const taskDispatches = agentTask ? gtd(agentTask.id) : [];
            const latestDispatch = [...taskDispatches].sort(
              (a, b) => new Date(b.request.dispatchedAt).getTime() - new Date(a.request.dispatchedAt).getTime()
            )[0];
            const isRunning = latestDispatch?.status === 'dispatched' || latestDispatch?.status === 'running';
            return (
              <div className="pt-2" style={{ borderTop: '1px solid #e4e4e7' }}>
                <p className="text-[0.65rem] font-semibold uppercase tracking-wide mb-3" style={{ color: '#a1a1aa' }}>
                  Agent Dispatch
                </p>
                {agentTask ? (
                  <>
                    <p className="text-xs mb-3" style={{ color: '#71717a' }}>
                      Task: <span style={{ color: '#3f3f46', fontWeight: 500 }}>{agentTask.title}</span>
                    </p>
                    <button
                      onClick={() => dispatchAgent(agent.id, agentTask.id)}
                      disabled={isRunning}
                      className="flex items-center justify-center gap-2 w-full py-2 text-xs font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      style={{
                        background: color.bg,
                        border: `1px solid ${color.accent}40`,
                        color: color.accent,
                        borderRadius: '4px',
                      }}
                    >
                      {isRunning ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          Running...
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" />
                          Run Agent
                        </>
                      )}
                    </button>
                    {latestDispatch && <DispatchResultView d={latestDispatch} />}
                  </>
                ) : (
                  <p className="text-xs" style={{ color: '#a1a1aa' }}>No task assigned to this agent.</p>
                )}
              </div>
            );
          })()}
        </div>
      </motion.div>
    );
  }

  return null;
}
