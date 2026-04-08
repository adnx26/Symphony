<script>
  import { visibleNodes } from '$lib/stores/filters.js';
  import { DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
  import TicketCard from './TicketCard.svelte';

  $: ticketRows = $visibleNodes.tasks.map(task => ({
    task,
    dev:       DEVELOPERS.find(d => d.id === task.developerId),
    agent:     AGENTS.find(a => a.id === task.agentId),
    subAgents: (() => { const a = AGENTS.find(x => x.id === task.agentId); return a ? SUB_AGENTS.filter(sa => sa.parentId === a.id) : []; })(),
  }));
</script>

<div class="flex-1 overflow-y-auto px-12 py-6">
  {#if ticketRows.length === 0}
    <div style="text-align:center;padding:48px 16px;font-size:.72rem;color:rgba(255,255,255,0.35)">
      No tickets match the current filters.
    </div>
  {:else}
    <div class="grid gap-[14px]" style="grid-template-columns:repeat(3,1fr)">
      {#each ticketRows as { task, dev, agent, subAgents }}
        <TicketCard {task} {dev} {agent} {subAgents} />
      {/each}
    </div>
  {/if}
</div>

<style>
  @media (max-width: 900px) {
    div.grid { grid-template-columns: repeat(2, 1fr) !important; }
  }
</style>
