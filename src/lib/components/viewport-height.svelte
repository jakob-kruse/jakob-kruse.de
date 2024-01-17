<script lang="ts">
	import { cn } from '$lib/utils';
	import { onMount } from 'svelte';

	export let percentage = 100;
	export let container = false;

	let height = `${percentage}vh`;

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

	let className = '';
	export { className as class };
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
	<slot />
</section>
