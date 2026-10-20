<script lang="ts">
	import { onMount } from 'svelte';
	import { mountCanvas } from './loader';
	import { integrity } from './state';

	let canvas: HTMLCanvasElement;

	onMount(() => mountCanvas(canvas));
</script>

<canvas bind:this={canvas} class="pointer-events-none absolute left-0 top-0 z-40" aria-hidden="true"
></canvas>

{#if $integrity === 'collapsing'}
	<div class="tether-alarm pointer-events-none fixed inset-0 z-[45]" aria-hidden="true"></div>
{/if}
