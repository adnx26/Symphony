export type NodeType = 'task' | 'developer';
export type StatusType = 'todo' | 'progress' | 'done' | 'blocked';
export type PriorityType = 'low' | 'medium' | 'high' | 'critical';

export interface AppTask {
  id: string;
  title: string;
  desc: string;
  status: StatusType;
  developerId: string;
  priority: PriorityType;
  dueDate?: string;
  overview?: string;
  criteria?: string[];
  isCustom?: boolean;
  blockerReason?: string;
  storyId?: string;
  storyPoints?: number;
  labels?: string[];
  estimateHours?: number;
}

export interface AppEpic {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
  priority: PriorityType;
  color: string;
  startDate?: string;
  targetDate?: string;
  createdAt?: string;
}

export interface AppStory {
  id: string;
  projectId: string;
  epicId?: string;
  title: string;
  description: string;
  status: StatusType;
  priority: PriorityType;
  storyPoints: number;
  assigneeId?: string;
  createdAt?: string;
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
  status?: 'active' | 'idle';
}

export interface FilterState {
  dev: string;
  status: string;
  priority: string;
}

export interface PanelEntry {
  mode: 'task';
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

export interface AppSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  capacity: number;
  createdAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  projectId: string;
  author: string;
  authorType: 'user' | 'agent';
  body: string;
  createdAt: string;
  updatedAt: string;
}

export interface TaskActivity {
  id: string;
  taskId: string;
  projectId: string;
  eventType: 'status_changed' | 'priority_changed' | 'assigned' | 'agent_action' | 'comment_added' | 'criteria_checked' | 'sprint_added' | 'blocker_set' | 'blocker_resolved';
  actor: string;
  actorType: 'user' | 'agent';
  payload: Record<string, unknown>;
  createdAt: string;
}

export interface ClaudeEvent {
  id: string;
  session_id: string;
  phase: 'exploring' | 'implementing' | 'running' | 'debugging' | 'waiting' | 'communicating' | 'ended';
  tool_name: string | null;
  summary: string;
  task_id: string | null;
  created_at: string;
}
