import { NodeType, StatusType, PriorityType } from '../types';

export const nodeColors = {
  task: {
    accent: '#f59e0b',
    glow: 'rgba(245, 158, 11, 0.18)',
    bg: 'rgba(245, 158, 11, 0.12)',
  },
  developer: {
    accent: '#14b8a6',
    glow: 'rgba(20, 184, 166, 0.18)',
    bg: 'rgba(20, 184, 166, 0.12)',
  },
  agent: {
    accent: '#8b5cf6',
    glow: 'rgba(139, 92, 246, 0.22)',
    bg: 'rgba(139, 92, 246, 0.12)',
  },
  'sub-agent': {
    accent: '#ef476f',
    glow: 'rgba(239, 71, 111, 0.2)',
    bg: 'rgba(239, 71, 111, 0.12)',
  },
};

export const statusColorMap = {
  todo:     { bg: 'rgba(123, 132, 148, 0.14)', text: '#9ca3af' },
  progress: { bg: 'rgba(59, 130, 246, 0.16)', text: '#60a5fa' },
  done:     { bg: 'rgba(34, 197, 94, 0.16)', text: '#4ade80' },
  blocked:  { bg: 'rgba(239, 71, 111, 0.16)', text: '#fb7185' },
};

export const priorityColorMap = {
  low:      { bg: 'rgba(123, 132, 148, 0.14)', text: '#9ca3af' },
  medium:   { bg: 'rgba(245, 158, 11, 0.14)', text: '#fbbf24' },
  high:     { bg: 'rgba(249, 115, 22, 0.16)', text: '#fb923c' },
  critical: { bg: 'rgba(239, 71, 111, 0.16)', text: '#fb7185' },
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
