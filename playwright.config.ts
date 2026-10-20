import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
	testDir: 'tests',
	reporter: process.env.CI ? 'github' : 'list',
	use: {
		baseURL: 'http://localhost:4173',
		...devices['Desktop Chrome'],
		// Lets a preinstalled Chrome stand in for `playwright install chromium`.
		launchOptions: { executablePath: process.env.CHROME_PATH }
	},
	webServer: {
		command: 'bun run build && bun run preview --port 4173 --strictPort',
		url: 'http://localhost:4173',
		reuseExistingServer: !process.env.CI,
		timeout: 120_000
	}
});
