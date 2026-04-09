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

<<<<<<< Updated upstream
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
=======
<header class="app-header relative z-20 px-[clamp(14px,1.6vw,24px)] py-[clamp(5px,0.6vw,7px)] flex-shrink-0"
        style="background:linear-gradient(180deg,rgba(6,11,23,0.96),rgba(7,13,27,0.92));border-bottom:1px solid rgba(107,133,175,0.12);backdrop-filter:blur(14px);box-shadow:0 10px 28px rgba(0,0,0,0.22)">
  <div class="flex items-center justify-center gap-[clamp(10px,1vw,20px)] min-h-[40px] flex-nowrap overflow-x-auto">
    <div class="flex items-center gap-[clamp(10px,1vw,20px)] flex-shrink-0">
      <div class="flex flex-col justify-center min-w-[clamp(118px,11vw,148px)] text-center">
        <div class="text-[clamp(.42rem,.55vw,.5rem)] font-bold uppercase tracking-[.32em] text-slate-500">Control Deck</div>
        <div class="font-syne font-extrabold text-[clamp(1rem,1.4vw,1.18rem)] tracking-[.16em] text-slate-100 mt-[3px]">
          SYMPHONY
        </div>
      </div>

      <div class="flex items-center rounded-full border border-slate-700/55 bg-slate-950/38 p-1.5 flex-shrink-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
        <a href="/"
           class="h-[clamp(26px,2.6vw,30px)] text-[clamp(.6rem,.8vw,.68rem)] leading-none font-bold tracking-[.16em] px-[clamp(12px,1.4vw,20px)] flex items-center rounded-full transition-colors duration-150 no-underline uppercase whitespace-nowrap {isBoard($page.url.pathname) ? 'text-slate-100 bg-slate-800/90 border border-slate-600/45 shadow-[0_0_14px_rgba(59,130,246,0.10)]' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/45'}">
          Board
        </a>
        <a href="/tickets"
           class="h-[clamp(26px,2.6vw,30px)] text-[clamp(.6rem,.8vw,.68rem)] leading-none font-bold tracking-[.16em] px-[clamp(12px,1.4vw,20px)] flex items-center rounded-full transition-colors duration-150 no-underline uppercase whitespace-nowrap {!isBoard($page.url.pathname) ? 'text-slate-100 bg-slate-800/90 border border-slate-600/45 shadow-[0_0_14px_rgba(59,130,246,0.10)]' : 'text-slate-400 border border-transparent hover:text-slate-200 hover:bg-slate-900/45'}">
          Tickets
        </a>
      </div>
    </div>

    <div class="ml-auto flex items-center gap-[clamp(8px,.8vw,12px)] flex-nowrap min-w-0">
      {#each [
        { label:'Dev',      key:'dev',      id:'f-dev',      options:[{v:'',l:'All'},{v:'Alice Chen',l:'Alice Chen'},{v:'Bob Kim',l:'Bob Kim'},{v:'Carol Davis',l:'Carol Davis'}] },
        { label:'Agent',    key:'type',     id:'f-type',     options:[{v:'',l:'All'},{v:'Code Review',l:'Code Review'},{v:'QA',l:'QA'},{v:'DevOps',l:'DevOps'},{v:'Design',l:'Design'}] },
        { label:'Status',   key:'status',   id:'f-status',   options:[{v:'',l:'All'},{v:'todo',l:'To Do'},{v:'progress',l:'In Progress'},{v:'done',l:'Done'},{v:'blocked',l:'Blocked'}] },
        { label:'Priority', key:'priority', id:'f-priority', options:[{v:'',l:'All'},{v:'critical',l:'Critical'},{v:'high',l:'High'},{v:'medium',l:'Medium'},{v:'low',l:'Low'}] },
      ] as chip}
        <div class="relative flex items-center justify-center gap-[clamp(8px,.8vw,12px)] pl-[clamp(12px,1vw,16px)] pr-[clamp(28px,2vw,32px)] h-[26px] bg-[rgba(10,18,34,0.52)] border border-[rgba(88,118,170,0.28)] rounded-full focus-within:border-[rgba(110,150,220,0.44)] focus-within:bg-[rgba(10,18,34,0.66)] transition-colors min-w-[clamp(150px,16vw,182px)] shadow-[inset_0_1px_0_rgba(255,255,255,0.02),0_0_16px_rgba(37,99,235,0.05)]">
          <span class="text-[clamp(.48rem,.65vw,.52rem)] leading-none font-bold uppercase tracking-[.16em] text-slate-400 min-w-[clamp(40px,4vw,46px)] text-center">{chip.label}</span>
          <select
            id={chip.id}
            value={$filters[chip.key]}
            on:change={e => onFilterChange(chip.key, e.target.value)}
            class="appearance-none font-mono text-[clamp(.62rem,.8vw,.7rem)] leading-none bg-transparent border-none text-slate-100 cursor-pointer outline-none px-3 w-[clamp(82px,9vw,100px)] text-center [&>option]:bg-[#101827]"
          >
            {#each chip.options as opt}
              <option value={opt.v}>{opt.l}</option>
            {/each}
          </select>
          <span class="pointer-events-none absolute right-[12px] text-[.62rem] text-slate-500">▾</span>
        </div>
      {/each}

      {#if isBoard($page.url.pathname)}
        <button
          on:click={() => resetSignal.update(n => n + 1)}
          class="h-[26px] font-mono text-[clamp(.6rem,.72vw,.64rem)] leading-none px-[clamp(10px,1vw,14px)] bg-[rgba(16,28,50,0.76)] text-slate-100 border border-[rgba(88,118,170,0.30)] rounded-full cursor-pointer hover:border-[rgba(110,150,220,0.44)] hover:text-white transition-colors shadow-[0_0_18px_rgba(37,99,235,0.08)] whitespace-nowrap flex-shrink-0"
        >
          ↺ Reset Layout
        </button>
      {/if}

      <div class="h-[26px] text-[clamp(.58rem,.72vw,.63rem)] leading-none px-[clamp(10px,1vw,16px)] flex items-center bg-[rgba(10,18,34,0.42)] border border-[rgba(88,118,170,0.22)] rounded-full text-slate-400 whitespace-nowrap flex-shrink-0">
        {#if isBoard($page.url.pathname)}
          {$visibleNodes.tasks.length + $visibleNodes.devs.length + $visibleNodes.agents.length + $visibleNodes.subAgents.length} nodes · click to inspect
        {:else}
          {$visibleNodes.tasks.length} ticket{$visibleNodes.tasks.length !== 1 ? 's' : ''} · click to inspect
        {/if}
      </div>
>>>>>>> Stashed changes
    </div>
  </div>
</header>
