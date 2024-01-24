<script lang="ts">
	import Repo from '$lib/components/showcase/repo.svelte';
	import Heading2 from '$lib/components/ui/typography/Heading2.svelte';
</script>

<div class="container mx-auto flex flex-col gap-4 px-8 py-12">
	<Heading2>Projects</Heading2>

	<Repo
		name="SwiftSvelte"
		description="WIP Fully featured project template for SvelteKit with Supabase"
		language="Svelte"
		stars={0}
		updated="Sep 2023"
		url="https://swiftsvelte.com"
		langIconClass="fill-orange-500 text-orange-500"
	/>

	<Repo
		name="TikBlocks"
		description="Minecraft command library for TikFinity"
		language="SvelteKit"
		langIconClass="fill-orange-500 text-orange-500"
		stars={0}
		updated="Dec 2023"
		url="https://tikblocks.vercel.app/"
	/>

	<Repo
		name="Tikfinity Mod"
		description="Minecraft integration for TikFinity"
		language="Java"
		stars={3}
		updated="Aug 2023"
		url="https://github.com/jakob-kruse/tikfinity_mod"
		langIconClass="fill-red-500 text-red-500"
	/>

	<Repo
		name="setup.ts"
		description="Node.js Project scaffolding in TypeScript"
		language="TypeScript"
		stars={7}
		updated="Jun 2022"
		url="https://github.com/jakob-kruse/setup.ts"
		langIconClass="fill-blue-500 text-blue-500"
	/>

	<Repo
		name="Svelte Snippets"
		description="VSCode Snippets for Svelte / SvelteKit"
		language="Svelte"
		langIconClass="fill-orange-500 text-orange-500"
		stars={5}
		updated="Dec 2023"
		url="https://github.com/jakob-kruse/svelte-snippets"
	/>

	<Repo
		name="maltesphotography.de"
		description="Photography Portfolio for Malte Holle"
		language="Next.js"
		stars={4}
		updated="Jun 2022"
		url="https://maltesphotography.de/"
		langIconClass="fill-black text-black"
	/>
</div>
