import { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, FolderPlus } from 'lucide-react';
import { useApp } from '../context/AppContext';

interface NewProjectModalProps {
  onClose: () => void;
}

export function NewProjectModal({ onClose }: NewProjectModalProps) {
  const { createProject } = useApp();
  const [name, setName] = useState('');

  const handleSubmit = () => {
    if (!name.trim()) return;
    createProject(name.trim());
    onClose();
  };

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{ backgroundColor: 'rgba(2,6,23,0.62)', backdropFilter: 'blur(10px)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm shadow-xl"
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
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>New Project</h2>
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

        {/* Body */}
        <div className="px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#94a3b8' }}>Project Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Q3 Sprint, Backend Redesign…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: '#0d1520',
                border: '1px solid #1f2b3a',
                borderRadius: '12px',
                color: '#e5e7eb',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = '#3b82f6';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(59, 130, 246, 0.12)';
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = '#1f2b3a';
                e.currentTarget.style.boxShadow = 'none';
              }}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
            The current project will be saved automatically and you can switch back to it at any time.
          </p>
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
            disabled={!name.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.22))',
              color: '#f8fafc',
              borderRadius: '12px',
              border: '1px solid rgba(96, 165, 250, 0.28)',
            }}
          >
            <FolderPlus className="w-3.5 h-3.5" />
            Create Project
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
