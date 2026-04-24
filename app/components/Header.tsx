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

  return (
    <>
      <header
        className="sticky top-0 z-50 h-12 border-b"
        style={{
          background: 'var(--background)',
          borderColor: 'var(--border)',
        }}
      >
        <div className="h-full px-4 flex items-center justify-between">
          {/* Left side — Logo + Nav */}
          <div className="flex items-center gap-5">
            <div className="flex items-center gap-1.5">
              <span
                className="text-sm font-semibold tracking-tight"
                style={{ color: 'var(--foreground)', fontFamily: 'Inter, sans-serif' }}
              >
                Symphony
              </span>
            </div>

            {/* Project switcher */}
            <ProjectSwitcher />

            {/* Nav tabs */}
            <nav className="flex items-center gap-0">
              <button
                onClick={() => navigate('/tickets')}
                className="relative px-3 h-12 text-xs font-medium transition-colors"
                style={{
                  color: activeView === 'tickets' ? '#0f0f0f' : '#71717a',
                  borderBottom: activeView === 'tickets' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                }}
              >
                Tickets
              </button>
              <button
                onClick={() => navigate('/backlog')}
                className="relative px-3 h-12 text-xs font-medium transition-colors"
                style={{
                  color: activeView === 'backlog' ? '#0f0f0f' : '#71717a',
                  borderBottom: activeView === 'backlog' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                }}
              >
                Backlog
              </button>
              <button
                onClick={() => navigate('/sprint')}
                className="relative px-3 h-12 text-xs font-medium transition-colors"
                style={{
                  color: activeView === 'sprint' ? '#0f0f0f' : '#71717a',
                  borderBottom: activeView === 'sprint' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                }}
              >
                Sprint
              </button>
              <button
                onClick={() => navigate('/session')}
                className="relative px-3 h-12 text-xs font-medium transition-colors"
                style={{
                  color: activeView === 'session' ? '#0f0f0f' : '#71717a',
                  borderBottom: activeView === 'session' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                }}
              >
                Session
              </button>
            </nav>
          </div>

          {/* Right side — Filters and controls */}
          <div className="flex items-center gap-1.5">
            {/* Filter dropdowns */}
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

            {/* Divider */}
            <div style={{ width: 1, height: 20, background: 'var(--border)', margin: '0 4px' }} />

            {/* New Task button */}
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded transition-colors"
              style={{
                background: '#0f0f0f',
                color: '#ffffff',
                borderRadius: '4px',
              }}
            >
              <Plus className="w-3 h-3" />
              New Task
            </button>

            {/* Reset layout */}
            <button
              onClick={resetLayout}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors"
              style={{
                background: 'transparent',
                borderColor: '#e4e4e7',
                color: '#3f3f46',
                borderRadius: '4px',
              }}
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={toggleDark}
              className="flex items-center justify-center w-7 h-7 rounded border transition-colors"
              title={dark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'transparent',
                borderColor: 'var(--border)',
                color: 'var(--muted-foreground)',
              }}
            >
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>

            {/* Node count */}
            <span className="text-xs tabular-nums" style={{ color: '#a1a1aa' }}>
              {totalNodes} nodes
            </span>
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
        background: isActive ? '#f4f4f5' : 'transparent',
        border: `1px solid ${isActive ? '#d1d1d6' : '#e4e4e7'}`,
        borderRadius: '4px',
        padding: '0 8px',
        height: '28px',
      }}
    >
      <span className="text-xs mr-1" style={{ color: '#a1a1aa', fontWeight: 500 }}>
        {label}:
      </span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs bg-transparent border-none outline-none cursor-pointer pr-1"
        style={{ color: isActive ? '#0f0f0f' : '#3f3f46', fontWeight: isActive ? 500 : 400 }}
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
