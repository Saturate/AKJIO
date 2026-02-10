import {
	colors,
	OG_SCALE,
	OG_RENDER_WIDTH,
	OG_RENDER_HEIGHT,
} from "./theme";

const S = OG_SCALE;
const W = OG_RENDER_WIDTH;
const H = OG_RENDER_HEIGHT;

// SVG wave paths scaled to render dimensions
const wavePath = `M0,${H - 80 * S} C${200 * S},${H - 120 * S} ${400 * S},${H - 60 * S} ${600 * S},${H - 90 * S} C${800 * S},${H - 120 * S} ${1000 * S},${H - 50 * S} ${W},${H - 80 * S} L${W},${H} L0,${H} Z`;

const wavePath2 = `M0,${H - 50 * S} C${300 * S},${H - 80 * S} ${500 * S},${H - 30 * S} ${700 * S},${H - 60 * S} C${900 * S},${H - 90 * S} ${1100 * S},${H - 40 * S} ${W},${H - 55 * S} L${W},${H} L0,${H} Z`;

// 25 stars — positions at 1x, scaled at render time
const stars = [
	{ x: 45, y: 28, r: 1.2, o: 0.7 },
	{ x: 130, y: 65, r: 0.8, o: 0.45 },
	{ x: 210, y: 15, r: 1.5, o: 0.85 },
	{ x: 295, y: 90, r: 0.6, o: 0.35 },
	{ x: 360, y: 42, r: 1.0, o: 0.6 },
	{ x: 440, y: 75, r: 1.8, o: 0.55 },
	{ x: 510, y: 20, r: 0.7, o: 0.4 },
	{ x: 580, y: 55, r: 1.3, o: 0.75 },
	{ x: 635, y: 100, r: 0.9, o: 0.5 },
	{ x: 700, y: 35, r: 1.6, o: 0.65 },
	{ x: 755, y: 80, r: 0.5, o: 0.3 },
	{ x: 820, y: 48, r: 1.1, o: 0.7 },
	{ x: 870, y: 110, r: 1.4, o: 0.55 },
	{ x: 175, y: 105, r: 0.8, o: 0.4 },
	{ x: 490, y: 95, r: 1.0, o: 0.5 },
	{ x: 1020, y: 130, r: 0.7, o: 0.35 },
	{ x: 1080, y: 45, r: 1.2, o: 0.6 },
	{ x: 1150, y: 95, r: 0.6, o: 0.4 },
	{ x: 90, y: 85, r: 1.0, o: 0.55 },
	{ x: 330, y: 110, r: 0.5, o: 0.3 },
	{ x: 550, y: 105, r: 1.3, o: 0.45 },
	{ x: 680, y: 120, r: 0.8, o: 0.35 },
	{ x: 420, y: 25, r: 1.7, o: 0.9 },
	{ x: 770, y: 15, r: 0.9, o: 0.5 },
	{ x: 920, y: 30, r: 1.1, o: 0.65 },
];

export function OgBackground({ children }: { children: React.ReactNode }) {
	return (
		<div
			style={{
				width: W,
				height: H,
				display: "flex",
				flexDirection: "column",
				padding: `${50 * S}px ${60 * S}px`,
				fontFamily: "Inter",
				color: colors.text,
				position: "relative",
				overflow: "hidden",
				background: `linear-gradient(180deg, ${colors.skyTop} 0%, ${colors.waterBodyMid} 70%, ${colors.waterBodyDeep} 100%)`,
			}}
		>
			{children}

			<svg
				width={W}
				height={H}
				viewBox={`0 0 ${W} ${H}`}
				style={{ position: "absolute", top: 0, left: 0 }}
			>
				{stars.map((s, i) => (
					<circle
						key={i}
						cx={s.x * S}
						cy={s.y * S}
						r={s.r * S}
						fill="rgba(255, 255, 255, 0.8)"
						opacity={s.o}
					/>
				))}

				<path d={wavePath} fill={colors.waterTop} opacity="0.6" />
				<path d={wavePath2} fill={colors.waterTransition} opacity="0.4" />
			</svg>
		</div>
	);
}
