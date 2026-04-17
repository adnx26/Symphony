// app/context/AppContext.tsx
import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
  useRef,
} from 'react';
import {
  FilterState,
  PanelEntry,
  BoardPosition,
  VisibleNodes,
  AppTask,
  AppDeveloper,
  AppAgent,
  AppSubAgent,
  AppEpic,
  AppStory,
  AppSprint,
  StatusType,
  PriorityType,
  AgentDispatchState,
  AgentDispatchRequest,
  AgentAction,
  ProjectSetupData,
  TaskActivity,
} from '../types';
import { computeVisibleNodes, computeDefaultPositions } from '../data/appData';
import {
  updateTaskStatus as _updateTaskStatus,
  assignTaskToDeveloper as _assignTaskToDeveloper,
  assignTaskToAgent as _assignTaskToAgent,
  updateTaskPriority as _updateTaskPriority,
  updateTaskDueDate as _updateTaskDueDate,
  reassignAgent as _reassignAgent,
  setSubAgentStatus as _setSubAgentStatus,
  getBlockedTasks as _getBlockedTasks,
  getOverdueTasks as _getOverdueTasks,
  getDeveloperWorkload as _getDeveloperWorkload,
  getTaskChain as _getTaskChain,
  getCriteriaCompletion as _getCriteriaCompletion,
} from '../agent/agentActions';
import {
  fetchProjects,
  fetchProjectData,
  createProjectInDB,
  renameProjectInDB,
  deleteProjectInDB,
  upsertTask,
  deleteTask as deleteTaskInDB,
  upsertPositions,
  upsertCheckedCriterion,
  fetchAgentTouched,
  fetchAgentActions,
  fetchDismissedActionKeys,
  fetchAgentDispatches,
  insertAgentTouched,
  upsertAgentDispatch,
  upsertEpic,
  deleteEpic as deleteEpicInDB,
  upsertStory,
  deleteStory as deleteStoryInDB,
  upsertSprint,
  deleteSprint as deleteSprintInDB,
  addTaskToSprint as addTaskToSprintInDB,
  removeTaskFromSprint as removeTaskFromSprintInDB,
  insertActivity,
  upsertDeveloper,
  upsertAgent,
  upsertSubAgent,
  markProjectSetupComplete,
} from '../data/db';

// ── Project type ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  createdAt: string;
  setupComplete?: boolean;
}

// ── Context type ──────────────────────────────────────────────────────────────

interface AppContextType {
  loading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  visible: VisibleNodes;
  allTasks: AppTask[];
  developers: AppDeveloper[];
  agents: AppAgent[];
  subAgents: AppSubAgent[];
  epics: AppEpic[];
  stories: AppStory[];
  addEpic: (epic: AppEpic) => void;
  updateEpic: (epic: AppEpic) => void;
  deleteEpic: (id: string) => void;
  addStory: (story: AppStory) => void;
  updateStory: (story: AppStory) => void;
  deleteStory: (id: string) => void;
  sprints: AppSprint[];
  activeSprint: AppSprint | undefined;
  sprintTaskIds: Record<string, string[]>;
  addSprint: (sprint: AppSprint) => void;
  updateSprint: (sprint: AppSprint) => void;
  deleteSprint: (id: string) => void;
  addTaskToSprint: (sprintId: string, taskId: string) => void;
  removeTaskFromSprint: (sprintId: string, taskId: string) => void;
  getSprintTasks: (sprintId: string) => AppTask[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  panelStack: PanelEntry[];
  openPanel: (e: PanelEntry) => void;
  closePanel: () => void;
  drillPanel: (e: PanelEntry) => void;
  panelBack: () => void;
  checkedCriteria: Record<string, boolean>;
  toggleCriterion: (key: string) => void;
  positions: Record<string, BoardPosition>;
  setPositions: (
    p:
      | Record<string, BoardPosition>
      | ((prev: Record<string, BoardPosition>) => Record<string, BoardPosition>)
  ) => void;
  resetLayout: () => void;
  panTarget: string | null;
  setPanTarget: (id: string | null) => void;
  addTask: (task: AppTask) => void;
  updateTask: (task: AppTask) => void;
  deleteTask: (id: string) => void;
  projects: Project[];
  activeProjectId: string;
  activeProject: Project | undefined;
  createProject: (name: string) => Promise<void>;
  switchProject: (id: string) => Promise<void>;
  renameProject: (id: string, name: string) => void;
  deleteProject: (id: string) => Promise<void>;
  dbError: string | null;
  injectSetupData: (data: ProjectSetupData) => Promise<void>;
  setupComplete: boolean;
  setSetupComplete: (v: boolean) => void;

  // ── Orchestration agent API ─────────────────────────────────────────────────
  updateTaskStatus: (taskId: string, status: StatusType, blockerReason?: string) => void;
  assignTaskToDeveloper: (taskId: string, developerId: string) => void;
  assignTaskToAgent: (taskId: string, agentId: string) => void;
  updateTaskPriority: (taskId: string, priority: PriorityType) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => void;
  reassignAgent: (agentId: string, newDeveloperId: string) => void;
  setSubAgentStatus: (subAgentId: string, status: 'active' | 'idle') => void;
  getBlockedTasks: () => AppTask[];
  getOverdueTasks: () => AppTask[];
  getDeveloperWorkload: (developerId: string) => { total: number; byStatus: Record<StatusType, number> };
  getTaskChain: (taskId: string) => {
    task: AppTask | undefined;
    developer: AppDeveloper | undefined;
    agent: AppAgent | undefined;
    subAgents: AppSubAgent[];
  };
  getCriteriaCompletion: (taskId: string) => { checked: number; total: number; percent: number };
  agentTouchedIds: Set<string>;
  markAgentTouched: (taskId: string) => void;

  // ── Agent dispatch ──────────────────────────────────────────────────────────
  dispatches: Record<string, AgentDispatchState>;
  dispatch: (agentId: string, taskId: string, input?: Record<string, unknown>) => string;
  updateDispatch: (dispatchId: string, update: Partial<AgentDispatchState>) => void;
  clearDispatch: (dispatchId: string) => void;
  getTaskDispatches: (taskId: string) => AgentDispatchState[];

  // ── Agent persistence ───────────────────────────────────────────────────────
  persistedAgentActions: AgentAction[];
  dismissedActionKeys: Set<string>;

  // ── Activity ────────────────────────────────────────────────────────────────
  emitActivity: (activity: Omit<TaskActivity, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Provider ──────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);

  // ── Project state ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string>('');
  const projectIdRef = useRef('');

  // ── Board data ─────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [developers, setDevelopers] = useState<AppDeveloper[]>([]);
  const [agents, setAgents] = useState<AppAgent[]>([]);
  const [subAgents, setSubAgents] = useState<AppSubAgent[]>([]);
  const [epics, setEpics] = useState<AppEpic[]>([]);
  const [stories, setStories] = useState<AppStory[]>([]);
  const [sprints, setSprints] = useState<AppSprint[]>([]);
  const [sprintTaskIds, setSprintTaskIds] = useState<Record<string, string[]>>({});
  const [positions, setPositionsState] = useState<Record<string, BoardPosition>>({});
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  // ── UI state ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    dev: '',
    type: '',
    status: '',
    priority: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelStack, setPanelStack] = useState<PanelEntry[]>([]);
  const [panTarget, setPanTarget] = useState<string | null>(null);
  const [agentTouchedIds, setAgentTouchedIds] = useState<Set<string>>(new Set());
  const [dispatches, setDispatches] = useState<Record<string, AgentDispatchState>>({});
  const [persistedAgentActions, setPersistedAgentActions] = useState<AgentAction[]>([]);
  const [dismissedActionKeys, setDismissedActionKeys] = useState<Set<string>>(new Set());
  const [setupComplete, setSetupComplete] = useState(false);

  // Debounce ref for position saves
  const posDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allTasks = tasks;

  const visible = useMemo(
    () => computeVisibleNodes(filters, allTasks, developers, agents, subAgents),
    [filters, allTasks, developers, agents, subAgents]
  );

  // ── Helper: load agent persistence for a project ──────────────────────────
  const loadAgentPersistence = useCallback(async (projectId: string) => {
    // Tables may not exist yet — fail gracefully so the app still loads
    const [touched, actions, dismissed, rawDispatches] = await Promise.all([
      fetchAgentTouched(projectId).catch(() => new Set<string>()),
      fetchAgentActions(projectId).catch(() => [] as AgentAction[]),
      fetchDismissedActionKeys(projectId).catch(() => new Set<string>()),
      fetchAgentDispatches(projectId).catch(() => [] as AgentDispatchState[]),
    ]);
    setAgentTouchedIds(touched);
    setPersistedAgentActions(actions);
    setDismissedActionKeys(dismissed);

    // Reconstruct dispatch record; mark interrupted in-flight dispatches as failed
    const dispatchRecord: Record<string, AgentDispatchState> = {};
    for (const d of rawDispatches) {
      if (d.status === 'dispatched' || d.status === 'running') {
        dispatchRecord[d.request.dispatchId] = {
          ...d,
          status: 'failed',
          result: d.result ?? {
            dispatchId: d.request.dispatchId,
            agentId: d.request.agentId,
            taskId: d.request.taskId,
            status: 'failed',
            output: {},
            completedAt: new Date().toISOString(),
            error: 'Interrupted — page was closed during dispatch',
          },
        };
      } else {
        dispatchRecord[d.request.dispatchId] = d;
      }
    }
    setDispatches(dispatchRecord);
  }, []);

  // ── Helper: hydrate state from ProjectData ─────────────────────────────────
  const hydrateProject = useCallback(
    (data: Awaited<ReturnType<typeof fetchProjectData>>) => {
      setTasks(data.tasks);
      setDevelopers(data.developers);
      setAgents(data.agents);
      setSubAgents(data.subAgents);
      setEpics(data.epics);
      setStories(data.stories);
      setSprints(data.sprints);
      setSprintTaskIds(data.sprintTaskIds);
      setCheckedCriteria(data.checkedCriteria);

      if (Object.keys(data.positions).length === 0) {
        const defaultVisible = computeVisibleNodes(
          { dev: '', type: '', status: '', priority: '' },
          data.tasks,
          data.developers,
          data.agents,
          data.subAgents
        );
        setPositionsState(computeDefaultPositions(defaultVisible));
      } else {
        setPositionsState(data.positions);
      }
    },
    []
  );

  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    async function bootstrap() {
      setLoading(true);
      try {
        const allProjects = await fetchProjects();
        setProjects(allProjects);

        if (allProjects.length === 0) {
          return;
        }

        const firstProject = allProjects[0];
        projectIdRef.current = firstProject.id;
        setActiveProjectId(firstProject.id);
        setSetupComplete(firstProject.setupComplete ?? false);

        const [data] = await Promise.all([
          fetchProjectData(firstProject.id),
          loadAgentPersistence(firstProject.id),
        ]);
        hydrateProject(data);
      } catch (err) {
        setDbError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    }
    bootstrap();
  }, [hydrateProject, loadAgentPersistence]);

  // ── setPositions with debounced DB write ───────────────────────────────────
  const setPositions = useCallback(
    (
      p:
        | Record<string, BoardPosition>
        | ((prev: Record<string, BoardPosition>) => Record<string, BoardPosition>)
    ) => {
      setPositionsState((prev) => {
        const next = typeof p === 'function' ? p(prev) : p;
        if (posDebounceRef.current) clearTimeout(posDebounceRef.current);
        posDebounceRef.current = setTimeout(() => {
          upsertPositions(projectIdRef.current, next).catch(console.error);
        }, 500);
        return next;
      });
    },
    []
  );

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const emitActivity = useCallback((activity: Omit<TaskActivity, 'id' | 'createdAt'>) => {
    const full: TaskActivity = {
      ...activity,
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
    };
    insertActivity(projectIdRef.current, full).catch(console.error);
  }, []);

  const toggleCriterion = useCallback((key: string) => {
    setCheckedCriteria((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      upsertCheckedCriterion(projectIdRef.current, key, next[key]).catch(console.error);
      // Extract taskId from key format "taskId:index"
      const taskId = key.split(':')[0];
      if (taskId) {
        emitActivity({
          taskId,
          projectId: projectIdRef.current,
          eventType: 'criteria_checked',
          actor: 'user',
          actorType: 'user',
          payload: { key, checked: next[key] },
        });
      }
      return next;
    });
  }, [emitActivity]);

  const openPanel = useCallback((entry: PanelEntry) => {
    setPanelStack([entry]);
  }, []);

  const closePanel = useCallback(() => {
    setPanelStack([]);
  }, []);

  const drillPanel = useCallback((entry: PanelEntry) => {
    setPanelStack((prev) => [...prev, entry]);
  }, []);

  const panelBack = useCallback(() => {
    setPanelStack((prev) => prev.slice(0, -1));
  }, []);

  const resetLayout = useCallback(() => {
    const defaultPos = computeDefaultPositions(visible);
    setPositions(defaultPos);
  }, [visible, setPositions]);

  const addTask = useCallback(
    (task: AppTask) => {
      setTasks((prev) => [...prev, task]);
      setPositions((prev) => {
        const taskYs = Object.entries(prev)
          .filter(([id]) => id.startsWith('t'))
          .map(([, pos]) => pos.y);
        const bottomY = taskYs.length > 0 ? Math.max(...taskYs) + 116 : 100;
        return { ...prev, [task.id]: { x: 60, y: bottomY } };
      });
      upsertTask(projectIdRef.current, { ...task, isCustom: true }, true).catch(console.error);
    },
    [setPositions]
  );

  const updateTask = useCallback((updated: AppTask) => {
    setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
    upsertTask(projectIdRef.current, updated, updated.isCustom ?? false).catch(console.error);
  }, []);

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => prev.filter((t) => t.id !== id));
      setPositions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPanelStack([]);
      setSelectedId(null);
      deleteTaskInDB(projectIdRef.current, id).catch(console.error);
    },
    [setPositions]
  );

  // ── Epic CRUD ──────────────────────────────────────────────────────────────
  const addEpic = useCallback((epic: AppEpic) => {
    setEpics((prev) => [...prev, epic]);
    upsertEpic(projectIdRef.current, epic).catch(console.error);
  }, []);

  const updateEpic = useCallback((updated: AppEpic) => {
    setEpics((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
    upsertEpic(projectIdRef.current, updated).catch(console.error);
  }, []);

  const deleteEpic = useCallback((id: string) => {
    setEpics((prev) => prev.filter((e) => e.id !== id));
    deleteEpicInDB(projectIdRef.current, id).catch(console.error);
  }, []);

  // ── Story CRUD ─────────────────────────────────────────────────────────────
  const addStory = useCallback((story: AppStory) => {
    setStories((prev) => [...prev, story]);
    upsertStory(projectIdRef.current, story).catch(console.error);
  }, []);

  const updateStory = useCallback((updated: AppStory) => {
    setStories((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    upsertStory(projectIdRef.current, updated).catch(console.error);
  }, []);

  const deleteStory = useCallback((id: string) => {
    setStories((prev) => prev.filter((s) => s.id !== id));
    deleteStoryInDB(projectIdRef.current, id).catch(console.error);
  }, []);

  // ── Sprint CRUD ────────────────────────────────────────────────────────────
  const addSprint = useCallback((sprint: AppSprint) => {
    setSprints((prev) => [...prev, sprint]);
    upsertSprint(projectIdRef.current, sprint).catch(console.error);
  }, []);

  const updateSprint = useCallback((updated: AppSprint) => {
    setSprints((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    upsertSprint(projectIdRef.current, updated).catch(console.error);
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => prev.filter((s) => s.id !== id));
    setSprintTaskIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
    deleteSprintInDB(projectIdRef.current, id).catch(console.error);
  }, []);

  const addTaskToSprint = useCallback((sprintId: string, taskId: string) => {
    setSprintTaskIds((prev) => {
      const ids = prev[sprintId] ?? [];
      if (ids.includes(taskId)) return prev;
      return { ...prev, [sprintId]: [...ids, taskId] };
    });
    addTaskToSprintInDB(sprintId, taskId, 'user').catch(console.error);
  }, []);

  const removeTaskFromSprint = useCallback((sprintId: string, taskId: string) => {
    setSprintTaskIds((prev) => ({
      ...prev,
      [sprintId]: (prev[sprintId] ?? []).filter((id) => id !== taskId),
    }));
    removeTaskFromSprintInDB(sprintId, taskId).catch(console.error);
  }, []);

  const getSprintTasks = useCallback(
    (sprintId: string) => {
      const ids = sprintTaskIds[sprintId] ?? [];
      return tasks.filter((t) => ids.includes(t.id));
    },
    [tasks, sprintTaskIds]
  );

  // ── Project management ─────────────────────────────────────────────────────
  const loadProject = useCallback(
    async (id: string) => {
      setLoading(true);
      try {
        const [data] = await Promise.all([fetchProjectData(id), loadAgentPersistence(id)]);
        hydrateProject(data);
      } catch (err) {
        setDbError(err instanceof Error ? err.message : 'Failed to load project');
      } finally {
        setLoading(false);
      }
    },
    [hydrateProject, loadAgentPersistence]
  );

  const switchProject = useCallback(
    async (id: string) => {
      if (id === projectIdRef.current) return;
      setSelectedId(null);
      setPanelStack([]);
      setPanTarget(null);
      setFilters({ dev: '', type: '', status: '', priority: '' });
      projectIdRef.current = id;
      setActiveProjectId(id);
      // Restore setupComplete from the project record
      setProjects(prev => {
        const p = prev.find(p => p.id === id);
        if (p) setSetupComplete(p.setupComplete ?? false);
        return prev;
      });
      await loadProject(id);
    },
    [loadProject]
  );

  const createProject = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const newProject = await createProjectInDB(name);
      setProjects((prev) => [...prev, newProject]);
      projectIdRef.current = newProject.id;
      setActiveProjectId(newProject.id);
      setTasks([]);
      setDevelopers([]);
      setAgents([]);
      setSubAgents([]);
      setEpics([]);
      setStories([]);
      setSprints([]);
      setSprintTaskIds({});
      setPositionsState({});
      setCheckedCriteria({});
      setSetupComplete(false);
    } finally {
      setLoading(false);
    }
  }, []);

  const injectSetupData = useCallback(async (data: ProjectSetupData) => {
    const projectId = projectIdRef.current;
    const ts = Date.now();

    const newDevelopers: AppDeveloper[] = (data.developers ?? []).map(d => ({
      id: d.id,
      name: d.name,
      initials: d.initials,
      role: d.role,
      desc: d.desc ?? '',
      criteria: [],
      outputs: [],
    }));

    const newAgents: AppAgent[] = (data.agents ?? []).map(a => ({
      id: a.id,
      name: a.name,
      type: a.type,
      developerId: a.developerId,
      desc: a.desc ?? '',
      criteria: [],
      outputs: [],
    }));

    const newSubAgents: AppSubAgent[] = (data.subAgents ?? []).map(s => ({
      id: s.id,
      name: s.name,
      type: s.type,
      parentId: s.parentId,
      desc: s.desc ?? '',
      criteria: [],
      outputs: [],
      status: 'idle' as const,
    }));

    const newTasks: AppTask[] = data.tasks.map((t, i) => ({
      id: `t-${ts}-${i}`,
      title: t.title,
      desc: t.desc,
      status: t.status,
      priority: t.priority,
      dueDate: t.dueDate,
      developerId: t.developerId ?? '',
      agentId: t.agentId,
      assigneeType: t.agentId ? 'agent' : 'dev',
      agentAssigned: !!t.agentId,
      criteria: t.criteria ?? [],
      isCustom: true,
    }));

    setDevelopers(newDevelopers);
    setAgents(newAgents);
    setSubAgents(newSubAgents);
    setTasks(newTasks);

    const defaultVisible = computeVisibleNodes(
      { dev: '', type: '', status: '', priority: '' },
      newTasks, newDevelopers, newAgents, newSubAgents
    );
    setPositionsState(computeDefaultPositions(defaultVisible));

    // Show the board immediately, then persist everything to DB
    setSetupComplete(true);
    setProjects(prev => prev.map(p =>
      p.id === projectId ? { ...p, setupComplete: true } : p
    ));
    try {
      // Developers must be saved before agents (foreign key dependency)
      await Promise.all(newDevelopers.map(d => upsertDeveloper(projectId, d)));
      await Promise.all([
        ...newAgents.map(a => upsertAgent(projectId, a)),
        ...newSubAgents.map(s => upsertSubAgent(projectId, s)),
        ...newTasks.map(t => upsertTask(projectId, t, true)),
      ]);
      await markProjectSetupComplete(projectId);
    } catch (err) {
      console.error('Failed to persist setup data to DB:', err);
    }
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) =>
      prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p))
    );
    renameProjectInDB(id, name).catch(console.error);
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    await deleteProjectInDB(id);
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      // If we deleted the active project, switch to first remaining
      if (id === projectIdRef.current && next.length > 0) {
        const fallback = next[0];
        projectIdRef.current = fallback.id;
        setActiveProjectId(fallback.id);
        loadProject(fallback.id);
      } else if (next.length === 0) {
        projectIdRef.current = '';
        setActiveProjectId('');
        setTasks([]);
        setDevelopers([]);
        setAgents([]);
        setSubAgents([]);
        setEpics([]);
        setStories([]);
        setSprints([]);
        setSprintTaskIds({});
        setPositionsState({});
        setCheckedCriteria({});
      }
      return next;
    });
  }, [loadProject]);

  // ── Orchestration agent callbacks ──────────────────────────────────────────
  const updateTaskStatus = useCallback(
    (taskId: string, status: StatusType, blockerReason?: string) => {
      setTasks((prev) => {
        const oldTask = prev.find((t) => t.id === taskId);
        const oldStatus = oldTask?.status;
        const next = _updateTaskStatus(prev, taskId, status, blockerReason);
        const updated = next.find((t) => t.id === taskId);
        if (updated) {
          upsertTask(projectIdRef.current, updated, updated.isCustom ?? false).catch(console.error);
        }
        if (oldStatus && oldStatus !== status) {
          emitActivity({
            taskId,
            projectId: projectIdRef.current,
            eventType: 'status_changed',
            actor: 'user',
            actorType: 'user',
            payload: { from: oldStatus, to: status },
          });
        }
        return next;
      });
    },
    [emitActivity]
  );

  const assignTaskToDeveloper = useCallback(
    (taskId: string, developerId: string) => {
      setTasks((prev) => {
        const next = _assignTaskToDeveloper(prev, taskId, developerId);
        const updated = next.find((t) => t.id === taskId);
        if (updated) {
          upsertTask(projectIdRef.current, updated, updated.isCustom ?? false).catch(console.error);
        }
        emitActivity({
          taskId,
          projectId: projectIdRef.current,
          eventType: 'assigned',
          actor: 'user',
          actorType: 'user',
          payload: { developerId },
        });
        return next;
      });
    },
    [emitActivity]
  );

  const assignTaskToAgent = useCallback(
    (taskId: string, agentId: string) => {
      setTasks((prev) => {
        const next = _assignTaskToAgent(prev, taskId, agentId);
        const updated = next.find((t) => t.id === taskId);
        if (updated) {
          upsertTask(projectIdRef.current, updated, updated.isCustom ?? false).catch(console.error);
        }
        return next;
      });
    },
    []
  );

  const updateTaskPriority = useCallback(
    (taskId: string, priority: PriorityType) => {
      setTasks((prev) => {
        const oldTask = prev.find((t) => t.id === taskId);
        const oldPriority = oldTask?.priority;
        const next = _updateTaskPriority(prev, taskId, priority);
        const updated = next.find((t) => t.id === taskId);
        if (updated) {
          upsertTask(projectIdRef.current, updated, updated.isCustom ?? false).catch(console.error);
        }
        if (oldPriority && oldPriority !== priority) {
          emitActivity({
            taskId,
            projectId: projectIdRef.current,
            eventType: 'priority_changed',
            actor: 'user',
            actorType: 'user',
            payload: { from: oldPriority, to: priority },
          });
        }
        return next;
      });
    },
    [emitActivity]
  );

  const updateTaskDueDate = useCallback(
    (taskId: string, dueDate: string) => {
      setTasks((prev) => {
        const next = _updateTaskDueDate(prev, taskId, dueDate);
        const updated = next.find((t) => t.id === taskId);
        if (updated) {
          upsertTask(projectIdRef.current, updated, updated.isCustom ?? false).catch(console.error);
        }
        return next;
      });
    },
    []
  );

  const reassignAgent = useCallback(
    (agentId: string, newDeveloperId: string) => {
      setAgents((prev) => _reassignAgent(prev, agentId, newDeveloperId));
    },
    []
  );

  const setSubAgentStatus = useCallback(
    (subAgentId: string, status: 'active' | 'idle') => {
      setSubAgents((prev) => _setSubAgentStatus(prev, subAgentId, status));
    },
    []
  );

  const getBlockedTasks = useCallback(
    () => _getBlockedTasks(tasks),
    [tasks]
  );

  const getOverdueTasks = useCallback(
    () => _getOverdueTasks(tasks, new Date().toISOString().slice(0, 10)),
    [tasks]
  );

  const getDeveloperWorkload = useCallback(
    (developerId: string) => _getDeveloperWorkload(tasks, developerId),
    [tasks]
  );

  const getTaskChain = useCallback(
    (taskId: string) => _getTaskChain(taskId, tasks, developers, agents, subAgents),
    [tasks, developers, agents, subAgents]
  );

  const getCriteriaCompletion = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return { checked: 0, total: 0, percent: 0 };
      return _getCriteriaCompletion(task, checkedCriteria);
    },
    [tasks, checkedCriteria]
  );

  const markAgentTouched = useCallback((taskId: string) => {
    setAgentTouchedIds(prev => new Set([...prev, taskId]));
    insertAgentTouched(projectIdRef.current, taskId).catch(console.error);
  }, []);

  const dispatch = useCallback((
    agentId: string,
    taskId: string,
    input: Record<string, unknown> = {}
  ): string => {
    const dispatchId = crypto.randomUUID();
    const request: AgentDispatchRequest = {
      dispatchId,
      agentId,
      taskId,
      input,
      dispatchedAt: new Date().toISOString(),
    };
    const newState: AgentDispatchState = { request, status: 'dispatched' };
    setDispatches(prev => ({ ...prev, [dispatchId]: newState }));
    upsertAgentDispatch(projectIdRef.current, newState).catch(console.error);
    return dispatchId;
  }, []);

  const updateDispatch = useCallback((
    dispatchId: string,
    update: Partial<AgentDispatchState>
  ) => {
    setDispatches(prev => {
      const next = { ...prev, [dispatchId]: { ...prev[dispatchId], ...update } };
      upsertAgentDispatch(projectIdRef.current, next[dispatchId]).catch(console.error);
      return next;
    });
  }, []);

  const clearDispatch = useCallback((dispatchId: string) => {
    setDispatches(prev => {
      const next = { ...prev };
      delete next[dispatchId];
      return next;
    });
  }, []);

  const getTaskDispatches = useCallback((taskId: string) => {
    return Object.values(dispatches).filter(d => d.request.taskId === taskId);
  }, [dispatches]);

  // ── Context value ──────────────────────────────────────────────────────────
  const activeProject = projects.find((p) => p.id === activeProjectId);
  const activeSprint = sprints.find((s) => s.status === 'active');

  const value: AppContextType = {
    loading,
    filters,
    setFilters,
    visible,
    allTasks,
    developers,
    agents,
    subAgents,
    epics,
    stories,
    addEpic,
    updateEpic,
    deleteEpic,
    addStory,
    updateStory,
    deleteStory,
    sprints,
    activeSprint,
    sprintTaskIds,
    addSprint,
    updateSprint,
    deleteSprint,
    addTaskToSprint,
    removeTaskFromSprint,
    getSprintTasks,
    selectedId,
    setSelectedId,
    panelStack,
    openPanel,
    closePanel,
    drillPanel,
    panelBack,
    checkedCriteria,
    toggleCriterion,
    positions,
    setPositions,
    resetLayout,
    panTarget,
    setPanTarget,
    addTask,
    updateTask,
    deleteTask,
    projects,
    activeProjectId,
    activeProject,
    createProject,
    switchProject,
    renameProject,
    deleteProject,
    dbError,
    injectSetupData,
    setupComplete,
    setSetupComplete,
    updateTaskStatus,
    assignTaskToDeveloper,
    assignTaskToAgent,
    updateTaskPriority,
    updateTaskDueDate,
    reassignAgent,
    setSubAgentStatus,
    getBlockedTasks,
    getOverdueTasks,
    getDeveloperWorkload,
    getTaskChain,
    getCriteriaCompletion,
    agentTouchedIds,
    markAgentTouched,
    dispatches,
    dispatch,
    updateDispatch,
    clearDispatch,
    getTaskDispatches,
    persistedAgentActions,
    dismissedActionKeys,
    emitActivity,
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within AppProvider');
  }
  return context;
};
