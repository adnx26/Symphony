<script>
  import { visibleNodes } from '$lib/stores/filters.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { openPanel } from '$lib/stores/panel.js';
  import { panTarget } from '$lib/stores/board.js';
  import { AGENTS, SUB_AGENTS, DEVELOPERS } from '$lib/data.js';

  let visible = typeof localStorage !== 'undefined'
    ? localStorage.getItem('aura-sidebar-visible') !== 'false'
    : true;

  $: if (typeof localStorage !== 'undefined') localStorage.setItem('aura-sidebar-visible', visible);

  let openKeys = new Set(
    typeof localStorage !== 'undefined'
      ? JSON.parse(localStorage.getItem('aura-sidebar-open') || '[]')
      : []
  );

  function toggleKey(key) {
    if (openKeys.has(key)) openKeys.delete(key);
    else openKeys.add(key);
    openKeys = openKeys;
    if (typeof localStorage !== 'undefined')
      localStorage.setItem('aura-sidebar-open', JSON.stringify([...openKeys]));
  }

  function onRowClick(id) {
    activeId.set(id);
    openPanel({ mode:'agent', id });
    panTarget.set(id);
  }

  $: tree = $visibleNodes.tasks.map(task => {
    const dev   = DEVELOPERS.find(d => d.id === task.developerId);
    const agent = AGENTS.find(a => a.id === task.agentId);
    const subs  = agent ? SUB_AGENTS.filter(sa => sa.parentId === agent.id) : [];
    const taskKey  = task.id;
    const devKey   = dev   ? `${task.id}|${dev.id}`   : null;
    const agentKey = agent ? `${task.id}|${agent.id}` : null;
    return { task, dev, agent, subs, taskKey, devKey, agentKey };
  });
</script>

<div
  class="relative flex-shrink-0 bg-aura-surface border-r border-white/[0.065] flex flex-col transition-[width] duration-[280ms] z-10"
  style="width:{visible?'200px':'0'};overflow:visible"
>
  <!-- Tree content -->
  <div class="flex-1 py-2 overflow-y-auto overflow-x-hidden" style="scrollbar-width:thin">
    {#each tree as { task, dev, agent, subs, taskKey, devKey, agentKey }}
      <!-- Task row -->
      <div
        class="flex items-center gap-[6px] px-2 py-[5px] mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors {$activeId === task.id ? 'bg-white/[.08]' : ''}"
        role="button" tabindex="0"
        on:click={() => onRowClick(task.id)}
        on:keydown={e => e.key==='Enter' && onRowClick(task.id)}
      >
        <span
          class="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[.65rem] text-aura-muted cursor-pointer hover:text-aura-text transition-colors rounded hover:bg-white/10 {!dev ? 'opacity-0 pointer-events-none' : ''}"
          on:click|stopPropagation={() => dev && toggleKey(taskKey)}
          role="button" tabindex="-1"
          on:keydown={e => e.key==='Enter' && dev && toggleKey(taskKey)}
        >{dev ? (openKeys.has(taskKey) ? '▾' : '▸') : '▸'}</span>
        <span class="overflow-hidden text-ellipsis flex-1" style="color:#f59e0b">{task.title}</span>
      </div>

      <!-- Dev children -->
      {#if dev && openKeys.has(taskKey)}
        <div>
          <div
            class="flex items-center gap-[6px] mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors {$activeId === dev.id ? 'bg-white/[.08]' : ''}"
            style="padding:5px 8px 5px {8+12}px"
            role="button" tabindex="0"
            on:click={() => onRowClick(dev.id)}
            on:keydown={e => e.key==='Enter' && onRowClick(dev.id)}
          >
            <span
              class="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[.65rem] text-aura-muted cursor-pointer hover:text-aura-text transition-colors rounded hover:bg-white/10 {!agent ? 'opacity-0 pointer-events-none' : ''}"
              on:click|stopPropagation={() => agent && toggleKey(devKey)}
              role="button" tabindex="-1"
              on:keydown={e => e.key==='Enter' && agent && toggleKey(devKey)}
            >{agent ? (openKeys.has(devKey) ? '▾' : '▸') : '▸'}</span>
            <span class="overflow-hidden text-ellipsis flex-1" style="color:#1dd4ef">{dev.name}</span>
          </div>

          <!-- Agent children -->
          {#if agent && openKeys.has(devKey)}
            <div>
              <div
                class="flex items-center gap-[6px] mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors {$activeId === agent.id ? 'bg-white/[.08]' : ''}"
                style="padding:5px 8px 5px {8+24}px"
                role="button" tabindex="0"
                on:click={() => onRowClick(agent.id)}
                on:keydown={e => e.key==='Enter' && onRowClick(agent.id)}
              >
                <span
                  class="flex-shrink-0 w-4 h-4 flex items-center justify-center text-[.65rem] text-aura-muted cursor-pointer hover:text-aura-text transition-colors rounded hover:bg-white/10 {!subs.length ? 'opacity-0 pointer-events-none' : ''}"
                  on:click|stopPropagation={() => subs.length && toggleKey(agentKey)}
                  role="button" tabindex="-1"
                  on:keydown={e => e.key==='Enter' && subs.length && toggleKey(agentKey)}
                >{subs.length ? (openKeys.has(agentKey) ? '▾' : '▸') : '▸'}</span>
                <span class="overflow-hidden text-ellipsis flex-1" style="color:#a78bfa">{agent.name}</span>
              </div>

              <!-- Sub-agent children -->
              {#if subs.length && openKeys.has(agentKey)}
                {#each subs as sa}
                  <div
                    class="flex items-center gap-[6px] mx-1 rounded cursor-pointer text-[.65rem] leading-[1.4] whitespace-nowrap overflow-hidden hover:bg-white/5 transition-colors {$activeId === sa.id ? 'bg-white/[.08]' : ''}"
                    style="padding:5px 8px 5px {8+36}px"
                    role="button" tabindex="0"
                    on:click={() => onRowClick(sa.id)}
                    on:keydown={e => e.key==='Enter' && onRowClick(sa.id)}
                  >
                    <span class="flex-shrink-0 w-4 opacity-0">▸</span>
                    <span class="overflow-hidden text-ellipsis flex-1" style="color:#fb7185">{sa.name}</span>
                  </div>
                {/each}
              {/if}
            </div>
          {/if}
        </div>
      {/if}
    {/each}
  </div>

  <!-- Collapse toggle -->
  <button
    class="absolute -right-[18px] top-1/2 -translate-y-1/2 w-[18px] h-10 bg-aura-surface border border-white/[0.065] border-l-0 rounded-r-[5px] flex items-center justify-center cursor-pointer text-aura-muted text-[.75rem] z-[11] hover:text-aura-text hover:bg-aura-surface2 select-none transition-colors"
    on:click={() => visible = !visible}
  >{visible ? '‹' : '›'}</button>
</div>
