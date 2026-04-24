/**
 * Returns a human-readable relative time string (e.g. "just now", "2m ago")
 */
export function timeAgo(isoString: string): string {
  const ts = new Date(isoString).getTime();
  if (isNaN(ts)) return 'unknown';
  const diff = Date.now() - ts;
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}
