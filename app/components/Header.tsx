import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { RotateCcw, Plus, Moon, Sun } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { FilterState } from '../types';
import { CreateTaskModal } from './CreateTaskModal';
import { ProjectSwitcher } from './ProjectSwitcher';
import { useTheme } from '../context/ThemeContext';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView = location.pathname === '/tickets'
    ? 'tickets'
    : location.pathname === '/backlog'
    ? 'backlog'
    : location.pathname === '/sprint'
    ? 'sprint'
    : location.pathname === '/session'
    ? 'session'
    : location.pathname === '/token-analytics'
    ? 'token-analytics'
    : 'tickets';
  const { filters, setFilters, visible, resetLayout, developers } = useApp();
  const { dark, toggle: toggleDark } = useTheme();
  const [showCreate, setShowCreate] = useState(false);

  const devNames = ['', ...new Set(developers.map((d) => d.name))];
  const statuses = ['', 'todo', 'progress', 'done', 'blocked'];
  const priorities = ['', 'low', 'medium', 'high', 'critical'];

  const statusLabels: Record<string, string> = {
    '': 'All',
    todo: 'To Do',
    progress: 'In Progress',
    done: 'Done',
    blocked: 'Blocked',
  };

  const priorityLabels: Record<string, string> = {
    '': 'All',
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    critical: 'Critical',
  };

  const handleFilterChange = (key: keyof FilterState, value: string) => {
    setFilters({ ...filters, [key]: value });
  };

  const totalNodes = visible.tasks.length + visible.devs.length;
  const showWorkControls = activeView !== 'token-analytics';

  return (
    <>
      <header
        className="sticky top-0 z-50 h-14 border-b backdrop-blur-xl"
        style={{
          background: 'rgba(7, 11, 18, 0.86)',
          borderColor: 'rgba(49, 67, 85, 0.7)',
          boxShadow: '0 10px 30px rgba(2, 6, 23, 0.22)',
        }}
      >
        <div className="h-full px-4 md:px-5 flex items-center justify-between">
          {/* Left side — Logo + Nav */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span
                className="text-sm font-semibold tracking-[0.02em]"
                style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
              >
                Symphony
              </span>
            </div>

            {/* Project switcher */}
            <ProjectSwitcher />

            {/* Nav tabs */}
            <nav
              className="flex items-center gap-1 rounded-full px-1 py-1"
              style={{ background: 'rgba(16, 25, 35, 0.74)', border: '1px solid var(--border)' }}
            >
              <button
                onClick={() => navigate('/tickets')}
                className="relative px-3.5 h-9 text-xs font-medium rounded-full transition-all"
                style={{
                  color: activeView === 'tickets' ? '#eff6ff' : 'var(--muted-foreground)',
                  borderBottom: '1.5px solid transparent',
                  background: activeView === 'tickets' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                  boxShadow: activeView === 'tickets' ? 'inset 0 -1px 0 rgba(96, 165, 250, 0.8), 0 0 18px rgba(59,130,246,0.14)' : 'none',
                }}
              >
                Tickets
              </button>
              <button
                onClick={() => navigate('/backlog')}
                className="relative px-3.5 h-9 text-xs font-medium rounded-full transition-all"
                style={{
                  color: activeView === 'backlog' ? '#eff6ff' : 'var(--muted-foreground)',
                  borderBottom: '1.5px solid transparent',
                  background: activeView === 'backlog' ? 'rgba(139, 92, 246, 0.14)' : 'transparent',
                  boxShadow: activeView === 'backlog' ? 'inset 0 -1px 0 rgba(167, 139, 250, 0.78), 0 0 18px rgba(139,92,246,0.14)' : 'none',
                }}
              >
                Backlog
              </button>
              <button
                onClick={() => navigate('/sprint')}
                className="relative px-3.5 h-9 text-xs font-medium rounded-full transition-all"
                style={{
                  color: activeView === 'sprint' ? '#eff6ff' : 'var(--muted-foreground)',
                  borderBottom: '1.5px solid transparent',
                  background: activeView === 'sprint' ? 'rgba(20, 184, 166, 0.14)' : 'transparent',
                  boxShadow: activeView === 'sprint' ? 'inset 0 -1px 0 rgba(45, 212, 191, 0.7), 0 0 18px rgba(20,184,166,0.14)' : 'none',
                }}
              >
                Sprint
              </button>
              <button
                onClick={() => navigate('/session')}
                className="relative px-3.5 h-9 text-xs font-medium rounded-full transition-all"
                style={{
                  color: activeView === 'session' ? '#eff6ff' : 'var(--muted-foreground)',
                  borderBottom: '1.5px solid transparent',
                  background: activeView === 'session' ? 'rgba(245, 158, 11, 0.14)' : 'transparent',
                  boxShadow: activeView === 'session' ? 'inset 0 -1px 0 rgba(251, 191, 36, 0.72), 0 0 18px rgba(245,158,11,0.12)' : 'none',
                }}
              >
                Session
              </button>
              <button
                onClick={() => navigate('/token-analytics')}
                className="relative px-3.5 h-9 text-xs font-medium rounded-full transition-all"
                style={{
                  color: activeView === 'token-analytics' ? '#eff6ff' : 'var(--muted-foreground)',
                  borderBottom: '1.5px solid transparent',
                  background: activeView === 'token-analytics' ? 'rgba(59, 130, 246, 0.14)' : 'transparent',
                  boxShadow: activeView === 'token-analytics' ? 'inset 0 -1px 0 rgba(96, 165, 250, 0.8), 0 0 18px rgba(59,130,246,0.14)' : 'none',
                }}
              >
                Token Analytics
              </button>
            </nav>
          </div>

          {/* Right side — Filters and controls */}
          <div className="flex items-center gap-2">
            {showWorkControls ? (
              <>
                <div className="flex items-center gap-1">
                  <FilterSelect
                    label="Dev"
                    value={filters.dev || ''}
                    options={devNames}
                    onChange={(value) => handleFilterChange('dev', value)}
                  />
                  <FilterSelect
                    label="Status"
                    value={filters.status || ''}
                    options={statuses}
                    displayMap={statusLabels}
                    onChange={(value) => handleFilterChange('status', value)}
                  />
                  <FilterSelect
                    label="Priority"
                    value={filters.priority || ''}
                    options={priorities}
                    displayMap={priorityLabels}
                    onChange={(value) => handleFilterChange('priority', value)}
                  />
                </div>

                <div style={{ width: 1, height: 24, background: 'var(--border)', margin: '0 2px' }} />

                <button
                  onClick={() => setShowCreate(true)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl transition-all"
                  style={{
                    background: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(139,92,246,0.22))',
                    color: '#f8fafc',
                    border: '1px solid rgba(96, 165, 250, 0.28)',
                    boxShadow: '0 10px 24px rgba(15, 23, 42, 0.32)',
                  }}
                >
                  <Plus className="w-3 h-3" />
                  New Task
                </button>

                <button
                  onClick={resetLayout}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border transition-all"
                  style={{
                    background: 'rgba(16, 25, 35, 0.72)',
                    borderColor: 'var(--border)',
                    color: 'var(--muted-foreground)',
                  }}
                >
                  <RotateCcw className="w-3 h-3" />
                  Reset
                </button>
              </>
            ) : (
              <div
                className="rounded-full border px-3 py-1.5 text-[0.68rem]"
                style={{
                  color: '#93c5fd',
                  background: 'rgba(59, 130, 246, 0.08)',
                  borderColor: 'rgba(59, 130, 246, 0.2)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                }}
              >
                Hardcoded demo data
              </div>
            )}

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="flex items-center justify-center w-8 h-8 rounded-xl border transition-all"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'rgba(16, 25, 35, 0.72)',
                borderColor: 'var(--border)',
                color: 'var(--muted-foreground)',
              }}
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Node count */}
            {showWorkControls ? (
              <span
                className="text-[0.68rem] tabular-nums px-2.5 py-1 rounded-full"
                style={{
                  color: '#cbd5e1',
                  background: 'rgba(16, 25, 35, 0.7)',
                  border: '1px solid rgba(49, 67, 85, 0.78)',
                  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
                  letterSpacing: '0.04em',
                }}
              >
                {totalNodes} nodes
              </span>
            ) : null}
          </div>
        </div>
      </header>

      {showCreate && <CreateTaskModal onClose={() => setShowCreate(false)} />}
    </>
  );
}

interface FilterSelectProps {
  label: string;
  value: string;
  options: string[];
  displayMap?: Record<string, string>;
  onChange: (value: string) => void;
}

function FilterSelect({ label, value, options, displayMap, onChange }: FilterSelectProps) {
  const displayValue = displayMap ? (displayMap[value] ?? value) : (value || 'All');
  const isActive = !!value;

  return (
    <div
      className="relative flex items-center"
      style={{
        background: isActive ? 'rgba(59, 130, 246, 0.1)' : 'rgba(16, 25, 35, 0.72)',
        border: `1px solid ${isActive ? 'rgba(96, 165, 250, 0.3)' : 'var(--border)'}`,
        borderRadius: '999px',
        padding: '0 10px',
        height: '32px',
      }}
    >
      <span
        className="text-[0.65rem] mr-1.5"
        style={{
          color: 'var(--text-subtle)',
          fontWeight: 600,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
          letterSpacing: '0.06em',
          textTransform: 'uppercase',
        }}
      >
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-transparent border-none outline-none cursor-pointer pr-1"
        style={{ color: isActive ? '#eff6ff' : '#cbd5e1', fontWeight: isActive ? 600 : 500 }}
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {displayMap ? displayMap[opt] ?? opt : opt || 'All'}
          </option>
        ))}
      </select>
    </div>
  );
}
