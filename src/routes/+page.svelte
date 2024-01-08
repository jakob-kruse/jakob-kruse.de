<script lang="ts">
	import Blob from '$lib/components/blob.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import { Mail, Copy } from 'lucide-svelte';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { copyText } from 'svelte-copy';

	let email = 'contact@jakob-kruse.de';

	type BlobDef = {
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

		// Determine the smaller dimension of the screen
		const smallerScreenDimension = Math.min(screenWidth, screenHeight);

		// Define the range for blob sizes as a proportion of the screen size
		// Adjust these factors to control the size range relative to the screen size
		const minSizeFactor = 0.1; // Minimum size as a fraction of the smaller screen dimension
		const maxSizeFactor = 0.3; // Maximum size as a fraction of the smaller screen dimension

		// Calculate minimum and maximum blob sizes
		const minBlobSize = smallerScreenDimension * minSizeFactor;
		const maxBlobSize = smallerScreenDimension * maxSizeFactor;

		// Return a random size between minBlobSize and maxBlobSize
		return Math.random() * (maxBlobSize - minBlobSize) + minBlobSize;
	}

	onMount(() => {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		blobs = Array.from({ length: Math.floor(screenWidth / 25) }, () => ({
			initialX: Math.random() * screenWidth,
			initialY: Math.random() * screenHeight,
			color: `hsl(${Math.random() * 360}, 100%, 50%)`,
			size: randomSize()
		}));
		document.addEventListener('click', addBlob);

		return () => {
			document.removeEventListener('click', addBlob);
		};
	});

	function addBlob(event: MouseEvent) {
		const { x, y } = event;
		blobs = [
			...blobs,
			{
				initialX: x,
				initialY: y,
				color: `hsl(${Math.random() * 360}, 100%, 50%)`,
				size: randomSize(),
				initialVelocityX: Math.random() * 10 - 5,
				initialVelocityY: Math.random() * 10 - 5
			}
		];
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center overflow-hidden">
	<h1 class="pointer-events-none scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
		Jakob Kruse
	</h1>

	<p class="leading-7 [&:not(:first-child)]:mt-6">
		I'm a Full-Stack Developer from Vienna, Austria.
	</p>

	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button builders={[builder]} href="mailto:{email}" class="mt-6">
				<Mail class="mr-2 h-4 w-4" />
				<span>Email me</span>
			</Button>
		</Tooltip.Trigger>
		<Tooltip.Content side="bottom" class="flex items-center gap-2 p-2">
			<p>{email}</p>
			<button on:click={() => copyText(email)}>
				<Copy class="mr-2 h-4 w-4" />
			</button>
		</Tooltip.Content>
	</Tooltip.Root>
</div>

{#each blobs as blob}
	<Blob {...blob} />
{/each}
