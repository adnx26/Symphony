<script>
  export let taskId;

  import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
  import { board } from '$lib/stores/board.js';
  import { drillPanel } from '$lib/stores/panel.js';
  import { priorityConfig, formatDueDate } from '$lib/helpers.js';

  $: task      = TASKS.find(t => t.id === taskId);
  $: dev       = task ? DEVELOPERS.find(d => d.id === task.developerId) : null;
  $: agent     = task ? AGENTS.find(a => a.id === task.agentId) : null;
  $: subAgents = agent ? SUB_AGENTS.filter(sa => sa.parentId === agent.id) : [];

  $: metaPc = task ? priorityConfig(task.priority) : null;
  $: metaDd = task?.dueDate ? formatDueDate(task.dueDate) : null;
  $: fullDate = task?.dueDate ? (() => {
    const [y,m,d] = task.dueDate.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  })() : null;

  function toggleCriterion(key) {
    board.update(b => ({ ...b, checked: { ...b.checked, [key]: !b.checked[key] } }));
  }
</script>

{#if task}
  <!-- Overview -->
  <div class="panel-section">
    <h3>Overview</h3>
    <p style="font-size:.72rem;line-height:1.65;color:rgba(255,255,255,0.45)">{task.overview || task.desc || '—'}</p>
    <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
      {#if metaPc}
        <span class="tag" style="background:{metaPc.bg};color:{metaPc.color}">● {metaPc.label}</span>
      {/if}
      {#if metaDd && fullDate}
        <span class="tag" style="background:{metaDd.bg};color:{metaDd.color};border:1px solid {metaDd.border}">📅 {fullDate}</span>
      {/if}
    </div>
  </div>

  <!-- Team -->
  <div class="panel-section">
    <h3>Team</h3>
    <div style="display:flex;flex-direction:column;gap:4px">
      {#if dev}
        <div class="team-row">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);min-width:40px;flex-shrink:0">Dev</span>
          <span class="avatar" style="background:#1a3d4a;color:#1dd4ef;width:18px;height:18px;font-size:.5rem;border-radius:4px;flex-shrink:0;margin-right:0">{dev.initials}</span>
          <span style="flex:1;color:#ffffff">{dev.name}</span>
          <span style="font-size:.58rem;color:rgba(255,255,255,0.28);font-style:italic">{dev.role}</span>
        </div>
      {/if}
      {#if agent}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="team-row clickable" on:click={() => drillPanel({ mode:'agent', id:agent.id, fromTaskId:taskId })} role="button" tabindex="0">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);min-width:40px;flex-shrink:0">Agent</span>
          <span style="flex:1;color:#a78bfa">{agent.name}</span>
          <span style="font-size:.58rem;color:rgba(255,255,255,0.28);font-style:italic">{agent.type}</span>
          <span style="color:rgba(255,255,255,0.28);font-size:.7rem">›</span>
        </div>
      {/if}
      {#each subAgents as sa}
        <!-- svelte-ignore a11y-click-events-have-key-events -->
        <div class="team-row clickable" on:click={() => drillPanel({ mode:'agent', id:sa.id, fromTaskId:taskId })} role="button" tabindex="0">
          <span style="font-size:.52rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,0.28);min-width:40px;flex-shrink:0">Sub</span>
          <span style="flex:1;color:#fb7185">{sa.name}</span>
          <span style="font-size:.58rem;color:rgba(255,255,255,0.28);font-style:italic">{sa.type}</span>
          <span style="color:rgba(255,255,255,0.28);font-size:.7rem">›</span>
        </div>
      {/each}
    </div>
  </div>

  <!-- Criteria -->
  {#if task.criteria?.length}
    <div class="panel-section">
      <h3>Completion criteria</h3>
      <div style="display:flex;flex-direction:column;gap:6px">
        {#each task.criteria as text, i}
          {@const key = `${taskId}:${i}`}
          {@const isOk = !!$board.checked[key]}
          <!-- svelte-ignore a11y-click-events-have-key-events -->
          <div
            class="criterion {isOk ? 'checked' : ''}"
            on:click={() => toggleCriterion(key)}
            role="checkbox"
            aria-checked={isOk}
            tabindex="0"
          >
            <div class="crit-box">{isOk ? '✓' : ''}</div>
            <span class="crit-text">{text}</span>
          </div>
        {/each}
      </div>
    </div>
  {/if}
{/if}
