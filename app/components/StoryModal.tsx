import { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppStory, StatusType, PriorityType } from '../types';

interface StoryModalProps {
  story?: AppStory;
  onSave: (story: AppStory) => void;
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

export function StoryModal({ story, onSave, onClose }: StoryModalProps) {
  const { epics, developers, activeProjectId } = useApp();
  const isEdit = !!story;

  const [form, setForm] = useState({
    title: story?.title ?? '',
    description: story?.description ?? '',
    epicId: story?.epicId ?? '',
    status: (story?.status ?? 'todo') as StatusType,
    priority: (story?.priority ?? 'medium') as PriorityType,
    storyPoints: story?.storyPoints ?? 0,
    assigneeId: story?.assigneeId ?? '',
  });

  const set = (key: string, value: string | number) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const now = new Date().toISOString();
    const saved: AppStory = {
      id: story?.id ?? `story-${Date.now()}`,
      projectId: story?.projectId ?? activeProjectId,
      epicId: form.epicId || undefined,
      title: form.title.trim(),
      description: form.description.trim(),
      status: form.status,
      priority: form.priority,
      storyPoints: Number(form.storyPoints) || 0,
      assigneeId: form.assigneeId || undefined,
      createdAt: story?.createdAt ?? now,
    };

    onSave(saved);
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
          <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>
            {isEdit ? 'Edit Story' : 'New Story'}
          </h2>
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
          <Field label="Title *">
            <input
              autoFocus
              type="text"
              placeholder="Story title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="story-modal-input"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              placeholder="Describe this story (optional)"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="story-modal-input resize-none"
            />
          </Field>

          <Field label="Epic">
            <select
              value={form.epicId}
              onChange={(e) => set('epicId', e.target.value)}
              className="story-modal-input"
            >
              <option value="">No Epic</option>
              {epics.map((ep) => (
                <option key={ep.id} value={ep.id}>{ep.title}</option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Status">
              <select
                value={form.status}
                onChange={(e) => set('status', e.target.value)}
                className="story-modal-input"
              >
                {STATUS_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => set('priority', e.target.value)}
                className="story-modal-input"
              >
                {PRIORITY_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Story Points">
              <input
                type="number"
                min={0}
                placeholder="0"
                value={form.storyPoints}
                onChange={(e) => set('storyPoints', e.target.value)}
                className="story-modal-input"
              />
            </Field>
            <Field label="Assignee">
              <select
                value={form.assigneeId}
                onChange={(e) => set('assigneeId', e.target.value)}
                className="story-modal-input"
              >
                <option value="">Unassigned</option>
                {developers.map((d) => (
                  <option key={d.id} value={d.id}>{d.name}</option>
                ))}
              </select>
            </Field>
          </div>
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
            {isEdit ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isEdit ? 'Save Changes' : 'Create Story'}
          </button>
        </div>
      </div>

      <style>{`
        .story-modal-input {
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
        .story-modal-input::placeholder { color: #a1a1aa; }
        .story-modal-input:focus { border-color: #a1a1aa; background: #ffffff; }
        .story-modal-input option { background: #ffffff; color: #0f0f0f; }
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
