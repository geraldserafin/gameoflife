<script>
  import { onMount } from "svelte";

  export let shape;
  let canvas;
  let ctx;  

  const height = 24, 
        width  = 24;

  const draw = (shape) => {
    ctx.fillStyle = `white`;
    let cellWidth = width/shape.length;
    let cellHeigth = height/shape[0].length;

    if (cellHeigth < cellWidth) {
      cellWidth = cellHeigth
    } else {
      cellHeigth = cellWidth
    }

		for (let i = 0; i < shape.length; i++) {
			for (let j = 0; j < shape[i].length; j++) {
				if (shape[i][j] >= 1) {
					ctx.fillRect(j*cellHeigth, i*cellWidth, cellWidth, cellHeigth);
				}
			}
		}
	};

  onMount(() => {
    ctx = canvas.getContext("2d");
    draw(shape);
  })
</script>

<canvas bind:this={canvas} height={height} width={width}></canvas>
<!-- <div>{name}</div> -->