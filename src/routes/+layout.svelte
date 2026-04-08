<script>
  import '../app.css';
  import Header from '$lib/components/Header.svelte';
  import DetailPanel from '$lib/components/DetailPanel.svelte';
</script>

<div class="flex flex-col h-screen overflow-hidden">
  <Header />
  <slot />
  <DetailPanel />
</div>
