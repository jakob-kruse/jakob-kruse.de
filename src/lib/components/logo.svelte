<script lang="ts">
	import { tether, type TetherShape } from '$lib/tether';
	import { cn } from '$lib/utils';

	let { class: className = '' }: { class?: string } = $props();

	const STROKE = 12;
	const PAD = STROKE / 2;

	// The four pieces of the logo (400×400 artboard). Each one is its own panel.
	// The four pieces of the logo (400×400 artboard). Each one is its own panel.
	const pieces = [
		{
			d: 'M121.14,101.34 L186.00,36.49 L186.00,166.20 Z',
			points: [
				[121.14, 101.34],
				[186, 36.49],
				[186, 166.2]
			]
		},
		{
			d: 'M214.00,36.49 L363.51,186.00 L214.00,186.00 Z',
			points: [
				[214, 36.49],
				[363.51, 186],
				[214, 186]
			]
		},
		{
			d: 'M101.34,121.14 L22.49,200.00 L147.84,325.36 L221.04,252.16 A8.00,8.00 0 0 0 221.04,240.84 Z',
			points: [
				[101.34, 121.14],
				[22.49, 200],
				[147.84, 325.36],
				[221.04, 252.16],
				[223.38, 246.5],
				[221.04, 240.84]
			]
		},
		{
			d: 'M233.80,214.00 L363.51,214.00 L200.00,377.51 L167.64,345.16 L240.84,271.96 A36.00,36.00 0 0 0 240.84,221.04 Z',
			points: [
				[233.8, 214],
				[363.51, 214],
				[200, 377.51],
				[167.64, 345.16],
				[240.84, 271.96],
				[251.38, 246.5],
				[240.84, 221.04]
			]
		}
	].map(({ d, points }) => {
		const xs = points.map(([x]) => x);
		const ys = points.map(([, y]) => y);
		const x0 = Math.min(...xs) - PAD;
		const y0 = Math.min(...ys) - PAD;
		const viewBox: TetherShape['viewBox'] = [
			x0,
			y0,
			Math.max(...xs) + PAD - x0,
			Math.max(...ys) + PAD - y0
		];
		const shape: TetherShape = {
			d,
			viewBox,
			stroke: STROKE,
			points: points as [number, number][]
		};
		const pct = (v: number) => `${(v / 400) * 100}%`;
		const style = `position:absolute;left:${pct(viewBox[0])};top:${pct(viewBox[1])};width:${pct(viewBox[2])};height:${pct(viewBox[3])}`;
		return { shape, style };
	});
</script>

<div class={cn('relative aspect-square', className)} role="img" aria-label="Jakob Kruse logo">
	{#each pieces as { shape, style }, i (i)}
		<svg
			use:tether={shape}
			viewBox={shape.viewBox.join(' ')}
			{style}
			class="tether-piece overflow-visible"
			aria-hidden="true"
		>
			<path
				d={shape.d}
				fill="currentColor"
				stroke="currentColor"
				stroke-width={shape.stroke}
				stroke-linejoin="round"
			/>
		</svg>
	{/each}
</div>
