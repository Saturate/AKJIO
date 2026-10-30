"use client";

import { onTokensChange } from "@/lib/liveTokens";
import { prefersReducedMotion } from "@/lib/motion";
import { onRuntimeSettings, runtimeSettings } from "@/lib/runtimeSettings";
import { ColonyEngine, MARGIN, glitchChar } from "./engine";

// One rAF loop and one set of global listeners shared by every colony on the page.
// The loop only runs while at least one colony is on screen, and never under reduced motion.
const colonies = new Set<ColonyEngine>();
let raf = 0;
let last = 0;
let started = false;
let twitchInterval = 0;

function frame(now: number) {
	const dt = Math.min(0.05, (now - last) / 1000);
	last = now;
	let busy = false;
	if (!document.hidden) {
		const s = runtimeSettings();
		const growth = s.growth;
		const colonyOn = s.colony > 0;
		for (const c of colonies) {
			if (!c.visible) continue;
			c.setVisible(colonyOn);
			if (!colonyOn) continue;
			c.tick(dt, growth);
			c.drawGlow(now, dt);
			if (c.needsFrames) busy = true;
		}
	}
	// Stops once every visible colony is idle; pulses, sprouts, scrolling and setting changes wake it.
	raf = busy || document.hidden ? requestAnimationFrame(frame) : 0;
}

function wake() {
	if (raf || prefersReducedMotion()) return;
	last = performance.now();
	raf = requestAnimationFrame(frame);
}

// Track clicks in a region: spawn a new colony only after enough land nearby.
let clickCluster = { x: 0, y: 0, n: 0, t: 0 };
const SPAWN_THRESHOLD = 4;
const CLUSTER_RADIUS = 80;
const CLUSTER_TIMEOUT = 2000;

function onPointerDown(e: PointerEvent) {
	let best: { c: ColonyEngine; x: number; y: number; edge: number } | null =
		null;
	for (const c of colonies) {
		if (!c.visible) continue;
		const r = c.el.getBoundingClientRect();
		const x = e.clientX - r.left + MARGIN;
		const y = e.clientY - r.top + MARGIN;
		if (x < -70 || y < -70 || x > c.W + 70 || y > c.H + 70) continue;
		const { w, h } = c.box;
		const edge = Math.min(
			Math.abs(x - MARGIN),
			Math.abs(x - MARGIN - w),
			Math.abs(y - MARGIN),
			Math.abs(y - MARGIN - h),
		);
		if (!best || edge < best.edge) best = { c, x, y, edge };
	}
	if (!best) return;
	const now = performance.now();
	const dx = best.x - clickCluster.x;
	const dy = best.y - clickCluster.y;
	if (
		Math.hypot(dx, dy) < CLUSTER_RADIUS &&
		now - clickCluster.t < CLUSTER_TIMEOUT
	) {
		clickCluster.n++;
	} else {
		clickCluster = { x: best.x, y: best.y, n: 1, t: now };
	}
	clickCluster.t = now;

	best.c.sprout(best.x, best.y);
	if (clickCluster.n >= SPAWN_THRESHOLD) {
		best.c.spawn(best.x, best.y);
		clickCluster.n = 0;
	}
	wake();
}

// Infected letters twitch now and then.
function twitch() {
	if (document.hidden || !runtimeSettings().glitch) return;
	const list = document.querySelectorAll<HTMLElement>(".ch-inf");
	if (!list.length) return;
	glitchChar(list[Math.floor(Math.random() * list.length)]);
	if (Math.random() < 0.3) {
		window.setTimeout(
			() => glitchChar(list[Math.floor(Math.random() * list.length)]),
			120,
		);
	}
}

function isTyping(): boolean {
	const el = document.activeElement;
	if (!el) return false;
	const tag = el.tagName;
	return (
		tag === "INPUT" ||
		tag === "TEXTAREA" ||
		tag === "SELECT" ||
		(el as HTMLElement).isContentEditable
	);
}

function onKeyDown(e: KeyboardEvent) {
	if (e.repeat || e.metaKey || e.ctrlKey || e.altKey || isTyping()) return;
	let any = false;
	for (const c of colonies) {
		if (!c.visible) continue;
		if (c.infectNear(2) > 0) any = true;
	}
	if (any) wake();
}

function start() {
	if (started) return;
	started = true;
	onTokensChange(() => {
		colonies.forEach((c) => c.redraw());
		wake();
	});
	// Length and reach change the shape, so colonies replay their growth at the new scale.
	let length = runtimeSettings().length;
	let reach = runtimeSettings().reach;
	onRuntimeSettings(() => {
		const s = runtimeSettings();
		if (s.length !== length || s.reach !== reach) {
			length = s.length;
			reach = s.reach;
			colonies.forEach((c) => c.layout(true));
		}
		wake();
	});
	if (prefersReducedMotion()) return;
	window.addEventListener("pointerdown", onPointerDown, { passive: true });
	window.addEventListener("keydown", onKeyDown);
	twitchInterval = window.setInterval(twitch, 1700);
}

export function registerColony(c: ColonyEngine): () => void {
	start();
	colonies.add(c);
	c.onWake = wake;
	wake();
	return () => {
		colonies.delete(c);
		c.destroy();
		if (colonies.size === 0 && twitchInterval) {
			clearInterval(twitchInterval);
			twitchInterval = 0;
		}
	};
}

export function pulseAll(): void {
	colonies.forEach((c) => c.pulse(true));
	wake();
}
