import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check, FolderPlus, Folder, Trash2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NewProjectModal } from './NewProjectModal';

export function ProjectSwitcher() {
  const { projects, activeProject, switchProject, deleteProject } = useApp();
  const [open, setOpen] = useState(false);
  const [showNewModal, setShowNewModal] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (id: string) => {
    switchProject(id);
    setOpen(false);
  };

  const handleNewProject = () => {
    setOpen(false);
    setShowNewModal(true);
  };

  return (
    <>
      <div className="relative" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2 text-xs transition-all rounded-xl"
          style={{
            background: open ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 25, 35, 0.72)',
            border: '1px solid var(--border)',
            color: '#dce3ee',
          }}
          onMouseEnter={(e) => { if (!open) (e.currentTarget.style.background = 'rgba(21, 34, 51, 0.9)'); }}
          onMouseLeave={(e) => { if (!open) (e.currentTarget.style.background = 'rgba(16, 25, 35, 0.72)'); }}
          title="Switch project"
        >
          <Folder className="w-3 h-3" style={{ color: '#60a5fa' }} />
          <span className="max-w-[100px] truncate font-medium">
            {activeProject?.name ?? 'My Project'}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            style={{ color: 'var(--muted-foreground)' }}
          />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 w-52 overflow-hidden z-50 shadow-lg"
            style={{
              background: 'var(--panel-elevated)',
              border: '1px solid var(--border)',
              borderRadius: '14px',
              boxShadow: '0 24px 60px rgba(2, 6, 23, 0.42)',
              backdropFilter: 'blur(18px)',
            }}
          >
            {/* Project list */}
            <div className="py-1 max-h-60 overflow-y-auto">
              {projects.map((p) => {
                const isActive = p.id === activeProject?.id;
                const isConfirming = confirmDeleteId === p.id;
                return (
                  <div
                    key={p.id}
                    className="flex items-center group"
                    style={{
                      background: isActive ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.background = 'rgba(21, 34, 51, 0.8)'); }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                  >
                    <button
                      onClick={() => { if (!isConfirming) handleSelect(p.id); }}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs min-w-0"
                      style={{
                        color: isActive ? '#eff6ff' : '#cbd5e1',
                        fontWeight: isActive ? 600 : 500,
                      }}
                    >
                      <Folder
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: isActive ? '#8b5cf6' : 'var(--muted-foreground)' }}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      {isActive && !isConfirming && (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#8b5cf6' }} />
                      )}
                    </button>

                    {isConfirming ? (
                      <div className="flex items-center gap-1 pr-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteProject(p.id);
                            setConfirmDeleteId(null);
                          }}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: '#ef476f', color: '#fff' }}
                          title="Confirm delete"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: 'rgba(49, 67, 85, 0.85)', color: '#e5e7eb' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                        className="opacity-0 group-hover:opacity-100 pr-2 flex-shrink-0 transition-opacity"
                        style={{ color: 'var(--muted-foreground)' }}
                        title="Delete project"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = 'var(--muted-foreground)'; }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* New Project */}
            <div style={{ borderTop: '1px solid var(--border)' }}>
              <button
                onClick={handleNewProject}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
                style={{ color: 'var(--muted-foreground)' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(21, 34, 51, 0.8)';
                  e.currentTarget.style.color = '#e5e7eb';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = 'var(--muted-foreground)';
                }}
              >
                <FolderPlus className="w-3.5 h-3.5 flex-shrink-0" />
                <span>New Project…</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {showNewModal && <NewProjectModal onClose={() => setShowNewModal(false)} />}
    </>
  );
}
