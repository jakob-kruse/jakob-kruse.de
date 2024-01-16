<script lang="ts">
	import Blob from '$lib/hero/blob.svelte';
	import { Button } from '$lib/components/ui/button';
	import { onMount } from 'svelte';
	import Mail from 'lucide-svelte/icons/mail';
	import Copy from 'lucide-svelte/icons/copy';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import { copyText } from 'svelte-copy';

	let email = 'contact@jakob-kruse.de';
</script>

<div class="flex flex-col items-center">
	<h1
		class="pointer-events-none select-none scroll-m-20 text-center text-4xl font-extrabold tracking-tight lg:text-5xl"
	>
		Jakob Kruse
	</h1>

	<p class="select-none text-center leading-7 [&:not(:first-child)]:mt-6">
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
