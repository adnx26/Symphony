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
  AppEpic,
  AppStory,
  AppSprint,
  StatusType,
  PriorityType,
  TaskActivity,
} from '../types';
import { computeVisibleNodes, computeDefaultPositions } from '../data/appData';
import sampleData from '../data/symphony-data.json';
import {
  updateTaskStatus as _updateTaskStatus,
  assignTaskToDeveloper as _assignTaskToDeveloper,
  updateTaskPriority as _updateTaskPriority,
  updateTaskDueDate as _updateTaskDueDate,
  getBlockedTasks as _getBlockedTasks,
  getOverdueTasks as _getOverdueTasks,
  getDeveloperWorkload as _getDeveloperWorkload,
  getCriteriaCompletion as _getCriteriaCompletion,
} from '../agent/agentActions';

// ── Project type ──────────────────────────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  createdAt: string;
}

// ── localStorage helpers ──────────────────────────────────────────────────────

function lsGet<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function lsSet(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded — silently ignore
  }
}

// ── Context type ──────────────────────────────────────────────────────────────

interface AppContextType {
  loading: boolean;
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  visible: VisibleNodes;
  allTasks: AppTask[];
  developers: AppDeveloper[];
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

  // ── Orchestration agent API ─────────────────────────────────────────────────
  updateTaskStatus: (taskId: string, status: StatusType, blockerReason?: string) => void;
  assignTaskToDeveloper: (taskId: string, developerId: string) => void;
  updateTaskPriority: (taskId: string, priority: PriorityType) => void;
  updateTaskDueDate: (taskId: string, dueDate: string) => void;
  getBlockedTasks: () => AppTask[];
  getOverdueTasks: () => AppTask[];
  getDeveloperWorkload: (developerId: string) => { total: number; byStatus: Record<StatusType, number> };
  getCriteriaCompletion: (taskId: string) => { checked: number; total: number; percent: number };

  // ── Activity ────────────────────────────────────────────────────────────────
  emitActivity: (activity: Omit<TaskActivity, 'id' | 'createdAt'>) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

// ── Default project ───────────────────────────────────────────────────────────

const DEFAULT_PROJECT_ID = 'default';
const DEFAULT_PROJECT: Project = {
  id: DEFAULT_PROJECT_ID,
  name: 'My Project',
  createdAt: new Date().toISOString(),
};

// ── Provider ──────────────────────────────────────────────────────────────────

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [loading, setLoading] = useState(true);
  const dbError: string | null = null;

  // ── Project state ──────────────────────────────────────────────────────────
  const [projects, setProjects] = useState<Project[]>(() =>
    lsGet<Project[]>('symphony-projects', [DEFAULT_PROJECT])
  );
  const [activeProjectId, setActiveProjectId] = useState<string>(() => {
    const stored = lsGet<Project[]>('symphony-projects', [DEFAULT_PROJECT]);
    return stored[0]?.id ?? DEFAULT_PROJECT_ID;
  });
  const projectIdRef = useRef(activeProjectId);

  // ── Board data ─────────────────────────────────────────────────────────────
  const [tasks, setTasks] = useState<AppTask[]>([]);
  const [developers, setDevelopers] = useState<AppDeveloper[]>([]);
  const [epics, setEpics] = useState<AppEpic[]>([]);
  const [stories, setStories] = useState<AppStory[]>([]);
  const [sprints, setSprints] = useState<AppSprint[]>([]);
  const [sprintTaskIds, setSprintTaskIds] = useState<Record<string, string[]>>({});
  const [positions, setPositionsState] = useState<Record<string, BoardPosition>>({});
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>({});

  // ── UI state ───────────────────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    dev: '',
    status: '',
    priority: '',
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelStack, setPanelStack] = useState<PanelEntry[]>([]);
  const [panTarget, setPanTarget] = useState<string | null>(null);

  // Debounce ref for position saves
  const posDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Derived data ───────────────────────────────────────────────────────────
  const allTasks = tasks;

  const visible = useMemo(
    () => computeVisibleNodes(filters, allTasks, developers),
    [filters, allTasks, developers]
  );

  // ── Load project data from localStorage ───────────────────────────────────
  const loadProjectData = useCallback((projectId: string) => {
    const data = lsGet<{
      tasks: AppTask[];
      developers: AppDeveloper[];
      epics: AppEpic[];
      stories: AppStory[];
      sprints: AppSprint[];
      sprintTaskIds: Record<string, string[]>;
      checkedCriteria: Record<string, boolean>;
      positions: Record<string, BoardPosition>;
    }>(`symphony-project-${projectId}`, {
      tasks: [],
      developers: [],
      epics: [],
      stories: [],
      sprints: [],
      sprintTaskIds: {},
      checkedCriteria: {},
      positions: {},
    });

    // Defensively default every field in case localStorage has a stale/partial shape
    const safeTasks = Array.isArray(data.tasks) ? data.tasks : [];
    const safeDevs = Array.isArray(data.developers) ? data.developers : [];
    const safeEpics = Array.isArray(data.epics) ? data.epics : [];
    const safeStories = Array.isArray(data.stories) ? data.stories : [];
    const safeSprints = Array.isArray(data.sprints) ? data.sprints : [];
    const safeSprintTaskIds = data.sprintTaskIds && typeof data.sprintTaskIds === 'object' ? data.sprintTaskIds : {};
    const safeChecked = data.checkedCriteria && typeof data.checkedCriteria === 'object' ? data.checkedCriteria : {};
    const safePositions = data.positions && typeof data.positions === 'object' ? data.positions : {};

    // If no data in localStorage, seed with sample data
    const isEmpty = safeTasks.length === 0 && safeDevs.length === 0;
    const tasks = isEmpty ? (sampleData.tasks as AppTask[]) : safeTasks;
    const developers = isEmpty ? (sampleData.developers as AppDeveloper[]) : safeDevs;

    setTasks(tasks);
    setDevelopers(developers);
    setEpics(safeEpics);
    setStories(safeStories);
    setSprints(safeSprints);
    setSprintTaskIds(safeSprintTaskIds);
    setCheckedCriteria(safeChecked);

    if (Object.keys(safePositions).length === 0) {
      const defaultVisible = computeVisibleNodes(
        { dev: '', status: '', priority: '' },
        tasks, developers
      );
      setPositionsState(computeDefaultPositions(defaultVisible));
    } else {
      setPositionsState(safePositions);
    }
  }, []);

  // ── Persist project data to localStorage ──────────────────────────────────
  // ── Initial load ───────────────────────────────────────────────────────────
  useEffect(() => {
    const allProjects = lsGet<Project[]>('symphony-projects', [DEFAULT_PROJECT]);
    if (allProjects.length === 0) {
      setProjects([DEFAULT_PROJECT]);
      lsSet('symphony-projects', [DEFAULT_PROJECT]);
      setLoading(false);
      return;
    }
    const first = allProjects[0];
    projectIdRef.current = first.id;
    setActiveProjectId(first.id);
    loadProjectData(first.id);
    setLoading(false);
  }, [loadProjectData]);

  // ── setPositions with debounced localStorage write ────────────────────────
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
          const projectId = projectIdRef.current;
          const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
          lsSet(`symphony-project-${projectId}`, { ...existing, positions: next });
        }, 500);
        return next;
      });
    },
    []
  );

  // ── Callbacks ──────────────────────────────────────────────────────────────
  const emitActivity = useCallback((_activity: Omit<TaskActivity, 'id' | 'createdAt'>) => {
    // In-memory only — no DB persistence
  }, []);

  const toggleCriterion = useCallback((key: string) => {
    setCheckedCriteria((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, checkedCriteria: next });
      return next;
    });
  }, []);

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
      setTasks((prev) => {
        const next = [...prev, task];
        const projectId = projectIdRef.current;
        const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
        lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
        return next;
      });
      setPositions((prev) => {
        const taskYs = Object.entries(prev)
          .filter(([id]) => id.startsWith('t'))
          .map(([, pos]) => pos.y);
        const bottomY = taskYs.length > 0 ? Math.max(...taskYs) + 116 : 100;
        return { ...prev, [task.id]: { x: 60, y: bottomY } };
      });
    },
    [setPositions]
  );

  const updateTask = useCallback((updated: AppTask) => {
    setTasks((prev) => {
      const next = prev.map((t) => (t.id === updated.id ? updated : t));
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
      return next;
    });
  }, []);

  const deleteTask = useCallback(
    (id: string) => {
      setTasks((prev) => {
        const next = prev.filter((t) => t.id !== id);
        const projectId = projectIdRef.current;
        const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
        lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
        return next;
      });
      setPositions((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setPanelStack([]);
      setSelectedId(null);
    },
    [setPositions]
  );

  // ── Epic CRUD ──────────────────────────────────────────────────────────────
  const addEpic = useCallback((epic: AppEpic) => {
    setEpics((prev) => {
      const next = [...prev, epic];
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, epics: next });
      return next;
    });
  }, []);

  const updateEpic = useCallback((updated: AppEpic) => {
    setEpics((prev) => {
      const next = prev.map((e) => (e.id === updated.id ? updated : e));
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, epics: next });
      return next;
    });
  }, []);

  const deleteEpic = useCallback((id: string) => {
    setEpics((prev) => {
      const next = prev.filter((e) => e.id !== id);
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, epics: next });
      return next;
    });
  }, []);

  // ── Story CRUD ─────────────────────────────────────────────────────────────
  const addStory = useCallback((story: AppStory) => {
    setStories((prev) => {
      const next = [...prev, story];
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, stories: next });
      return next;
    });
  }, []);

  const updateStory = useCallback((updated: AppStory) => {
    setStories((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, stories: next });
      return next;
    });
  }, []);

  const deleteStory = useCallback((id: string) => {
    setStories((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, stories: next });
      return next;
    });
  }, []);

  // ── Sprint CRUD ────────────────────────────────────────────────────────────
  const addSprint = useCallback((sprint: AppSprint) => {
    setSprints((prev) => {
      const next = [...prev, sprint];
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, sprints: next });
      return next;
    });
  }, []);

  const updateSprint = useCallback((updated: AppSprint) => {
    setSprints((prev) => {
      const next = prev.map((s) => (s.id === updated.id ? updated : s));
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, sprints: next });
      return next;
    });
  }, []);

  const deleteSprint = useCallback((id: string) => {
    setSprints((prev) => {
      const next = prev.filter((s) => s.id !== id);
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, sprints: next });
      return next;
    });
    setSprintTaskIds((prev) => {
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const addTaskToSprint = useCallback((sprintId: string, taskId: string) => {
    setSprintTaskIds((prev) => {
      const ids = prev[sprintId] ?? [];
      if (ids.includes(taskId)) return prev;
      const next = { ...prev, [sprintId]: [...ids, taskId] };
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, sprintTaskIds: next });
      return next;
    });
  }, []);

  const removeTaskFromSprint = useCallback((sprintId: string, taskId: string) => {
    setSprintTaskIds((prev) => {
      const next = {
        ...prev,
        [sprintId]: (prev[sprintId] ?? []).filter((id) => id !== taskId),
      };
      const projectId = projectIdRef.current;
      const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
      lsSet(`symphony-project-${projectId}`, { ...existing, sprintTaskIds: next });
      return next;
    });
  }, []);

  const getSprintTasks = useCallback(
    (sprintId: string) => {
      const ids = sprintTaskIds[sprintId] ?? [];
      return tasks.filter((t) => ids.includes(t.id));
    },
    [tasks, sprintTaskIds]
  );

  // ── Project management ─────────────────────────────────────────────────────
  const switchProject = useCallback(
    async (id: string) => {
      if (id === projectIdRef.current) return;
      setSelectedId(null);
      setPanelStack([]);
      setPanTarget(null);
      setFilters({ dev: '', status: '', priority: '' });
      projectIdRef.current = id;
      setActiveProjectId(id);
      setLoading(true);
      const allProjects = lsGet<Project[]>('symphony-projects', []);
      loadProjectData(id);
      setLoading(false);
    },
    [loadProjectData]
  );

  const createProject = useCallback(async (name: string) => {
    setLoading(true);
    try {
      const newProject: Project = {
        id: crypto.randomUUID(),
        name,
        createdAt: new Date().toISOString(),
      };
      setProjects((prev) => {
        const next = [...prev, newProject];
        lsSet('symphony-projects', next);
        return next;
      });
      projectIdRef.current = newProject.id;
      setActiveProjectId(newProject.id);
      setTasks([]);
      setDevelopers([]);
      setEpics([]);
      setStories([]);
      setSprints([]);
      setSprintTaskIds({});
      setPositionsState({});
      setCheckedCriteria({});
    } finally {
      setLoading(false);
    }
  }, []);

  const renameProject = useCallback((id: string, name: string) => {
    setProjects((prev) => {
      const next = prev.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p));
      lsSet('symphony-projects', next);
      return next;
    });
  }, []);

  const deleteProject = useCallback(async (id: string) => {
    localStorage.removeItem(`symphony-project-${id}`);
    setProjects((prev) => {
      const next = prev.filter((p) => p.id !== id);
      lsSet('symphony-projects', next);
      if (id === projectIdRef.current && next.length > 0) {
        const fallback = next[0];
        projectIdRef.current = fallback.id;
        setActiveProjectId(fallback.id);
        loadProjectData(fallback.id);
      } else if (next.length === 0) {
        projectIdRef.current = '';
        setActiveProjectId('');
        setTasks([]);
        setDevelopers([]);
        setEpics([]);
        setStories([]);
        setSprints([]);
        setSprintTaskIds({});
        setPositionsState({});
        setCheckedCriteria({});
      }
      return next;
    });
  }, [loadProjectData]);

  // ── Orchestration agent callbacks ──────────────────────────────────────────
  const updateTaskStatus = useCallback(
    (taskId: string, status: StatusType, blockerReason?: string) => {
      setTasks((prev) => {
        const next = _updateTaskStatus(prev, taskId, status, blockerReason);
        const projectId = projectIdRef.current;
        const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
        lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
        return next;
      });
    },
    []
  );

  const assignTaskToDeveloper = useCallback(
    (taskId: string, developerId: string) => {
      setTasks((prev) => {
        const next = _assignTaskToDeveloper(prev, taskId, developerId);
        const projectId = projectIdRef.current;
        const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
        lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
        return next;
      });
    },
    []
  );

  const updateTaskPriority = useCallback(
    (taskId: string, priority: PriorityType) => {
      setTasks((prev) => {
        const next = _updateTaskPriority(prev, taskId, priority);
        const projectId = projectIdRef.current;
        const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
        lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
        return next;
      });
    },
    []
  );

  const updateTaskDueDate = useCallback(
    (taskId: string, dueDate: string) => {
      setTasks((prev) => {
        const next = _updateTaskDueDate(prev, taskId, dueDate);
        const projectId = projectIdRef.current;
        const existing = lsGet<Record<string, unknown>>(`symphony-project-${projectId}`, {});
        lsSet(`symphony-project-${projectId}`, { ...existing, tasks: next });
        return next;
      });
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

  const getCriteriaCompletion = useCallback(
    (taskId: string) => {
      const task = tasks.find((t) => t.id === taskId);
      if (!task) return { checked: 0, total: 0, percent: 0 };
      return _getCriteriaCompletion(task, checkedCriteria);
    },
    [tasks, checkedCriteria]
  );

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
    updateTaskStatus,
    assignTaskToDeveloper,
    updateTaskPriority,
    updateTaskDueDate,
    getBlockedTasks,
    getOverdueTasks,
    getDeveloperWorkload,
    getCriteriaCompletion,
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
