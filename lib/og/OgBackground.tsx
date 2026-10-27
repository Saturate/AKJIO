import { mulberry } from "@/lib/random";
import { colors, OG_SCALE, OG_RENDER_WIDTH, OG_RENDER_HEIGHT } from "./theme";

const S = OG_SCALE;
const W = OG_RENDER_WIDTH;
const H = OG_RENDER_HEIGHT;
const INSET = 28 * S;

// Fixed seed: every card shares the same frame growth and spore field.
const rnd = mulberry(1337);

const spores = Array.from({ length: 70 }, () => ({
	x: rnd() * W,
	y: rnd() * H,
	r: (0.4 + rnd() * 1.3) * S,
	o: 0.15 + rnd() * 0.45,
	tint: rnd(),
}));

// Short hyphae creeping from the frame corners along its edges.
function strand(x: number, y: number, dx: number, dy: number, len: number): string {
	let d = `M${x.toFixed(1)} ${y.toFixed(1)}`;
	let off = 0;
	for (let s = 0; s < len; s += 3) {
		off = Math.max(-3, Math.min(6, (off + (rnd() - 0.5) * 1.6) * 0.97));
		x += dx * 3;
		y += dy * 3;
		d += ` L${(x + (dy ? off : 0)).toFixed(1)} ${(y + (dx ? off : 0)).toFixed(1)}`;
	}
	return d;
}

const L = INSET;
const R = W - INSET;
const T = INSET;
const B = H - INSET;
const strands = [
	strand(L, T, 1, 0, 160 + rnd() * 120),
	strand(L, T, 0, 1, 90 + rnd() * 80),
	strand(R, T, -1, 0, 120 + rnd() * 100),
	strand(R, B, 0, -1, 80 + rnd() * 90),
	strand(L, B, 1, 0, 140 + rnd() * 140),
];
const marks: Array<[number, number]> = [
	[L, T],
	[R, T],
	[R, B],
	[L, B],
];

export function OgBackground({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				width: W,
				height: H,
				display: "flex",
				flexDirection: "column",
				padding: `${60 * S}px ${70 * S}px`,
				fontFamily: "Geist",
				color: colors.text,
				position: "relative",
				overflow: "hidden",
				background: `radial-gradient(120% 90% at 50% 0%, ${colors.bg} 45%, ${colors.raised} 100%)`,
			}}
		>
			<svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute", top: 0, left: 0 }}>
				{spores.map((s, i) => (
					<circle
						key={i}
						cx={s.x}
						cy={s.y}
						r={s.r}
						fill={s.tint < 0.12 ? colors.accent : s.tint < 0.35 ? colors.growth : colors.textMuted}
						opacity={s.o}
					/>
				))}
				<rect x={L} y={T} width={R - L} height={B - T} fill="none" stroke={colors.line} strokeWidth={S} />
				{strands.map((d, i) => (
					<path key={i} d={d} fill="none" stroke={colors.growth} strokeWidth={1.1 * S} opacity={0.7} strokeLinecap="round" />
				))}
				{marks.map(([x, y], i) => (
					<path key={i} d={`M${x - 5} ${y} L${x + 5} ${y} M${x} ${y - 5} L${x} ${y + 5}`} stroke={colors.textMuted} strokeWidth={S} />
				))}
			</svg>
			{children}
		</div>
	);
}
