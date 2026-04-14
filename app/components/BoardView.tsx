import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { NodeCard } from './NodeCard';
import { ConnectionLines } from './ConnectionLines';
import { getRelatedNodeIds } from '../data/appData';

const NODE_W = 220;
const NODE_H = 68;
const BOARD_H = 4000;

export function BoardView() {
  const { visible, positions, setPositions, selectedId, setSelectedId, openPanel, closePanel, panTarget, setPanTarget } = useApp();
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  // Panning state
  const isPanning = useRef(false);
  const panStart = useRef({ x: 0, y: 0 });

  // Dragging state
  const draggingId = useRef<string | null>(null);
  const dragOffset = useRef({ x: 0, y: 0 });
  const dragStartClient = useRef({ x: 0, y: 0 });
  const dragMoved = useRef(false);
  const pendingClick = useRef<(() => void) | null>(null);
  const [draggingNodeId, setDraggingNodeId] = useState<string | null>(null); // for render

  const DRAG_THRESHOLD = 6; // px — below this it's a click, not a drag

  // Related node IDs for the currently selected node (for focus/dim effect)
  const relatedIds = useMemo(
    () => (selectedId ? getRelatedNodeIds(selectedId, visible) : null),
    [selectedId, visible]
  );

  // ── Auto-fit on first load ───────────────────────────────────────────────
  const didAutoFit = useRef(false);

  const handleFitScreen = useCallback(() => {
    if (Object.keys(positions).length === 0) return;

    const allPositions = Object.values(positions);
    const xs = allPositions.map((p) => p.x);
    const ys = allPositions.map((p) => p.y);
    const minX = Math.min(...xs);
    const minY = Math.min(...ys);
    const maxX = Math.max(...xs) + NODE_W;
    const maxY = Math.max(...ys) + NODE_H;

    const containerWidth = containerRef.current?.clientWidth || 800;
    const containerHeight = containerRef.current?.clientHeight || 600;

    const boardWidth = maxX - minX;
    const boardHeight = maxY - minY;

    const zoomX = containerWidth / (boardWidth + 80);
    const zoomY = containerHeight / (boardHeight + 80);
    const newZoom = Math.min(zoomX, zoomY, 1) * 0.9;

    setZoom(newZoom);
    setPan({
      x: containerWidth / 2 - (minX + boardWidth / 2) * newZoom,
      y: containerHeight / 2 - (minY + boardHeight / 2) * newZoom,
    });
  }, [positions]);

  useEffect(() => {
    if (!didAutoFit.current && Object.keys(positions).length > 0) {
      didAutoFit.current = true;
      setTimeout(() => handleFitScreen(), 80);
    }
  }, [positions, handleFitScreen]);

  // ── Auto-pan to target node ──────────────────────────────────────────────
  useEffect(() => {
    if (panTarget && containerRef.current) {
      const pos = positions[panTarget];
      if (pos) {
        const containerWidth = containerRef.current.clientWidth;
        const containerHeight = containerRef.current.clientHeight;
        setPan({
          x: containerWidth / 2 - (pos.x + NODE_W / 2) * zoom,
          y: containerHeight / 2 - (pos.y + NODE_H / 2) * zoom,
        });
        setPanTarget(null);
      }
    }
  }, [panTarget, positions, zoom, setPanTarget]);

  // ── Mouse helpers ────────────────────────────────────────────────────────
  const toCanvasCoords = useCallback(
    (clientX: number, clientY: number) => {
      const rect = containerRef.current?.getBoundingClientRect() ?? { left: 0, top: 0 };
      return {
        x: (clientX - rect.left - pan.x) / zoom,
        y: (clientY - rect.top - pan.y) / zoom,
      };
    },
    [pan, zoom]
  );

  // ── Node drag start ──────────────────────────────────────────────────────
  const handleNodeDragStart = useCallback(
    (nodeId: string, e: React.MouseEvent, clickHandler: () => void) => {
      e.stopPropagation();
      const pos = positions[nodeId] ?? { x: 0, y: 0 };
      const canvas = toCanvasCoords(e.clientX, e.clientY);
      dragOffset.current = { x: canvas.x - pos.x, y: canvas.y - pos.y };
      dragStartClient.current = { x: e.clientX, y: e.clientY };
      dragMoved.current = false;
      draggingId.current = nodeId;
      pendingClick.current = clickHandler;
      // Don't set draggingNodeId yet — wait until threshold is crossed
    },
    [positions, toCanvasCoords]
  );

  // ── Canvas pan start / deselect ──────────────────────────────────────────
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === canvasRef.current) {
      isPanning.current = true;
      panStart.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
      dragStartClient.current = { x: e.clientX, y: e.clientY };
      // We'll deselect in mouseup if the user didn't pan
    }
  }, [pan]);

  const handleCanvasMouseUp = useCallback((e: React.MouseEvent) => {
    if (isPanning.current && e.target === canvasRef.current) {
      const dx = e.clientX - dragStartClient.current.x;
      const dy = e.clientY - dragStartClient.current.y;
      if (Math.sqrt(dx * dx + dy * dy) < DRAG_THRESHOLD) {
        // Didn't move → treat as background click → deselect
        setSelectedId(null);
        closePanel();
      }
    }
  }, [setSelectedId, closePanel]);

  // ── Shared mouse move ────────────────────────────────────────────────────
  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (draggingId.current) {
        const dx = e.clientX - dragStartClient.current.x;
        const dy = e.clientY - dragStartClient.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (!dragMoved.current && dist > DRAG_THRESHOLD) {
          dragMoved.current = true;
          setDraggingNodeId(draggingId.current);
        }

        if (dragMoved.current) {
          const canvas = toCanvasCoords(e.clientX, e.clientY);
          setPositions((prev) => ({
            ...prev,
            [draggingId.current!]: {
              x: canvas.x - dragOffset.current.x,
              y: canvas.y - dragOffset.current.y,
            },
          }));
        }
      } else if (isPanning.current) {
        setPan({
          x: e.clientX - panStart.current.x,
          y: e.clientY - panStart.current.y,
        });
      }
    },
    [toCanvasCoords, setPositions]
  );

  // ── Mouse up (end drag or pan) ───────────────────────────────────────────
  const handleMouseUp = useCallback(() => {
    if (draggingId.current && !dragMoved.current && pendingClick.current) {
      // Threshold never crossed → treat as a click
      pendingClick.current();
    }
    draggingId.current = null;
    dragMoved.current = false;
    pendingClick.current = null;
    setDraggingNodeId(null);
    isPanning.current = false;
  }, []);

  // ── Wheel zoom ───────────────────────────────────────────────────────────
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.05 : 0.05;
    setZoom((z) => Math.max(0.3, Math.min(2, z + delta)));
  }, []);

  // ── Zoom controls ────────────────────────────────────────────────────────
  const handleZoomIn = () => setZoom((z) => Math.min(z + 0.1, 2));
  const handleZoomOut = () => setZoom((z) => Math.max(z - 0.1, 0.3));

  // ── Node click ───────────────────────────────────────────────────────────
  const handleNodeClick = useCallback(
    (nodeId: string, nodeType: 'task' | 'developer' | 'agent' | 'sub-agent') => {
      setSelectedId(nodeId);
      if (nodeType === 'task') {
        openPanel({ mode: 'task', id: nodeId });
      } else {
        openPanel({ mode: 'agent', id: nodeId });
      }
    },
    [setSelectedId, openPanel]
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden"
      style={{ backgroundColor: '#08111f', cursor: draggingNodeId ? 'grabbing' : isPanning.current ? 'grabbing' : 'default' }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Canvas */}
      <div
        ref={canvasRef}
        className="absolute w-full"
        style={{
          height: BOARD_H,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: '0 0',
          transition: (draggingNodeId || isPanning.current) ? 'none' : 'transform 0.25s ease-out',
        }}
        onMouseDown={handleCanvasMouseDown}
        onMouseUp={handleCanvasMouseUp}
      >
        {/* Lane dividers */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          style={{ opacity: 0.08 }}
        >
          <line x1="284" y1="0" x2="284" y2={BOARD_H} stroke="white" strokeWidth="1" />
          <line x1="528" y1="0" x2="528" y2={BOARD_H} stroke="white" strokeWidth="1" />
          <line x1="772" y1="0" x2="772" y2={BOARD_H} stroke="white" strokeWidth="1" />
        </svg>

        {/* Lane labels */}
        <div className="absolute top-4 left-40 text-xs text-slate-500 uppercase tracking-wider pointer-events-none">Tasks</div>
        <div className="absolute top-4 left-72 text-xs text-slate-500 uppercase tracking-wider pointer-events-none">Developers</div>
        <div className="absolute top-4 left-[580px] text-xs text-slate-500 uppercase tracking-wider pointer-events-none">Agents</div>
        <div className="absolute top-4 left-[824px] text-xs text-slate-500 uppercase tracking-wider pointer-events-none">Sub-Agents</div>

        {/* Connection lines — dim non-related edges when something is selected */}
        <ConnectionLines edges={visible.edges} positions={positions} relatedIds={relatedIds} />

        {/* Dim overlay — sits above the background, below focused nodes */}
        {relatedIds && (
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ backgroundColor: 'rgba(8,17,31,0.65)', zIndex: 3, transition: 'opacity 0.25s' }}
          />
        )}

        {/* Task nodes */}
        {visible.tasks.map((task) => {
          const pos = positions[task.id];
          const focused = !relatedIds || relatedIds.has(task.id);
          return (
            <div
              key={task.id}
              className="absolute"
              style={{
                left: pos?.x ?? 0,
                top: pos?.y ?? 0,
                zIndex: focused ? 10 : 2,
                transition: 'opacity 0.25s',
                opacity: focused ? 1 : 0,
              }}
            >
              <NodeCard
                nodeId={task.id}
                nodeType="task"
                title={task.title}
                subtitle={task.desc}
                status={task.status}
                priority={task.priority}
                dueDate={task.dueDate}
                isSelected={selectedId === task.id}
                isDragging={draggingNodeId === task.id}
                onDragStart={(e) => handleNodeDragStart(task.id, e, () => handleNodeClick(task.id, 'task'))}
              />
            </div>
          );
        })}

        {/* Developer nodes */}
        {visible.devs.map((dev) => {
          const pos = positions[dev.id];
          const focused = !relatedIds || relatedIds.has(dev.id);
          return (
            <div
              key={dev.id}
              className="absolute"
              style={{
                left: pos?.x ?? 0,
                top: pos?.y ?? 0,
                zIndex: focused ? 10 : 2,
                transition: 'opacity 0.25s',
                opacity: focused ? 1 : 0,
              }}
            >
              <NodeCard
                nodeId={dev.id}
                nodeType="developer"
                title={dev.name}
                subtitle={dev.role}
                avatar={dev.initials}
                isSelected={selectedId === dev.id}
                isDragging={draggingNodeId === dev.id}
                onDragStart={(e) => handleNodeDragStart(dev.id, e, () => handleNodeClick(dev.id, 'developer'))}
              />
            </div>
          );
        })}

        {/* Agent nodes */}
        {visible.agents.map((agent) => {
          const pos = positions[agent.id];
          const focused = !relatedIds || relatedIds.has(agent.id);
          return (
            <div
              key={agent.id}
              className="absolute"
              style={{
                left: pos?.x ?? 0,
                top: pos?.y ?? 0,
                zIndex: focused ? 10 : 2,
                transition: 'opacity 0.25s',
                opacity: focused ? 1 : 0,
              }}
            >
              <NodeCard
                nodeId={agent.id}
                nodeType="agent"
                title={agent.name}
                subtitle={agent.type}
                isSelected={selectedId === agent.id}
                isDragging={draggingNodeId === agent.id}
                onDragStart={(e) => handleNodeDragStart(agent.id, e, () => handleNodeClick(agent.id, 'agent'))}
              />
            </div>
          );
        })}

        {/* Sub-agent nodes */}
        {visible.subAgents.map((sa) => {
          const pos = positions[sa.id];
          const focused = !relatedIds || relatedIds.has(sa.id);
          return (
            <div
              key={sa.id}
              className="absolute"
              style={{
                left: pos?.x ?? 0,
                top: pos?.y ?? 0,
                zIndex: focused ? 10 : 2,
                transition: 'opacity 0.25s',
                opacity: focused ? 1 : 0,
              }}
            >
              <NodeCard
                nodeId={sa.id}
                nodeType="sub-agent"
                title={sa.name}
                subtitle={sa.type}
                isSelected={selectedId === sa.id}
                isDragging={draggingNodeId === sa.id}
                onDragStart={(e) => handleNodeDragStart(sa.id, e, () => handleNodeClick(sa.id, 'sub-agent'))}
              />
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={handleZoomOut}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-white/10"
          title="Zoom Out"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="px-3 py-2 rounded-lg bg-slate-800/80 text-slate-300 text-xs font-medium border border-white/10">
          {Math.round(zoom * 100)}%
        </div>
        <button
          onClick={handleZoomIn}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-white/10"
          title="Zoom In"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleFitScreen}
          className="p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white transition-all border border-white/10"
          title="Fit to Screen"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex items-center gap-4 px-4 py-2 rounded-lg bg-slate-800/80 border border-white/10">
        {[
          { color: '#f59e0b', label: 'Tasks' },
          { color: '#22d3ee', label: 'Developers' },
          { color: '#a78bfa', label: 'Agents' },
          { color: '#fb7185', label: 'Sub-Agents' },
        ].map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
            <span className="text-xs text-slate-400">{label}</span>
          </div>
        ))}
      </div>

      {/* Empty state */}
      {visible.tasks.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-slate-300 mb-2">No nodes to display</h3>
            <p className="text-sm text-slate-500">Adjust your filters to see more nodes</p>
          </div>
        </div>
      )}
    </div>
  );
}
