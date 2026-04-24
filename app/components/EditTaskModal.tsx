import { useState } from 'react';
import { X, Save, Plus, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTask, StatusType, PriorityType } from '../types';

interface EditTaskModalProps {
  task: AppTask;
  onClose: () => void;
}

const STATUS_OPTIONS: { value: StatusType; label: string }[] = [
  { value: 'todo', label: 'To Do' },
  { value: 'progress', label: 'In Progress' },
  { value: 'done', label: 'Done' },
  { value: 'blocked', label: 'Blocked' },
];

const PRIORITY_OPTIONS: { value: PriorityType; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

export function EditTaskModal({ task, onClose }: EditTaskModalProps) {
  const { updateTask, developers, stories } = useApp();

  const [form, setForm] = useState({
    title: task.title,
    desc: task.desc,
    overview: task.overview ?? '',
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate ?? '',
    developerId: task.developerId,
    storyId: task.storyId ?? '',
    storyPoints: task.storyPoints ?? 0,
    labelsRaw: (task.labels ?? []).join(', '),
    estimateHours: task.estimateHours ?? 0,
  });

  const [criteria, setCriteria] = useState<string[]>(task.criteria ?? []);
  const [newCriterion, setNewCriterion] = useState('');

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const addCriterion = () => {
    const trimmed = newCriterion.trim();
    if (!trimmed) return;
    setCriteria((prev) => [...prev, trimmed]);
    setNewCriterion('');
  };

  const removeCriterion = (index: number) => {
    setCriteria((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const labels = form.labelsRaw
      .split(',')
      .map((l) => l.trim())
      .filter(Boolean);

    const updated: AppTask = {
      ...task,
      title: form.title.trim(),
      desc: form.desc.trim() || form.title.trim(),
      overview: form.overview.trim() || undefined,
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      developerId: form.developerId,
      criteria: criteria.length > 0 ? criteria : undefined,
      storyId: form.storyId || undefined,
      storyPoints: Number(form.storyPoints) || 0,
      labels: labels.length > 0 ? labels : [],
      estimateHours: Number(form.estimateHours) || 0,
    };

    updateTask(updated);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: '6px',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid #e4e4e7' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>Edit Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: '#71717a' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <Field label="Title">
            <input
              autoFocus
              type="text"
              placeholder="Task title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="modal-input"
            />
          </Field>

          <Field label="Description">
            <input
              type="text"
              placeholder="Short summary shown on the card"
              value={form.desc}
              onChange={(e) => set('desc', e.target.value)}
              className="modal-input"
            />
          </Field>

          <Field label="Overview">
            <textarea
              rows={3}
              placeholder="Longer description shown in the detail panel (optional)"
              value={form.overview}
              onChange={(e) => set('overview', e.target.value)}
              className="modal-input resize-none"
            />
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select value={form.status} onChange={(e) => set('status', e.target.value)} className="modal-input">
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select value={form.priority} onChange={(e) => set('priority', e.target.value)} className="modal-input">
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <Field label="Due Date">
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => set('dueDate', e.target.value)}
              className="modal-input"
            />
          </Field>

          <Field label="Developer">
            <select value={form.developerId} onChange={(e) => set('developerId', e.target.value)} className="modal-input">
              {developers.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>
          </Field>

          <Field label="Story">
            <select value={form.storyId} onChange={(e) => set('storyId', e.target.value)} className="modal-input">
              <option value="">None</option>
              {stories.map((s) => (
                <option key={s.id} value={s.id}>{s.title}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Story Points">
              <input
                type="number"
                min={0}
                placeholder="0"
                value={form.storyPoints}
                onChange={(e) => set('storyPoints', e.target.value)}
                className="modal-input"
              />
            </Field>
            <Field label="Estimate (hours)">
              <input
                type="number"
                min={0}
                step={0.5}
                placeholder="0"
                value={form.estimateHours}
                onChange={(e) => set('estimateHours', e.target.value)}
                className="modal-input"
              />
            </Field>
          </div>

          <Field label="Labels">
            <input
              type="text"
              placeholder="comma-separated, e.g. frontend, bug, urgent"
              value={form.labelsRaw}
              onChange={(e) => set('labelsRaw', e.target.value)}
              className="modal-input"
            />
          </Field>

          {/* Acceptance Criteria */}
          <Field label="Acceptance Criteria">
            <div className="flex flex-col gap-2">
              {criteria.map((c, i) => (
                <div key={i} className="flex items-start gap-2">
                  <span
                    className="flex-1 text-xs px-2.5 py-1.5 leading-relaxed"
                    style={{
                      background: '#fafafa',
                      border: '1px solid #e4e4e7',
                      borderRadius: '4px',
                      color: '#3f3f46',
                    }}
                  >
                    {c}
                  </span>
                  <button
                    onClick={() => removeCriterion(i)}
                    className="mt-1 p-1 rounded flex-shrink-0 transition-colors"
                    style={{ color: '#a1a1aa' }}
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
                  </button>
                </div>
              ))}
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Add a criterion and press Enter"
                  value={newCriterion}
                  onChange={(e) => setNewCriterion(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addCriterion(); } }}
                  className="modal-input flex-1"
                />
                <button
                  onClick={addCriterion}
                  disabled={!newCriterion.trim()}
                  className="px-3 py-1.5 text-xs font-medium flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                  style={{
                    background: '#f4f4f5',
                    border: '1px solid #e4e4e7',
                    borderRadius: '4px',
                    color: '#3f3f46',
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </Field>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4 flex-shrink-0"
          style={{ borderTop: '1px solid #e4e4e7' }}
        >
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-sm transition-colors"
            style={{
              color: '#3f3f46',
              border: '1px solid #e4e4e7',
              borderRadius: '4px',
              background: 'transparent',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#0f0f0f',
              color: '#ffffff',
              borderRadius: '4px',
            }}
          >
            <Save className="w-3.5 h-3.5" />
            Save Changes
          </button>
        </div>
      </div>

      <style>{`
        .modal-input {
          width: 100%;
          background: #fafafa;
          border: 1px solid #e4e4e7;
          border-radius: 4px;
          padding: 6px 10px;
          font-size: 0.8125rem;
          color: #0f0f0f;
          outline: none;
          transition: border-color 0.1s;
          font-family: 'Inter', sans-serif;
        }
        .modal-input::placeholder { color: #a1a1aa; }
        .modal-input:focus { border-color: #a1a1aa; background: #ffffff; }
        .modal-input option { background: #ffffff; color: #0f0f0f; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#71717a' }}>{label}</label>
      {children}
    </div>
  );
}
