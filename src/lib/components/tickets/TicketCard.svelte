<script>
  export let task;
  export let dev;
  export let agent;
  export let subAgents = [];

  import { activeId } from '$lib/stores/activeId.js';
  import { openPanel } from '$lib/stores/panel.js';
  import { priorityConfig, formatDueDate, STATUS_LABEL } from '$lib/helpers.js';

  $: pc = priorityConfig(task.priority);
  $: dd = formatDueDate(task.dueDate);
  $: accentColor = pc?.color || '#f59e0b';

  function onClick() {
    activeId.set(task.id);
    openPanel({ mode:'task', id:task.id });
  }
</script>

<!-- svelte-ignore a11y-click-events-have-key-events -->
<div
  class="relative cursor-pointer rounded-lg overflow-hidden transition-[border-color,box-shadow] duration-150"
  class:ring-1={$activeId === task.id}
  style="background:#0b1221;border:1px solid {$activeId===task.id?'rgba(255,255,255,.22)':'rgba(255,255,255,.065)'};padding:12px 14px 12px 17px;{$activeId===task.id?'box-shadow:0 0 16px rgba(255,255,255,.04)':''}"
  on:click={onClick}
  role="button"
  tabindex="0"
>
  <!-- Priority accent bar -->
  <div class="absolute left-0 top-[10%] bottom-[10%] w-[3px] rounded-r-[2px]" style="background:{accentColor}"></div>

  <!-- Title -->
  <div style="font-family:'Syne',sans-serif;font-size:.8rem;font-weight:700;color:#dce8f5;line-height:1.3;margin-bottom:5px">
    {task.title}
  </div>

  <!-- Badges -->
  <div style="display:flex;gap:4px;flex-wrap:wrap;margin-bottom:6px">
    <span class="tag tag-{task.status}">{STATUS_LABEL[task.status]}</span>
    {#if pc}
      <span class="tag" style="background:{pc.bg};color:{pc.color}">● {pc.label}</span>
    {/if}
    {#if dd}
      <span class="tag" style="background:{dd.bg};color:{dd.color};border:1px solid {dd.border}">{dd.text}</span>
    {/if}
  </div>

  <!-- Developer row -->
  {#if dev}
    <div style="display:flex;align-items:center;gap:7px;font-size:.63rem;color:rgba(255,255,255,0.28);margin-top:5px;line-height:1.4">
      <span class="avatar" style="background:#1a3d4a;color:#1dd4ef;width:18px;height:18px;font-size:.5rem;border-radius:4px;margin-right:0">{dev.initials}</span>
      <span>{dev.name}</span>
    </div>
  {/if}

  <!-- Agent + sub-agent chips -->
  {#if agent}
    <div style="display:flex;gap:4px;flex-wrap:wrap;margin-top:5px">
      <span style="font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(167,139,250,.10);color:#a78bfa;border:1px solid rgba(167,139,250,.22)">{agent.name}</span>
      {#each subAgents as sa}
        <span style="font-size:.55rem;font-weight:700;padding:2px 7px;border-radius:3px;background:rgba(251,113,133,.08);color:#fb7185;border:1px solid rgba(251,113,133,.20)">{sa.name}</span>
      {/each}
    </div>
  {/if}
</div>
