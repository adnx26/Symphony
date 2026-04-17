// app/components/AgentStatusBar.tsx
interface AgentStatusBarProps {
  queueCount: number;
  blockedCount: number;
  overdueCount: number;
  lastActionTime: string | null;
  onOpenPanel: () => void;
}

function formatRelativeTime(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  return `${diffHr}h ago`;
}

export function AgentStatusBar({
  queueCount,
  blockedCount,
  overdueCount,
  lastActionTime,
  onOpenPanel,
}: AgentStatusBarProps) {
  if (queueCount === 0 && blockedCount === 0 && overdueCount === 0 && lastActionTime === null) {
    return null;
  }

  return (
    <div
      className="flex items-center justify-between py-1 px-4"
      style={{
        background: '#fafafa',
        borderBottom: '1px solid #e4e4e7',
      }}
    >
      <div className="flex items-center gap-1">
        <button
          onClick={onOpenPanel}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all"
          style={{ color: blockedCount > 0 ? '#be123c' : '#a1a1aa' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span>{blockedCount} blocked</span>
        </button>
        <span style={{ color: '#e4e4e7' }}>·</span>
        <button
          onClick={onOpenPanel}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all"
          style={{ color: overdueCount > 0 ? '#c2410c' : '#a1a1aa' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span>{overdueCount} overdue</span>
        </button>
        <span style={{ color: '#e4e4e7' }}>·</span>
        <button
          onClick={onOpenPanel}
          className="flex items-center gap-1 px-2 py-0.5 rounded text-xs transition-all"
          style={{ color: queueCount > 0 ? '#7c3aed' : '#a1a1aa' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = '#f4f4f5')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        >
          <span>{queueCount} suggestions</span>
        </button>
      </div>
      {lastActionTime !== null && (
        <span className="text-xs" style={{ color: '#a1a1aa' }}>
          Last action {formatRelativeTime(lastActionTime)}
        </span>
      )}
    </div>
  );
}
