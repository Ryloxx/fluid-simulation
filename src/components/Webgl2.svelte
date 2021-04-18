<script lang="ts">
  import { onDestroy, onMount } from 'svelte';
  import {
    makeInteractive,
    makePresetsAnimations,
  } from '../webglsimulation/main';
  import FluidSimulation from '../webglsimulation/simulation';
  import { webgl2Config } from '../diver';
  import PlayerControls from './PlayerControls.svelte';
  import Select from './Select.svelte';
  enum Webgl2PaintingTypes {
    FREEMODE = 'Free Mode',
    ARCS = 'Arcs',
    SPIRALS = 'Spiral',
    SPIRALS_REVERSED = 'Spiral reversed',
    LINE_DRIFT = 'Line drift',
    THRUST_COLLAPSE = 'Thrusts collapse',
    CORNER_THRUSTS = 'Corners thrusts',
    CHIMNEY = 'Chimney',
    FLAME = 'Flame',
    FLOOR = 'Floor',
  }
  let canvas: HTMLCanvasElement;
  let simulation: FluidSimulation;
  let interactivitySetter: (interactive: boolean) => void;
  let presetAnimations: ReturnType<typeof makePresetsAnimations>;

  let currentPaintingStyle = Webgl2PaintingTypes.FREEMODE;

  let playing = false;

  const unsub = webgl2Config.subscribe((s) => {
    if (s && simulation) simulation.config = s;
  });
  const selectOptions = Object.entries(Webgl2PaintingTypes).map(
    ([type, name]) => {
      return { text: name, value: name };
    },
  );
  $: simulation && (playing ? simulation.start() : simulation.pause());
  $: interactivitySetter &&
    interactivitySetter(currentPaintingStyle === Webgl2PaintingTypes.FREEMODE);
  $: currentPaintingStyle !== Webgl2PaintingTypes.FREEMODE &&
    playCurrentAnimation();
  function playCurrentAnimation() {
    switch (currentPaintingStyle) {
      case Webgl2PaintingTypes.ARCS:
        presetAnimations?.arcs.play(0);
        break;
      case Webgl2PaintingTypes.SPIRALS:
        presetAnimations?.spiral.play(0);
        break;
      case Webgl2PaintingTypes.SPIRALS_REVERSED:
        presetAnimations?.spiral.reverse(0);
        break;
      case Webgl2PaintingTypes.LINE_DRIFT:
        presetAnimations?.lineDrift.play(0);
        break;
      case Webgl2PaintingTypes.THRUST_COLLAPSE:
        presetAnimations?.thrustCollapse.play(0);
        break;
      case Webgl2PaintingTypes.CORNER_THRUSTS:
        presetAnimations?.cornerThrusts.play(0);
        break;
      case Webgl2PaintingTypes.CHIMNEY:
        presetAnimations?.chimney.play(0);
        break;
      case Webgl2PaintingTypes.FLAME:
        presetAnimations?.flame.play(0);
        break;
      case Webgl2PaintingTypes.FLOOR:
        presetAnimations?.floor.play(0);
        break;
    }
  }
  onMount(() => {
    simulation = new FluidSimulation(canvas);
    interactivitySetter = makeInteractive(simulation);
    presetAnimations = makePresetsAnimations(simulation);
  });
  onDestroy(() => {
    simulation?.pause();
    unsub();
  });
</script>

<div class="relative h-screen">
  <canvas class="h-full w-full" bind:this={canvas} />
  <div class="absolute top-0 left-0 flex">
    <div class="flex flex-col">
      <Select
        rounded={false}
        items={selectOptions}
        bind:value={currentPaintingStyle}
      />
      <PlayerControls
        bind:play={playing}
        on:reset={() => {
          simulation.reset();
          playCurrentAnimation();
        }}
      />
    </div>
  </div>
</div>
