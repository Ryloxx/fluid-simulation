<script>
  import { fade, fly, scale } from 'svelte/transition';
  import ColorPicker from './ColorPicker.svelte';

  export let colors;
  export let currentColorIndex;
  export let max = 6;
  export let onInput = false;
  function handle(e, index) {
    colors[index] = e.target.value;
    currentColorIndex = index;
  }
</script>

<article class="flex flex-wrap justify-around my-4">
  {#each colors as color, index (index)}
    <div
      in:fly|local={{ x: -10 }}
      class={`flex justify-between p-2 w-56 max-w-full ${
        index === currentColorIndex
          ? 'bg-primary-200 rounded-sm text-secondary-500'
          : ''
      }`}
    >
      {#if onInput}
        <ColorPicker value={color} on:input={(e) => handle(e, index)} />
      {:else}
        <ColorPicker value={color} on:change={(e) => handle(e, index)} />
      {/if}
      <button
        class="material-icons"
        on:click={() => {
          currentColorIndex = index;
        }}>ads_click</button
      >
      <button
        class="material-icons align-middle"
        on:click={() => {
          colors.splice(index, 1);
          colors = colors;
          currentColorIndex = Math.min(colors.length - 1, currentColorIndex);
        }}>remove_circle_outlined</button
      >
    </div>
  {/each}

  {#if colors.length < max}
    <button
      in:scale|local={{ start: 0.1 }}
      class="material-icons block mx-auto p-2 w-full"
      on:click={() => {
        colors.push('#ffffff');
        colors = colors;
        currentColorIndex = colors.length - 1;
      }}>add_circle</button
    >
  {/if}
</article>
