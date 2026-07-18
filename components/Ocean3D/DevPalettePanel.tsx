"use client";

import { useState, useCallback, type ChangeEvent, type CSSProperties } from "react";
import { DAY, NIGHT, type Palette } from "./palette";

const NUM_KEYS = new Set<keyof Palette>([
	"glowOpacity",
	"hemiIntensity",
	"dirIntensity",
	"starsOpacity",
	"starCount",
	"beaconIntensity",
	"glint",
	"cloudOpacity",
	"cloudCount",
]);

const NUM_MAX: Partial<Record<keyof Palette, number>> = {
	beaconIntensity: 60,
	hemiIntensity: 3,
	dirIntensity: 3,
	starCount: 1000,
	cloudOpacity: 1,
	cloudCount: 20,
};

function toHex(n: number): string {
	return "#" + n.toString(16).padStart(6, "0");
}

function fromHex(s: string): number {
	return parseInt(s.slice(1), 16);
}

interface Props {
	onReapply: () => void;
}

export function DevPalettePanel({ onReapply }: Props) {
	const [open, setOpen] = useState(false);
	const [tab, setTab] = useState<"night" | "day">("night");
	const [, bump] = useState(0);

	const palette = tab === "night" ? NIGHT : DAY;

	const set = useCallback(
		(key: keyof Palette, value: number) => {
			(palette as unknown as Record<string, number>)[key] = value;
			onReapply();
			bump((n) => n + 1);
		},
		[palette, onReapply],
	);

	const copy = useCallback(() => {
		const label = tab === "night" ? "NIGHT" : "DAY";
		const entries = (Object.keys(palette) as (keyof Palette)[]).map((k) => {
			const v = palette[k];
			if (NUM_KEYS.has(k)) return `\t${k}: ${v},`;
			return `\t${k}: 0x${v.toString(16).padStart(6, "0")},`;
		});
		navigator.clipboard.writeText(
			`export const ${label}: Palette = {\n${entries.join("\n")}\n};`,
		);
	}, [tab, palette]);

	if (process.env.NODE_ENV !== "development") return null;

	if (!open) {
		return (
			<button onClick={() => setOpen(true)} style={toggleBtn}>
				palette
			</button>
		);
	}

	const keys = Object.keys(palette) as (keyof Palette)[];

	return (
		<div style={panel}>
			<div style={header}>
				<div style={{ display: "flex", gap: 4 }}>
					{(["night", "day"] as const).map((t) => (
						<button
							key={t}
							onClick={() => setTab(t)}
							style={tab === t ? activeTab : tabBtn}
						>
							{t}
						</button>
					))}
				</div>
				<div style={{ display: "flex", gap: 4 }}>
					<button onClick={copy} style={tabBtn}>
						copy
					</button>
					<button onClick={() => setOpen(false)} style={tabBtn}>
						&times;
					</button>
				</div>
			</div>
			<div style={scrollArea}>
				{keys.map((k) => {
					const isNum = NUM_KEYS.has(k);
					const v = palette[k];
					return (
						<div key={k} style={row}>
							<label style={label}>{k}</label>
							{isNum ? (
								<input
									type="range"
									min={0}
									max={NUM_MAX[k] ?? 1}
									step={0.01}
									value={v}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										set(k, parseFloat(e.target.value))
									}
									style={{ flex: 1 }}
								/>
							) : (
								<input
									type="color"
									value={toHex(v)}
									onChange={(e: ChangeEvent<HTMLInputElement>) =>
										set(k, fromHex(e.target.value))
									}
								/>
							)}
							<span style={valueLabel}>
								{isNum ? v.toFixed(2) : toHex(v)}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
}

const toggleBtn: CSSProperties = {
	position: "fixed",
	bottom: 16,
	right: 16,
	zIndex: 99999,
	padding: "6px 10px",
	background: "#1a1a2e",
	color: "#aaa",
	border: "1px solid #333",
	borderRadius: 6,
	cursor: "pointer",
	fontSize: 11,
	fontFamily: "monospace",
};

const panel: CSSProperties = {
	position: "fixed",
	bottom: 16,
	right: 16,
	zIndex: 99999,
	width: 340,
	maxHeight: "80vh",
	background: "#111118ee",
	backdropFilter: "blur(12px)",
	border: "1px solid #333",
	borderRadius: 8,
	padding: 12,
	color: "#ccc",
	fontSize: 11,
	fontFamily: "monospace",
};

const header: CSSProperties = {
	display: "flex",
	justifyContent: "space-between",
	marginBottom: 8,
};

const tabBtn: CSSProperties = {
	padding: "3px 8px",
	background: "#222",
	color: "#aaa",
	border: "1px solid #444",
	borderRadius: 4,
	cursor: "pointer",
	fontSize: 11,
	fontFamily: "monospace",
};

const activeTab: CSSProperties = {
	...tabBtn,
	background: "#336",
	color: "#eee",
	borderColor: "#558",
};

const scrollArea: CSSProperties = {
	overflowY: "auto",
	maxHeight: "calc(80vh - 60px)",
};

const row: CSSProperties = {
	display: "flex",
	alignItems: "center",
	gap: 6,
	padding: "2px 0",
};

const label: CSSProperties = {
	fontSize: 10,
	minWidth: 105,
	color: "#999",
};

const valueLabel: CSSProperties = {
	fontSize: 9,
	minWidth: 62,
	textAlign: "right",
	color: "#666",
};
