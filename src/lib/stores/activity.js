/**
 * Activity store — polls the local activity server every 4 seconds
 * and exposes a map of developerName → activity data.
 *
 * To swap for cloud later: change ACTIVITY_URL to your cloud endpoint.
 * The data shape and store API stay identical.
 */

import { writable, derived } from 'svelte/store';

const ACTIVITY_URL = 'http://localhost:3131/activity';
const POLL_INTERVAL = 4000; // ms

// Raw list of all activity objects from the server
export const activityList = writable([]);

// Derived map: developerName → activity  (for O(1) lookup in board)
export const activityByDev = derived(activityList, ($list) => {
  const map = {};
  for (const entry of $list) {
    if (entry.developerName) map[entry.developerName] = entry;
  }
  return map;
});

let pollTimer = null;

async function poll() {
  try {
    const res = await fetch(ACTIVITY_URL, { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const data = await res.json();
      activityList.set(Array.isArray(data) ? data : []);
    }
  } catch {
    // Server not running — silently ignore, show no badges
  }
}

export function startActivityPolling() {
  poll(); // immediate first fetch
  pollTimer = setInterval(poll, POLL_INTERVAL);
}

export function stopActivityPolling() {
  if (pollTimer) {
    clearInterval(pollTimer);
    pollTimer = null;
  }
}

/**
 * Returns a human-readable status label and a colour class for a given activity entry.
 */
export function getStatusMeta(entry) {
  if (!entry) return null;

  // Treat entries older than 30s as stale
  const age = Date.now() - new Date(entry.lastUpdated).getTime();
  if (age > 30_000 && entry.status !== 'idle') {
    return { label: 'idle', color: 'live-idle' };
  }

  switch (entry.status) {
    case 'active':          return { label: 'working',        color: 'live-active' };
    case 'running':         return { label: entry.activeTool || 'running', color: 'live-running' };
    case 'spawning-agent':  return { label: 'spawning agent', color: 'live-agent' };
    case 'idle':            return { label: 'idle',           color: 'live-idle' };
    default:                return null;
  }
}
