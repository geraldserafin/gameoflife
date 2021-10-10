<script>
	import { brushes } from '../utils/brushes';
import BrushPreview from './BrushPreview.svelte';

  export let currentBrush;
</script>

<div class="col toolbox">
  <span>patterns</span>
  {#each brushes as brush}
  <div class="toolbox-section">
      <div class="col">
        {#each brush.brushes as bru}
          <button on:click={() => currentBrush = bru.shape}>
            <BrushPreview shape={bru.shape} />
          </button>
        {/each}
      </div>
    </div>
  {/each}
</div>

<style>
  .toolbox {
		flex-wrap: wrap;
		padding: 2em;
	}

  button {
    width: fit-content;
    margin: 0 auto 0 auto;
    /* padding: 5px; */
    border: 0.3px solid rgba(255, 255, 255, 0.1);
    margin-bottom: 5px;
  }

  span {
    border: none;
  }
</style>