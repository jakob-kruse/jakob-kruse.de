<script lang="ts">
	import { useScrollPercent } from '$lib/utils';
	import { fly } from 'svelte/transition';
	import { buttonVariants } from './ui/button';

	const scrollPercent = useScrollPercent();
</script>

{#if $scrollPercent > 75}
	<button
		transition:fly={{ y: 100 }}
		class={buttonVariants({
			variant: 'secondary',
			class: 'fixed bottom-4 right-4'
		})}
		on:click={() => {
			window.scrollTo({
				top: 0,
				behavior: 'smooth'
			});
		}}>Back to top</button
	>
{/if}
