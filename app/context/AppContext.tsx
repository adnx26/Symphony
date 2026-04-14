import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  ReactNode,
  useCallback,
} from 'react';
import {
  FilterState,
  PanelEntry,
  BoardPosition,
  VisibleNodes,
} from '../types';
import {
  computeVisibleNodes,
  computeDefaultPositions,
} from '../data/appData';

interface AppContextType {
  filters: FilterState;
  setFilters: (f: FilterState) => void;
  visible: VisibleNodes;
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
  setPositions: (p: Record<string, BoardPosition> | ((prev: Record<string, BoardPosition>) => Record<string, BoardPosition>)) => void;
  resetLayout: () => void;
  panTarget: string | null;
  setPanTarget: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [filters, setFilters] = useState<FilterState>({
    dev: '',
    type: '',
    status: '',
    priority: '',
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelStack, setPanelStack] = useState<PanelEntry[]>([]);
  const [panTarget, setPanTarget] = useState<string | null>(null);

  // Load checked criteria from localStorage
  const [checkedCriteria, setCheckedCriteria] = useState<Record<string, boolean>>(() => {
    try {
      const stored = localStorage.getItem('aura-checked');
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  // Load positions from localStorage
  const [positions, setPositions] = useState<Record<string, BoardPosition>>(
    () => {
      try {
        const stored = localStorage.getItem('aura-positions');
        const version = localStorage.getItem('aura-layout-v');
        if (stored && version === '5') {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore
      }
      return {};
    }
  );

  // Compute visible nodes based on filters
  const visible = useMemo(() => computeVisibleNodes(filters), [filters]);

  // Initialize positions if empty
  useEffect(() => {
    if (Object.keys(positions).length === 0) {
      const defaultPos = computeDefaultPositions(visible);
      setPositions(defaultPos);
    }
  }, []);

  // Save checked criteria to localStorage
  useEffect(() => {
    localStorage.setItem('aura-checked', JSON.stringify(checkedCriteria));
  }, [checkedCriteria]);

  // Save positions to localStorage
  useEffect(() => {
    localStorage.setItem('aura-positions', JSON.stringify(positions));
    localStorage.setItem('aura-layout-v', '5');
  }, [positions]);

  const toggleCriterion = useCallback((key: string) => {
    setCheckedCriteria((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
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
  }, [visible]);

  const value: AppContextType = {
    filters,
    setFilters,
    visible,
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
