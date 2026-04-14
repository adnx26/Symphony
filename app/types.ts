export type NodeType = 'task' | 'developer' | 'agent' | 'sub-agent';
export type StatusType = 'todo' | 'progress' | 'done' | 'blocked';
export type PriorityType = 'low' | 'medium' | 'high' | 'critical';

export interface AppTask {
  id: string;
  title: string;
  desc: string;
  status: StatusType;
  developerId: string;
  agentId?: string;
  assigneeType: 'dev' | 'agent';
  agentAssigned?: boolean;
  priority: PriorityType;
  dueDate?: string;
  overview?: string;
  criteria?: string[];
}

export interface AppDeveloper {
  id: string;
  name: string;
  initials: string;
  role: string;
  desc?: string;
  criteria?: string[];
  outputs?: string[];
}

export interface AppAgent {
  id: string;
  name: string;
  type: string;
  developerId: string;
  desc?: string;
  criteria?: string[];
  outputs?: string[];
}

export interface AppSubAgent {
  id: string;
  name: string;
  type: string;
  parentId: string;
  desc?: string;
  criteria?: string[];
  outputs?: string[];
}

export interface FilterState {
  dev: string;
  type: string;
  status: string;
  priority: string;
}

export interface PanelEntry {
  mode: 'task' | 'agent';
  id: string;
}

export interface BoardPosition {
  x: number;
  y: number;
}

export interface Edge {
  from: string;
  to: string;
  color: string;
  taskId?: string;
}

export interface VisibleNodes {
  tasks: AppTask[];
  devs: AppDeveloper[];
  agents: AppAgent[];
  subAgents: AppSubAgent[];
  edges: Edge[];
  taskColor: Record<string, string>;
}

export interface TreeNode {
  id: string;
  label: string;
  type: NodeType;
  level: number;
  children?: TreeNode[];
}
