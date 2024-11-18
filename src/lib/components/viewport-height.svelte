<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount, type Snippet } from 'svelte';

	type Props = {
		percentage?: number;
		container?: boolean;
		class?: string;
		children: Snippet;
	};

	let { percentage = 100, container = false, class: className, children }: Props = $props();

	let height = $state(`${percentage}vh`);

	onMount(() => {
		const updateHeight = () => {
			height = `${window.innerHeight * (percentage / 100)}px`;
		};

		window.addEventListener('resize', updateHeight);
		updateHeight();

		return () => {
			window.removeEventListener('resize', updateHeight);
		};
	});
</script>

<section
	style="min-height: {height}"
	class={cn(
		{
			'container mx-auto px-8 py-12': container
		},
		className
	)}
>
	{@render children()}
</section>
