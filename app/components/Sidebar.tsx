import { useState } from 'react';
import { ChevronRight, ChevronLeft } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { buildTreeData } from '../data/appData';
import { TreeNode } from '../types';
import { getNodeColor } from '../utils/nodeColors';

export function Sidebar() {
  const { visible, selectedId, openPanel, setPanTarget } = useApp();
  const [collapsed, setCollapsed] = useState(
    localStorage.getItem('symphony-sidebar-visible') === 'false'
  );
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

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
      <div className="relative" style={{ borderRight: '1px solid #e4e4e7' }}>
        <button
          onClick={() => {
            setCollapsed(false);
            localStorage.setItem('symphony-sidebar-visible', 'true');
          }}
          className="absolute left-0 top-20 w-5 h-10 flex items-center justify-center transition-colors"
          style={{
            background: 'var(--sidebar)',
            border: '1px solid var(--border)',
            borderLeft: 'none',
            borderRadius: '0 4px 4px 0',
            color: 'var(--muted-foreground)',
          }}
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>
    );
  }

  return (
    <aside
      className="w-56 flex-shrink-0 relative flex flex-col"
      style={{
        background: 'var(--sidebar)',
        borderRight: '1px solid var(--border)',
      }}
    >
      <div className="h-full overflow-y-auto">
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs font-semibold" style={{ color: 'var(--foreground)' }}>Structure</p>
          <p className="text-xs mt-0.5" style={{ color: '#a1a1aa' }}>Dependency tree</p>
        </div>

        {/* Tree */}
        <div className="py-2">
          {treeData.map((node) => (
            <TreeNodeItem
              key={node.id}
              node={node}
              expanded={expandedNodes.has(node.id)}
              onToggle={toggleNode}
              selected={selectedId === node.id}
              onSelect={handleNodeClick}
              expandedNodes={expandedNodes}
              activeId={selectedId}
            />
          ))}
        </div>
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => {
          setCollapsed(true);
          localStorage.setItem('symphony-sidebar-visible', 'false');
        }}
        className="absolute -right-[1px] top-20 w-5 h-10 flex items-center justify-center transition-colors z-10"
        style={{
          background: 'var(--sidebar)',
          border: '1px solid var(--border)',
          borderLeft: 'none',
          borderRadius: '0 4px 4px 0',
          color: 'var(--muted-foreground)',
        }}
      >
        <ChevronLeft className="w-3.5 h-3.5" />
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
  activeId?: string | null;
}

function TreeNodeItem({ node, expanded, onToggle, selected, onSelect, expandedNodes, activeId }: TreeNodeItemProps) {
  const hasChildren = node.children && node.children.length > 0;
  const color = getNodeColor(node.type);
  const indent = node.level * 14;

  return (
    <div>
      <button
        onClick={() => onSelect(node)}
        className="w-full text-left flex items-center gap-1.5 py-1 text-xs transition-colors group"
        style={{
          paddingLeft: `${indent + 12}px`,
          paddingRight: '12px',
          background: selected ? '#f0f0f2' : 'transparent',
          color: selected ? '#0f0f0f' : '#3f3f46',
          borderLeft: selected ? `2px solid ${color.accent}` : '2px solid transparent',
        }}
        onMouseEnter={(e) => {
          if (!selected) (e.currentTarget as HTMLElement).style.background = '#f4f4f5';
        }}
        onMouseLeave={(e) => {
          if (!selected) (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        {/* Expand toggle */}
        {hasChildren ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className="w-3.5 h-3.5 flex items-center justify-center flex-shrink-0"
            style={{ color: '#a1a1aa' }}
          >
            <ChevronRight
              className={`w-3 h-3 transition-transform ${expanded ? 'rotate-90' : ''}`}
            />
          </span>
        ) : (
          <span className="w-3.5 flex-shrink-0" />
        )}

        {/* Type dot */}
        <span
          className="w-1.5 h-1.5 rounded-full flex-shrink-0"
          style={{ backgroundColor: color.accent }}
        />

        {/* Label */}
        <span className="flex-1 truncate" style={{ fontWeight: selected ? 500 : 400 }}>
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
              selected={activeId === child.id}
              onSelect={onSelect}
              expandedNodes={expandedNodes}
              activeId={activeId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
