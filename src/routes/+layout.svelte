<script lang="ts">
	import { onMount } from 'svelte';
	import '../app.pcss';
	import { cursorPos, scrollPos } from '$lib';

	function updateCursorPosition(event: MouseEvent) {
		cursorPos.set({ x: event.clientX, y: event.clientY });
	}

	function updateTouchPosition(event: TouchEvent) {
		cursorPos.set({ x: event.touches[0].clientX, y: event.touches[0].clientY });
	}

	function updateHeight() {
		let vh = window.innerHeight * 0.01;
		document.documentElement.style.setProperty('--vh', `${vh}px`);
	}

	function updateScroll() {
		const scroll = window.scrollY / window.innerHeight;
		document.documentElement.style.setProperty('--scroll', `${scroll}px`);
		scrollPos.set(scroll);
	}

	onMount(() => {
		window.addEventListener('mousemove', updateCursorPosition);
		window.addEventListener('touchmove', updateTouchPosition);
		window.addEventListener('resize', updateHeight);
		updateHeight();
		updateScroll();

		window.addEventListener('scroll', updateScroll);

		return () => {
			window.removeEventListener('mousemove', updateCursorPosition);
			window.removeEventListener('touchmove', updateTouchPosition);
			window.removeEventListener('resize', updateHeight);
			window.removeEventListener('scroll', updateScroll);
		};
	});
</script>

<svelte:head>
	<title>Jakob Kruse</title>
	<meta name="description" content="Jakob Kruse's personal website" />
</svelte:head>

<slot />
