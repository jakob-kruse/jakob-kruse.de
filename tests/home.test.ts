import { expect, test, type Browser } from '@playwright/test';
import pixelmatch from 'pixelmatch';
import { PNG } from 'pngjs';

const viewports = [
	{ name: 'desktop', width: 1280, height: 800 },
	{ name: 'mobile', width: 390, height: 844 }
];

async function capture(browser: Browser, viewport: (typeof viewports)[number], js: boolean) {
	const context = await browser.newContext({ viewport, javaScriptEnabled: js });
	const page = await context.newPage();
	await page.goto('/', { waitUntil: 'networkidle' });
	await page.evaluate(() => document.fonts.ready);
	// With JS, wait until the lazily loaded tether engine has taken over the page.
	if (js) await page.waitForFunction(() => (document.querySelector('canvas')?.width ?? 0) > 0);
	const shot = PNG.sync.read(await page.screenshot({ fullPage: true, animations: 'disabled' }));
	await context.close();
	return shot;
}

for (const viewport of viewports) {
	test(`renders the same with and without JavaScript (${viewport.name})`, async ({
		browser
	}, info) => {
		const plain = await capture(browser, viewport, false);
		const hydrated = await capture(browser, viewport, true);
		expect([hydrated.width, hydrated.height]).toEqual([plain.width, plain.height]);

		const diff = new PNG({ width: plain.width, height: plain.height });
		const changed = pixelmatch(plain.data, hydrated.data, diff.data, plain.width, plain.height, {
			threshold: 0.1
		});
		if (changed) {
			await info.attach('without-js', { body: PNG.sync.write(plain), contentType: 'image/png' });
			await info.attach('with-js', { body: PNG.sync.write(hydrated), contentType: 'image/png' });
			await info.attach('diff', { body: PNG.sync.write(diff), contentType: 'image/png' });
		}
		expect(changed).toBe(0);
	});
}

test('the page hydrates without waiting for the tether toy', async ({ page }) => {
	// Hold back the engine module (the only script mentioning `tether-exposed`).
	let release!: () => void;
	const gate = new Promise<void>((resolve) => (release = resolve));
	let requested!: () => void;
	const engineRequested = new Promise<void>((resolve) => (requested = resolve));
	const big: string[] = [];
	await page.route('**/*.js', async (route) => {
		const response = await route.fetch();
		const body = await response.text();
		if (body.includes('tether-exposed')) {
			requested();
			await gate;
		}
		if (body.length > 1_000_000) big.push(route.request().url());
		await route.fulfill({ response, body });
	});

	await page.goto('/');
	// SvelteKit adds its route announcer once the app has started.
	await expect(page.locator('#svelte-announcer')).toBeAttached();

	// The engine still arrives on its own once the browser is idle.
	await engineRequested;
	release();
	await page.waitForFunction(() => (document.querySelector('canvas')?.width ?? 0) > 0);
	expect(big, 'physics fetched without a grab').toEqual([]);
});
