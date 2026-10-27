"use client";

import type { Tokens } from "@/lib/strains";

const KEYS: Array<keyof Tokens> = [
	"bg",
	"raised",
	"line",
	"text",
	"muted",
	"accent",
	"growth",
	"tip",
	"glitchA",
	"glitchB",
];
const cssName = (key: string) =>
	"--" + key.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase());

let cache: { tokens: Tokens; dark: boolean } | null = null;
const listeners = new Set<() => void>();
let observer: MutationObserver | null = null;

function read() {
	const root = document.documentElement;
	const cs = getComputedStyle(root);
	const entries = KEYS.map(
		(k) => [k, cs.getPropertyValue(cssName(k)).trim()] as const,
	);
	const tokens: Tokens = {
		bg: "",
		raised: "",
		line: "",
		text: "",
		muted: "",
		accent: "",
		growth: "",
		tip: "",
		glitchA: "",
		glitchB: "",
	};
	for (const [k, v] of entries) tokens[k] = v;
	cache = { tokens, dark: !root.classList.contains("light") };
}

function ensureObserver() {
	if (observer) return;
	observer = new MutationObserver(() => {
		read();
		listeners.forEach((fn) => fn());
	});
	observer.observe(document.documentElement, {
		attributes: true,
		attributeFilter: ["class", "data-strain"],
	});
}

// Canvas code can't use var(--x); this mirrors the current strain's tokens and notifies on change.
export function liveTokens(): { tokens: Tokens; dark: boolean } {
	ensureObserver();
	if (!cache) read();
	if (!cache) throw new Error("tokens unavailable");
	return cache;
}

export function onTokensChange(fn: () => void): () => void {
	ensureObserver();
	listeners.add(fn);
	return () => listeners.delete(fn);
}

export function rgba(hex: string, alpha: number): string {
	const n = parseInt(hex.replace("#", ""), 16);
	return `rgba(${n >> 16},${(n >> 8) & 255},${n & 255},${alpha})`;
}
