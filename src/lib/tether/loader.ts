import type { Action } from 'svelte/action';
import type { TetherEngine, TetherShape } from './engine';

/*
 * The engine is a toy, so the page never waits for it: elements and the canvas
 * queue up here and the engine module is fetched once the browser is idle, or
 * as soon as someone hovers or presses a panel. Rapier loads later still, on
 * the first grab.
 */

type Entry = { node: HTMLElement; shape?: TetherShape; destroy?: () => void };

const entries = new Set<Entry>();
let canvas: HTMLCanvasElement | null = null;
let unmount: (() => void) | undefined;
let engine: TetherEngine | null = null;
let loading: Promise<void> | null = null;
let scheduled = false;

function enabled() {
	return typeof window !== 'undefined' && !matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function load() {
	loading ??= import('./engine').then(({ getEngine }) => {
		engine = getEngine();
		if (!engine) return;
		if (canvas) unmount = engine.mount(canvas);
		for (const entry of entries) entry.destroy = engine.register(entry.node, entry.shape);
	});
	return loading;
}

function schedule() {
	if (scheduled) return;
	scheduled = true;
	const idle = () =>
		'requestIdleCallback' in window
			? requestIdleCallback(() => load(), { timeout: 3000 })
			: setTimeout(load, 1500);
	if (document.readyState === 'complete') idle();
	else addEventListener('load', idle, { once: true });
}

export const tether: Action<HTMLElement | SVGElement, TetherShape | undefined> = (node, shape) => {
	if (!enabled()) return;
	const entry: Entry = { node: node as HTMLElement, shape };
	entries.add(entry);
	schedule();
	if (engine) entry.destroy = engine.register(entry.node, shape);

	const warm = () => load();
	// A press before the engine is ready still counts: replay it if the pointer is still down.
	const early = (e: PointerEvent) => {
		if (engine) return;
		let up = false;
		const lift = (ev: PointerEvent) => ev.pointerId === e.pointerId && (up = true);
		addEventListener('pointerup', lift);
		addEventListener('pointercancel', lift);
		load().then(() => {
			removeEventListener('pointerup', lift);
			removeEventListener('pointercancel', lift);
			if (!up) engine?.replayPress(node, e);
		});
	};
	node.addEventListener('pointerover', warm, { once: true });
	node.addEventListener('pointerdown', early as EventListener);

	return {
		destroy() {
			node.removeEventListener('pointerover', warm);
			node.removeEventListener('pointerdown', early as EventListener);
			entry.destroy?.();
			entries.delete(entry);
		}
	};
};

export function mountCanvas(el: HTMLCanvasElement) {
	if (!enabled()) return;
	canvas = el;
	schedule();
	if (engine) unmount = engine.mount(el);
	return () => {
		unmount?.();
		unmount = undefined;
		canvas = null;
	};
}
