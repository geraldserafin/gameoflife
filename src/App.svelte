<script>
	import Board from './components/Board.svelte';
	import Toolbox from './components/Toolbox.svelte';

	let currentBrush = [[1]];
</script>

<main>
	<h2>Conway's Game Of Life</h2>
	<div class="row">
		<Toolbox bind:currentBrush />
		<Board {currentBrush} />
	</div>
</main>

<style> 
	:global(body) {
		background-color: black;
		color: white;
		font-family: 'Courier Prime', monospace;
	}

	:global(button) {
		background-color: black;
		border: 0;
		color: white;
	}

	:global(button:active){
		color: black;
	}

	:global(span) {
		color: grey;
		padding: 0.6em;
		border: 0.5px solid lightgrey;
	}

	:global(.col) {
		display: flex;
		flex-flow: column;
		max-width: 700px;
		max-height: 700px;
	}

	main {
		text-align: center;
		padding: 1em;
		max-width: 240px;
		margin: 0 auto;

		display: flex;
		flex-flow: column;
		justify-content: space-around;
	}

	.row {
		display: flex;
		justify-content: space-between;
		margin: 0 auto 0 auto;
	}

	@media (min-width: 640px) {
		main {
			max-width: none;
		}
	}
</style>