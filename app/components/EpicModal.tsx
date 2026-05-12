import { useState } from 'react';
import { X, Save, Plus } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { AppEpic, PriorityType } from '../types';

interface EpicModalProps {
  epic?: AppEpic;
  onSave: (epic: AppEpic) => void;
  onClose: () => void;
}

const PRIORITY_OPTIONS: { value: PriorityType; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'critical', label: 'Critical' },
];

const PRESET_COLORS = [
  '#7c3aed',
  '#2563eb',
  '#16a34a',
  '#dc2626',
  '#d97706',
  '#0891b2',
];

export function EpicModal({ epic, onSave, onClose }: EpicModalProps) {
  const { activeProjectId } = useApp();
  const isEdit = !!epic;

  const [form, setForm] = useState({
    title: epic?.title ?? '',
    description: epic?.description ?? '',
    priority: (epic?.priority ?? 'medium') as PriorityType,
    color: epic?.color ?? '#7c3aed',
    startDate: epic?.startDate ?? '',
    targetDate: epic?.targetDate ?? '',
  });

  const set = (key: string, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = () => {
    if (!form.title.trim()) return;

    const now = new Date().toISOString();
    const saved: AppEpic = {
      id: epic?.id ?? `epic-${Date.now()}`,
      projectId: epic?.projectId ?? activeProjectId,
      title: form.title.trim(),
      description: form.description.trim(),
      status: epic?.status ?? 'active',
      priority: form.priority,
      color: form.color,
      startDate: form.startDate || undefined,
      targetDate: form.targetDate || undefined,
      createdAt: epic?.createdAt ?? now,
    };

    onSave(saved);
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ backgroundColor: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full max-w-lg max-h-[90vh] flex flex-col shadow-xl"
        style={{
          background: 'var(--panel-elevated)',
          border: '1px solid var(--border)',
          borderRadius: '18px',
          boxShadow: '0 28px 70px rgba(2, 6, 23, 0.46)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>
            {isEdit ? 'Edit Epic' : 'New Epic'}
          </h2>
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
        <div className="px-5 py-4 flex flex-col gap-4 overflow-y-auto">
          <Field label="Title *">
            <input
              autoFocus
              type="text"
              placeholder="Epic title"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="epic-modal-input"
            />
          </Field>

          <Field label="Description">
            <textarea
              rows={3}
              placeholder="What does this epic cover? (optional)"
              value={form.description}
              onChange={(e) => set('description', e.target.value)}
              className="epic-modal-input resize-none"
            />
          </Field>

          <Field label="Priority">
            <select
              value={form.priority}
              onChange={(e) => set('priority', e.target.value)}
              className="epic-modal-input"
            >
              {PRIORITY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </Field>

          <Field label="Color">
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => set('color', c)}
                  className="w-7 h-7 rounded-full transition-all flex-shrink-0"
                  style={{
                    background: c,
                    outline: form.color === c ? `3px solid ${c}` : 'none',
                    outlineOffset: '2px',
                    opacity: form.color === c ? 1 : 0.7,
                  }}
                  title={c}
                />
              ))}
              <input
                type="color"
                value={form.color}
                onChange={(e) => set('color', e.target.value)}
                className="w-7 h-7 rounded cursor-pointer flex-shrink-0"
                style={{ border: '1px solid var(--border)', padding: '1px', background: 'rgba(16, 25, 35, 0.72)' }}
                title="Custom color"
              />
            </div>
          </Field>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Start Date">
              <input
                type="date"
                value={form.startDate}
                onChange={(e) => set('startDate', e.target.value)}
                className="epic-modal-input"
              />
            </Field>
            <Field label="Target Date">
              <input
                type="date"
                value={form.targetDate}
                onChange={(e) => set('targetDate', e.target.value)}
                className="epic-modal-input"
              />
            </Field>
          </div>
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-2 px-5 py-4 flex-shrink-0"
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
              color: '#ffffff',
              borderRadius: '12px',
              border: '1px solid rgba(96, 165, 250, 0.28)',
            }}
          >
            {isEdit ? <Save className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            {isEdit ? 'Save Changes' : 'Create Epic'}
          </button>
        </div>
      </div>

      <style>{`
        .epic-modal-input {
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
        .epic-modal-input::placeholder { color: #7b8494; }
        .epic-modal-input:focus { border-color: #3b82f6; background: #101923; box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.12); }
        .epic-modal-input option { background: #0e1622; color: #e5e7eb; }
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
