import { writable } from 'svelte/store';

export const board = writable({
  positions: {},             // nodeId → { x, y }
  zoom:      { x:0, y:0, scale:1 },
  checked:   {},             // 'nodeId:i' → boolean
});

// Set to a nodeId to pan canvas to that node; BoardCanvas resets to null after panning.
export const panTarget = writable(null);

// Increment to trigger BoardCanvas to reset the layout.
export const resetSignal = writable(0);
