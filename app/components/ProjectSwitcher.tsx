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
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs transition-colors"
          style={{
            background: open ? '#f4f4f5' : 'transparent',
            border: '1px solid #e4e4e7',
            borderRadius: '4px',
            color: '#3f3f46',
          }}
          onMouseEnter={(e) => { if (!open) (e.currentTarget.style.background = '#f4f4f5'); }}
          onMouseLeave={(e) => { if (!open) (e.currentTarget.style.background = 'transparent'); }}
          title="Switch project"
        >
          <Folder className="w-3 h-3" style={{ color: '#71717a' }} />
          <span className="max-w-[100px] truncate font-medium">
            {activeProject?.name ?? 'My Project'}
          </span>
          <ChevronDown
            className={`w-3 h-3 transition-transform duration-150 ${open ? 'rotate-180' : ''}`}
            style={{ color: '#a1a1aa' }}
          />
        </button>

        {open && (
          <div
            className="absolute left-0 top-full mt-1 w-52 overflow-hidden z-50 shadow-lg"
            style={{
              background: '#ffffff',
              border: '1px solid #e4e4e7',
              borderRadius: '6px',
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
                      background: isActive ? '#f4f4f5' : 'transparent',
                    }}
                    onMouseEnter={(e) => { if (!isActive) (e.currentTarget.style.background = '#fafafa'); }}
                    onMouseLeave={(e) => { if (!isActive) (e.currentTarget.style.background = 'transparent'); }}
                  >
                    <button
                      onClick={() => { if (!isConfirming) handleSelect(p.id); }}
                      className="flex-1 flex items-center gap-2 px-3 py-2 text-left text-xs min-w-0"
                      style={{
                        color: isActive ? '#0f0f0f' : '#3f3f46',
                        fontWeight: isActive ? 500 : 400,
                      }}
                    >
                      <Folder
                        className="w-3.5 h-3.5 flex-shrink-0"
                        style={{ color: isActive ? '#0284c7' : '#a1a1aa' }}
                      />
                      <span className="flex-1 truncate">{p.name}</span>
                      {isActive && !isConfirming && (
                        <Check className="w-3.5 h-3.5 flex-shrink-0" style={{ color: '#0284c7' }} />
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
                          style={{ background: '#ef4444', color: '#fff' }}
                          title="Confirm delete"
                        >
                          Delete
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                          className="text-xs px-1.5 py-0.5 rounded"
                          style={{ background: '#e4e4e7', color: '#3f3f46' }}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(p.id); }}
                        className="opacity-0 group-hover:opacity-100 pr-2 flex-shrink-0 transition-opacity"
                        style={{ color: '#a1a1aa' }}
                        title="Delete project"
                        onMouseEnter={(e) => { e.currentTarget.style.color = '#ef4444'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.color = '#a1a1aa'; }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                );
              })}
            </div>

            {/* New Project */}
            <div style={{ borderTop: '1px solid #e4e4e7' }}>
              <button
                onClick={handleNewProject}
                className="w-full flex items-center gap-2 px-3 py-2 text-left text-xs transition-colors"
                style={{ color: '#71717a' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = '#fafafa';
                  e.currentTarget.style.color = '#3f3f46';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'transparent';
                  e.currentTarget.style.color = '#71717a';
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
