import { runtimeSettings } from "@/lib/runtimeSettings";

export const GLYPHS = "01░▒▓<>/\\|_#*%";

export function prefersReducedMotion(): boolean {
	return typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function randomGlyph(): string {
	return GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
}

const busy = new WeakSet<HTMLElement>();

// A few frames of noise that resolve left to right into the final label. With reduced motion or
// glitches switched off the label is set straight away, so it still changes (e.g. Copy -> Copied).
export function scramble(el: HTMLElement, finalText: string, frames = 5, frameMs = 45): void {
	if (prefersReducedMotion() || !runtimeSettings().glitch) {
		el.textContent = finalText;
		return;
	}
	if (busy.has(el)) return;
	busy.add(el);
	el.classList.remove("glitch-split");
	void el.offsetWidth;
	el.classList.add("glitch-split");
	let frame = 0;
	const tick = () => {
		const settled = (frame / frames) * finalText.length;
		el.textContent = [...finalText].map((ch, i) => (i < settled || ch === " " ? ch : randomGlyph())).join("");
		if (frame++ < frames) {
			window.setTimeout(tick, frameMs);
		} else {
			el.textContent = finalText;
			busy.delete(el);
		}
	};
	tick();
}
