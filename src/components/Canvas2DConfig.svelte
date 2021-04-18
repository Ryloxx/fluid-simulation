<script lang="ts">
  import { colors, N } from '../canvas2dsimulation/simulation';
  import { canvas2DConfig } from '../diver';
  import ColorChoice from './ColorChoice.svelte';
  import Select from './Select.svelte';
  const resolutionOptions = [
    { value: 200, text: 'high' },
    { value: 100, text: 'medium' },
    { value: 50, text: 'low' },
  ];
</script>

<div>
  <Select label="Quality" items={resolutionOptions} bind:value={$N} />
  <ColorChoice
    max={2}
    bind:colors={$colors}
    bind:currentColorIndex={$canvas2DConfig.currentColorIndex}
  />
</div>
