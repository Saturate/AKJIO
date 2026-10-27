// Small seeded PRNG: the same seed always grows the same shapes.
export function mulberry(seed: number): () => number {
	let s = seed | 0;
	return () => {
		s = (s + 0x6d2b79f5) | 0;
		let t = Math.imul(s ^ (s >>> 15), 1 | s);
		t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function hashStr(input: string): number {
	let h = 2166136261;
	for (const c of input) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
	return h | 0;
}
