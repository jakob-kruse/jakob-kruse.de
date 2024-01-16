<script lang="ts">
	import Blob from '$lib/hero/blob.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import Mail from 'lucide-svelte/icons/mail';
	import Copy from 'lucide-svelte/icons/copy';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { copyText } from 'svelte-copy';
	import { genColor } from '$lib/colors';
	import { debouncedPlayNote } from '$lib/audio';

	type BlobDef = {
		id: string;
		initialX: number;
		initialY: number;
		color: string;
		size: number;
		initialVelocityX?: number;
		initialVelocityY?: number;
	};

	let blobs: BlobDef[] = [];

	function randomSize(): number {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		const smallerScreenDimension = Math.min(screenWidth, screenHeight);

		const minSizeFactor = 0.1;
		const maxSizeFactor = 0.3;

		const minBlobSize = smallerScreenDimension * minSizeFactor;
		const maxBlobSize = smallerScreenDimension * maxSizeFactor;

		return Math.random() * (maxBlobSize - minBlobSize) + minBlobSize;
	}

	onMount(() => {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		blobs = Array.from({ length: Math.floor(screenWidth / 25) }, () => ({
			id: Math.random().toString(36).substr(2, 9),
			initialX: Math.random() * screenWidth,
			initialY: Math.random() * screenHeight,
			color: genColor(),
			size: randomSize()
		}));

		document.addEventListener('click', addBlob);

		return () => {
			document.removeEventListener('click', addBlob);
		};
	});

	function addBlob(event: MouseEvent) {
		const { x, y } = event;
		const size = randomSize();
		blobs = [
			...blobs,
			{
				id: Math.random().toString(36).substr(2, 9),
				initialX: x,
				initialY: y,
				color: genColor(),
				size,
				initialVelocityX: Math.random() * 10 - 5,
				initialVelocityY: Math.random() * 10 - 5
			}
		];

		debouncedPlayNote(600 - size * 1.2);
	}
</script>

{#each blobs as blob (blob.id)}
	<Blob {...blob} />
{/each}
