"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useSettings } from "@/providers/ThemeProvider";
import { STRAINS, STRAIN_KEYS } from "@/lib/strains";
import { GROWTH_RANGE, SPORES_RANGE, isDefaultSettings, type ThemeChoice } from "@/lib/settings";
import styles from "./CulturePanel.module.css";

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
			if (e.key !== "Escape") return;
			setOpen(false);
			triggerRef.current?.focus();
		};
		const onPointer = (e: PointerEvent) => {
			if (e.target instanceof Node && !rootRef.current?.contains(e.target)) setOpen(false);
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
			{open && (
				<div id={panelId} className={styles.panel} role="group" aria-label="Culture settings">
					<div className={styles.title}>
						<span>Culture</span>
						<button type="button" className={styles.close} onClick={() => setOpen(false)} aria-label="Close settings">
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
									<label key={key} className={styles.swatch} title={STRAINS[key].name} style={{ "--sbg": t.bg, "--sacc": t.accent }}>
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
									<input type="radio" name="culture-theme" value={value} checked={settings.theme === value} onChange={() => update({ theme: value })} />
									<span>{label}</span>
								</label>
							))}
						</div>
					</fieldset>

					<label className={styles.row}>
						<span className={styles.label}>Growth</span>
						<input
							type="range"
							min={GROWTH_RANGE.min}
							max={GROWTH_RANGE.max}
							step={GROWTH_RANGE.step}
							value={settings.growth}
							onChange={(e) => update({ growth: e.currentTarget.valueAsNumber })}
						/>
						<span className={styles.value}>{settings.growth === 0 ? "frozen" : `${settings.growth}×`}</span>
					</label>

					<label className={styles.row}>
						<span className={styles.label}>Spores</span>
						<input
							type="range"
							min={SPORES_RANGE.min}
							max={SPORES_RANGE.max}
							step={SPORES_RANGE.step}
							value={settings.spores}
							onChange={(e) => update({ spores: e.currentTarget.valueAsNumber })}
						/>
						<span className={styles.value}>{settings.spores === 0 ? "off" : `${settings.spores}×`}</span>
					</label>

					<label className={styles.row}>
						<span className={styles.label}>Cursor</span>
						<input type="checkbox" checked={settings.react} onChange={(e) => update({ react: e.currentTarget.checked })} />
					</label>
					<label className={styles.row}>
						<span className={styles.label}>Pulses</span>
						<input type="checkbox" checked={settings.pulses} onChange={(e) => update({ pulses: e.currentTarget.checked })} />
					</label>
					<label className={styles.row}>
						<span className={styles.label}>Glitches</span>
						<input type="checkbox" checked={settings.glitch} onChange={(e) => update({ glitch: e.currentTarget.checked })} />
					</label>

					<div className={styles.footer}>
						<button type="button" className={styles.reset} onClick={reset} disabled={isDefaultSettings(settings)}>
							Reset
						</button>
						<span className={styles.note}>{isDefaultSettings(settings) ? "Defaults, no cookie" : "Saved in a cookie"}</span>
					</div>
				</div>
			)}
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
		</div>
	);
}
