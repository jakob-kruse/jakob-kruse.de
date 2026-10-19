import * as Alchemy from 'alchemy';
import * as Cloudflare from 'alchemy/Cloudflare';
import * as Effect from 'effect/Effect';

export default Alchemy.Stack(
	'jakob-kruse-de',
	{
		providers: Cloudflare.providers(),
		state: Cloudflare.state()
	},
	Effect.gen(function* () {
		const stack = yield* Alchemy.Stack;
		const site = yield* Cloudflare.Website.StaticSite('Website', {
			command: 'bun run build',
			outdir: 'build',
			domain:
				stack.stage === 'prod'
					? { name: 'jakob-kruse.de', zoneId: '404a1d6aea4469b7ccd78644585740a5' }
					: undefined,
			assets: { notFoundHandling: '404-page' }
		});
		return { url: site.url };
	})
);
