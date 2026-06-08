"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./DevColorPanel.module.css";

const COLOR_GROUPS = [
	{
		label: "Sky",
		vars: ["--sky-top"],
	},
	{
		label: "Water Surface",
		vars: ["--water-top", "--water-transition", "--water-medium", "--water-bottom"],
	},
	{
		label: "Water Body",
		vars: ["--water-body-top", "--water-body-mid", "--water-body-deep"],
	},
	{
		label: "Effects",
		vars: ["--particle-color", "--ripple-color", "--light-ray-color"],
	},
	{
		label: "Text",
		vars: ["--text-primary", "--text-muted", "--toc-active"],
	},
	{
		label: "Sky Objects",
		vars: ["--cloud-color", "--moon-color", "--star-color"],
	},
];

function getCSSVar(name: string): string {
	return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

function setCSSVar(name: string, value: string) {
	document.documentElement.style.setProperty(name, value);
}

function rgbaToHex(rgba: string): string {
	if (rgba.startsWith("#")) return rgba.length === 4 || rgba.length === 7 ? rgba : rgba.slice(0, 7);
	const match = rgba.match(/[\d.]+/g);
	if (!match) return "#000000";
	const [r, g, b] = match.map((v, i) => (i < 3 ? Math.round(Number(v)) : Number(v)));
	return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}

function ColorRow({ varName, value, onChange }: { varName: string; value: string; onChange: (name: string, val: string) => void }) {
	const hexValue = rgbaToHex(value);
	const isRgba = value.startsWith("rgba");
	const label = varName.replace("--", "").replaceAll("-", " ");

	return (
		<div className={styles.row}>
			<label className={styles.label} title={varName}>{label}</label>
			<input
				type="color"
				value={hexValue}
				onChange={(e) => onChange(varName, e.target.value)}
				className={styles.colorInput}
			/>
			<input
				type="text"
				value={value}
				onChange={(e) => onChange(varName, e.target.value)}
				className={styles.textInput}
			/>
			{isRgba && <span className={styles.rgbaTag}>rgba</span>}
		</div>
	);
}

export default function DevColorPanel() {
	const [open, setOpen] = useState(false);
	const [colors, setColors] = useState<Record<string, string>>({});
	const [copied, setCopied] = useState(false);
	const panelRef = useRef<HTMLDivElement>(null);

	const readColors = useCallback(() => {
		const result: Record<string, string> = {};
		for (const group of COLOR_GROUPS) {
			for (const v of group.vars) {
				result[v] = getCSSVar(v);
			}
		}
		setColors(result);
	}, []);

	useEffect(() => {
		readColors();
	}, [readColors]);

	useEffect(() => {
		const handler = (e: KeyboardEvent) => {
			if (e.key === "F2") {
				setOpen((o) => !o);
				if (!open) readColors();
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [open, readColors]);

	const handleChange = (name: string, value: string) => {
		setCSSVar(name, value);
		setColors((prev) => ({ ...prev, [name]: value }));
	};

	const handleReset = () => {
		document.documentElement.style.cssText = "";
		readColors();
	};

	const handleCopy = () => {
		const lines = Object.entries(colors)
			.map(([k, v]) => `\t${k}: ${v};`)
			.join("\n");
		const css = `/* Paste into global-styles.css */\n${lines}`;
		navigator.clipboard.writeText(css);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	if (process.env.NODE_ENV !== "development") return null;

	return (
		<>
			{!open && (
				<button
					onClick={() => { setOpen(true); readColors(); }}
					className={styles.fab}
					title="Color Panel (F2)"
				>
					&#x1f3a8;
				</button>
			)}
			{open && (
				<div ref={panelRef} className={styles.panel}>
					<div className={styles.header}>
						<span className={styles.title}>Color Tuner</span>
						<div className={styles.headerActions}>
							<button onClick={handleReset} className={styles.actionBtn} title="Reset to CSS defaults">
								Reset
							</button>
							<button onClick={handleCopy} className={styles.actionBtn} title="Copy CSS variables">
								{copied ? "Copied" : "Copy CSS"}
							</button>
							<button onClick={() => setOpen(false)} className={styles.closeBtn}>
								&times;
							</button>
						</div>
					</div>
					<div className={styles.body}>
						{COLOR_GROUPS.map((group) => (
							<details key={group.label} open>
								<summary className={styles.groupLabel}>{group.label}</summary>
								{group.vars.map((v) => (
									<ColorRow
										key={v}
										varName={v}
										value={colors[v] || ""}
										onChange={handleChange}
									/>
								))}
							</details>
						))}
					</div>
				</div>
			)}
		</>
	);
}
