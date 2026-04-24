import { Edge, BoardPosition } from '../types';

const NODE_W = 196; // matches Tailwind w-56 (14rem × 14px root font = 196px)
const NODE_H = 68;

interface ConnectionLinesProps {
  edges: Edge[];
  positions: Record<string, BoardPosition>;
  relatedIds?: Set<string> | null;
}

export function ConnectionLines({ edges, positions, relatedIds }: ConnectionLinesProps) {
  const getNodeEdgePoints = (nodeId: string) => {
    const pos = positions[nodeId];
    if (!pos) return null;
    return {
      rightX: pos.x + NODE_W,
      leftX: pos.x,
      midY: pos.y + NODE_H / 2,
    };
  };

  return (
    <svg
      className="absolute pointer-events-none"
      style={{ top: 0, left: 0, width: '10000px', height: '10000px' }}
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
          <polygon points="0 0, 10 3, 0 6" fill="rgba(113, 113, 122, 0.4)" />
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
        const fromPts = getNodeEdgePoints(edge.from);
        const toPts = getNodeEdgePoints(edge.to);

        if (!fromPts || !toPts) return null;

        // Connect right-center of source → left-center of target
        const fromX = fromPts.rightX;
        const fromY = fromPts.midY;
        const toX = toPts.leftX;
        const toY = toPts.midY;

        // Create smooth S-curve with control points at 50% of the horizontal span
        const midX = fromX + (toX - fromX) / 2;
        const pathD = `M ${fromX} ${fromY} C ${midX} ${fromY}, ${midX} ${toY}, ${toX} ${toY}`;

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
