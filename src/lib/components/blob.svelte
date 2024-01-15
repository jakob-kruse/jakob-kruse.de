<script lang="ts">
	import { browser } from '$app/environment';
	import { cursorPos } from '$lib';
	import { fade, scale } from 'svelte/transition';

	export let initialX = 400;
	export let initialY = 400;
	export let color = 'hsl(0, 100%, 50%)';
	export let size = 128;
	export let initialVelocityX = 0;
	export let initialVelocityY = 0;

	let z = Math.random() * 100 - 50;

	let x = initialX;
	let y = initialY;
	let velocityX = initialVelocityX;
	let velocityY = initialVelocityY;

	let frameId: number;

	function updatePosition() {
		const { x: cX, y: cY } = $cursorPos;
		const distance = Math.sqrt((cX - x) ** 2 + (cY - y) ** 2);

		if (distance < size * 1.5) {
			const speed = Math.pow(1 - distance / (size * 1.5), 2);
			const angle = Math.atan2(cY - y, cX - x);

			velocityX -= Math.cos(angle) * speed;
			velocityY -= Math.sin(angle) * speed;
		}

		x += velocityX;
		y += velocityY;

		velocityX *= 0.99;
		velocityY *= 0.99;

		if (x < size / 2 || x > window.innerWidth - size / 2) {
			velocityX *= -1;
		}
		if (y < size / 2 || y > window.innerHeight - size / 2) {
			velocityY *= -1;
		}

		frameId = requestAnimationFrame(updatePosition);
	}

	$: if (browser) {
		frameId = requestAnimationFrame(updatePosition);
	}
</script>

<div
	style="width: {size}px; height: {size}px; transform: translate({x - size / 2}px, {y -
		size / 2}px); background-color: {color}; z-index: {z};"
	class="pointer-events-none fixed left-0 top-0 rounded-full opacity-70 blur-xl filter transition-opacity duration-1000"
	in:fade
></div>
