<script lang="ts">
	import Hero from '$lib/components/hero.svelte';
	import ScrollToTopButton from '$lib/components/scroll-to-top-button.svelte';
	import Showcase from '$lib/components/showcase/showcase.svelte';
	import { WiringLayer } from '$lib/tether';
</script>

<div class="relative min-h-screen overflow-clip">
	<Hero />

	<Showcase />

	<WiringLayer />
</div>

<ScrollToTopButton />
