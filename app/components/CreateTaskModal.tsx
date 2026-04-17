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
  const { addTask, developers, agents } = useApp();

  const [form, setForm] = useState({
    title: '',
    desc: '',
    status: 'todo' as StatusType,
    priority: 'medium' as PriorityType,
    dueDate: '',
    developerId: '',
    agentId: '',
    assigneeType: 'dev' as 'dev' | 'agent',
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
      agentId: form.agentId || undefined,
      assigneeType: form.assigneeType,
      agentAssigned: !!form.agentId,
      storyId: storyId || undefined,
    };

    addTask(task);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      {/* Modal */}
      <div
        className="relative w-full max-w-md shadow-xl"
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: '6px',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4"
          style={{ borderBottom: '1px solid #e4e4e7' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>New Task</h2>
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

          <div className="grid grid-cols-2 gap-3">
            <Field label="Agent">
              <select value={form.agentId} onChange={(e) => set('agentId', e.target.value)} className="modal-input">
                <option value="">None</option>
                {agents.map((a) => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </Field>
            <Field label="Owner">
              <select value={form.assigneeType} onChange={(e) => set('assigneeType', e.target.value)} className="modal-input">
                <option value="dev">Developer</option>
                <option value="agent">Agent</option>
              </select>
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4"
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
            <Plus className="w-3.5 h-3.5" />
            Create Task
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
