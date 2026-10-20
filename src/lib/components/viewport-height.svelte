<script lang="ts">
	import { cn } from '$lib/utils';
	import type { Snippet } from 'svelte';

	type Props = {
		percentage?: number;
		container?: boolean;
		class?: string;
		children: Snippet;
	};

	let { percentage = 100, container = false, class: className, children }: Props = $props();
</script>

<!-- svh is the viewport with mobile browser toolbars shown; unlike window.innerHeight it
     does not change while the toolbars slide away during scrolling, so the page below
     doesn't shift. -->
<section
	style="min-height: {percentage}svh"
	class={cn(
		{
			'container mx-auto px-8 py-12': container
		},
		className
	)}
>
	{@render children()}
</section>
