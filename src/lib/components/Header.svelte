<script>
  import { page } from '$app/stores';
  import { filters, visibleNodes } from '$lib/stores/filters.js';
  import { resetSignal } from '$lib/stores/board.js';
  import { activeId } from '$lib/stores/activeId.js';
  import { closePanel } from '$lib/stores/panel.js';

  const isBoard = (pathname) => pathname === '/';

  function onFilterChange(key, value) {
    filters.update(f => ({ ...f, [key]: value }));
    activeId.set(null);
    closePanel();
  }
</script>

<header class="relative z-20 h-[52px] flex items-center gap-4 px-5 flex-shrink-0"
        style="background:rgba(5,8,16,0.94);border-bottom:1px solid rgba(255,255,255,0.065);backdrop-filter:blur(14px)">

  <!-- Logo -->
  <div class="font-syne font-extrabold text-[1rem] tracking-[.06em] flex-shrink-0 mr-2 text-white">
    AURA
  </div>

  <!-- Tabs -->
  <a href="/"
     class="text-[.65rem] font-bold tracking-[.03em] px-3 h-full flex items-center border-b-2 transition-colors duration-150 no-underline {isBoard($page.url.pathname) ? 'text-aura-text border-white/50' : 'text-aura-muted border-transparent'}">
    Board
  </a>
  <a href="/tickets"
     class="text-[.65rem] font-bold tracking-[.03em] px-3 h-full flex items-center border-b-2 transition-colors duration-150 no-underline {!isBoard($page.url.pathname) ? 'text-aura-text border-white/50' : 'text-aura-muted border-transparent'}">
    Tickets
  </a>

  <!-- Separator -->
  <div class="w-px h-[18px] bg-white/[0.065]"></div>

  <!-- Filter chips -->
  {#each [
    { label:'Dev',      key:'dev',      id:'f-dev',      options:[{v:'',l:'All'},{v:'Alice Chen',l:'Alice Chen'},{v:'Bob Kim',l:'Bob Kim'},{v:'Carol Davis',l:'Carol Davis'}] },
    { label:'Agent',    key:'type',     id:'f-type',     options:[{v:'',l:'All'},{v:'Code Review',l:'Code Review'},{v:'QA',l:'QA'},{v:'DevOps',l:'DevOps'},{v:'Design',l:'Design'}] },
    { label:'Status',   key:'status',   id:'f-status',   options:[{v:'',l:'All'},{v:'todo',l:'To Do'},{v:'progress',l:'In Progress'},{v:'done',l:'Done'},{v:'blocked',l:'Blocked'}] },
    { label:'Priority', key:'priority', id:'f-priority', options:[{v:'',l:'All'},{v:'critical',l:'Critical'},{v:'high',l:'High'},{v:'medium',l:'Medium'},{v:'low',l:'Low'}] },
  ] as chip}
    <div class="flex items-center gap-[8px] px-[16px] py-[5px] bg-aura-surface border border-white/[0.065] rounded-[5px] focus-within:border-white/[.18] transition-colors">
      <span class="text-[.6rem] font-bold uppercase tracking-[.1em] text-aura-muted">{chip.label}</span>
      <select
        id={chip.id}
        value={$filters[chip.key]}
        on:change={e => onFilterChange(chip.key, e.target.value)}
        class="font-mono text-[.72rem] bg-transparent border-none text-aura-text cursor-pointer outline-none pr-4 [&>option]:bg-[#161616]"
      >
        {#each chip.options as opt}
          <option value={opt.v}>{opt.l}</option>
        {/each}
      </select>
    </div>
  {/each}

  <!-- Header right -->
  <div class="ml-auto flex items-center gap-[10px]">
    {#if isBoard($page.url.pathname)}
      <button
        on:click={() => resetSignal.update(n => n + 1)}
        class="font-mono text-[.65rem] px-[12px] py-[5px] bg-aura-surface border border-white/[0.065] rounded-[5px] text-aura-muted cursor-pointer hover:text-aura-text hover:border-white/[.18] transition-colors"
      >
        ↺ Reset Layout
      </button>
    {/if}

    <div class="flex gap-[14px] items-center text-[.6rem] text-aura-muted">
      {#each [{color:'#f59e0b',label:'Tasks'},{color:'#1dd4ef',label:'Developers'},{color:'#a78bfa',label:'Agents'},{color:'#fb7185',label:'Sub-Agents'}] as item}
        <span><span class="inline-block w-[6px] h-[6px] rounded-full mr-1" style="background:{item.color}"></span>{item.label}</span>
      {/each}
    </div>

    <div class="text-[.65rem] px-2 py-[2px] bg-aura-surface border border-white/[0.065] rounded-full text-aura-muted">
      {#if isBoard($page.url.pathname)}
        {$visibleNodes.tasks.length + $visibleNodes.devs.length + $visibleNodes.agents.length + $visibleNodes.subAgents.length} nodes · click to inspect
      {:else}
        {$visibleNodes.tasks.length} ticket{$visibleNodes.tasks.length !== 1 ? 's' : ''} · click to inspect
      {/if}
    </div>
  </div>
</header>
