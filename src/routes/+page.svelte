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

	onMount(() => {
		const screenWidth = window.innerWidth;
		const screenHeight = window.innerHeight;

		blobs = Array.from({ length: 20 }, () => ({
			initialX: Math.random() * screenWidth,
			initialY: Math.random() * screenHeight,
			color: `hsl(${Math.random() * 360}, 100%, 50%)`,
			size: Math.random() * 128 + 64
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
				size: Math.random() * 128 + 128,
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

	<Tooltip.Root>
		<Tooltip.Trigger asChild let:builder>
			<Button builders={[builder]} href="mailto:{email}" class="my-2">
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

	{#each blobs as blob}
		<Blob {...blob} />
	{/each}
</div>
