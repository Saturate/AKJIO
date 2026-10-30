"use client";

import { useEffect, useRef } from "react";
import { liveTokens, onTokensChange, rgba } from "@/lib/liveTokens";
import { onRuntimeSettings, runtimeSettings } from "@/lib/runtimeSettings";
import { prefersReducedMotion } from "@/lib/motion";
import { mulberry } from "@/lib/random";
import styles from "./SporeField.module.css";

type Spore = {
	x: number;
	y: number;
	r: number;
	par: number;
	layer: 0 | 1 | 2;
	ph: number;
	drift: number;
	tint: number;
	rank: number;
	dx: number;
	dy: number;
	vx: number;
	vy: number;
	sx: number;
	sy: number;
};

type Puff = {
	x: number;
	y: number;
	vx: number;
	vy: number;
	r: number;
	life: number;
	decay: number;
};

function makeSpores(): Spore[] {
	const r = mulberry(7);
	const out: Spore[] = [];
	const add = (
		n: number,
		layer: Spore["layer"],
		rmin: number,
		rmax: number,
		par: number,
	) => {
		for (let i = 0; i < n; i++) {
			out.push({
				x: r(),
				y: r(),
				r: rmin + r() * (rmax - rmin),
				par,
				layer,
				ph: r() * 6.28,
				drift: (r() - 0.5) * 0.004,
				tint: r(),
				rank: r(),
				dx: 0,
				dy: 0,
				vx: 0,
				vy: 0,
				sx: 0,
				sy: 0,
			});
		}
	};
	// Twice the default field; the density setting shows the share with rank < density / 2.
	add(180, 0, 0.3, 0.8, 0.04);
	add(80, 1, 0.6, 1.6, 0.14);
	add(14, 2, 10, 26, 0.32);
	return out;
}

// Background spores: two dot layers plus blurred near ones. Each spore has a home position and a
// spring-damped displacement, so the pointer and keystrokes push them and they settle back.
export default function SporeField() {
	const ref = useRef<HTMLCanvasElement>(null);

	useEffect(() => {
		const canvas = ref.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx) return;
		const reduced = prefersReducedMotion();
		const spores = makeSpores();
		let puffs: Puff[] = [];
		const ptr = { x: -1e4, y: -1e4, vx: 0, vy: 0, t: 0 };
		let raf = 0;
		let last = 0;

		const puff = (x: number, y: number) => {
			const n = 10 + Math.floor(Math.random() * 6);
			for (let i = 0; i < n; i++) {
				const a = Math.random() * 6.283;
				const s = 0.6 + Math.random() * 2.2;
				puffs.push({
					x,
					y,
					vx: Math.cos(a) * s,
					vy: Math.sin(a) * s - 0.4,
					r: 0.6 + Math.random() * 1.4,
					life: 1,
					decay: 0.012 + Math.random() * 0.012,
				});
			}
			for (const p of spores) {
				if (p.layer === 2) continue;
				const ddx = p.sx - x;
				const ddy = p.sy - y;
				const d = Math.hypot(ddx, ddy);
				if (d < 220 && d > 0.1) {
					const f = (1 - d / 220) * 3;
					p.vx += (ddx / d) * f;
					p.vy += (ddy / d) * f;
				}
			}
		};

		const onMove = (e: PointerEvent) => {
			if (!runtimeSettings().react) return;
			const now = performance.now();
			const dt = Math.max(8, now - ptr.t);
			if (ptr.t) {
				ptr.vx = (e.clientX - ptr.x) / dt;
				ptr.vy = (e.clientY - ptr.y) / dt;
			}
			ptr.x = e.clientX;
			ptr.y = e.clientY;
			ptr.t = now;
		};
		const onLeave = () => {
			ptr.x = -1e4;
			ptr.y = -1e4;
		};
		const onKey = (e: KeyboardEvent) => {
			const ae = document.activeElement;
			const typing =
				ae &&
				(ae.tagName === "INPUT" ||
					ae.tagName === "TEXTAREA" ||
					ae.tagName === "SELECT" ||
					(ae as HTMLElement).isContentEditable);
			if (
				e.repeat ||
				e.metaKey ||
				e.ctrlKey ||
				e.altKey ||
				typing ||
				!runtimeSettings().react ||
				runtimeSettings().spores === 0
			)
				return;
			let x = window.innerWidth / 2;
			let y = window.innerHeight / 2;
			const focused = document.activeElement;
			if (focused instanceof HTMLElement && focused !== document.body) {
				const b = focused.getBoundingClientRect();
				x = b.left + b.width / 2;
				y = b.top + b.height / 2;
			} else if (ptr.x > -1e3) {
				x = ptr.x;
				y = ptr.y;
			}
			puff(x, y);
		};

		// Nothing moves under reduced motion or with the field switched off, so draw once instead of looping.
		const animating = () => !reduced && runtimeSettings().spores > 0;

		const draw = (now: number) => {
			if (animating()) raf = requestAnimationFrame(draw);
			else raf = 0;
			if (document.hidden || (raf && now - last < 16)) return;
			last = now;
			const density = runtimeSettings().spores / 2;
			if (!runtimeSettings().react) {
				ptr.x = -1e4;
				ptr.y = -1e4;
			}
			const w = window.innerWidth;
			const h = window.innerHeight;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			if (
				canvas.width !== Math.round(w * dpr) ||
				canvas.height !== Math.round(h * dpr)
			) {
				canvas.width = Math.round(w * dpr);
				canvas.height = Math.round(h * dpr);
			}
			ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
			ctx.clearRect(0, 0, w, h);
			const { tokens, dark } = liveTokens();
			const t = reduced ? 0 : now / 1000;
			const sy = reduced ? 0 : window.scrollY;
			ptr.vx *= 0.9;
			ptr.vy *= 0.9;

			for (const p of spores) {
				if (p.rank >= density) continue;
				const hx = ((((p.x + p.drift * t) % 1) + 1) % 1) * w;
				const hy =
					(((p.y * h - sy * p.par - t * (p.layer ? 3 * p.layer : 1.2)) % h) +
						h) %
					h;
				if (!reduced && p.layer < 2) {
					const ddx = hx + p.dx - ptr.x;
					const ddy = hy + p.dy - ptr.y;
					const d = Math.hypot(ddx, ddy);
					const R = p.layer ? 130 : 90;
					if (d < R && d > 0.1) {
						const f = (1 - d / R) ** 2 * (p.layer ? 0.9 : 0.5);
						p.vx += (ddx / d) * f + ptr.vx * f * 2;
						p.vy += (ddy / d) * f + ptr.vy * f * 2;
					}
					p.vx = (p.vx - p.dx * 0.012) * 0.9;
					p.vy = (p.vy - p.dy * 0.012) * 0.9;
					p.dx += p.vx;
					p.dy += p.vy;
				}
				const x = hx + p.dx;
				const y = hy + p.dy;
				p.sx = x;
				p.sy = y;
				if (p.layer === 2) {
					const col = dark ? tokens.growth : tokens.muted;
					const grd = ctx.createRadialGradient(x, y, 0, x, y, p.r);
					grd.addColorStop(0, rgba(col, dark ? 0.1 : 0.06));
					grd.addColorStop(1, rgba(col, 0));
					ctx.globalAlpha = 1;
					ctx.fillStyle = grd;
					ctx.fillRect(x - p.r, y - p.r, p.r * 2, p.r * 2);
					continue;
				}
				const tw = 0.5 + 0.5 * Math.sin(t * 1.3 + p.ph);
				const stirred = Math.min(1, Math.hypot(p.vx, p.vy) * 0.4);
				const base = dark
					? (0.15 + 0.45 * tw) * (p.layer ? 1 : 0.6)
					: 0.12 + 0.25 * tw;
				ctx.globalAlpha = Math.min(1, base + stirred * 0.4);
				ctx.fillStyle = dark
					? p.tint < 0.12 || stirred > 0.5
						? tokens.accent
						: p.tint < 0.35
							? tokens.growth
							: tokens.muted
					: tokens.muted;
				ctx.beginPath();
				ctx.arc(x, y, p.r, 0, 6.283);
				ctx.fill();
			}

			ctx.fillStyle = tokens.tip;
			ctx.shadowColor = tokens.tip;
			ctx.shadowBlur = dark ? 6 : 0;
			puffs = puffs.filter((q) => {
				q.vx *= 0.96;
				q.vy = q.vy * 0.96 - 0.01;
				q.x += q.vx;
				q.y += q.vy;
				q.life -= q.decay;
				if (q.life <= 0) return false;
				ctx.globalAlpha = q.life * (dark ? 0.9 : 0.6);
				ctx.beginPath();
				ctx.arc(q.x, q.y, q.r * (0.6 + 0.4 * q.life), 0, 6.283);
				ctx.fill();
				return true;
			});
			ctx.shadowBlur = 0;
		};

		const redraw = () => {
			if (!raf) raf = requestAnimationFrame(draw);
		};
		if (!reduced) {
			window.addEventListener("pointermove", onMove, { passive: true });
			document.addEventListener("pointerleave", onLeave);
			window.addEventListener("keydown", onKey);
		}
		window.addEventListener("resize", redraw);
		const offSettings = onRuntimeSettings(redraw);
		const offTokens = onTokensChange(redraw);
		raf = requestAnimationFrame(draw);
		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener("pointermove", onMove);
			document.removeEventListener("pointerleave", onLeave);
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("resize", redraw);
			offSettings();
			offTokens();
		};
	}, []);

	return <canvas ref={ref} className={styles.field} aria-hidden="true" />;
}
