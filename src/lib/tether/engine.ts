import type * as Rapier from '@dimforge/rapier2d-compat';
import { integrity, type Integrity } from './state';

/**
 * Tethered panels: every registered element hangs on a few wires in a recessed
 * socket. Pulling stretches the wires like rubber bands; pulling hard for a
 * moment rips the panel out and the rest of the page loses its grip. Panels go
 * back by hand: bring one close to its socket and it snaps in.
 */

/**
 * rest: in its socket. held: pulled while seated. spring: snapping back.
 * hang: a loose rigid body, dangling from whatever wires are left.
 * return: being seated again.
 */
type Phase = 'rest' | 'held' | 'spring' | 'hang' | 'return';

type Rect = { x: number; y: number; w: number; h: number };

type Rope = {
	pos: Float32Array;
	prev: Float32Array;
	segLen: number;
	length: number;
	shade: number;
	width: number;
	socket: [number, number];
	plug: [number, number];
	attached: boolean;
	fragile: boolean;
};

type Trace = { pts: [number, number][]; strong: boolean };

/** Outline of a non-rectangular panel, in the coordinates of its SVG viewBox. */
export type TetherShape = {
	d: string;
	viewBox: [number, number, number, number];
	/** Stroke width the piece is drawn with; the hole leaves room for it. */
	stroke: number;
	/** Corners of the outline, used for collisions and to place the wires. */
	points: [number, number][];
};

type Shape = {
	path: Path2D;
	viewBox: [number, number, number, number];
	stroke: number;
	/** Outline corners, normalised to the panel's box (0..1). */
	poly: [number, number][];
};

type Panel = {
	el: HTMLElement;
	shape: Shape | null;
	slot: Rect;
	x: number;
	y: number;
	vx: number;
	vy: number;
	rot: number;
	vrot: number;
	phase: Phase;
	ropes: Rope[];
	strain: number;
	traces: Trace[];
	leds: [number, number][];
	seed: number;
	wakeAt: number;
	floor: number;
	/** Translation last written to the element's transform. */
	shown: [number, number];
	/** Rigid body while the panel is loose (once the physics engine has loaded). */
	body: Rapier.RigidBody | null;
	collider: Rapier.Collider | null;
	joints: Map<Rope, Rapier.ImpulseJoint>;
	suppressClick: boolean;
};

type Particle = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	life: number;
	max: number;
};

type Press = {
	panel: Panel;
	pointerId: number;
	pointerType: string;
	startClient: [number, number];
	startDoc: [number, number];
	grabLocal: [number, number];
	client: [number, number];
	grabbed: boolean;
	holdTimer: number;
	samples: { t: number; x: number; y: number }[];
};

type Palette = {
	wires: string[];
	wireShadow: string;
	strands: string;
	cavity: string;
	grid: string;
	traceStrong: string;
	traceWeak: string;
	lipShadow: string;
	rim: string;
	stripeA: string;
	stripeB: string;
	screw: string;
	screwSlot: string;
	socket: string;
	socketRing: string;
	led: string;
	ledAlarm: string;
	ledOff: string;
	glow: string;
	glowStrong: string;
	/** Sparks and strain glow: light on the dark theme, dark on the light one. */
	heat: (alpha: number) => string;
	glowBlend: GlobalCompositeOperation;
};

const DARK: Palette = {
	wires: ['#d4d4d4', '#a3a3a3', '#737373', '#e5e5e5', '#525252', '#8f8f8f'],
	wireShadow: 'rgba(0,0,0,0.45)',
	strands: '#d4d4d4',
	cavity: '#060606',
	grid: 'rgba(255,255,255,0.045)',
	traceStrong: 'rgba(255,255,255,0.13)',
	traceWeak: 'rgba(255,255,255,0.07)',
	lipShadow: 'rgba(0,0,0,0.85)',
	rim: '#333333',
	stripeA: '#121212',
	stripeB: '#3d3d3d',
	screw: '#4d4d4d',
	screwSlot: '#1a1a1a',
	socket: '#111111',
	socketRing: '#5c5c5c',
	led: '#bdbdbd',
	ledAlarm: '#ffffff',
	ledOff: '#262626',
	glow: 'rgba(255,255,255,0.2)',
	glowStrong: 'rgba(255,255,255,0.45)',
	heat: (a) => `rgba(255,255,255,${a})`,
	glowBlend: 'lighter'
};

const LIGHT: Palette = {
	wires: ['#262626', '#525252', '#404040', '#737373', '#171717', '#5c5c5c'],
	wireShadow: 'rgba(0,0,0,0.16)',
	strands: '#404040',
	cavity: '#dedede',
	grid: 'rgba(0,0,0,0.06)',
	traceStrong: 'rgba(0,0,0,0.18)',
	traceWeak: 'rgba(0,0,0,0.09)',
	lipShadow: 'rgba(0,0,0,0.28)',
	rim: '#a3a3a3',
	stripeA: '#d4d4d4',
	stripeB: '#9e9e9e',
	screw: '#a3a3a3',
	screwSlot: '#e5e5e5',
	socket: '#f5f5f5',
	socketRing: '#8a8a8a',
	led: '#525252',
	ledAlarm: '#0a0a0a',
	ledOff: '#c2c2c2',
	glow: 'rgba(0,0,0,0.12)',
	glowStrong: 'rgba(0,0,0,0.3)',
	heat: (a) => `rgba(10,10,10,${a})`,
	glowBlend: 'source-over'
};

/** Physics runs in metres; one metre is 100 CSS pixels. */
const M = 0.01;
const G_PANEL = 1;
const G_WALL = 2;
const G_SCREEN = 4;
const groups = (member: number, filter: number) => (member << 16) | filter;
const STEP = 1 / 60;
const MAX_STEPS = 4;
const LIP = 7;
const SHAPE_LIP = 3;
const SEGMENTS = 16;
const ROPE_GRAVITY = 1500;
const PANEL_GRAVITY = 2600;
const MAX_LOOSE = 3;

function toShape({ d, viewBox, stroke, points }: TetherShape): Shape {
	const [vx, vy, vw, vh] = viewBox;
	return {
		path: new Path2D(d),
		viewBox,
		stroke,
		poly: points.map(([x, y]) => [(x - vx) / vw, (y - vy) / vh])
	};
}

function insidePoly(poly: [number, number][], u: number, v: number) {
	let inside = false;
	for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
		const [xi, yi] = poly[i];
		const [xj, yj] = poly[j];
		if (yi > v !== yj > v && u < ((xj - xi) * (v - yi)) / (yj - yi) + xi) inside = !inside;
	}
	return inside;
}

/** A random point well inside the outline (all four neighbours `margin` away are inside too). */
function pickInside(
	poly: [number, number][],
	rand: () => number,
	margin: number
): [number, number] {
	for (let i = 0; i < 60; i++) {
		const u = rand();
		const v = rand();
		if (
			insidePoly(poly, u, v) &&
			insidePoly(poly, u - margin, v) &&
			insidePoly(poly, u + margin, v) &&
			insidePoly(poly, u, v - margin) &&
			insidePoly(poly, u, v + margin)
		) {
			return [u, v];
		}
	}
	const cx = poly.reduce((a, [x]) => a + x, 0) / poly.length;
	const cy = poly.reduce((a, [, y]) => a + y, 0) / poly.length;
	return [cx, cy];
}

function mulberry32(seed: number) {
	return () => {
		seed |= 0;
		seed = (seed + 0x6d2b79f5) | 0;
		let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export class TetherEngine {
	private panels: Panel[] = [];
	private particles: Particle[] = [];
	private press: Press | null = null;
	private canvas: HTMLCanvasElement | null = null;
	private ctx: CanvasRenderingContext2D | null = null;
	private hazards = new Map<Palette, CanvasPattern | null>();
	private raf = 0;
	private pending = 0;
	private rapier: typeof Rapier.default | null = null;
	private world: Rapier.World | null = null;
	private ground: Rapier.RigidBody | null = null;
	private walls: Rapier.Collider[] = [];
	private screenFloor: Rapier.RigidBody | null = null;
	private screenFloorY = Infinity;
	private physicsRequested = false;
	private observer: ResizeObserver | null = null;
	private tallest = 0;
	private last = 0;
	private shake = 0;
	private state: Integrity = 'intact';
	private collapseReadyAt = 0;
	private seedCounter = 1;
	private dpr = 1;
	private host: HTMLElement | null = null;
	private layer = { width: 0, height: 0, buffer: 0 };

	constructor() {
		integrity.subscribe((s) => (this.state = s));
		window.addEventListener('resize', this.onResize);
	}

	mount(canvas: HTMLCanvasElement) {
		this.canvas = canvas;
		this.ctx = canvas.getContext('2d');
		this.host = canvas.parentElement;
		// Re-measure whenever the page's layout changes, not only on window resizes.
		this.observer = new ResizeObserver(() => this.onResize());
		if (this.host) this.observer.observe(this.host);
		this.onResize();
		return () => {
			if (this.canvas === canvas) {
				this.observer?.disconnect();
				this.observer = null;
				this.canvas = null;
				this.ctx = null;
				this.host = null;
			}
		};
	}

	register(el: HTMLElement, shape?: TetherShape) {
		const panel: Panel = {
			el,
			shape: shape ? toShape(shape) : null,
			slot: { x: 0, y: 0, w: 0, h: 0 },
			x: 0,
			y: 0,
			vx: 0,
			vy: 0,
			rot: 0,
			vrot: 0,
			phase: 'rest',
			ropes: [],
			strain: 0,
			traces: [],
			leds: [],
			seed: this.seedCounter++ * 7919,
			wakeAt: 0,
			floor: Infinity,
			shown: [0, 0],
			body: null,
			collider: null,
			joints: new Map(),
			suppressClick: false
		};
		this.panels.push(panel);
		el.classList.add('tether-panel');
		if (shape) el.dataset.tetherShape = '';

		const onPointerDown = (e: PointerEvent) => this.onPointerDown(panel, e);
		const onTouchMove = (e: TouchEvent) => {
			if (this.press?.panel === panel && this.press.grabbed && e.cancelable) e.preventDefault();
		};
		const onClick = (e: MouseEvent) => {
			if (panel.suppressClick) {
				e.preventDefault();
				e.stopPropagation();
			}
		};
		const onDragStart = (e: DragEvent) => e.preventDefault();
		const onContextMenu = (e: Event) => {
			if (this.press?.panel === panel) e.preventDefault();
		};

		el.addEventListener('pointerdown', onPointerDown);
		el.addEventListener('touchmove', onTouchMove, { passive: false });
		el.addEventListener('click', onClick, true);
		el.addEventListener('dragstart', onDragStart);
		el.addEventListener('contextmenu', onContextMenu);

		return () => {
			el.removeEventListener('pointerdown', onPointerDown);
			el.removeEventListener('touchmove', onTouchMove);
			el.removeEventListener('click', onClick, true);
			el.removeEventListener('dragstart', onDragStart);
			el.removeEventListener('contextmenu', onContextMenu);
			el.classList.remove('tether-panel', 'tether-lifted');
			el.style.transform = '';
			this.panels = this.panels.filter((p) => p !== panel);
		};
	}

	/** Replays a press that arrived while the engine was still loading. */
	replayPress(el: Element, e: PointerEvent) {
		const panel = this.panels.find((p) => p.el === el);
		if (panel) this.onPointerDown(panel, e);
	}

	// ---------------------------------------------------------------- input

	private onPointerDown(panel: Panel, e: PointerEvent) {
		if (this.press) return;
		if (e.pointerType === 'mouse' && e.button !== 0) return;
		if (panel.phase !== 'rest' && panel.phase !== 'spring' && panel.phase !== 'hang') return;

		const [vx, vy] = this.view();
		const docX = e.clientX + vx;
		const docY = e.clientY + vy;
		this.press = {
			panel,
			pointerId: e.pointerId,
			pointerType: e.pointerType,
			startClient: [e.clientX, e.clientY],
			startDoc: [docX - panel.x, docY - panel.y],
			grabLocal: [0, 0],
			client: [e.clientX, e.clientY],
			grabbed: false,
			holdTimer: 0,
			samples: [{ t: performance.now(), x: docX, y: docY }]
		};
		panel.suppressClick = false;

		if (e.pointerType !== 'mouse') {
			this.press.holdTimer = window.setTimeout(() => this.grab(), 220);
		}

		window.addEventListener('pointermove', this.onPointerMove, { passive: true });
		window.addEventListener('pointerup', this.onPointerUp);
		window.addEventListener('pointercancel', this.onPointerCancel);
	}

	private onPointerMove = (e: PointerEvent) => {
		const press = this.press;
		if (!press || e.pointerId !== press.pointerId) return;
		press.client = [e.clientX, e.clientY];
		const now = performance.now();
		const [vx, vy] = this.view();
		press.samples.push({ t: now, x: e.clientX + vx, y: e.clientY + vy });
		while (press.samples.length > 2 && now - press.samples[0].t > 90) press.samples.shift();

		if (press.grabbed) return;
		const dx = e.clientX - press.startClient[0];
		const dy = e.clientY - press.startClient[1];
		const dist = Math.hypot(dx, dy);
		if (press.pointerType === 'mouse') {
			if (dist > 4) this.grab();
		} else if (dist > 8) {
			// Horizontal pulls grab right away; vertical swipes stay a scroll.
			if (Math.abs(dx) > Math.abs(dy)) this.grab();
			else this.release(false);
		}
	};

	private onPointerUp = (e: PointerEvent) => {
		if (this.press && e.pointerId === this.press.pointerId) this.release(true);
	};

	private onPointerCancel = (e: PointerEvent) => {
		if (this.press && e.pointerId === this.press.pointerId) this.release(true);
	};

	private grab() {
		const press = this.press;
		if (!press || press.grabbed) return;
		clearTimeout(press.holdTimer);
		press.grabbed = true;
		this.loadPhysics();
		const panel = press.panel;
		if (panel.phase === 'rest') {
			this.measure(panel);
			panel.ropes = this.makeRopes(panel);
		}
		// Grab point in the panel's own frame, so it stays put while the panel turns.
		const [sx, sy] = press.startClient;
		const [vx, vy] = this.view();
		const wx = sx + vx - (panel.slot.x + panel.slot.w / 2 + panel.x);
		const wy = sy + vy - (panel.slot.y + panel.slot.h / 2 + panel.y);
		const c = Math.cos(-panel.rot);
		const s = Math.sin(-panel.rot);
		press.grabLocal = [wx * c - wy * s, wx * s + wy * c];
		if (panel.phase !== 'hang') panel.phase = 'held';
		panel.suppressClick = true;
		panel.el.classList.add('tether-lifted');
		document.documentElement.classList.add('tether-dragging');
		window.getSelection()?.removeAllRanges();
		if (press.pointerType !== 'mouse') navigator.vibrate?.(8);
		this.start();
	}

	private release(endOfGesture: boolean) {
		const press = this.press;
		if (!press) return;
		clearTimeout(press.holdTimer);
		window.removeEventListener('pointermove', this.onPointerMove);
		window.removeEventListener('pointerup', this.onPointerUp);
		window.removeEventListener('pointercancel', this.onPointerCancel);
		document.documentElement.classList.remove('tether-dragging');
		this.press = null;
		const panel = press.panel;
		if (panel.phase === 'held') panel.phase = 'spring';
		if (panel.phase === 'hang' && press.grabbed) this.trySeat(panel, 1);
		if (!press.grabbed) {
			panel.suppressClick = false;
		} else if (endOfGesture) {
			// The click that follows pointerup must not follow a link.
			setTimeout(() => (panel.suppressClick = false), 0);
		} else {
			// Let go of mid-gesture (the panel snapped in): wait for the finger to lift.
			const done = () => {
				window.removeEventListener('pointerup', done);
				window.removeEventListener('pointercancel', done);
				setTimeout(() => (panel.suppressClick = false), 0);
			};
			window.addEventListener('pointerup', done);
			window.addEventListener('pointercancel', done);
		}
	}

	private pointerVelocity(): [number, number] {
		const s = this.press?.samples ?? [];
		if (s.length < 2) return [0, 0];
		const a = s[0];
		const b = s[s.length - 1];
		const dt = Math.max(0.016, (b.t - a.t) / 1000);
		return [(b.x - a.x) / dt, (b.y - a.y) / dt];
	}

	// ---------------------------------------------------------------- setup

	/** How far a panel stretches out on its wires; small pieces get shorter wires. */
	private reach(p: Panel) {
		return Math.min(this.stretchLimit(), Math.max(60, Math.max(p.slot.w, p.slot.h) * 1.6));
	}

	/**
	 * Where the viewport's top-left corner is, in the coordinates of the page
	 * container that holds the canvas. Every position (sockets, panels, wires,
	 * pointer) lives in these coordinates. Reading it from the container's own
	 * box, rather than from window.scrollY, keeps everything aligned during
	 * Safari's overscroll bounce, when the two briefly disagree.
	 */
	private view(): [number, number] {
		if (!this.host) return [window.scrollX, window.scrollY];
		const r = this.host.getBoundingClientRect();
		return [-r.left, -r.top];
	}

	private stretchLimit() {
		return clamp(Math.min(window.innerWidth, window.innerHeight) * 0.18, 70, 150);
	}

	private measure(panel: Panel) {
		const prev = panel.el.style.transform;
		panel.el.style.transform = 'none';
		const r = panel.el.getBoundingClientRect();
		panel.el.style.transform = prev;
		const changed =
			Math.abs(r.width - panel.slot.w) > 0.5 || Math.abs(r.height - panel.slot.h) > 0.5;
		const [vx, vy] = this.view();
		panel.slot = { x: r.left + vx, y: r.top + vy, w: r.width, h: r.height };
		if (changed || panel.traces.length === 0) this.decorate(panel);
	}

	private measureAll() {
		for (const p of this.panels) this.measure(p);
	}

	private decorate(panel: Panel) {
		const rand = mulberry32(panel.seed);
		const { w, h } = panel.slot;
		const W = w + LIP * 2;
		const H = h + LIP * 2;
		const traces: Trace[] = [];
		const count = Math.round(clamp((W * H) / 9000, 2, 9));
		for (let i = 0; i < count; i++) {
			let x = 10 + rand() * (W - 20);
			let y = 10 + rand() * (H - 20);
			const pts: [number, number][] = [[x, y]];
			const steps = 2 + Math.floor(rand() * 3);
			for (let s = 0; s < steps; s++) {
				const len = 12 + rand() * Math.min(80, W * 0.3);
				const dir = Math.floor(rand() * 4);
				if (dir === 0) x += len;
				else if (dir === 1) x -= len;
				else if (dir === 2) y += len * 0.6;
				else y -= len * 0.6;
				x = clamp(x, 8, W - 8);
				y = clamp(y, 8, H - 8);
				pts.push([x, y]);
			}
			traces.push({
				pts,
				strong: rand() < 0.6
			});
		}
		panel.traces = traces;
		if (panel.shape) {
			const [u, v] = pickInside(panel.shape.poly, rand, 0.1);
			panel.leds = [[LIP + u * w, LIP + v * h]];
			return;
		}
		panel.leds = [
			[W - 10, 9],
			[W - 20, 9]
		];
		if (H > 70) panel.leds.push([10, H - 9]);
	}

	private makeRopes(panel: Panel): Rope[] {
		const rand = mulberry32(panel.seed ^ 0x5bd1e995);
		const { w, h } = panel.slot;
		const R = this.reach(panel);
		const count = clamp(Math.round(2 + (w * h) / 25000), 2, 5);
		const ropes: Rope[] = [];
		for (let i = 0; i < count; i++) {
			const u = (i + 0.5) / count;
			const poly = panel.shape?.poly;
			const socket: [number, number] = poly
				? pickInside(poly, rand, 0.08)
				: [clamp(u + (rand() - 0.5) * 0.12, 0.08, 0.92), 0.3 + rand() * 0.4];
			// Plugs sit high on the panel's back, so a dangling panel hangs like a sign.
			const plug: [number, number] = poly
				? pickInside(poly, rand, 0.08)
				: [clamp(u + (rand() - 0.5) * 0.2, 0.1, 0.9), 0.12 + rand() * 0.2];
			const restDist = Math.hypot((socket[0] - plug[0]) * w, (socket[1] - plug[1]) * h);
			const length = restDist + R * (0.8 + rand() * 0.25);
			const rope: Rope = {
				pos: new Float32Array(SEGMENTS * 2),
				prev: new Float32Array(SEGMENTS * 2),
				segLen: length / (SEGMENTS - 1),
				length,
				shade: Math.floor(rand() * 6),
				width: 2 + rand() * 2.2,
				socket,
				plug,
				attached: true,
				fragile: false
			};
			const [ax, ay] = this.socketPos(panel, rope);
			const [bx, by] = this.plugPos(panel, rope);
			for (let s = 0; s < SEGMENTS; s++) {
				const t = s / (SEGMENTS - 1);
				const x = ax + (bx - ax) * t;
				const y = ay + (by - ay) * t;
				rope.pos[s * 2] = rope.prev[s * 2] = x;
				rope.pos[s * 2 + 1] = rope.prev[s * 2 + 1] = y;
			}
			ropes.push(rope);
		}
		return ropes;
	}

	private socketPos(panel: Panel, rope: Rope): [number, number] {
		return [
			panel.slot.x + rope.socket[0] * panel.slot.w,
			panel.slot.y + rope.socket[1] * panel.slot.h
		];
	}

	private plugPos(panel: Panel, rope: Rope): [number, number] {
		const lx = (rope.plug[0] - 0.5) * panel.slot.w;
		const ly = (rope.plug[1] - 0.5) * panel.slot.h;
		const c = Math.cos(panel.rot);
		const s = Math.sin(panel.rot);
		return [
			panel.slot.x + panel.slot.w / 2 + panel.x + lx * c - ly * s,
			panel.slot.y + panel.slot.h / 2 + panel.y + lx * s + ly * c
		];
	}

	// ---------------------------------------------------------------- loop

	private start() {
		if (this.raf) return;
		this.last = performance.now();
		this.pending = 0;
		this.raf = requestAnimationFrame(this.frame);
	}

	private frame = (now: number) => {
		this.raf = 0;
		// Fixed time step: the wires are Verlet chains, which jitter when the step
		// size changes, and Safari throttles frames while scrolling.
		this.pending = Math.min(this.pending + (now - this.last) / 1000, STEP * MAX_STEPS);
		this.last = now;
		this.trackSlots();
		this.updateScreenFloor();
		while (this.pending >= STEP) {
			this.pending -= STEP;
			for (const p of this.panels) this.stepPanel(p, STEP, now);
			this.stepWorld(now);
			for (const p of this.panels) for (const r of p.ropes) this.stepRope(p, r, STEP);
			this.stepParticles(STEP);
			this.shake = Math.max(0, this.shake - STEP * 3);
		}
		for (const p of this.panels) if (p.phase !== 'rest') this.apply(p, this.jitter(p));
		this.updateIntegrity(now);
		this.draw(now);

		const busy =
			this.state !== 'intact' ||
			this.particles.length > 0 ||
			this.panels.some((p) => p.phase !== 'rest');
		if (busy) this.raf = requestAnimationFrame(this.frame);
	};

	private stepPanel(p: Panel, dt: number, now: number) {
		switch (p.phase) {
			case 'held':
				return this.stepHeld(p, dt);
			case 'spring':
				this.springTo(p, 0, 0, 0, 220, 0.22, dt);
				if (
					Math.hypot(p.x, p.y) < 0.4 &&
					Math.hypot(p.vx, p.vy) < 8 &&
					Math.abs(p.rot) < 0.003 &&
					Math.abs(p.vrot) < 0.05
				) {
					this.settle(p);
				}
				return;
			case 'hang':
				// With the physics engine loaded, loose panels are stepped by the world.
				if (now < p.wakeAt || this.world) return;
				this.stepHang(p, dt);
				return;
			case 'return':
				this.springTo(p, 0, 0, 0, 380, 0.55, dt);
				if (Math.hypot(p.x, p.y) < 0.5 && Math.hypot(p.vx, p.vy) < 10 && Math.abs(p.rot) < 0.004) {
					this.settle(p);
				}
				return;
		}
	}

	private stepHeld(p: Panel, dt: number) {
		const press = this.press;
		if (!press) return;
		const R = this.reach(p);
		const [vx, vy] = this.view();
		const docX = press.client[0] + vx;
		const docY = press.client[1] + vy;
		const px = docX - press.startDoc[0];
		const py = docY - press.startDoc[1];
		const mag = Math.hypot(px, py);
		const tension = mag / R;

		// Pulling past the wires' reach builds strain; letting up relieves it. A
		// short hard pull pops the panel out of its socket to dangle on its wires.
		const over = tension - 1;
		p.strain = over > 0 ? p.strain + dt * Math.min(over, 1) * 3 : Math.max(0, p.strain - dt * 0.9);

		if (p.strain >= 1) {
			this.unlatch(p);
			return;
		}

		const reach = R * Math.tanh(mag / R) + p.strain * R * 0.3;
		const tx = mag > 0 ? (px / mag) * reach : 0;
		const ty = mag > 0 ? (py / mag) * reach : 0;
		const [gx, gy] = press.grabLocal;
		const span = Math.max(p.slot.w, p.slot.h) ** 2 / 4 + 400;
		const trot = clamp((0.4 * (gx * ty - gy * tx)) / span, -0.32, 0.32);
		this.springTo(p, tx, ty, trot, 900, 0.75, dt);

		this.strainSparks(p, dt);
		p.el.style.setProperty('--tether-strain', p.strain.toFixed(3));
	}

	/**
	 * A dangling panel is a rigid body; each intact wire is a maximum-distance
	 * constraint from its socket to the plug on the panel's back (position-based
	 * dynamics, solved over a few substeps).
	 */
	private stepHang(p: Panel, dt: number) {
		const press = this.press?.panel === p && this.press.grabbed ? this.press : null;
		const { w, h } = p.slot;
		const invM = 1;
		const invI = 12 / (w * w + h * h);
		const cx0 = p.slot.x + w / 2;
		const cy0 = p.slot.y + h / 2;
		let target: [number, number] | null = null;
		const [vx, vy] = this.view();
		if (press) target = [press.client[0] + vx, press.client[1] + vy];
		const corners = p.shape
			? p.shape.poly.map(([u, v]) => [(u - 0.5) * w, (v - 0.5) * h])
			: [
					[-w / 2, -h / 2],
					[w / 2, -h / 2],
					[w / 2, h / 2],
					[-w / 2, h / 2]
				];
		const left = 0;
		const right = this.layer.width;
		const top = 0;

		// A panel with no wires left lands on the bottom of the screen (never below
		// the page). The floor only ever drops: scrolling down lets the panel fall
		// further, scrolling up leaves it where it lies. Pushing it back up could
		// only follow native scrolling a frame late, which looks choppy.
		if (!p.ropes.some((r) => r.attached)) {
			const pageBottom = this.layer.height - 4;
			p.floor = Math.max(p.floor, Math.min(pageBottom, vy + window.innerHeight - 4));
		}

		const steps = 8;
		const hs = dt / steps;
		for (let step = 0; step < steps; step++) {
			const px = p.x;
			const py = p.y;
			const pr = p.rot;
			p.vy += PANEL_GRAVITY * hs;
			p.x += p.vx * hs;
			p.y += p.vy * hs;
			p.rot += p.vrot * hs;

			const solve = (
				lx: number,
				ly: number,
				ax: number,
				ay: number,
				limit: number,
				compliance: number
			) => {
				const c = Math.cos(p.rot);
				const s = Math.sin(p.rot);
				const rx = lx * c - ly * s;
				const ry = lx * s + ly * c;
				const dx = cx0 + p.x + rx - ax;
				const dy = cy0 + p.y + ry - ay;
				const dist = Math.hypot(dx, dy);
				const C = dist - limit;
				if (C <= 0 || dist < 1e-6) return 0;
				const nx = dx / dist;
				const ny = dy / dist;
				const rn = rx * ny - ry * nx;
				const lambda = -C / (invM + invI * rn * rn + compliance / (hs * hs));
				p.x += nx * lambda * invM;
				p.y += ny * lambda * invM;
				p.rot += invI * rn * lambda;
				return C;
			};

			if (press && target) {
				solve(press.grabLocal[0], press.grabLocal[1], target[0], target[1], 0, 0.00004);
			}
			for (let it = 0; it < 3; it++) {
				for (const rope of p.ropes) {
					if (!rope.attached) continue;
					const [ax, ay] = this.socketPos(p, rope);
					solve((rope.plug[0] - 0.5) * w, (rope.plug[1] - 0.5) * h, ax, ay, rope.length, 0);
				}
			}

			// Page edges and floor: no corner may leave the box.
			let grounded = false;
			for (let it = 0; it < 2; it++) {
				for (const [lx, ly] of corners) {
					const c = Math.cos(p.rot);
					const s = Math.sin(p.rot);
					const rx = lx * c - ly * s;
					const ry = lx * s + ly * c;
					const wx = cx0 + p.x + rx;
					const wy = cy0 + p.y + ry;
					const hits: [number, number, number][] = [
						[wy - p.floor, 0, 1],
						[left - wx, -1, 0],
						[wx - right, 1, 0],
						[top - wy, 0, -1]
					];
					for (const [C, nx, ny] of hits) {
						if (C <= 0) continue;
						if (ny === 1) grounded = true;
						const rn = rx * ny - ry * nx;
						const lambda = -C / (invM + invI * rn * rn);
						p.x += nx * lambda * invM;
						p.y += ny * lambda * invM;
						p.rot += invI * rn * lambda;
					}
				}
			}

			const friction = grounded ? 1 - Math.min(1, 9 * hs) : 1 - 0.35 * hs;
			p.vx = ((p.x - px) / hs) * friction;
			p.vy = ((p.y - py) / hs) * (1 - 0.35 * hs);
			p.vrot = ((p.rot - pr) / hs) * (grounded ? 1 - Math.min(1, 5 * hs) : 1 - 1.8 * hs);
		}

		this.afterLooseStep(p, dt);
	}

	/** Seating, and the strain of pulling a dangling panel against its wires. */
	private afterLooseStep(p: Panel, dt: number) {
		const press = this.press?.panel === p && this.press.grabbed ? this.press : null;
		if (press && this.trySeat(p, 0.5)) return;

		if (press && p.ropes.some((r) => r.attached)) {
			// The wires win against the hand; how far the hand gets ahead is the strain.
			const [vx, vy] = this.view();
			const [gx, gy] = this.grabPoint(p, press);
			const lag = Math.hypot(press.client[0] + vx - gx, press.client[1] + vy - gy) / this.reach(p);
			const over = lag - 0.7;
			p.strain =
				over > 0 ? p.strain + dt * Math.min(over, 2) * 1.3 : Math.max(0, p.strain - dt * 0.9);
			if (p.strain >= 1) {
				this.rip(p);
				return;
			}
			this.strainSparks(p, dt);
		} else {
			p.strain = Math.max(0, p.strain - dt * 2);
		}
		p.el.style.setProperty('--tether-strain', p.strain.toFixed(3));
	}

	private grabPoint(p: Panel, press: Press): [number, number] {
		const c = Math.cos(p.rot);
		const s = Math.sin(p.rot);
		return [
			p.slot.x + p.slot.w / 2 + p.x + press.grabLocal[0] * c - press.grabLocal[1] * s,
			p.slot.y + p.slot.h / 2 + p.y + press.grabLocal[0] * s + press.grabLocal[1] * c
		];
	}

	// ---------------------------------------------------------------- rigid bodies

	/** Fetches the physics engine (Rapier, WebAssembly) the first time a panel is grabbed. */
	private loadPhysics() {
		if (this.physicsRequested) return;
		this.physicsRequested = true;
		import('@dimforge/rapier2d-compat')
			.then(async ({ default: R }) => {
				await R.init();
				this.rapier = R;
				const world = new R.World({ x: 0, y: PANEL_GRAVITY * M });
				world.timestep = STEP;
				this.world = world;
				this.ground = world.createRigidBody(R.RigidBodyDesc.fixed());
				this.screenFloor = world.createRigidBody(R.RigidBodyDesc.fixed());
				world.createCollider(
					R.ColliderDesc.cuboid(1000, 1)
						.setTranslation(0, 1)
						.setFriction(0.8)
						.setCollisionGroups(groups(G_SCREEN, G_PANEL)),
					this.screenFloor
				);
				this.buildWalls();
				this.start();
			})
			.catch(() => {
				// Without the engine, loose panels keep using the built-in solver.
			});
	}

	/** Page edges and the page's own bottom, which every loose panel collides with. */
	private buildWalls() {
		const R = this.rapier;
		const world = this.world;
		if (!R || !world || !this.ground) return;
		for (const c of this.walls) world.removeCollider(c, false);
		const w = this.layer.width * M;
		const h = this.layer.height * M;
		const t = 2;
		const wall = (hx: number, hy: number, x: number, y: number) =>
			world.createCollider(
				R.ColliderDesc.cuboid(hx, hy)
					.setTranslation(x, y)
					.setFriction(0.8)
					.setCollisionGroups(groups(G_WALL, G_PANEL)),
				this.ground!
			);
		this.walls = [
			wall(w / 2 + t, t, w / 2, h - 0.04 + t),
			wall(t, h, -t, h / 2),
			wall(t, h, w + t, h / 2),
			wall(w / 2 + t, t, w / 2, -t)
		];
		for (const p of this.panels) p.body?.wakeUp();
	}

	private corners(p: Panel): [number, number][] {
		const { w, h } = p.slot;
		if (p.shape) return p.shape.poly.map(([u, v]) => [(u - 0.5) * w, (v - 0.5) * h]);
		return [
			[-w / 2, -h / 2],
			[w / 2, -h / 2],
			[w / 2, h / 2],
			[-w / 2, h / 2]
		];
	}

	private looseGroups(p: Panel, screen: boolean) {
		const filter = G_PANEL | G_WALL | (screen ? G_SCREEN : 0);
		p.collider?.setCollisionGroups(groups(G_PANEL, filter));
	}

	private createBody(p: Panel) {
		const R = this.rapier!;
		const world = this.world!;
		const cx = p.slot.x + p.slot.w / 2 + p.x;
		const cy = p.slot.y + p.slot.h / 2 + p.y;
		const body = world.createRigidBody(
			R.RigidBodyDesc.dynamic()
				.setTranslation(cx * M, cy * M)
				.setRotation(p.rot)
				.setLinvel(p.vx * M, p.vy * M)
				.setAngvel(p.vrot)
				.setLinearDamping(0.3)
				.setAngularDamping(0.9)
				.setCcdEnabled(true)
		);
		const desc = p.shape
			? R.ColliderDesc.convexHull(
					new Float32Array(
						this.corners(p)
							.flat()
							.map((v) => v * M)
					)
				)
			: R.ColliderDesc.cuboid((p.slot.w / 2) * M, (p.slot.h / 2) * M);
		if (!desc) {
			world.removeRigidBody(body);
			return;
		}
		desc.setDensity(1).setFriction(0.7).setRestitution(0.05);
		p.body = body;
		p.collider = world.createCollider(desc, body);
		const wired = p.ropes.some((r) => r.attached);
		this.looseGroups(p, !wired && p.floor === -Infinity);
		for (const rope of p.ropes) {
			if (!rope.attached) continue;
			const [sx, sy] = this.socketPos(p, rope);
			const joint = world.createImpulseJoint(
				R.JointData.rope(
					rope.length * M,
					{ x: sx * M, y: sy * M },
					{ x: (rope.plug[0] - 0.5) * p.slot.w * M, y: (rope.plug[1] - 0.5) * p.slot.h * M }
				),
				this.ground!,
				body,
				true
			);
			p.joints.set(rope, joint);
		}
	}

	private removeBody(p: Panel) {
		if (p.body && this.world) this.world.removeRigidBody(p.body);
		p.body = null;
		p.collider = null;
		p.joints.clear();
	}

	/**
	 * Torn-off panels rest on the bottom of the screen. The floor follows the
	 * screen down as you scroll; when you scroll back up, panels below the new
	 * floor are let go (they drop to the page's bottom) rather than pushed up.
	 */
	private updateScreenFloor() {
		const floor = this.screenFloor;
		if (!floor) return;
		const [, vy] = this.view();
		const y = Math.min(this.layer.height, vy + window.innerHeight) - 4;
		if (Math.abs(y - this.screenFloorY) < 0.5) return;
		const rising = y < this.screenFloorY;
		for (const p of this.panels) {
			if (!p.body || p.floor !== -Infinity) continue;
			if (rising) {
				const lowest = Math.max(...this.corners(p).map(([lx, ly]) => this.toWorld(p, lx, ly)[1]));
				if (lowest > y - 2) {
					p.floor = this.layer.height;
					this.looseGroups(p, false);
				}
			}
			p.body.wakeUp();
		}
		this.screenFloorY = y;
		floor.setTranslation({ x: (this.layer.width / 2) * M, y: y * M }, true);
	}

	private toWorld(p: Panel, lx: number, ly: number): [number, number] {
		const c = Math.cos(p.rot);
		const s = Math.sin(p.rot);
		return [
			p.slot.x + p.slot.w / 2 + p.x + lx * c - ly * s,
			p.slot.y + p.slot.h / 2 + p.y + lx * s + ly * c
		];
	}

	/** One fixed step of the world: wires follow their sockets, the hand pulls, bodies move. */
	private stepWorld(now: number) {
		const world = this.world;
		if (!world) return;
		for (const p of this.panels) {
			if (p.phase === 'hang' && now >= p.wakeAt && !p.body) this.createBody(p);
			if (p.phase !== 'hang' && p.body) this.removeBody(p);
		}
		for (const p of this.panels) {
			const body = p.body;
			if (!body) continue;
			for (const [rope, joint] of p.joints) {
				const [sx, sy] = this.socketPos(p, rope);
				joint.setAnchor1({ x: sx * M, y: sy * M });
			}
			const press = this.press?.panel === p && this.press.grabbed ? this.press : null;
			if (press) {
				// Drag: steer the grabbed point towards the finger with a stiff, damped pull.
				const [vx, vy] = this.view();
				const [gx, gy] = this.grabPoint(p, press);
				const t = body.translation();
				const rx = gx * M - t.x;
				const ry = gy * M - t.y;
				const v = body.linvel();
				const w = body.angvel();
				const tau = 0.06;
				const dvx = ((press.client[0] + vx - gx) * M) / tau - (v.x - w * ry);
				const dvy = ((press.client[1] + vy - gy) * M) / tau - (v.y + w * rx);
				const m = body.mass();
				const max = m * 60;
				const ix = clamp(m * dvx * 0.5, -max, max);
				const iy = clamp(m * dvy * 0.5, -max, max);
				body.applyImpulseAtPoint({ x: ix, y: iy }, { x: gx * M, y: gy * M }, true);
			}
		}
		world.step();
		for (const p of this.panels) {
			const body = p.body;
			if (!body) continue;
			const t = body.translation();
			const v = body.linvel();
			p.x = t.x / M - (p.slot.x + p.slot.w / 2);
			p.y = t.y / M - (p.slot.y + p.slot.h / 2);
			p.rot = body.rotation();
			p.vx = v.x / M;
			p.vy = v.y / M;
			p.vrot = body.angvel();
			this.afterLooseStep(p, STEP);
		}
	}

	private strainSparks(p: Panel, dt: number) {
		const live = p.ropes.filter((r) => r.attached);
		if (p.strain > 0.25 && live.length && Math.random() < p.strain * dt * 14) {
			const rope = live[Math.floor(Math.random() * live.length)];
			const [sx, sy] = this.socketPos(p, rope);
			this.sparks(sx, sy, 3 + Math.floor(p.strain * 6), 260);
		}
	}

	/** Seats a loose panel once it is brought within `reach` of its snap radius. */
	private trySeat(p: Panel, reach: number) {
		const radius = clamp(Math.min(p.slot.w, p.slot.h) * 0.9, 40, 80) * reach;
		if (Math.hypot(p.x, p.y) > radius) return false;
		if (this.press?.panel === p) this.release(false);
		p.phase = 'return';
		p.strain = 0;
		p.el.style.removeProperty('--tether-strain');
		const { x, y, w, h } = p.slot;
		for (const [cx, cy] of [
			[x, y],
			[x + w, y],
			[x, y + h],
			[x + w, y + h]
		]) {
			this.sparks(cx, cy, 6, 220);
		}
		this.shake = Math.max(this.shake, 0.35);
		navigator.vibrate?.(18);
		return true;
	}

	private springTo(
		p: Panel,
		tx: number,
		ty: number,
		trot: number,
		k: number,
		zeta: number,
		dt: number
	) {
		const c = 2 * Math.sqrt(k) * zeta;
		const steps = 2;
		const h = dt / steps;
		for (let i = 0; i < steps; i++) {
			p.vx += (k * (tx - p.x) - c * p.vx) * h;
			p.vy += (k * (ty - p.y) - c * p.vy) * h;
			p.vrot += (k * (trot - p.rot) - c * p.vrot) * h;
			p.x += p.vx * h;
			p.y += p.vy * h;
			p.rot += p.vrot * h;
		}
	}

	private settle(p: Panel) {
		p.phase = 'rest';
		p.x = p.y = p.vx = p.vy = p.rot = p.vrot = 0;
		p.strain = 0;
		p.ropes = [];
		p.el.style.transform = '';
		p.shown = [0, 0];
		p.el.style.removeProperty('--tether-strain');
		p.el.classList.remove('tether-lifted');
	}

	/**
	 * Keeps each loose panel's socket where its element sits in the layout, even
	 * when content above shifts. Rotating about the centre doesn't move the
	 * centre, so the slot is the centre of the element's (transformed) box minus
	 * the translation we applied. One read per panel, no transform toggling.
	 */
	private trackSlots() {
		const [vx, vy] = this.view();
		for (const p of this.panels) {
			if (p.phase === 'rest') continue;
			const r = p.el.getBoundingClientRect();
			p.slot.x = r.left + r.width / 2 + vx - p.shown[0] - p.slot.w / 2;
			p.slot.y = r.top + r.height / 2 + vy - p.shown[1] - p.slot.h / 2;
		}
	}

	/** The panel shakes in your hand as it is about to tear. */
	private jitter(p: Panel) {
		return this.press?.panel === p && this.press.grabbed ? p.strain * p.strain * 4 : 0;
	}

	private apply(p: Panel, jitter = 0) {
		const sx = this.shakeOffset(0);
		const sy = this.shakeOffset(1);
		const jx = jitter ? (Math.random() - 0.5) * jitter : 0;
		const jy = jitter ? (Math.random() - 0.5) * jitter : 0;
		p.shown = [p.x + jx + sx, p.y + jy + sy];
		p.el.style.transform = `translate3d(${p.shown[0]}px, ${p.shown[1]}px, 0) rotate(${p.rot}rad)`;
	}

	private shakeOffset(axis: number) {
		if (this.shake <= 0) return 0;
		return Math.sin(performance.now() * (axis ? 0.09 : 0.07)) * this.shake * this.shake * 10;
	}

	/** Pops a seated panel out of its socket; it keeps hanging on its wires. */
	private unlatch(p: Panel) {
		const rand = mulberry32(p.seed * 17 + Math.floor(performance.now()));
		p.phase = 'hang';
		p.wakeAt = 0;
		p.floor = this.layer.height;
		p.strain = 0;
		p.el.style.removeProperty('--tether-strain');
		for (const rope of p.ropes) {
			rope.length *= 1.3 + rand() * 0.5;
			rope.segLen = rope.length / (SEGMENTS - 1);
			rope.fragile = false;
			const [sx, sy] = this.socketPos(p, rope);
			this.sparks(sx, sy, 6, 240);
		}
		this.shake = Math.max(this.shake, 0.35);
		navigator.vibrate?.(20);
	}

	private rip(p: Panel) {
		const [vx, vy] = this.pointerVelocity();
		const press = this.press;
		const seated = p.phase === 'held';
		const dirMag = Math.hypot(p.x, p.y) || 1;
		this.release(false);
		const kick = seated ? 700 : 0;
		// Torn loose, it tumbles down and lands where you can still see it.
		p.phase = 'hang';
		p.wakeAt = 0;
		p.floor = -Infinity;
		p.vx = clamp(vx, -2600, 2600) + (p.x / dirMag) * kick;
		p.vy = clamp(vy, -2600, 2600) + (p.y / dirMag) * kick;
		const spin = press ? Math.sign(press.grabLocal[0] * p.vy - press.grabLocal[1] * p.vx) || 1 : 1;
		p.vrot = spin * (3 + Math.random() * 4);
		p.strain = 0;
		p.el.style.removeProperty('--tether-strain');
		for (const rope of p.ropes) this.snap(rope, 22, p);
		if (p.body) {
			p.body.setLinvel({ x: p.vx * M, y: p.vy * M }, true);
			p.body.setAngvel(p.vrot, true);
		}
		this.looseGroups(p, true);
		navigator.vibrate?.([35, 25, 70]);
		// The page holds with up to three panels torn off; a fourth brings it down.
		const loose = this.panels.filter(
			(q) => q.phase === 'hang' && !q.ropes.some((r) => r.attached)
		).length;
		if (this.state === 'intact' && loose > MAX_LOOSE) {
			this.shake = 1;
			this.collapse();
		} else {
			this.shake = Math.max(this.shake, 0.6);
		}
	}

	private collapse() {
		integrity.set('collapsing');
		const [vx, vy] = this.view();
		const ox = vx + window.innerWidth / 2;
		const oy = vy;
		const now = performance.now();
		const rest = this.panels
			.filter((p) => p.phase !== 'hang')
			.map((p) => {
				this.measure(p);
				return { p, d: Math.hypot(p.slot.x + p.slot.w / 2 - ox, p.slot.y + p.slot.h / 2 - oy) };
			})
			.sort((a, b) => a.d - b.d);
		let last = now;
		rest.forEach(({ p }, i) => {
			const rand = mulberry32(p.seed * 31 + Math.floor(now));
			if (p.phase === 'rest') p.ropes = this.makeRopes(p);
			// The wires pay out a little further than they stretch, and some of them
			// give way on the drop so panels hang crooked. One always holds.
			const keeper = Math.floor(rand() * p.ropes.length);
			p.ropes.forEach((rope, j) => {
				rope.length *= 1.15 + rand() * 0.8;
				rope.segLen = rope.length / (SEGMENTS - 1);
				rope.fragile = j !== keeper && rand() < 0.4;
			});
			p.phase = 'hang';
			p.floor = this.layer.height - 4;
			p.wakeAt = now + 240 + i * 90 + rand() * 80;
			last = Math.max(last, p.wakeAt);
			p.vx = (rand() - 0.5) * 220;
			p.vy = -80 - rand() * 160;
			p.vrot = (rand() - 0.5) * 2.4;
			p.strain = 0;
			p.el.classList.add('tether-lifted');
		});
		this.collapseReadyAt = last + 700;
		document.documentElement.classList.add('tether-exposed');
		this.start();
	}

	private updateIntegrity(now: number) {
		if (this.state === 'collapsing') {
			if (now > this.collapseReadyAt) integrity.set('collapsed');
		} else if (this.state === 'collapsed' && this.panels.every((p) => p.phase === 'rest')) {
			integrity.set('intact');
			document.documentElement.classList.remove('tether-exposed');
		}
	}

	// ---------------------------------------------------------------- wires

	private stepRope(p: Panel, rope: Rope, dt: number) {
		const n = SEGMENTS;
		const pos = rope.pos;
		const prev = rope.prev;
		const [ax, ay] = this.socketPos(p, rope);

		if (rope.attached && rope.fragile && p.phase === 'hang') {
			const [bx, by] = this.plugPos(p, rope);
			if (Math.hypot(bx - ax, by - ay) > rope.length * 0.985) this.snap(rope, 14, p);
		}

		if (p.phase === 'return') {
			// Reassembly winches every wire back into its socket.
			let next = rope.length - 700 * dt;
			if (rope.attached) {
				const [bx, by] = this.plugPos(p, rope);
				next = Math.max(next, Math.min(rope.length, Math.hypot(bx - ax, by - ay) * 1.02 + 2));
			}
			rope.length = Math.max(4, next);
			rope.segLen = rope.length / (SEGMENTS - 1);
		}

		const gravity = ROPE_GRAVITY * dt * dt;
		for (let i = 0; i < n; i++) {
			const ix = i * 2;
			const iy = ix + 1;
			const vx = (pos[ix] - prev[ix]) * 0.985;
			const vy = (pos[iy] - prev[iy]) * 0.985;
			prev[ix] = pos[ix];
			prev[iy] = pos[iy];
			pos[ix] += vx;
			pos[iy] += vy + gravity;
		}

		const end = rope.attached ? this.plugPos(p, rope) : null;
		for (let it = 0; it < 18; it++) {
			pos[0] = ax;
			pos[1] = ay;
			if (end) {
				pos[(n - 1) * 2] = end[0];
				pos[(n - 1) * 2 + 1] = end[1];
			}
			for (let i = 0; i < n - 1; i++) {
				const a = i * 2;
				const b = a + 2;
				const dx = pos[b] - pos[a];
				const dy = pos[b + 1] - pos[a + 1];
				const d = Math.hypot(dx, dy) || 0.0001;
				const diff = (d - rope.segLen) / d;
				const aPinned = i === 0;
				const bPinned = end !== null && i + 1 === n - 1;
				const wa = aPinned ? 0 : bPinned ? 1 : 0.5;
				const wb = bPinned ? 0 : aPinned ? 1 : 0.5;
				pos[a] += dx * diff * wa;
				pos[a + 1] += dy * diff * wa;
				pos[b] -= dx * diff * wb;
				pos[b + 1] -= dy * diff * wb;
			}
		}
		pos[0] = ax;
		pos[1] = ay;
		if (end) {
			pos[(n - 1) * 2] = end[0];
			pos[(n - 1) * 2 + 1] = end[1];
		} else if (Math.random() < dt * 0.12) {
			this.sparks(pos[(n - 1) * 2], pos[(n - 1) * 2 + 1], 5, 180);
		}
	}

	private snap(rope: Rope, sparks: number, p?: Panel) {
		if (!rope.attached) return;
		rope.attached = false;
		const joint = p?.joints.get(rope);
		if (p && joint) {
			this.world?.removeImpulseJoint(joint, true);
			p.joints.delete(rope);
		}
		const i = (SEGMENTS - 1) * 2;
		this.sparks(rope.pos[i], rope.pos[i + 1], sparks, 520);
		// Recoil: the cut wire springs back to about half its length, its freed end
		// whipping toward the socket.
		rope.length *= 0.5;
		rope.segLen = rope.length / (SEGMENTS - 1);
		const j = (SEGMENTS - 2) * 2;
		rope.prev[i] = rope.pos[i] + (rope.pos[i] - rope.pos[j]) * 0.6;
		rope.prev[i + 1] = rope.pos[i + 1] + (rope.pos[i + 1] - rope.pos[j + 1]) * 0.6;
	}

	private sparks(x: number, y: number, count: number, speed: number) {
		for (let i = 0; i < count && this.particles.length < 500; i++) {
			const a = Math.random() * Math.PI * 2;
			const s = speed * (0.3 + Math.random() * 0.9);
			const max = 0.25 + Math.random() * 0.45;
			this.particles.push({
				x,
				y,
				vx: Math.cos(a) * s,
				vy: Math.sin(a) * s - speed * 0.3,
				life: max,
				max
			});
		}
		this.start();
	}

	private stepParticles(dt: number) {
		for (const q of this.particles) {
			q.vy += 1300 * dt;
			q.vx *= 1 - 1.5 * dt;
			q.x += q.vx * dt;
			q.y += q.vy * dt;
			q.life -= dt;
		}
		this.particles = this.particles.filter((q) => q.life > 0);
	}

	// ---------------------------------------------------------------- render

	private onResize = () => {
		const canvas = this.canvas;
		if (canvas) {
			// The canvas scrolls with the page rather than being fixed, so native
			// (async) scrolling moves wires and panels together. It covers the
			// viewport plus half a screen above and below, and is re-anchored on
			// every frame it draws.
			// Sized for the tallest viewport seen, so Safari's toolbar showing and
			// hiding while you scroll doesn't reallocate (and blank) the canvas.
			const r = (this.host ?? document.documentElement).getBoundingClientRect();
			const width = r.width;
			this.tallest = Math.max(this.tallest, window.innerHeight);
			const buffer = Math.round(this.tallest / 2);
			const height = this.tallest + buffer * 2;
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			if (width !== this.layer.width || buffer !== this.layer.buffer || dpr !== this.dpr) {
				this.dpr = dpr;
				canvas.width = Math.round(width * dpr);
				canvas.height = Math.round(height * dpr);
				canvas.style.width = `${width}px`;
				canvas.style.height = `${height}px`;
			}
			this.layer = { width, height: r.height, buffer };
		}
		if (this.panels.some((p) => p.phase !== 'rest')) {
			this.measureAll();
			this.start();
		}
	};

	private hazardPattern(pal: Palette) {
		const cached = this.hazards.get(pal);
		if (cached !== undefined) return cached;
		const tile = document.createElement('canvas');
		tile.width = tile.height = 12;
		const c = tile.getContext('2d');
		if (!c || !this.ctx) return null;
		c.fillStyle = pal.stripeA;
		c.fillRect(0, 0, 12, 12);
		c.fillStyle = pal.stripeB;
		c.beginPath();
		c.moveTo(0, 12);
		c.lineTo(6, 0);
		c.lineTo(12, 0);
		c.lineTo(6, 12);
		c.closePath();
		c.fill();
		c.beginPath();
		c.moveTo(12, 6);
		c.lineTo(12, 12);
		c.lineTo(9, 12);
		c.closePath();
		c.fill();
		const pattern = this.ctx.createPattern(tile, 'repeat');
		this.hazards.set(pal, pattern);
		return pattern;
	}

	private draw(now: number) {
		const ctx = this.ctx;
		const canvas = this.canvas;
		if (!ctx || !canvas) return;
		const pal = document.documentElement.classList.contains('dark') ? DARK : LIGHT;
		const [vx, vy] = this.view();
		const originY = Math.max(0, vy - this.layer.buffer);
		canvas.style.transform = `translate3d(0, ${originY}px, 0)`;
		ctx.setTransform(1, 0, 0, 1, 0, 0);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		ctx.setTransform(
			this.dpr,
			0,
			0,
			this.dpr,
			this.shakeOffset(0) * this.dpr,
			(-originY + this.shakeOffset(1)) * this.dpr
		);

		const vx0 = vx - 200;
		const vy0 = vy - 400;
		const vx1 = vx + window.innerWidth + 200;
		const vy1 = vy + window.innerHeight + 400;
		const open = this.panels.filter((p) => p.phase !== 'rest');
		const visible = open.filter(
			(p) =>
				p.slot.x + p.slot.w > vx0 && p.slot.x < vx1 && p.slot.y + p.slot.h > vy0 && p.slot.y < vy1
		);

		for (const p of visible) this.drawCavity(ctx, p, now, pal);
		for (const p of open) for (const r of p.ropes) this.drawRope(ctx, p, r, 'shadow', pal);
		for (const p of open) {
			for (const r of p.ropes) this.drawSocket(ctx, p, r, pal);
			for (const r of p.ropes) this.drawRope(ctx, p, r, 'body', pal);
		}
		this.drawParticles(ctx, pal);
	}

	private drawCavity(ctx: CanvasRenderingContext2D, p: Panel, now: number, pal: Palette) {
		const shape = p.shape;
		const lip = shape ? SHAPE_LIP : LIP;
		const x = p.slot.x - lip;
		const y = p.slot.y - lip;
		const w = p.slot.w + lip * 2;
		const h = p.slot.h + lip * 2;
		const radius = Math.min(10, h / 2);
		const base = ctx.getTransform();

		ctx.save();
		if (shape) {
			// The hole follows the piece's outline, a little wider than the piece.
			const k = p.slot.w / shape.viewBox[2];
			ctx.translate(p.slot.x, p.slot.y);
			ctx.scale(k, k);
			ctx.translate(-shape.viewBox[0], -shape.viewBox[1]);
			ctx.lineJoin = 'round';
			const width = shape.stroke + (lip * 2) / k;
			ctx.strokeStyle = pal.rim;
			ctx.lineWidth = width + 3 / k;
			ctx.stroke(shape.path);
			ctx.strokeStyle = pal.cavity;
			ctx.lineWidth = width;
			ctx.stroke(shape.path);
			ctx.fillStyle = pal.cavity;
			ctx.fill(shape.path);
			ctx.clip(shape.path);
			ctx.setTransform(base);
		} else {
			ctx.beginPath();
			ctx.roundRect(x, y, w, h, radius);
			ctx.fillStyle = pal.cavity;
			ctx.fill();
			ctx.clip();
		}

		ctx.strokeStyle = pal.grid;
		ctx.lineWidth = 1;
		ctx.beginPath();
		for (let gx = x + 7; gx < x + w; gx += 14) {
			ctx.moveTo(gx, y);
			ctx.lineTo(gx, y + h);
		}
		for (let gy = y + 7; gy < y + h; gy += 14) {
			ctx.moveTo(x, gy);
			ctx.lineTo(x + w, gy);
		}
		ctx.stroke();

		ctx.lineWidth = 1.5;
		for (const t of p.traces) {
			const color = t.strong ? pal.traceStrong : pal.traceWeak;
			ctx.strokeStyle = color;
			ctx.beginPath();
			t.pts.forEach(([tx, ty], i) => (i ? ctx.lineTo(x + tx, y + ty) : ctx.moveTo(x + tx, y + ty)));
			ctx.stroke();
			ctx.fillStyle = color;
			for (const [tx, ty] of [t.pts[0], t.pts[t.pts.length - 1]]) {
				ctx.fillRect(x + tx - 2, y + ty - 2, 4, 4);
			}
		}

		// Depth: the lip casts a shadow onto the back plate.
		const depth = Math.min(22, h * 0.35);
		const top = ctx.createLinearGradient(0, y, 0, y + depth);
		top.addColorStop(0, pal.lipShadow);
		top.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = top;
		ctx.fillRect(x, y, w, depth);
		const left = ctx.createLinearGradient(x, 0, x + depth * 0.7, 0);
		left.addColorStop(0, pal.lipShadow);
		left.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = left;
		ctx.fillRect(x, y, depth, h);

		const alarm = this.state !== 'intact' || p.strain > 0.45;
		const blink = Math.sin(now / (alarm ? 90 : 600) + p.seed) > 0;
		p.leds.forEach(([lx, ly], i) => {
			const on = i === 0 ? blink : !blink || !alarm;
			ctx.fillStyle = on ? (alarm ? pal.ledAlarm : pal.led) : pal.ledOff;
			ctx.beginPath();
			ctx.arc(x + lx, y + ly, 2.2, 0, Math.PI * 2);
			ctx.fill();
			if (on) {
				const glow = ctx.createRadialGradient(x + lx, y + ly, 0, x + lx, y + ly, 9);
				glow.addColorStop(0, alarm ? pal.glowStrong : pal.glow);
				glow.addColorStop(1, 'rgba(0,0,0,0)');
				ctx.fillStyle = glow;
				ctx.fillRect(x + lx - 9, y + ly - 9, 18, 18);
			}
		});
		ctx.restore();
		if (shape) return;

		// Striped rim.
		ctx.save();
		ctx.beginPath();
		ctx.roundRect(x + 1.5, y + 1.5, w - 3, h - 3, Math.max(0, radius - 1.5));
		ctx.lineWidth = 3;
		ctx.strokeStyle = this.hazardPattern(pal) ?? pal.rim;
		ctx.globalAlpha = 0.75;
		ctx.stroke();
		ctx.globalAlpha = 1;
		ctx.beginPath();
		ctx.roundRect(x, y, w, h, radius);
		ctx.lineWidth = 1.5;
		ctx.strokeStyle = pal.rim;
		ctx.stroke();
		ctx.restore();

		if (h < 34) return;
		for (const [cx, cy] of [
			[x + 6, y + 6],
			[x + w - 6, y + 6],
			[x + 6, y + h - 6],
			[x + w - 6, y + h - 6]
		]) {
			ctx.fillStyle = pal.screw;
			ctx.beginPath();
			ctx.arc(cx, cy, 2.4, 0, Math.PI * 2);
			ctx.fill();
			ctx.strokeStyle = pal.screwSlot;
			ctx.lineWidth = 1;
			ctx.beginPath();
			ctx.moveTo(cx - 1.6, cy - 1.6);
			ctx.lineTo(cx + 1.6, cy + 1.6);
			ctx.stroke();
		}
	}

	private drawSocket(ctx: CanvasRenderingContext2D, p: Panel, rope: Rope, pal: Palette) {
		const [sx, sy] = this.socketPos(p, rope);
		ctx.fillStyle = pal.socket;
		ctx.strokeStyle = pal.socketRing;
		ctx.lineWidth = 1.5;
		ctx.beginPath();
		ctx.arc(sx, sy, rope.width + 2.5, 0, Math.PI * 2);
		ctx.fill();
		ctx.stroke();
	}

	private tracePath(ctx: CanvasRenderingContext2D, rope: Rope, ox: number, oy: number) {
		const pos = rope.pos;
		ctx.beginPath();
		ctx.moveTo(pos[0] + ox, pos[1] + oy);
		for (let i = 1; i < SEGMENTS - 1; i++) {
			const mx = (pos[i * 2] + pos[i * 2 + 2]) / 2;
			const my = (pos[i * 2 + 1] + pos[i * 2 + 3]) / 2;
			ctx.quadraticCurveTo(pos[i * 2] + ox, pos[i * 2 + 1] + oy, mx + ox, my + oy);
		}
		const e = (SEGMENTS - 1) * 2;
		ctx.lineTo(pos[e] + ox, pos[e + 1] + oy);
	}

	private drawRope(
		ctx: CanvasRenderingContext2D,
		p: Panel,
		rope: Rope,
		pass: 'shadow' | 'body',
		pal: Palette
	) {
		ctx.lineCap = 'round';
		ctx.lineJoin = 'round';
		if (pass === 'shadow') {
			this.tracePath(ctx, rope, 2, 4);
			ctx.strokeStyle = pal.wireShadow;
			ctx.lineWidth = rope.width + 1.5;
			ctx.stroke();
			return;
		}

		const pos = rope.pos;
		const e = (SEGMENTS - 1) * 2;
		const span = Math.hypot(pos[e] - pos[0], pos[e + 1] - pos[1]);
		const taut = rope.attached ? clamp((span / rope.length - 0.92) / 0.08, 0, 1) : 0;
		const heat = taut * Math.min(1, p.strain * 1.4);

		this.tracePath(ctx, rope, 0, 0);
		ctx.strokeStyle = pal.wires[rope.shade % pal.wires.length];
		ctx.lineWidth = rope.width;
		ctx.stroke();

		if (heat > 0.05) {
			ctx.save();
			ctx.globalCompositeOperation = pal.glowBlend;
			ctx.shadowColor = pal.heat(0.9);
			ctx.shadowBlur = 10 * heat;
			ctx.strokeStyle = pal.heat(0.7 * heat);
			ctx.lineWidth = rope.width * 0.8;
			ctx.stroke();
			ctx.restore();
		}

		this.tracePath(ctx, rope, -0.6, -0.8);
		ctx.strokeStyle = 'rgba(255,255,255,0.32)';
		ctx.lineWidth = Math.max(0.8, rope.width * 0.3);
		ctx.stroke();

		if (!rope.attached) {
			const ex = pos[e];
			const ey = pos[e + 1];
			const ang = Math.atan2(ey - pos[e - 1], ex - pos[e - 2]);
			ctx.strokeStyle = pal.strands;
			ctx.lineWidth = 1;
			for (const off of [-0.5, 0, 0.45]) {
				ctx.beginPath();
				ctx.moveTo(ex, ey);
				ctx.lineTo(ex + Math.cos(ang + off) * 6, ey + Math.sin(ang + off) * 6);
				ctx.stroke();
			}
		}
	}

	private drawParticles(ctx: CanvasRenderingContext2D, pal: Palette) {
		if (!this.particles.length) return;
		ctx.save();
		ctx.globalCompositeOperation = pal.glowBlend;
		ctx.lineCap = 'round';
		for (const q of this.particles) {
			const a = q.life / q.max;
			ctx.strokeStyle = pal.heat(a);
			ctx.lineWidth = 1.2 + a;
			ctx.beginPath();
			ctx.moveTo(q.x, q.y);
			ctx.lineTo(q.x - q.vx * 0.022, q.y - q.vy * 0.022);
			ctx.stroke();
		}
		ctx.restore();
	}
}

let engine: TetherEngine | null | undefined;

export function getEngine() {
	if (engine !== undefined) return engine;
	if (typeof window === 'undefined') return null;
	const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
	engine = reduced ? null : new TetherEngine();
	return engine;
}
