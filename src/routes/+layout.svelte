<script lang="ts">
	import { Toaster } from '$lib/components/ui/sonner';
	import '../app.pcss';
	import '@fontsource/inter';
</script>

<svelte:head>
	<title>Jakob Kruse</title>
	<meta name="description" content="Jakob Kruse's personal website" />
</svelte:head>

<Toaster />

<slot />
