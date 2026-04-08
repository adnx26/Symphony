<script>
  import BoardCanvas from '$lib/components/board/BoardCanvas.svelte';
  import Sidebar from '$lib/components/board/Sidebar.svelte';

  let boardCanvas;
</script>

<div class="flex flex-1 overflow-hidden relative z-[1]">
  <Sidebar />
  <BoardCanvas bind:this={boardCanvas} />
</div>

<!-- Zoom controls -->
<div class="fixed bottom-5 right-5 z-[25] flex flex-col gap-1">
  {#each [
    { label:'+',  title:'Zoom in',       action: () => boardCanvas?.zoomIn()  },
    { label:'⊡', title:'Fit to screen', action: () => boardCanvas?.zoomFit() },
    { label:'−',  title:'Zoom out',      action: () => boardCanvas?.zoomOut() },
  ] as btn}
    <button
      title={btn.title}
      on:click={btn.action}
      class="w-8 h-8 bg-aura-surface border border-white/[0.065] rounded-[6px] text-aura-muted cursor-pointer flex items-center justify-center text-base hover:text-aura-text hover:border-white/[.18] transition-colors"
    >{btn.label}</button>
  {/each}
</div>
