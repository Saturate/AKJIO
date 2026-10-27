"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { useActiveAnchors } from "@/hooks/useActiveHeading";
import { liveTokens, onTokensChange } from "@/lib/liveTokens";
import { prefersReducedMotion } from "@/lib/motion";
import { hashStr, mulberry } from "@/lib/random";
import type { TOCEntry } from "@/utils/generateTableOfContentsFromMarkdown";
import styles from "./TableOfContents.module.css";

type Props = { entries: TOCEntry[]; introLabel?: string };
type Item = { slug: string | null; text: string; depth: number };
type Geo = { top: number; bottom: number; x: number };
type Sprout = {
	y: number;
	path: SVGPathElement;
	knot: SVGCircleElement | null;
	dots: SVGCircleElement[];
	dur: number;
	delay: number;
	on: boolean;
	settle: number;
};

const SVG_NS = "http://www.w3.org/2000/svg";

function flatten(entries: TOCEntry[]): TOCEntry[] {
	return entries.flatMap((e) => [e, ...flatten(e.children)]);
}

function svgEl<K extends keyof SVGElementTagNameMap>(tag: K, attrs: Record<string, string | number>): SVGElementTagNameMap[K] {
	const el = document.createElementNS(SVG_NS, tag);
	for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, String(v));
	return el;
}

// The rail is a hyphae strand. Every heading in view is lit by a soft glow that slides along it,
// and short tendrils sprout from the lit part and wither once the range moves on.
export default function TableOfContents({ entries, introLabel }: Props) {
	const uid = useId().replace(/:/g, "");
	const active = useActiveAnchors();
	const items = useMemo<Item[]>(() => {
		const flat = flatten(entries).map((e) => ({ slug: e.slug, text: e.text, depth: e.level >= 3 ? 3 : 2 }));
		return introLabel ? [{ slug: null, text: introLabel, depth: 2 }, ...flat] : flat;
	}, [entries, introLabel]);

	const listRef = useRef<HTMLOListElement>(null);
	const svgRef = useRef<SVGSVGElement>(null);
	const railRef = useRef<SVGPathElement>(null);
	const hairsRef = useRef<SVGPathElement>(null);
	const glowRef = useRef<SVGPathElement>(null);
	const rangeRef = useRef<SVGRectElement>(null);
	const sproutsRef = useRef<SVGGElement>(null);
	const syncRef = useRef<(instant: boolean) => void>(() => {});
	const retarget = useRef<() => void>(() => {});

	const state = useRef({
		geo: [] as Geo[],
		pts: [] as Array<[number, number]>,
		sprouts: [] as Sprout[],
		cur: { y: 0, h: 0 },
		target: { y: 0, h: 0 },
		raf: 0,
	});

	const activeIdx = useMemo(() => {
		const idx = items.map((it, i) => (it.slug && active.includes(it.slug.slice(1)) ? i : -1)).filter((i) => i >= 0);
		return idx.length ? idx : introLabel ? [0] : [];
	}, [items, active, introLabel]);

	// Geometry, rail path and sprouts: rebuilt whenever the list's size changes.
	useEffect(() => {
		const list = listRef.current;
		const svg = svgRef.current;
		if (!list || !svg) return;
		const st = state.current;
		const reduced = prefersReducedMotion();

		const grow = (s: Sprout, instant: boolean) => {
			if (s.on) return;
			s.on = true;
			window.clearTimeout(s.settle);
			s.path.style.stroke = "var(--growth)";
			s.path.style.opacity = "0.6";
			if (instant || reduced) {
				s.path.style.transition = "none";
				s.path.style.strokeDashoffset = "0";
				if (s.knot) {
					s.knot.style.fill = "var(--growth)";
					s.knot.style.opacity = "0.75";
				}
				s.dots.forEach((d) => (d.style.opacity = "0.45"));
				return;
			}
			s.path.style.transition = `stroke 0.4s ease, opacity 0.4s ease, stroke-dashoffset ${s.dur}s cubic-bezier(0.33, 0, 0.2, 1) ${s.delay}s`;
			s.path.style.strokeDashoffset = "0";
			s.dots.forEach((d) => {
				d.style.transition = `opacity 1.2s ease ${s.delay + s.dur + Math.random() * 0.8}s`;
				d.style.opacity = "0.45";
			});
			const k = s.knot;
			if (!k) return;
			k.style.fill = "var(--tip)";
			k.style.filter = liveTokens().dark ? "drop-shadow(0 0 3px var(--tip))" : "none";
			k.style.transition = `opacity 0.4s ease ${s.delay + s.dur * 0.9}s`;
			k.style.opacity = "0.95";
			s.settle = window.setTimeout(() => {
				k.style.transition = "fill 1.6s ease, opacity 1.6s ease, filter 1.6s ease";
				k.style.fill = "var(--growth)";
				k.style.filter = "none";
				k.style.opacity = "0.75";
			}, (s.delay + s.dur) * 1000 + 600);
		};

		const wither = (s: Sprout, instant: boolean) => {
			if (!s.on) return;
			s.on = false;
			window.clearTimeout(s.settle);
			if (instant || reduced) {
				s.path.style.transition = "none";
				s.path.style.strokeDashoffset = "1";
				if (s.knot) s.knot.style.opacity = "0";
				s.dots.forEach((d) => (d.style.opacity = "0"));
				return;
			}
			const lag = Math.random() * 0.4;
			s.path.style.transition = `stroke 0.6s ease ${lag}s, opacity 0.6s ease ${lag}s, stroke-dashoffset 1.8s cubic-bezier(0.55, 0, 0.8, 0.4) ${lag + 0.5}s`;
			s.path.style.stroke = "var(--muted)";
			s.path.style.opacity = "0.35";
			s.path.style.strokeDashoffset = "1";
			if (s.knot) {
				s.knot.style.transition = `fill 0.5s ease ${lag}s, opacity 1.2s ease ${lag + 0.4}s, filter 0.3s ease`;
				s.knot.style.fill = "var(--muted)";
				s.knot.style.filter = "none";
				s.knot.style.opacity = "0";
			}
			s.dots.forEach((d) => {
				d.style.transition = `opacity 0.8s ease ${lag}s`;
				d.style.opacity = "0";
			});
		};

		const sync = (instant: boolean) => {
			const a = st.target.y;
			const b = st.target.y + st.target.h;
			for (const s of st.sprouts) {
				if (s.y >= a && s.y <= b) grow(s, instant);
				else wither(s, instant);
			}
		};

		const xAt = (y: number) => {
			const p = st.pts;
			for (let i = 1; i < p.length; i++) {
				if (p[i][1] >= y) {
					const [ax, ay] = p[i - 1];
					const [bx, by] = p[i];
					return ax + (bx - ax) * (by === ay ? 0 : (y - ay) / (by - ay));
				}
			}
			return p.length ? p[p.length - 1][0] : 3;
		};

		const build = () => {
			const links = [...list.querySelectorAll<HTMLAnchorElement>("a")];
			if (!list.clientHeight || !links.length) return;
			const r = mulberry(99);
			const d: string[] = [];
			const hairs: string[] = [];
			const pts: Array<[number, number]> = [];
			let px: number | null = null;
			let py = 0;
			st.geo = links.map((a, i) => {
				const cs = getComputedStyle(a);
				const top = a.offsetTop + parseFloat(cs.paddingTop);
				const bottom = a.offsetTop + a.offsetHeight - parseFloat(cs.paddingBottom);
				const x = items[i]?.depth === 3 ? 13 : 3;
				if (px === null) {
					d.push(`M${x} ${top}`);
					pts.push([x, top]);
				} else if (px !== x) {
					d.push(`C${px} ${py + 6} ${x} ${top - 6} ${x} ${top}`);
					for (let t = 0.2; t <= 1.001; t += 0.2) {
						const s = 3 * t * t - 2 * t * t * t;
						pts.push([px + (x - px) * s, py + (top - py) * t]);
					}
				} else {
					d.push(`L${x} ${top}`);
					pts.push([x, top]);
				}
				for (let y = top + 3; y < bottom; y += 3) {
					const wx = x + (r() - 0.5) * 0.9;
					d.push(`L${wx.toFixed(2)} ${y}`);
					pts.push([wx, y]);
				}
				d.push(`L${x} ${bottom}`);
				pts.push([x, bottom]);
				if (r() < 0.7) {
					const hy = top + (bottom - top) * r();
					const len = 3 + r() * 5;
					hairs.push(`M${x} ${hy.toFixed(1)} q${(-len * 0.6).toFixed(1)} ${(-1 - r() * 2).toFixed(1)} ${(-len).toFixed(1)} ${(-2 - r() * 3).toFixed(1)}`);
				}
				px = x;
				py = bottom;
				return { top, bottom, x };
			});
			st.pts = pts;
			const path = d.join(" ");
			railRef.current?.setAttribute("d", path);
			glowRef.current?.setAttribute("d", path);
			hairsRef.current?.setAttribute("d", hairs.join(" "));
			const h = list.clientHeight;
			svg.setAttribute("height", String(h));
			svg.setAttribute("viewBox", `0 0 24 ${h}`);
			buildSprouts();
		};

		const buildSprouts = () => {
			const g = sproutsRef.current;
			if (!g || !st.geo.length) return;
			const r = mulberry(hashStr(location.pathname) ^ 0x5eed);
			const start = st.geo[0].top;
			const end = st.geo[st.geo.length - 1].bottom;
			st.sprouts.forEach((s) => window.clearTimeout(s.settle));
			st.sprouts = [];
			g.replaceChildren();
			for (let y = start + 3; y < end; y += 3 + r() * 5) {
				if (r() > 0.72) continue;
				const x0 = xAt(y);
				let a = Math.PI + (r() - 0.5) * 1.3;
				let x = x0;
				let yy = y;
				let path = `M${x0.toFixed(1)} ${y.toFixed(1)}`;
				const len = 5 + r() * 18;
				const forkAt = r() < 0.35 ? len * (0.3 + r() * 0.4) : -1;
				for (let s = 0; s < len; s += 2) {
					a += (r() - 0.5) * 0.7;
					x += Math.cos(a) * 2;
					yy += Math.sin(a) * 2;
					path += ` L${x.toFixed(1)} ${yy.toFixed(1)}`;
					if (forkAt > 0 && s >= forkAt && s < forkAt + 2) {
						let fa = a + (r() < 0.5 ? -1 : 1) * (0.6 + r() * 0.5);
						let fx = x;
						let fy = yy;
						path += ` M${fx.toFixed(1)} ${fy.toFixed(1)}`;
						for (let t = 0; t < (len - s) * 0.6; t += 2) {
							fa += (r() - 0.5) * 0.6;
							fx += Math.cos(fa) * 2;
							fy += Math.sin(fa) * 2;
							path += ` L${fx.toFixed(1)} ${fy.toFixed(1)}`;
						}
						path += ` M${x.toFixed(1)} ${yy.toFixed(1)}`;
					}
				}
				const dots: SVGCircleElement[] = [];
				for (let k = 0; k < 2; k++) {
					if (r() > 0.4) continue;
					const dot = svgEl("circle", {
						cx: (x + (r() - 0.5) * 8).toFixed(1),
						cy: (yy + (r() - 0.5) * 8).toFixed(1),
						r: (0.35 + r() * 0.4).toFixed(2),
					});
					dot.style.fill = "var(--tip)";
					dot.style.opacity = "0";
					g.append(dot);
					dots.push(dot);
				}
				const p = svgEl("path", { d: path, pathLength: 1, fill: "none", "stroke-linecap": "round" });
				p.style.stroke = "var(--growth)";
				p.style.strokeWidth = String(0.5 + r() * 0.5);
				p.style.opacity = "0.6";
				p.style.strokeDasharray = "1 1";
				p.style.strokeDashoffset = "1";
				g.append(p);
				let knot: SVGCircleElement | null = null;
				if (r() < 0.45) {
					knot = svgEl("circle", { cx: x.toFixed(1), cy: yy.toFixed(1), r: (0.7 + r() * 0.9).toFixed(2) });
					knot.style.fill = "var(--growth)";
					knot.style.opacity = "0";
					g.append(knot);
				}
				st.sprouts.push({ y, path: p, knot, dots, dur: 1.2 + r() * 1.6, delay: r() * 0.5, on: false, settle: 0 });
			}
			sync(true);
		};

		syncRef.current = sync;
		const ro = new ResizeObserver(() => {
			build();
			retarget.current();
		});
		ro.observe(list);
		const styleGlow = () => {
			const dark = liveTokens().dark;
			if (glowRef.current) glowRef.current.style.filter = dark ? "drop-shadow(0 0 3px var(--tip))" : "none";
		};
		styleGlow();
		const off = onTokensChange(styleGlow);
		return () => {
			ro.disconnect();
			off();
			st.sprouts.forEach((s) => window.clearTimeout(s.settle));
			cancelAnimationFrame(st.raf);
			st.raf = 0;
		};
	}, [items]);

	// Active range: lerp the glow toward the headings in view and let sprouts follow.
	useEffect(() => {
		const st = state.current;
		const reduced = prefersReducedMotion();
		const paint = () => {
			rangeRef.current?.setAttribute("y", st.cur.y.toFixed(2));
			rangeRef.current?.setAttribute("height", Math.max(0, st.cur.h).toFixed(2));
		};
		const animate = () => {
			const c = st.cur;
			const t = st.target;
			c.y += (t.y - c.y) * 0.14;
			c.h += (t.h - c.h) * 0.14;
			paint();
			if (Math.abs(t.y - c.y) > 0.2 || Math.abs(t.h - c.h) > 0.2) {
				st.raf = requestAnimationFrame(animate);
			} else {
				st.cur = { ...t };
				paint();
				st.raf = 0;
			}
		};
		retarget.current = () => {
			if (!st.geo.length || !activeIdx.length) return;
			const top = Math.min(...activeIdx.map((i) => st.geo[i]?.top ?? Infinity));
			const bottom = Math.max(...activeIdx.map((i) => st.geo[i]?.bottom ?? -Infinity));
			if (!Number.isFinite(top) || !Number.isFinite(bottom)) return;
			st.target = { y: top - 8, h: bottom - top + 16 };
			syncRef.current(false);
			// If a parent caps the TOC height and scrolls it, keep the lit range in view (without moving the page).
			let box = listRef.current?.parentElement ?? null;
			while (box && getComputedStyle(box).overflowY === "visible") box = box.parentElement;
			const list = listRef.current;
			if (box && list && box.scrollHeight > box.clientHeight) {
				const listTop = list.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop;
				const want = listTop + top - box.clientHeight * 0.35;
				box.scrollTo({ top: Math.max(0, want), behavior: reduced ? "auto" : "smooth" });
			}
			if (reduced) {
				st.cur = { ...st.target };
				paint();
			} else if (!st.raf) {
				st.raf = requestAnimationFrame(animate);
			}
		};
		retarget.current();
	}, [activeIdx]);

	if (!items.length) return null;

	const scrollTo = (e: React.MouseEvent<HTMLAnchorElement>, slug: string | null) => {
		e.preventDefault();
		const smooth = prefersReducedMotion() ? "auto" : "smooth";
		if (!slug) {
			window.scrollTo({ top: 0, behavior: smooth });
			return;
		}
		document.querySelector(slug)?.scrollIntoView({ behavior: smooth, block: "start" });
		history.replaceState(null, "", slug);
	};

	return (
		<nav className={styles.toc} aria-label="Contents">
			<h2 className={styles.header}>Contents</h2>
			<div className={styles.body}>
				<svg ref={svgRef} className={styles.rail} width="24" aria-hidden="true">
					<defs>
						<linearGradient id={`${uid}-fade`} x1="0" y1="0" x2="0" y2="1">
							<stop offset="0" stopColor="#fff" stopOpacity="0" />
							<stop offset="0.28" stopColor="#fff" stopOpacity="1" />
							<stop offset="0.72" stopColor="#fff" stopOpacity="1" />
							<stop offset="1" stopColor="#fff" stopOpacity="0" />
						</linearGradient>
						<mask id={`${uid}-range`} maskUnits="userSpaceOnUse" x="-20" y="-40" width="64" height="10000">
							<rect ref={rangeRef} x="-20" y="0" width="64" height="0" fill={`url(#${uid}-fade)`} />
						</mask>
					</defs>
					<path ref={railRef} className={styles.strand} />
					<path ref={hairsRef} className={styles.hairs} />
					<g ref={sproutsRef} />
					<path ref={glowRef} className={styles.glow} mask={`url(#${uid}-range)`} />
				</svg>
				<ol ref={listRef} className={styles.list}>
					{items.map((it, i) => (
						<li key={it.slug ?? "intro"} className={it.depth === 3 ? styles.d3 : undefined}>
							<a
								href={it.slug ?? "#"}
								className={activeIdx.includes(i) ? styles.active : undefined}
								aria-current={activeIdx[0] === i ? "location" : undefined}
								onClick={(e) => scrollTo(e, it.slug)}
							>
								{it.text}
							</a>
						</li>
					))}
				</ol>
			</div>
		</nav>
	);
}
