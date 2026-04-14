import { X, ChevronLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useApp } from '../context/AppContext';
import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '../data/appData';
import { getNodeColor, getStatusColor, getPriorityColor } from '../utils/nodeColors';

export function DetailPanel() {
  const {
    panelStack,
    closePanel,
    panelBack,
    checkedCriteria,
    toggleCriterion,
    drillPanel,
  } = useApp();

  if (panelStack.length === 0) return null;

  const entry = panelStack[panelStack.length - 1];

  if (entry.mode === 'task') {
    const task = TASKS.find((t) => t.id === entry.id);
    if (!task) return null;

    const color = getNodeColor('task');
    const statusCol = getStatusColor(task.status);
    const dev = DEVELOPERS.find((d) => d.id === task.developerId);
    const agent = AGENTS.find((a) => a.id === task.agentId);

    const statusLabel =
      task.status === 'progress'
        ? 'In Progress'
        : task.status.charAt(0).toUpperCase() + task.status.slice(1);

    return (
      <motion.div
        initial={{ x: 380 }}
        animate={{ x: 0 }}
        exit={{ x: 380 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-[380px] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
        style={{
          background: 'rgba(11, 18, 33, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color.accent }} />

        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-start justify-between mb-3">
            <div
              className="px-2.5 py-1 rounded-full text-[0.6rem] uppercase tracking-wider border"
              style={{
                backgroundColor: `${color.accent}20`,
                color: color.accent,
                borderColor: color.accent,
              }}
            >
              Task
            </div>
            <button
              onClick={closePanel}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">{task.title}</h2>
          <p className="text-sm text-slate-400">{task.desc}</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overview */}
          {task.overview && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">Overview</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{task.overview}</p>
            </div>
          )}

          {/* Status & Priority */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Status</p>
              <span
                className="inline-block px-2.5 py-1 rounded text-xs font-medium"
                style={{
                  backgroundColor: statusCol?.bg,
                  color: statusCol?.text,
                }}
              >
                {statusLabel}
              </span>
            </div>
            {task.dueDate && (
              <div>
                <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Due Date</p>
                <p className="text-xs text-slate-300">
                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
            )}
          </div>

          {/* Team section */}
          {(dev || agent) && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Team</h3>
              <div className="space-y-2">
                {dev && (
                  <div className="p-3 rounded-lg bg-slate-800/30 border border-white/5">
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">
                      Developer
                    </p>
                    <p className="text-sm font-medium text-slate-200">{dev.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{dev.role}</p>
                  </div>
                )}
                {agent && (
                  <button
                    onClick={() => drillPanel({ mode: 'agent', id: agent.id })}
                    className="w-full p-3 rounded-lg bg-slate-800/30 border border-white/5 hover:border-white/10 transition-all text-left"
                  >
                    <p className="text-xs text-slate-500 mb-1 uppercase tracking-wider">Agent</p>
                    <p className="text-sm font-medium text-slate-200">{agent.name}</p>
                    <p className="text-xs text-slate-400 mt-1">{agent.type}</p>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Criteria checklist */}
          {task.criteria && task.criteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Acceptance Criteria</h3>
              <div className="space-y-2">
                {task.criteria.map((criterion, i) => {
                  const key = `${task.id}:${i}`;
                  const checked = checkedCriteria[key] || false;
                  return (
                    <label key={i} className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCriterion(key)}
                        className="mt-1 w-4 h-4 rounded accent-amber-400"
                      />
                      <span
                        className={`text-xs leading-relaxed ${
                          checked
                            ? 'text-slate-500 line-through'
                            : 'text-slate-300 group-hover:text-slate-200'
                        }`}
                      >
                        {criterion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  } else if (entry.mode === 'agent') {
    // Find the node (developer, agent, or sub-agent)
    const dev = DEVELOPERS.find((d) => d.id === entry.id);
    const agent = AGENTS.find((a) => a.id === entry.id);
    const subAgent = SUB_AGENTS.find((sa) => sa.id === entry.id);

    const node = dev || agent || subAgent;
    if (!node) return null;

    let nodeType: 'developer' | 'agent' | 'sub-agent' = 'agent';
    let nodeTypeLabel = 'Agent';
    if (dev) {
      nodeType = 'developer';
      nodeTypeLabel = 'Developer';
    } else if (subAgent) {
      nodeType = 'sub-agent';
      nodeTypeLabel = 'Sub-Agent';
    }

    const color = getNodeColor(nodeType);
    const isAgentNode = agent || subAgent;

    return (
      <motion.div
        initial={{ x: 380 }}
        animate={{ x: 0 }}
        exit={{ x: 380 }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-[380px] border-l border-white/10 shadow-2xl z-50 overflow-y-auto"
        style={{
          background: 'rgba(11, 18, 33, 0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderTopLeftRadius: '20px',
          borderBottomLeftRadius: '20px',
          boxShadow: '-8px 0 32px rgba(0, 0, 0, 0.5)',
        }}
      >
        {/* Accent bar */}
        <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color.accent }} />

        {/* Header */}
        <div className="p-6 border-b border-white/5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              {panelStack.length > 1 && (
                <button
                  onClick={panelBack}
                  className="p-1 hover:bg-white/5 rounded transition-all text-slate-400 hover:text-white"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <div
                className="px-2.5 py-1 rounded-full text-[0.6rem] uppercase tracking-wider border"
                style={{
                  backgroundColor: `${color.accent}20`,
                  color: color.accent,
                  borderColor: color.accent,
                }}
              >
                {nodeTypeLabel}
              </div>
            </div>
            <button
              onClick={closePanel}
              className="p-1.5 hover:bg-white/5 rounded-lg transition-all text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <h2 className="text-xl font-semibold text-slate-100 mb-2">{node.name}</h2>
          {isAgentNode && (
            <p className="text-sm text-slate-400">
              {agent ? agent.type : subAgent?.type}
            </p>
          )}
          {dev && <p className="text-sm text-slate-400">{dev.role}</p>}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Description */}
          {node.desc && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-2">About</h3>
              <p className="text-xs text-slate-400 leading-relaxed">{node.desc}</p>
            </div>
          )}

          {/* Outputs */}
          {node.outputs && node.outputs.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Outputs</h3>
              <ul className="space-y-2">
                {node.outputs.map((output, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs text-slate-300">
                    <div
                      className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: color.accent }}
                    />
                    {output}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Criteria checklist */}
          {node.criteria && node.criteria.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-slate-200 mb-3">
                {dev ? 'Responsibilities' : 'Success Criteria'}
              </h3>
              <div className="space-y-2">
                {node.criteria.map((criterion, i) => {
                  const key = `${node.id}:${i}`;
                  const checked = checkedCriteria[key] || false;
                  return (
                    <label key={i} className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggleCriterion(key)}
                        className="mt-1 w-4 h-4 rounded accent-amber-400"
                      />
                      <span
                        className={`text-xs leading-relaxed ${
                          checked
                            ? 'text-slate-500 line-through'
                            : 'text-slate-300 group-hover:text-slate-200'
                        }`}
                      >
                        {criterion}
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    );
  }

  return null;
}
