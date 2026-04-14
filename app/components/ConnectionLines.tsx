import { Edge, BoardPosition } from '../types';

const NODE_W = 220;
const NODE_H = 68;

interface ConnectionLinesProps {
  edges: Edge[];
  positions: Record<string, BoardPosition>;
  relatedIds?: Set<string> | null;
}

export function ConnectionLines({ edges, positions, relatedIds }: ConnectionLinesProps) {
  const getNodeCenter = (nodeId: string) => {
    const pos = positions[nodeId];
    if (!pos) return null;
    return {
      x: pos.x + NODE_W / 2,
      y: pos.y + NODE_H / 2,
    };
  };

  return (
    <svg
      className="absolute inset-0 pointer-events-none"
      style={{ width: '100%', height: '100%', overflow: 'visible' }}
    >
      <defs>
        <marker
          id="arrowhead"
          markerWidth="10"
          markerHeight="10"
          refX="9"
          refY="3"
          orient="auto"
        >
          <polygon points="0 0, 10 3, 0 6" fill="rgba(148, 163, 184, 0.3)" />
        </marker>
        <style>
          {`
            @keyframes dash {
              to {
                stroke-dashoffset: -10;
              }
            }
            .animated-path {
              animation: dash 20s linear infinite;
              stroke-dasharray: 5, 5;
            }
          `}
        </style>
      </defs>

      {edges.map((edge, i) => {
        const fromCenter = getNodeCenter(edge.from);
        const toCenter = getNodeCenter(edge.to);

        if (!fromCenter || !toCenter) return null;

        // Calculate connection points (right center of from, left center of to)
        const fromX = fromCenter.x + NODE_W / 2;
        const fromY = fromCenter.y;
        const toX = toCenter.x - NODE_W / 2;
        const toY = toCenter.y;

        // Create curved path using cubic bezier
        const controlX = fromX + (toX - fromX) / 3;
        const pathD = `M ${fromX} ${fromY} C ${controlX} ${fromY}, ${controlX} ${toY}, ${toX} ${toY}`;

        const edgeFocused = !relatedIds || (relatedIds.has(edge.from) && relatedIds.has(edge.to));

        return (
          <path
            key={`${edge.from}-${edge.to}-${i}`}
            d={pathD}
            stroke={edge.color}
            strokeWidth={edgeFocused ? 2 : 1}
            fill="none"
            className={edgeFocused ? 'animated-path' : ''}
            opacity={edgeFocused ? 0.8 : 0}
            style={{ transition: 'opacity 0.25s' }}
          />
        );
      })}
    </svg>
  );
}
