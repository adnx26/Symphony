import { X, RefreshCw } from 'lucide-react';
import { motion } from 'framer-motion';
import { AgentAction, AppTask } from '../types';
import { LABEL_MAP, getDescription } from '../agent/actionLabels';

export interface AgentPanelProps {
  queue: AgentAction[];
  onApply: (action: AgentAction) => void;
  onDismiss: (action: AgentAction) => void;
  onClose: () => void;
  onOpenBlocker?: (taskId: string) => void;
  tasks?: AppTask[];
  onRunEngine?: () => void;
  llmEnabled?: boolean;
  onToggleLLM?: () => void;
}

const APPLY_TYPES = new Set(['ESCALATE_PRIORITY', 'SUGGEST_COMPLETE', 'DISPATCH_AGENT']);
const BLOCKER_TYPES = new Set(['FLAG_BLOCKED_CRITICAL', 'MISSING_BLOCKER_REASON']);

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function AgentPanel({ queue, onApply, onDismiss, onClose, onOpenBlocker, onRunEngine, llmEnabled, onToggleLLM }: AgentPanelProps) {
  const showApply = (action: AgentAction) => APPLY_TYPES.has(action.type);
  const showBlocker = (action: AgentAction) => BLOCKER_TYPES.has(action.type);

  return (
    <motion.div
      initial={{ x: 320 }}
      animate={{ x: 0 }}
      exit={{ x: 320 }}
      transition={{ type: 'spring', damping: 28, stiffness: 220 }}
      className="fixed right-0 top-0 bottom-0 w-80 z-50 overflow-y-auto"
      style={{
        background: '#ffffff',
        borderLeft: '1px solid #e4e4e7',
        boxShadow: '-4px 0 24px rgba(0,0,0,0.08)',
      }}
    >
      {/* Accent bar */}
      <div style={{ height: 2, background: '#7c3aed' }} />

      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #e4e4e7' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>
          Agent Suggestions
        </h2>
        <div className="flex items-center gap-1">
          <button
            onClick={() => onToggleLLM?.()}
            className="px-2 py-1 text-[0.65rem] font-medium transition-all"
            style={{
              background: llmEnabled ? 'rgba(124, 58, 237, 0.1)' : '#f4f4f5',
              color: llmEnabled ? '#7c3aed' : '#71717a',
              border: `1px solid ${llmEnabled ? 'rgba(124,58,237,0.3)' : '#e4e4e7'}`,
              borderRadius: '3px',
            }}
          >
            {llmEnabled ? 'AI On' : 'AI Off'}
          </button>
          {onRunEngine && (
            <button
              onClick={() => onRunEngine?.()}
              className="p-1.5 rounded transition-colors"
              style={{ color: '#71717a' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              title="Run engine now"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          )}
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
      </div>

      {llmEnabled && (
        <div
          className="px-5 py-2 text-[0.65rem]"
          style={{ color: '#a1a1aa', borderBottom: '1px solid #e4e4e7', background: '#fafafa' }}
        >
          AI insights use Claude API via the local proxy server.
        </div>
      )}

      {/* Content */}
      <div className="p-4 space-y-2">
        {queue.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs" style={{ color: '#a1a1aa' }}>
            No pending suggestions
          </div>
        ) : (
          queue.map((action, i) => (
            <div
              key={`${action.type}-${action.timestamp}-${i}`}
              className="p-3 space-y-2"
              style={{
                background: '#fafafa',
                border: '1px solid #e4e4e7',
                borderRadius: '4px',
              }}
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-medium" style={{ color: '#0f0f0f' }}>
                  {LABEL_MAP[action.type] ?? action.type}
                </span>
                <span className="text-[0.6rem] tabular-nums flex-shrink-0" style={{ color: '#a1a1aa' }}>
                  {formatTime(action.timestamp)}
                </span>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: '#71717a' }}>
                {getDescription(action)}
              </p>

              <div className="flex items-center gap-2 pt-1">
                {showApply(action) && (
                  <button
                    onClick={() => onApply(action)}
                    className="flex-1 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      borderRadius: '3px',
                    }}
                  >
                    Apply
                  </button>
                )}
                {showBlocker(action) && onOpenBlocker && (
                  <button
                    onClick={() => onOpenBlocker(action.payload.taskId as string)}
                    className="flex-1 py-1.5 text-xs font-medium transition-all"
                    style={{
                      background: '#f0fdf4',
                      border: '1px solid #bbf7d0',
                      color: '#15803d',
                      borderRadius: '3px',
                    }}
                  >
                    Resolve
                  </button>
                )}
                <button
                  onClick={() => onDismiss(action)}
                  className={`${showApply(action) || (showBlocker(action) && onOpenBlocker) ? 'flex-1' : 'w-full'} py-1.5 text-xs transition-all`}
                  style={{
                    background: '#ffffff',
                    border: '1px solid #e4e4e7',
                    color: '#71717a',
                    borderRadius: '3px',
                  }}
                >
                  Dismiss
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
