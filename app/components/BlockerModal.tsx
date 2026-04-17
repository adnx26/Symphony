import { useState } from 'react';
import { X } from 'lucide-react';
import { motion } from 'motion/react';
import { AppTask } from '../types';
import { getStatusColor } from '../utils/nodeColors';

interface BlockerModalProps {
  task: AppTask;
  onSave: (taskId: string, reason: string) => void;
  onResolve: (taskId: string) => void;
  onClose: () => void;
}

export function BlockerModal({ task, onSave, onResolve, onClose }: BlockerModalProps) {
  const [reason, setReason] = useState(task.blockerReason ?? '');
  const statusColor = getStatusColor(task.status);

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.4)' }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.97 }}
        transition={{ type: 'spring', damping: 28, stiffness: 220 }}
        className="w-96 shadow-xl"
        style={{
          background: '#ffffff',
          border: '1px solid #e4e4e7',
          borderRadius: '6px',
        }}
      >
        {/* Header */}
        <div
          className="p-5 flex items-start justify-between gap-3"
          style={{ borderBottom: '1px solid #e4e4e7' }}
        >
          <div className="flex-1 min-w-0">
            <p className="text-[0.65rem] font-semibold uppercase tracking-wide mb-1" style={{ color: '#a1a1aa' }}>
              Blocker
            </p>
            <h3 className="text-sm font-semibold leading-snug truncate" style={{ color: '#0f0f0f' }}>
              {task.title}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded flex-shrink-0 transition-colors"
            style={{ color: '#71717a' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-xs" style={{ color: '#71717a' }}>Current status:</span>
            <span
              className="px-2 py-0.5 text-xs font-medium"
              style={{
                background: statusColor.bg,
                color: statusColor.text,
                borderRadius: '3px',
              }}
            >
              {task.status}
            </span>
          </div>

          <div>
            <label className="block text-xs font-medium mb-1.5" style={{ color: '#71717a' }}>
              Blocker reason
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe what is blocking this task..."
              className="w-full p-3 text-xs resize-none outline-none transition-colors"
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

          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onSave(task.id, reason)}
              disabled={reason.trim() === ''}
              className="flex-1 py-1.5 text-xs font-medium transition-all disabled:opacity-40 disabled:cursor-not-allowed"
              style={{
                background: '#f0fdf4',
                border: '1px solid #bbf7d0',
                color: '#15803d',
                borderRadius: '4px',
              }}
            >
              Save Reason
            </button>
            <button
              onClick={() => onResolve(task.id)}
              className="flex-1 py-1.5 text-xs font-medium transition-all"
              style={{
                background: 'rgba(124, 58, 237, 0.08)',
                border: '1px solid rgba(124, 58, 237, 0.25)',
                color: '#7c3aed',
                borderRadius: '4px',
              }}
            >
              Mark Resolved
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
