import { writable } from 'svelte/store';

export const panel = writable({ open: false, stack: [] });

// entry: { mode: 'agent' | 'task', id: string, fromTaskId?: string }
export function openPanel(entry) {
  panel.set({ open: true, stack: [entry] });
}

export function closePanel() {
  panel.set({ open: false, stack: [] });
}

export function drillPanel(entry) {
  panel.update(p => ({ open: true, stack: [...p.stack, entry] }));
}

export function panelBack() {
  panel.update(p => {
    const stack = p.stack.slice(0, -1);
    return { open: stack.length > 0, stack };
  });
}
