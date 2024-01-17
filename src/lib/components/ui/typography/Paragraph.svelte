<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<p class={cn('leading-7 [&:not(:first-child)]:mt-6', className)}>
	<slot />
</p>
