<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import * as Tooltip from '$lib/components/ui/tooltip';
	import ViewportHeight from '$lib/components/viewport-height.svelte';
	import { copyText } from 'svelte-copy';
	import LucideCopy from '~icons/lucide/copy';
	import LucideGithub from '~icons/lucide/github';
	import LucideLinkedin from '~icons/lucide/linkedin';
	import LucideMail from '~icons/lucide/mail';

	let email = 'contact@jakob-kruse.de';
</script>

<ViewportHeight percentage={75} class="flex flex-col items-center justify-center">
	<h1 class="scroll-m-20 text-center text-4xl font-extrabold tracking-tight lg:text-5xl">
		Jakob Kruse
	</h1>

	<p class="text-center leading-7 [&:not(:first-child)]:mt-6">
		Full-Stack Developer from Vienna, Austria.
	</p>

	<div class="mt-6 flex flex-col gap-2 md:flex-row">
		<Button href="https://github.com/jakob-kruse" size="lg">
			<LucideGithub class="mr-2 h-4 w-4" />
			<span> GitHub </span>
		</Button>

		<Button href="https://www.linkedin.com/in/jakob-kruse/" size="lg">
			<LucideLinkedin class="mr-2 h-4 w-4" />
			<span> LinkedIn </span>
		</Button>

		<Tooltip.Root>
			<Tooltip.Trigger asChild let:builder>
				<Button builders={[builder]} href="mailto:{email}" size="lg">
					<LucideMail class="mr-2 h-4 w-4" />
					<span>Email</span>
				</Button>
			</Tooltip.Trigger>
			<Tooltip.Content side="bottom" class="flex items-center gap-2 p-2">
				<p>{email}</p>
				<button on:click={() => copyText(email)}>
					<LucideCopy class="mr-2 h-4 w-4" />
				</button>
			</Tooltip.Content>
		</Tooltip.Root>
	</div>
</ViewportHeight>
