"use client";

import { onTokensChange } from "@/lib/liveTokens";
import { prefersReducedMotion } from "@/lib/motion";
import { ColonyEngine, MARGIN, glitchChar } from "./engine";

// One rAF loop and one set of global listeners shared by every colony on the page.
const colonies = new Set<ColonyEngine>();
let raf = 0;
let last = 0;
let started = false;

function frame(now: number) {
	const dt = Math.min(0.05, (now - last) / 1000);
	last = now;
	if (!document.hidden) {
		for (const c of colonies) {
			if (!c.visible) continue;
			c.tick(dt, 1);
			c.drawGlow(now, dt);
		}
	}
	raf = colonies.size ? requestAnimationFrame(frame) : 0;
}

// Clicking near any network makes the closest one grow toward the pointer.
function onPointerDown(e: PointerEvent) {
	let best: { c: ColonyEngine; x: number; y: number; edge: number } | null = null;
	for (const c of colonies) {
		if (!c.visible) continue;
		const r = c.el.getBoundingClientRect();
		const x = e.clientX - r.left + MARGIN;
		const y = e.clientY - r.top + MARGIN;
		if (x < -70 || y < -70 || x > c.W + 70 || y > c.H + 70) continue;
		const { w, h } = c.box;
		const edge = Math.min(Math.abs(x - MARGIN), Math.abs(x - MARGIN - w), Math.abs(y - MARGIN), Math.abs(y - MARGIN - h));
		if (!best || edge < best.edge) best = { c, x, y, edge };
	}
	best?.c.sprout(best.x, best.y);
}

// Infected letters twitch now and then.
function twitch() {
	if (document.hidden) return;
	const list = document.querySelectorAll<HTMLElement>(".ch-inf");
	if (!list.length) return;
	glitchChar(list[Math.floor(Math.random() * list.length)]);
	if (Math.random() < 0.3) {
		window.setTimeout(() => glitchChar(list[Math.floor(Math.random() * list.length)]), 120);
	}
}

function start() {
	if (started) return;
	started = true;
	onTokensChange(() => colonies.forEach((c) => c.redraw()));
	if (prefersReducedMotion()) return;
	window.addEventListener("pointerdown", onPointerDown, { passive: true });
	window.setInterval(twitch, 1700);
}

export function registerColony(c: ColonyEngine): () => void {
	start();
	colonies.add(c);
	if (!raf) {
		last = performance.now();
		raf = requestAnimationFrame(frame);
	}
	return () => {
		colonies.delete(c);
		c.destroy();
	};
}

export function pulseAll(): void {
	colonies.forEach((c) => c.pulse(true));
}
