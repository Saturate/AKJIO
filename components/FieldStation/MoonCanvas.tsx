"use client";

import { useEffect, useRef } from "react";
import { liveTokens, onTokensChange } from "@/lib/liveTokens";
import { prefersReducedMotion } from "@/lib/motion";
import { mulberry } from "@/lib/random";
import styles from "./FieldStation.module.css";

type Spore = { x: number; y: number; vx: number; vy: number; life: number };

// Halftone moon in today's phase with a few spores lifting off it.
export default function MoonCanvas({ phase: rawPhase }: { phase: number | null }) {
	const ref = useRef<HTMLCanvasElement>(null);
	// Rounded so the 20s clock tick in the parent doesn't redraw the moon every time.
	const phase = rawPhase === null ? null : Math.round(rawPhase * 1000) / 1000;

	useEffect(() => {
		const canvas = ref.current;
		const ctx = canvas?.getContext("2d");
		if (!canvas || !ctx || phase === null) return;
		const reduced = prefersReducedMotion();
		let cache: HTMLCanvasElement | null = null;
		let spores: Spore[] = [];
		let visible = false;
		let raf = 0;
		let last = 0;
		const size = { w: 0, h: 0, dpr: 1, cx: 0, cy: 0, R: 0 };

		const render = () => {
			const w = canvas.clientWidth;
			const h = canvas.clientHeight;
			const dpr = Math.min(2, window.devicePixelRatio || 1);
			canvas.width = Math.round(w * dpr);
			canvas.height = Math.round(h * dpr);
			Object.assign(size, { w, h, dpr, cx: w / 2, cy: h / 2, R: Math.min(w, h) * 0.36 });
			const off = document.createElement("canvas");
			off.width = canvas.width;
			off.height = canvas.height;
			const g = off.getContext("2d");
			if (!g) return;
			g.setTransform(dpr, 0, 0, dpr, 0, 0);
			const { tokens } = liveTokens();
			const r = mulberry(42);
			const gap = 4.5;
			const k = Math.cos(2 * Math.PI * phase);
			const craters = Array.from({ length: 7 }, () => [r() * 1.4 - 0.7, r() * 1.4 - 0.7, 0.08 + r() * 0.16]);
			for (let gx = gap / 2; gx < w; gx += gap) {
				for (let gy = gap / 2; gy < h; gy += gap) {
					const nx = (gx - size.cx) / size.R;
					const ny = (gy - size.cy) / size.R;
					const d2 = nx * nx + ny * ny;
					if (d2 > 1) {
						if (r() < 0.05) {
							g.globalAlpha = 0.12 + r() * 0.2;
							g.fillStyle = tokens.muted;
							g.beginPath();
							g.arc(gx, gy, 0.6 + r() * 0.6, 0, 6.283);
							g.fill();
						}
						continue;
					}
					// Terminator: lit side grows from the right while waxing, shrinks from the right while waning.
					const s = Math.sqrt(1 - ny * ny);
					const lit = phase < 0.5 ? nx > k * s : nx < -k * s;
					const crater = craters.some(([cx, cy, cr]) => (nx - cx) ** 2 + (ny - cy) ** 2 < cr * cr);
					const limb = 0.7 + 0.3 * Math.sqrt(1 - d2);
					g.globalAlpha = lit ? 0.85 : 0.2;
					g.fillStyle = lit ? tokens.text : tokens.muted;
					g.beginPath();
					g.arc(gx, gy, (lit ? (crater ? 0.85 : 1.35) : 0.55) * limb, 0, 6.283);
					g.fill();
				}
			}
			cache = off;
			spores = [];
		};

		// Loops only while on screen with motion allowed; otherwise it paints once and stops.
		const draw = (now: number) => {
			raf = visible && !reduced ? requestAnimationFrame(draw) : 0;
			if (!cache || (raf && now - last < 50)) return;
			last = now;
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, canvas.width, canvas.height);
			// The spores below leave globalAlpha at their own fade; without this reset the whole
			// moon blitted at that alpha and visibly flickered as spores spawned and died.
			ctx.globalAlpha = 1;
			ctx.drawImage(cache, 0, 0);
			if (reduced) return;
			ctx.setTransform(size.dpr, 0, 0, size.dpr, 0, 0);
			if (spores.length < 6 && Math.random() < 0.03) {
				const a = Math.random() * 6.283;
				spores.push({ x: size.cx + Math.cos(a) * size.R * 0.9, y: size.cy + Math.sin(a) * size.R * 0.9, vx: (Math.random() - 0.5) * 0.1, vy: -0.08 - Math.random() * 0.12, life: 1 });
			}
			const { tokens, dark } = liveTokens();
			ctx.fillStyle = tokens.tip;
			ctx.shadowColor = tokens.tip;
			ctx.shadowBlur = dark ? 6 : 0;
			spores = spores.filter((s) => {
				s.x += s.vx + Math.sin(now / 900 + s.y * 0.05) * 0.1;
				s.y += s.vy;
				s.life -= 0.003;
				if (s.life <= 0) return false;
				ctx.globalAlpha = s.life * 0.7;
				ctx.beginPath();
				ctx.arc(s.x, s.y, 0.8, 0, 6.283);
				ctx.fill();
				return true;
			});
			ctx.shadowBlur = 0;
		};

		const paint = () => {
			if (!raf) raf = requestAnimationFrame(draw);
		};
		render();
		const off = onTokensChange(() => {
			render();
			paint();
		});
		const io = new IntersectionObserver(([e]) => {
			visible = e?.isIntersecting ?? false;
			if (visible) paint();
		});
		io.observe(canvas);
		paint();
		return () => {
			cancelAnimationFrame(raf);
			io.disconnect();
			off();
		};
	}, [phase]);

	return <canvas ref={ref} className={styles.moon} aria-hidden="true" />;
}
