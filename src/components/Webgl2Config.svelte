<script lang="ts">
  import { Slider, Checkbox } from 'smelte';
  import { hexToRgb, webgl2Config, webgl2InteractiveConfig } from '../diver';
  import ColorChoice from './ColorChoice.svelte';
  import Select from './Select.svelte';
  let currentColorIndex = 0;
  let colors = ['#ffffff'];
  const resolutionOptions = [
    { value: $webgl2Config.baseResolution, text: 'high' },
    { value: $webgl2Config.baseResolution >> 1, text: 'medium' },
    { value: $webgl2Config.baseResolution >> 2, text: 'low' },
  ];
  let radius = 3;
  let pressure = 2;
  let speed = 5;
  let decayFactor = 2;
  let swirlFactor = 1;
  let bloomIntensity = 5;
  $: $webgl2Config.radius = radius / 100000;
  $: $webgl2Config.pressureFactor = pressure / 10;
  $: $webgl2Config.decayFactor = decayFactor / 5;
  $: $webgl2Config.swirlFactor = swirlFactor * 5;
  $: $webgl2Config.speed = (speed + 0.3) * 2;
  $: $webgl2InteractiveConfig.color = hexToRgb(colors[currentColorIndex]);
  $: $webgl2Config.bloomIntensity = bloomIntensity / 10;
</script>

<Select
  label="Quality"
  items={resolutionOptions}
  bind:value={$webgl2Config.currentResolution}
/>
<Slider min={0} max={10} bind:value={speed} label="Speed" />
<Slider min={1} max={10} bind:value={radius} label="Radius" />
<Slider min={0} max={10} bind:value={pressure} label="Pressure" />
<Slider min={0} max={20} bind:value={decayFactor} label="Decay" />
<Slider min={0} max={10} bind:value={swirlFactor} label="Swirl" />
<Slider min={0} max={10} bind:value={bloomIntensity} label="Bloom Intensity" />
<Checkbox
  bind:checked={$webgl2InteractiveConfig.multicolor}
  label="Multicolor"
/>
{#if !$webgl2InteractiveConfig.multicolor}
  <ColorChoice max={4} bind:colors bind:currentColorIndex onInput />
{/if}
