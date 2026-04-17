import { NodeType, StatusType, PriorityType } from '../types';

// Accent colors chosen to read well on white backgrounds
export const nodeColors = {
  task: {
    accent: '#d97706',       // amber-600
    glow: 'rgba(217, 119, 6, 0.15)',
    bg: 'rgba(217, 119, 6, 0.08)',
  },
  developer: {
    accent: '#0284c7',       // sky-600
    glow: 'rgba(2, 132, 199, 0.15)',
    bg: 'rgba(2, 132, 199, 0.08)',
  },
  agent: {
    accent: '#7c3aed',       // violet-600
    glow: 'rgba(124, 58, 237, 0.15)',
    bg: 'rgba(124, 58, 237, 0.08)',
  },
  'sub-agent': {
    accent: '#db2777',       // pink-600
    glow: 'rgba(219, 39, 119, 0.15)',
    bg: 'rgba(219, 39, 119, 0.08)',
  },
};

// Status colors — solid, small badges on white backgrounds
export const statusColorMap = {
  todo:     { bg: '#f4f4f5', text: '#71717a' },          // neutral gray
  progress: { bg: '#eff6ff', text: '#1d4ed8' },          // blue tint
  done:     { bg: '#f0fdf4', text: '#15803d' },          // green tint
  blocked:  { bg: '#fff1f2', text: '#be123c' },          // rose tint
};

// Priority colors — dot/badge on white
export const priorityColorMap = {
  low:      { bg: '#f4f4f5', text: '#71717a' },
  medium:   { bg: '#fefce8', text: '#a16207' },
  high:     { bg: '#fff7ed', text: '#c2410c' },
  critical: { bg: '#fff1f2', text: '#be123c' },
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
