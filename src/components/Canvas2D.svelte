<script lang="ts">
  import { onDestroy } from 'svelte';

  import { makeInteractive } from '../canvas2dsimulation/main';
  import * as simulation from '../canvas2dsimulation/simulation';
  import PlayerControls from './PlayerControls.svelte';
  const { simulating, canvas } = simulation;
  $: $canvas && makeInteractive($canvas, simulation);
  onDestroy(() => {
    $simulating = false;
  });
</script>

<div class="relative h-screen">
  <canvas class="h-full w-full" bind:this={$canvas} />
  <div class="absolute top-0 left-0 flex">
    <PlayerControls
      bind:play={$simulating}
      on:reset={() => simulation.reset()}
    />
  </div>
</div>
