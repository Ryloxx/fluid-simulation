<script>
  import { onMount } from 'svelte';

  import * as simulation from './simulation';
  const { simulating, canvas, colors, N } = simulation;
  let currentColorIndex = 0;
  onMount(() => {
    $colors = ['#ffffff'];
    $N = 100;
  });
</script>

<svelte:head>
  <title>Fluid Simulation</title>
</svelte:head>

<main class="responsive-grid">
  <div class="side">
    <div>
      Resolution - <input
        type="range"
        bind:value={$N}
        min="20"
        max="200"
        step="10"
      />
    </div>

    {#each $colors as color, index (index)}
      <div class="color" class:selected={currentColorIndex === index}>
        Color-{index}
        <input
          type="color"
          value={color}
          on:change={(e) => {
            $colors[index] = e.target.value;
            currentColorIndex = index;
          }}
        />
        <button
          on:click={() => {
            currentColorIndex = index;
          }}>Use</button
        >
        <button
          on:click={() => {
            $colors.splice(index, 1);
            $colors = $colors;
          }}>Remove</button
        >
      </div>
    {/each}
    <button
      on:click={() => {
        $colors.push('black');
        currentColorIndex = $colors.length - 1;
        $colors = $colors;
      }}>Add Color</button
    >
  </div>
  <div class="bottom">
    <div>Made by Rylox</div>
  </div>
  <div class="root">
    <canvas
      bind:this={$canvas}
      on:mousemove={(e) => {
        const canvas = e.target;
        const rect = canvas.getBoundingClientRect();
        const scaleX = canvas.width / rect.width;
        const scaleY = canvas.height / rect.height;
        const x = (e.clientX - rect.left) * scaleX;
        const y = (e.clientY - rect.top) * scaleY;
        simulation.update(Math.floor(x), Math.floor(y), currentColorIndex);
      }}
    />
    <div class="controls">
      <button
        on:click={() => {
          $simulating = !$simulating;
        }}>{$simulating ? 'Stop' : 'Play'}</button
      >
      <button
        on:click={() => {
          simulation.reset();
        }}>Reset</button
      >
    </div>
  </div>
</main>

<style>
  main {
    height: 100vh;
    margin: 0 auto;
    place-content: center;
    grid-template-columns: max-content 1fr;
    grid-template-rows: 1fr min-content;
    gap: 1rem;
  }
  .bottom {
    grid-area: 2/1/3/2;
    padding: 1rem;
  }
  .side {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 8px;
  }
  .side > * {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 1rem;
    border-radius: 10px;
    white-space: nowrap;
  }
  .color.selected {
    border: 2px solid rgb(0, 124, 165);
  }
  .controls {
    position: absolute;
    top: 0;
    left: 0;
  }
  .root {
    position: relative;
    height: 100%;
    max-height: 100vh;
    width: 100%;
    max-width: 100vw;
    grid-area: 1/2/-1/-1;
  }
  canvas {
    height: 100%;
    width: 100%;
  }
  input[type='color'],
  button {
    height: 2.5rem;
  }
</style>
