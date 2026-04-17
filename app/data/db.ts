// app/data/db.ts
import { supabase } from '../utils/supabase';
import {
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  AppEpic,
  AppStory,
  AppSprint,
  BoardPosition,
  AgentAction,
  AgentDispatchState,
  AgentDispatchRequest,
  AgentDispatchResult,
  PriorityType,
  StatusType,
  TaskComment,
  TaskActivity,
} from '../types';
import type { Project } from '../context/AppContext';

// ── Row types (Supabase snake_case columns) ───────────────────────────────────

interface TaskRow {
  project_id: string;
  id: string;
  title: string;
  description: string;
  overview: string;
  status: string;
  priority: string;
  due_date: string | null;
  developer_id: string | null;
  agent_id: string | null;
  assignee_type: string;
  agent_assigned: boolean;
  is_custom: boolean;
  criteria: string[] | null;
  blocker_reason?: string | null;
  story_id?: string | null;
  story_points?: number | null;
  labels?: string[] | null;
  estimate_hours?: number | null;
}

interface EpicRow {
  project_id: string;
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  color: string;
  start_date: string | null;
  target_date: string | null;
  created_at: string | null;
}

interface StoryRow {
  project_id: string;
  id: string;
  epic_id: string | null;
  title: string;
  description: string;
  status: string;
  priority: string;
  story_points: number;
  assignee_id: string | null;
  created_at: string | null;
}

interface DeveloperRow {
  project_id: string;
  id: string;
  name: string;
  initials: string;
  role: string;
  description: string;
  criteria: string[] | null;
  outputs: string[] | null;
}

interface AgentRow {
  project_id: string;
  id: string;
  name: string;
  type: string;
  developer_id: string;
  description: string;
  criteria: string[] | null;
  outputs: string[] | null;
}

interface SubAgentRow {
  project_id: string;
  id: string;
  name: string;
  type: string;
  parent_id: string;
  description: string;
  criteria: string[] | null;
  outputs: string[] | null;
}

// ── Mappers ───────────────────────────────────────────────────────────────────

function rowToTask(r: TaskRow): AppTask {
  return {
    id: r.id,
    title: r.title,
    desc: r.description,
    overview: r.overview,
    status: r.status as AppTask['status'],
    priority: r.priority as AppTask['priority'],
    dueDate: r.due_date ?? undefined,
    developerId: r.developer_id ?? '',
    agentId: r.agent_id ?? undefined,
    assigneeType: r.assignee_type as AppTask['assigneeType'],
    agentAssigned: r.agent_assigned,
    criteria: r.criteria ?? [],
    isCustom: r.is_custom,
    blockerReason: r.blocker_reason ?? undefined,
    storyId: r.story_id ?? undefined,
    storyPoints: r.story_points ?? undefined,
    labels: r.labels ?? [],
    estimateHours: r.estimate_hours ?? undefined,
  };
}

function rowToEpic(r: EpicRow): AppEpic {
  return {
    id: r.id,
    projectId: r.project_id,
    title: r.title,
    description: r.description,
    status: r.status as AppEpic['status'],
    priority: r.priority as PriorityType,
    color: r.color,
    startDate: r.start_date ?? undefined,
    targetDate: r.target_date ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

function rowToStory(r: StoryRow): AppStory {
  return {
    id: r.id,
    projectId: r.project_id,
    epicId: r.epic_id ?? undefined,
    title: r.title,
    description: r.description,
    status: r.status as StatusType,
    priority: r.priority as PriorityType,
    storyPoints: r.story_points,
    assigneeId: r.assignee_id ?? undefined,
    createdAt: r.created_at ?? undefined,
  };
}

function rowToDeveloper(r: DeveloperRow): AppDeveloper {
  return {
    id: r.id,
    name: r.name,
    initials: r.initials,
    role: r.role,
    desc: r.description,
    criteria: r.criteria ?? [],
    outputs: r.outputs ?? [],
  };
}

function rowToAgent(r: AgentRow): AppAgent {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    developerId: r.developer_id,
    desc: r.description,
    criteria: r.criteria ?? [],
    outputs: r.outputs ?? [],
  };
}

function rowToSubAgent(r: SubAgentRow): AppSubAgent {
  return {
    id: r.id,
    name: r.name,
    type: r.type,
    parentId: r.parent_id,
    desc: r.description,
    criteria: r.criteria ?? [],
    outputs: r.outputs ?? [],
  };
}

// ── Sprint row types ──────────────────────────────────────────────────────────

interface SprintRow {
  project_id: string;
  id: string;
  name: string;
  goal: string;
  status: string;
  start_date: string | null;
  end_date: string | null;
  capacity: number;
  created_at: string | null;
}

interface SprintTaskRow {
  sprint_id: string;
  task_id: string;
  added_by: string | null;
}

// ── Sprint mappers ────────────────────────────────────────────────────────────

function rowToSprint(r: SprintRow): AppSprint {
  return {
    id: r.id,
    projectId: r.project_id,
    name: r.name,
    goal: r.goal,
    status: r.status as AppSprint['status'],
    startDate: r.start_date ?? undefined,
    endDate: r.end_date ?? undefined,
    capacity: r.capacity,
    createdAt: r.created_at ?? undefined,
  };
}

// ── Projects ──────────────────────────────────────────────────────────────────

export async function fetchProjects(): Promise<Project[]> {
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, created_at, setup_complete')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    id: r.id,
    name: r.name,
    createdAt: r.created_at,
    setupComplete: r.setup_complete ?? false,
  }));
}

export async function createProjectInDB(name: string): Promise<Project> {
  const { data, error } = await supabase
    .from('projects')
    .insert({ name: name.trim() || 'New Project', setup_complete: false })
    .select('id, name, created_at, setup_complete')
    .single();
  if (error) throw error;
  return { id: data.id, name: data.name, createdAt: data.created_at, setupComplete: false };
}

export async function markProjectSetupComplete(id: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ setup_complete: true })
    .eq('id', id);
  if (error) throw error;
}

export async function renameProjectInDB(id: string, name: string): Promise<void> {
  const { error } = await supabase
    .from('projects')
    .update({ name: name.trim() })
    .eq('id', id);
  if (error) throw error;
}

export async function deleteProjectInDB(id: string): Promise<void> {
  const { error } = await supabase.from('projects').delete().eq('id', id);
  if (error) throw error;
}

// ── Project data (full fetch) ─────────────────────────────────────────────────

export interface ProjectData {
  tasks: AppTask[];
  developers: AppDeveloper[];
  agents: AppAgent[];
  subAgents: AppSubAgent[];
  epics: AppEpic[];
  stories: AppStory[];
  sprints: AppSprint[];
  sprintTaskIds: Record<string, string[]>;
  positions: Record<string, BoardPosition>;
  checkedCriteria: Record<string, boolean>;
}

export async function fetchProjectData(projectId: string): Promise<ProjectData> {
  const [tasksRes, devsRes, agentsRes, subAgentsRes, epicsRes, storiesRes, sprintsRes, positionsRes, criteriaRes] =
    await Promise.all([
      supabase.from('tasks').select('*').eq('project_id', projectId),
      supabase.from('developers').select('*').eq('project_id', projectId),
      supabase.from('agents').select('*').eq('project_id', projectId),
      supabase.from('sub_agents').select('*').eq('project_id', projectId),
      supabase.from('epics').select('*').eq('project_id', projectId),
      supabase.from('stories').select('*').eq('project_id', projectId),
      supabase.from('sprints').select('*').eq('project_id', projectId),
      supabase.from('board_positions').select('*').eq('project_id', projectId),
      supabase.from('checked_criteria').select('*').eq('project_id', projectId),
    ]);

  if (tasksRes.error) throw tasksRes.error;
  if (devsRes.error) throw devsRes.error;
  if (agentsRes.error) throw agentsRes.error;
  if (subAgentsRes.error) throw subAgentsRes.error;
  // Epics/stories/sprints tables may not exist yet — fail gracefully
  if (epicsRes.error) console.error('epics fetch:', epicsRes.error);
  if (storiesRes.error) console.error('stories fetch:', storiesRes.error);
  if (sprintsRes.error) console.error('sprints fetch:', sprintsRes.error);
  const epics = epicsRes.error ? [] : (epicsRes.data ?? []).map((r) => rowToEpic(r as EpicRow));
  const stories = storiesRes.error ? [] : (storiesRes.data ?? []).map((r) => rowToStory(r as StoryRow));
  const sprints = sprintsRes.error ? [] : (sprintsRes.data ?? []).map((r) => rowToSprint(r as SprintRow));
  if (positionsRes.error) throw positionsRes.error;
  if (criteriaRes.error) throw criteriaRes.error;

  const positions: Record<string, BoardPosition> = {};
  for (const r of positionsRes.data ?? []) {
    positions[r.node_id] = { x: r.x, y: r.y };
  }

  const checkedCriteria: Record<string, boolean> = {};
  for (const r of criteriaRes.data ?? []) {
    checkedCriteria[r.key] = r.checked;
  }

  // Fetch sprint tasks for all sprints in this project
  const sprintIds = sprints.map((s) => s.id);
  const sprintTaskIds: Record<string, string[]> = {};
  if (sprintIds.length > 0) {
    const { data: stData, error: stError } = await supabase
      .from('sprint_tasks')
      .select('sprint_id, task_id')
      .in('sprint_id', sprintIds);
    if (stError) {
      console.error('sprint_tasks fetch:', stError);
    } else {
      for (const r of stData ?? []) {
        const row = r as SprintTaskRow;
        if (!sprintTaskIds[row.sprint_id]) sprintTaskIds[row.sprint_id] = [];
        sprintTaskIds[row.sprint_id].push(row.task_id);
      }
    }
  }

  return {
    tasks: (tasksRes.data ?? []).map((r) => rowToTask(r as TaskRow)),
    developers: (devsRes.data ?? []).map((r) => rowToDeveloper(r as DeveloperRow)),
    agents: (agentsRes.data ?? []).map((r) => rowToAgent(r as AgentRow)),
    subAgents: (subAgentsRes.data ?? []).map((r) => rowToSubAgent(r as SubAgentRow)),
    epics,
    stories,
    sprints,
    sprintTaskIds,
    positions,
    checkedCriteria,
  };
}

// ── Tasks ─────────────────────────────────────────────────────────────────────

export async function upsertTask(
  projectId: string,
  task: AppTask,
  isCustom = false
): Promise<void> {
  const { error } = await supabase.from('tasks').upsert({
    project_id: projectId,
    id: task.id,
    title: task.title,
    description: task.desc,
    overview: task.overview ?? '',
    status: task.status,
    priority: task.priority,
    due_date: task.dueDate ?? null,
    developer_id: task.developerId || null,
    agent_id: task.agentId ?? null,
    assignee_type: task.assigneeType,
    agent_assigned: task.agentAssigned ?? false,
    is_custom: isCustom,
    criteria: task.criteria ?? [],
    blocker_reason: task.blockerReason ?? null,
    story_id: task.storyId ?? null,
    story_points: task.storyPoints ?? null,
    labels: task.labels ?? [],
    estimate_hours: task.estimateHours ?? null,
  });
  if (error) throw error;
}

export async function upsertDeveloper(
  projectId: string,
  developer: AppDeveloper
): Promise<void> {
  const { error } = await supabase.from('developers').upsert({
    project_id: projectId,
    id: developer.id,
    name: developer.name,
    initials: developer.initials,
    role: developer.role,
    description: developer.desc ?? '',
    criteria: developer.criteria ?? [],
    outputs: developer.outputs ?? [],
  });
  if (error) throw error;
}

export async function upsertAgent(
  projectId: string,
  agent: AppAgent
): Promise<void> {
  const { error } = await supabase.from('agents').upsert({
    project_id: projectId,
    id: agent.id,
    name: agent.name,
    type: agent.type,
    developer_id: agent.developerId,
    description: agent.desc ?? '',
    criteria: agent.criteria ?? [],
    outputs: agent.outputs ?? [],
  });
  if (error) throw error;
}

export async function upsertSubAgent(
  projectId: string,
  subAgent: AppSubAgent
): Promise<void> {
  const { error } = await supabase.from('sub_agents').upsert({
    project_id: projectId,
    id: subAgent.id,
    name: subAgent.name,
    type: subAgent.type,
    parent_id: subAgent.parentId,
    description: subAgent.desc ?? '',
    criteria: subAgent.criteria ?? [],
    outputs: subAgent.outputs ?? [],
  });
  if (error) throw error;
}

export async function deleteTask(projectId: string, taskId: string): Promise<void> {
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('project_id', projectId)
    .eq('id', taskId);
  if (error) throw error;
}

// ── Epics ─────────────────────────────────────────────────────────────────────

export async function fetchEpics(projectId: string): Promise<AppEpic[]> {
  const { data, error } = await supabase
    .from('epics')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToEpic(r as EpicRow));
}

export async function upsertEpic(projectId: string, epic: AppEpic): Promise<void> {
  const { error } = await supabase.from('epics').upsert({
    project_id: projectId,
    id: epic.id,
    title: epic.title,
    description: epic.description,
    status: epic.status,
    priority: epic.priority,
    color: epic.color,
    start_date: epic.startDate ?? null,
    target_date: epic.targetDate ?? null,
  });
  if (error) throw error;
}

export async function deleteEpic(projectId: string, epicId: string): Promise<void> {
  const { error } = await supabase
    .from('epics')
    .delete()
    .eq('project_id', projectId)
    .eq('id', epicId);
  if (error) throw error;
}

// ── Stories ───────────────────────────────────────────────────────────────────

export async function fetchStories(projectId: string): Promise<AppStory[]> {
  const { data, error } = await supabase
    .from('stories')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToStory(r as StoryRow));
}

export async function upsertStory(projectId: string, story: AppStory): Promise<void> {
  const { error } = await supabase.from('stories').upsert({
    project_id: projectId,
    id: story.id,
    epic_id: story.epicId ?? null,
    title: story.title,
    description: story.description,
    status: story.status,
    priority: story.priority,
    story_points: story.storyPoints,
    assignee_id: story.assigneeId ?? null,
  });
  if (error) throw error;
}

export async function deleteStory(projectId: string, storyId: string): Promise<void> {
  const { error } = await supabase
    .from('stories')
    .delete()
    .eq('project_id', projectId)
    .eq('id', storyId);
  if (error) throw error;
}

// ── Sprints ───────────────────────────────────────────────────────────────────

export async function fetchSprints(projectId: string): Promise<AppSprint[]> {
  const { data, error } = await supabase
    .from('sprints')
    .select('*')
    .eq('project_id', projectId)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((r) => rowToSprint(r as SprintRow));
}

export async function upsertSprint(projectId: string, sprint: AppSprint): Promise<void> {
  const { error } = await supabase.from('sprints').upsert({
    project_id: projectId,
    id: sprint.id,
    name: sprint.name,
    goal: sprint.goal,
    status: sprint.status,
    start_date: sprint.startDate ?? null,
    end_date: sprint.endDate ?? null,
    capacity: sprint.capacity,
  });
  if (error) throw error;
}

export async function deleteSprint(projectId: string, sprintId: string): Promise<void> {
  const { error } = await supabase
    .from('sprints')
    .delete()
    .eq('project_id', projectId)
    .eq('id', sprintId);
  if (error) throw error;
}

export async function addTaskToSprint(
  sprintId: string,
  taskId: string,
  addedBy?: string
): Promise<void> {
  const { error } = await supabase.from('sprint_tasks').upsert({
    sprint_id: sprintId,
    task_id: taskId,
    added_by: addedBy ?? null,
  });
  if (error) throw error;
}

export async function removeTaskFromSprint(
  sprintId: string,
  taskId: string
): Promise<void> {
  const { error } = await supabase
    .from('sprint_tasks')
    .delete()
    .eq('sprint_id', sprintId)
    .eq('task_id', taskId);
  if (error) throw error;
}

export async function fetchSprintTaskIds(
  projectId: string
): Promise<Record<string, string[]>> {
  // First get all sprint IDs for this project
  const { data: sprintData, error: sprintError } = await supabase
    .from('sprints')
    .select('id')
    .eq('project_id', projectId);
  if (sprintError) throw sprintError;
  const sprintIds = (sprintData ?? []).map((r) => r.id as string);
  if (sprintIds.length === 0) return {};

  const { data, error } = await supabase
    .from('sprint_tasks')
    .select('sprint_id, task_id')
    .in('sprint_id', sprintIds);
  if (error) throw error;

  const result: Record<string, string[]> = {};
  for (const r of data ?? []) {
    const row = r as SprintTaskRow;
    if (!result[row.sprint_id]) result[row.sprint_id] = [];
    result[row.sprint_id].push(row.task_id);
  }
  return result;
}

// ── Board positions ───────────────────────────────────────────────────────────

export async function upsertPositions(
  projectId: string,
  positions: Record<string, BoardPosition>
): Promise<void> {
  const rows = Object.entries(positions).map(([nodeId, pos]) => ({
    project_id: projectId,
    node_id: nodeId,
    x: pos.x,
    y: pos.y,
  }));
  if (rows.length === 0) return;
  const { error } = await supabase.from('board_positions').upsert(rows);
  if (error) throw error;
}

// ── Checked criteria ──────────────────────────────────────────────────────────

export async function upsertCheckedCriterion(
  projectId: string,
  key: string,
  checked: boolean
): Promise<void> {
  const { error } = await supabase.from('checked_criteria').upsert({
    project_id: projectId,
    key,
    checked,
  });
  if (error) throw error;
}

// ── Agent actions ─────────────────────────────────────────────────────────────

export async function insertAgentAction(
  projectId: string,
  action: AgentAction
): Promise<void> {
  const { error } = await supabase.from('agent_actions').upsert({
    id: `${action.type}-${action.timestamp}`,
    project_id: projectId,
    type: action.type,
    payload: JSON.stringify(action.payload),
    timestamp: action.timestamp,
    agent_id: action.agentId ?? null,
    outcome: action.outcome ?? null,
  });
  if (error) throw error;
}

export async function fetchAgentActions(projectId: string): Promise<AgentAction[]> {
  const { data, error } = await supabase
    .from('agent_actions')
    .select('*')
    .eq('project_id', projectId)
    .order('timestamp', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => ({
    type: r.type,
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    timestamp: r.timestamp,
    agentId: r.agent_id ?? undefined,
    outcome: (r.outcome as AgentAction['outcome']) ?? undefined,
  }));
}

export async function fetchDismissedActionKeys(projectId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('agent_actions')
    .select('type, payload')
    .eq('project_id', projectId)
    .eq('outcome', 'dismissed');
  if (error) throw error;
  const keys = new Set<string>();
  for (const r of data ?? []) {
    const payload = JSON.parse(r.payload) as Record<string, unknown>;
    const suffix = (payload.taskId ?? payload.developerId ?? payload.sprintId ?? '') as string;
    keys.add(`${r.type}-${suffix}`);
  }
  return keys;
}

// ── Agent touched ─────────────────────────────────────────────────────────────

export async function insertAgentTouched(projectId: string, taskId: string): Promise<void> {
  const { error } = await supabase.from('agent_touched').upsert({
    project_id: projectId,
    task_id: taskId,
    touched_at: new Date().toISOString(),
  });
  if (error) throw error;
}

export async function fetchAgentTouched(projectId: string): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('agent_touched')
    .select('task_id')
    .eq('project_id', projectId);
  if (error) throw error;
  return new Set((data ?? []).map((r) => r.task_id as string));
}

// ── Agent dispatches ──────────────────────────────────────────────────────────

export async function upsertAgentDispatch(
  projectId: string,
  dispatchState: AgentDispatchState
): Promise<void> {
  const { request, status, result } = dispatchState;
  const { error } = await supabase.from('agent_dispatches').upsert({
    dispatch_id: request.dispatchId,
    project_id: projectId,
    agent_id: request.agentId,
    task_id: request.taskId,
    input: JSON.stringify(request.input),
    status,
    result: result ? JSON.stringify(result) : null,
    dispatched_at: request.dispatchedAt,
    completed_at: result?.completedAt ?? null,
    error: result?.error ?? null,
  });
  if (error) throw error;
}

export async function fetchAgentDispatches(projectId: string): Promise<AgentDispatchState[]> {
  const { data, error } = await supabase
    .from('agent_dispatches')
    .select('*')
    .eq('project_id', projectId)
    .order('dispatched_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((r) => {
    const request: AgentDispatchRequest = {
      dispatchId: r.dispatch_id,
      agentId: r.agent_id,
      taskId: r.task_id,
      input: JSON.parse(r.input) as Record<string, unknown>,
      dispatchedAt: r.dispatched_at,
    };
    const result: AgentDispatchResult | undefined = r.result
      ? (JSON.parse(r.result) as AgentDispatchResult)
      : undefined;
    return {
      request,
      status: r.status as AgentDispatchState['status'],
      result,
    };
  });
}

// ── Task Comments ─────────────────────────────────────────────────────────────

interface CommentRow {
  id: string;
  task_id: string;
  project_id: string;
  author: string;
  author_type: string;
  body: string;
  created_at: string;
  updated_at: string;
}

function rowToComment(r: CommentRow): TaskComment {
  return {
    id: r.id,
    taskId: r.task_id,
    projectId: r.project_id,
    author: r.author,
    authorType: r.author_type as TaskComment['authorType'],
    body: r.body,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export async function fetchComments(projectId: string, taskId: string): Promise<TaskComment[]> {
  const { data, error } = await supabase
    .from('task_comments')
    .select('*')
    .eq('project_id', projectId)
    .eq('task_id', taskId)
    .order('created_at', { ascending: true });
  if (error) {
    console.error('fetchComments:', error);
    return [];
  }
  return (data ?? []).map((r) => rowToComment(r as CommentRow));
}

export async function insertComment(projectId: string, comment: TaskComment): Promise<void> {
  const { error } = await supabase.from('task_comments').insert({
    id: comment.id,
    task_id: comment.taskId,
    project_id: projectId,
    author: comment.author,
    author_type: comment.authorType,
    body: comment.body,
    created_at: comment.createdAt,
    updated_at: comment.updatedAt,
  });
  if (error) throw error;
}

export async function deleteComment(projectId: string, commentId: string): Promise<void> {
  const { error } = await supabase
    .from('task_comments')
    .delete()
    .eq('project_id', projectId)
    .eq('id', commentId);
  if (error) throw error;
}

// ── Task Activity ─────────────────────────────────────────────────────────────

interface ActivityRow {
  id: string;
  task_id: string;
  project_id: string;
  event_type: string;
  actor: string;
  actor_type: string;
  payload: string;
  created_at: string;
}

function rowToActivity(r: ActivityRow): TaskActivity {
  return {
    id: r.id,
    taskId: r.task_id,
    projectId: r.project_id,
    eventType: r.event_type as TaskActivity['eventType'],
    actor: r.actor,
    actorType: r.actor_type as TaskActivity['actorType'],
    payload: JSON.parse(r.payload) as Record<string, unknown>,
    createdAt: r.created_at,
  };
}

export async function fetchActivities(projectId: string, taskId: string): Promise<TaskActivity[]> {
  const { data, error } = await supabase
    .from('task_activity')
    .select('*')
    .eq('project_id', projectId)
    .eq('task_id', taskId)
    .order('created_at', { ascending: false });
  if (error) {
    console.error('fetchActivities:', error);
    return [];
  }
  return (data ?? []).map((r) => rowToActivity(r as ActivityRow));
}

export async function insertActivity(projectId: string, activity: TaskActivity): Promise<void> {
  const { error } = await supabase.from('task_activity').insert({
    id: activity.id,
    task_id: activity.taskId,
    project_id: projectId,
    event_type: activity.eventType,
    actor: activity.actor,
    actor_type: activity.actorType,
    payload: JSON.stringify(activity.payload),
    created_at: activity.createdAt,
  });
  if (error) {
    // Table may not exist yet — fail gracefully
    console.error('insertActivity:', error);
  }
}
