import { NodeType, StatusType, PriorityType } from '../types';

export const nodeColors = {
  task: {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.3)',
    bg: 'rgba(245, 158, 11, 0.1)',
  },
  developer: {
    accent: '#1dd4ef',
    glow: 'rgba(29, 212, 239, 0.3)',
    bg: 'rgba(29, 212, 239, 0.1)',
  },
  agent: {
    accent: '#a78bfa',
    glow: 'rgba(167, 139, 250, 0.3)',
    bg: 'rgba(167, 139, 250, 0.1)',
  },
  'sub-agent': {
    accent: '#fb7185',
    glow: 'rgba(251, 113, 133, 0.3)',
    bg: 'rgba(251, 113, 133, 0.1)',
  },
};

export const statusColorMap = {
  todo: { bg: 'rgba(71, 85, 105, 0.3)', text: '#cbd5e1' },
  progress: { bg: 'rgba(6, 182, 212, 0.2)', text: '#06b6d4' },
  done: { bg: 'rgba(74, 222, 128, 0.2)', text: '#4ade80' },
  blocked: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
};

export const priorityColorMap = {
  low: { bg: 'rgba(100, 116, 139, 0.2)', text: '#cbd5e1' },
  medium: { bg: 'rgba(59, 130, 246, 0.2)', text: '#60a5fa' },
  high: { bg: 'rgba(249, 115, 22, 0.2)', text: '#fb923c' },
  critical: { bg: 'rgba(239, 68, 68, 0.2)', text: '#ef4444' },
};

export function getNodeColor(type: NodeType) {
  return nodeColors[type];
}

export function getStatusColor(status: StatusType) {
  return statusColorMap[status];
}

export function getPriorityColor(priority: PriorityType) {
  return priorityColorMap[priority];
}
