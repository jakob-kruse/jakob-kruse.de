<script lang="ts">
	import Blob from '$lib/components/blob.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import Mail from 'lucide-svelte/icons/mail';
	import Copy from 'lucide-svelte/icons/copy';
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

	const colors_1 = [
		'#FF6384',
		'#36A2EB',
		'#FFCE56',
		'#4BC0C0',
		'#9966FF',
		'#FF9F40',
		'#FFCD56',
		'#FF6384',
		'#36A2EB',
		'#FFCE56',
		'#4BC0C0',
		'#9966FF',
		'#FF9F40',
		'#FFCD56'
	];

	const colors_2 = [
		'#FF6384',
		'#36A2EB',
		'#FFCE56',
		'#4BC0C0',
		'#9966FF',
		'#FF9F40',
		'#FFCD56',
		'#FF6384',
		'#36A2EB',
		'#FFCE56',
		'#4BC0C0',
		'#9966FF',
		'#FF9F40',
		'#FFCD56'
	];

	const colors_3 = [
		'#FF6384',
		'#4BC0C0',
		'#FFD700',
		'#32CD32',
		'#4169E1',
		'#FFA07A',
		'#BA55D3',
		'#20B2AA',
		'#FF4500',
		'#DA70D6',
		'#7FFFD4',
		'#87CEEB',
		'#FFDAB9',
		'#FA8072',
		'#6A5ACD'
	];

	const colors = [...colors_1, ...colors_2, ...colors_3];

	function genColor() {
		return colors[Math.floor(Math.random() * colors.length)];
	}

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
		blobs = [
			...blobs,
			{
				initialX: x,
				initialY: y,
				color: genColor(),
				size: randomSize(),
				initialVelocityX: Math.random() * 10 - 5,
				initialVelocityY: Math.random() * 10 - 5
			}
		];
	}
</script>

<div class="flex min-h-screen flex-col items-center justify-center overflow-hidden">
	<h1
		class="pointer-events-none scroll-m-20 text-center text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Jakob Kruse
	</h1>

	<p class="text-center leading-7 [&:not(:first-child)]:mt-6">
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
