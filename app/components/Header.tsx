import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { RotateCcw, Plus, Bot, History, Moon, Sun } from 'lucide-react';
import { AnimatePresence } from 'framer-motion';
import { useApp } from '../context/AppContext';
import { AppTask, FilterState } from '../types';
import { CreateTaskModal } from './CreateTaskModal';
import { ProjectSwitcher } from './ProjectSwitcher';
import { AgentPanel } from './AgentPanel';
import { ActionLog } from './ActionLog';
import { useOrchestrationAgent } from '../agent/useOrchestrationAgent';
import { useTheme } from '../context/ThemeContext';

interface HeaderProps {
  agentPanelOpen: boolean;
  setAgentPanelOpen: (open: boolean) => void;
  onOpenBlocker?: (taskId: string) => void;
  allTasks?: AppTask[];
}

export function Header({ agentPanelOpen, setAgentPanelOpen, onOpenBlocker, allTasks }: HeaderProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const activeView = location.pathname === '/tickets' ? 'tickets' : location.pathname === '/backlog' ? 'backlog' : location.pathname === '/sprint' ? 'sprint' : 'board';
  const { filters, setFilters, visible, resetLayout, developers, agents } = useApp();
  const { dark, toggle: toggleDark } = useTheme();
  const [showCreate, setShowCreate] = useState(false);
  const [logPanelOpen, setLogPanelOpen] = useState(false);
  const { queue, applyAction, dismiss, log, clearLog, runNow, llmEnabled, setLLMEnabled } = useOrchestrationAgent();

  const devNames = ['', ...new Set(developers.map((d) => d.name))];
  const agentTypes = ['', ...new Set(agents.map((a) => a.type))];
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

            {/* Nav tabs — Linear style: no pill, just underline on active */}
            <nav className="flex items-center gap-0">
              <button
                onClick={() => navigate('/')}
                className="relative px-3 h-12 text-xs font-medium transition-colors"
                style={{
                  color: activeView === 'board' ? '#0f0f0f' : '#71717a',
                  borderBottom: activeView === 'board' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                }}
                title="⌘1 / Ctrl+1"
              >
                Board
              </button>
              <button
                onClick={() => navigate('/tickets')}
                className="relative px-3 h-12 text-xs font-medium transition-colors"
                style={{
                  color: activeView === 'tickets' ? '#0f0f0f' : '#71717a',
                  borderBottom: activeView === 'tickets' ? '1.5px solid #0f0f0f' : '1.5px solid transparent',
                }}
                title="⌘2 / Ctrl+2"
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
                label="Type"
                value={filters.type || ''}
                options={['', ...agentTypes.slice(1)]}
                displayMap={{ '': 'All' }}
                onChange={(value) => handleFilterChange('type', value)}
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

            {/* New Task button — primary action */}
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

            {/* Agent panel button */}
            <button
              onClick={() => {
                setAgentPanelOpen(!agentPanelOpen);
                setLogPanelOpen(false);
              }}
              className="relative flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded transition-colors border"
              style={{
                background: agentPanelOpen ? '#f4f4f5' : 'transparent',
                borderColor: '#e4e4e7',
                color: '#3f3f46',
                borderRadius: '4px',
              }}
            >
              <Bot className="w-3.5 h-3.5" />
              {queue.length > 0 && (
                <span
                  className="absolute -top-1.5 -right-1.5 min-w-[1rem] h-4 px-1 rounded text-[0.6rem] font-semibold flex items-center justify-center"
                  style={{ background: '#7c3aed', color: '#fff', borderRadius: '3px' }}
                >
                  {queue.length}
                </span>
              )}
            </button>

            {/* Action log button */}
            <button
              onClick={() => {
                setLogPanelOpen((prev) => !prev);
                setAgentPanelOpen(false);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded border transition-colors"
              style={{
                background: logPanelOpen ? '#f4f4f5' : 'transparent',
                borderColor: '#e4e4e7',
                color: '#3f3f46',
                borderRadius: '4px',
              }}
            >
              <History className="w-3.5 h-3.5" />
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

      <AnimatePresence>
        {agentPanelOpen && (
          <AgentPanel
            queue={queue}
            onApply={applyAction}
            onDismiss={dismiss}
            onClose={() => setAgentPanelOpen(false)}
            onOpenBlocker={onOpenBlocker}
            tasks={allTasks}
            onRunEngine={runNow}
            llmEnabled={llmEnabled}
            onToggleLLM={() => setLLMEnabled(prev => !prev)}
          />
        )}
        {logPanelOpen && (
          <ActionLog
            log={log}
            onClear={clearLog}
            onClose={() => setLogPanelOpen(false)}
          />
        )}
      </AnimatePresence>
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
