import { sveltekit } from '@sveltejs/kit/vite';
import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';
import { defineConfig } from 'vite';
import Icons from 'unplugin-icons/vite';

export default defineConfig({
	server: { allowedHosts: ['.onamp.dev'] },
	plugins: [
		sveltekit({
			alias: { $lib: 'src/lib' },
			preprocess: vitePreprocess(),
			adapter: adapter({ fallback: '404.html' })
		}),
		Icons({
			compiler: 'svelte'
		})
	]
});
