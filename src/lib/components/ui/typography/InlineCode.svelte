<script lang="ts">
	import { cn } from '$lib/utils';

	let className = '';
	export { className as class };
</script>

<code
	class={cn(
		'relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold',
		className
	)}
>
	<slot />
</code>
