<script lang="ts">
  import MainView from './components/MainView.svelte';
  import { simulationsComponents, SimulationType } from './enums';
  import { title } from './diver';
  import Button from './components/Button.svelte';

  let selectedSimulationType = SimulationType.WEBGL2;
  $: $title = simulationsComponents[selectedSimulationType].title;
  const buttonClass =
    'h-full border-b-8 border-primary-200 border-opacity-0 hover:border-opacity-100 duration-200 transition-colors';
  const bottomClass = 'flex place-self-center self-center h-full w-full';
</script>

<svelte:head>
  <title>{$title}</title>
</svelte:head>
<main class="bg-primary-900 min-h-screen text-secondary-500 font-roboto">
  <MainView>
    <div slot="root" class="h-screen">
      <svelte:component
        this={simulationsComponents[selectedSimulationType].component}
      />
    </div>
    <div slot="sidetop">
      <svelte:component
        this={simulationsComponents[selectedSimulationType].configComponent}
      />
    </div>
    <div slot="sidebottom" class={bottomClass}>
      <Button
        className="w-full font-lato text-lg"
        selected={selectedSimulationType === SimulationType.WEBGL2}
        on:click={() => (selectedSimulationType = SimulationType.WEBGL2)}
        >Webgl</Button
      >
      <Button
        className={'w-full font-lato text-lg'}
        selected={selectedSimulationType === SimulationType.CANVAS2D}
        on:click={() => (selectedSimulationType = SimulationType.CANVAS2D)}
        >Canvas2D</Button
      >
    </div>
  </MainView>
</main>

<style global>
  :not(.show-scrollbar)::-webkit-scrollbar {
    display: none;
  }
  ::-webkit-scrollbar {
    width: 5px;
    height: 5px;
  }
  ::-webkit-scrollbar-thumb {
    background-color: currentColor;
    border-radius: 10px;
  }
</style>
