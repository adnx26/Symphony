import { useNavigate, useLocation } from 'react-router';
import { RotateCcw } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { DEVELOPERS, AGENTS } from '../data/appData';
import { FilterState } from '../types';

export function Header() {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView = location.pathname === '/tickets' ? 'tickets' : 'board';
  const { filters, setFilters, visible, resetLayout } = useApp();

  const devNames = ['', ...new Set(DEVELOPERS.map((d) => d.name))];
  const agentTypes = ['', ...new Set(AGENTS.map((a) => a.type))];
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

  const totalNodes =
    visible.tasks.length +
    visible.devs.length +
    visible.agents.length +
    visible.subAgents.length;

  return (
    <header
      className="sticky top-0 z-50 h-16 border-b border-white/5"
      style={{
        background: 'rgba(11, 18, 33, 0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
      }}
    >
      <div className="h-full px-6 flex items-center justify-between">
        {/* Left side - Logo */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col leading-none">
            <span className="text-[0.6rem] uppercase tracking-[0.2em] text-slate-400 font-medium">
              CONTROL DECK
            </span>
            <h1
              className="text-2xl tracking-[0.15em] text-slate-100 mt-0.5"
              style={{ fontFamily: 'Syne, sans-serif' }}
            >
              SYMPHONY
            </h1>
          </div>

          {/* Nav switcher */}
          <div
            className="flex items-center gap-1 p-1 rounded-full border border-white/10"
            style={{
              background: 'rgba(15, 23, 42, 0.5)',
            }}
          >
            <button
              onClick={() => navigate('/')}
              className={`
                px-4 py-1.5 rounded-full text-sm transition-all duration-200 relative group
                ${
                  activeView === 'board'
                    ? 'bg-slate-800/80 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
              title="⌘1 / Ctrl+1"
            >
              Board
              {activeView === 'board' && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 pulse-glow" />
              )}
            </button>
            <button
              onClick={() => navigate('/tickets')}
              className={`
                px-4 py-1.5 rounded-full text-sm transition-all duration-200 relative group
                ${
                  activeView === 'tickets'
                    ? 'bg-slate-800/80 text-white shadow-[0_0_12px_rgba(59,130,246,0.3)]'
                    : 'text-slate-400 hover:text-slate-200'
                }
              `}
              title="⌘2 / Ctrl+2"
            >
              Tickets
              {activeView === 'tickets' && (
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500/20 to-cyan-500/20 pulse-glow" />
              )}
            </button>
          </div>
        </div>

        {/* Right side - Filters and controls */}
        <div className="flex items-center gap-3">
          {/* Filter dropdowns */}
          <div className="flex items-center gap-2">
            <FilterPill
              label="DEV"
              value={filters.dev || 'All'}
              options={devNames}
              onChange={(value) => handleFilterChange('dev', value)}
            />
            <FilterPill
              label="TYPE"
              value={filters.type || 'All Nodes'}
              options={['', ...agentTypes.slice(1)]}
              displayMap={{
                '': 'All Nodes',
              }}
              onChange={(value) => handleFilterChange('type', value)}
            />
            <FilterPill
              label="STATUS"
              value={statusLabels[filters.status] || 'All'}
              options={statuses}
              displayMap={statusLabels}
              onChange={(value) => handleFilterChange('status', value)}
            />
            <FilterPill
              label="PRIORITY"
              value={priorityLabels[filters.priority] || 'All'}
              options={priorities}
              displayMap={priorityLabels}
              onChange={(value) => handleFilterChange('priority', value)}
            />
          </div>

          {/* Reset button */}
          <button
            onClick={resetLayout}
            className="px-3 py-1.5 rounded-full text-sm text-slate-300 hover:text-white hover:bg-white/5 transition-all flex items-center gap-2 border border-white/10"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reset Layout
          </button>

          {/* Node count badge */}
          <div
            className="px-3 py-1.5 rounded-full text-xs tracking-wider border border-cyan-500/30"
            style={{
              background: 'rgba(6, 182, 212, 0.1)',
              color: '#67e8f9',
            }}
          >
            <span className="opacity-60">NODES:</span> <span className="font-semibold">{totalNodes}</span>
          </div>
        </div>
      </div>
    </header>
  );
}

interface FilterPillProps {
  label: string;
  value: string;
  options: string[];
  displayMap?: Record<string, string>;
  onChange: (value: string) => void;
}

function FilterPill({
  label,
  value,
  options,
  displayMap,
  onChange,
}: FilterPillProps) {
  return (
    <div
      className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 text-xs appearance-none"
      style={{
        background: 'rgba(15, 23, 42, 0.5)',
      }}
    >
      <span className="text-slate-500 uppercase tracking-wider">{label}</span>
      <select
        value={Object.keys(displayMap || {}).find((k) => (displayMap || {})[k] === value) || value}
        onChange={(e) => onChange(e.target.value)}
        className="bg-transparent text-slate-200 border-none outline-none cursor-pointer appearance-none"
      >
        {options.map((opt) => (
          <option key={opt} value={opt}>
            {displayMap ? displayMap[opt] || opt : opt || 'All'}
          </option>
        ))}
      </select>
    </div>
  );
}