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
  isCustom?: boolean;
  blockerReason?: string;
  // Epic/Story hierarchy
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

export interface AgentAction {
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
  agentId?: string;
  outcome?: 'applied' | 'dismissed';
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

export type AgentDispatchStatus =
  | 'idle'
  | 'dispatched'
  | 'running'
  | 'completed'
  | 'failed';

export interface AgentDispatchRequest {
  dispatchId: string;
  agentId: string;
  taskId: string;
  input: Record<string, unknown>;
  dispatchedAt: string;
}

export interface AgentDispatchResult {
  dispatchId: string;
  agentId: string;
  taskId: string;
  status: 'completed' | 'failed';
  output: Record<string, unknown>;
  completedAt: string;
  error?: string;
}

export interface AgentDispatchState {
  request: AgentDispatchRequest;
  status: AgentDispatchStatus;
  result?: AgentDispatchResult;
}

export interface SetupTask {
  title: string;
  desc: string;
  status: StatusType;
  priority: PriorityType;
  dueDate?: string;
  criteria?: string[];
  developerId?: string;
  agentId?: string;
}

export interface SetupDeveloper {
  id: string;
  name: string;
  initials: string;
  role: string;
  desc?: string;
}

export interface SetupAgent {
  id: string;
  name: string;
  type: string;
  developerId: string;
  desc?: string;
}

export interface SetupSubAgent {
  id: string;
  name: string;
  type: string;
  parentId: string;
  desc?: string;
}

export interface ProjectSetupData {
  tasks: SetupTask[];
  developers?: SetupDeveloper[];
  agents?: SetupAgent[];
  subAgents?: SetupSubAgent[];
}

export interface AppSprint {
  id: string;
  projectId: string;
  name: string;
  goal: string;
  status: 'planned' | 'active' | 'completed';
  startDate?: string;
  endDate?: string;
  capacity: number;         // story points
  createdAt?: string;
}

export interface TaskComment {
  id: string;
  taskId: string;
  projectId: string;
  author: string;           // 'user' | agent id | 'orchestrator'
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
  actor: string;            // 'user' | agent id | 'orchestrator'
  actorType: 'user' | 'agent';
  payload: Record<string, unknown>;   // {from, to} for changes
  createdAt: string;
}
