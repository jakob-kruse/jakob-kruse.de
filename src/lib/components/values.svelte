<script lang="ts">
	import Blockquote from '$lib/components/ui/typography/Blockquote.svelte';
	import Heading2 from '$lib/components/ui/typography/Heading2.svelte';
	import Heading3 from '$lib/components/ui/typography/Heading3.svelte';
	import Paragraph from '$lib/components/ui/typography/Paragraph.svelte';
</script>

<div class="contaienr mx-auto px-8 py-12">
	<Heading2 class="mb-8">My core values</Heading2>
	<Heading3>Accessibility: Web for Everyone</Heading3>
	<Paragraph class="mb-8">
		The Web should be a safe space for everyone! Your abilities or circumstances should not stop you
		from accessing content like everyone else. Modern browsers do a great job of providing required
		features, but the responsibility of making the web accessible still lies with the developer. I
		try to make my apps as accessible as possible by following the latest standards and best
		practices.
	</Paragraph>

	<Heading3>Speed: Performance Meets Efficiency</Heading3>
	<Blockquote>
		Google: 53% of mobile users abandon sites that take over 3 seconds to load
	</Blockquote>

	<Paragraph class="mb-8">
		Performance factors into many aspects of a web app. Not only does it affect the user experience
		and conversion rates, but it also impacts the search engine rankings. I make sure that my apps
		are efficient by avoiding excessive JavaScript and CSS, optimizing images, and using the latest
		techniques to improve performance.
	</Paragraph>

	<Heading3>Modern Technologies: Staying Ahead of the Curve</Heading3>
	<Paragraph class="mb-8">
		The web is constantly evolving, it takes a great deal of effort to stay up to date with the
		latest technologies. I'm not afraid to challenge the status quo and try out new things. The
		cutting edge comes with the risk of... well... cutting yourself. We must always be mindful of
		the stability of our tools, to stay safe.
	</Paragraph>
</div>
