"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSettings } from "@/providers/ThemeProvider";
import { STRAINS, STRAIN_KEYS } from "@/lib/strains";
import {
	GROWTH_RANGE,
	LENGTH_RANGE,
	SPORES_RANGE,
	COLONY_RANGE,
	REACH_RANGE,
	isDefaultSettings,
	type ThemeChoice,
} from "@/lib/settings";
import styles from "./CulturePanel.module.css";

const STEPS = 1000;

function niceRound(v: number): number {
	if (v < 1) return Math.round(v * 100) / 100;
	if (v < 10) return Math.round(v * 10) / 10;
	return Math.round(v);
}

// Log-scaled slider: 0.1x to 50x on a linear slider would leave the useful 0.5x to 5x in a sliver.
// With allowZero, the leftmost position means 0 (e.g. growth frozen).
function LogRange({
	label,
	value,
	low,
	max,
	allowZero = false,
	zeroText = "0",
	onChange,
}: {
	label: string;
	value: number;
	low: number;
	max: number;
	allowZero?: boolean;
	zeroText?: string;
	onChange: (v: number) => void;
}) {
	const span = Math.log(max / low);
	const toPos = (v: number) =>
		allowZero && v <= 0
			? 0
			: Math.round((Math.log(Math.max(v, low) / low) / span) * STEPS);
	const fromPos = (p: number) =>
		allowZero && p === 0 ? 0 : niceRound(low * Math.exp((p / STEPS) * span));
	const text = allowZero && value === 0 ? zeroText : `${value}×`;
	return (
		<label className={styles.row}>
			<span className={styles.label}>{label}</span>
			<input
				type="range"
				min={0}
				max={STEPS}
				step={1}
				value={toPos(value)}
				aria-valuetext={text}
				onChange={(e) => onChange(fromPos(e.currentTarget.valueAsNumber))}
			/>
			<span className={styles.value}>{text}</span>
		</label>
	);
}

const THEMES: Array<[ThemeChoice, string]> = [
	["system", "Auto"],
	["dark", "Dark"],
	["light", "Light"],
];

// A lil-gui style fold-out for the look and the living bits. Tucked into a corner on purpose.
export default function CulturePanel() {
	const { settings, update, reset, resolvedTheme } = useSettings();
	const [open, setOpen] = useState(false);
	const rootRef = useRef<HTMLDivElement>(null);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const panelId = useId();

	useEffect(() => {
		if (!open) return;
		const onKey = (e: KeyboardEvent) => {
			// An open image viewer owns Escape (and returns focus to its image).
			if (e.key !== "Escape" || document.querySelector("dialog[open]")) return;
			setOpen(false);
			triggerRef.current?.focus();
		};
		const onPointer = (e: PointerEvent) => {
			if (e.target instanceof Node && !rootRef.current?.contains(e.target))
				setOpen(false);
		};
		window.addEventListener("keydown", onKey);
		window.addEventListener("pointerdown", onPointer);
		return () => {
			window.removeEventListener("keydown", onKey);
			window.removeEventListener("pointerdown", onPointer);
		};
	}, [open]);

	return (
		<div ref={rootRef} className={styles.root}>
			{/* Trigger first in the DOM so Tab goes from it into the panel; CSS stacks the panel above it. */}
			<button
				ref={triggerRef}
				type="button"
				className={styles.trigger}
				aria-expanded={open}
				aria-controls={open ? panelId : undefined}
				aria-label={open ? "Close culture settings" : "Open culture settings"}
				onClick={() => setOpen((o) => !o)}
			>
				<span aria-hidden="true">✻</span>
			</button>
			{open && (
				<div
					id={panelId}
					className={styles.panel}
					role="group"
					aria-label="Culture settings"
				>
					<div className={styles.title}>
						<span>Culture</span>
						<button
							type="button"
							className={styles.close}
							onClick={() => {
								setOpen(false);
								triggerRef.current?.focus();
							}}
							aria-label="Close settings"
						>
							×
						</button>
					</div>

					<fieldset className={styles.row}>
						<legend className={styles.label}>
							<span className={styles.sr}>Strain: </span>
							{STRAINS[settings.strain].name}
						</legend>
						<div className={styles.swatches}>
							{STRAIN_KEYS.map((key) => {
								const t = STRAINS[key][resolvedTheme];
								return (
									<label
										key={key}
										className={styles.swatch}
										title={STRAINS[key].name}
										style={{ "--sbg": t.bg, "--sacc": t.accent }}
									>
										<input
											type="radio"
											name="culture-strain"
											value={key}
											checked={settings.strain === key}
											onChange={() => update({ strain: key })}
											aria-label={STRAINS[key].name}
										/>
										<span aria-hidden="true" />
									</label>
								);
							})}
						</div>
					</fieldset>

					<fieldset className={styles.row}>
						<legend className={styles.label}>Theme</legend>
						<div className={styles.segmented}>
							{THEMES.map(([value, label]) => (
								<label key={value}>
									<input
										type="radio"
										name="culture-theme"
										value={value}
										checked={settings.theme === value}
										onChange={() => update({ theme: value })}
									/>
									<span>{label}</span>
								</label>
							))}
						</div>
					</fieldset>

					<LogRange
						label="Speed"
						value={settings.growth}
						low={0.1}
						max={GROWTH_RANGE.max}
						allowZero
						zeroText="frozen"
						onChange={(growth) => update({ growth })}
					/>
					<LogRange
						label="Length"
						value={settings.length}
						low={LENGTH_RANGE.min}
						max={LENGTH_RANGE.max}
						onChange={(length) => update({ length })}
					/>

					<label className={styles.row}>
						<span className={styles.label}>Spores</span>
						<input
							type="range"
							min={SPORES_RANGE.min}
							max={SPORES_RANGE.max}
							step={SPORES_RANGE.step}
							value={settings.spores}
							onChange={(e) =>
								update({ spores: e.currentTarget.valueAsNumber })
							}
						/>
						<span className={styles.value}>
							{settings.spores === 0 ? "off" : `${settings.spores}×`}
						</span>
					</label>

					<label className={styles.row}>
						<span className={styles.label}>Colony</span>
						<input
							type="range"
							min={COLONY_RANGE.min}
							max={COLONY_RANGE.max}
							step={COLONY_RANGE.step}
							value={settings.colony}
							onChange={(e) =>
								update({ colony: e.currentTarget.valueAsNumber })
							}
						/>
						<span className={styles.value}>
							{settings.colony === 0 ? "off" : `${settings.colony}×`}
						</span>
					</label>
					<LogRange
						label="Reach"
						value={settings.reach}
						low={REACH_RANGE.min}
						max={REACH_RANGE.max}
						onChange={(reach) => update({ reach })}
					/>

					<label className={styles.row}>
						<span className={styles.label}>Cursor</span>
						<input
							type="checkbox"
							checked={settings.react}
							onChange={(e) => update({ react: e.currentTarget.checked })}
						/>
					</label>
					<label className={styles.row}>
						<span className={styles.label}>Pulses</span>
						<input
							type="checkbox"
							checked={settings.pulses}
							onChange={(e) => update({ pulses: e.currentTarget.checked })}
						/>
					</label>
					<label className={styles.row}>
						<span className={styles.label}>Glitches</span>
						<input
							type="checkbox"
							checked={settings.glitch}
							onChange={(e) => update({ glitch: e.currentTarget.checked })}
						/>
					</label>

					<div className={styles.footer}>
						<button
							type="button"
							className={styles.reset}
							onClick={reset}
							disabled={isDefaultSettings(settings)}
						>
							Reset
						</button>
						<span className={styles.note}>
							{isDefaultSettings(settings) ? "Defaults" : "Saved"}
						</span>
					</div>
				</div>
			)}
		</div>
	);
}
