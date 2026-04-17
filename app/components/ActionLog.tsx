import { X, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { AgentAction } from '../types';
import { LABEL_MAP, getDescription } from '../agent/actionLabels';

export interface ActionLogProps {
  log: AgentAction[];
  onClear: () => void;
  onClose: () => void;
}

function formatTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function ActionLog({ log, onClear, onClose }: ActionLogProps) {
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
      <div style={{ height: 2, background: '#d1d1d6' }} />

      {/* Header */}
      <div
        className="px-5 py-4 flex items-center justify-between"
        style={{ borderBottom: '1px solid #e4e4e7' }}
      >
        <h2 className="text-sm font-semibold" style={{ color: '#0f0f0f' }}>Agent Log</h2>
        <div className="flex items-center gap-1">
          {log.length > 0 && (
            <button
              onClick={onClear}
              className="flex items-center gap-1 px-2 py-1.5 text-xs rounded transition-colors"
              style={{ color: '#71717a' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f4f4f5';
                e.currentTarget.style.color = '#3f3f46';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#71717a';
              }}
            >
              <Trash2 className="w-3.5 h-3.5" />
              Clear
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

      {/* Content */}
      <div className="p-4 space-y-2">
        {log.length === 0 ? (
          <div className="flex items-center justify-center h-32 text-xs" style={{ color: '#a1a1aa' }}>
            No actions recorded yet
          </div>
        ) : (
          log.map((action, i) => (
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

              {action.outcome === 'applied' ? (
                <span
                  className="inline-block px-2 py-0.5 text-[0.65rem] font-medium"
                  style={{
                    background: '#f0fdf4',
                    color: '#15803d',
                    borderRadius: '3px',
                  }}
                >
                  Applied
                </span>
              ) : (
                <span
                  className="inline-block px-2 py-0.5 text-[0.65rem] font-medium"
                  style={{
                    background: '#f4f4f5',
                    color: '#71717a',
                    borderRadius: '3px',
                  }}
                >
                  Dismissed
                </span>
              )}
            </div>
          ))
        )}
      </div>
    </motion.div>
  );
}
