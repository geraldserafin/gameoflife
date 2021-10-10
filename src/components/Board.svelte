<script>
  import BoardPlayground from "./BoardPlayground.svelte";

  export let currentBrush;
  let resolution = 30;

  const resolutionUp = () => {
    resolution += 50;
    console.log(resolution);
  };

  const resolutionDown = () => {
    resolution -= resolution >= 100 ? 50 : 10;
  };
</script>

<div>
  {#key resolution}
    <BoardPlayground {resolution} {currentBrush}>
      <span>
        resolution
        <button on:click={resolutionDown}>-</button>
        <button on:click={resolutionUp}>+</button>
      </span>
    </BoardPlayground>
  {/key}
</div>
