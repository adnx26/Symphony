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
      style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="relative w-full max-w-sm shadow-xl"
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
          <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>New Project</h2>
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

        {/* Body */}
        <div className="px-5 py-4">
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-medium" style={{ color: '#71717a' }}>Project Name</label>
            <input
              autoFocus
              type="text"
              placeholder="e.g. Q3 Sprint, Backend Redesign…"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              className="w-full px-3 py-2 text-sm outline-none transition-colors"
              style={{
                background: '#fafafa',
                border: '1px solid #e4e4e7',
                borderRadius: '4px',
                color: '#0f0f0f',
                fontFamily: 'Inter, sans-serif',
              }}
              onFocus={(e) => (e.currentTarget.style.borderColor = '#a1a1aa')}
              onBlur={(e) => (e.currentTarget.style.borderColor = '#e4e4e7')}
            />
          </div>
          <p className="mt-3 text-xs leading-relaxed" style={{ color: '#a1a1aa' }}>
            The current project will be saved automatically and you can switch back to it at any time.
          </p>
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
            disabled={!name.trim()}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-sm font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: '#0f0f0f',
              color: '#ffffff',
              borderRadius: '4px',
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
