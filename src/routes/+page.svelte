<script lang="ts">
	import Divider from '$lib/components/divider.svelte';
	import HeroBlobs from '$lib/hero/hero-blobs.svelte';
	import HeroContent from '$lib/hero/hero-content.svelte';
</script>

<HeroBlobs />

<div class="fixed inset-0 flex items-center justify-center">
	<HeroContent />
</div>
