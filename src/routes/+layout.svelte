<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.pcss';
	import { cursorPos } from '$lib';

	function updateCursorPosition(event: MouseEvent) {
		cursorPos.set({ x: event.clientX, y: event.clientY });
	}

	function updateTouchPosition(event: TouchEvent) {
		cursorPos.set({ x: event.touches[0].clientX, y: event.touches[0].clientY });
	}

	onMount(() => {
		window.addEventListener('mousemove', updateCursorPosition);
		window.addEventListener('touchmove', updateTouchPosition);

		return () => {
			window.removeEventListener('mousemove', updateCursorPosition);
			window.removeEventListener('touchmove', updateTouchPosition);
		};
	});
</script>

<slot />

<svelte:head>
	<title>Jakob Kruse</title>
	<meta name="description" content="Jakob Kruse's personal website" />
</svelte:head>
