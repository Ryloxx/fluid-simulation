<script lang="ts">
  export let selected = false;
  export let className = '';
</script>
<button
  on:click
  class={`${className} h-full border-b-2 border-secondary-500 bg-primary-200 border-opacity-0 hover:border-opacity-100 duration-200 transition-colors p-2 ${
    selected
      ? 'border-secondary-900 bg-primary-900 cursor-auto'
      : 'border-secondary-500 bg-primary-200'
  }`}><slot /></button
>
