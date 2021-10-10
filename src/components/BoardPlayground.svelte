<script>
  import { onDestroy, onMount } from "svelte";
  import { QuadTree, Rectangle } from "../logic/quadTree";
  import { nextGeneration, initializeRandomBoard} from "./../logic/gameOfLife";

  export let resolution;
  export let currentBrush;
  
  // states
  let boundary = new Rectangle(resolution/2, resolution/2, resolution, resolution);
  let board = new QuadTree(boundary, 1);

  let isRunning = true;
  let speed = 32;

  let canvas;
  let ctx;
  let interval;

  // camera
  let cameraWidth = 30; 
  let scale = 1;
  let currentOffset = 0

  // properties
	const screenSize = 1000; 
	const cellSize = screenSize/resolution;

  const makeInterval = () => {
    if (interval) clearInterval(interval);
    interval = setInterval(() => {
      board = nextGeneration(board);
      drawFrame();
    }, speed);
  };

  // Drawing
  const drawGrid = () => {
    let space = 1;
    if (resolution >= 40) {
      space = Math.round(resolution/33);
    }

		for(let i = 1; i < resolution+1; i+=space) {
			ctx.strokeStyle ="white";
			ctx.lineWidth = 0.08;

			ctx.beginPath();
			ctx.moveTo(i*cellSize*scale, 0);
			ctx.lineTo(i*cellSize*scale, screenSize);
			ctx.stroke();

			ctx.beginPath();
			ctx.moveTo(0, i*cellSize*scale);
			ctx.lineTo(screenSize, i*cellSize*scale);
			ctx.stroke();
		}
	};
	const drawFrame = () => {
		ctx.clearRect(0, 0, screenSize, screenSize);

    let cells = []
    board.query(board.boundary, cells);

    // console.log(cells);

    cells.forEach(cell => {
      if (cell.state == 1 ) {
        ctx.fillStyle = `rgba(255, 255, 255, ${Math.pow(1.0/cell.state, 1.2)})`;
			  ctx.fillRect(cell.x*cellSize, cell.y*cellSize, cellSize, cellSize);
      }
    });
    
		drawGrid();
	};
  const drawByHand = (evt) => {
    var rect = canvas.getBoundingClientRect();
    let x = Math.floor(((evt.clientY - rect.top) / (rect.bottom - rect.top) * canvas.height) / (cellSize*scale)) + 1;
    let y = Math.floor((evt.clientX - rect.left) / (rect.right - rect.left) * canvas.width / (cellSize*scale)) + 1;


    for(let i = 0; i < currentBrush.length; i++){
      for(let j = 0; j < currentBrush[i].length; j++) {
        if (currentBrush[i][j] > 0) {
          board.insert(new Cell(x+i-Math.floor(currentBrush.length/2), y+j-Math.floor(currentBrush[i].length/2), 1, 0));
        }
      }
    }
    drawFrame();
  };

  // UI
  const random = () => { 
    board = initializeRandomBoard(resolution);
    drawFrame();
  };
  const clear = () => { 
    board = new QuadTree(boundary, 1);
    drawFrame();
  };
  const startStop = () => {
    isRunning = !isRunning;

    if (!isRunning) clearInterval(interval);
    else makeInterval();
  };
  const speedUp = () => {
    speed -= speed/2 ;
    if (isRunning) makeInterval();
  };
  const speedDown = () => {
    if (speed > 0) {
      speed += speed*2;
      if (isRunning) makeInterval();
    }
  };

  // on mount
  onMount(() => {
    ctx = canvas.getContext('2d');

    canvas.addEventListener("click", (evt) => {
      drawByHand(evt);
    });

    canvas.onmousewheel = (event) => {
      event.preventDefault();
      const wheel = event.wheelDelta/120;
      if (wheel < 0) {
        if (scale > 1) {
          scale /= 2;
        }
      } else {
        scale *= 2;
      }
      console.log(scale);
      drawFrame();
    }
    drawFrame();

    if (isRunning) {
      startStop();
    }
  });

  // clear interval on destory
  onDestroy(() => {
    clearInterval(interval);
  });
</script>

<div>
  <canvas class="canvas" bind:this={canvas} width={screenSize} height={screenSize}></canvas>
  <div class="ui">
    <button on:click={random}>random</button>
    <button on:click={clear}>clear</button>
    <button on:click={startStop}>{ isRunning ? "stop" : "start"}</button>
    <span>
      speed
      <button on:click={speedDown}>-</button>
      <button on:click={speedUp}>+</button>
    </span>
    <slot></slot>
  </div>
</div>

<style>
  .canvas {
    max-width: 800px;
  }

  .ui {
    padding: 1em;
  }
</style>
