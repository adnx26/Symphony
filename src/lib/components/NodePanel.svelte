<script>
  export let nodeId;

  import { visibleNodes } from '$lib/stores/filters.js';
  import { board } from '$lib/stores/board.js';
  import { TASKS, DEVELOPERS, AGENTS, SUB_AGENTS } from '$lib/data.js';
  import { nodeKind, findNode, downstreamChain, priorityConfig, formatDueDate } from '$lib/helpers.js';

  $: data = findNode(nodeId);
  $: kind = data ? nodeKind(nodeId) : null;
  $: edges = $visibleNodes.edges;

  $: chainVisited = (nodeId && edges) ? downstreamChain(nodeId, edges) : new Set();
  $: chainCols = buildCols(nodeId, chainVisited);

  function buildCols(startId, visited) {
    const allIds = [startId, ...Array.from(visited).filter(id => id !== startId)];
    return [
      allIds.filter(id => TASKS.find(x => x.id === id)),
      allIds.filter(id => DEVELOPERS.find(x => x.id === id)),
      allIds.filter(id => AGENTS.find(x => x.id === id)),
      allIds.filter(id => SUB_AGENTS.find(x => x.id === id)),
    ].filter(c => c.length > 0);
  }

  $: isTask = data && TASKS.find(t => t.id === nodeId);
  $: metaPc = isTask ? priorityConfig(data.priority) : null;
  $: metaDd = data?.dueDate ? formatDueDate(data.dueDate) : null;
  $: fullDate = data?.dueDate ? (() => {
    const [y,m,d] = data.dueDate.split('-').map(Number);
    return new Date(y,m-1,d).toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
  })() : null;

  function toggleCriterion(key) {
    board.update(b => ({ ...b, checked: { ...b.checked, [key]: !b.checked[key] } }));
  }
</script>

{#if data && kind}
  <!-- Overview -->
  <div class="panel-section">
    <h3>Overview</h3>
    <p style="font-size:.72rem;line-height:1.65;color:rgba(255,255,255,0.45)">{data.overview || data.desc || '—'}</p>
    {#if metaPc || metaDd}
      <div style="display:flex;gap:6px;flex-wrap:wrap;margin-top:6px">
        {#if metaPc}
          <span class="tag" style="background:{metaPc.bg};color:{metaPc.color}">● {metaPc.label}</span>
        {/if}
        {#if metaDd && fullDate}
          <span class="tag" style="background:{metaDd.bg};color:{metaDd.color};border:1px solid {metaDd.border}">📅 {fullDate}</span>
        {/if}
      </div>
    {/if}
  </div>

  <!-- Chain visualization -->
  {#if chainCols.length > 0}
    <div class="panel-section">
      <h3>Chain from here</h3>
      <div style="display:flex;align-items:flex-start;flex-wrap:wrap;gap:6px">
        {#each chainCols as col, ci}
          {#if ci > 0}<div class="chain-arrow">→</div>{/if}
          <div class="chain-branch">
            {#each col as id}
              {@const d = findNode(id)}
              {@const k = nodeKind(id)}
              <div class="chain-node">
                <div class="chain-chip" style="background:{k.bg};color:{k.color};border-color:{k.color}33">
                  {d?.name || d?.title || id}
                </div>
                <span class="chain-type">{k.label}</span>
              </div>
            {/each}
          </div>
        {/each}
      </div>

      {#if data.outputs?.length}
        <h3 style="margin-top:10px">Outputs</h3>
        <div style="display:flex;flex-direction:column;gap:5px">
          {#each data.outputs as output}
            <div style="display:flex;align-items:center;gap:8px;font-size:.68rem;color:rgba(255,255,255,0.45);line-height:1.4">
              <span style="width:5px;height:5px;border-radius:50%;flex-shrink:0;opacity:.7;background:{kind.color}"></span>
              <span>{output}</span>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {/if}

  <!-- Criteria -->
  {#if data.criteria?.length}
    <div class="panel-section">
      <h3>Completion criteria</h3>
      <div style="display:flex;flex-direction:column;gap:6px">
        {#each data.criteria as text, i}
          {@const key = `${nodeId}:${i}`}
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
