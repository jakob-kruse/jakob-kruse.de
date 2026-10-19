<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import { Button } from '$lib/components/ui/button';
	import Heading2 from '$lib/components/ui/typography/Heading2.svelte';
</script>

<section class="container mx-auto flex flex-col gap-6 px-8 py-12" aria-label="What I build">
	<Heading2>What I build</Heading2>

	<p class="max-w-2xl leading-7 text-muted-foreground">
		Most of my current work isn’t public. I build full-stack applications, developer tools, and
		integrations—with TypeScript at the center.
	</p>

	<div class="grid gap-4 md:grid-cols-3">
		<Card.Root>
			<Card.Header>
				<Card.Title>Web applications</Card.Title>
				<Card.Description class="leading-6">
					Interfaces and the systems behind them.
				</Card.Description>
			</Card.Header>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Developer tooling</Card.Title>
				<Card.Description class="leading-6">
					Tools that make everyday work simpler.
				</Card.Description>
			</Card.Header>
		</Card.Root>

		<Card.Root>
			<Card.Header>
				<Card.Title>Integrations &amp; automation</Card.Title>
				<Card.Description class="leading-6">
					Connecting services and removing repetitive work.
				</Card.Description>
			</Card.Header>
		</Card.Root>
	</div>

	<div
		class="flex flex-col items-start gap-4 border-t pt-6 sm:flex-row sm:items-center sm:justify-between"
	>
		<p class="text-lg font-medium">Have something in mind?</p>
		<Button href="mailto:contact@jakob-kruse.de">Let’s talk</Button>
	</div>
</section>
