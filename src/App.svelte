<script lang="ts">
  	import BpmnDesigner from './lib/components/BpmnDesigner.svelte';
    import { Toaster } from '@skeletonlabs/skeleton-svelte';
    import { toaster } from './lib/toaster-svelte';
</script>

<svelte:head>
	<title>BPMN Designer - SvelteKit</title>
	<meta name="description" content="Design BPMN diagrams with automatic file saving" />
</svelte:head>

<main class="h-full">

  <div class="h-screen w-full">
    <BpmnDesigner />
  </div>

</main>


<Toaster {toaster}></Toaster>