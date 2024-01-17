<script lang="ts">
	import * as Card from '$lib/components/ui/card';
	import LucideCircle from '~icons/lucide/circle';
	import LucideStar from '~icons/lucide/star';
	import LucideGitCommitVertical from '~icons/lucide/git-commit-vertical';
	import { Button } from '../ui/button';
	import { cn } from '$lib/utils';

	export let name: string;
	export let description: string;
	export let language: string;
	export let stars: number;
	export let updated: string;
	export let url: string;
	export let langIconClass = '';
</script>

<Card.Root>
	<Card.Header class="grid grid-cols-[1fr_110px] items-start gap-2 space-y-0">
		<a href={url} class="space-y-1">
			<Card.Title>{name}</Card.Title>
			<Card.Description>
				{description}
			</Card.Description>
		</a>
		<Button variant="outline" href={url}>
			<LucideStar class="mr-2 h-4 w-4" />
			Star
		</Button>
	</Card.Header>
	<Card.Content>
		<div class="flex space-x-4 text-sm text-muted-foreground">
			<div class="flex items-center">
				<LucideCircle class={cn('mr-1 h-3 w-3 ', langIconClass)} />
				{language}
			</div>

			<div class="flex items-center">
				<LucideStar class="mr-1 h-3 w-3" />
				{stars}
			</div>

			<div class="flex items-center">
				<LucideGitCommitVertical class="mr-1 h-3 w-3" />
				{updated}
			</div>
		</div>
	</Card.Content>
</Card.Root>
