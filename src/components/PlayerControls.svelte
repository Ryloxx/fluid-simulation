<script>
  import { createEventDispatcher } from 'svelte';
  import Button from './Button.svelte';

  export let play = false;
  const dispatch = createEventDispatcher();
</script>

<Button
  className="material-icons"
  on:click={() => {
    play = !play;
  }}>{play ? 'pause' : 'play_arrow'}</Button
>
<Button className="material-icons" on:click={() => dispatch('reset')}
  >restart_alt</Button
>
