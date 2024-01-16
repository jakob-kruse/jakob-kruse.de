<script lang="ts">
	import { browser } from '$app/environment';
	import { cursorPos } from '$lib';
	import { debouncedPlayNote } from '$lib/audio';
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';
	import { cubicInOut } from 'svelte/easing';
	import { tweened } from 'svelte/motion';

	let element: HTMLDivElement;

	let curP = tweened(
		{ x: 0, y: 0 },
		{
			duration: 10,
			easing: cubicInOut
		}
	);

	let context: AudioContext;

	onMount(() => {
		if (!browser) return;
		context = new AudioContext();
		return cursorPos.subscribe(({ x, y }) => {
			curP.set({ x: (x / window.innerWidth) * 100, y: (y / window.innerHeight) * 100 });
		});
	});
</script>

<div class="container flex flex-col gap-2">
	{#each [200, 400] as note}
		<div class="h-8 w-full bg-black" on:mouseenter={() => debouncedPlayNote(note)}></div>
	{/each}
</div>
