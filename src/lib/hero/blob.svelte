<script lang="ts">
	import { browser } from '$app/environment';
	import { cursorPos, scrollPos } from '$lib';
	import { fade } from 'svelte/transition';

	export let id: string;
	export let initialX = 400;
	export let initialY = 400;
	export let color = 'hsl(0, 100%, 50%)';
	export let size = 128;
	export let initialVelocityX = 0;
	export let initialVelocityY = 0;

	let dirty = false;
	let justBounced = false;

	let z = Math.random() * 100 - 50;

	let x = initialX;
	let y = initialY;
	let velocityX = initialVelocityX;
	let velocityY = initialVelocityY;
	let blur = z + 30;

	let frameId: number;

	$: isHidden = $scrollPos + velocityX * velocityY > 0.15;

	function updatePosition() {
		const { x: cX, y: cY } = $cursorPos;
		const distance = Math.sqrt((cX - x) ** 2 + (cY - y) ** 2);

		if (distance < size * 1) {
			const speed = Math.pow(1 - distance / (size * 1.5), 2);
			const angle = Math.atan2(cY - y, cX - x);

			velocityX -= Math.cos(angle) * speed;
			velocityY -= Math.sin(angle) * speed;
			dirty = true;
		}

		x += velocityX;
		y += velocityY;

		velocityX *= 0.99;
		velocityY *= 0.99;

		if (x < size / 2 || x > window.innerWidth - size / 2) {
			velocityX *= -1;
			justBounced = true;
		}
		if (y < size / 2 || y > window.innerHeight - size / 2) {
			velocityY *= -1;
			justBounced = true;
		}

		if (Math.abs(velocityX) < 0.1 && Math.abs(velocityY) < 0.1) {
			velocityX = 0;
			velocityY = 0;
			dirty = false;
		}
		frameId = requestAnimationFrame(updatePosition);
	}

	$: if (browser) {
		frameId = requestAnimationFrame(updatePosition);
	}
</script>

<div
	style="width: {size}px; height: {size}px; transform: translate({x - size / 2}px, {y -
		size / 2}px); background-color: {color}; z-index: {z}; filter: blur({blur}px)"
	class="pointer-events-none fixed left-0 top-0 rounded-full filter"
	in:fade
></div>
