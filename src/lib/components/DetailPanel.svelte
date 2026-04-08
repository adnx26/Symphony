<script>
  import { panel, closePanel, panelBack } from '$lib/stores/panel.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { nodeKind, findNode } from '$lib/helpers.js';
  import { TASKS } from '$lib/data.js';
  import NodePanel from './NodePanel.svelte';
  import TaskPanel from './TaskPanel.svelte';

  $: top      = $panel.stack[$panel.stack.length - 1];
  $: kind     = top ? nodeKind(top.id) : null;
  $: showBack = $panel.stack.length > 1;

  $: topTitle = top
    ? (top.mode === 'task'
        ? (TASKS.find(t => t.id === top.id)?.title || top.id)
        : (findNode(top.id)?.name || findNode(top.id)?.title || top.id))
    : '';

  $: topSub = top?.mode === 'agent'
    ? (findNode(top.id)?.role || findNode(top.id)?.type || '')
    : '';

  function handleClose() {
    activeId.set(null);
    closePanel();
  }
</script>

<div id="detail-panel" class:open={$panel.open}>
  <!-- Accent bar -->
  <div style="height:2px;flex-shrink:0;background:{kind?.color || 'transparent'};transition:background .2s"></div>

  <!-- Header -->
  <div style="display:flex;align-items:flex-start;padding:14px 20px 10px;border-bottom:1px solid rgba(255,255,255,.06);flex-shrink:0;gap:12px">
    {#if kind}
      <span style="font-size:.58rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;padding:3px 8px;border-radius:3px;flex-shrink:0;margin-top:3px;background:{kind.bg};color:{kind.color}">
        {kind.label}
      </span>
    {/if}
    <div style="flex:1;min-width:0">
      <div style="font-family:'Syne',sans-serif;font-size:1rem;font-weight:800;color:#ffffff;line-height:1.2">
        {topTitle}
      </div>
      {#if topSub}
        <div style="font-size:.65rem;color:rgba(255,255,255,0.32);margin-top:2px;font-style:italic">{topSub}</div>
      {/if}
    </div>
    <button
      on:click={handleClose}
      style="margin-left:auto;background:none;border:none;cursor:pointer;color:rgba(255,255,255,0.35);font-size:1.1rem;line-height:1;padding:2px 6px;border-radius:4px;flex-shrink:0;transition:color .12s,background .12s"
      class="hover:text-aura-text hover:bg-white/[.07]"
    >✕</button>
  </div>

  <!-- Body -->
  <div style="display:flex;flex-direction:column;flex:1;overflow-y:auto;overflow-x:hidden">
    {#if showBack}
      <button
        on:click={panelBack}
        style="display:flex;align-items:center;gap:5px;margin:12px 18px 0;padding:5px 10px;width:fit-content;background:none;border:1px solid rgba(255,255,255,.08);border-radius:5px;cursor:pointer;font-family:'JetBrains Mono',monospace;font-size:.63rem;color:rgba(255,255,255,0.35);transition:color .12s,border-color .12s"
        class="hover:text-aura-text hover:border-white/[.18]"
      >← Back</button>
    {/if}

    {#if top}
      {#if top.mode === 'task'}
        <TaskPanel taskId={top.id} />
      {:else}
        <NodePanel nodeId={top.id} />
      {/if}
    {/if}
  </div>
</div>
