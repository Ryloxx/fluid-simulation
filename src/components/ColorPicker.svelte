<script lang="ts">
  export let value = '';
  const id = '' + Math.random() * Math.random();
</script>

<div class="flex gap-2">
  <label for={id} class="material-icons cursor-pointer">colorize</label>
  <div class="relative block h-6 rounded-sm w-10 border">
    <div
      class="h-full w-full"
      style={`background-color:${value};border-color:currentcolor;`}
    />
    <input
      {id}
      type="color"
      class="opacity-0 h-full w-full absolute top-0 left-0 cursor-pointer"
      bind:value
      on:input
      on:change
    />
  </div>
</div>
