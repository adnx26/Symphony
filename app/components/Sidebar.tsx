import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildTreeData } from '../data/appData';
import { TreeNode } from '../types';
import { getNodeColor } from '../utils/nodeColors';

export function Sidebar() {
  const { visible, selectedId, openPanel, setPanTarget } = useApp();
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem('aura-sidebar-visible') === 'false'
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(
    new Set()
  );

  const treeData = buildTreeData(visible);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const handleNodeClick = (node: TreeNode) => {
    if (node.type === 'task') {
      openPanel({ mode: 'task', id: node.id });
    } else {
      openPanel({ mode: 'agent', id: node.id });
    }
    setPanTarget(node.id);
  };

  if (collapsed) {
    return (
      <div className="relative">
        <button
          onClick={() => {
            setCollapsed(false);
            localStorage.setItem('aura-sidebar-visible', 'true');
          }}
          className="absolute left-0 top-24 w-6 h-12 bg-slate-800/80 border border-white/10 border-l-0 rounded-r-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all z-10"
          style={{
            backdropFilter: 'blur(8px)',
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="w-60 border-r border-white/5 relative flex-shrink-0"
      style={{
        background: 'linear-gradient(to bottom, rgba(15, 23, 42, 0.6), rgba(11, 18, 33, 0.8))',
        backdropFilter: 'blur(8px)',
      }}
    >
      <div className="h-full overflow-y-auto p-4">
        {/* Header card */}
        <div
          className="p-4 rounded-lg border border-white/10 mb-4"
          style={{
            background: 'rgba(15, 23, 42, 0.5)',
          }}
        >
          <h3
            className="text-sm tracking-wider mb-1"
            style={{ fontFamily: 'Syne, sans-serif' }}
          >
            Structure View
          </h3>
          <p className="text-[0.65rem] text-slate-400 leading-relaxed">
            Hierarchical dependency tree
          </p>
        </div>

        {/* Tree */}
        <div className="space-y-1">
          {treeData.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              expanded={expandedNodes.has(node.id)}
              onToggle={toggleNode}
              selected={selectedId === node.id}
              onSelect={handleNodeClick}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => {
          setCollapsed(true);
          localStorage.setItem('aura-sidebar-visible', 'false');
        }}
        className="absolute -right-3 top-24 w-6 h-12 bg-slate-800/80 border border-white/10 rounded-r-md flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700/80 transition-all"
        style={{
          backdropFilter: 'blur(8px)',
        }}
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
    </aside>
  );
}

interface TreeNodeItemProps {
  node: TreeNode;
  expanded: boolean;
  onToggle: (id: string) => void;
  selected: boolean;
  onSelect: (node: TreeNode) => void;
  expandedNodes: Set<string>;
}

function TreeNodeItem({ node, expanded, onToggle, selected, onSelect, expandedNodes }: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const color = getNodeColor(node.type);
  const indent = node.level * 16;

  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        className={`
          w-full text-left px-2 py-1.5 rounded text-xs flex items-center gap-2 transition-all
          ${selected
            ? 'bg-slate-800/60 border'
            : 'hover:bg-slate-800/30'
          }
        `}
        style={{
          paddingLeft: `${indent + 8}px`,
          borderColor: selected ? color.accent : 'transparent',
          boxShadow: selected ? `0 0 8px ${color.glow}` : 'none',
        }}
      >
        {hasChildren && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="w-3 h-3 flex items-center justify-center rounded-full bg-slate-700/50 hover:bg-slate-600/50 flex-shrink-0"
          >
            <ChevronRight
              className={`w-2.5 h-2.5 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </span>
        )}
        {!hasChildren && <span className="w-3" />}

        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color.accent }}
        />

        <span className="flex-1 truncate text-slate-200">
          {node.label}
        </span>
      </button>

      {hasChildren && expanded && (
        <div>
          {node.children?.map((child) => (
            <TreeNodeItem
              key={child.id}
              node={child}
              expanded={expandedNodes.has(child.id)}
              onToggle={onToggle}
              selected={selected && child.id === node.id}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
            />
          ))}
        </div>
      )}
    </div>
  );
}
