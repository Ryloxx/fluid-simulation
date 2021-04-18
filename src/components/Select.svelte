<script lang="ts">
  import { fly } from 'svelte/transition';

  export let items = [];
  export let value;
  export let label;
  export let rounded = true;
  let selected = '';
  let open = false;
  $: open = false && value;
  $: selected = items.find((item) => item.value === value)?.text || '';
</script>

<div
  class={`w-32 max-w-full relative bg-secondary-400 block capitalize mx-auto p-2 pt-2.5 text-primary-500 w-full min h-10 ${
    rounded ? 'rounded-tl-md rounded-tr-md' : ''
  }`}
>
  {#if label}
    <div
      class="hint bg-seconary-500 rounded-md border-primary-500 border transition-all duration-200"
      class:in={!selected}
    >
      {label}
    </div>
  {/if}
  <div class="mr-8">{selected}</div>
  <span
    class={`absolute bottom-0 material-icons p-2 right-0 top-0 cursor-pointer transform duration-100 ${
      open ? 'rotate-180' : ''
    }`}
    on:click={() => (open = !open)}
  >
    arrow_drop_down
  </span>
  {#if open}
    <div
      transition:fly={{ y: -10, duration: 100 }}
      class="absolute top-full left-0 bg-secondary-400 w-full z-20 border-t border-primary-200"
    >
      {#each items as item, index (index)}
        <div
          value={item.value}
          on:click={() => (value = item.value)}
          class="cursor-pointer duration-200 hover:bg-secondary-200 p-2 h-full w-full"
        >
          {item.text}
        </div>
      {/each}
    </div>
  {/if}
</div>

<style global>
  .hint {
    position: absolute;
    top: 0;
    left: 1rem;
    padding: 0 0.2rem;
    transform: translateY(-50%);
    font-size: 0.6rem;
  }
  .hint.in {
    top: 50%;
    padding: 0 0.4rem;
    transform: translateY(-50%);
    font-size: 1rem;
  }
</style>
