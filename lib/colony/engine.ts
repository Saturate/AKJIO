"use client";

import { liveTokens } from "@/lib/liveTokens";
import { prefersReducedMotion, randomGlyph } from "@/lib/motion";
import { mulberry } from "@/lib/random";
import { runtimeSettings } from "@/lib/runtimeSettings";

export const MARGIN = 80;
const NORMALS: ReadonlyArray<readonly [number, number]> = [
	[0, -1],
	[1, 0],
	[0, 1],
	[-1, 0],
];

export type ColonyOptions = {
	seed: number;
	/** Chance a tendril points into the element instead of away from it. */
	inward: number;
	/** Max tendril length in px. */
	reach: number;
	/** 0 top-left, 1 top-right, 2 bottom-right, 3 bottom-left. */
	corners: readonly number[];
	/** 0 top, 1 right, 2 bottom, 3 left. */
	edges: readonly number[];
	/** Letters (`.ch`) inside a `[data-infect]` descendant get infected on contact. */
	infect: boolean;
};

type Point = [x: number, y: number, w: number];
type Strand = {
	id: number;
	parentId: number;
	pts: Point[];
	children: Array<{ at: number; s: Strand }>;
};
type Runner = {
	kind: "runner";
	e: number;
	dir: 1 | -1;
	t: number;
	off: number;
	w: number;
	len: number;
	max: number;
	turns: number;
	s: Strand;
};
type Tendril = {
	kind: "tendril";
	x: number;
	y: number;
	ang: number;
	w: number;
	len: number;
	max: number;
	depth: number;
	s: Strand;
};
type Agent = Runner | Tendril;
type Pulse = { s: Strand; pos: number; v: number; ci: number };
type Target = { el: HTMLElement; x: number; y: number; w: number; h: number };

export function glitchChar(el: HTMLElement): void {
	if (
		prefersReducedMotion() ||
		!runtimeSettings().glitch ||
		el.dataset.glitching
	)
		return;
	el.dataset.glitching = "1";
	// The glyph is drawn over the letter by CSS (attr(data-g)) instead of replacing it, so the
	// letter keeps its width and the rest of the line doesn't jump while it glitches
	el.dataset.g = randomGlyph();
	el.classList.add("ch-gl");
	window.setTimeout(
		() => {
			el.classList.remove("ch-gl");
			delete el.dataset.g;
			delete el.dataset.glitching;
		},
		70 + Math.random() * 90,
	);
}

// One hyphae network living on an element's border. Seeded, so a resize replays the same growth.
export class ColonyEngine {
	readonly el: HTMLElement;
	private readonly o: ColonyOptions;
	private readonly trail: HTMLCanvasElement;
	private readonly glow: HTMLCanvasElement;
	private ctx: CanvasRenderingContext2D | null = null;
	private g: CanvasRenderingContext2D | null = null;
	private readonly reduced = prefersReducedMotion();
	private readonly ro: ResizeObserver;
	private readonly io: IntersectionObserver;

	visible = false;
	/** Set by the loop so a colony scrolling into view or starting a pulse can restart a stopped rAF. */
	onWake: () => void = () => {};
	private size = "";
	private lastKnotFrame = 0;
	/** Length multiplier captured at reset, so a layout replay grows the same shape. */
	private length = 1;
	private reachMul = 1;
	private w = 0;
	private h = 0;
	W = 0;
	H = 0;
	private rnd: () => number = Math.random;
	private corners: Array<readonly [number, number]> = [];
	strands: Strand[] = [];
	private agents: Agent[] = [];
	private spawned: Agent[] = [];
	private knots: Point[] = [];
	private hash = new Map<number, number>();
	private steps = 0;
	private age = 0;
	private acc = 0;
	private drawing = false;
	private pulses: Pulse[] = [];
	private lastPulse = 0;
	private glowDirty = false;
	private targets: Target[] | null = null;
	private bounds: [number, number, number, number] = [0, 0, 0, 0];

	constructor(
		el: HTMLElement,
		trail: HTMLCanvasElement,
		glow: HTMLCanvasElement,
		options: ColonyOptions,
	) {
		this.el = el;
		this.trail = trail;
		this.glow = glow;
		this.o = options;
		this.ro = new ResizeObserver(() => this.layout(false));
		this.io = new IntersectionObserver(
			([entry]) => {
				this.visible = entry?.isIntersecting ?? false;
				if (this.visible) this.onWake();
			},
			{ rootMargin: "120px" },
		);
		this.ro.observe(el);
		this.io.observe(el);
	}

	destroy(): void {
		this.ro.disconnect();
		this.io.disconnect();
	}

	setVisible(on: boolean): void {
		this.trail.style.display = on ? "" : "none";
		this.glow.style.display = on ? "" : "none";
	}

	get box(): { w: number; h: number } {
		return { w: this.w, h: this.h };
	}

	layout(force: boolean): void {
		const w = this.el.offsetWidth;
		const h = this.el.offsetHeight;
		if (!w || !h) return;
		const key = `${w}x${h}`;
		if (key === this.size && !force) return;
		this.size = key;
		const dpr = Math.min(2, window.devicePixelRatio || 1);
		this.w = w;
		this.h = h;
		this.W = w + 2 * MARGIN;
		this.H = h + 2 * MARGIN;
		for (const c of [this.trail, this.glow]) {
			c.width = Math.round(this.W * dpr);
			c.height = Math.round(this.H * dpr);
			c.style.width = `${this.W}px`;
			c.style.height = `${this.H}px`;
			c.getContext("2d")?.setTransform(dpr, 0, 0, dpr, 0, 0);
		}
		this.ctx = this.trail.getContext("2d");
		this.g = this.glow.getContext("2d");
		const target = this.reduced ? Infinity : this.steps;
		this.reset();
		this.measure();
		let guard = 0;
		while (this.steps < target && this.agents.length && guard++ < 30000)
			this.step(false);
		this.redraw();
	}

	private reset(): void {
		const rnd = (this.rnd = mulberry(this.o.seed));
		this.length = runtimeSettings().length;
		this.reachMul = runtimeSettings().reach;
		this.strands = [];
		this.agents = [];
		this.spawned = [];
		this.knots = [];
		this.hash = new Map();
		this.steps = 0;
		const x0 = MARGIN;
		const y0 = MARGIN;
		const x1 = MARGIN + this.w;
		const y1 = MARGIN + this.h;
		this.corners = [
			[x0, y0],
			[x1, y0],
			[x1, y1],
			[x0, y1],
		];
		const perimeter = 2 * (this.w + this.h);
		for (const ci of this.o.corners) {
			if (rnd() < 0.12) continue;
			if (rnd() < 0.85) this.runner(ci, 1, perimeter, 0);
			if (rnd() < 0.85) this.runner((ci + 3) % 4, -1, perimeter, 0);
		}
		// Long frames (the posts list) would otherwise only grow at the corners and stay bare in
		// the middle, so they get extra seeds along the edges, growing both ways from each point.
		// Seeds are spread by length along the allowed edges, so long sides get proportionally more.
		const allowed = this.o.edges.filter((e) => this.edgeLength(e) >= 240);
		const span = allowed.reduce((sum, e) => sum + this.edgeLength(e), 0);
		const seeds = Math.floor(span / 600);
		const local = Math.min(perimeter, 1200);
		for (let i = 0; i < seeds; i++) {
			let d = rnd() * span;
			const e = allowed.find((edge) => (d -= this.edgeLength(edge)) < 0);
			if (e === undefined) continue;
			const L = this.edgeLength(e);
			const pos = Math.min(L * 0.92, Math.max(L * 0.08, d + L));
			if (rnd() < 0.85) this.runner(e, 1, local, pos);
			if (rnd() < 0.85) this.runner(e, -1, local, L - pos);
		}
		this.agents = this.spawned;
		this.spawned = [];
	}

	private newStrand(parent: Strand | null): Strand {
		const s: Strand = {
			id: this.strands.length,
			parentId: parent ? parent.id : -1,
			pts: [],
			children: [],
		};
		this.strands.push(s);
		return s;
	}

	private edgeLength(e: number): number {
		return e % 2 ? this.h : this.w;
	}

	/** t0: start distance along the edge, measured in the runner's direction of travel. */
	private runner(e: number, dir: 1 | -1, perimeter: number, t0: number): void {
		if (!this.o.edges.includes(e)) return;
		const s = this.newStrand(null);
		const a: Runner = {
			kind: "runner",
			e,
			dir,
			t: t0,
			off: 0,
			w: 0.9 + this.rnd() * 0.5,
			len: 0,
			max: perimeter * (0.08 + this.rnd() * 0.2) * this.length,
			turns: 0,
			s,
		};
		const [x, y] = this.runnerPos(a);
		s.pts.push([x, y, a.w]);
		this.spawned.push(a);
	}

	private runnerPos(a: Runner): [number, number] {
		const A = this.corners[a.e];
		const B = this.corners[(a.e + 1) % 4];
		const S = a.dir > 0 ? A : B;
		const E = a.dir > 0 ? B : A;
		const k = a.t / this.edgeLength(a.e);
		const [nx, ny] = NORMALS[a.e];
		return [
			S[0] + (E[0] - S[0]) * k + nx * a.off,
			S[1] + (E[1] - S[1]) * k + ny * a.off,
		];
	}

	private tendril(
		parent: Agent,
		x: number,
		y: number,
		ang: number,
		w: number,
		max: number,
		depth: number,
	): void {
		if (max < 4) return;
		const s = this.newStrand(parent.s);
		parent.s.children.push({ at: parent.s.pts.length - 1, s });
		s.pts.push([x, y, w]);
		this.spawned.push({ kind: "tendril", x, y, ang, w, len: 0, max, depth, s });
	}

	private step(draw: boolean): void {
		this.steps++;
		this.drawing = draw;
		const rnd = this.rnd;
		const next: Agent[] = [];
		for (const a of this.agents) {
			let x: number;
			let y: number;
			if (a.kind === "runner") {
				a.t += 1;
				a.len++;
				const L = this.edgeLength(a.e);
				if (a.t > L) {
					const ne = a.dir > 0 ? (a.e + 1) % 4 : (a.e + 3) % 4;
					if (a.turns < 2 && rnd() < 0.55 && this.o.edges.includes(ne)) {
						a.e = ne;
						a.t -= L;
						a.turns++;
					} else {
						this.die(a, rnd() < 0.5);
						continue;
					}
				}
				a.off += (rnd() - 0.5) * 1.4;
				a.off = Math.max(-3, Math.min(6, a.off * 0.97));
				[x, y] = this.runnerPos(a);
				a.w *= 0.9985;
				if (rnd() < 0.032) {
					const [nx, ny] = NORMALS[a.e];
					const inward = rnd() < this.o.inward;
					const base = Math.atan2(ny, nx) + (inward ? Math.PI : 0);
					const reach = inward ? this.o.reach : this.o.reach * 0.6;
					this.tendril(
						a,
						x,
						y,
						base + (rnd() - 0.5) * 1.1,
						Math.max(0.6, a.w * 0.8),
						(8 + rnd() * reach) * this.length * this.reachMul,
						1,
					);
				}
			} else {
				// Steer away from the canvas edge so tendrils curve back
				// instead of dying at the boundary.
				const pad = 8;
				const ex =
					a.x < pad ? pad - a.x : a.x > this.W - pad ? this.W - pad - a.x : 0;
				const ey =
					a.y < pad ? pad - a.y : a.y > this.H - pad ? this.H - pad - a.y : 0;
				if (ex !== 0 || ey !== 0) {
					const want = Math.atan2(ey, ex);
					let da = want - a.ang;
					da = da - Math.round(da / (Math.PI * 2)) * Math.PI * 2;
					a.ang += da * 0.35;
				}

				a.ang += (rnd() - 0.5) * 0.55;
				x = a.x + Math.cos(a.ang);
				y = a.y + Math.sin(a.ang);
				a.x = x;
				a.y = y;
				a.len++;
				a.w *= 0.982;
				if (a.depth < 3 && rnd() < 0.035) {
					const side = rnd() < 0.5 ? -1 : 1;
					this.tendril(
						a,
						x,
						y,
						a.ang + side * (0.6 + rnd() * 0.5),
						a.w * 0.85,
						(a.max - a.len) * 0.6,
						a.depth + 1,
					);
				}
			}
			if (
				a.w < 0.2 ||
				a.len > a.max ||
				x < -2 ||
				y < -2 ||
				x > this.W + 2 ||
				y > this.H + 2
			) {
				this.die(a, a.kind === "tendril" && rnd() < 0.4);
				continue;
			}
			// Strands that meet fuse instead of crossing.
			const key = (x >> 2) * 4096 + (y >> 2);
			const hit = this.hash.get(key);
			if (
				hit !== undefined &&
				hit !== a.s.id &&
				hit !== a.s.parentId &&
				a.len > 8
			) {
				this.push(a, x, y);
				this.die(a, false);
				continue;
			}
			this.hash.set(key, a.s.id);
			this.push(a, x, y);
			if (this.targets) this.touch(x, y);
			next.push(a);
		}
		this.agents = next.concat(this.spawned);
		this.spawned = [];
	}

	private push(a: Agent, x: number, y: number): void {
		const pts = a.s.pts;
		const p = pts[pts.length - 1];
		const q: Point = [x, y, a.w];
		pts.push(q);
		if (this.drawing && p) this.seg(p, q);
	}

	private die(a: Agent, knot: boolean): void {
		if (!knot) return;
		const p = a.s.pts[a.s.pts.length - 1];
		if (!p) return;
		const k: Point = [p[0], p[1], 0.9 + this.rnd() * 1.1];
		this.knots.push(k);
		if (this.drawing) this.knot(k);
	}

	private seg(p: Point, q: Point): void {
		const c = this.ctx;
		if (!c) return;
		const { tokens, dark } = liveTokens();
		c.globalAlpha = dark ? 0.55 : 0.45;
		c.strokeStyle = tokens.growth;
		c.lineWidth = q[2];
		c.lineCap = "round";
		c.beginPath();
		c.moveTo(p[0], p[1]);
		c.lineTo(q[0], q[1]);
		c.stroke();
	}

	private knot(k: Point): void {
		const c = this.ctx;
		if (!c) return;
		c.globalAlpha = 0.75;
		c.fillStyle = liveTokens().tokens.growth;
		c.beginPath();
		c.arc(k[0], k[1], k[2], 0, 6.283);
		c.fill();
	}

	redraw(): void {
		if (!this.ctx) return;
		this.ctx.clearRect(0, 0, this.W, this.H);
		for (const s of this.strands)
			for (let i = 1; i < s.pts.length; i++) this.seg(s.pts[i - 1], s.pts[i]);
		for (const k of this.knots) this.knot(k);
		this.glowDirty = true;
	}

	private measure(): void {
		this.targets = null;
		if (!this.o.infect) return;
		const host = this.el.querySelector("[data-infect]");
		if (!host) return;
		const er = this.el.getBoundingClientRect();
		const targets: Target[] = [];
		for (const el of host.querySelectorAll<HTMLElement>(".ch")) {
			if (!el.dataset.c?.trim()) continue;
			const r = el.getBoundingClientRect();
			targets.push({
				el,
				x: r.left - er.left + MARGIN,
				y: r.top - er.top + MARGIN,
				w: r.width,
				h: r.height,
			});
		}
		if (!targets.length) return;
		this.targets = targets;
		this.bounds = [
			Math.min(...targets.map((t) => t.x)) - 4,
			Math.min(...targets.map((t) => t.y)) - 4,
			Math.max(...targets.map((t) => t.x + t.w)) + 4,
			Math.max(...targets.map((t) => t.y + t.h)) + 4,
		];
	}

	private touch(x: number, y: number): void {
		const [bx0, by0, bx1, by1] = this.bounds;
		if (!this.targets || x < bx0 || y < by0 || x > bx1 || y > by1) return;
		for (const t of this.targets) {
			if (t.el.classList.contains("ch-inf")) continue;
			if (
				x > t.x - 2 &&
				x < t.x + t.w + 2 &&
				y > t.y - 2 &&
				y < t.y + t.h + 2
			) {
				t.el.classList.add("ch-inf");
				if (this.drawing) glitchChar(t.el);
			}
		}
	}

	tick(dt: number, speed: number): void {
		// Frozen colonies don't age, so unfreezing resumes the curve where it stopped.
		if (this.reduced || !this.ctx || speed === 0) return;
		this.age += dt;
		const rate = (2 + 32 * Math.exp(-this.age / 6)) * speed;
		this.acc += rate * dt;
		let n = 0;
		while (this.acc >= 1 && this.agents.length && n++ < 400) {
			this.step(true);
			this.acc -= 1;
		}
		if (!this.agents.length) this.acc = 0;
	}

	/** True while something is animating: growth, tips or pulses. Knots alone don't count. */
	get active(): boolean {
		return (
			(this.agents.length > 0 && runtimeSettings().growth > 0) ||
			this.pulses.length > 0
		);
	}

	/** Whether the loop needs to keep calling this colony: growing, pulsing, or knots breathing in dark mode. */
	get needsFrames(): boolean {
		return (
			this.active ||
			(!this.reduced && this.knots.length > 0 && liveTokens().dark) ||
			this.glowDirty
		);
	}

	pulse(force: boolean): void {
		if (this.reduced || !runtimeSettings().pulses) return;
		const now = performance.now();
		if (!force && now - this.lastPulse < 1500) return;
		this.lastPulse = now;
		const roots = this.strands.filter(
			(s) => s.parentId < 0 && s.pts.length > 2,
		);
		const n = Math.min(
			roots.length,
			force ? 2 : 1 + (Math.random() < 0.4 ? 1 : 0),
		);
		for (let i = 0; i < n && this.pulses.length < 4; i++) {
			const [s] = roots.splice(Math.floor(Math.random() * roots.length), 1);
			if (s)
				this.pulses.push({ s, pos: 0, v: 110 + Math.random() * 50, ci: 0 });
		}
		if (this.pulses.length) this.onWake();
	}

	private nearest(
		x: number,
		y: number,
		max: number,
	): { d: number; s: Strand; i: number } | null {
		let best: { d: number; s: Strand; i: number } | null = null;
		let bd = max;
		for (const s of this.strands) {
			for (let i = 0; i < s.pts.length; i += 2) {
				const p = s.pts[i];
				const d = Math.hypot(p[0] - x, p[1] - y);
				if (d < bd) {
					bd = d;
					best = { d, s, i };
				}
			}
		}
		return best;
	}

	// Click near the network: sprout a few tendrils from the closest point toward the click.
	sprout(x: number, y: number): boolean {
		if (this.reduced) return false;
		this.reachMul = runtimeSettings().reach;
		const hit = this.nearest(x, y, 70);
		if (!hit) return false;
		const p = hit.s.pts[hit.i];
		const base = Math.atan2(y - p[1], x - p[0]);
		const n = 2 + (Math.random() < 0.5 ? 1 : 0);
		for (let k = 0; k < n; k++) {
			const s = this.newStrand(hit.s);
			hit.s.children.push({ at: hit.i, s });
			hit.s.children.sort((a, b) => a.at - b.at);
			s.pts.push([p[0], p[1], 0.9]);
			const ang = base + (k - (n - 1) / 2) * 0.5 + (Math.random() - 0.5) * 0.3;
			this.agents.push({
				kind: "tendril",
				x: p[0],
				y: p[1],
				ang,
				w: 0.95,
				len: 0,
				max: (hit.d + 18 + Math.random() * 30) * this.reachMul,
				depth: 1,
				s,
			});
		}
		this.age = Math.min(this.age, 2);
		return true;
	}

	// Seed a new colony on the nearest border, tendrils aimed toward (tx, ty).
	spawn(tx: number, ty: number): boolean {
		if (this.reduced) return false;
		this.reachMul = runtimeSettings().reach;
		const m = MARGIN;
		const edges: Array<{ x: number; y: number; d: number }> = [
			{ x: Math.max(m, Math.min(m + this.w, tx)), y: m, d: Math.abs(ty - m) },
			{ x: m + this.w, y: Math.max(m, Math.min(m + this.h, ty)), d: Math.abs(tx - m - this.w) },
			{ x: Math.max(m, Math.min(m + this.w, tx)), y: m + this.h, d: Math.abs(ty - m - this.h) },
			{ x: m, y: Math.max(m, Math.min(m + this.h, ty)), d: Math.abs(tx - m) },
		];
		edges.sort((a, b) => a.d - b.d);
		const anchor = edges[0];
		const base = Math.atan2(ty - anchor.y, tx - anchor.x);
		const n = 3 + Math.floor(Math.random() * 3);
		for (let k = 0; k < n; k++) {
			const s = this.newStrand(null);
			s.pts.push([anchor.x, anchor.y, 0.85]);
			const ang = base + (k - (n - 1) / 2) * 0.4 + (Math.random() - 0.5) * 0.3;
			this.agents.push({
				kind: "tendril",
				x: anchor.x,
				y: anchor.y,
				ang,
				w: 0.85,
				len: 0,
				max: (20 + Math.random() * 40) * this.reachMul,
				depth: 0,
				s,
			});
		}
		this.age = Math.min(this.age, 2);
		return true;
	}

	infectNear(limit: number): number {
		if (this.reduced || !this.o.infect) return 0;
		this.measure();
		if (!this.targets) return 0;
		const uninfected = this.targets.filter(
			(t) => !t.el.classList.contains("ch-inf"),
		);
		if (!uninfected.length) return 0;
		let hit = 0;
		for (const t of uninfected) {
			if (hit >= limit) break;
			const cx = t.x + t.w / 2;
			const cy = t.y + t.h / 2;
			if (this.nearest(cx, cy, 60)) {
				t.el.classList.add("ch-inf");
				glitchChar(t.el);
				hit++;
			}
		}
		return hit;
	}

	drawGlow(now: number, dt: number): void {
		const g = this.g;
		if (!g) return;
		const { tokens, dark } = liveTokens();
		// Knots breathing is the only thing left once growth ends; it doesn't need 60fps,
		// and under reduced motion it doesn't run at all.
		const breathing = dark && this.knots.length > 0 && !this.reduced;
		if (!this.active && !breathing) {
			if (this.glowDirty) {
				g.clearRect(0, 0, this.W, this.H);
				this.glowDirty = false;
			}
			return;
		}
		if (!this.active) {
			if (now - this.lastKnotFrame < 100) return;
			this.lastKnotFrame = now;
		}
		this.glowDirty = true;
		g.clearRect(0, 0, this.W, this.H);
		g.shadowBlur = dark ? 10 : 0;
		g.shadowColor = tokens.tip;
		g.fillStyle = tokens.tip;
		for (const a of this.agents) {
			const p = a.s.pts[a.s.pts.length - 1];
			if (!p) continue;
			g.globalAlpha = dark ? 0.9 : 0.7;
			g.beginPath();
			g.arc(p[0], p[1], p[2] * 0.9 + 0.7, 0, 6.283);
			g.fill();
		}
		if (breathing) {
			this.knots.forEach((k, i) => {
				g.globalAlpha =
					0.16 + 0.24 * (0.5 + 0.5 * Math.sin(now / 1300 + i * 1.7));
				g.beginPath();
				g.arc(k[0], k[1], k[2] * 0.8, 0, 6.283);
				g.fill();
			});
		}
		const TRAIL = 7;
		const keep: Pulse[] = [];
		const queue = [...this.pulses];
		while (queue.length) {
			const p = queue.shift();
			if (!p) break;
			p.pos += p.v * dt;
			const i = Math.floor(p.pos);
			const pts = p.s.pts;
			const kids = p.s.children;
			while (p.ci < kids.length && kids[p.ci].at <= i) {
				if (keep.length + queue.length < 4 && Math.random() < 0.35)
					queue.push({ s: kids[p.ci].s, pos: 0, v: p.v * 0.9, ci: 0 });
				p.ci++;
			}
			if (i >= pts.length + TRAIL) continue;
			const fade = Math.max(0, Math.min(1, (pts.length - i + TRAIL) / TRAIL));
			for (let k = 0; k < TRAIL; k++) {
				const idx = i - k;
				if (idx < 0) break;
				if (idx >= pts.length) continue;
				const q = pts[idx];
				const f = 1 - k / TRAIL;
				g.globalAlpha = f * fade * (dark ? 0.75 : 0.6);
				g.beginPath();
				g.arc(q[0], q[1], q[2] * 0.5 + 0.8 * f, 0, 6.283);
				g.fill();
			}
			keep.push(p);
		}
		this.pulses = keep;
	}
}
