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

test('a lifted panel can be grabbed by its rim and lands with the rim above the floor', async ({
	page
}) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await page.goto('/');
	const panel = page
		.locator('.tether-panel')
		.filter({ has: page.getByRole('link', { name: 'GitHub' }) });
	await expect(panel).toBeVisible();
	const box = (await panel.boundingBox())!;
	await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
	await page.mouse.down();
	await page.mouse.move(380, 750, { steps: 10 });
	// A sustained pull tears the wires and releases the hand.
	await page.waitForFunction(
		() =>
			!document.documentElement.classList.contains('tether-dragging') &&
			document.querySelector('.tether-lifted')
	);
	await page.mouse.up();
	await expect
		.poll(async () => (await panel.boundingBox())!.y + (await panel.boundingBox())!.height)
		.toBeGreaterThan(825);
	await panel.evaluate(
		(el) =>
			new Promise<void>((resolve) => {
				let previous = el.getBoundingClientRect();
				let stable = 0;
				const frame = () => {
					const r = el.getBoundingClientRect();
					const movement =
						Math.abs(r.x - previous.x) +
						Math.abs(r.y - previous.y) +
						Math.abs(r.width - previous.width) +
						Math.abs(r.height - previous.height);
					stable = movement < 0.02 ? stable + 1 : 0;
					previous = r;
					if (stable >= 20) resolve();
					else requestAnimationFrame(frame);
				};
				requestAnimationFrame(frame);
			})
	);
	// Physics allows a small contact tolerance, but not an entire 8px rim below the floor.
	const rim = await panel.evaluate((el) => {
		const r = el.getBoundingClientRect();
		const m = new DOMMatrix(getComputedStyle(el).transform);
		// A rotated rounded rectangle does not fill its bounding box's corners.
		const bottom = r.bottom + 16 - 8 * (Math.abs(m.a) + Math.abs(m.b));
		const localY = (el as HTMLElement).offsetHeight / 2 + 4;
		return {
			bottom,
			x: r.x + r.width / 2 + m.c * localY,
			y: r.y + r.height / 2 + m.d * localY
		};
	});
	expect(rim.bottom).toBeLessThanOrEqual(842);
	await page.mouse.move(rim.x, rim.y);
	await page.mouse.down();
	await page.mouse.move(rim.x, rim.y - 70, { steps: 10 });
	await expect(page.locator('html')).toHaveClass(/tether-dragging/);
	await page.mouse.up();
});
