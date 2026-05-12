import { useState } from 'react';
import { X, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppTask, StatusType, PriorityType } from '../types';

interface CreateTaskModalProps {
  onClose: () => void;
  storyId?: string;
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

export function CreateTaskModal({ onClose, storyId }: CreateTaskModalProps) {
  const { addTask, developers } = useApp();

  const [form, setForm] = useState({
    title: '',
    desc: '',
    status: 'todo' as StatusType,
    priority: 'medium' as PriorityType,
    dueDate: '',
    developerId: '',
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const task: AppTask = {
      id: `t-${Date.now()}`,
      title: form.title.trim(),
      desc: form.desc.trim() || form.title.trim(),
      status: form.status,
      priority: form.priority,
      dueDate: form.dueDate || undefined,
      developerId: form.developerId,
      storyId: storyId || undefined,
    };

    addTask(task);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-md shadow-xl"
        style={{
          background: 'var(--panel-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          boxShadow: '0 28px 70px rgba(2, 6, 23, 0.46)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>New Task</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded transition-colors"
            style={{ color: 'var(--muted-foreground)' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21, 34, 51, 0.82)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <div className="px-5 py-4 flex flex-col gap-4">
          <Field label="Title">
            <input
              autoFocus
              type="text"
              placeholder="What needs to be done?"
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

        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <button
            onClick={onClose}
            className="px-3.5 py-1.5 text-sm transition-colors"
            style={{
              color: '#cbd5e1',
              border: '1px solid var(--border)',
              borderRadius: '12px',
              background: 'rgba(16, 25, 35, 0.72)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(21, 34, 51, 0.82)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 25, 35, 0.72)')}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!form.title.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.22))',
              color: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid rgba(96, 165, 250, 0.28)',
            }}
          >
            <Plus className="w-3.5 h-3.5" />
            Create Task
          </button>
        </div>
      </div>

      <style>{`
        .modal-input {
          width: 100%;
          background: #0d1520;
          border: 1px solid #1f2b3a;
          border-radius: 12px;
          padding: 6px 10px;
          font-size: 0.8125rem;
          color: #e5e7eb;
          outline: none;
          transition: border-color 0.1s;
          font-family: 'Inter', sans-serif;
        }
        .modal-input::placeholder { color: #7b8494; }
        .modal-input:focus { border-color: #3b82f6; background: #101923; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
        .modal-input option { background: #0e1622; color: #e5e7eb; }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>{label}</label>
      {children}
    </div>
  );
}
